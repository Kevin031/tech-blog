class RedPackage {
  // 红包总金额
  money = 0
  // 红包总量
  count = 0
  // 剩余金额
  _remain = 0
  _remainCents = 0

  constructor(money, count) {
    const cents = Math.round(money * 100)
    if (!Number.isFinite(money) || !Number.isSafeInteger(cents) ||
        Math.abs(money * 100 - cents) > 1e-8 ||
        !Number.isInteger(count) || count <= 0 || cents < count) {
      throw new Error('金额须为至少每人一分钱的两位小数，人数须为正整数')
    }

    this.money = money
    this.count = count
    this._remain = money
    this._remainCents = cents
  }

  getRandomMoney() {
    // 给后续每人至少保留一分钱，所有计算都以分为单位。
    const maxCents = this._remainCents - this.count + 1
    return (1 + Math.floor(Math.random() * maxCents)) / 100
  }

  static floatAdd(a, b) {
    return (Math.round(a * 100) + Math.round(b * 100)) / 100
  }

  static floatSub(a, b) {
    return Math.round(a * 100 - b * 100) / 100
  }

  openRedPackage() {
    if (this.count === 0) {
      return
    }

    if (this.count === 1) {
      const result = this._remainCents / 100
      this._remain = 0
      this._remainCents = 0
      this.count = 0
      return result
    }

    const randomMoney = this.getRandomMoney()
    this._remainCents -= Math.round(randomMoney * 100)
    this._remain = this._remainCents / 100
    this.count--
    return randomMoney
  }

  openRedPackge() {
    return this.openRedPackage()
  }
}

module.exports = RedPackage
