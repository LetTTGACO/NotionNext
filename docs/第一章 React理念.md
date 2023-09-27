---
password: ""
icon: ""
创建时间: "2023-04-07T19:15:00.000Z"
date: "2021-12-15"
type: Post
slug: react
配置类型:
  type: string
  string: 文档
summary: ""
更新时间: "2023-08-26T15:26:00.000Z"
title: 第一章 React理念
category: 学习笔记
tags:
  - 自顶向下学习React源码
  - React
status: Draft
urlname: 5a79a465-3cd6-4cd0-be23-29de458313ce
updated: "2023-08-26 15:26:00"
---

# React 理念：快速响应

两大制约

- CPU 的瓶颈：JS 脚本执行和浏览器布局、绘制不能同时执行。
- IO 的瓶颈：网络延迟客观存在

React 的解决办法

- 对于 CPU 瓶颈，是需要实现时间切片，而时间切片的关键是：将同步的更新变为可中断的异步更新。
- 对于 IO 瓶颈，将人机交互研究的结果整合到真实的 UI 中。React 内部实现了 Suspense 功能及配套的 hook——useDeferredValue，同样需要将同步的更新变为可中断的异步更新

# 老的 React15 架构

React15 架构可以分为两层：

- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

## Reconciler（协调器）

在 React 中可以通过 this.setState、this.forceUpdate、ReactDOM.render 等 API 触发更新。 每当有更新发生时，Reconciler 会做如下工作：

1. 调用函数组件、或 class 组件的 render 方法，将返回的 JSX 转化为虚拟 DOM
2. 将虚拟 DOM 和上次更新时的虚拟 DOM 对比
3. 通过对比找出本次更新中变化的虚拟 DOM
4. 通知 Renderer 将变化的虚拟 DOM 渲染到页面上

## Renderer（渲染器）

由于 React 支持跨平台，所以不同平台有不同的 Renderer。我们前端最熟悉的是负责在浏览器环境渲染的 Renderer —— ReactDOM。 除此之外，还有：

- ReactNative (opens new window)渲染器，渲染 App 原生组件
- ReactTest (opens new window)渲染器，渲染出纯 Js 对象用于测试
- ReactArt (opens new window)渲染器，渲染到 Canvas, SVG 或 VML (IE8)

在每次更新发生时，Renderer 接到 Reconciler 通知，将变化的组件渲染在当前宿主环境。

## 缺点

在 Reconciler 中，mount 的组件会调用 mountComponent，update 的组件会调用 updateComponent。这两个方法都会递归更新子组件。由于递归执行，所以更新一旦开始，中途就无法中断。当层级很深时，递归更新时间超过了 16ms，用户交互就会卡顿。基于以上原因，React 团队决定重写架构。

# 新的 React16 架构

React16 架构可以分为三层：

- Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入 Reconciler
- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

可以看到，相较于 React15，React16 中新增了 Scheduler（调度器）。

## Scheduler（调度器）

既然我们以浏览器是否有剩余时间作为任务中断的标准，那么我们需要一种机制，当浏览器有剩余时间时通知我们。 其实部分浏览器已经实现了这个 API，这就是 requestIdleCallback。但是由于以下因素，React 放弃使用：

- 浏览器兼容性
- 触发频率不稳定，受很多因素影响。比如当我们的浏览器切换 tab 后，之前 tab 注册的 requestIdleCallback 触发的频率会变得很低

基于以上原因，React 实现了功能更完备的 requestIdleCallbackpolyfill，这就是 Scheduler。除了在空闲时触发回调的功能外，Scheduler 还提供了多种调度优先级供任务设置。

## Reconciler（协调器）

在 React15 中 Reconciler 是递归处理虚拟 DOM 的。让我们看看 React16 的 Reconciler。

