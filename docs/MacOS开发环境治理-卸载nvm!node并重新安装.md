---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2022-04-22 00:00:00'
type: Post
slug: is8lw3
配置类型:
  type: string
  string: 文档
summary: 本文介绍了如何在MacOS上卸载nvm/node并重新安装。包括卸载nvm、node、yarn、npm的步骤，以及安装node和nvm的过程。同时，还提供了解决node地址问题的两种方法。
更新时间: '2023-08-26T14:42:00.000Z'
title: MacOS开发环境治理-卸载nvm/node并重新安装
category: 技术分享
tags:
  - Node
status: Archived
urlname: 9a588e82-f423-4887-a07b-159f06e02b09
updated: '2023-08-26 22:42:00'
---

# 引言


最近在调试开发环境的时候，`node`环境各种问题，索性全部重新安装一次，这里记录下整个安装过程。


# 卸载


## 卸载 nvm


当我们直接在终端输入`nvm`时，提示告诉我们，当卸载`nvm`时还需要取环境变量中将相关的变量全部删除才行。


![FlfNndBLq_OVgSi11jH36W2r-n-3.png](https://image.1874.cool/1874-blog-images/f3b685f1bb03a9df46d76bbebf700d61.png)

1. 删除`～/.nvm`文件夹

```shell
rm -rf ~/.nvm
```

1. 如果有以下文件，依次用文本编辑器打开，并删除其中的 nvm 相关的变量
- `~/.profile`
- `~/.bash_profile`
- `~/.zshrc`
- `~/.bashrc`

![FnEHSYHDcKow3IZtIdWH7hrFdVQy.png](https://image.1874.cool/1874-blog-images/a683f3719c53406f369a90c663545f7b.png)


## 卸载 node、yarn、npm


检查以下目录，将`node`、`yarn`、`npm`相关的文件和文件夹全部删除

- `~/`
- `/usr/local/bin`

# 安装


## 安装 node（可选）


由于项目中经常会使用`git hooks`来规范代码，而其脚本指定的node地址一般指向的是`/usr/local/bin/node`，如果你使用`nvm`管理`node`版本的话，node地址一般是`/Users/xxx/.nvm/versions/node/v12.22.12/bin/node`，所以在运行时可能会报错`node command not found`。而我自己用的是`WebStorm`，就有这个问题。


![FrqJL1Fp9eHIZXC8eNYbEkrnPtZt.png](https://image.1874.cool/1874-blog-images/a47279c188b1c3544bc1f50dbb5fd6ae.png)


解决办法有两种：

1. 建立软链接，将`nvm`中的`node`指向`/usr/local/bin/node`，相当于创建了一个快捷方式。

```shell
ln -s /Users/fangpengfei/.nvm/versions/node/v12.22.12/bin/node /usr/local/bin/node
```


> 但是这种建立软链方式可能会有个问题：用户对`/usr/local/bin`文件夹的访问权限不够（即使使用了`sudo`），这就是另一个问题了，可以谷歌一下，这里不再赘述。

1. **先从官网安装包安装**`node`**（推荐）**

因为安装包会直接将`node`安装在`/usr/local/bin/node`中，这样系统也有了一份`node`。值得注意的是，这里我还建议可以在未安装`nvm`前，先全局安装`yarn`和`pnpm`（需要的话），这样后面也不需要将`nvm`中的`yarn`软链到`/usr/local/bin/yarn`上。


## 安装 nvm


当然你也可以直接安装`nvm`，利用`nvm`管理`node`版本，后续如果出现上述问题，再用软链方式解决就行。 进入`nvm`的[github](https://github.com/nvm-sh/nvm#install--update-script=)官网，用`curl`安装`nvm`


```shell
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```


利用`nvm`安装`node`，这里我从官网安装的`node`版本是`v16.14.2`，所以`nvm`我再装一个`v12`版本的，并且设置为`default`版本以应对大部分项目的`node`版本要求。


```shell
nvm install 12nvm alias default 12
```


![FuB-VClzE71G3G6Nr7YA7qRZgY1e.png](https://image.1874.cool/1874-blog-images/f74dda6a71eb42dfd97fba91e2808e1c.png)


# 大功告成！

