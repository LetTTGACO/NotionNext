---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2022-02-09 00:00:00'
type: Post
slug: react-render
配置类型:
  type: string
  string: 文档
summary: ''
更新时间: '2023-08-26T15:26:00.000Z'
title: 第三章 React架构-render阶段
category: 学习笔记
tags:
  - 自顶向下学习React源码
  - React
status: Draft
urlname: 423e426b-161e-4b67-9c5c-8f82af9f8feb
updated: '2023-08-26 23:26:00'
---

`Fiber节点`是如何被创建并构建 Fiber 树？


`render阶段`开始于`performSyncWorkOnRoot`或`performConcurrentWorkOnRoot`方法的调用。这取决于本次更新是同步更新还是异步更新。


```typescript
/ performSyncWorkOnRoot会调用该方法
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// performConcurrentWorkOnRoot会调用该方法
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```


可以看到，他们唯一的区别是是否调用`shouldYield`。如果当前浏览器帧没有剩余时间，`shouldYield`会中止循环，直到浏览器有空闲时间后再继续遍历。 `workInProgress`代表当前已创建的`workInProgress fiber`。 `performUnitOfWork`方法会创建下一个`Fiber节点`并赋值给`workInProgress`，并将`workInProgress`与已创建的`Fiber节点`连接起来构成`Fiber树`。 `Fiber Reconciler`是从`Stack Reconciler`重构而来，通过遍历的方式实现可中断的递归，所以`performUnitOfWork`的工作可以分为两部分：“递”和“归”。


# “递”阶段


首先从`rootFiber`开始向下深度优先遍历。为遍历到的每个`Fiber节点`调用[beginWork](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L3058)方法。 该方法会根据传入的`Fiber节点`创建`子Fiber节点`，并将这两个`Fiber节点`连接起来。 当遍历到叶子节点（即没有子组件的组件）时就会进入“归”阶段。


# “归”阶段


