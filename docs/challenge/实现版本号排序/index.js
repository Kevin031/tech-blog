module.exports = function compareVersions(versions) {
  return versions.sort((a, b) => {
    const arrA = a.split('.')
    const arrB = b.split('.')
    const maxLen = Math.max(arrA.length, arrB.length)
    for (let i = 0; i < maxLen; i++) {
      const valueA = BigInt(arrA[i] ?? '0')
      const valueB = BigInt(arrB[i] ?? '0')
      if (valueA < valueB) return -1
      if (valueA > valueB) return 1
    }
    return 0
  })
}
