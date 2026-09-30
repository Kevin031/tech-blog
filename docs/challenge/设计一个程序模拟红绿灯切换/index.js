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
  end = 0
  running = false
  constructor(data) {
    if (!serial.includes(data.init) || !Array.isArray(data.times) ||
        data.times.length !== serial.length ||
        data.times.some(time => !Number.isFinite(time) || time <= 0)) {
      throw new Error('初始灯色或持续时间无效')
    }
    this.sig = data.init
    this.times = data.times
    this.setTime()
  }

  get remain() {
    let diff = this.end - Date.now()
    if (diff < 0) {
      diff = 0
    }
    return Math.ceil(diff / 1000)
  }

  get next() {
    const nextIdx = (serial.indexOf(this.sig) + 1) % serial.length
    return serial[nextIdx]
  }

  async start() {
    if (this.running) return
    this.running = true
    while (this.running) {
      if (this.remain === 0) {
        this.sig = this.next
        this.setTime()
      }
      console.log(this.remain, this.sig)
      await delay(1000)
    }
  }

  stop() {
    this.running = false
  }

  setTime() {
    const time = this.times[serial.indexOf(this.sig)]
    this.end = Date.now() + time * 1000
  }
}

module.exports = Signal

if (require.main === module) {
  new Signal({ init: 'red', times: [10, 5, 3] }).start()
}