在“归”阶段会调用[completeWork](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCompleteWork.new.js#L652)处理`Fiber节点`。 当某个`Fiber节点`执行完`completeWork`，如果其存在`兄弟Fiber节点`（即`fiber.sibling !== null`），会进入其`兄弟Fiber`的“递”阶段。 如果不存在`兄弟Fiber`，会进入`父级Fiber`的“归”阶段。 “递”和“归”阶段会交错执行直到“归”到 rootFiber。至此，render 阶段的工作就结束了。


# 举个 🌰


```javascript
function App() {
  return (
    <div>
      i am
      <span>1874</span>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```


对应的`Fiber`树结构：


![Fr1PqG_iJcm7n6aZtHFfEHK4VuKT.png](https://image.1874.cool/1874-blog-images/829935fd3e593d6ab99cf898653dfee7.png)


```text
render阶段
```


会依次执行：


```shell
1. rootFiber beginWork2. App Fiber beginWork3. div Fiber beginWork4. "i am" Fiber beginWork5. "i am" Fiber completeWork6. span Fiber beginWork7. span Fiber completeWork8. div Fiber completeWork9. App Fiber completeWork10. rootFiber completeWork
```


> 注意 之所以没有 “1874” Fiber 的 beginWork/completeWork，是因为作为一种性能优化手段，针对只有单一文本子节点的Fiber，React会特殊处理。


# beginWork


## 流程概述


可以从[源码这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L3075)看到 beginWork 的定义。整个方法大概有 500 行代码。beginWork 的工作是传入当前 Fiber 节点，创建子 Fiber 节点。


```typescript
// 从传参看方法执行
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  // ...省略函数体
}
```


其中传参：

- current：当前组件对应的`Fiber节点`在上一次更新时的`Fiber节点`，即`workInProgress.alternate`
- workInProgress：当前组件对应的`Fiber节点`
- renderLanes：优先级相关

除`rootFiber`以外， 组件`mount`时，由于是首次渲染，是不存在当前组件对应的`Fiber节点`在上一次更新时的`Fiber节点`，即`mount`时`current === null`。 组件`update`时，由于之前已经`mount`过，所以`current !== null`。 所以我们可以通过`current === null ?`来区分组件是处于`mount`还是`update`。 基于此原因，`beginWork`的工作可以分为两部分：

- `update`时：如果`current`存在，在满足一定条件时可以复用`current`节点，这样就能克隆`current.child`作为`workInProgress.child`，而不需要新建`workInProgress.child`。
- `mount`时：除`fiberRootNode`以外，`current === null`。会根据`fiber.tag`不同，创建不同类型的`子Fiber节点`

```typescript
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  // update时：如果current存在可能存在优化路径，可以复用current（即上一次更新的Fiber节点）
  if (current !== null) {
    // ...省略

    // 复用current
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  } else {
    didReceiveUpdate = false;
  }

  // mount时：根据tag不同，创建不同的子Fiber节点
  switch (workInProgress.tag) {
    case IndeterminateComponent:
    // ...省略
    case LazyComponent:
    // ...省略
    case FunctionComponent:
    // ...省略
    case ClassComponent:
    // ...省略
    case HostRoot:
    // ...省略
    case HostComponent:
    // ...省略
    case HostText:
    // ...省略
    // ...省略其他类型
  }
}
```


## update 时


可以看到，满足如下情况时`didReceiveUpdate === false`（即可以直接复用前一次更新的`子Fiber`，不需要新建`子Fiber`）

- `oldProps === newProps && workInProgress.type === current.type`，即`props`与`fiber.type`不变
- `!includesSomeLane(renderLanes, updateLanes)`，即当前`Fiber节点`优先级不够。

## mount 时


当不满足优化路径时，就会新建`子Fiber`。根据`fiber.tag`不同，进入不同类型`Fiber`的创建逻辑。


> 可以从[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactWorkTags.js)看到tag对应的组件类型


```typescript
// mount时：根据tag不同，创建不同的Fiber节点
switch (workInProgress.tag) {
  case IndeterminateComponent:
  // ...省略
  case LazyComponent:
  // ...省略
  case FunctionComponent:
  // ...省略
  case ClassComponent:
  // ...省略
  case HostRoot:
  // ...省略
  case HostComponent:
  // ...省略
  case HostText:
  // ...省略
  // ...省略其他类型
}
```


对于我们常见的组件类型，如`FunctionComponent/ClassComponent/HostComponent`，最终会进入[reconcileChildren](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L233)方法。


## reconcileChildren


从该函数名就能看出这是`Reconciler`模块的核心部分。那么他究竟做了什么呢？

- 对于`mount`的组件，他会创建新的`子Fiber节点`
- 对于`update`的组件，他会将当前组件与该组件在上次更新时对应的`Fiber节点`比较（也就是俗称的`Diff算法`），将比较的结果生成`新Fiber节点`

```typescript
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes
) {
  if (current === null) {
    // 对于mount的组件
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes
    );
  } else {
    // 对于update的组件
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes
    );
  }
}
```


从代码可以看出，和`beginWork`一样，他也是通过`current === null ?`区分`mount`与`update`。 不论走哪个逻辑，最终他会生成新的`子Fiber节点`并赋值给`workInProgress.child`，作为本次`beginWork`[返回值](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L1158)，并作为下次`performUnitOfWork`执行时`workInProgress`的[传参](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1702)。


> 注意 值得一提的是，mountChildFibers与reconcileChildFibers这两个方法的逻辑基本一致。唯一的区别是：reconcileChildFibers会为生成的Fiber节点带上effectTag属性，而mountChildFibers不会。


## effectTag


我们知道，`render`阶段的工作是在内存中进行，当工作结束后会通知`Renderer`需要执行的`DOM`操作。要执行`DOM`操作的具体类型就保存在`fiber.effectTag`中。


> 你可以从[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactSideEffectTags.js)看到`effectTag`对应的`DOM`操作


比如：


```typescript
// 通过二进制表示effectTag，可以方便的使用位操作为fiber.effectTag赋值多个effect。

// DOM需要插入到页面中
export const Placement = /*                */ 0b00000000000010;
// DOM需要更新
export const Update = /*                   */ 0b00000000000100;
// DOM需要插入到页面中并更新
export const PlacementAndUpdate = /*       */ 0b00000000000110;
// DOM需要删除
export const Deletion = /*                 */ 0b00000000001000;
```


那么，如果要通知`Renderer`将`Fiber节点`对应的`DOM`节点插入页面中，需要满足两个条件：

1. `fiber.stateNode`存在，即`Fiber节点`中保存了对应的`DOM`节点
2. `(fiber.effectTag & Placement) !== 0`，即`Fiber节点`存在`Placement effectTag`

我们知道，`mount`时，`fiber.stateNode === null`，且在`reconcileChildren`中调用的`mountChildFibers`不会为`Fiber节点`赋值`effectTag`。那么首屏渲染如何完成呢？ 针对第一个问题，`fiber.stateNode`会在`completeWork`中创建。第二个问题的答案十分巧妙：假设`mountChildFibers`也会赋值`effectTag`，那么可以预见`mount`时整棵 Fiber 树所有节点都会有`Placement effectTag`。那么`commit`阶段在执行`DOM`操作时每个节点都会执行一次插入操作，这样大量的`DOM`操作是极低效的。为了解决这个问题，在`mount`时只有`rootFiber`会赋值`Placement effectTag`，在`commit`阶段只会执行一次插入操作。


![FuLcsbmdRwcZCodGOlPpjfxxuSdi.png](https://image.1874.cool/1874-blog-images/dfa39b295801bad1fd95f545821921f7.png)


# completeWork


类似`beginWork`，`completeWork`也是针对不同`fiber.tag`调用不同的处理逻辑。


```typescript
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      return null;
    case ClassComponent: {
      // ...省略
      return null;
    }
    case HostRoot: {
      // ...省略
      updateHostContainer(workInProgress);
      return null;
    }
    case HostComponent: {
      // ...省略
      return null;
    }
  // ...省略
```


先重点关注页面渲染所必须的`HostComponent`（即原生`DOM`组件对应的`Fiber节点`）。


## 处理 HostComponent


和`beginWork`一样，是根据`current === null ?`判断是`mount`还是`update`。 同时针对`HostComponent`，判断`update`时我们还需要考虑`workInProgress.stateNode != null ?`（即该`Fiber节点`是否存在对应的`DOM`节点）。


```typescript
case HostComponent: {
  popHostContext(workInProgress);
  const rootContainerInstance = getRootHostContainer();
  const type = workInProgress.type;

  if (current !== null && workInProgress.stateNode != null) {
    // update的情况
    // ...省略
  } else {
    // mount的情况
    // ...省略
  }
  return null;
}
```


## update 时


当`update`时，`Fiber节点`已经存在对应`DOM`节点，所以不需要生成`DOM`节点。需要做的主要是处理`props`，比如：

- `onClick`、`onChange`等回调函数的注册
- 处理`style prop`
- 处理`DANGEROUSLY_SET_INNER_HTML prop`
- 处理`children prop`

去掉一些当前不需要关注的功能（比如`ref`）。可以看到最主要的逻辑是调用`updateHostComponent`方法。


```typescript
if (current !== null && workInProgress.stateNode != null) {
  // update的情况
  updateHostComponent(
    current,
    workInProgress,
    type,
    newProps,
    rootContainerInstance
  );
}
```


```typescript
updateHostComponent = function(
    current: Fiber,
    workInProgress: Fiber,
    type: Type,
    newProps: Props,
    rootContainerInstance: Container,
  ) {
    // If we have an alternate, that means this is an update and we need to
    // schedule a side-effect to do the updates.
    const oldProps = current.memoizedProps;
    if (oldProps === newProps) {
      // In mutation mode, this is sufficient for a bailout because
      // we won't touch this node even if children changed.
      return;
    }

    // If we get updated because one of our children updated, we don't
    // have newProps so we'll have to reuse them.
    // TODO: Split the update API as separate for the props vs. children.
    // Even better would be if children weren't special cased at all tho.
    const instance: Instance = workInProgress.stateNode;
    const currentHostContext = getHostContext();
    // TODO: Experiencing an error where oldProps is null. Suggests a host
    // component is hitting the resume path. Figure out why. Possibly
    // related to `hidden`.
    const updatePayload = prepareUpdate(
      instance,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
      currentHostContext,
    );
    // TODO: Type this specific to this type of component.
    workInProgress.updateQueue = (updatePayload: any);
    // If the update payload indicates that there is a change or if there
    // is a new ref we mark this as an update. All the work is done in commitWork.
    if (updatePayload) {
      markUpdate(workInProgress);
    }
  };
```


在`updateHostComponent`内部，被处理完的`props`会被赋值给`workInProgress.updateQueue`，并最终会在`commit`阶段被渲染在页面上。


```typescript
workInProgress.updateQueue = (updatePayload: any);
```


其中`updatePayload`为数组形式，他的偶数索引的值为变化的`prop key`，奇数索引的值为变化的`prop value`。


## mount 时


同样，我们省略了不相关的逻辑。可以看到，`mount`时的主要逻辑包括三个：

- 为`Fiber节点`生成对应的`DOM`节点
- 将`子孙DOM节点`插入刚生成的`DOM`节点中
- 与`update`逻辑中的`updateHostComponent`类似的处理`props`的过程

```typescript
// mount的情况

// ...省略服务端渲染相关逻辑

const currentHostContext = getHostContext();
// 为fiber创建对应DOM节点
const instance = createInstance(
  type,
  newProps,
  rootContainerInstance,
  currentHostContext,
  workInProgress
);
// 将子孙DOM节点插入刚生成的DOM节点中
appendAllChildren(instance, workInProgress, false, false);
// DOM节点赋值给fiber.stateNode
workInProgress.stateNode = instance;

// 与update逻辑中的updateHostComponent类似的处理props的过程
if (
  finalizeInitialChildren(
    instance,
    type,
    newProps,
    rootContainerInstance,
    currentHostContext
  )
) {
  markUpdate(workInProgress);
}
```


由于`mount`时只会在`rootFiber`存在`Placement effectTag`。那么`commit`阶段是如何通过一次插入`DOM`操作（对应一个`Placement effectTag`）将整棵`DOM`树插入页面的呢？ 原因就在于`completeWork`中的`appendAllChildren`方法。 由于`completeWork`属于“归”阶段调用的函数，每次调用`appendAllChildren`时都会将已生成的子孙`DOM`节点插入当前生成的`DOM`节点下。那么当“归”到`rootFiber`时，我们已经有一个构建好的离屏`DOM`树。


## effectList


至此`render`阶段的绝大部分工作就完成了。 还有一个问题：作为`DOM`操作的依据，`commit`阶段需要找到所有有`effectTag`的`Fiber`节点并依次执行`effectTag`对应操作。难道需要在`commit`阶段再遍历一次`Fiber树`寻找`effectTag !== null`的`Fiber`节点么？ 这显然是很低效的。 为了解决这个问题，在`completeWork`的上层函数`completeUnitOfWork`中，每个执行完`completeWork`且存在`effectTag`的`Fiber`节点会被保存在一条被称为`effectList`的单向链表中。 `effectList`中第一个`Fiber`节点保存在`fiber.firstEffect`，最后一个元素保存在`fiber.lastEffect`。 类似`appendAllChildren`，在“归”阶段，所有有`effectTag`的`Fiber`节点都会被追加在`effectList`中，最终形成一条以`rootFiber.firstEffect`为起点的单向链表。


```typescript
                       nextEffect         nextEffect
rootFiber.firstEffect -----------> fiber -----------> fiber
```


这样，在`commit`阶段只需要遍历`effectList`就能执行所有 effect 了。


> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1744)看到这段代码逻辑。


## 流程结尾


![FqfSwmibF4takmueZ3r0RWASaKS3.png](https://image.1874.cool/1874-blog-images/e579de6448a10a7af9392868835c922d.png)


至此，`render`阶段全部工作完成。在`performSyncWorkOnRoot`函数中`fiberRootNode`被传递给`commitRoot`方法，开启`commit`阶段工作流程。


```text
commitRoot(root);
```


> 代码见这里。

