const RedPackage = require('./index')

describe('main', () => {
  it('happy path', () => {
    let money = 100
    let count = 20
    const redPackage = new RedPackage(money, count)
    const result = []
    for (let i = 0; i < count; i++) {
      let current = redPackage.openRedPackge()
      result.push(current)
    }
    let sum = result.reduce((a, b) => RedPackage.floatAdd(a, b), 0)
    console.log(result)
    expect(sum).toBe(money)
    let next = redPackage.openRedPackge()
    expect(next).toBeUndefined()
  })
})
