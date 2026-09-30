import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const Signal = require('../docs/challenge/设计一个程序模拟红绿灯切换/index.js')
const compareVersions = require('../docs/challenge/实现版本号排序/index.js')
const RedPackage = require('../docs/challenge/实现一个拼手气抢红包的算法/index.js')

test('红绿灯的下一状态在黄灯后回到红灯', () => {
  const signal = new Signal({ init: 'yellow', times: [10, 5, 3] })
  assert.equal(signal.next, 'red')
  assert.throws(() => new Signal({ init: 'blue', times: [10, 5, 3] }), /无效/)
})

test('版本号按数字段比较，缺少的末尾段视为零', () => {
  const versions = ['1.2.1', '1.2', '1.10', '1.2.0', '1.90071992547409930', '1.3']
  assert.deepEqual(compareVersions(versions), [
    '1.2', '1.2.0', '1.2.1', '1.3', '1.10', '1.90071992547409930',
  ])
})

test('红包分配保持总额，且每人至少获得一分钱', () => {
  for (let round = 0; round < 50; round += 1) {
    const packageInstance = new RedPackage(10, 13)
    const values = Array.from({ length: 13 }, () => packageInstance.openRedPackage())
    assert(values.every((value) => value >= 0.01 && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8))
    assert.equal(values.reduce((sum, value) => sum + Math.round(value * 100), 0), 1000)
    assert.equal(packageInstance.count, 0)
    assert.equal(packageInstance.openRedPackage(), undefined)
  }
  assert.throws(() => new RedPackage(0.01, 2), /金额/)
  assert.throws(() => new RedPackage(1.001, 1), /金额/)
})
