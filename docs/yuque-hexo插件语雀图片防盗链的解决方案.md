---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2022-01-20"
type: Post
slug: osar7h
配置类型:
  type: string
  string: 文档
summary: 本文介绍了yuque-hexo插件语雀图片防盗链的解决方案，包括具体的实现流程和常见问题的解决方案。同时，提供了对于其他云服务的实现思路。
更新时间: "2023-09-27T01:49:00.000Z"
title: yuque-hexo插件语雀图片防盗链的解决方案
category: 技术分享
tags:
  - Hexo
status: Invisible
urlname: 003fd62e-3f11-47f8-8479-9eb728ac6df8
updated: "2023-09-27 01:49:00"
---

# 推荐

我目前已经不参与[yuque-hexo](https://github.com/x-cold/yuque-hexo)库维护了。推荐使用我自己开发的 Elog——开放式跨平台博客解决方案。无论是从头搭建自己的博客还是备份线上博客，Elog 都是一个不错的选择。而且支持不开语雀会员也能导出 md 文档，同时也支持 Notion、FlowUs 写作平台。

Github 地址：[https://github.com/LetTTGACO/elog](https://github.com/LetTTGACO/elog)
Elog 使用文档：[https://elog.1874.cool](https://elog.1874.cool/)

# 引言

在使用[yuque-hexo](https://github.com/x-cold/yuque-hexo)同步文章到博客后，由于语雀的图片由有防盗链的限制，会导致部署后，博客网站显示图片异常。 处理办法有两种：

1. 在语雀上使用图片的时候，避开直接复制图片到语雀。先将图片上传到自己的图床后，直接使用`markdown`的图片语法：`![](https://xxxx.com/a.jpg)`插入图片到适当位置，例如：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/42fd8e5e9ac69dcc69c64612d1989028.png)

1. 为了不破坏语雀编辑器的体验，我修改了`yuque-hexo`的源代码，发布了`yuqe-hexo-with-cdn`插件。适配了将语雀中的图片上传到腾讯云 COS 图床后，将原有的语雀图片链接替换掉。

# yuqe-hexo-with-cdn 插件

使用文档说明：[yuqe-hexo-with-cdn](https://github.com/LetTTGACO/yuque-hexo-with-cdn)

> 目前 x-code 已经将我的方案合并到主分支了，可以直接使用[yuque-hexo](https://github.com/x-cold/yuque-hexo)进行配置

## 改造思路

### 原 yuque-hexo 生成.md 文章简易流程

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/e6c59f934fc87c95ba64d0b36eb6f672.png)

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/a44a57d7ea9c758bbc7811a07bf8b9a0.jpeg)

### yuqe-hexo-with-cdn 改造思路

整体思路主要是在生成`yuque.json`之前进行语雀图片的替换

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/5c552afe4a4c9ba3f2a68be4af1964a5.png)

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/995529319a86d7cc140f307575b24c85.jpeg)

具体实现流程

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/ce437ae89137204ee9982390251c25a1.png)

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/645fc1e5e1dd7cdd37a2d2b25fd0c9ad.jpeg)

## 具体实现

