# Electron 入门实践

## 基本框架搭建流程

### 创建项目

```shell
mkdir my-electron-app
cd my-electron-app
pnpm init
pnpm i electron --save
```

在`package.json`中加入启动脚本

```json
{
  "main": "main.js"
  "scripts": {
    "start": "electron ."
  }
}
```

### 创建主进程入口文件

主进程入口文件是`package.json`下`main`配置的文件，默认为`main.js`

```js
// main.js
// 主进程
const { app, BrowserWindow } = require('electron')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('index.html')
}

app.whenReady().then(() => {
  // 启动窗口
  createWindow()

  app.on('activate', () => {
    // 对于macOS，如果没有窗口则打开一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // 非macOS系统，关闭窗口是彻底关闭应用
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

主进程的任务是创建 electron 实例和开启窗口

### 页面文档和预加载脚本

主进程开启窗口的时候可以指定页面文档`index.html`和预加载脚本`preload.js`

主进程不能访问到`Document`，

而预加载脚本可以同时访问`Node API` 和 `Document`

::: code-group

```html {index.html}
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'"
    />
    <title>你好!</title>
  </head>
  <body>
    <h1>你好!</h1>
    我们正在使用 Node.js <span id="node-version"></span>, Chromium
    <span id="chrome-version"></span>, 和 Electron
    <span id="electron-version"></span>.
  </body>
</html>
```

```js {preload.js}
// 所有的 Node.js API接口 都可以在 preload 进程中被调用.
// 它拥有与Chrome扩展一样的沙盒
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded', document)
  const replaceText = (selector, text) => {
    const element = document.querySelector(selector)
    console.log('element', element, selector)
    if (element) {
      element.innerText = text
    }
  }
  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`#${dependency}-version`, process.versions[dependency])
  }
})
```

:::

### 页面文档挂载运行脚本

可以在`index.html`中按相对路径引入 js 文件

通过这种方式引入的文件为运行脚本，可以获得和普通 web 开发一致的能力和开发体验

至此，运行脚本可以通过 vue、react 去实现完整的 web 应用能力

### 小结

按照以上流程，我们获得了一个基本的 electron 项目框架，可以通过主进程和预加载脚本扩充基于 node 端的能力，也可以通过页面运行脚本扩充基于 web 端的能力。

![electron运行机制](./electron-base.png)

## 理解多进程模型

浏览器是个极其复杂的应用程序，除了展示网页外还有许多次要的职责。例如管理众多的窗口和第三方拓展。

如果不使用多进程模型，那么一两个标签页的崩溃，会导致整个浏览器的崩溃。

### 进程模型

Electron 的架构与浏览器类似，我们需要控制两种进程的模型

- 主进程

  - 应用实例单一的主进程，同时也作为入口，在 Node 环境中运行

  - 主进程可以自定义派生子进程（例如需要处理 CPU 密集型任务），但是需要优先使用**效率进程**，而不是`child_process.fork`

- 渲染器进程

  - 每个应用实例窗口都是一个子进程，主进程可以通过`webContent`访问子进程对象

  - **预加载脚本**运行在渲染器进程中，可以调用 Window 和 Node API，从而拥有更多权限，但是不能直接附加任何变动到 window 上

  - **预加载脚本**和**页面脚本**存在语境隔离，虽然共享 window，但是预加载脚本不能直接修改 window，而是通过 contextBridge 来给 window 注入属性。通常适用于注入`ipcRender`或一些自定义的属性

### 进程通信

Electron 推荐使用`IPC`通道进行进程间的通信

Electron 提供了`ipcMain`和`ipcRender`模块，通过开发者自定义的信息格式来通信，这些通道的命名是**任意的**（可以随意命名）和**双向的**（在不同的进程中使用相同的消息名称）

Electron 的 IPC 使用 HTML 标准的结构化克隆算法来序列化进程间传递的对象，这意味着只有某些类型的对象可以通过 IPC 通道传输。而对于 DOM 和 WebContents 这种特殊的对象，则无法结构化克隆。

:::
结构化克隆算法：通过来自 `Worker` 的 `postMessage()` 或使用 `IndexedDB` 存储对象时在内部使用。它通过递归输入对象来构建克隆，同时保持先前访问过的引用的映射，以避免无限遍历循环。

不适用的范围：`Function`、`DOM`、`RegExp`、`属性描述符`、`原型链上的属性`
:::

#### 方式一：渲染器进程到主进程（单向）

适用的场景为渲染器通知主进程做某件事，但是不需要反馈

用到的 api 为：`ipcMain.on`, `ipcRender.send`

举个形象的例子，例如我们需要在渲染器（子进程）中更改应用（主进程）的标题

1. 首先需要在主进程中注册监听事件`set-title`

```js
const { BrowserWindow, ipcMain } = require('electron')

function handleSetTitle(event, title) {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  win.setTitle(title)
}

