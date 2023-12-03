module.exports = function compareVersions(versions) {
  return versions.sort((a, b) => {
    let arrA = a.split('.')
    let arrB = b.split('.')
    const maxLen = Math.max(arrA.length, arrB.length)
    for (let i = 0; i < maxLen; i++) {
      const valueA = arrA[i]
      const valueB = arrB[i]
      if (valueA === valueB) {
        // 继续对比小版本
        continue
      } else {
        return valueA - valueB
      }
    }
    return 0
  })
}
