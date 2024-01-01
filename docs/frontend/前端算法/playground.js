// add.call(obj, 1, 2)
Function.prototype.myCall = function (context, ...args) {
  if (typeof context === 'object' ? context : {}) var key = Symbol()
  context[key] = this
  let fn = function () {
    return context[key](...args)
  }
  key = null
  return fn()
}
