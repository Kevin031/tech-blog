const cloneDeep = (target, seen = new WeakMap()) => {
  if (typeof target !== 'object' || target === null) return target
  if (seen.has(target)) return seen.get(target)

  if (target instanceof Date) return new Date(target.getTime())
  if (target instanceof RegExp) {
    const copy = new RegExp(target.source, target.flags)
    copy.lastIndex = target.lastIndex
    return copy
  }
  if (target instanceof Map) {
    const copy = new Map()
    seen.set(target, copy)
    for (const [key, value] of target) {
      copy.set(cloneDeep(key, seen), cloneDeep(value, seen))
    }
    return copy
  }
  if (target instanceof Set) {
    const copy = new Set()
    seen.set(target, copy)
    for (const value of target) copy.add(cloneDeep(value, seen))
    return copy
  }

  const copy = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target))
  seen.set(target, copy)
  for (const key of Reflect.ownKeys(target)) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    if ('value' in descriptor) descriptor.value = cloneDeep(descriptor.value, seen)
    Object.defineProperty(copy, key, descriptor)
  }
  return copy
}

module.exports = cloneDeep
