const { describe } = require('node:test')
const {
  floatAdd,
  arraySet,
  arrayFlat,
  arrayReduce,
  arraySort,
  priceFormat,
  camelCase,
  hexToRgb,
  getQueryString,
  instanceOf,
  curry,
  createFiberRoot
} = require('./utils')

describe('test', () => {
  test('float add', () => {
    expect(floatAdd(0.1, 0.2)).toBe(0.3)
    expect(floatAdd(0.1, 0.02)).toBe(0.12)
    expect(floatAdd(100, 0.1)).toBe(100.1)
    expect(floatAdd(100, 200)).toBe(300)
  })

  test('array set', () => {
    expect(arraySet([1, 2, 2, 3, 4, 4, 5])).toStrictEqual([1, 2, 3, 4, 5])
  })

  test('array flat', () => {
    expect(arrayFlat([1, [2, 2, [3, 4, 4, 5]]])).toStrictEqual([
      1, 2, 2, 3, 4, 4, 5
    ])
  })

  test('array reduce', () => {
    let arr = [1, 2, 3, 4, 5]
    let result = arrayReduce(
      arr,
      (a, b) => {
        return a + b
      },
      0
    )
    expect(result).toBe(15)
  })

  test('array sort', () => {
    let arr = [19, 97, 9, 19, 17, 1, 8]
    expect(arraySort(arr)).toStrictEqual([1, 8, 9, 17, 19, 19, 97])
  })

  test('price format', () => {
    expect(priceFormat(1000000000)).toBe('1,000,000,000')
  })

  test('camel case', () => {
    expect(camelCase('request_animation_frame')).toBe('requestAnimationFrame')
  })

  test('hex to rgb', () => {
    expect(hexToRgb('#ffffff')).toBe('rgb(255, 255, 255)')
    expect(hexToRgb('#000')).toBe('rgb(0, 0, 0)')
  })

  test('get query string', () => {
    expect(getQueryString('http://a.com?a=1&b=hello&c=world')).toStrictEqual({
      a: '1',
      b: 'hello',
      c: 'world'
    })
  })

  test('is prototype of', () => {
    function Foo() {}
    function Bar(...args) {
      // 调用以下Foo的构造函数
      Foo.call(this, ...args)
    }
    // 连接原型链
    Bar.prototype = Object.create(Foo.prototype)
    // Bar.constructor = Bar;
    let foo = new Foo()
    let bar = new Bar()
    expect(instanceOf(foo, Foo)).toBe(true)
    expect(instanceOf(bar, Bar)).toBe(true)
    expect(instanceOf(bar, Foo)).toBe(true)
    expect(bar instanceof Foo).toBe(true)
  })

  test('curry', () => {
    const sum = function (...args) {
      return Array.from(args).reduce((a, b) => a + b, 0)
    }
    const currySum = curry(sum)
    const result = currySum(1)(2)(3)()
    expect(result).toBe(6)
  })

  test('fiber', () => {
    let root = {
      tag: 'div',
      children: [
        {
          tag: 'ul',
          props: { class: 'list' },
          children: [
            {
              tag: 'li',
              children: [
                {
                  tag: 'p',
                  children: ['douyin']
                }
              ]
            },
            {
              tag: 'li',
              children: [
                {
                  tag: 'p',
                  children: ['toutiao']
                }
              ]
            }
          ]
        }
      ]
    }
    const fiber = createFiberRoot(root)
    console.log(fiber)
  })
})
