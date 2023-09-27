---
password: ""
icon: ""
创建时间: "2023-09-02T17:33:00.000Z"
date: "2023-09-03"
type: Post
slug: rollup-multi-input
配置类型:
  type: string
  string: 文档
summary: 用Rollup打包多入口npm库，实现文件按需引入
更新时间: "2023-09-05T09:14:00.000Z"
title: Rollup打包——多入口配置
category: 技术分享
tags:
  - Rollup
  - 打包构建
status: Draft
urlname: 385c919d-f253-4976-9819-824ea05304e4
updated: "2023-09-05 09:14:00"
---

# 适用场景

当开发一个组件包时，由于平台的差异，所以在某些实现上需要实现两套。

例如，`multi-input`是一个可以同时用于微信小程序和浏览器环境的`npm`库，其中的`request`请求库在不同客户端的实现不一样。在微信环境下用的是`wx.request`，在浏览器环境用的是`fetch`。

但是在微信环境使用时，我不希望我引入的代码中包含用不到的适用于浏览器环境的`fetch`等相关代码。再加上微信小程序对于代码体积的严格限制。所以我希望`multi-input`再引入的时候可以有多个入口，主逻辑代码直接引入`multi-input`，`request`库相关逻辑单独有个入口。

解决办法有两种

1. 将`request`库相关逻辑抽离成另外一个`npm`包
2. `rollup`打包多入口文件并配合`package.json`中的`exports`字段实现

本文介绍第二种方法，使用示例如下：

```javascript
import { TestCore } from "multi-input";
import { WebRequest } from "multi-input/lib/web-request";
import { WxRequest } from "multi-input/lib/web-request";
```

这样在微信小程序端使用并打包时，就不会将`WebRequest`相关代码打包到微信小程序代码中，实现按需引入。

# 代码结构