```javascript
// mock数据格式作为参考
const article = {
  title: "博客标题",
  body: "图片1：![image.png](https://dfas.qqc/test1.png#a=1) 图片2:![image.png](https://dfas.qqc/test2.png#a=1)",
};

// 获取语雀的图片链接的正则表达式，返回匹配到的多条记录
const imageUrlRegExp = /!\[(.*?)]\((.*?)\)/gm;

async function img2Cos(article) {
  // 1. 从文章中获取语雀的图片URL列表
  const matchYuqueImgUrlList = article.body.match(imageUrlRegExp);
  // matchYuqueImgUrlList: ["![image.png](https://dfas.qqc/test1.png#a=1)", "![image.png](https://dfas.qqc/test2.png#a=1)"]

  // 如果没有匹配到，说明该文章不存在图片
  if (!matchYuqueImgUrlList) return article;

  // 循环列表进行处理
  const promiseList = matchYuqueImgUrlList.map(async (matchYuqueImgUrl) => {
    // 获取真正的图片url
    const yuqueImgUrl = getImgUrl(matchYuqueImgUrl);
    // yuqueImgUrl: https://dfas.qqc/test1.png#a=1

    // 2.将图片转成buffer文件
    const imgBuffer = await img2Buffer(yuqueImgUrl);

    // 如果解析错误，说明图片有问题，直接跳过后续步骤
    if (!imgBuffer) {
      return {
        originalUrl: matchYuqueImgUrl,
        yuqueRealImgUrl: yuqueImgUrl,
        url: yuqueImgUrl,
      };
    }
    // 3. 根据buffer文件生成唯一的hash文件名
    const fileName = await getFileName(imgBuffer, yuqueImgUrl);
    // fileName: abcdefg-tudnamdana.png

    try {
      // 4. 检查图床中是否存在该文件
      let url = await hasObject(fileName);
      // 存在：url: 腾讯云图床链接
      // 不存在 url: ''

      // 5. 如果图床已经存在，直接替换
      // 		如果图床不存在，则先上传到图床，再将原本的语雀url进行替换
      if (!url) {
        url = await uploadImg(imgBuffer, fileName);
        // url: 腾讯云图床链接
      }
      return {
        // 原始的语雀图片：originalUrl: ![image.png](https://dfas.qqc/test1.png#a=1)
        originalUrl: matchYuqueImgUrl,
        // 真正的语雀图片：yuqueRealImgUrl: https://dfas.qqc/test1.png
        yuqueRealImgUrl: yuqueImgUrl,
        // 图床中的图片：url: 腾讯云图床链接
        url,
      };
    } catch (e) {
      out.error(`访问COS出错，请检查配置: ${e}`);
      process.exit(-1);
    }
  });

  // 得到图片对象数组
  const urlList = await Promise.all(promiseList);
  // [
  //   {
  //     originalUrl: "![image.png](https://dfas.qqc/test1.png#a=1)",
  //     yuqueRealImgUrl: "https://dfas.qqc/test1.png",
  //     url: "腾讯云图床链接1"
  //   },
  //   {
  //     originalUrl: "![image.png](https://dfas.qqc/test2.png#a=1)",
  //     yuqueRealImgUrl: "https://dfas.qqc/test2.png",
  //     url: "腾讯云图床链接2"
  //   }
  // ]

  // 6. 将语雀图片链接进行替换
  urlList.forEach(function (url) {
    if (url) {
      article.body = article.body.replace(
        url.originalUrl,
        `![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/4a379d55dc2394e92fa8944b3bb35126.url})`
      );
      out.info(`replace ${url.yuqueRealImgUrl} to ${url.url}`);
    }
  });

  // 7. 返回新的文章对象
  return article;
  // article: {
  //   title: '博客标题',
  //   body: '图片1：![](腾讯云图床链接1) 图片2:![](腾讯云图床链接2)'
  // }
}

// 工具类

// 从markdown格式的url中获取url
function getImgUrl(markdownImgUrl) {
  const _temp = markdownImgUrl.replace(/\!\[(.*?)]\(/, "");
  const _temp_index = _temp.indexOf(")");
  // 得到真正的语雀的url
  return _temp.substring(0, _temp_index).split("#")[0];
}

// 将图片转成buffer
// 这里用到了superagent库进行转换
async function img2Buffer(yuqueImgUrl) {
  return await new Promise(async function (resolve) {
    try {
      await superagent
        .get(yuqueImgUrl)
        .buffer(true)
        .parse((res) => {
          const buffer = [];
          res.on("data", (chunk) => {
            buffer.push(chunk);
          });
          res.on("end", () => {
            const data = Buffer.concat(buffer);
            resolve(data);
          });
        });
    } catch (e) {
      // 非法图片返回null
      out.warn(`invalid img: ${yuqueImgUrl}`);
      resolve(null);
    }
  });
}

// 根据文件内容获取唯一文件名称
// 这里用到了开源的七牛云的算法，详情：https://juejin.cn/post/6844903775660933133
async function getFileName(imgBuffer, yuqueImgUrl) {
  return new Promise((resolve) => {
    getEtag(imgBuffer, (hash) => {
      const imgName = hash;
      // 获取文件名后缀
      const imgSuffix = yuqueImgUrl.substring(yuqueImgUrl.lastIndexOf("."));
      // 拼接文件名
      const fileName = `${imgName}${imgSuffix}`;
      // 返回文件名
      resolve(fileName);
    });
  });
}

// 检查COS是否已经存在图片，存在则返回url
async function hasObject(fileName) {
  // prefixKey: blog-image

  if (!bucket.length || !region.length) {
    out.error("请检查COS配置");
    process.exit(-1);
  }
  return new Promise((resolve) => {
    cos.headObject(
      {
        Bucket: bucket, // 存储桶名字（必须）
        Region: region, // 存储桶所在地域，必须字段
        Key: `${prefixKey}/${fileName}`, //  文件名  必须
      },
      function (err, data) {
        if (data) {
          // 拼接腾讯云图床的图片URL
          const url = `https://${bucket}.cos.${region}.myqcloud.com/${prefixKey}/${fileName}`;
          resolve(url);
        } else {
          // 不存在返回空
          resolve("");
        }
      }
    );
  });
}

// 上传图片到COS
async function uploadImg(imgBuffer, fileName) {
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: bucket, // 存储桶名字（必须）
        Region: region, // 存储桶所在地域，必须字段
        Key: `${prefixKey}/${fileName}`, //  文件名  必须
        StorageClass: "STANDARD", // 上传模式（标准模式）
        Body: imgBuffer, // 上传文件对象
      },
      function (err, data) {
        if (data) {
          // 返回图片链接
          resolve(`https://${data.Location}`);
        }
        if (err) {
          reject(err);
        }
      }
    );
  });
}
```

# 常见问题

## 语雀的流程图/文本绘图等不适配

语雀的流程图/文本绘图等无法生成 markdown 展示，所以我的做法是，在语雀编辑器书写的时候，先编写流程图，写好了再截图，作为图片放在流程图的前面。这样生成的 md 文件就只有图片被解析出来了。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/7ea4e9236756e29954235e222b5aa926.png)

## 特殊情况下需要使用 markdown 语法的图片链接示例

因为该插件会将匹配到的所有 markdown 语法的图片都上传到图床（包括代码块中的示例），所以在书写语雀文章时，非特殊情况不要使用该语法。或者在书写的时候，将链接非法化即可，例如：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/18c7d7272ddf198da33571273ee79d90.png)

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/4c42ca079c01f6855ca09fae4d3bd3d5.png)

插件在处理的过程中会检测出来非法链接，就不会上传该图片了

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/0e86292f5c8c58ff5fd77a036ed9fe0a.png)

# 关于

如果你不想用腾讯云 COS 图床，你也可以按照这个思路，将 COS 相关的配置进行改造，上传到你自己的图床！