```javascript
/** @noinline */
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

我们可以看见，更新工作从递归变成了可以中断的循环过程。每次循环都会调用 shouldYield 判断当前是否有剩余时间。 那么 React16 是如何解决中断更新时 DOM 渲染不完全的问题呢？ 在 React16 中，Reconciler 与 Renderer 不再是交替工作。当 Scheduler 将任务交给 Reconciler 后，Reconciler 会为变化的虚拟 DOM 打上代表**增/删/更新**的标记。 整个 Scheduler 与 Reconciler 的工作都在内存中进行。只有当所有组件都完成 Reconciler 的工作，才会统一交给 Renderer。

## Renderer（渲染器）

Renderer 根据 Reconciler 为虚拟 DOM 打的标记，

**同步**

执行对应的 DOM 操作。 更新流程：

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/41efb32bb999f70426a8696c92fab577.png)

# Fiber 架构

Fiber 包含三层含义：

1. 作为架构来说，之前 React15 的 Reconciler 采用递归的方式执行，数据保存在递归调用栈中，所以被称为 stack Reconciler。React16 的 Reconciler 基于 Fiber 节点实现，被称为 Fiber Reconciler。
2. 作为静态的数据结构来说，每个 Fiber 节点对应一个 React element，保存了该组件的类型（函数组件/类组件/原生组件…）、对应的 DOM 节点等信息。
3. 作为动态的工作单元来说，每个 Fiber 节点保存了本次更新中该组件改变的状态、要执行的工作（需要被删除/被插入页面中/被更新…）。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/d8c22cc52c2c6eadf123f504790b7de5.png)

## Fiber 结构

```javascript
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode
) {
  // 作为静态数据结构的属性
  this.tag = tag;
  this.key = key;
  // 在函数式组件被React.memo包裹时,elementType和type不同
  // 对于函数式组件,type是函数本身,对于class组件,type是class
  this.elementType = null;
  this.type = null;
  // 真实dom节点
  this.stateNode = null;

  // 用于连接其他Fiber节点形成Fiber树
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  // 作为动态的工作单元的属性
  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  this.effectTag = NoEffect;
  this.nextEffect = null;

  this.firstEffect = null;
  this.lastEffect = null;

  // 调度优先级相关
  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  // 指向该fiber在另一次更新时对应的fiber
  this.alternate = null;
}
```

## 双缓存

当我们用 canvas 绘制动画，每一帧绘制前都会调用 ctx.clearRect 清除上一帧的画面。 如果当前帧画面计算量比较大，导致清除上一帧画面到绘制当前帧画面之间有较长间隙，就会出现白屏。 为了解决这个问题，我们可以在内存中绘制当前帧动画，绘制完毕后直接用当前帧替换上一帧画面，由于省去了两帧替换间的计算时间，不会出现从白屏到出现画面的闪烁情况。 这种在内存中构建并直接替换的技术叫做**双缓存**。

React 使用“双缓存”来完成 Fiber 树的构建与替换——对应着 DOM 树的创建与更新。

## 双缓存 Fiber 树

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/d2f3af2b52f4330cb1788413e328792e.png)

在 React 中最多会同时存在两棵 Fiber 树。当前屏幕上显示内容对应的 Fiber 树称为 current Fiber 树，正在内存中构建的 Fiber 树称为 workInProgress Fiber 树。 current Fiber 树中的 Fiber 节点被称为 current fiber，workInProgress Fiber 树中的 Fiber 节点被称为 workInProgress fiber，他们通过 alternate 属性连接。

```javascript
currentFiber.alternate === workInProgressFiber;
workInProgressFiber.alternate === currentFiber;
```

React 应用的根节点通过使 current 指针在不同 Fiber 树的 rootFiber 间切换来完成 current Fiber 树指向的切换。

即当 workInProgress Fiber 树构建完成交给 Renderer 渲染在页面上后，应用根节点的 current 指针指向 workInProgress Fiber 树，此时 workInProgress Fiber 树就变为 current Fiber 树。

每次状态更新都会产生新的 workInProgress Fiber 树，通过 current 与 workInProgress 的替换，完成 DOM 更新。

## Mount 时

```javascript
function App() {
  const [num, add] = useState(0);
  return <p onClick={() => add(num + 1)}>{num}</p>;
}

ReactDOM.render(<App />, document.getElementById("root"));
```

1. 首次执行 ReactDOM.render 会创建 fiberRootNode（源码中叫 fiberRoot）和 rootFiber。其中 fiberRootNode 是整个应用的根节点，rootFiber 是

   所在组件树的根节点。

之所以要区分 fiberRootNode 与 rootFiber，是因为在应用中我们可以多次调用 ReactDOM.render 渲染不同的组件树，他们会拥有不同的 rootFiber。但是整个应用的根节点只有一个，那就是 fiberRootNode。

fiberRootNode 的 current 会指向当前页面上已渲染内容对应 Fiber 树，即 current Fiber 树。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/e61cccf53ea4d7cffa33a32da8084f5d.png)

```javascript
fiberRootNode.current = rootFiber;
```

由于是首屏渲染，页面中还没有挂载任何 DOM，所以 fiberRootNode.current 指向的 rootFiber 没有任何子 Fiber 节点（即 current Fiber 树为空）。

1. 接下来进入 render 阶段，根据组件返回的 JSX 在内存中依次创建 Fiber 节点并连接在一起构建 Fiber 树，被称为 workInProgress Fiber 树。（下图中右侧为内存中构建的树，左侧为页面显示的树）

在构建 workInProgress Fiber 树时会尝试复用 current Fiber 树中已有的 Fiber 节点内的属性，在首屏渲染时只有 rootFiber 存在对应的 current fiber（即 rootFiber.alternate）。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/463f3e4cad56f0e1d5c5543ba5950ac5.png)

1. 图中右侧已构建完的 workInProgress Fiber 树在 commit 阶段渲染到页面。

此时 DOM 更新为右侧树对应的样子。fiberRootNode 的 current 指针指向 workInProgress Fiber 树使其变为 current Fiber 树。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/0cedf4ab40873704407eb3391e0c6bdf.png)

## Update 时

1. 接下来我们点击 p 节点触发状态改变，这会开启一次新的 render 阶段并构建一棵新的 workInProgress Fiber 树。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/01103be53d27aa372ef012c5788c272a.png)

和 mount 时一样，workInProgress fiber 的创建可以复用 current Fiber 树对应的节点数据。这个决定是否复用的过程就是 Diff 算法。

1. workInProgress Fiber 树在 render 阶段完成构建后进入 commit 阶段渲染到页面上。渲染完毕后，workInProgress Fiber 树变为 current Fiber 树。

![](https://blogimagesrep-1257180516.cos.ap-guangzhou.myqcloud.com/1874-blog-images/4127f83ed11969351cd8c51230da256b.png)
