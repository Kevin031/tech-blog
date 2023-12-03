function* walk(str) {
  let part = ''
  for (let i = 0; i < str.length; i++) {
    part += str[i]
    yield part
  }
}

function compare(s1, s2) {
  let genS1 = walk(s1)
  let genS2 = walk(s2)
  while (true) {
    const n1 = genS1.next()
    const n2 = genS2.next()
    if (n1.value !== n2.value) {
      return false
    }

    if (n1.done && n2.done) {
      return true
    }
  }
}

const s1 = '1234567777'
const s2 = '1234567777'

console.log(compare(s1, s2))
