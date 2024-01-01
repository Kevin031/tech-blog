# 浅谈 javascript 中的观察者模式

观察者模式是一种创建松散耦合代码的技术，它定义对象间一种一对多的依赖关系，当一个对象的状态发生改变时，所有依赖于它的对象都将得到通知。

它由主体和观察者组成，主体负责发布事件，同时观察者通过订阅这些事件来观察该主体。主体并不知道观察者的任何事情，观察者知道主体并能注册时间的回调函数。

这么说起来比较抽象，我们画个图来表示比较容易理解。

![](http://oxudq29cr.bkt.clouddn.com/C4E1DBAAABE0E0029AE266709DE62773.png)

举个例子，就像一个有很多模块的购物车网站，各模块需要用 ajax 异步请求用户登录信息，那么就可以采用观察者模式

以下是实例：

```javascript
function EventTarget(){
    this.handlers = {};
}
EventTarget.prototype = {
    constructor: EventTarget,
    //添加事件
    addHandler: function(type, handler){ //handler为回调函数
        if(typeof this.handlers[type] == "underfind"){
            this.handlers[type] = []; //定义handlers为回调函数handler的集合
        }
        this.handlers[type].push(handler); //把handler添加到handlers中
    }
    //监听事件
    fire: function(event){
        if(!event.target){
            event.target = this;
        }
        if(this.handlers[event.type] instanceof Array){
            var handlers = this.handlers[event.type];
            for(var i=0, len=handlers.length; i<len; i++){
                handlers[i](event);
            }
        }
    }
    //移除事件
    removeHandler: function(type,handler){
        if(this.handler[type] instanceof Array){
            var handlers = this.handlers[type];
            for(var i=0, len=handlers.length; i<len; i++){
                if(handlers[i] === handler){
                    break;
                }
            }
            handlers.splice(i,1);
        }
    }
}
```

看到一道面试题，是这样的

```javascript
var Event = {
  //通过on接口监听事件eventName
  //如果事件eventName被触发，则执行callback回调函数
  on: function (eventName, callback) {
    你的代码
  },
  //触发事件 eventName
  emit: function (eventName) {
    //你的代码
  }
}

//test1
Event.on('test', function (result) {
  console.log(result)
})
Event.on('test', function () {
  console.log('test')
})
Event.emit('test', 'hello world') // 输出 'hello world' 和 'test'

//test2
var person1 = {}
var person2 = {}
Object.assign(person1, Event)
Object.assign(person2, Event)
person1.on('call1', function () {
  console.log('person1')
})
person2.on('call2', function () {
  console.log('person2')
})
person1.emit('call1') // 输出 'person1'
person1.emit('call2') // 没有输出
person2.emit('call1') // 没有输出
person2.emit('call2') // 输出 'person2'
```

经分析，可以看出这是要你封装一个观察者模式的代码

首先看 test1，需要输出"hello world"和"test"，那么结合上面的基本模式，可以写出以下代码

```javascript
on: function(eventName, callback) {
    if (!this.handlers) {
        this.handlers = {}; //创建一个handlers列表来存放事件组
    }
    if (!this.handlers[eventName]) {
        this.handlers[eventName] = []; //创建当前事件的回调函数组
    }
    this.handlers[eventName].push(callback); //为当前事件添加回调函数（在参数中引入）
},
//触发事件 eventName
emit: function (eventName) {
    if (this.handlers[arguments[0]]) { //arguments[0]即添加的事件名称
        for(var i=0, len=this.handlers[arguments[0]].length; i<len; i++) {
            this.handlers[arguments[0]][i](arguments[1]); //理解这段代码是关键，也就是先遍历this.handlers中的事件数，然后逐一运行
        }
    }
}
```

运行成功

控制台输出

```shell
hello world
test
```

再来看 test2，直接运行却出现了以下代码

```shell
person1
person2
person1
person2
```

这和我们的预期不太一样，回去检查代码发现调用这个方法`assign`

解释一下，`Object.assign(person1, Event)`;

这个是 ES6 的新对象方法，用于对象的合并，将源对象（`source`）的所有可枚举属性，复制到目标对象（`target`）。

意思是将`Event`里面的可枚举的对象和方法放到`person1`里面。

也就是说，如果源对象某个属性的值是对象，那么目标对象拷贝得到的是这个对象的引用。由于进行测试一的时候调用了 on 方法，所以 event 里面已经有了 handles 这个可枚举的属性。然后再分别合并到两个 person 里面的话，两个 person 对象里面的 handles 都只是一个引用。所以就互相影响了。

如果 assign 方法要实现深克隆则要这样：

```javascript
let person1 = JSON.parse(JSON.stringify(Event))
```

然而题目已经固定了使用方式，我们不能修改它，所以，我们只需要将`handlers`这个属性定义为不可枚举的，然后在`person`调用`on`方法的时候再分别产生`handlers`这个对象，所以`on`属性下作出以下修改即可

```javascript
on: function(eventName, callback) {
    if (!this.handlers) {
        this.handlers = {};
        Object.defineProperty(this, "handlers", {
            values: {},
            enumerable: false, //不可枚举的
            configurable: true,
            writable: true
        })
    }
    if (!this.handlers[eventName]) {
        this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(callback);
}
```
