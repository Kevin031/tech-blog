# let 和 var 的区别

## 1. 全局污染

通过 var 定义的变量会挂载到 window 上，而通过 let 定义的变量不会

```js
var a = 1;
console.log(window.a); // 1
```

let 虽然不会污染全局，但是可以跨 script 标签使用。

## 2. 块级作用域

var 的作用域：全局、函数

let 的作用域：块级

注意块级作用域指的是一对`{}`包裹的代码，包括 if、while、函数、判断语句、循环语句等，let 定义的变量无法在花括号外被访问到，而 var 定义的变量会在函数块中进行变量提升，从而能够在花括号外被访问到。

## 3. TDZ 暂时性死区

var 定义的变量会自动提升

let 定义的变量会产生一个暂时性死区，在声明前调用它会报类似这样的错误：can not accsss 'a' before it initialize

## 4. 重复声明

var 定义的变量在同一个作用域内可以重复声明

let 和 const 不能重复声明
