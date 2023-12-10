# ts 中的类型体操

## 实现 Optional

有以下场景，需要封装一个 Optional 类型将指定字段变成可选

```typescript
interface Article {
  title: string
  content: string
  author: string
  date: Date
  readCount: number
}

type CreateArticleOptions = Optional<Article, 'author' | 'date' | 'readCount'>

function createArticle(options: CreateArticleOptions) {
  console.log(options)
}
```

可以通过泛型以及 Omit、Partial，用以下方式实现

```typescript
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
```

解析如下：

1. `&`用于几个类型组合形成交叉类型
2. `Omit`用于剔除第`T`参数中的`K`参数所包含的字段
3. `Pick`用于挑选`T`参数中的`K`参数所包含的字段
4. `Partial`用于将`T`参数的全部字段变成可选

## 实现 GetOptionals

有以下场景，需要封装一个 GetOptionals 获取类型中的可选字段

```typescript
interface Article {
  title: string
  content: string
  author: string
  date?: Date
  readCount?: number
}

type AraticalOptionals = GetOptional<Article>
```

可以通过以下方式封装

```typescript
type GetOptional<T> = {
  [P in keyof T as T[P] extends Required<T>[P] ? never : P]: T[P]
}
```

解析如下：

1. 通过`keyof`操作符进行字段遍历
2. 通过`as`转成别名
3. 通过`Required`获取泛型中的必传字段
4. 通过三目运算推演类型：T extends string ? 'a' : 'b'

## 从字段到函数的推导

有以下场景，希望通过泛型实现函数参数的推导

```typescript
type Watcher = {
  on(
    eventName: `${'firstName' | 'lastName' | 'age'}Change`,
    callback: (oldValue: any, newValue: any) => void
  ): void
}

declare function watch(obj: object): Watcher

const personalWatcher = watch({
  firstName: 'Sonier',
  lastName: 'Roson',
  age: 20
})

personalWatcher.on('ageChange', (oldValue, newValue) => {})
```

可以进行如下改造

```typescript
type Watcher<T> = {
  on<K extends string & keyof T>(
    eventName: `${K}Change`,
    callback: (oldValue: T[K], newValue: T[K]) => void
  ): void
}

declare function watch<T>(obj: T): Watcher<T>

const personalWatcher = watch({
  firstName: 'Sonier',
  lastName: 'Roson',
  age: 20
})

personalWatcher.on('ageChange', (oldValue, newValue) => {})
```

通过这种方式，可以通过函数接收到的对象类型进行推演，得到返回的新对象类型

## 推导函数的返回结果

有如下场景，需要实现 Return 类型得到函数的返回类型

```typescript
type sum = (a: number, b: number) => number
type concat = (a: any[], b: any[]) => any[]

let sumResult: Return<sum>
let concatResult: Return<concat>
```

可以通过以下方式实现:

```typescript
type Return<T> = T extends (...args: any[]) => infer R ? R : T
```

`(...args: any[])`用于表示函数中不定量的参数

其中 infer 就是用于从函数返回值中推断类型

## 推断 Promise 中 resolve 的数据类型

有以下场景，需要实现 PromiseType 得到 resolve 的类型

```typescript
type pt = PromiseType<Promise<string>> // string
```

实现如下：

```typescript
type PromiseType<T> = T extends Promise<infer K> ? K : T
```

对于递归的场景，可以进行类型的递归，进一步推导

```typescript
type PromiseType<T> = T extends Promise<infer K> ? Promise<K> : T

type pt = PromiseType<Promise<Promise<string>>> // string
```

## 获取函数中第一个参数的类型

```typescript
type FirstArg<T> = T extends (first: infer F, ...args: any[]) => any ? F : T
type fa = FirstArg<(name: string, age: number) => void> // string
```

## 对柯里化函数做类型推断

```typescript
declare function curry(fn: Function): Function

function sum(a: string, b: string, c: number) {
  return a + b + c
}

const currySum = curry(sum)

currySum(1, 2, 3)
```

