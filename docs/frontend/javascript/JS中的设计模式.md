---
tags:
  - cms-import-ready
---

# JS 中的设计模式

## 单例模式

### 🌟 WHAT

使用闭包来创建一个只有一个实例的对象，并确保全局范围内唯一

### 🌟 HOW

```js
const Singleton = (function () {
  let instance

  function createInstance() {
    // 创建单例对象的代码
    return {
      // 单例对象的属性和方法
    }
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance()
      }
      return instance
    }
  }
})()

// 使用单例对象
const singletonInstance1 = Singleton.getInstance()
const singletonInstance2 = Singleton.getInstance()

console.log(singletonInstance1 === singletonInstance2) // true
```

### 🌟 WHERE

- 网页中的全局状态机

- 数据库连接池

- 日志记录器

## 工厂模式

### 🌟 WHAT

通过工厂函数，根据需要创建各种对象，而无需直接实例化它们

### 🌟 HOW

```js
function ShapeFactory() {}

ShapeFactory.prototype.createShape = function (type) {
  switch (type) {
    case 'circle':
      return new Circle()
    case 'rectangle':
      return new Rectangle()
    case 'triangle':
      return new Triangle()
    default:
      throw new Error('Invalid shape type.')
  }
}

function Circle() {
  this.type = 'circle'
}

function Rectangle() {
  this.type = 'rectangle'
}

function Triangle() {
  this.type = 'triangle'
}

// 使用工厂创建对象
const factory = new ShapeFactory()
const circle = factory.createShape('circle')
const rectangle = factory.createShape('rectangle')
const triangle = factory.createShape('triangle')

console.log(circle.type) // "circle"
console.log(rectangle.type) // "rectangle"
console.log(triangle.type) // "triangle"
```

### 🌟 WHERE

- UI 库的组件创建

- 数据模型的创建

- 数据源的选择

## 观察者模式

### 🌟 WHAT

定义事件和事件处理程序，让多个观察者订阅事件并在事件发生时接收通知

### 🌟 HOW

```js
function Subject() {
  this.observers = []
}

Subject.prototype.addObserver = function (observer) {
  this.observers.push(observer)
}

Subject.prototype.removeObserver = function (observer) {
  const index = this.observers.indexOf(observer)
  if (index !== -1) {
    this.observers.splice(index, 1)
  }
}

Subject.prototype.notifyObservers = function (data) {
  this.observers.forEach(function (observer) {
    observer.update(data)
  })
}

function Observer(name) {
  this.name = name
}

Observer.prototype.update = function (data) {
  console.log(this.name + ' received data: ' + data)
}

// 创建主题和观察者
const subject = new Subject()
const observer1 = new Observer('Observer 1')
const observer2 = new Observer('Observer 2')

// 注册观察者
subject.addObserver(observer1)
subject.addObserver(observer2)

// 通知观察者
subject.notifyObservers('Hello, observers!')
```

### 🌟 WHERE

- 全局的事件监听器

- 发布订阅模型的实现

- 数据变化时的通知和更新

## 发布订阅模式

### 🌟 WHAT

类似于观察者模式，但是最大的区别是发布-订阅模式中的发布者和订阅者之间没有直接依赖关系

发布者将消息发布到一个主题（topic），而订阅者可以选择订阅感兴趣的主题

**观察者**：保存对象指针，直接调用对象的方法更新

**发布订阅**：保存订阅函数指针，调用订阅函数更新

因此发布订阅的模式更加灵活，任何地方都可以订阅，而不用将方法名写死

### 🌟 HOW

```js
PubSub.prototype.subscribe = function (topic, subscriber) {
  if (!this.topics[topic]) {
    this.topics[topic] = []
  }
  this.topics[topic].push(subscriber)
}

PubSub.prototype.unsubscribe = function (topic, subscriber) {
  if (this.topics[topic]) {
    const index = this.topics[topic].indexOf(subscriber)
    if (index !== -1) {
      this.topics[topic].splice(index, 1)
    }
  }
}

PubSub.prototype.publish = function (topic, data) {
  if (this.topics[topic]) {
    this.topics[topic].forEach(function (subscriber) {
      subscriber(data)
    })
  }
}

// 创建发布订阅对象
const pubsub = new PubSub()

// 创建订阅者函数
function subscriber1(data) {
  console.log('Subscriber 1 received data: ' + data)
}

function subscriber2(data) {
  console.log('Subscriber 2 received data: ' + data)
}

// 订阅主题
pubsub.subscribe('topic1', subscriber1)
pubsub.subscribe('topic1', subscriber2)

// 发布消息
pubsub.publish('topic1', 'Hello, subscribers!')
```

### 🌟 WHERE

- 页面级事件监听和处理

- 解耦和组件间的松散耦合

## 原型模式

### 🌟 WHAT

可以使用原型对象作为其他对象的基础，并在需要时通过克隆来创建新的对象实例

### 🌟 HOW

```js
function PrototypeObject() {}

PrototypeObject.prototype.clone = function () {
  return Object.create(Object.getPrototypeOf(this))
}

// 创建原型对象
const prototypeObj = new PrototypeObject()
prototypeObj.property = 'Prototype Property'

// 克隆对象
const clonedObj = prototypeObj.clone()

console.log(clonedObj.property) // "Prototype Property"
```

### 🌟 WHERE

- 大量创建相似对象时的性能优化

- 作为动态创建对象的模板

