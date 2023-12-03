const serial = ['red', 'green', 'yellow']

const delay = (duration = 1000) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, duration)
  })
}

// 设计一个程序，模拟红绿灯切换
class Signal {
  sig = ''
  times = [0, 0, 0]
  start = 0
  end = 0
  constructor(data) {
    this.sig = data.init
    this.times = data.times
    this.setTime()
    this.exchange()
  }

  get remain() {
    let diff = this.end - Date.now()
    if (diff < 0) {
      diff = 0
    }
    return Math.ceil(diff / 1000)
  }

  get next() {
    const nextIdx = serial.indexOf(this.sig) + (1 % serial.length)
    return serial[nextIdx]
  }

  async exchange() {
    if (this.remain > 0) {
      console.log(this.remain, this.sig)
      await delay(1000)
    } else {
      this.sig = this.next
      this.setTime()
    }
    this.exchange()
  }

  setTime() {
    this.start = Date.now()
    const time = this.times[serial.indexOf(this.sig)]
    this.end = this.start + time * 1000
  }
}

let s = new Signal({ init: 'red', times: [10, 5, 3] })