｜ 代码源码：[multi-input](https://github.com/LetTTGACO/build-project/tree/master/rollup/multi-input)

`multi-input`库代码结构如下

```text
.
|-multi-input
  |-.gitignore
  |-adapter // 这里面就是不同客户端的request请求库的实现
  |  |-web-request.ts
  |  |-wx-request.ts
  |-src
  |  |-core.ts
  |  |-index.ts
  |  |-manager
  |  |  |-message-manager.ts
  |  |-utils
  |  |  |-url.ts
  |-rollup.config.js // rollup打包配置
  |-tsconfig.json
  |-package.json
```

# 注意事项

要想要外部以这样的方式引用，有五个必要条件

1. `adapter`下的文件只能引用`adapter`目录中的文件
2. `src`下中的文件只能引用`src`中的文件
3. `multi-input`根目录下必须存在打包后的`lib/web-request`文件
4. `package.json`中的`exports`字段中需要有`lib/web-request`的路径映射
5. `rollup`需要分别打包`src`和`adapter`下的文件，多入口打包

# Rollup 配置

功能点如下

- 将`multi-input`以`esm`和`cjs`的模式导出，并分别导出到`dist/esm`和`dist/cjs`下
- `adapter`下的请求库也分别以`esm`和`cjs`的模式导出，并分别导出到`dist/esm/adapter`和`dist/cjs/adapter`下
- 打包后的类型声明文件和`js`文件和原文件目录结构保持一致

```typescript
// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs"; // 解析js
import typescript from "@rollup/plugin-typescript"; // 解析ts

const getBasePlugins = (tsConfig) => {
  return [
    resolve(),
    commonjs(),
    typescript({
      ...tsConfig,
    }),
  ];
};

export default [
  // 主逻辑代码打包
  {
    input: "src/index.ts",
    output: {
      dir: "dist/cjs", // 打包到cjs目录
      format: "cjs", // 以cjs模式打包
      exports: "named", // 指定导出模式（自动、默认、命名、无）
      preserveModules: true, // 保留模块结构，以原来的文件夹结构输出js
      preserveModulesRoot: "src", // 将保留的模块放在根级别的此路径下
    },
    plugins: [
      ...getBasePlugins({
        outDir: "dist/cjs", // 声明文件输出目录
        declaration: true,
        // 指定声明文件的解析目录，这里主要是用于忽略adapter目录
        filterRoot: "src",
      }),
    ],
  },
  {
    input: "src/index.ts",
    output: {
      dir: "dist/esm",
      format: "esm",
      exports: "named",
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [
      ...getBasePlugins({
        outDir: "dist/esm",
        declaration: true,
        filterRoot: "src",
      }),
    ],
  },
  // adapter导出
  {
    input: {
      "web-request": "adapter/web-request.ts",
      "wx-request": "adapter/wx-request.ts",
    },
    output: [
      {
        dir: "dist/cjs/adapter",
        format: "cjs",
      },
    ],
    plugins: [
      ...getBasePlugins({
        outDir: "dist/cjs/adapter",
        declaration: true,
        // 指定声明文件的解析目录，这里主要是用于忽略src目录
        // 注意tsconfig.json中不要指定rootDir，否则会导致adapter目录识别不到
        filterRoot: "adapter",
      }),
    ],
  },
  {
    input: {
      "web-request": "adapter/web-request.ts",
      "wx-request": "adapter/wx-request.ts",
    },
    output: [
      {
        dir: "dist/esm/adapter",
        format: "esm",
      },
    ],
    plugins: [
      ...getBasePlugins({
        outDir: "dist/esm/adapter",
        declaration: true,
        filterRoot: "adapter",
      }),
    ],
  },
];
```

# package.json 配置

```typescript
// package.json
{
  "name": "multi-input",
  "version": "1.0.0",
  "description": "多入口打包",
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "typings": "dist/esm/index.d.ts",
  "scripts": {
    "build": "rollup -c rollup.config.js --bundleConfigAsCjs",
    "clean": "rimraf -rf ./dist"
  },
  "exports": {
    // 定义multi-input路径引用文件
    ".": {
      "import": "./dist/esm/index.js", // esm import时引用时的文件路径
      "require": "./dist/cjs/index.js", // cjs require时引用时的文件路径
      "types": "./dist/esm/index.d.ts" // 类型声明文件路径
    },
    // 定义multi-input/adapter/web-request路径引用文件
    "./adapter/web-request": {
      "import": "./dist/esm/adapter/web-request.js", // esm import时引用时的文件路径
      "require": "./dist/cjs/adapter/web-request.cjs", // cjs require时引用时的文件路径
      "types": "./dist/esm/adapter/web-request.d.ts" // 类型声明文件路径
    },
    // 定义multi-input/adapter/wx-request路径引用文件
    "./adapter/wx-request": {
      "import": "./dist/esm/adapter/wx-request.js", // esm import时引用时的文件路径
      "require": "./dist/cjs/adapter/wx-request.cjs", // cjs require时引用时的文件路径
      "types": "./dist/esm/adapter/wx-request.d.ts" // 类型声明文件路径
    }
  },
  "files": ["dist"],
  "author": "1874",
  "license": "ISC",
  "devDependencies": {
    "@rollup/plugin-commonjs": "^25.0.4",
    "@rollup/plugin-node-resolve": "^15.2.1",
    "@rollup/plugin-typescript": "^11.1.3",
    "rimraf": "^5.0.1",
    "rollup": "^3.28.1",
    "tslib": "^2.6.2",
    "typescript": "^5.2.2"
  }
}
```

# 打包后代码结构

```typescript
.
|-multi-input
  |-.gitignore
  |-adapter
  |  |-web-request.ts
  |  |-wx-request.ts
  |-dist // 打包产物
  |  |-cjs
  |  |  |-adapter
  |  |  |  |-web-request.d.ts
  |  |  |  |-web-request.js
  |  |  |  |-wx-request.d.ts
  |  |  |  |-wx-request.js
  |  |  |-core.d.ts
  |  |  |-core.js
  |  |  |-index.d.ts
  |  |  |-index.js
  |  |  |-manager
  |  |  |  |-message.d.ts
  |  |  |  |-message.js
  |  |  |-utils
  |  |  |  |-url.d.ts
  |  |  |  |-url.js
  |  |-esm
  |  |  |-adapter
  |  |  |  |-web-request.d.ts
  |  |  |  |-web-request.js
  |  |  |  |-wx-request.d.ts
  |  |  |  |-wx-request.js
  |  |  |-core.d.ts
  |  |  |-core.js
  |  |  |-index.d.ts
  |  |  |-index.js
  |  |  |-manager
  |  |  |  |-message.d.ts
  |  |  |  |-message.js
  |  |  |-utils
  |  |  |  |-url.d.ts
  |  |  |  |-url.js
  |-src
  |  |-core.ts
  |  |-index.ts
  |  |-manager
  |  |  |-message.ts
  |  |-utils
  |  |  |-url.ts
  |-rollup.config.js
  |-tsconfig.json
  |-package.json
  |-pnpm-lock.yaml
```

# 参考资料

- [Rollup 中文文档](https://cn.rollupjs.org/introduction/)
- [rollup/plugin-typescript 插件配置](https://www.npmjs.com/package/@rollup/plugin-typescript)
