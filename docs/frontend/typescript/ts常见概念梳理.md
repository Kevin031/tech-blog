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

### 非空断言

当上下文类型检查器无法断言类型时，可以通过`!`表达式断言对象不是 null 或 undefined 类型。

具体而言，x!将从 x 的联合类型中排除 null 和 undefined

```js
const aLink = document.getElementById('link')!
// 如果没有非空断言，使用aLink时会报错，因为页面可能没有link这个标签，得到的就是undefined
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

## 关键字（工具类型）

1. `typeof`: 获取声明变量或对象实例的类型

```ts
interface Person {}
let sem: Person
type Sem = typeof sem
```

2. `keyof`: 获取接口类型的 key，得到联合类型

```ts
interface Person {
  name: string
  age: number
}
type PersonProps = keyof Person // 'name' | 'age'
```

3. `in`: 用来遍历枚举类型

```ts
type Keys = 'a' | 'b' | 'c'
type Obj = {
  [p in Keys]: any
} // -> { a: any, b: any, c: any }
```

4. `infer`: 在条件类型语句中，可以声明变量并使用

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any
```

怎么理解：可以分成两段

第一步：泛型 T 接收一个函数，它可以是任意类型，表示为

```ts
T extends (...args: any[]) => any
```

第二步：我们希望得到返回值，那么就尝试把上面返回值改成 infer 推断 R，能拿到 R 就拿 R 值，拿不到就 any

```ts
infer R ? R : any
```

5. `extends`: 可以通过 extends 关键字添加泛型约束

```ts
interface Lengthwise {
  length: number
}
function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length)
  return arg
}
```

类型体操：手写 Pick 类型

```ts
type Pick<T, K extends keyof T> {
  [K]: T[K]
}
```

## 类型别名

用来给一个类型起个新名字

```ts
type Name = string
type Sum = number | (x: stirng, y: string) => string
```

也可以用来约束对象的类型，但是更为严格，能力也比 interface 的少（例如缺少 implement 和 extends 能力）

## 内置工具类型

1. `Partial<T>`: 将某个类型的属性全部变成可选

2. `Readonly<T>`: 将 T 的所有属性变成只读

3. `Required<T>`: 将 T 的所有属性变成必须

4. `Omit<T, U>`: 从类型 T 中剔除 U 的所有属性

5. `Pick<T, U>`: 从类型 T 中挑选 U 的所有属性

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

## 类与接口

接口可以用于对类的形状进行描述

### 接口的实现（implement）

一个类可以实现多个接口

```ts
class Car implements Alarm, Light {}
```

### 接口继承接口

```ts
interface LightableAlarm extends Alarm {}
```

### 接口继承类

```ts
class Point {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

interface Point3d extends Point {
  z: number
}

let point3d: Point3d = { x: 1, y: 2, z: 3 }
```

## 泛型

**泛型**是指在定义函数、接口或类的时候，**不预先指定具体的类型**，而在**使用的时候再指定类型**的一种特性。

### 可以一次定义多个类型参数

```ts
function swap<T, U>(tuple: [T, U]): [U, T] {
  return [tuple[1], tuple[0]]
}
```

### 泛型约束

```ts
interface Lengthwise {
  length: number
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length)
  return arg
}
```

多个类型参数之间也可以互相约束：

```ts
function copyFields<T extends U, U>(target: T, source: U): T {
  for (let id in source) {
    target[id] = source[id]
  }
  return target
}
```

### 泛型接口

```ts
interface CreateArrayFunc {
  <T>(length: number, value: T): Array<T>
}
```

### 泛型类

```ts
class GenericNumber<T> {
  zeroValue: T
  add: (x: T, y: T) => T
}
```

### 默认类型

```ts
function createArray<T = string>(length: number, value: T): Array<T> {
  let result: T[] = []
  for (let i = 0; i < length; i++) {
    result[i] = value
  }
  return result
}
```

## 声明合并

定义了两个相同名字的函数、接口或类，那么它们会合并成一个类型

包括函数合并、接口合并、类合并

## 联合类型和交叉类型

### 联合类型

使用`|`连接，表示该变量是这些类型的任意一种

```ts
let myVal = number | string
```

### 交叉类型

表示一个变量同时具有多种类型的特性，如果交叉不了就会报错

```ts
interface Dog {
  name: string
  bark(): void
}

interface Bird {
  fly(): void
  chirp(): void
}

type DogBird = Dog & Bird
```

### 类型体操：联合类型转交叉类型

```ts
type UnionToCross<T,
```

## 协变、逆变和不变

### 协变

协变很好理解，就是可以将子类型的变量赋值给父类型的变量

可以从这个角度理解：子类型是小类型，因为更具体，小类型可以赋值给大类型

```ts
interface Animal {
  name: string
}

interface Dog {
  name: string
  bite(): void
}
let animal: Animal
let dog: Dog
animal = dog
```

### 逆变

一般出现在函数参数中，

拥有「父类型」参数的函数可以赋值给拥有「子类型」参数的函数；而拥有「子类型」参数的函数不可以赋值给拥有「父类型」参数的函数。

```ts
interface Animal {
  name: string
  age: number
}

interface Dog {
  name: string
  age: number
  bite(): void
}

let animalFun: (animal: Animal) => void
animalFun = (animal: Animal) => {
  console.log(animal.name)
}
let dogFun: (dog: Dog) => void
dogFun = (dog: Dog) => {
  dog.bite()
}

dogFun = animalFun
animalFun = dogFun // 报错
```

理解方向为 JS 为了「类型安全」，需要用父类型的参数去执行，否则子类型中具体的属性会导致父函数的类型推导出现问题。

### 双变（双向协变）

父类型可以赋值给子类型，子类型也可以赋值给父类型

ts 的编译选项 strictFunctionTypes 设为 true 表示只支持逆变，设为 false 表示支持双向协变。

### 不变

非父子类型之间不会发生型变，只要类型不一样就会报错

## 拓展问题

### TS 怎么给第三方库设置类型声明文件

第三方库的类型文件主要有 2 种形式：

1. 库自带的声明文件

2. TS 官方给他写的声明文件，DefinitelyTyped 提供，一般格式为`@types/axios`

通常情况下正常导入该库，TS 就会自动加载库自己的声明文件

### 对命名空间与模块的理解

任何包含 import 和 export 的文件都会被当作模块

如果一个文件不带有顶级的 import 或 export 声明，那么它的内容是全局可见的

可以通过**命名空间**解决重名问题

如果命名空间被定义在单独的文件中，需要使用以下语句引用它，也可以通过`namespace.variable`引入它

```
/// <reference path="path-to-file.ts" />
```

但是在现代 ts 种更常见的还是使用模块，逐渐取代命名空间

### 如何为已有 JS 提供类型声明

```
demo.ts
utils/index.js
utils/index.d.ts // 这里是重点
```

1. declare 关键字，为其他地方提供已存在变量的声明类型，而不创建新变量

```ts
declare let count = number
```

2. 对于 type 和 interface 这种本身就是 ts 关键字的，可以省略 declare

3. 对于 let、function 这种在 ts 和 js 中有双重含义的，应该使用 declare 明确指定此处用于类型声明
