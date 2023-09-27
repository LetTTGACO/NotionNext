---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2021-05-08"
type: Post
slug: zqsrm2
配置类型:
  type: string
  string: 文档
summary: 本文主要介绍了 npm 依赖管理的机制，包括 npm 安装机制、npm 2 和 npm 3 模块安装机制的差异、npm 3 对于同一依赖的不同版本的处理、package-lock.json 文件的结构和作用等内容。
更新时间: "2023-08-26T15:22:00.000Z"
title: 探究npm 依赖管理
category: 技术分享
tags:
  - Npm
status: Archived
urlname: 701f9876-9f7a-4f28-b225-7077e45cfeab
updated: "2023-08-26 15:22:00"
---

# 前言

其实之前就有疑惑过,npm 依赖之间是怎么处理的,怎么才能相互依赖而又不重复，怎么处理不同版本依赖的问题等等，乱成一锅粥。出现错误要怎么解决? 哪些警告要额外注意一下?今天就来研究下。

# npm 安装机制

## A 和 B 同时依赖 C，这个包会被安装在哪里呢？

假如有 A 和 B 两个包，两个包都依赖 C 这个包，npm 2 会依次递归安装 A 和 B 两个包及其子依赖包到 node_modules 中。执行完毕后，我们会看到 `./node_modules` 这层目录只含有这两个子目录：

```text
node_modules/
├─┬ A
│ ├── C
├─┬ B
│ └── C
```

如果使用 npm 3 来进行安装的话，`./node_modules` 下的目录将会包含三个子目录：

```text
node_modules/
├─┬ A
├─┬ B
├─┬ C
```

为什么会出现这样的区别呢？这就要从 npm 的工作方式说起了：

## npm 2 和 npm 3 模块安装机制的差异

虽然目前最新的 npm 版本是 npm 7，但 npm 2 到 npm 3 的版本变更中实现了目录打平，与其他版本相比差别较大。因此，让我们具体看下这两个版本的差异。

npm 2 在安装依赖包时，采用简单的递归安装方法。执行

```text
npm install
```

后，npm 根据 dependencies 和 devDependencies 属性中指定的包来确定第一层依赖，npm 2 会根据第一层依赖的子依赖，递归安装各个包到子依赖的 node_modules 中，直到子依赖不再依赖其他模块。执行完毕后，我们会看到

```text
./node_modules
```

这层目录中包含有我们 package.json 文件中所有的依赖包，而这些依赖包的子依赖包都安装在了自己的 node_modules 中 ，形成类似于下面的依赖树：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/3b78b4ff59692bac662a6839e35e3c7d.png)

这样的目录有较为明显的好处： 1）层级结构非常明显，可以清楚的在第一层的 node_modules 中看到我们安装的所有包的子目录； 2）在已知自己所需包的名字以及版本号时，可以复制粘贴相应的文件到 node_modules 中，然后手动更改 package.json 中的配置； 3）如果想要删除某个包，只需要简单的删除 package.json 文件中相应的某一行，然后删除 node_modules 中该包的目录； 但是这样的层级结构也有较为明显的缺陷，当我的 A，B，C 三个包中有相同的依赖 D 时，执行

```text
npm install
```

后，D 会被重复下载三次，而随着我们的项目越来越复杂，node_modules 中的依赖树也会越来越复杂，像 D 这样的包也会越来越多，造成了大量的冗余；在 windows 系统中，甚至会因为目录的层级太深导致文件的路径过长，触发文件路径不能超过 280 个字符的错误；

为了解决以上问题，npm 3 的 node_modules 目录改成了更为扁平状的层级结构，尽量把依赖以及依赖的依赖平铺在 node_modules 文件夹下共享使用。

## npm 3 对于同一依赖的不同版本会怎么处理呢？

