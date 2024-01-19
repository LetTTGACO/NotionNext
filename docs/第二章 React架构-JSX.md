---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2021-12-16 00:00:00'
type: Post
slug: react-jsx
配置类型:
  type: string
  string: 文档
summary: ''
更新时间: '2023-08-26T15:26:00.000Z'
title: 第二章 React架构-JSX
category: 学习笔记
tags:
  - 自顶向下学习React源码
  - React
status: Draft
urlname: 43bfb7df-683e-4e53-a9a9-dfe9ab6e67ba
updated: '2023-08-26 23:26:00'
---

# React 目录结构


## 顶层目录


除去配置文件和隐藏文件夹，根目录的文件夹包括三个：


```typescript
根目录
├── fixtures        # 包含一些给贡献者准备的小型 React 测试项目
├── packages        # 包含元数据（比如 package.json）和 React 仓库中所有 package 的源码（子目录 src）
├── scripts         # 各种工具链的脚本，比如git、jest、eslint等
```


## packages 目录


### react 文件夹


React 的核心，包含所有全局 React API，如：

- React.createElement
- React.Component
- React.Children

这些 API 是全平台通用的，它不包含 ReactDOM、ReactNative 等平台特定的代码。在 NPM 上作为单独的一个包发布。


### scheduler 文件夹


Scheduler（调度器）的实现。


### shared 文件夹


源码中其他模块公用的方法和全局变量，比如在 shared/ReactSymbols.js 中保存 React 不同组件类型的定义。


```typescript
// ...
export let REACT_ELEMENT_TYPE = 0xeac7;
export let REACT_PORTAL_TYPE = 0xeaca;
export let REACT_FRAGMENT_TYPE = 0xeacb;
// ...
```


### Renderer 相关的文件夹


包含不同平台的渲染器的实现


```typescript
- react-art
- react-dom                 # 注意这同时是DOM和SSR（服务端渲染）的入口
- react-native-renderer
- react-noop-renderer       # 用于debug fiber（后面会介绍fiber）
- react-test-renderer
```


### 试验性包的文件夹


React 将自己流程中的一部分抽离出来，形成可以独立使用的包，由于他们是试验性质的，所以不被建议在生产环境使用。包括如下文件夹：


```typescript
- react-server        # 创建自定义SSR流
- react-client        # 创建自定义的流
- react-fetch         # 用于数据请求
- react-interactions  # 用于测试交互相关的内部特性，比如React的事件模型
- react-reconciler    # Reconciler的实现，你可以用他构建自己的Renderer
```


### 辅助包的文件夹


React 将一些辅助功能形成单独的包。包括如下文件夹：


```typescript
- react-is       # 用于测试组件是否是某类型
- react-client   # 创建自定义的流
- react-fetch    # 用于数据请求
- react-refresh  # “热重载”的React官方实现
```


### react-reconciler 文件夹


我们需要重点关注 react-reconciler，虽然他是一个实验性的包，内部的很多功能在正式版本中还未开放。但是他一边对接 Scheduler，一边对接不同平台的 Renderer，构成了整个 React16 的架构体系。


# 深入理解 JSX


## React.CreateElement


JSX 在编译时会被 Babel 编译为 React.createElement 方法，查看源码：


```javascript
/**
 * Create and return a new ReactElement of the given type.
 * See https://reactjs.org/docs/react-api.html#createelement
 */
export function createElement(type, config, children) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    // 赋值给props
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  const childrenLength = arguments.length - 2;
  // 处理 children，会被赋值给props.children
  
  // Resolve default props 处理默认值并赋值
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}
```


最后，React 会返回一个包含组件数据的 ReactElement 的对象，该对象有一个属性`$$typeof: REACT_ELEMENT_TYPE`来标记他是一个 ReactElement。


```javascript
const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner,
  };

  return element;
};
```


在 React 中有一个全局的方法`isValidElement`来校验合法的 ReactElement。


```javascript
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */
export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
```


可以发现`$$typeof === REACT_ELEMENT_TYPE`的非 null 对象就是一个合法的 ReactElement。换言之，在 React 中，所有 JSX 在运行时的返回结果（即 React.createElement()的返回值）都是 React Element。


## React Component 


在 React 中，我们常使用 ClassComponent 与 FunctionComponent 构建组件。


```javascript
class AppClass extends React.Component {
  render() {
    return <p>KaSong</p>
  }
}
console.log('这是ClassComponent：', AppClass);
console.log('这是Element：', <AppClass/>);


function AppFunc() {
  return <p>KaSong</p>;
}
console.log('这是FunctionComponent：', AppFunc);
console.log('这是Element：', <AppFunc/>);
```


ClassComponent 对应的 Element 的 type 字段为 AppClass 自身。FunctionComponent 对应的 Element 的 type 字段为 AppFunc 自身：


```javascript
{
  $$typeof: Symbol(react.element),
  key: null,
  props: {},
  ref: null,
  type: ƒ AppFunc(),
  _owner: null,
  _store: {validated: false},
  _self: null,
  _source: null 
}
```


但是由于 class 组件和 function 组件本质上都是 function， 所以无法通过 instanceof 区分。


```javascript
AppClass instanceof Function === true;
AppFunc instanceof Function === true;
```


React 通过 ClassComponent 实例原型上的 isReactComponent 变量判断是否是 ClassComponent。


```javascript
ClassComponent.prototype.isReactComponent = {};
```


## JSX 与 Fiber 节点


从上面的内容我们可以发现，JSX 是一种描述当前组件内容的数据结构，他不包含组件 schedule、reconcile、render 所需的相关信息。 比如如下信息就不包括在 JSX 中：

- 组件在更新中的优先级
- 组件的 state
- 组件被打上的用于 Renderer 的标记
- 这些内容都包含在 Fiber 节点中。

所以，在组件 mount 时，Reconciler 根据 JSX 描述的组件内容生成组件对应的 Fiber 节点。 在 update 时，Reconciler 将 JSX 与 Fiber 节点保存的数据对比，生成组件对应的 Fiber 节点，并根据对比结果为 Fiber 节点打上标记。

