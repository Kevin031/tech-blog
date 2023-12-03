const cloneDeep = (target, map = new WeakMap()) => {
  // 如果是基本类型，直接返回
  if (typeof target !== 'object' || target === null) return target

  // 对函数、日期、正则、Map、Set等对象执行构造函数
  const constructor = target.constructor
  if (/^(Function|RegExp|Date|Map|Set)$/i.test(constructor.name)) {
    return new constructor(target)
  }

  // 执行对象拷贝
  let cloneTarget = Array.isArray(target) ? [] : {}

  // 标记出现过的属性，避免循环引用
  if (map.get(target)) return map.get(target)
  map.set(target, true)

  // 遍历原始对象
  for (let prop in target) {
    cloneTarget[prop] = cloneDeep(target[prop], map)
  }

  return cloneTarget
}
