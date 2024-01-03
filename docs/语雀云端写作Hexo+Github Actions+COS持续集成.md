---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2022-01-19 08:00:00'
type: Post
slug: roeayv
配置类型:
  type: string
  string: 文档
summary: 该文档介绍了如何使用语雀云端写作Hexo+Github Actions+COS进行持续集成，以及如何配置腾讯云函数和语雀webhook，最后介绍了一些常见问题及解决方案。
更新时间: '2023-08-26T15:22:00.000Z'
title: 语雀云端写作Hexo+Github Actions+COS持续集成
category: 技术分享
tags:
  - CI/CD
  - Hexo
status: Archived
urlname: 49a7c01d-86a0-4cf9-bb14-7a55a4651215
updated: '2023-08-26 23:22:00'
---

# 引言


在没有遇到[yuque-hexo](https://github.com/x-cold/yuque-hexo)之前，我博客是 Hexo+Github Pages 的部署方式：

- 本地配置 Hexo 源码
- 利用本地的 markdown 编辑器书写文章
- Hexo 部署到 Github Pages/Coding Pages 上

缺点也很明显：

- 本地编辑器鱼龙混杂，使用手感一言难尽
- 代码存储在本地不方便
- GitHub Pages 国内访问速度令人堪忧（有段时间我还双重部署在了 Coding Pages 上，但是太不稳定了）

本地的编辑器我是挑了又挑，总算找到一个手感还不错的[Typora](https://typora.io/)，但还是限于本地编辑的局限性和不方便，就懒的在本地写博客了。 在试用了语雀之后，发现语雀的编辑器太好用了，功能齐全，速度也快。后来我就一直在语雀上记录各种文章，但是并没有同步到博客。所在公司团队也用语雀来记录各种技术方案等文档。就这样我的博客几乎停更了一年。


---


直到我遇到了[yuque-hexo](https://github.com/x-cold/yuque-hexo)，突然就引起了我的兴趣。结合推荐的最佳实践文章，我没日没夜搞了好几天，终于搭建好了我的[新博客](https://1874.cool/)。


# 开始


我的新博客是基于


> Hexo + 语雀 + yuque-hexo + web hook + severless + Github Actions


托管平台我选择的是


> 腾讯云的 COS 静态网站+自定义 CDN 加速


至于为什么选择腾讯云 COS，是因为我的云服务器、域名、图床都使用的腾讯云的服务。再加上 COS 静态网站+CDN 加速的极致体验，让我心动了。而且我这个战五渣的个人博客的访问量对于收费的 COS 来说，也没多钱，就先做个试验吧，万一哪天~~博客火了~~（没钱了），再换也不迟。


# 部署流程


![FvjX9uckFsBD3DDgkfoo-IZ3b8yJ.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/3cb06aef46a3297949388b2ed38c195e.png)


> PS：在Github Actions 持续集成 Docker 构建并部署 Node 项目到云服务器中，我已经将调用云函数改为调我自己的 node 项目了，再由 node 服务调用 github actions


# 初始化 Hexo


首先需要在本地初始化 hexo 仓库


```shell
npx hexo-cli init blog
```


> npx 可以在不全局安装依赖情况下使用 hexo-cli 的命令


初始化 hexo 成功后可以安装你喜欢的主题等配置，这里不作赘述。


# 安装 yuque-hexo 插件


官方文档：[yuque-hexo](https://github.com/x-cold/yuque-hexo)


## 安装依赖


```shell
npm i yuque-hexo
```


## 配置语雀

1. 访问[工作台](https://www.yuque.com/dashboard)=>账户设置=Token=>新建 token 并配置好权限。**Access Token 即为 YUQUE_TOKEN**

![FiMisZ8z0CXkE_JhM4M3HYtVKH8Z.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/cfd8b88a1fd46b857633a64c13b61e09.png)

1. 访问[工作台](https://www.yuque.com/dashboard)=>账户设置=>账户设置=>个人路径，设置语雀的简易的个人路径（建议），**拿到个人路径。**

![FqEnqU_PHRB_3vaMUYJP2hjyTXfN.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/a7b65320154318445c79ad5b42d81445.png)

1. 新建一个放置博客的知识库（可见范围为互联网可见）
2. 进入博客知识库，设置博客知识库的路径（建议），**拿到知识库的路径**。

![FmlvxdkN3QSn1fj3FDrQr6tDfi5r.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/5511977a39d9cc8713c33c48027c95ae.png)


![Fm5RGoda0mSPPczTrWRFxT4L16DS.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/08ef98d2dacf146a7f8388a1acc03713.png)


## 配置 hexo


拿到上述的语雀个人路径和知识库路径，进行 hexo 的配置。


> package.json


```json
{
  "scripts": {
    "hexo:build": "hexo generate",
    "hexo:clean": "hexo clean",
    "deploy": "hexo deploy",
    "server": "hexo server",
    "hexo": "npm run hexo:clean && npm run hexo:build && npm run server",
    "yuque:clean": "yuque-hexo clean",
    "yuque:sync": "yuque-hexo sync",
    "yuque": "npm run yuque:clean && npm run yuque:sync"
  },
  "yuqueConfig": {
    "postPath": "source/_posts",
    "baseUrl": "https://www.yuque.com/api/v2",
    "login": "语雀个人路径",
    "repo": "知识库路径",
    "onlyPublished": true,
    "onlyPublic": true
  }
}
```


# 配置腾讯云 COS


当我们开始时我们需要做如下准备：

- 域名 （需要备案，不备案可临时使用 COS 提供的临时域名）
- 腾讯云账号 开通 COS 服务（建议使用 V5 版本 COS 控制台，如为 V4 版本可提交工单让后台升级为 V5 版本）

参考资料：[一键部署 hexo 博客到腾讯云 COS 对象存储](https://werty.cn/2019/06/hexo/%E4%B8%80%E9%94%AE%E9%83%A8%E7%BD%B2hexo%E5%8D%9A%E5%AE%A2%E5%88%B0%E8%85%BE%E8%AE%AF%E4%BA%91COS%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8/)


## 开启静态网站


访问 [腾讯云对象存储控制台](https://console.cloud.tencent.com/cos/bucket)=>基础配置=>静态网站， **开启静态网站功能。**


![FikwiN4n7oezapO3LJA6XYK6dZOQ.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/56ac7ee447cff62b85190fe20d691713.png)


## 配置自定义 CDN 加速域名


访问 [腾讯云对象存储控制台](https://console.cloud.tencent.com/cos/bucket)=>域名与传输管理=>自定义 CDN 加速域名，**配置自定义加速域名**


![Fl2amqnJo65UKTDg7ozmsg5amAeH.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/a2431def2874cda8a9aabeff00a28b7e.png)


## 解析域名


访问[我的域名管理](https://console.cloud.tencent.com/cns)=>添加域名解析记录=>让域名指向上面的 CNAM 域名


![FiZKKLW8VFjLpUY4DPvvCdh-kePL.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/3729ad019e2cbb05dac46daa2c5211c2.png)


## 获取配置参数


首先我们需要在腾讯云控制台获取下列所需的配置参数：


| 名称        | 描述                     |
| --------- | ---------------------- |
| SecretId  | 开发者拥有的项目身份识别 ID，用以身份认证 |
| SecretKey | 开发者拥有的项目身份密钥           |
| Bucket    | COS 中用于存储数据的容器名称       |
| Region    | Bucket 所在的地域信息。        |


### 获取 SecretId 和 SecretKey


进入[访问管理](https://console.cloud.tencent.com/cam/overview)=>[密钥管理](https://console.cloud.tencent.com/cam/capi)=>【新增密钥】=>**获取 SecretId 和 SecretKey**


> 这里建议可以新增子用户，并设置权限，获取子用户的密钥，这里不作赘述。


![FhvBmhn85j6XZG2H1SeRFFfH4v21.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/f4a6988b43b52f23ce5e971286900426.png)


### 获取 bucket 和 region


访问[腾讯云对象存储控制台](https://console.cloud.tencent.com/cos/bucket)=>基本信息，**获取存储桶名称和所属地域**


### 


![FlY6trvKTOwRUZBKjO1N5Zs8K6N1.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/579750b112ac5eb7b2ce6f6654c95188.png)


# 配置 Github Actions


首先我们需要在 github 新建一个私有博客仓库（以下简称**博客仓库**），用于存放 hexo 源码，并与本地的 hexo 做关联。 所需的配置参数：


| 名称          | 描述                 |
| ----------- | ------------------ |
| SECRET_ID   | 腾讯云的 SecretId      |
| SECRET_KEY  | 腾讯云的 SecretKey     |
| YUQUE_TOKEN | 语雀的 Access Token   |
| BUCKET      | 腾讯云 COS 静态网站的存储桶名称 |
| REGION      | 腾讯云 COS 静态网站的地域名称  |


## 配置 Github


### 获取 Github 访问 Token


访问[GIthub Token 配置](https://github.com/settings/tokens/)=>Generate new token=>勾选必要的参数，生成 token


> 注意下：这个 Token 只会出现一次，最好复制出来使用，如果忘记了，只能重新生成一个


![FussD8LZRmLdE4Bf7syjdq7j1Sps.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/6f2bbd1b8052f6d243696cdc825f04ae.png)


> Github Token 用途：

	- 用来在流水线工作时，上传语雀文章到博客仓库。
	- 下文中需要用到这个 token 外部调用 Github Actions

### 配置仓库 Actions secrets


进入博客仓库的设置，配置 `secrets`。把之前获取的腾讯云的`SECRET_ID` 和 `SECRET_KEY`和语雀的`YUQUE_TOKEN`配置到这里。


![Fj3i2PVipW8AfTyzzJ8bW_voyFtR.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/4823a0f718f6d3c0124e952e8dbf3b48.png)


> SECRET_ID、SECRET_KEY、BUCKET、REGION 用于上传静态网站文件到 COS YUQUE_TOKEN 用于拉取语雀的文章 GITHUB_TOKEN 不用配置，可以在 Github Actions 中直接获取


## 配置博客仓库


在根目录新增`.github/workflows/main.yaml`文件 这里直接上代码：


```yaml
name: Deplo To COS

on:
	# 本地测试时可以开启，部署后不建议开启，因为会涉及到更改一些配置，会多次频繁触发构建
	# 允许手动push触发
  # push:
  #    branches:
  #      - master
  # 允许外部仓库事件触发
  repository_dispatch:
    types:
    	# 这里的值需要和下文的云函数的event_type保持一致
      - start

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: 检查分支
        uses: actions/checkout@master

      - name: 安装node环境
        uses: actions/setup-node@master
        with:
          node-version: "12.x"

      - name: 缓存依赖
        uses: actions/cache@v1
        id: cache
        with:
          path: node_modules
          key: ${{runner.OS}}-${{hashFiles('**/package-lock.json')}}

      - name: 安装依赖
        if: steps.cache.outputs.cache-hit != 'true'
        run: |
          export TZ='Asia/Shanghai'
          npm install

      - name: 安装COS相关依赖
        run: |
          sudo pip install coscmd
          sudo pip install tccli

      - name: 配置COS
        env:
          SECRET_ID: ${{ secrets.SECRET_ID }}
          SECRET_KEY: ${{ secrets.SECRET_KEY }}
          BUCKET: ${{ secrets.BUCKET }}
          REGION: ${{ secrets.REGION }}
        run: |
          coscmd config -a $SECRET_ID -s $SECRET_KEY -b $BUCKET -r $REGION
          tccli configure set secretId $SECRET_ID
          tccli configure set secretKey $SECRET_KEY
          tccli configure set region $REGION

      - name: 拉取语雀的文章
        env:
          YUQUE_TOKEN: ${{ secrets.YUQUE_TOKEN }}
        run: |
          npm run yuque:clean
          npm run yuque:sync

      - name: 配置Git用户名邮箱
        run: |
          git config --global user.name "1874"
          git config --global user.email "1225751694@qq.com"

      - name: 提交yuque拉取的文章到GitHub仓库
        run: |
          echo `date +"%Y-%m-%d %H:%M:%S"` begin > time.txt
          git add .
          git commit -m "Refresh yuque json" -a

      - name: 推送文章到仓库
        uses: ad-m/github-push-action@master
        with:
        	# GITHUB_TOKEN不用配置在secrets
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: 生成静态文件
        run: |
          npm run hexo:clean
          npm run hexo:build

      - name: 上传文章到cos并刷新CDN
        run: |
          coscmd upload -rfs --delete ./public/ /
          tccli cdn PurgePathCache --cli-unfold-argument --Paths https://1874.cool/ --FlushType flush
```


# 配置腾讯云函数


> PS：在Github Actions 持续集成 Docker 构建并部署 Node 项目到云服务器中，我已经将调用云函数改为调我自己的 node 项目了，因为腾讯云函数现在（2022-07-16）好贵了！

1. 访问[云数控制台](https://console.cloud.tencent.com/scf)=>新建云函数
2. 模版选择从头开始，函数类型选择事件函数，运行环境选择 python2.7
3. 在线编写函数代码

```python
# -*- coding: utf8 -*- 
import requests 
def main_handler(event, context):
    r = requests.post("https://api.github.com/repos/LetTTGACO/1874/dispatches",
    json = {"event_type": "start"},
    headers = {"User-Agent":'curl/7.52.1',
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github.everest-preview+json',
              'Authorization': 'token Github访问token'})
    if r.status_code == 204:
        return "This's OK!"
    else: 
        return r.status_code
```


> event_type 说明 event_type 值需要和 Github Actions 中配置的 repository_dispatch 的 types 值保持一致 Authorization 说明 Authorization 值为 字符串 “token + Github 访问 token”，不要忘了加 token

1. 触发期配置=>自定义创建=>配置如下图所示

![Fv6EtiOMRj1v9_23wK-di7YAsKfT.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/2bfc0a24dc9ea3d9e25b173be7d11099.png)

1. 部署完成后进入触发管理，最下面就是云函数地址

![FkhVJCWmBWFVsqWAW3uVCw5vVuDq.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/189a22841e80f5c4022a7f7d39ab4dfa.png)


# 配置语雀 webhook


访问博客知识库=>设置=>消息推送，选择其他渠道，设置机器人名称和上文获取到的云函数地址，选择触发条件


![Fr_bBB8LiuuO4bZ-xPbS1rpXD1ir.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/bfbd501c8c869b3b936522e9b73365f4.png)


> 发布文档和更新文档，需要选择文档有较大更新，推送给关注者，才会触发 webhook。 但是经过我的测试，一旦某一篇文章选择文档有较大更新，推送给关注者。后续的更新，不管选没选文档有较大更新，推送给关注者，都会触发 webhook。如果因为部署频繁导致出错的话，建议选择评审阶段触发。也可以每次通过测试按钮手动触发。


# Done！发布文章


无论是发布新文章还是更新删除等等操作，只要选择文档有较大更新，推送给关注者即可自动触发。


![Fg0QmVZZQc9nRAGKw9fdIzw4uMsH.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/ce82beee45ee7aa4584d2b7023d9b588.png)


# 常见问题


## 语雀图片显示异常（防盗链）的解决办法


由于语雀的图片由有防盗链的限制，会导致部署后，博客网站显示图片异常。 处理办法有两种：

1. 在语雀上使用图片的时候，避开直接复制图片到语雀。先将图片上传到自己的图床后，直接使用 markdown 的图片语法：`![](https://xxxx.com/a.jpg)`插入图片到适当位置，例如：

![FioacWCiuPFjNteg-vR3cLc1WLxS.png](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/42fd8e5e9ac69dcc69c64612d1989028.png)

1. 为了不破坏语雀编辑器的体验，我修改了 yuque-hexo 的源代码，发布了[yuqe-hexo-with-cdn](https://github.com/LetTTGACO/yuque-hexo-with-cdn)插件。适配了将语雀中的图片上传到腾讯云 COS 图床后，将原有的语雀图片链接替换掉。

## yuqe-hexo-with-cdn 插件


替换依赖[yuque-hexo](https://github.com/x-cold/yuque-hexo)为[yuqe-hexo-with-cdn](https://github.com/LetTTGACO/yuque-hexo-with-cdn)


```shell
npm i yuqe-hexo-with-cdn
```


> 目前 x-code 已经将我的方案合并到主分支了，可以直接使用yuque-hexo进行配置


修改博客仓库的 package.json


```json
{
  "scripts": {
    "hexo:build": "hexo generate",
    "hexo:clean": "hexo clean",
    "deploy": "hexo deploy",
    "server": "hexo server",
    "hexo": "npm run hexo:clean && npm run hexo:build && npm run server",
    "yuque:clean": "yuque-hexo clean",
    "yuque:sync": "yuque-hexo sync",
    "yuque": "npm run yuque:clean && npm run yuque:sync"
  },
  "yuqueConfig": {
    "postPath": "source/_posts",
    "baseUrl": "https://www.yuque.com/api/v2",
    "login": "语雀个人路径",
    "repo": "知识库路径",
    "onlyPublished": true,
    "onlyPublic": true,
    "imgCdn": {
      "enabled": true,
      "bucket": "COS存储桶名称",
      "region": "COS地域名称",
      "prefixKey": "blog-images"
    }
  }
}
```


imgCdn 语雀图片转腾讯云 COS 图床配置说明 注意：开启后会将匹配到的所有的图片都上传到 COS


| **参数名**   | **含义**                | **默认值** |
| --------- | --------------------- | ------- |
| enabled   | 是否开启                  | false   |
| bucket    | 腾讯 COS 的 bucket 名称    | -       |
| region    | 腾讯 COS 的 region(地域名称) | -       |
| prefixKey | 文件前缀                  | -       |


> prefixKey 说明： 如果需要将图片上传到 COS 的根目录，那么 prefixKey 不用配置。 如果想上传到指定目录 blog/image 下，则需要配置 prefixKey 为“prefixKey”: “blog/image”。 目录名前后都不需要加斜杠


**上传到 COS 图床也是需要腾讯云的**[**SECRET_ID 和 SECRET_KEY**](about:blank#GCUe2)**作为环境变量注入的，但在之前的流程中，我们已经在博客仓库的 secrets 注入了，所以这里就不需要再额外注入了。** **插件更多详情介绍请移步：**[yuqe-hexo-with-cdn](https://github.com/LetTTGACO/yuque-hexo-with-cdn)

