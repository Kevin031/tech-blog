# UMD 模块的定义和实现

## 概念

所谓`UMD` (Universal Module Definition)，就是一种 javascript 通用模块定义规范，让你的模块能在 javascript**所有**运行环境中发挥作用。

也就是说，`UMD`能同时兼容`IIFE`(浏览器原生), `commonjs`, `AMD`, `CMD`

## 最简实现

这里以导出一个 name 对象为例

```js
function factory() {
  return {
    name: '我是一个umd模块'
  }
}
```

如果不考虑其它模块规范，仅仅作为全局属性，可以这么写

```js
;(function (root, factory) {
  root.umdModule = factory()
})(window, function () {
  return {
    name: '我是一个umd模块'
  }
})
```

导入方式

```js
window.onload = () => {
  const { name } = umdModule
}
```

接着，判断是否满足支持 commonjs 的环境

```js
;(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    // node环境，直接挂载到当前模块的exports
    // commonjs规范
    module.exports = factory()
  } else if (typeof define === 'function' && define.cmd) {
    // 使用了CMD规范，即require.js
    // require.js会全局定义一个define方法来接收模块
    define(function (require, exports, module) {
      module.exports = factory()
    })
  } else {
    root.umdModule = factory()
  }
})(this, function () {
  return {
    name: '我是一个umd模块'
  }
})
```

```js
// requirejs
const globalModule = {}

function require(name) {
  return globalModule[name]
}

function define(fn) {
  let module = {
    exports: null
  }
  let currentModule = fn(require, exports, module)
  Object.keys(module.exports).forEach(name => {
    globalModule[name] = module.exports[name]
  })
}
```
