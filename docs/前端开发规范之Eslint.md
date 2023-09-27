---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2021-01-15"
type: Post
slug: ar658s
配置类型:
  type: string
  string: 文档
summary: 本文介绍了前端开发规范中使用的Eslint。作者介绍了自己和团队在使用Eslint过程中遇到的问题，最终选择了Eslint + Prettier的组合，并使用了腾讯AlloyTeam创立的一套Eslint规则。本文详细介绍了Eslint规则的设计理念和样式相关的规则交给Prettier来管理的思想，以及如何开始配置Eslint。同时，作者还介绍了如何适配WebStorm来使用Eslint进行代码检查。
更新时间: "2023-08-26T15:22:00.000Z"
title: 前端开发规范之Eslint
category: 技术分享
tags:
  - Eslint
  - 代码规范
status: Archived
urlname: 506adb06-6632-4133-be32-171a4ec0af21
updated: "2023-08-26 15:22:00"
---

## 引言

前端代码规范已经折麽我无数次了，每次接别人的项目，一打开项目一片红，更要命的是用`eslint --fix` 也无济于事，不是和 Prettier 冲突，就是和 Editorconfig 冲突，格式化出来的代码依然报错。偏偏项目还使用了`lint-staged`，导致经常代码经常因为代码格式问题提交不上去！

我自己一直以来都习惯用 WebStorm 来开发，其他大部分人都用的 VSCode ，因为开发工具的配置差异，导致别人的 VSCode 代码检查不报错，而到了我的手上就一片红。

来来回回折腾了几个项目后，我决定统一团队的开发规范，并适配因为开发工具而导致代码检查差异！

在踩坑了几个日夜后，终于搞出了一套代码规范，不仅能适配各个开发工具，也能在此基础上规范团队的代码规范。

## 代码风格