npm 3 会遍历所有的节点，逐个将模块放在 node_modules 的第一层，当发现有重复模块时，则丢弃， 如果遇到某些依赖版本不兼容的问题，则继续采用 npm 2 的处理方式，前面的放在 node_modules 目录中，后面的放在依赖树中。举个例子： A，B，依赖 D(v 0.0.1)，C 依赖 D(v 0.0.2):

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/c04dae56ff53a7d5fd805368a03efd1f.png)

但是 npm 3 会带来一个新的问题：由于在执行 npm install 的时候，按照 package.json 里依赖的顺序依次解析，上图如果 C 的顺序在 A，B 的前边，node_modules 树则会改变，会出现下边的情况：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/64cbbe7e1536fbe1ef29df46ca6d5cb3.png)

由此可见，npm 3 并未完全解决冗余的问题，甚至还会带来新的问题。

# 为什么会出现 package-lock.json 呢？

## package.json 的不足之处

npm install 执行后，会生成一个 node_modules 树，在理想情况下， 希望对于同一个 package.json 总是生成完全相同 node_modules 树。在某些情况下，确实如此。但在多数情况下，npm 无法做到这一点。有以下两个原因： 1）某些依赖项自上次安装以来，可能已发布了新版本 。比如：A 包在团队中第一个人安装的时候是 1.0.5 版本，package.json 中的配置项为 `A: '^1.0.5'` ；团队中第二个人把代码拉下来的时候，A 包的版本已经升级成了 1.0.8，根据 package.json 中的[semver-range version](http://semver.org/) 规范，此时第二个人 npm install 后 A 的版本为 1.0.8； 可能会造成因为依赖版本不同而导致的 bug； 2）针对 1）中的问题，可能有的小伙伴会想，把 A 的版本号固定为 `A: '1.0.5'` 不就可以了吗？但是这样的做法其实并没有解决问题， 比如 A 的某个依赖在第一个人下载的时候是 2.1.3 版本，但是第二个人下载的时候已经升级到了 2.2.5 版本，此时生成的 node_modules 树依旧不完全相同 ，固定版本只是固定来自身的版本，依赖的版本无法固定。

## 针对 package.json 不足的解决方法

为了解决上述问题以及 npm 3 的问题，在 npm 5.0 版本后，npm install 后都会自动生成一个 package-lock.json 文件 ，当包中有 package-lock.json 文件时，npm install 执行时，如果 package.json 和 package-lock.json 中的版本兼容，会根据 package-lock.json 中的版本下载；如果不兼容，将会根据 package.json 的版本，更新 package-lock.json 中的版本，已保证 package-lock.json 中的版本兼容 package.json。

## package-lock.json 文件的结构

package-lock.json 文件中的 name、version 与 package.json 中的 name、version 一样，描述了当前包的名字和版本，dependencies 是一个对象，该对象和 node_modules 中的包结构一一对应，对象的 key 为包的名称，值为包的一些描述信息， 根据 [package-lock-json 官方文档](https://docs.npmjs.com/configuring-npm/package-lock-json.html#requires)，主要的结构如下：

- `version` ：包版本，即这个包当前安装在 `node_modules` 中的版本
- `resolved` ：包具体的安装来源
- `integrity` ：包 `hash` 值，验证已安装的软件包是否被改动过、是否已失效
- `requires` ：对应子依赖的依赖，与子依赖的 `package.json` 中 `dependencies` 的依赖项相同
- `dependencies` ：结构和外层的 `dependencies` 结构相同，存储安装在子依赖 `node_modules` 中的依赖包

需要注意的是，并不是所有的子依赖都有 `dependencies` 属性。只有当子依赖的依赖和当前已安装在根目录的 `node_modules` 中的依赖冲突之后，才会有这个属性。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/bb444073bebe7fffaee5215174aa1966.png)

## package-lock.json 文件的作用

- 在团队开发中，确保每个团队成员安装的依赖版本是一致的，确定一棵唯一的 node_modules 树；
- node_modules 目录本身是不会被提交到代码库的，但是 package-lock.json 可以提交到代码库，如果开发人员想要回溯到某一天的目录状态，只需要把 package.json 和 package-lock.json 这两个文件回退到那一天即可 。
- 由于 package-lock.json 和 node_modules 中的依赖嵌套完全一致，可以更加清楚的了解树的结构及其变化。
- 在安装时，npm 会比较 node_modules 已有的包，和 package-lock.json 进行比较，如果重复的话，就跳过安装 ，从而优化了安装的过程。

# 依赖的区别与使用场景

npm 目前支持以下几类依赖包管理包括

- dependencies
- devDependencies 开发环境依赖包
- optionalDependencies 可选择的依赖包
- peerDependencies 同等依赖
- bundledDependencies 捆绑依赖包

### dependencies

无论在开发环境还是在生产环境都必须使用的依赖，是最常用的依赖包管理对象，例如 React，typescript，Axios 等，通过 `npm install XXX` 下载的包都会默认安装在 dependencies 对象中，也可以使用 `npm install XXX -S` 下载 dependencies 中的包； 插件下 dependencies 中的依赖会在安装插件时全部安装

### devDependencies

指可以在开发环境使用的依赖，例如 eslint，@types 类型定义文件等，通过 `npm install XXX -D` 下载的包都会在 devDependencies 对象中； dependencies 和 devDependencies 最大的区别是在打包运行时，执行  `npm install`  时默认会把所有依赖全部安装，但是如果使用  `npm install --production`  时就只会安装 dependencies 中的依赖，如果是 node 服务项目，就可以采用这样的方式用于服务运行时安装和打包，减少包大小。

### optionalDependencies

指的是可以选择的依赖，当你希望某些依赖即使下载失败或者没有找到时，项目依然可以正常运行或者 npm 继续运行的时，就可以把这些依赖放在 optionalDependencies 对象中. 但是 optionalDependencies 会覆盖 dependencies 中的同名依赖包，所以不要把一个包同时写进两个对象中。

optionalDependencies 就像是我们的代码的一种保护机制一样，如果包存在的话就走存在的逻辑，不存在的就走不存在的逻辑。 eg: 图片压缩插件在 windows 和 mac 上的问题

### peerDependencies

用于指定你当前的插件兼容的宿主必须要安装的包的版本，这个是什么意思呢？举个例子 🌰：我们常用的 react 组件库 [ant-design@4.x](https://ant.design/index-cn) 的 package.json 中的配置如下：

```json
{
  "peerDependencies": {
    "react": ">=16.9.0",
    "react-dom": ">=16.9.0"
  }
}
```

假设我们创建了一个名为 project 的项目，在此项目中我们要使用 [ant-design@4.x](https://ant.design/index-cn) 这个 UI 库，此时我们的项目就必须先安装 React >= 16.9.0 和 React-dom >= 16.9.0 的版本。

> 注意: 在 npm 2 中，当我们下载

    [ant-design@4.x](https://ant.design/index-cn)


    [ant-design@4.x](https://ant.design/index-cn)


    ![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/2c31347250617a6ffd18e433c56fee89.png)

### 适用场景

通常是在插件开发的场景下，你的插件需要某些依赖的支持，但是你又没必要去安装，因为插件的宿主会去安装这些依赖，你就可以用 peerDependencies 去声明一下需要依赖的插件和版本，如果出问题 npm 就会有警告来提醒使用者去解决版本冲突问题。

### bundledDependencies

捆绑依赖。这个依赖项与其他几种依赖项不同，他不是一个键值对的对象，而是一个数组，数组里是包名的字符串，例如：

```json
{
  "name": "project",
  "version": "1.0.0",
  "bundleDependencies": ["axios", "lodash"]
}
```

当使用 npm install 时,这两个依赖和所需要的依赖都会安装. 当使用 npm pack 的方式来打包时，上述的例子会生成一个 project-1.0.0.tgz 的文件，在使用了 bundledDependencies 后，打包时会把 Axios 和 Lodash 这两个依赖一起放入包中，之后有人使用 `npm install project-1.0.0.tgz` 下载包时，Axios 和 Lodash 这两个依赖也会被安装。

需要注意的是安装之后 Axios 和 Lodash 这两个包的信息在 dependencies 中，并且不包括版本信息。

```text
"bundleDependencies": [
    "axios",
    "lodash"
  ],
"dependencies": {
  "axios": "*",
  "lodash": "*"
}

```

### 适用场景

依赖包通常是从 npm 仓库中安装的。而 bundledDependencies 这是用在以下几个场景:

- 复用不是来自 npm 仓库或已修改的第三方库
- 将自己的项目作为模块复用
- 与模块一起发布一些文件

这样就不必创建和维护自己的 npm 插件，但可以获得与 npm 包相同的结果。

### 不适用场景

如果是处理软件版本锁定问题, package-lock.json 是更好的选择.

# 实际应用

## 问题出现

最近有个项目在初始化的过程中，加入了公司统一的 Eslint 管理，需要用到两个依赖包。

```text
"devDependencies": {
  "@yunke/eslint-config-react-ts": "^1.0.0",
  "@yunke/yunke-setting-plugin": "^1.1.0"
}
```

但是在 Windows 电脑上，会报 `import/order` 的 Eslint 顺序错误。在 Mac 电脑上则没有出现这种情况。在研究依赖包的时候发现，`eslint-plugin-import` 的版本出了点问题。在 `@yunke/eslint-config-react-ts` 的配置中，需要的版本是 `>=2.22.1`。而实际在项目中被安装的版本确是 `2.20.1`。导致版本安装不对的原因则是因为项目中使用的 `react-scripts` 插件指定需要 `2.20.1` 的版本。但是疑惑点来了，为什么两个插件需要的插件版本不一样却只安装一个呢。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/3ff0621c87c0f2e7726f7cc0ebb183bb.png)

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/539435e872da29ba6e6431e6d9d2235d.png)

## 探究

随后仔细研究了`@yunke/eslint-config-react-ts`和`react-scripts`的`package.json`，发现一个重要的问题，也是上面提到过的，`@yunke/eslint-config-react-ts`所依赖的`eslint-plugin-import`插件是放在 peerDependencies 中定义的，而在 npm3 以上的版本中，不会自动下载这里面的依赖，而是会以 warning 的方式提示出来，需要宿主插件手动在`package.json`中定义并安装，而`react-scripts`所依赖的`eslint-plugin-import`插件是放在 dependencies 中的，所以会被下载下来，不需要定义。

### @yunke/eslint-config-react-ts 的依赖

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/98eaae55c046445bbf63dc0c9291355d.png)

### react-scripts 的依赖

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/76f1f7c55ce915ad45e774fabc406077.png)

值得注意的是，npm 在分析依赖的时候，会把依赖拍平，但是像这同一依赖的不同版本的处理会像上面分析的一样，react-scripts 会讲自己所依赖的版本放在自己的 node_modules 中，而@yunke/eslint-config-react-ts 说要求的在宿主上安装这个依赖后，则会直接放到宿主的 node_modules 中去。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/c04dae56ff53a7d5fd805368a03efd1f.png)

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/44742398f7b8628a4fad1526e4125502.png)

## 解决办法

在宿主插件，也就是项目中的`package.json`中重新引入`eslint-plugin-import`插件并定义版本号为`>=2.22.1`即可，重新`yarn install`后就会安装符合`@yunke/eslint-config-react-ts`所需要的版本，至此错误消失。

## 新的疑问

其实在`yarn install`时，不单单是提示`eslint-plugin-import`的版本不对，还有一些其他的插件的版本也不符合要求，例如 typescript 的版本过低等问题。这里就引申出一个问题，到底哪些依赖需要放到 peerDependencies 中，哪些依赖需要放到 dependencies 中，这也是一个值得思考的问题。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/2c31347250617a6ffd18e433c56fee89.png)
