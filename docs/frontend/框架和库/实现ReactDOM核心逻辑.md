# 实现 ReactDOM 核心逻辑

`React` 的 `Renderer` 主要是通过 `react-reconciler` 实现的。

在 Reconciler 的工作流程中，采用了 DFS 的顺序构建了 Wip Filber Tree，整个过程划分为“递”和“归”的阶段，分别对应 beginWork 和 completeWork。

beginWork 会根据当前的 fiberNode 创建下一级的 fiberNode，在 update 时标记 Placement（新增、移动），ChildDeletion（删除）。completeWork 在 mount 阶段时会创建 DOM Tree 初始化属性，在 update 时标记 Update（属性更新），最终执行 flags 冒泡。

下面借助`react-reconciler`实现一个`customRenderer.js`

**骨架搭建**

```jsx
import ReactReconciler from 'react-reconciler'

const hostConfig = {}

const ReactReconcilerInst = ReactReconciler(hostConfig)

export default {
  render: (reactElement, domElement, callback) => {
    if (!domElement._rootContainer) {
      document._rootContainer = ReactReconcilerInst.createContainer(
        domElement,
        false
      )
    }
    return ReactReconsilerInst.updateContainer(
      reactElement,
      domElement._rootContainer,
      null,
      callback
    )
  }
}
```

**更改入口文件**

```jsx
import ReactDOM from 'react-dom'
import CustomRenderer from './customRenderer'

CustomRenderer.render(<App />, document.getElementById('root'))
```

**填充 hostConfig，避免缺失方法导致报错**

```js
const hostConfig = {
  supportMutation: true,
  getRootHostContext() {},
  getChildHostContext() {},
  appendChild() {},
  removeChild() {},
  commitUpdate() {},
  commitTextUpdate() {},
  createInstance() {},
  createTextInstance() {}
  // ...
}
```

**需要重点实现的方法**

```js
const hostConfig = {
  /**
   * 创建DOM元素
   */
  createInstance(
    type,
    newProps,
    rootContainerInstance,
    _currentHostContext,
    workInProgress
  ) {
    const domElement = document.createElement(type)
    Object.keys(newProps).forEach(propName => {
      const propValue = newProps[propName]
      if (propName === 'children') {
        if (typeof propValue === 'string' || typeof propValue === 'number') {
          domElement.textContent = propValue
        }
      } else if (propName === 'onClick') {
        domElement.addEventListener('click', propValue)
      } else if (propName === 'className') {
        domElement.setAttribute('class', propValue)
      } else {
        domElement.setAttribute(propName, propValue)
      }
    })
    return domElement
  },
  /**
   * 创建文本节点
   */
  createTextInstance(text) {
    return document.createTextNode(text)
  },
  /**
   * 插入节点
   */
  appendInitialChild(parent, child) {
    parent.appendChild(child)
  },
  appendChild(parent, child) {
    parent.appendChild(child)
  },
  /**
   * 更新节点
   */
  commitUpdate(domElement, updatePayload, type, oldProps, newProps) {
    Object.keys(newProps).forEach(propName => {
      const propValue = newProps[propName]
      if (propName === 'children') {
        if (typeof propValue === 'string' || typeof propValue === 'number') {
          domElement.textContent = propValue
        }
      } else {
        domElement.setAttirbute(propName, propValue)
      }
    })
  },
  commitTextUpdate(textInstance, oldText, newText) {
    textInstance.text = newText
  },
  /**
   * 移除节点
   */
  removeChild(parentInstance, child) {
    parentInstance.removeChild(child)
  }
}
```
