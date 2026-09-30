import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const cloneDeep = require('../docs/challenge/实现对象深拷贝/index.js')

test('深拷贝保留循环引用、共享引用以及 Map 和 Set 中的嵌套对象', () => {
  const value = { count: 1 }
  const source = { value, also: value }
  source.self = source
  source.map = new Map([[value, { nested: value }]])
  source.set = new Set([source])

  const copy = cloneDeep(source)
  assert.notEqual(copy, source)
  assert.equal(copy.self, copy)
  assert.equal(copy.value, copy.also)
  assert.notEqual(copy.value, value)
  assert.equal(copy.map.get(copy.value).nested, copy.value)
  assert.equal([...copy.set][0], copy)
})

test('深拷贝保留符号属性和属性描述符，独立复制日期与正则', () => {
  const symbol = Symbol('value')
  const source = { date: new Date('2024-01-01'), regex: /test/gi }
  source.regex.lastIndex = 2
  Object.defineProperty(source, symbol, { value: { hidden: true }, enumerable: false })

  const copy = cloneDeep(source)
  assert.notEqual(copy.date, source.date)
  assert.equal(copy.date.getTime(), source.date.getTime())
  assert.notEqual(copy.regex, source.regex)
  assert.equal(copy.regex.lastIndex, 2)
  assert.notEqual(copy[symbol], source[symbol])
  assert.equal(Object.getOwnPropertyDescriptor(copy, symbol).enumerable, false)
})
