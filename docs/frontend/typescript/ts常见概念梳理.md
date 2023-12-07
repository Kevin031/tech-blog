# ts 常见概念梳理

## 数据类型

**原始类型**
`number`
`string`
`boolean`
`undefined`
`null`
`symbol`
`bigint`

**ts 新增概念类型**
`void`: 空指针
`any`: 任意值
`never`: 不存在的类型
`enum`: 枚举类型
`tuple`: 元组

**字面量类型**

直接使用字符串来定义类型，比较严格

```ts
type EventNames = 'click' | 'scroll' | 'mousemove'
```

**数组类型**
`number[]`
数组泛型`Array<number>`

**类数组**

```ts
function sum() {
  let args: {
    [index: number]: number
    length: number
    callee: Function
  } = arguments
}
```

**对象类型：接口**

按照规范，通常命名需要加上 I 前缀

```ts
interface IPerson {
  name: string
  readonly id: number // 只读属性
  age?: number // 可选属性
  [propName: string]: any // 任意属性
}
```

**函数类型**

第 1 种方式:

直接对 function 进行约束

```ts
function sum(x: number, y: number): number {
  return x + y
}
```

第 2 种方式:

对接收函数的变量进行约束

```ts
let mySum: (x: number, y: number) => number

mySum = sum
```

在 ts 中=>表示函数的定义，左边（必须有括号）是输入，右边是输出，容易和 ES 的箭头函数混淆

第 3 种方式:

通过接口定义函数的形状

```ts
interface ISum {
  (x: number, y: num) => number
}

let mySum = function (x: number, y: number) {
  return x + y
}
```

其它概念：

1. 剩余参数：

```ts
function push(array: any[], ...items: any[]) {}`
```

2. 重载：

重载允许一个函数接受不同数量或类型的参数时，作出不同的处理。

```ts
function reverse(x: number): number
function reverse(x: string): string
function reverse(x: number | string): number | string | void {
  if (typeof x === 'number') {
    return Number(x.toString().split('').reverse().join(''))
  } else if (typeof x === 'string') {
    return x.split('').reverse().join('')
  }
}
```

## 类型推论

如果没有明确的指定类型，那么 `TypeScript` 会依照类型推论（`Type Inference`）的规则推断出一个类型。

## 类型断言

`值 as 类型`，通常用来解决联合类型导致的推论报错

```ts
function isFish(animal: Cat | Fish) {
  if (typeof (animal as Fish).swim === 'function') {
    return true
  }
  return false
}
```

## 内置对象

**EcmaScript 提供的内置对象**

`Boolean`、`Error`、`Date`、`RegExp`等

**DOM 和 BOM 的内置对象**

`Document`、`HTMLElement`、`Event`、`NodeList`等

**typeScript 核心库定义的文件**

定义了所有浏览器环境需要用到的类型，并且是预置在 TypeScript 中的

例如

```ts
interface Math {
  /**
   * Returns the value of a base expression taken to a specified power.
   * @param x The base value of the expression.
   * @param y The exponent value of the expression.
   */
  pow(x: number, y: number): number
}
```

```ts
interface Document
  extends Node,
    GlobalEventHandlers,
    NodeSelector,
    DocumentEvent {
  addEventListener(
    type: string,
    listener: (ev: MouseEvent) => any,
    useCapture?: boolean
  ): void
}
```

这样使得我们在使用`Math.pow`，`document.addEventListener`时可以直接得到 ts 的推论结果

**Node.js 内置对象**

需要通过依赖引入

```
npm i @types/node --save-dev
```

## 类型别名

用来给一个类型起个新名字

```ts
type Name = string
type Sum = number | (x: stirng, y: string) => string
```

也可以用来约束对象的类型，但是更为严格，能力也比 interface 的少（例如缺少 implement 和 extends 能力）

## 元组

数组合并了相同类型的对象，而元组（Tuple）合并了不同类型的对象。

```ts
let tom: [string, number] = ['Tom', 25]

tom.push(boolean) // 报错，当添加越界的元素时会被约束为元组的联合类型 string | number
```

## 枚举

```ts
enum Days {
  Sun,
  Mon,
  Tue,
  Wed,
  Thu,
  Fri,
  Sat
}
```

枚举可以不指定值，那么没有值的键最终会被编译为一个值为数字的对象类型

```js
var Days
;(function (Days) {
  Days[(Days['Sun'] = 0)] = 'Sun'
  Days[(Days['Mon'] = 1)] = 'Mon'
  Days[(Days['Tue'] = 2)] = 'Tue'
  Days[(Days['Wed'] = 3)] = 'Wed'
  Days[(Days['Thu'] = 4)] = 'Thu'
  Days[(Days['Fri'] = 5)] = 'Fri'
  Days[(Days['Sat'] = 6)] = 'Sat'
})(Days || (Days = {}))
```
