# React 事件系统的简易实现

## 实现合成事件对象

```js
class SyntheticEvent {
  constructor(e) {
    this.nativeEvent = e
  }

  stopPropagation() {
    this._stopPropagation = true

    if (this.nativeEvent.stopPropagation) {
      this.nativeEvent.stopPropagation()
    }
  }
}
```

之所以要使用合成事件，有以下几大原因：

1. 方便处理事件优先级

2. 定制事件名：onXXX

3. 兼容主流浏览器 API

4. 定制事件行为，如 onChange

## 实现事件传播机制

1. 在根元素绑定对应的事件回调，所有子孙元素触发该类事件都会委托给根元素的事件回调处理

```js
// 创建方法
const addEvent = (container, type) => {
  container.addEventListener(type, e => {
    dispatchEvent(e, type.toUpperCase(), container)
  })
}

// 注册事件
const root = document.querySelector('#root')
ReactDOM.createRoot(root).render(jsx)
addEvent(root, 'click')

// 根节点的事件回调
const dispatchEvent = (e, type, container) => {
  const se = new SyntheticEvent(e)
  const ele = e.target

  let fiber // 通过DOM元素找到对应的fiberNode
  for (let prop in ele) {
    if (prop.toLowerCase().includes('fiber')) {
      fiber = ele[prop]
    }
  }

  // 收集路径中该事件的所有回调函数
  const paths = collectPaths(type, fiber)

  // 实现捕获
  triggerEventFlow(paths, type + 'CAPTURE', se)

  // 实现冒泡
  if (!se._stopPropagation) {
    triggerEventFlow(paths.reverse(), type, se)
  }
}
```

## 收集路径中的事件回调函数

```js
const collectPaths = (type, begin) => {
  const paths = []

  // tag为3表示HostFiber，这里一直遍历到顶层
  while (begin.tag !== 3) {
    const { memoizedProps, tag } = begin
    // 5代表FiberNode
    if (tag === 5) {
      const eventName = ('on' + type).toUpperCase() // 构造事件回调名
      if (memoizedProps && Object.keys(memoizedProps).includes(eventName)) {
        const pathNode = {}
        pathNode[type.toUpperCase()] = memoizedProps[eventName]
        paths.push(pathNode)
      }
      begin = begin.return
    }
  }
}

// 返回的数据结构如下
// [
//   {
//     CLICK: function ONCLICK() {},
//   },
//   {
//     CLICK: function ONCLICK() {},
//   },
// ];
```

## 捕获和冒泡阶段的实现

```js
const triggerEventFlow = (paths, type, se) => {
  for (let i = paths.length; i >= 0; i--) {
    const pathNode = paths[0]
    const callback = pathNode[type]

    if (callback) {
      // 存在回调函数，传入合成事件执行
      callback.call(null, se)
    }
    if (se._stopPropagation) {
      break
    }
  }
}
```
