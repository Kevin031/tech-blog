interface Article {
  title: string
  content: string
  author: string
  date?: Date
  readCount?: number
}

// type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// type CreateArticleOptions = Optional<Article, "author" | "date" | "readCount">;

type GetOptional<T> = {
  [P in keyof T as T[P] extends Required<T>[P] ? never : P]: T[P]
}

type Optionals = GetOptional<Article>

// function createArticle(options: GetOptional<Article>) {
//   console.log(options);
//   options.readCount
// }

type User = {
  user: string
  age: number
}

type UserAction = {
  [P in keyof User as `get${Capitalize<P>}`]: () => User[P]
}

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

type sum = (a: number, b: number) => number
type concat = (a: any[], b: any[]) => any[]

type Return<T> = T extends (...args: any[]) => infer R ? R : T

let sumResult: Return<sum>
let concatResult: Return<concat>

function conbindFn(value) {}

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  X: infer R
) => any
  ? R
  : never

type Test = { a: string } | { b: number } | { c: boolean }

type BothTest = UnionToIntersection<Test>

type Big = {
  a: number
}

type Small = {
  a: number
  b: number
}

let a: Big = { a: 1 }
let b: Small = { a: 1, b: 2 }

type fn1 = (x: { a: string }) => any
type fn2 = (x: { b: number }) => any
type fn3 = fn1 | fn2

function method(fn: fn3) {
  fn({ a: '1', b: 2 })
}

// fn2 = fn1;
// fn1 = fn2 // 报错

type PromiseType<T> = T extends Promise<infer K> ? PromiseType<K> : T

type pt = PromiseType<Promise<string>> // string
type pt2 = PromiseType<Promise<Promise<string>>> // string

type FirstArg<T> = T extends (first: infer F, ...args: any[]) => any ? F : T

type fa = FirstArg<(name: string, age: number) => void>

type ArrayType<T> = T extends (infer I)[] ? I : T
type ItemType1 = ArrayType<[string, number]> // stirng | number
type ItemType2 = ArrayType<string[]> // string[]

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

type DeepReadonly<T extends Record<string | symbol, any>> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>
}
