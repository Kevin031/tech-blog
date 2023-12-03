class RedPackage {
  // 红包总金额
  money = 0
  // 红包总量
  count = 0
  // 剩余金额
  _remain = 0

  constructor(money, count) {
    if (money < count * 0.01) {
      throw new Error('红包总金额必须大于' + count * 0.01)
    }

    this.money = money
    this.count = count
    this._remain = money
  }

  getRandomMoney() {
    // 如果剩余金额不足每人分到0.01，减少本次金额
    return parseFloat(
      (0.01 + Math.random() * (this._remain - 0.01 * this.count)).toFixed(2)
    )
  }

  static floatAdd(a, b) {
    return Math.floor(a * 100 + b * 100) / 100
  }

  static floatSub(a, b) {
    return Math.round(a * 100 - b * 100) / 100
  }

  openRedPackge() {
    if (this.count === 0) {
      console.log('红包已经抢完啦')
      return
    }

    if (this.count === 1) {
      let result = this._remain
      this._remain = 0
      this.count = 0
      return result
    }

    let randomMoney = this.getRandomMoney()
    this._remain = RedPackage.floatSub(this._remain, randomMoney)
    this.count--
    return randomMoney
  }
}

module.exports = RedPackage