此次采用的方案是 Eslint + Prettier 的组合， Eslint 采用的是腾讯  AlloyTeam 创立的一套  ESLint   规则[eslint-config-alloy](https://github.com/AlloyTeam/eslint-config-alloy) ，自 2017 年 8 月发布第一个版本以来，不知不觉中已经收获到 `1.8k stars`，超过了 [eslint-config-google](https://github.com/google/eslint-config-google)，成为了世界上排名第三的  ESLint   规范。

###

### 设计理念

- 样式相关的规则交给 [Prettier](https://prettier.io/) 管理
- 传承 ESLint 的理念，帮助大家建立自己的规则

### 样式相关的规则交给 [Prettier](https://prettier.io/) 管理

Prettier 是一个代码格式化工具，相比于 ESLint 中的代码格式规则，它提供了更少的选项，但是却更加专业。

如今 Prettier 已经成为前端项目中的必备工具，eslint-config-alloy 也没有必要再去维护 ESLint 中的代码格式相关的规则了，所以我们在 v3 版本中彻底去掉了所有 Prettier 相关的规则，用 ESLint 来检查它更擅长的逻辑错误。

至于缩进要两个空格还是四个空格，末尾要不要分号，可以在项目的 `.prettierrc.js` 中去配置，当然也提供了一份推荐的 Prettier 配置供大家参考。

### 传承 [ESLint 的理念](https://eslint.org/docs/about/#philosophy)，帮助大家建立自己的规则

大家还记得 ESLint 是怎么打败 JSHint 成为最受欢迎的 js 代码检查工具吗？就是因为 ESLint 推崇的插件化、配置化，满足了不同团队不同技术栈的个性的需求。

所以 eslint-config-alloy 也传承了 ESLint 的设计理念，不会强调必须要使用我们这套规则，而是通过文档、示例、测试、网站等方便大家参考 alloy 的规则，在此基础上做出自己的个性化。

由于 React/Vue/TypeScript 插件的文档没有中文化（或中文的版本很滞后），所以 alloy 的文档很大程度上帮助了国内开发者理解和配置个性化的规则。

实际上国内有很多团队或个人公开的 ESLint 配置，都参考了 alloy 的文档。

### 为什么要重复造轮子

其实我们团队最开始使用 airbnb 规则，但是由于它过于严格，部分规则还是需要个性化，导致后来越改越多，最后决定重新维护一套。经过两年多的打磨，现在 eslint-config-alloy 已经非常成熟与先进，也受到了公司内外很多团队的欢迎。

### 为什么不用 standard

standard 规范认为大家不应该浪费时间在个性化的规范了，而应该整个社区统一一份规范。这种说法有一定道理，但是它是与 ESLint 的设计理念背道而驰的。

### 相比于 airbnb 规则有什么优势

- eslint-config-alloy 拥有官方维护的 vue、typescript、react+typescript 规则，相比之下 airbnb 的 vue 和 typescript 都是第三方维护的
- 先进性，保证能够与时俱进，前面已经重点提到了
- 方便个性化定制，包含中文讲解和网站示例

### 你这个确实很好，我还是会选择 airbnb

没关系，eslint-config-alloy 从设计理念上就相信不同团队不同项目可以有不同的配置，虽然你选择使用 airbnb，但是当你有个性化配置需求的时候，还是可以来我们[网站](https://alloyteam.github.io/eslint-config-alloy/?language=zh-CN)上参考一下哦~

## 开始配置

### 安装相关依赖

```shell
npm install --save-dev eslint@7.17.0 babel-eslint@10.1.0 vue-eslint-parser@7.3.0 eslint-config-alloy@3 eslint-config-prettier@7.1.0 eslint-plugin-prettier@3.3.1 eslint-plugin-vue@7.4.1 vue-eslint-parser@7.3.0
```

### 依赖版本

```json
{
  "eslint": "7.17.0",
  "babel-eslint": "10.1.0",
  "eslint-config-alloy": "^3.10.0",
  "eslint-config-prettier": "^7.1.0",
  "eslint-plugin-prettier": "^3.3.1",
  "eslint-plugin-vue": "7.4.1",
  "vue-eslint-parser": "^7.3.0"
}
```

> 注意：可以看到我使用的依赖基本都是最新的版本，原因是之前版本比较低，出现了很多找不到相关规则的 error。最后网上找了好久才发现 npm 默认安装的版本相对较低，导致出现了兼容性问题，直到升级到了高版本后才解决。

### .eslintrc.js

```javascript
module.exports = {
  root: true,
  parserOptions: {
    parser: "babel-eslint",
  },
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    // https://github.com/AlloyTeam/eslint-config-alloy
    "eslint-config-alloy/vue",
    // https://github.com/vuejs/eslint-plugin-vue
    "plugin:vue/essential",
    // 结合.prettierrc.js中的规则来检查代码，这个一定要加！
    "plugin:prettier/recommended",
  ],
  // required to lint *.vue files
  plugins: ["vue"],
  // add your custom rules here
  rules: {
    // 让prettier找出代码中的格式问题
    "prettier/prettier": "error",
    // 这个顺序不知道为啥，明明不用配置时，.vue文件template标签在script前面默认应该也是可以的，但是我这边不行，所以自定义了一下
    "vue/component-tags-order": [
      "error",
      {
        order: [["template", "script"], "style"],
      },
    ],
  },
};
```

> 因为大部分规则都继承于 eslint-config-alloy/vue，所以代码的语法错误已经不需要我自己去规定了，

### .prettierrc.js

```javascript
module.exports = {
  // 一行最多 120 字符
  printWidth: 120,
  // 使用 2 个空格缩进
  tabWidth: 2,
  // 不使用缩进符，而使用空格
  useTabs: false,
  // 行尾不需要有分号
  semi: false,
  // 使用单引号
  singleQuote: true,
  // 对象的 key 仅在必要时用引号
  quoteProps: "as-needed",
  // jsx 不使用单引号，而使用双引号
  jsxSingleQuote: false,
  // 末尾需要有逗号
  trailingComma: "all",
  // 大括号内的首尾需要空格
  bracketSpacing: true,
  // jsx 标签的反尖括号需要换行
  jsxBracketSameLine: false,
  // 箭头函数，只有一个参数的时候，也需要括号
  arrowParens: "always",
  // 每个文件格式化的范围是文件的全部内容
  rangeStart: 0,
  rangeEnd: Infinity,
  // 不需要写文件开头的 @prettier
  requirePragma: false,
  // 不需要自动在文件开头插入 @prettier
  insertPragma: false,
  // 使用默认的折行标准
  proseWrap: "preserve",
  // 根据显示样式决定 html 要不要折行
  htmlWhitespaceSensitivity: "css",
  // vue 文件中的 script 和 style 内不用缩进
  vueIndentScriptAndStyle: false,
  // 换行符使用 lf
  endOfLine: "lf",
  // 格式化嵌入的内容
  embeddedLanguageFormatting: "auto",
};
```

## 开发工具适配

### WebStorm

用 WebStorm 的前端 er 一定不会太差！！ 我个人一直非常推荐 WebStorm，用起来非常顺手！开箱即用，特别是 git 的使用，甩开 VSCode 几条街。 WebStorm 配合 ESLint 需要去设置中设置 Eslint 为自动装配，使其使用项目中的`.eslintrc.js`去检查代码。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/585e932048713efdfba4728eb79ee054.png)

### VSCode

当然 VSCode 也是一款不错的开发工具，得力于丰富的插件市场，如果调教的够好，未来可能会比 WebStorm 更优秀。 VSCode 配合 ESLint 需要 ESLint 及 Prettier 等相关插件。

### 在 VSCode 中使用

在 VSCode 中，默认 ESLint 并不能识别 `.vue`、`.ts` 或 `.tsx` 文件，需要在「文件 => 首选项 => 设置」里做如下配置：

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "vue",
    "typescript",
    "typescriptreact"
  ]
}
```

### 保存时自动修复 ESLint 错误

如果想要开启「保存时自动修复」的功能，你需要配置 `.vscode/settings.json`：

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "vue",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### VSCode 中的 autoFixOnSave 没有效果

如果需要针对 `.vue`、`.ts` 和 `.tsx` 文件开启 ESLint 的 autoFix，则需要配置成：

```json
{
  "eslint.autoFixOnSave": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    {
      "language": "vue",
      "autoFix": true
    },
    {
      "language": "typescript",
      "autoFix": true
    },
    {
      "language": "typescriptreact",
      "autoFix": true
    }
  ]
}
```

## 结束

至此，大部分的配置已经结束。

结束也是开始，团队中开发规范的制定落地一定是慢慢打磨的结果。每个团队有每个团队自己的风格，未来更多的是需要针对各自团队搭配出一套适合自己的代码规范。
