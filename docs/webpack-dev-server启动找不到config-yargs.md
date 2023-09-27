---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2021-01-09"
type: Post
slug: fqx1vy
配置类型:
  type: string
  string: 文档
summary: ""
更新时间: "2023-08-26T15:22:00.000Z"
title: webpack-dev-server启动找不到config-yargs
category: 技术分享
tags:
  - Webpack
status: Archived
urlname: 8e09392b-f4ba-4969-8f3f-d47d779f6ff3
updated: "2023-08-26 15:22:00"
---

# 引言

在我接触前端以来，用的都是脚手架或者是别人封装好的前端框架。对于`webpack`，我一直处于一知半解的状态，去年在搭建多页面构建的时候，一直搞定不了多页面构建的问题。考虑到后面还会来搭建`webpack`，所以最近学学`webpack`，结果一上来就出错，一脸懵逼。

# 出现异常

安装的都是最新版本的`webpack`及相关依赖。

```text
"devDependencies": {
    "@babel/core": "^7.12.10",
    "@babel/preset-env": "^7.12.11",
    "@babel/preset-react": "^7.12.10",
    "babel-loader": "^8.2.2",
    "css-loader": "^5.0.1",
    "file-loader": "^6.2.0",
    "html-webpack-plugin": "^4.5.1",
    "less": "^4.0.0",
    "less-loader": "^7.2.1",
    "react": "^17.0.1",
    "react-dom": "^17.0.1",
    "style-loader": "^2.0.0",
    "url-loader": "^4.1.1",
    "webpack": "^5.11.1",
    "webpack-cli": "^4.3.1",
    "webpack-dev-server": "^3.11.1"
  }
```

在运行 `webpack-dev-server --open` 时，报错如下：

```text
> webpack-dev-server --open

internal/modules/cjs/loader.js:979
  throw err;
  ^
Error: Cannot find module 'webpack-cli/bin/config-yargs'
Require stack:
- /Users/xxx/workSpace/webpack/node_modules/webpack-dev-server/bin/webpack-dev-server.js
    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:976:15)
    at Function.Module._load (internal/modules/cjs/loader.js:859:27)
    at Module.require (internal/modules/cjs/loader.js:1036:19)
    at require (internal/modules/cjs/helpers.js:72:18)
    at Object.<anonymous> (/Users/fangpengfei/workSpace/webpack/node_modules/webpack-dev-server/bin/webpack-dev-server.js:65:1)
    at Module._compile (internal/modules/cjs/loader.js:1147:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1167:10)
    at Module.load (internal/modules/cjs/loader.js:996:32)
    at Function.Module._load (internal/modules/cjs/loader.js:896:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:71:12) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/xxx/workSpace/webpack/node_modules/webpack-dev-server/bin/webpack-dev-server.js'
  ]
}
```

# 异常原因

去`Google`后发现都是让重新安装低版本的`webpack-cli`，因为版本不兼容！想了想不对劲啊，既然版本不兼容，为什么不解决呢，看了下出现问题的时间都是去年甚至前年了，难道官方就不考虑解决吗？这个解决办法我不接受。按照国际惯例，我去`Github`上的[webpack-dev-server Issues](https://github.com/webpack/webpack-dev-server/issues/2759)去寻找答案，果然不出我所料：

```text
Yes - webpack-dev-server does not work with webpack-cli v4
Can you try ? webpack serve
```

在`webpack-cli v4` 中已经不支持用`webpack-dev-server`直接调用了！ 应该   用`webpack serve`来替换`webpack-dev-server`

# 解决办法

当然是使用新版本的启动方法啊！

```text
"scripts": {
    "build": "webpack",
    "watch": "webpack --watch",
    "dev": "webpack serve --open", // 相当于旧版本的webpack-dev-server --open
  },
```

> 注意：是 webpack serve 而不是 webpack server，不要多一个 r 顺带附上 webpack-dev-server 的新版本文档，文档里面也换成了新的启动方式。