app.whenReady().then(() => {
  ipcMain.on('set-title', handleSetTitle)
  createWindow()
})
```

2. 通过预加载脚本暴露 `ipcRender.send`

注意这里只暴露了一个具体的实现方法，而不是直接暴露`ipcRender.send`方法，这是处于安全的考虑

```js
const { contentBrige, ipcRender } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: title => ipcRender.send('set-title', title)
})
```

3. 浏览器脚本中的调用

```js
window.electronAPI.setTitle(title)
```

#### 方式二：渲染器进程到主进程（双向）

通常使用的场景为渲染器调用主进程模块并等待结果

用到的 api 为：`ipcMain.handle`, `ipcRender.invoke`

1. 在主进程中注册事件处理程序和监听事件

```js
const { BrowserWindow, dialog, ipcMain } = require('electron')

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog()
  if (!canceled) {
    return filePaths[0]
  }
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleFileOpen)
  createWindow()
})
```

2. 在预加载脚本中暴露 api

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile')
})
```

3. 在浏览器脚本中调用 api

```js
btn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile()
  filePathElement.innerText = filePath
})
```

上述流程，其实用`ipcRender.on`和`ipcMain.send`也能实现，但是用 invoke 则更为直观，同时，调用 invoke 的方式可以获得 Promise 对象，方便渲染器进行 async/await 异步编程

#### 方式三：主进程到渲染器进程（单向）

主进程发送消息到渲染器进程，可以指定由哪个渲染器进程进行接收。

这种方式需要通过 webContents 实例发送，其它事项和 ipcRenderer.send 类似。

1. 主进程添加事件处理程序

```js
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js')
  }
})

mainWindow.webContents.send('update-counter', 1)
```

2. 预加载脚本暴露方法

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateCounter: callback =>
    ipcRenderer.on('update-counter', (_event, value) => callback(value))
})
```

3. 浏览器脚本调用 api 监听事件

```js
window.electronAPI.onUpdateCounter(value => {
  // ...
})
```

## 上下文隔离和进程沙盒化

Electron 的上下文隔离是**默认开启**的，主要是处于安全性考虑，防止用户调用了高权限的 api

同时`window.X = apiObject`这样的操作是不被建议的

可以通过`contextBridge`给 window 注入 api

```js [preload.js]
const contextBridge = require('electron')

contextBridge.exposeInMainWorld('myAPI', {
  loadPreferences: () => ipcRenderer.invoke('load-prefs')
})

window.myAPI.loadPreferences()
```

沙盒通过限制对大多数系统资源的访问来减少恶意代码可能造成的伤害。

在 Chromium 中，沙盒化应用于主进程以外的大多数进程。 其中包括渲染器进程，以及功能性进程，如音频服务、GPU 服务和网络服务。

Electron 中沙盒化的具体表现为：

1. 渲染器进程：行为和常规 chrome 标签页一致，没有 node 环境，只能通过 IPC 委派任务给主进程

2. preload 脚本：只能使用部分`polyfill`形式实现的`Node API`

## 消息端口

允许在不同的上下文之间传递消息，类似于`window.postMessage`

::: code-group

```js {renderer.js}
// 消息端口是成对创建的。 连接的一对消息端口
// 被称为通道。
const channel = new MessageChannel()

// port1 和 port2 之间唯一的不同是你如何使用它们。 消息
// 发送到port1 将被port2 接收，反之亦然。
const port1 = channel.port1
const port2 = channel.port2

// 允许在另一端还没有注册监听器的情况下就通过通道向其发送消息
// 消息将排队等待，直到一个监听器注册为止。
port2.postMessage({ answer: 42 })

// 这次我们通过 ipc 向主进程发送 port1 对象。 类似的，
// 我们也可以发送 MessagePorts 到其他 frames, 或发送到 Web Workers, 等.
ipcRenderer.postMessage('port', null, [port1])
```

```js {main.js}
// 在主进程中，我们接收端口对象。
ipcMain.on('port', event => {
  // 当我们在主进程中接收到 MessagePort 对象, 它就成为了
  // MessagePortMain.
  const port = event.ports[0]

  // MessagePortMain 使用了 Node.js 风格的事件 API, 而不是
  // web 风格的事件 API. 因此使用 .on('message', ...) 而不是 .onmessage = ...
  port.on('message', event => {
    // 收到的数据是： { answer: 42 }
    const data = event.data
  })

  // MessagePortMain 阻塞消息直到 .start() 方法被调用
  port.start()
})
```

:::

两个窗口如果需要建立消息通道，那么需要主进程先创建好，再分配下去

```js {main.js}
const { MessageChannelMain } = require('electron')

// 建立通道
const { port1, port2 } = new MessageChannelMain()
// webContents准备就绪后，使用postMessage向每个webContents发送一个端口。
mainWindow.once('ready-to-show', () => {
  mainWindow.webContents.postMessage('port', null, [port1])
})

secondaryWindow.once('ready-to-show', () => {
  secondaryWindow.webContents.postMessage('port', null, [port2])
})
```
