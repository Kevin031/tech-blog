# webpack 的运行时分析

## 基础实现

`webpack` 的 `runtime`，也就是 `webpack` 最后生成的代码，做了以下三件事:

1. `__webpack_modules__`: 维护一个所有模块的数组。将入口模块解析为 `AST`，根据 `AST` 深度优先搜索所有的模块，并构建出这个模块数组。每个模块都由一个包裹函数 (`module`, `module.exports`, `__webpack_require__`) 对模块进行包裹构成。

2. `__webpack_require__(moduleId)`: 手动实现加载一个模块。对已加载过的模块进行缓存，对未加载过的模块，执行 id 定位到 `__webpack_modules__` 中的包裹函数，执行并返回 `module.exports`，并缓存

3. `__webpack_require__(0)`: 运行第一个模块，即运行入口模块

假如有这样 2 个文件

```js
import name from './name'

console.log(name)
```

```js
const name = 'jack'

export { name }
```

使用 webpack 打包后，精简代码如下：

```js
const __webpack_modules__ = [
  (module, require) => {
    const name = require(1)
    console.log(name)
  },
  (modole, require) => {
    const name = 'jack'
    module.exports = name
  }
]
const __webpack_require__ = id => {
  const module = { exports: {} }
  const m = __webpack_modules__[id](module, __webpack_require__)
  return module.exports
}
__webpack_require(0)
```

相比与 rollup 的方案

rollup 仅仅将所有模块平铺开，对于变量冲突，直接重新命名

```js
const name = 'jack'
console.log(name)
```

## 代码分割

通过`import()`可进行代码分割

```js
import('./sum').then(m => {
  m.default(3, 4)
})

// 以下为 sum.js 内容
const sum = (x, y) => x + y
export default sum
```

将被编译成以下代码

```js
__webpack_require__
  .e(/* import() | sum */ 644)
  .then(__webpack_require__.bind(__webpack_require__, 709))
  .then(m => {
    m.default(3, 4)
  })
```

1. `__webpack_require__.e`: 加载 chunk。该函数将使用 `document.createElement('script')` 异步加载 `chunk` 并封装为 `Promise`。

2. `self["webpackChunk"].push`: `JSONP cllaback`，收集 `modules` 至 `__webpack_modules__`，并将 `__webpack_require__.e` 的 `Promise` 进行 `resolve`。

## 加载非 js 资源

通过 loader 处理，loader 根据资源的特性按需处理

以下为常见的几种情况

### JSON

被视为普通的 Javascript

```js
// 实际上的 user.json 被编译为以下内容
export default {
  id: 10086,
  name: 'shanyue',
  github: 'https://github.com/shfshanyue'
}
```

json-loader 的最小实现原理如下

```js
module.exports = function (source) {
  const json = typeof source === 'string' ? source : JSON.stringify(source)
  return `module.exports = ${json}`
}
```

### 图片

替换为它自身的路径

### Style

1. `css-loader`: 将 CSS 中的`url`与`@import`解析为模块

2. `style-loader`: 将样式注入到 DOM 中

```js
module.exports = function (source) {
  return `
function injectCss(css) {
  const style = document.createElement('style')
  style.appendChild(document.createTextNode(css))
  document.head.appendChild(style)
}

injectCss(\`${source}\`)
  `
}
```

3. `mini-css-extract-plugin`: 将样式打包成单独的文件，提升渲染速度

## 脚本注入 html

这样做的原因：

1. `main.js` 即我们最终生成的文件带有 `hash` 值，如 `main.8a9b3c.js`。

2. 由于长期缓存优化的需要，入口文件不仅只有一个，还包括由第三方模块打包而成的 `verdor.js`，同样带有 `hash。`

3. 脚本地址同时需要注入 `publicPath`，而在生产环境与测试环境的 `publicPath` 并不一致。

可以借助`html-webpak-plugin`实现

## 热模块替换

简称 `HMR`，`Hot Module Replacement`，热模块替换。

无需刷新在内存环境中即可替换掉过旧模块。

这种做法相对于 live reload 是不一样的，Live Reload 是指当代码进行更新后，在浏览器自动刷新以获取最新前端代码。

其原理是通过 `chunk` 的方式加载最新的 `modules`，找到 `__webpack_modules__`中对应的模块逐一替换，并删除其上下缓存。

代码如下：

```js
const __webpack_modules = [
  (module, exports, __webpack_require__) => {
    __webpack_require__(0)
  },
  () => {
    console.log('这是一号模块')
  }
]

// HMR chunk代码
self['webpackHotUpdate'](0, {
  1: () => {
    console.log('这是最新的一号模块')
  }
})
```

具体实现流程如下：

1. `webpack-dev-server` 将打包输出 `bundle` 使用内存型文件系统控制，而非真实的文件系统。此时使用的是 `memfs` 模拟 `node.js fs API`

2. 每当文件发生变更时，`webpack` 将会重新编译，`webpack-dev-server` 将会监控到此时文件变更事件，并找到其对应的 `module`。此时使用的是 `chokidar` 监控文件变更

3. `webpack-dev-server` 将会把变更模块通知到浏览器端，此时使用 `websocket` 与浏览器进行交流。此时使用的是 `ws`

4. 浏览器根据 `websocket` 接收到 `hash`，并通过 `hash` 以 `JSONP` 的方式请求更新模块的 `chunk`

5. 浏览器加载 `chunk`，并使用新的模块对旧模块进行热替换，并删除其缓存
