---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2022-02-19 00:00:00'
type: Post
slug: react-commit
配置类型:
  type: string
  string: 文档
summary: ''
更新时间: '2023-08-26T15:26:00.000Z'
title: 第四章 React架构-commit阶段
category: 学习笔记
tags:
  - 自顶向下学习React源码
  - React
status: Draft
urlname: dcac3fa7-a41d-42ed-837b-79311b3e6e3c
updated: '2023-08-26 23:26:00'
---

`commitRoot`方法是`commit`阶段工作的起点。`fiberRootNode`会作为传参。


```typescript
commitRoot(root);
```


在`rootFiber.firstEffect`上保存了一条需要执行副作用的`Fiber节点`的单向链表`effectList`，这些`Fiber节点`的`updateQueue`中保存了变化的`props`。 这些副作用对应的`DOM`操作在`commit`阶段执行。 除此之外，一些生命周期钩子（比如`componentDidXXX`）、`hook`（比如`useEffect`）需要在`commit`阶段执行。 `commit`阶段的主要工作（即`Renderer`的工作流程）分为三部分：

- `before mutation`阶段（执行`DOM操作前`）
- `mutation`阶段（执行`DOM操作`）
- `layout`阶段（执行`DOM操作后`）

> 可以从[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2001)看到 commit 阶段的完整代码。


在`before mutation`阶段之前和`layout`阶段之后还有一些额外工作，涉及到比如`useEffect`的触发、优先级相关的重置、`ref`的绑定/解绑。


# 流程概述


## before mutation 之前


`commitRootImpl`方法中直到第一句`if (firstEffect !== null)`之前属于`before mutation`之前。


```typescript
do {
  // 触发useEffect回调与其他同步任务。由于这些任务可能触发新的渲染，
  // 所以这里要一直遍历执行直到没有任务
  flushPassiveEffects();
} while (rootWithPendingPassiveEffects !== null);

// root指 fiberRootNode
// root.finishedWork指当前应用的rootFiber
const finishedWork = root.finishedWork;

// 凡是变量名带lane的都是优先级相关
const lanes = root.finishedLanes;
if (finishedWork === null) {
  return null;
}
root.finishedWork = null;
root.finishedLanes = NoLanes;

// 重置Scheduler绑定的回调函数
root.callbackNode = null;
root.callbackId = NoLanes;

let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);
// 重置优先级相关变量
markRootFinished(root, remainingLanes);

// 清除已完成的discrete updates，例如：用户鼠标点击触发的更新。
if (rootsWithPendingDiscreteUpdates !== null) {
  if (
    !hasDiscreteLanes(remainingLanes) &&
    rootsWithPendingDiscreteUpdates.has(root)
  ) {
    rootsWithPendingDiscreteUpdates.delete(root);
  }
}

// 重置全局变量
if (root === workInProgressRoot) {
  workInProgressRoot = null;
  workInProgress = null;
  workInProgressRootRenderLanes = NoLanes;
} else {
}

// 将effectList赋值给firstEffect
// 由于每个fiber的effectList只包含他的子孙节点
// 所以根节点如果有effectTag则不会被包含进来
// 所以这里将有effectTag的根节点插入到effectList尾部
// 这样才能保证有effect的fiber都在effectList中
let firstEffect;
if (finishedWork.effectTag > PerformedWork) {
  if (finishedWork.lastEffect !== null) {
    finishedWork.lastEffect.nextEffect = finishedWork;
    firstEffect = finishedWork.firstEffect;
  } else {
    firstEffect = finishedWork;
  }
} else {
  // 根节点没有effectTag
  firstEffect = finishedWork.firstEffect;
}
```


可以看到，`before mutation`之前主要做一些变量赋值，状态重置的工作。 这一长串代码我们只需要关注最后赋值的`firstEffect`，在`commit`的三个子阶段都会用到他。


## layout 之后


```typescript
const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

// useEffect相关
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
} else {
}

// 性能优化相关
if (remainingLanes !== NoLanes) {
  if (enableSchedulerTracing) {
    // ...
  }
} else {
  // ...
}

// 性能优化相关
if (enableSchedulerTracing) {
  if (!rootDidHavePassiveEffects) {
    // ...
  }
}

// ...检测无限循环的同步任务
if (remainingLanes === SyncLane) {
  // ...
}

// 在离开commitRoot函数前调用，触发一次新的调度，确保任何附加的任务被调度
ensureRootIsScheduled(root, now());

// ...处理未捕获错误及老版本遗留的边界问题

// 执行同步任务，这样同步任务不需要等到下次事件循环再执行
// 比如在 componentDidMount 中执行 setState 创建的更新会在这里被同步执行
// 或useLayoutEffect
flushSyncCallbackQueue();

return null;
```


> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2195)看到这段代码


主要包括三点内容：

1. useEffect 相关的处理。
2. 性能追踪相关。

	> 源码里有很多和interaction相关的变量。他们都和追踪React渲染时间、性能相关，[Profiler API](https://zh-hans.reactjs.org/docs/profiler.html)和[DevTools](https://github.com/facebook/react-devtools/pull/1069)中使用。可以在这里看到[interaction的定义](https://gist.github.com/bvaughn/8de925562903afd2e7a12554adcdda16#overview)

3. 在 commit 阶段会触发一些生命周期钩子（如 componentDidXXX）和 hook（如 useLayoutEffect、useEffect）。

在这些回调方法中可能触发新的更新，新的更新会开启新的 render-commit 流程。


# before mutation 阶段


`Renderer`工作的阶段被称为`commit`阶段。`commit`阶段可以分为三个子阶段：

- before mutation 阶段（执行 DOM 操作前）
- mutation 阶段（执行 DOM 操作）
- layout 阶段（执行 DOM 操作后）

`before mutation`阶段的代码很短，整个过程就是遍历`effectList`并调用`commitBeforeMutationEffects`函数处理。


> 这部分[源码在这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2104-L2127)，为了增加可读性，示例代码中删除了不相关的逻辑。


```typescript
// 保存之前的优先级，以同步优先级执行，执行完毕后恢复之前优先级
const previousLanePriority = getCurrentUpdateLanePriority();
setCurrentUpdateLanePriority(SyncLanePriority);

// 将当前上下文标记为CommitContext，作为commit阶段的标志
const prevExecutionContext = executionContext;
executionContext |= CommitContext;

// 处理focus状态
focusedInstanceHandle = prepareForCommit(root.containerInfo);
shouldFireAfterActiveInstanceBlur = false;

// beforeMutation阶段的主函数
commitBeforeMutationEffects(finishedWork);

focusedInstanceHandle = null;
```


## commitBeforeMutationEffects


```typescript
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    const current = nextEffect.alternate;

    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
      // ...focus blur相关
    }

    const effectTag = nextEffect.effectTag;

    // 调用getSnapshotBeforeUpdate
    if ((effectTag & Snapshot) !== NoEffect) {
      commitBeforeMutationEffectOnFiber(current, nextEffect);
    }

    // 调度useEffect
    if ((effectTag & Passive) !== NoEffect) {
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        scheduleCallback(NormalSchedulerPriority, () => {
          flushPassiveEffects();
          return null;
        });
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```


整体可以分为三部分：

- 处理`DOM`节点渲染/删除后的 `autoFocus`、`blur` 逻辑。
- 调用`getSnapshotBeforeUpdate`生命周期钩子。
- 调度`useEffect`。

## 调用`getSnapshotBeforeUpdate`


`commitBeforeMutationEffectOnFiber`是`commitBeforeMutationLifeCycles`的别名。 在该方法内会调用`getSnapshotBeforeUpdate`。


> 你可以在[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCommitWork.old.js#L222)看到这段逻辑


从`React v16`开始，`componentWillXXX`钩子前增加了`UNSAFE_`前缀。 究其原因，是因为`Stack Reconciler`重构为`Fiber Reconciler`后，`render`阶段的任务可能中断/重新开始，对应的组件在`render`阶段的生命周期钩子（即`componentWillXXX`）可能触发多次。 这种行为和`React v15`不一致，所以标记为`UNSAFE_`。


> 更详细的解释参照[这里](https://juejin.im/post/6847902224287285255#comment)


为此，`React`提供了替代的生命周期钩子`getSnapshotBeforeUpdate`。 我们可以看见，`getSnapshotBeforeUpdate`是在`commit`阶段内的`before mutation`阶段调用的，由于`commit`阶段是同步的，所以不会遇到多次调用的问题。


## 调度`useEffect`


在这几行代码内，`scheduleCallback`方法由`Scheduler`模块提供，用于以某个优先级异步调度一个回调函数。


```typescript
// 调度useEffect
if ((effectTag & Passive) !== NoEffect) {
  if (!rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = true;
    scheduleCallback(NormalSchedulerPriority, () => {
      // 触发useEffect
      flushPassiveEffects();
      return null;
    });
  }
}
```


在此处，被异步调度的回调函数就是触发`useEffect`的方法`flushPassiveEffects`。 我们接下来讨论`useEffect`如何被异步调度，以及为什么要异步（而不是同步）调度。


### 如何异步调度


在`flushPassiveEffects`方法内部会从全局变量`rootWithPendingPassiveEffects`获取`effectList`。 关于`flushPassiveEffects`的具体讲解参照 useEffect 与 useLayoutEffect 一节 `effectList`中保存了需要执行副作用的`Fiber`节点。其中副作用包括：

- 插入`DOM`节点（`Placement`）
- 更新`DOM`节点（`Update`）
- 删除`DOM`节点（`Deletion`）

除此外，当一个`FunctionComponent`含有`useEffect`或`useLayoutEffect`，他对应的`Fiber`节点也会被赋值`effectTag`。


> 你可以从[这里](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactHookEffectTags.js)看到hook相关的`effectTag`


在`flushPassiveEffects`方法内部会遍历`rootWithPendingPassiveEffects`（即`effectList`）执行`effect`回调函数。 如果在此时直接执行，`rootWithPendingPassiveEffects === null`。 `layout`之后的代码片段中会根据`rootDoesHavePassiveEffects === true?`决定是否赋值`rootWithPendingPassiveEffects`。


```typescript
const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
}
```


所以整个`useEffect`异步调用分为三步：

1. `before mutation`阶段在`scheduleCallback`中调度`flushPassiveEffects`
2. `layout`阶段之后将`effectList`赋值给`rootWithPendingPassiveEffects`
3. `scheduleCallback`触发`flushPassiveEffects`，`flushPassiveEffects`内部遍历`rootWithPendingPassiveEffects`

### 为什么需要异步调用


摘录自`React`文档[effect 的执行时机](https://zh-hans.reactjs.org/docs/hooks-reference.html#timing-of-effects)：


> 与 componentDidMount、componentDidUpdate 不同的是，在浏览器完成布局与绘制之后，传给 useEffect 的函数会延迟调用。这使得它适用于许多常见的副作用场景，比如设置订阅和事件处理等情况，因此不应在函数中执行阻塞浏览器更新屏幕的操作。


可见，`useEffect`异步执行的原因主要是防止同步执行时阻塞浏览器渲染。


# mutation 阶段


类似`before mutation`阶段，`mutation`阶段也是遍历`effectList`，执行函数。这里执行的是`commitMutationEffects`。


```typescript
nextEffect = firstEffect;
do {
  try {
    commitMutationEffects(root, renderPriorityLevel);
  } catch (error) {
    invariant(nextEffect !== null, "Should be working on an effect.");
    captureCommitPhaseError(nextEffect, error);
    nextEffect = nextEffect.nextEffect;
  }
} while (nextEffect !== null);
```


## commitMutationEffects


```typescript
function commitMutationEffects(
  root: FiberRoot,
  renderPriorityLevel: ReactPriorityLevel
) {
  // 遍历effectList
  while (nextEffect !== null) {
    setCurrentDebugFiberInDEV(nextEffect);

    const flags = nextEffect.flags;

    // 是否需要重制文本节点
    if (flags & ContentReset) {
      commitResetTextContent(nextEffect);
    }
    // 是否有ref的更新
    if (flags & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
      if (enableScopeAPI) {
        // TODO: This is a temporary solution that allowed us to transition away
        // from React Flare on www.
        if (nextEffect.tag === ScopeComponent) {
          commitAttachRef(nextEffect);
        }
      }
    }

    // Placement：插入dom
    // Update：更新属性
    // Deletion：删除dom
    // Hydrating：SSR相关
    const primaryFlags = flags & (Placement | Update | Deletion | Hydrating);
    switch (primaryFlags) {
      case Placement: {
        commitPlacement(nextEffect);
        nextEffect.flags &= ~Placement;
        break;
      }
      case PlacementAndUpdate: {
        // Placement
        commitPlacement(nextEffect);
        nextEffect.flags &= ~Placement;

        // Update
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Hydrating: {
        nextEffect.flags &= ~Hydrating;
        break;
      }
      case HydratingAndUpdate: {
        nextEffect.flags &= ~Hydrating;

        // Update
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Deletion: {
        commitDeletion(root, nextEffect, renderPriorityLevel);
        break;
      }
    }

    resetCurrentDebugFiberInDEV();
    nextEffect = nextEffect.nextEffect;
  }
}
```


`commitMutationEffects`会遍历`effectList`，对每个`Fiber`节点执行如下三个操作：

1. 根据`ContentReset effectTag`重置文字节点
2. 更新`ref`
3. 根据`effectTag`分别处理，其中`effectTag`包括(`Placement` | `Update` | `Deletion` | `Hydrating`)

## Placement effect


当`Fiber`节点含有`Placement effectTag`，意味着该`Fiber`节点对应的`DOM`节点需要插入到页面中。 调用的方法为`commitPlacement`。


```typescript
function commitPlacement(finishedWork: Fiber): void {
  // 是否支持Mutation，dom环境是支持的
  if (!supportsMutation) {
    return;
  }

  const parentFiber = getHostParentFiber(finishedWork);

  let parent;
  let isContainer;
  const parentStateNode = parentFiber.stateNode;
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case FundamentalComponent:
      if (enableFundamentalAPI) {
        parent = parentStateNode.instance;
        isContainer = false;
      }
    // eslint-disable-next-line-no-fallthrough
    default:
      invariant(
        false,
        "Invalid host parent fiber. This error is likely caused by a bug " +
          "in React. Please file an issue."
      );
  }
  if (parentFiber.flags & ContentReset) {
    resetTextContent(parent);
    parentFiber.flags &= ~ContentReset;
  }
  // 找到Host类型的兄弟节点
  // 插入有两种方式：1。找到兄弟节点，执行insertBefore插入节点
  // 2.找到父节点，执行AppendChild插入节点
  const before = getHostSibling(finishedWork);
  // We only have the top Fiber that was inserted but we need to recurse down its
  // children to find all the terminal nodes.
  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}
```


该方法所做的工作分为三步：

1. 获取父级`DOM`节点。其中`finishedWork`为传入的`Fiber`节点。

```typescript
const parentFiber = getHostParentFiber(finishedWork);
// 父级DOM节点
const parentStateNode = parentFiber.stateNode;
```

1. 获取`Fiber`节点的`DOM`兄弟节点

```typescript
const before = getHostSibling(finishedWork);
```

1. 根据`DOM`兄弟节点是否存在决定调用`parentNode.insertBefore`或`parentNode.appendChild`执行`DOM`插入操作。

```typescript
// parentStateNode是否是rootFiber
if (isContainer) {
  insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
} else {
  insertOrAppendPlacementNode(finishedWork, before, parent);
}
```


值得注意的是，`getHostSibling`（获取兄弟`DOM`节点）的执行很耗时，当在同一个父`Fiber`节点下依次执行多个插入操作，`getHostSibling`算法的复杂度为指数级。 这是由于`Fiber`节点不只包括`HostComponent`，所以`Fiber`树和渲染的`DOM`树节点并不是一一对应的。要从`Fiber`节点找到`DOM`节点很可能跨层级遍历。 考虑如下例子：


```typescript
function Item() {
  return <li><li>;
}

function App() {
  return (
    <div>
      <Item/>
    </div>
  )
}

ReactDOM.render(<App/>, document.getElementById('root'));
```


对应的`Fiber`树和`DOM`树结构为：


```text
// Fiber树
child      child      child       child
rootFiber -----> App -----> div -----> Item -----> li

// DOM树
#root ---> div ---> li
```


当在`div`的子节点`Item`前插入一个新节点`p`，即`App`变为：


```typescript
function App() {
  return (
    <div>
      <p></p>
      <Item />
    </div>
  );
}
```


对应的`Fiber`树和`DOM`树结构为：


```text
// Fiber树
          child      child      child
rootFiber -----> App -----> div -----> p
                                       | sibling       child
                                       | -------> Item -----> li
// DOM树
#root ---> div ---> p
             |
               ---> li
```


此时`DOM`节点 `p`的兄弟节点为`li`，而`Fiber`节点 `p`对应的兄弟`DOM`节点为：


```text
fiberP.sibling.child
```


即`fiber p`的兄弟`fiber Item`的子`fiber li`


## Update effect


当`Fiber`节点含有`Update effectTag`，意味着该`Fiber`节点需要更新。调用的方法为`commitWork`，他会根据`Fiber.tag`分别处理。


```typescript
function commitWork(current: Fiber | null, finishedWork: Fiber): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent:
    case Block: {
      // 这些都是和functionComponent相关的
      if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        finishedWork.mode & ProfileMode
      ) {
        try {
          startLayoutEffectTimer();
          // useLayout的销毁函数
          commitHookEffectListUnmount(HookLayout | HookHasEffect, finishedWork);
        } finally {
          recordLayoutEffectDuration(finishedWork);
        }
      } else {
        commitHookEffectListUnmount(HookLayout | HookHasEffect, finishedWork);
      }
      return;
    }
    case ClassComponent: {
      return;
    }
    // dom节点相关
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      if (instance != null) {
        // Commit the work prepared earlier.
        const newProps = finishedWork.memoizedProps;
        const oldProps = current !== null ? current.memoizedProps : newProps;
        const type = finishedWork.type;
        const updatePayload: null | UpdatePayload = (finishedWork.updateQueue: any);
        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          // 更新dom的属性
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork,
          );
        }
      }
      return;
    }
    case HostText: {
      const textInstance: TextInstance = finishedWork.stateNode;
      const newText: string = finishedWork.memoizedProps;
      const oldText: string =
        current !== null ? current.memoizedProps : newText;
      commitTextUpdate(textInstance, oldText, newText);
      return;
    }
    case HostRoot: {
      if (supportsHydration) {
        const root: FiberRoot = finishedWork.stateNode;
        if (root.hydrate) {
          // We've just hydrated. No need to hydrate again.
          root.hydrate = false;
          commitHydratedContainer(root.containerInfo);
        }
      }
      return;
    }
    // ...
  }
}
```


这里我们主要关注`FunctionComponent`和`HostComponent`。


### FunctionComponent mutation


当`fiber.tag`为`FunctionComponent`，会调用`commitHookEffectListUnmount`。该方法会遍历`effectList`，执行所有`useLayoutEffect hook`的销毁函数。


```typescript
function commitHookEffectListUnmount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // Unmount
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```


### HostComponent mutation


当`fiber.tag`为`HostComponent`，会调用`commitUpdate`。


```typescript
export function commitUpdate(
  domElement: Instance,
  updatePayload: Array<mixed>,
  type: string,
  oldProps: Props,
  newProps: Props,
  internalInstanceHandle: Object
): void {
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
}
```


最终会在`updateProperties`中的`updateDOMProperties`中将`render`阶段 `completeWork`中为`Fiber`节点赋值的`updateQueue`对应的内容渲染在页面上。


```typescript
function updateDOMProperties(
  domElement: Element,
  updatePayload: Array<any>,
  wasCustomComponentTag: boolean,
  isCustomComponentTag: boolean
): void {
  // TODO: Handle wasCustomComponentTag
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    // 处理 style
    if (propKey === STYLE) {
      setValueForStyles(domElement, propValue);
      // 处理 DANGEROUSLY_SET_INNER_HTML
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      setInnerHTML(domElement, propValue);
      // 处理 children
    } else if (propKey === CHILDREN) {
      setTextContent(domElement, propValue);
      // 处理剩余 props
    } else {
      setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
    }
  }
}
```


## Deletion effect


当`Fiber`节点含有`Deletion effectTag`，意味着该`Fiber`节点对应的`DOM`节点需要从页面中删除。调用的方法为`commitDeletion`。


> 你可以在[这里](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L1421)看到commitDeletion源码


这里主要关注`unmountHostComponents`中的`commitNestedUnmounts`中的`commitUnmount`方法


```typescript
function commitUnmount(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel,
): void {
  onCommitUnmount(current);

  switch (current.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent:
    case Block: {
      const updateQueue: FunctionComponentUpdateQueue | null = (current.updateQueue: any);
      if (updateQueue !== null) {
        const lastEffect = updateQueue.lastEffect;
        if (lastEffect !== null) {
          const firstEffect = lastEffect.next;

          let effect = firstEffect;
          do {
            const {destroy, tag} = effect;
            if (destroy !== undefined) {
              if ((tag & HookPassive) !== NoHookEffect) {
                // 当functionComponent被销毁时，useEffect的销毁函数也会被执行
                enqueuePendingPassiveHookEffectUnmount(current, effect);
              } else {
                if (
                  enableProfilerTimer &&
                  enableProfilerCommitHooks &&
                  current.mode & ProfileMode
                ) {
                  startLayoutEffectTimer();
                  safelyCallDestroy(current, destroy);
                  recordLayoutEffectDuration(current);
                } else {
                  safelyCallDestroy(current, destroy);
                }
              }
            }
            effect = effect.next;
          } while (effect !== firstEffect);
        }
      }
      return;
    }
    case ClassComponent: {
      safelyDetachRef(current);
      const instance = current.stateNode;
      if (typeof instance.componentWillUnmount === 'function') {
        // 会执行componentWillUnmount钩子函数
        safelyCallComponentWillUnmount(current, instance);
      }
      return;
    }
    case HostComponent: {
      // 解绑ref属性
      safelyDetachRef(current);
      return;
    }
    // ...
  }
}
```


该方法会执行如下操作：

1. 递归调用`Fiber`节点及其子孙`Fiber`节点中`fiber.tag`为`ClassComponent`的`componentWillUnmount`生命周期钩子，从页面移除`Fiber`节点对应`DOM`节点
2. 解绑`ref`
3. 调度`useEffect`的销毁函数

# layout 阶段


该阶段之所以称为`layout`，因为该阶段的代码都是在`DOM`渲染完成（`mutation`阶段完成）后执行的。 该阶段触发的生命周期钩子和`hook`可以直接访问到已经改变后的`DOM`，即该阶段是可以参与`DOM layout`的阶段。 与前两个阶段类似，`layout`阶段会遍历`effectList`，依次执行`commitLayoutEffects`。该方法的主要工作为“根据`effectTag`调用不同的处理函数处理`Fiber`并更新`ref`。 具体执行的函数是`commitLayoutEffects`。


```typescript
// commit阶段完成后，currentFiber就会指向已经渲染好的fiber
root.current = finishedWork;
nextEffect = firstEffect;
do {
  try {
    commitLayoutEffects(root, lanes);
  } catch (error) {
    invariant(nextEffect !== null, "Should be working on an effect.");
    captureCommitPhaseError(nextEffect, error);
    nextEffect = nextEffect.nextEffect;
  }
} while (nextEffect !== null);

nextEffect = null;
```


## commitLayoutEffects


```typescript
function commitLayoutEffects(root: FiberRoot, committedLanes: Lanes) {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;

    // 调用生命周期钩子和hook
    if (effectTag & (Update | Callback)) {
      const current = nextEffect.alternate;
      commitLayoutEffectOnFiber(root, current, nextEffect, committedLanes);
    }

    // 赋值ref
    if (effectTag & Ref) {
      commitAttachRef(nextEffect);
    }

    nextEffect = nextEffect.nextEffect;
  }
}
```


`commitLayoutEffects`一共做了两件事：

1. `commitLayoutEffectOnFiber`（调用生命周期钩子和`hook`相关操作）
2. `commitAttachRef`（赋值 `ref`）

## commitLayoutEffectOnFiber


`commitLayoutEffectOnFiber(commitLifeCycles)`方法会根据`fiber.tag`对不同类型的节点分别处理。


```typescript
function commitLifeCycles(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        finishedWork.mode & ProfileMode
      ) {
        try {
          startLayoutEffectTimer();
          commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
        } finally {
          recordLayoutEffectDuration(finishedWork);
        }
      } else {
        commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
      }

      schedulePassiveEffects(finishedWork);
      return;
    }
    case ClassComponent: {
      const instance = finishedWork.stateNode;
      if (finishedWork.flags & Update) {
        if (current === null) {
          if (
            enableProfilerTimer &&
            enableProfilerCommitHooks &&
            finishedWork.mode & ProfileMode
          ) {
            try {
              startLayoutEffectTimer();
              instance.componentDidMount();
            } finally {
              recordLayoutEffectDuration(finishedWork);
            }
          } else {
            instance.componentDidMount();
          }
        } else {
          const prevProps =
            finishedWork.elementType === finishedWork.type
              ? current.memoizedProps
              : resolveDefaultProps(finishedWork.type, current.memoizedProps);
          const prevState = current.memoizedState;
          if (
            enableProfilerTimer &&
            enableProfilerCommitHooks &&
            finishedWork.mode & ProfileMode
          ) {
            try {
              startLayoutEffectTimer();
              instance.componentDidUpdate(
                prevProps,
                prevState,
                instance.__reactInternalSnapshotBeforeUpdate,
              );
            } finally {
              recordLayoutEffectDuration(finishedWork);
            }
          } else {
            instance.componentDidUpdate(
              prevProps,
              prevState,
              instance.__reactInternalSnapshotBeforeUpdate,
            );
          }
        }
      }

      const updateQueue: UpdateQueue<
        *,
      > | null = (finishedWork.updateQueue: any);
      if (updateQueue !== null) {
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }
      return;
    }
    case HostRoot: {
      // TODO: I think this is now always non-null by the time it reaches the
      // commit phase. Consider removing the type check.
      const updateQueue: UpdateQueue<
        *,
      > | null = (finishedWork.updateQueue: any);
      if (updateQueue !== null) {
        let instance = null;
        if (finishedWork.child !== null) {
          switch (finishedWork.child.tag) {
            case HostComponent:
              instance = getPublicInstance(finishedWork.child.stateNode);
              break;
            case ClassComponent:
              instance = finishedWork.child.stateNode;
              break;
          }
        }
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }
      return;
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;

      if (current === null && finishedWork.flags & Update) {
        const type = finishedWork.type;
        const props = finishedWork.memoizedProps;
        commitMount(instance, type, props, finishedWork);
      }

      return;
    }
    // ...
  }
}
```

- 对于`FunctionComponent`及相关类型，他会调用`useLayoutEffect hook`的回调函数，调度`useEffect`的销毁与回调函数 > 相关类型指特殊处理后的`FunctionComponent`，比如`ForwardRef`、`React.memo`包裹的`FunctionComponent`

```typescript
switch (finishedWork.tag) {
    // 以下都是FunctionComponent及相关类型
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      // 执行useLayoutEffect的回调函数
      commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
      // 调度useEffect的销毁函数与回调函数
      schedulePassiveEffects(finishedWork);
      return;
    }
```


![FoDDpT2emLK3wR4FbtQ_6VWrT0HH.png](https://image.1874.cool/1874-blog-images/16d53b50b362380fe4743ff586ed4a99.png)


由于


```text
mutation
```


阶段会执行


```text
useLayoutEffect hook
```


的销毁函数。 结合这里我们可以发现，


```text
useLayoutEffect hook
```


从上一次更新的销毁函数调用到本次更新的回调函数调用是同步执行的。 而


```text
useEffect
```


则需要先调度，在


```text
Layout
```


阶段完成后再异步执行。 这就是


```text
useLayoutEffect
```


与


```text
useEffect
```


的区别。

- 对于`ClassComponent`，他会通过`current === null?`区分是`mount`还是`update`，调用[componentDidMount](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L538)或[componentDidUpdate](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L592)。

触发状态更新的`this.setState`如果赋值了第二个参数回调函数，也会在此时调用。


## commitAttachRef


> commitLayoutEffects会做的第二件事是commitAttachRef，获取DOM实例，更新ref。


```typescript
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    // 获取DOM实例
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }
    if (enableScopeAPI && finishedWork.tag === ScopeComponent) {
      instanceToUse = instance;
    }
    if (typeof ref === "function") {
      // 如果ref是函数形式，调用回调函数
      ref(instanceToUse);
    } else {
      // 如果ref是ref实例形式，赋值ref.current
      ref.current = instanceToUse;
    }
  }
}
```


## current Fiber 树切换


至此，整个 layout 阶段就结束了。 前面也讲过，在 layout 阶段开始之前，有这么一段代码：


```typescript
root.current = finishedWork;
```


由于在双缓存机制，`workInProgress Fiber`树在`commit`阶段完成渲染后会变为`current Fiber`树。这行代码的作用就是切换`fiberRootNode`指向的`current Fiber`树。 那么这行代码为什么在这里呢？（在`mutation`阶段结束后，`layout`阶段开始前。） 那是因为`componentWillUnmount`会在`mutation`阶段执行。此时`current Fiber`树还指向前一次更新的`Fiber`树，在生命周期钩子内获取的`DOM`还是更新前的。 而`componentDidMount`和`componentDidUpdate`会在 layout 阶段执行。此时`current Fiber`树需要指向更新后的`Fiber`树，在生命周期钩子内获取的`DOM`就是更新后的。

