# 浅析 React 状态更新与性能优化

## 状态更新

React 中有许多触发状态更新的方法，比如：

1. ReactDOM.createRoot，对应 HostRoot

2. this.setState，对应 ClassComponent

3. this.forceUpdate，对应 ClassComponent

4. useState，对应 FunctionComponent

5. useReducer，对应 FunctionComponent

状态更新通常始于事件交互，事件会在 React 的事件系统中传播，不同事件触发的更新拥有不同的优先级。

更新对应了数据结构的 Update，它将参与计算 state。

（待补充。。）

## 性能优化

React 提供了多个与性能优化有关的 API，如：

1. shouldComponentUpdate

2. PureComponent

3. React.memo

4. useMemo、useCallback

以上部分是将性能优化的相关工作交给开发者自行完成，

除此之外，React 内部有完整的运行时优化策略，开发者调用性能优化 API 的本质就是命中上述策略。

那么从开发者的角度出发，性能优化有 2 个方向：

1. 编写符合性能优化策略的组件，命中策略

2. 调用性能优化 API，命中策略

### eagerState 策略

如果某个状态更新前后没有发生变化，则可以跳过后续更新流程。跳过指的是不会再进入 schedule 阶段，自然也不会进入 render 阶段。

但是在第一次更新 state 的时候仍然会进入 render，这是因为 fiberNode 分为 current 和 workInProgress 两种（双缓存），进入 commit 阶段后会执行互换，而根据 eagerState 的判断逻辑，需要两者同时满足条件才能命中。

### bailout 策略

命中 bailout 策略表示子 fiberNode 没有变化，可以复用。

组件的变化是由自变量产生的，包括 state、props、context。

bailout 策略需要同时满足以下 3 个条件：

1. oldProps === newProps

这里注意是全等比较，假如父组件的 render 触发了导致子组件的 props 重新创建，那么也不能命中策略。

只有当父 FiberNode 命中 bailout 策略，复用子 FiberNode，oldProps 才和 newProps 全等。

2. Legacy Context(旧的 Context)没有变化

3. FiberNode.type 没有变化

如果子组件在父组件中通过函数定义的，也无法命中优化策略。

4. 当前 FiberNode 没有更新发生

---

同时 bailout 策略有两种优化程度：

1. 复用子 fiberNode

2. 跳过子树的 beginWork

命中 bailout 策略后，会进一步判断“优化可以进行到何种程度”，当子组件不存在更新时，可以完全跳过 beginWork

而对于 Context API，即使根组件命中 bailout 策略，它也不会跳过 beginWork 流程，这是因为 Context 还有向下寻找 Consumer 的过程

### 对日常开发的启示

eagerState 策略的条件比较苛刻，开发时不必强求，更多的时候在不使用性能优化 API 的情况下，我们应该追求写出满足 bailout 条件的组件。

具体的做法是：

**将可变部分与不变部分分离，使不变的部分能够命中 bailout 策略**

可变部分指的是包含三类自变量：state, props, context

同时应该注意使根节点的 `oldProps === newProps`，在必要的情况下可以使用性能优化 API 把深比较变为浅比较

只有根组件命中了 bailout 策略，挂载在它之下的符合性能优化条件的组件才能命中 bailout 策略

做一个类比，如果将性能优化比作治病，

“编写符合性能优化条件的组件”相当于药方，

“使用性能优化 API 的组件”相当于药引子，

只有足量的药方（满足性能优化条件的组件子树）加恰到好处的药引子（在子树根节点这样的关键位置使用性能优化 API），

才能药到病除。