需要进行以下改造

```typescript
// 3种情况
// 1. () => R
// 2. (x) => R
// 3. (x) => 新的函数
type Curried<A, R> = A extends []
  ? () => R
  : A extends [infer ARG]
  ? (params: ARG) => R
  : A extends [infer ARG, ...infer REST]
  ? (param: ARG) => Curried<REST, R>
  : never

declare function curry<A extends any[], R>(fn: (...args: A) => R): Curried<A, R>

function sum(a: string, b: string, c: number) {
  return a + b + c
}

const currySum = curry(sum)('1')('2')(3)
```

关键在于用好 infer，以及通过递归解决问题

## 获取数组的元类型

```typescript
type ArrayType<T> = T extends (infer I)[] ? I : T

type ItemType1 = ArrayType<[string, number]> // stirng | number
type ItemType2 = ArrayType<string[]> // string[]
```

## 联合类型转交叉类型

有以下场景，需要实现 UnionToIntersection 类型将联合类型转成交叉类型

```typescript
type Test = { a: string } | { b: number } | { c: boolean }

type BothTest = UnionToIntersection<Test>
```

可以通过这种方式实现：

```typescript
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  X: infer R
) => any
  ? R
  : never
```

涉及到**协变**和**逆变**的概念：

小类型可以赋值给大类型，大类型不能赋值给小类型（协变）

而对于函数参数则正好相反

```typescript
let a: Big = { a: 1 }
let b: Small = { a: 1, b: 2 }

let fn1 = (value: Big) => {}
let fn2 = (value: Small) => {}

fn2 = fn1
// fn1 = fn2 // 报错
```

对于函数而言，联合类型的函数，会将它的参数变成交叉类型（逆变）

```typescript
type fn1 = (x: { a: string }) => any
type fn2 = (x: { b: number }) => any
type fn3 = fn1 | fn2

function method(fn: fn3) {
  fn({ a: '1', b: 2 })
  // (parameter) fn: (x: {
  //     a: string;
  // } & {
  //     b: number;
  // }) => any
}
```

## 前置的不定量参数

有如下场景，需要对 addImpl 的参数类型进行约束，让最后一个函数的参数约束为和它传入的前置类型一致

```typescript
declare function addImpl(...args: string[], fn: Function): void

addImpl('string', 'boolean', 'number', (a, b, c) => {})
```

实现如下

```typescript
type JSTypeName =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'function'
  | 'symbol'
  | 'undefined'
  | 'bigint'

type JSTypeMap = {
  string: string
  number: number
  boolean: boolean
  object: object
  function: Function
  symbol: symbol
  undefined: undefined
  bigint: bigint
}

type ArgsType<T extends JSTypeName[]> = {
  [K in keyof T]: JSTypeMap[T[K]]
}

declare function addImpl<T extends JSTypeName[]>(
  ...args: [...T, (...args: ArgsType<T>) => any]
): void

addImpl('string', 'boolean', 'number', (a, b, c) => {})
```

关键在于建立字符串和类型的索引

### 实现对象的深度不可变

`typescript`官方提供的`Readonly`只能提供浅层的不可变约束，当值为对象的时候，没有对它的属性进行进一步的约束

```typescript
interface Obj {
  a: number
  b: number
  c: {
    d: number
  }
}

let obj: Readonly<Obj> = {
  a: 1,
  b: 2,
  c: {
    d: 3
  }
}

obj.a = 2 // 报错
obj.c.d = 4 // 不报错
```

可以自己实现一个`DeepReadOnly`进行深层约束

```typescript
type DeepReadonly<T extends Record<string | symbol, any>> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>
}

interface Obj {
  a: number
  b: number
  c: {
    d: number
  }
}

let obj: DeepReadonly<Obj> = {
  a: 1,
  b: 2,
  c: {
    d: 3
  }
}

obj.a = 2 // 报错
obj.c.d = 4 // 报错

let str: DeepReadonly<string> = 1 // 报错
```
