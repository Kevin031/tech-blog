<template>
  <div
    class="container"
    @dragstart="handleDragStart"
    @dragover.prevent=""
    @dragenter="handleDragEnter"
    @drop="handleDrop"
    ref="dragContainer"
  >
    <div class="source-list">
      <div class="title">原始列</div>
      <div class="list">
        <div
          class="item"
          v-for="(item, index) in sourceList"
          draggable="true"
          data-effect="copy"
          :data-index="index"
        >
          <div class="item-node">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>
    <div class="target-list" data-model="first">
      <div class="title">目标列1</div>
      <div
        class="list"
        :data-drop="targetListAllowedType"
        data-drop-type="list"
      >
        <div
          class="item"
          v-for="(item, index) in targetList.first"
          :data-drop="targetListAllowedType"
          data-drop-type="item"
          draggable="true"
          data-effect="move"
          :data-index="index"
        >
          <div class="item-node">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>
    <div class="target-list" data-model="second">
      <div class="title">目标列2</div>
      <div
        class="list"
        :data-drop="targetListAllowedType"
        data-drop-type="list"
      >
        <div
          class="item"
          v-for="(item, index) in targetList.second"
          :data-drop="targetListAllowedType"
          data-drop-type="item"
          draggable="true"
          data-effect="move"
          :data-index="index"
        >
          <div class="item-node">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

// 是否正在排序
const isMoving = ref(false)

// 拖拽容器node
const dragContainer = ref()

// 放置提示样式
const LIST_DROPPABLE = 'droppable'

// 当前正在拖拽的元素
let currentDrag = {
  target: null
}

const targetListAllowedType = computed(() => {
  return isMoving.value ? 'move' : 'copy'
})

// 原始列表
const sourceList = ref(
  Array(7)
    .fill('')
    .map((_, idx) => ({
      name: `元素${idx + 1}`
    }))
)

// 接受数据的列表
const targetList = reactive({
  first: [
    {
      name: '复制元素1'
    },
    {
      name: '复制元素2'
    },
    {
      name: '复制元素3'
    },
    {
      name: '复制元素4'
    },
    {
      name: '复制元素5'
    }
  ],
  second: []
})

/**
 * 清除所有放置样式
 */
const clearDropStyle = () => {
  dragContainer.value.querySelectorAll(`.${LIST_DROPPABLE}`).forEach(node => {
    node.classList.remove(LIST_DROPPABLE)
  })
}

/**
 * 处理开始拖拽的逻辑
 * @param {*} evt
 */
const handleDragStart = evt => {
  const { effect, index } = evt.target.dataset
  evt.dataTransfer.effectAllowed = effect
  evt.dataTransfer.setData('oldIndex', index)
  currentDrag = {
    target: evt.target,
    index
  }
  if (effect === 'move') {
    let modelName = evt.target.closest('[data-model]').dataset.model
    currentDrag.modelName = modelName
    evt.dataTransfer.setData(
      'dataSource',
      JSON.stringify(targetList[modelName][Number(index)])
    )
    isMoving.value = true
  } else {
    evt.dataTransfer.setData(
      'dataSource',
      JSON.stringify(sourceList.value[Number(index)])
    )
    isMoving.value = false
  }
}

const getElementModelName = ele => {
  return ele.closest('[data-model]')?.dataset.model
}

const getElementIndex = ele => {
  return ele.closest('[data-index]')?.dataset.index
}

/**
 * 处理进入拖放区域的逻辑
 * @param {*} evt
 */
const handleDragEnter = evt => {
  clearDropStyle()
  let dropNode = evt.target.closest('[data-drop]')
  let dropAllowedType = dropNode?.dataset?.drop
  if (dropAllowedType === evt.dataTransfer.effectAllowed) {
    // 如果是移动且index是它自己，则不考虑
    if (dropAllowedType === 'move') {
      let oldIndex = currentDrag.index
      let oldModelName = currentDrag.modelName
      let modelName = getElementModelName(evt.target)
      let index = getElementIndex(evt.target)
      if (oldModelName === modelName && index === oldIndex) {
        evt.stopPropagation()
        return
      }
    }
    dropNode.classList.add(LIST_DROPPABLE)
  }
}

