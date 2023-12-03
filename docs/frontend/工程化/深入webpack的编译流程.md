# 深入 webpack 的编译流程

参考文章：

[https://juejin.cn/post/6844903935828819981?searchId=20231203145151C2E3FF1CBC41E7D831CD](https://juejin.cn/post/6844903935828819981?searchId=20231203145151C2E3FF1CBC41E7D831CD)

[https://mp.weixin.qq.com/s?\_\_biz=MzI5MjUxNjA4Mw==&mid=2247484465&idx=1&sn=13e809bbad1aded06089f9f90f54280f&chksm=ec017daddb76f4bb998db48b7b60ef61ce69f18a389b5d371f5abdec6af6e1e3819eaceb2194&mpshare=1&scene=1&srcid=0724xrEwBfryLPOe61Ki51Oi&sharer_sharetime=1563935222192&sharer_shareid=491f5e3b572f21d39b90888df1c8829b&key=4a20f31792598319b088ea3b82b6daf06773b3d7ffa59c0bb5d9ec0f7388ff5fed13910f4aacc420e4591fbc921b91b777b3904d18b7e88b4a3fee042e9d5df41b3746bc994433035daadda223075e98&ascene=1&uin=MTY4MzM5MzY2Mw%3D%3D&devicetype=Windows+10&version=62060833&lang=zh_CN&pass_ticket=4jkq%2FusyjX7RQyhKNRuqJ4ao5EVltuqP5Geyej5jy%2BYFRnQMWIS09yOSU9wir8dM](https://mp.weixin.qq.com/s?__biz=MzI5MjUxNjA4Mw==&mid=2247484465&idx=1&sn=13e809bbad1aded06089f9f90f54280f&chksm=ec017daddb76f4bb998db48b7b60ef61ce69f18a389b5d371f5abdec6af6e1e3819eaceb2194&mpshare=1&scene=1&srcid=0724xrEwBfryLPOe61Ki51Oi&sharer_sharetime=1563935222192&sharer_shareid=491f5e3b572f21d39b90888df1c8829b&key=4a20f31792598319b088ea3b82b6daf06773b3d7ffa59c0bb5d9ec0f7388ff5fed13910f4aacc420e4591fbc921b91b777b3904d18b7e88b4a3fee042e9d5df41b3746bc994433035daadda223075e98&ascene=1&uin=MTY4MzM5MzY2Mw%3D%3D&devicetype=Windows+10&version=62060833&lang=zh_CN&pass_ticket=4jkq%2FusyjX7RQyhKNRuqJ4ao5EVltuqP5Geyej5jy%2BYFRnQMWIS09yOSU9wir8dM)

webpack 的一些核心概念：

- Entry: 指定入口模块，从该模块开始构建，并计算出直接或间接依赖的模块和库

- Output: 告诉 webpack 输出的目录，以及命名输出的文件

- Module: 在 webpack 里一切皆模块，一个模块对应一个文件。webpack 从 entry 开始递归找出所有的模块。

- Chunk: 代码分割，可以用于抽取公共模块，方便运行时的请求速度和按需加载。

- Loader: 模块转换器，用于把模块的原内容转成新内容

- Plugin: 拓展插件，在 webpack 的构建流程中，会在特定的时机广播对应的事件，插件可以监听这些事件的发生，做对应的事情。

两个重要的对象：

- Compiler: 全局唯一的实例，负责文件的监听和启动编译，包含了完整 webpack 配置

- Compilation: 当 webpack 以开发模式运行时，每当检测到文件变化，就创建一个新的 Compilation。包含了当前资源、生成资源、变化的文件信息等。也提供了很多事件回调供插件做拓展

## webpack 流程

1. 初始化

- 读取与合并配置参数

- 加载 Plugin

- 实例化 Compiler

2. 编译

- 从 Entry 出发，针对每个 Module 串行调用对应的 Loader 去编译文件内容

- 找到当前 Module 依赖的 Module，递归处理

3. 输出

- 把编译后的 Module 组合成 Chunk

- 把 Chunk 转换成文件输出到文件系统

4. 监听模式

- 监听到目录文件变化，重新执行 2 和 3 的流程

### 初始化阶段

environment: 开始应用 Node.js 风格的文件系统到 compiler 对象，以方便后续的文件寻找和读取。

entry-option: 读取配置的 Entrys，为每个 Entry 实例化一个对应的 EntryPlugin，为后面该 Entry 的递归解析工作做准备。

after-plugins: 调用完所有内置的和配置的插件的 apply 方法。

after-resolvers: 根据配置初始化完 resolver，resolver 负责在文件系统中寻找指定路径的文件。

### 编译阶段

before-run: 清除缓存

run: 启动一次新的编译

watch-run: 和 run 类似，区别在于它是在监听模式下启动的编译，在这个事件中可以获取到是哪些文件发生了变化导致重新启动一次新的编译。

compile: 该事件是为了告诉插件一次新的编译将要启动，同时会给插件带上 compiler 对象。

compilation: 当 Webpack 以开发模式运行时，每当检测到文件变化，一次新的 Compilation 将被创建。一个 Compilation 对象包含了当前的模块资源、编译生成资源、变化的文件等。Compilation 对象也提供了很多事件回调供插件做扩展。

make: 一个新的 Compilation 创建完毕，即将从 Entry 开始读取文件，根据文件类型和配置的 Loader 对文件进行编译，编译完后再找出该文件依赖的文件，递归的编译和解析。

after-compile: 一次 Compilation 执行完成。这里会根据编译结果 合并出我们最终生成的文件名和文件内容。

invalid: 当遇到文件不存在、文件编译错误等异常时会触发该事件，该事件不会导致 Webpack 退出。

compilation 也提供了一些事件

build-module: 使用对应的 Loader 去转换一个模块。

normal-module-loader: 在用 Loader 对一个模块转换完后，使用 acorn 解析转换后的内容，输出对应的抽象语法树（AST），以方便 Webpack 后面对代码的分析。

program: 从配置的入口模块开始，分析其 AST，当遇到 require 等导入其它模块语句时，便将其加入到依赖的模块列表，同时对新找出的依赖模块递归分析，最终搞清所有模块的依赖关系。

seal: 所有模块及其依赖的模块都通过 Loader 转换完成后，根据依赖关系开始生成 Chunk。

### 输出阶段

should-emit: 所有需要输出的文件已经生成好，询问插件哪些文件需要输出，哪些不需要。

emit: 确定好要输出哪些文件后，执行文件输出，可以在这里获取和修改输出内容。

after-emit: 文件输出完毕。

done: 成功完成一次完成的编译和输出流程。

failed: 如果在编译和输出流程中遇到异常导致 Webpack 退出时，就会直接跳转到本步骤，插件可以在本事件中获取到具体的错误原因。

## 如何实现 Loader

由于 Webpack 是运行在 Node.js 之上的，一个 Loader 其实就是一个 Node.js 模块，这个模块需要导出一个函数。 这个导出的函数的工作就是获得处理前的原内容，对原内容执行处理后，返回处理后的内容。

一个最简单的 Loader 的源码如下：

```js
module.exports = function (source) {
  // source 为 compiler 传递给 Loader 的一个文件的原内容
  // 该函数需要返回处理后的内容，这里简单起见，直接把原内容返回了，相当于该 Loader 没有做任何转换
  return source;
};
```

由于 Loader 运行在 Node.js 中，你可以调用任何 Node.js 自带的 API，或者安装第三方模块进行调用：

```js
const sass = require("sass");
module.exports = function (source) {
  // source 为 compiler 传递给 Loader 的一个文件的原内容
  // 该函数需要返回处理后的内容，这里简单起见，直接把原内容返回了，相当于该 Loader 没有做任何转换
  return sass(source);
};
```

Webpack 还提供一些 API 供 Loader 调用

例如，获得 loader 的 options

```js
const loaderUtils = require("loader-utils");

module.exports = function (source) {
  // 获取到用户给当前 Loader 传入的 options
  const options = loaderUtils.getOptions(this);
  return source;
};
```

有些场景下还需要返回除了内容之外的东西

例如以用 babel-loader 转换 ES6 代码为例，它还需要输出转换后的 ES5 代码对应的 Source Map，以方便调试源码。

```js
module.exports = function (source) {
  // 通过 this.callback 告诉 Webpack 返回的结果
  this.callback(null, source, sourceMaps);
  // 当你使用 this.callback 返回内容时，该 Loader 必须返回 undefined，
  // 以让 Webpack 知道该 Loader 返回的结果在 this.callback 中，而不是 return 中
  return;
};
```

this.callback 的详细使用方法如下：

```ts
this.callback(
  // 当无法转换原内容时，给 Webpack 返回一个 Error
  err: Error | null,
  // 原内容转换后的内容
  content: string | buffer,
  // 用于把转换后的内容得出原内容的 Source Map，方便调试
  sourceMap?: SourceMap,
  // 如果本次转换为原内容生成了 AST 语法树，可以把这个 AST 返回，
  // 以方便之后需要 AST 的 Loader 复用该 AST，以避免重复生成 AST，提升性能
  abstractSyntaxTree?: AST
);
```

loader 可以同步也可以异步

有些场景下转换的步骤只能是异步完成的，例如你需要通过网络请求才能得出结果，如果采用同步的方式网络请求就会阻塞整个构建，导致构建非常缓慢。

所以可以采用异步的方式转换

```js
module.exports = function (source) {
  // 告诉 Webpack 本次转换是异步的，Loader 会在 callback 中回调结果
  var callback = this.async();
  someAsyncOperation(source, function (err, result, sourceMaps, ast) {
    // 通过 callback 返回异步执行后的结果
    callback(err, result, sourceMaps, ast);
  });
};
```

在默认的情况下，Webpack 传给 Loader 的原内容都是 UTF-8 格式编码的字符串。 但有些场景下 Loader 不是处理文本文件，而是处理二进制文件，例如 file-loader，就需要 Webpack 给 Loader 传入二进制格式的数据。

```js
module.exports = function (source) {
  // 在 exports.raw === true 时，Webpack 传给 Loader 的 source 是 Buffer 类型的
  source instanceof Buffer === true;
  // Loader 返回的类型也可以是 Buffer 类型的
  // 在 exports.raw !== true 时，Loader 也可以返回 Buffer 类型的结果
  return source;
};

// 通过 exports.raw 属性告诉 Webpack 该 Loader 是否需要二进制数据
module.exports.raw = true;
```

在有些情况下，有些转换操作需要大量计算非常耗时，如果每次构建都重新执行重复的转换操作，构建将会变得非常缓慢。

为此，Webpack 会**默认缓存**所有 Loader 的处理结果，也就是说在需要被处理的文件或者其依赖的文件没有发生变化时，是不会重新调用对应的 Loader 去执行转换操作的。

```js
module.exports = function (source) {
  // 关闭该 Loader 的缓存功能
  this.cacheable(false);
  return source;
};
```
