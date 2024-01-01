# Bundless 原理与浏览器 ESM

## 浏览器的 ESM 能力

通过`script[type=module]`，可直接在浏览器中使用原生 `ESM`。这也使得前端不打包 (Bundless) 成为可能。

```html
<script type="module">
  import lodash from 'https://cdn.skypack.dev/lodash'
</script>
```

但 http import 每次都需要输入完整 url，不同于 node 环境下的裸导入

node 环境下可以依赖文件系统层层查找

```js
import lodash from 'lodash'
```

```shell
/home/app/packages/project-a/node_modules/lodash/index.js
/home/app/packages/node_modules/lodash/index.js
/home/app/node_modules/lodash/index.js
/home/node_modules/lodash/index.js
```

为了解决这个问题，可以通过`script[type=importmap]`指定路径

```html
<script type="importmap">
  {
    "imports": {
      "lodash": "https://cdn.skypack.dev/lodash",
      "lodash/": "https://cdn.skypack.dev/lodash/", // 子路径需要通过这种方式
      "ms": "https://cdn.skypack.dev/ms"
    }
  }
</script>
```

浏览器 ESM 不仅可以导入 js，还可以导入 json 和 css

```html
<script type="module">
  import data from './data.json' assert { type: 'json' }

  console.log(data)
</script>
```

一些提供 bundless 包的 cdn 平台

[https://cdn.skypack.dev/](https://cdn.skypack.dev/)

[https://jspm.org/](https://jspm.org/)

[https://unpkg.com/](https://unpkg.com/)

## ESM 和 CommonJS 的异同

1. ESM 有`具名导入导出`和`默认导入导出` 2 种方式

```js
// Named export/import
export { sum }
import { sum } from 'sum'

// Default export/import
export default sum
import sum from 'sum'
```

2. `CommonJS` 仅支持一种方式

```js
exports.a = 3
// 等价于
module.exports

module.exports = sum
```

## CommonJS 转 ESM

### 常规转换

```js
// Input:  index.cjs
exports.a = 3

// Output: index.mjs
// 此处既要转化为默认导出，又要转化为具名导出！
export const a = 3
export default { a }
```

### 复杂转换

1.处理`__dirname`

2.处理 require(dynamicString)（commonjs 特性）

3.编程逻辑，如

```js
Promise.resolve().then(() => {
  exports.sum = 100
})
```

### 转换工具

`@rollup/plugin-commonjs`

## Bundless 的优劣

### 优势

1. 项目启动快，每次修改只需处理单个文件，响应速度也是 O(1)级别

2. 利用了浏览器自主加载的特性，跳过了打包过程

|            |           Bundle 模式           |          Bundless 模式 |
| ---------- | :-----------------------------: | ---------------------: |
| 启动项目   |          完整打包项目           |       仅启动 devServer |
| 浏览器加载 | 等待打包完成，加载对应的 bundle | 直接请求对应的本地文件 |
| 本地更新   |         重新打包 bundle         |       重新请求单个文件 |

### 不足

主要是对于生产环境，有些关键问题仍然需要借助工程化解决

1. 没有进行 TreeShaking，包数量过多也会导致加载性能的浪费

2. 产物语法和 polyfill 问题，不支持 ES3/ES5 语法降级，导致兼容性不好

3. 因为所有的包都走网络请求，巨大的文件请求数量仍然会带来页面加载的性能问题，以及占用线程阻塞了页面的 Ajax 请求

4. 部分第三方包未支持 ESM，部分浏览器不支持原生 ESM

5. 本地化调试问题，由于使用了 CDN，无法对产物进行调试

6. 部署问题，由于使用了第三方 CDN，无法进行私有化部署

### 上述不足的解决方案

1. 在预构建阶段，可通过 babel/swc 编译出特定的 bundle (esbuild)

2. 对项目的模块依赖图进行分析，将项目使用到的依赖进行合并(combo)打包，使最后依赖的产物 chunk 数量保持在性能最佳的范围之内 (esbuild，Combo)

3. 不支持 ESM 的包和浏览器采用降级方案：探测 NPM 包所有的导出，若 require 失败，降级到 AST 解析分析导出。

4. 将依赖产物代码同业务代码一同部署(私有化部署)
