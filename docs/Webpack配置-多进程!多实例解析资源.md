---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2021-02-06 00:00:00'
type: Post
slug: kolyq9
配置类型:
  type: string
  string: 文档
summary: 本文介绍了在Webpack中使用多进程/多实例解析资源的方法，以及优化Webpack性能的两种方法：在Webpack4中使用hard-source-webpack-plugin插件，在Webpack5中使用cache选项。本文还提到了使用hard-source-webpack-plugin插件的注意事项。
更新时间: '2023-08-26T14:42:00.000Z'
title: Webpack配置-多进程/多实例解析资源
category: 技术分享
tags:
  - Webpack
status: Archived
urlname: ed1e7737-88f0-4197-8f29-47ceb92792f0
updated: '2023-08-26 22:42:00'
---

# 引言


年末了，趁着项目排期相对空闲，抽空阅读[吴浩麟](https://github.com/gwuhaolin)老师的[《深入浅出 Webpack》](https://webpack.wuhaolin.cn/)这本书，准备搞一搞 webpack 中的点点滴滴，出一个 webpack 优化专题。刚好最近在想着做一个适合团队内部的前端中后台脚手架，来学习学习嘿嘿。


# 配置


## 在 webpack4.0 中使用 hard-source-webpack-plugin


```shell
npm install hard-source-webpack-plugin -D
```


```javascript
// webpack.config.js
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
  entry: // ...
  output: // ...
  plugins: [
    new HardSourceWebpackPlugin()
  ]
}
```


具体配置可以参考官方文档[hard-source-webpack-plugin](https://github.com/mzgoddard/hard-source-webpack-plugin)


## 在 webpack5.0 中使用 cache 选项


在 webpack5.0 中，此插件的实现已内置到 cache 选项中，所以不能在 5.0 版本中使用，会报错！！


![FoiMFr2CMDshCw_MGF4WeqIKUYQA.png](https://image.1874.cool/1874-blog-images/d49d1664919b5a8b2e253fa45f3c4f85.png)


因为在 webpack5.0，这个依赖被删除了！


![FmDnTPy5j_FwsIp5D0jp-34_JaJm.png](https://image.1874.cool/1874-blog-images/e15ff7e0e45dcf166b3f5b2ebe693ab2.png)


我在[issue](https://github.com/mzgoddard/hard-source-webpack-plugin/issues/514)中找到了可以使用 cache 选项来配置。


![FpZWmwu0ixR5JgawCmB6DeAn_3f-.png](https://image.1874.cool/1874-blog-images/a3f53511c52cf99749f2e7f59edf06cc.png)


使用说明：


![FvUqfwsno_MaITg4zneUPJyBrysU.png](https://image.1874.cool/1874-blog-images/3ea44839c2149ff498d7f7fb71470481.png)


具体配置文档请参考[webpack5.0#cache](https://webpack.js.org/configuration/other-options/#cache)

