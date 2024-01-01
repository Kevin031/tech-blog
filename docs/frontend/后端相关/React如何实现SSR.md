# React 如何实现 SSR

主要分为 4 个步骤

- 1. 设置服务端环境：在服务端需要`Node.js`环境，通常借助`Express`或`Koa`来处理 HTTP 请求

- 2. 创建服务端路由：需要定义与`React`组件相对应的路由，以便把相应的 URL 指向对应的组件

- 3. 获取数据：在服务端渲染的过程中，数据可能直接来源于数据库，或者向其他数据源发起请求，再进行渲染

- 4. 生成渲染字符串：使用`React`的`react-dom/server`模块提供的`renderToString`方法，将 react 组件渲染为 html 字符串，这个字符串包含了初始渲染结果。

```jsx
import { renderToString } from 'react-dom/server'
import App from './App'

const html = renderToString(<App />)
```

- 5. 将渲染字符串插入 HTML，将渲染出的 HTML 字符串嵌入服务端框架的模板中

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>React SSR</title>
  </head>
  <body>
    <div id="root">${html}</div>
    <script src="/client.js"></script>
  </body>
</html>
```

- 6. 发送完整的 HTML 响应

- 7. 客户端激活：除了服务端响应的 HTML 外，还需要在客户端加载 React 代码，激活相应的组件。

通常借助`ReactDOM.hydrate`方法

```jsx
import { hydrate } from 'react-dom'
import App from './App'

hydrate(<App />, document.getElementById('root'))
```

激活过程：在服务器端渲染时，React 会将组件的状态以 JSON 数据的形式嵌入到 HTML 中，通常通过将一个 window.**INITIAL_STATE** 的全局变量设置为包含组件状态的 JSON 对象。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>React SSR</title>
  </head>
  <body>
    <div id="root"><!-- React Server-Side Rendered HTML --></div>
    <script>
      // 将服务器端渲染时的组件状态存储到全局变量
      window.__INITIAL_STATE__ = {
        /* 组件的状态数据 */
      }
    </script>
    <script src="/client.js"></script>
  </body>
</html>
```

```jsx
import React from 'react'
import { hydrate } from 'react-dom'
import App from './App'

const initialState = window.__INITIAL_STATE__ || {} // 获取初始状态

hydrate(<App {...initialState} />, document.getElementById('root'))
```

这确保了在客户端接管由服务器端渲染的 HTML 时，React 能够继续管理组件的状态和事件

## SSR 的意义

1. 更快的首次加载时间

由于服务端请求数据是走内网的，机器性能也更高，结合数据缓存，因此会有更快的渲染速度

2. 更好的 SEO（搜索引擎优化）

3. 在不支持 JavaScript 的情况下仍能正常渲染
