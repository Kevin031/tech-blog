# Vue 实现 nextTick 的原理解析

在`Vue`组件的生命周期中，视图更新的`update`方法是在微任务中执行的，这样就避免了在同步代码的执行过程中频繁地触发视图更新。

具体的实现方式是，在组件的渲染`effect`中，传入了一个`scheduler`接管了`effect`函数体的触发时机，在`scheduler`的执行过程中，将`effect`任务通过`Promise.resolve`加入到微队列，在同步任务执行完之后再进行调用，这个过程就是通过 nextTick 实现的。

同时 `nextTick` 也提供给组件方法调用，这是为了方便我们在组件同步逻辑执行后获取到渲染后视图的最新状态。

以下是部分实现的伪代码：

```js
let queue = [];
let isFlushPending = false;

// 加入微队列的具体实现
// 提供2种调用方式
function nextTick(cb) {
  return cb ? Promise.resolve().then(cb) : Promise.resolve();
}

/**
 * 加入微队列
 */
function flushJobs() {
  if (!isFlushPending) return;
  nextTick(() => {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
      job && job();
    }
  });
}

/**
 * 记录任务，去重
 */
function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  flushJobs();
}

// patch方法用于diff和更新视图DOM
function setupRenderEffect(instance) {
  instance.update = effect(
    () => {
      if (!instance.isMounted) {
        const vnode = instance.render();
        // 挂载逻辑
        patch(null, vnode);
      } else {
        const nextVNode = instance.render();
        patch(instance.vnode, nextVnode);
        instance.vnode = nextVnode;
      }
    },
    {
      scheduler() {
        queueJobs(instance.update);
      },
    }
  );
}
```
