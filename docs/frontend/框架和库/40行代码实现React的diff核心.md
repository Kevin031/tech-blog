# 40 行代码实现 React 的 diff 算法核心逻辑

```ts
// Placement表示对应的元素需要插入页面，Deletion表示元素需要被删除
type Flag = 'Placement' | 'Deletion'

interface FiberNode {
  key: string
  flag?: Flag
  index?: number
}

type FiberNodeList = FiberNode[]

function diff(before: FiberNodeList, after: FiberNodeList): FiberNodeList {
  let lastPlacedIndex = 0
  const result: FiberNodeList = []

  const beforeMap = new Map<string, FiberNode>()
  before.forEach((node, i) => {
    node.index = i
    beforeMap.set(node.key, node)
  })

  for (let i = 0; i < after.length; i++) {
    const afterNode = after[i]
    afterNode.index = i
    const beforeNode = beforeMap.get(afterNode.key)

    if (beforeNode) {
      // 可以复用旧节点
      beforeMap.delete(beforeNode.key)

      const oldIndex = beforeNode.index as number
      if (oldIndex < lastPlacedIndex) {
        afterNode.flag = 'Placement'
        result.push(afterNode)
        continue
      } else {
        lastPlacedIndex = oldIndex
      }
    } else {
      // 创建新节点
      afterNode.flag = 'Placement'
      result.push(afterNode)
    }
  }

  beforeMap.forEach(node => {
    node.flag = 'Deletion'
    result.push(node)
  })

  return result
}

// 更新前
const before = [{ key: 'a' }]

const after = [{ key: 'd' }]

diff(before, after) // 输出 [{ key: 'd', flag: 'Placement' }, { key: 'a', flag: 'Deletion' }]
```
