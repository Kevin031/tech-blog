# 如何理解 BOM API

BOM 是 browser object model 的缩写，中文意思是浏览器对象模型，BOM API 就是浏览器提供的 API。

我们知道，JS 的运行环境是由「EcmaScript 实现」+「宿主环境」组成的，而 BOM 提供的就是宿主环境。

换言之，只有浏览器环境才可以调用，而 Node.js 环境则不行。

广义上的 BOM 其实包含了 DOM。

浏览器环境的全局对象 window，包含了 DOM 和 BOM，组成如下

- DOM

  - ducoment

- BOM

  - navigator

    - 获取浏览器信息

    - 获取硬件状态: 电池、摄像头和麦克风

    - 获取网络状态

    - 获取定位

    - 区分设备类型(userAgent)

  - screen

    - 获取显示设备的信息，如宽高、旋转方向

    - 获取屏幕色彩

  - location

    - 记录当前 url 信息

    - 有些信息在修改时会直接触发跳转

  - frames

    - 获取页面 iframe 信息

  - history

    - 获取当前页签的 url 访问记录

    - 提供可以在记录间跳转的方法

  - XMLHttpRequest

    - 发起网络请求

- Javascript 引擎

  - Object

  - Array

  - Function

  - ...

此外，window 对象下还挂载了许多浏览器提供的对象和方法，例如

对象：

- IntersectionObserver

- MutationObserver

- BroadcastChannel 可以跨页签通信

- MessageChannel 消息通道

- Image

- Video

- FileReader

- Blob

方法：

- setTimeout

- setInterval

- requestAnimationFrame

- requestIdleCallback

- postMessage