const getTransferDataSource = evt => {
  try {
    let res = JSON.parse(evt.dataTransfer.getData('dataSource'))
    return res
  } catch {
    return undefined
  }
}

/**
 * 处理放置逻辑
 * @param {*} evt
 */
const handleDrop = evt => {
  clearDropStyle()
  let dataSource = getTransferDataSource(evt)
  let dropNode = evt.target.closest('[data-drop]')

  if (!evt.dataTransfer || !dataSource) return
  if (!dataSource || !dropNode) return

  const wrapperNode = dropNode.closest(`.target-list[data-model]`)
  const modelName = wrapperNode.dataset.model
  let { dropType = 'list', index, drop } = dropNode.dataset
  if (!index) {
    index = targetList[modelName].length
  }
  if (drop !== currentDrag.target.dataset.effect) return
  if (drop === 'copy') {
    handleListAdd(modelName, dataSource, dropType, Number(index))
  } else if (drop === 'move') {
    let { index: oldIndex, modelName: oldModelName } = currentDrag
    handleListMove(
      modelName,
      oldModelName,
      dataSource,
      Number(index),
      Number(oldIndex)
    )
  }
}

/**
 * 处理列表复制
 * @param {string} modelName 模型名称
 * @param {object} dataSource 数据源
 * @param {'list' | 'item'} dropType 放置类型，list、item
 * @param {number} index 放置位置
 */
const handleListAdd = (modelName, dataSource, dropType, index) => {
  dataSource.name = '复制' + dataSource.name
  if (!(modelName in targetList)) return
  if (dropType === 'item') {
    targetList[modelName].splice(index + 1, 0, dataSource)
  } else {
    targetList[modelName].push(dataSource)
  }
}

/**
 * 处理列表移动
 * @param {string} modelName 模型名称
 * @param {string} oldModelName 旧的模型名称
 * @param {object} dataSource 数据源
 * @param {number} index 放置位置
 * @param {number} oldIndex 原来的位置
 */
const handleListMove = (
  modelName,
  oldModelName,
  dataSource,
  index,
  oldIndex
) => {
  if (modelName === oldModelName) {
    if (index > oldIndex) {
      // 增加
      targetList[modelName].splice(index + 1, 0, dataSource)
      // 移除
      targetList[modelName].splice(oldIndex, 1)
    } else {
      // 移除
      targetList[modelName].splice(oldIndex, 1)
      // 增加，由于移除后少了1位，所以这里是index
      targetList[modelName].splice(index, 0, dataSource)
    }
  } else {
    // 增加
    targetList[modelName].splice(index + 1, 0, dataSource)
    // 移除
    targetList[oldModelName].splice(oldIndex, 1)
  }
}
</script>

<style lang="less" scoped>
.container {
  display: flex;

  .source-list,
  .target-list {
    background-color: #f2f2f2;
    width: 200px;
    margin-right: 16px;
    border: solid 1px #ddd;

    .title {
      height: 56px;
      line-height: 56px;
      padding: 0 16px;
      border-bottom: solid 1px #ddd;
      background-color: #fff;
    }

    .list {
      padding: 16px;
      min-height: 500px;

      &.droppable {
        background-color: aqua;
      }
    }

    .item {
      &::after {
        content: '';
        display: none;
        height: 10px;
        background-color: aqua;
      }

      &.droppable {
        &:after {
          display: block;
        }
      }
    }

    .item-node {
      padding: 0 16px;
      height: 56px;
      line-height: 56px;
      background-color: #fff;
      border: solid 1px #ddd;
    }
  }
}
</style>