## 适配器模式

### 🌟 WHAT

对象可以在运行时动态改变其属性和方法

适合处理不兼容接口之间的适配问题

### 🌟 HOW

```js
// 定义目标接口
function TargetInterface() {
  this.request = function () {
    // 默认的请求实现
  }
}

// 定义适配者
function Adaptee() {
  this.specificRequest = function () {
    // 适配者特定的请求实现
  }
}

// 创建适配器
function Adapter() {
  const adaptee = new Adaptee()

  this.request = function () {
    adaptee.specificRequest()
    // 执行适配逻辑
  }
}

// 使用适配器
const adapter = new Adapter()
adapter.request()
```

### 🌟 WHERE

- 使用第三方库时，对其接口进行适配从而兼容现有代码

- 在不同版本的接口之间进行适配以确保兼容性

- 使用不同类型的数据源时，对其接口进行适配以实现统一的数据访问方式

## 装饰器模式

### 🌟 WHAT

函数和对象可以在运行时动态添加新的行为和属性，这使得装饰者模式非常适合为现有对象添加额外的功能

### 🌟 HOW

```js
// 定义原始对象
function OriginalObject() {
  this.operation = function () {
    // 原始操作实现
  }
}

// 定义装饰者基类
function DecoratorBase(originalObject) {
  this.originalObject = originalObject

  this.operation = function () {
    this.originalObject.operation()
    // 装饰操作实现
  }
}

// 定义具体装饰者
function ConcreteDecorator(originalObject) {
  DecoratorBase.call(this, originalObject)

  this.operation = function () {
    // 调用装饰器进行修饰
    this.originalObject.operation()
    // 具体装饰操作实现
  }
}

// 使用装饰者
const originalObject = new OriginalObject()
const decoratedObject = new ConcreteDecorator(originalObject)
decoratedObject.operation()
```

### 🌟 WHERE

- 在不修改原始对象的情况下，为其添加额外的功能

- 在运行时动态为对象添加新的行为

- 遵循开放封闭原则的同时，通过装饰来扩展对象功能

## 策略模式

### 🌟 WHAT

在 js 中，函数是一等公民，可以作为参数传递给其他函数，这使得实现策略模式非常简单。可以根据不同的策略（函数）来执行不同的行为

### 🌟 HOW

```js
// 定义策略接口
function Strategy() {
  this.execute = function () {
    // 默认的策略实现
  }
}

// 定义具体策略
function ConcreteStrategy1() {
  this.execute = function () {
    // 具体策略1的实现
  }
}

function ConcreteStrategy2() {
  this.execute = function () {
    // 具体策略2的实现
  }
}

// 使用策略
function Context(strategy) {
  this.strategy = strategy

  this.executeStrategy = function () {
    this.strategy.execute()
  }
}

// 使用不同的策略
const strategy1 = new ConcreteStrategy1()
const strategy2 = new ConcreteStrategy2()

const context1 = new Context(strategy1)
context1.executeStrategy()

const context2 = new Context(strategy2)
context2.executeStrategy()
```

### 🌟 WHERE

- 需要在运行时根据不同的情况选择不同的算法或行为。

- 存在多个类似的条件分支语句，每个分支执行不同的操作。

- 需要在不同的环境下使用不同的算法或策略。

- 需要将算法或行为的实现与调用代码解耦，以便于维护和扩展。

- 希望通过定义不同的策略来实现相同的接口，从而实现代码的灵活性和可复用性。

## 迭代器模式

### 🌟 WHAT

JavaScript 中的数组和迭代器特性使得实现迭代器模式非常容易。可以使用迭代器来遍历集合中的元素，而无需暴露其内部结构。

ES7 新增的 generate、Map、Set 也可以生成迭代器

### 🌟 HOW

```js
// 定义迭代器接口
function Iterator() {
  this.hasNext = function () {
    // 判断是否有下一个元素
  }

  this.next = function () {
    // 获取下一个元素
  }
}

// 定义具体迭代器
function ConcreteIterator(collection) {
  let index = 0

  this.hasNext = function () {
    return index < collection.length
  }

  this.next = function () {
    return collection[index++]
  }
}

// 使用迭代器
const collection = [1, 2, 3, 4, 5]
const iterator = new ConcreteIterator(collection)

while (iterator.hasNext()) {
  console.log(iterator.next())
}
```

### 🌟 WHERE

- 需要遍历集合或列表等数据结构中的元素。

- 需要对集合中的元素进行迭代和访问。

- 需要隐藏集合内部结构，提供统一的遍历方式。

## 代理模式

### 🌟 WHAT

代理对象可以包装另一个对象并拦截其操作。这使得代理模式非常适合实现缓存、延迟加载和权限控制等功能。

### 🌟 HOW

```js
// 定义主题接口
function Subject() {
  this.request = function () {
    // 主题的请求实现
  }
}

// 定义真实主题
function RealSubject() {
  this.request = function () {
    // 真实主题的请求实现
  }
}

// 定义代理主题
function ProxySubject() {
  const realSubject = new RealSubject()

  this.request = function () {
    // 执行一些前置操作
    realSubject.request()
    // 执行一些后置操作
  }
}

// 使用代理主题
const subject = new ProxySubject()
subject.request()
```

### 🌟 WHERE

- 对对象的访问进行控制和管理

- 在访问对象时添加额外的逻辑，例如缓存、安全性检查等

- 延迟加载对象的创建和初始化
