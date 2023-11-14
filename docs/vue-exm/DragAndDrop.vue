<template>
  <div
    class="container"
    @dragstart="handleSourceDragStart"
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
      <div class="list" data-drop="copy" data-drop-type="list">
        <div
          class="item"
          v-for="(item, index) in targetList.first"
          data-drop="copy"
          data-drop-type="item"
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
      <div class="list" data-drop="copy" data-drop-type="list">
        <div
          class="item"
          v-for="(item, index) in targetList.second"
          data-drop="copy"
          data-drop-type="item"
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
import { reactive, ref } from "vue";

// 放置提示样式
const LIST_DROPPABLE = "droppable";

// 拖拽容器node
const dragContainer = ref();

// 当前正在拖拽的元素
let dragTarget;

// 原始列表
const sourceList = ref(
  Array(7)
    .fill("")
    .map((_, idx) => ({
      name: `元素${idx + 1}`,
    }))
);

// 接受数据的列表
const targetList = reactive({
  first: [
    {
      name: "复制元素1",
    },
    {
      name: "复制元素2",
    },
  ],
  second: [],
});

/**
 * 清除所有放置样式
 */
const clearDropStyle = () => {
  dragContainer.value.querySelectorAll(`.${LIST_DROPPABLE}`).forEach((node) => {
    node.classList.remove(LIST_DROPPABLE);
  });
};

/**
 * 处理开始拖拽的逻辑
 * @param {*} evt
 */
const handleSourceDragStart = (evt) => {
  dragTarget = evt.target;
  const { effect, index } = dragTarget.dataset;
  console.log("effect", effect);
  evt.dataTransfer.effectAllowed = effect;
  evt.dataTransfer.setData(
    "dataSource",
    JSON.stringify(sourceList.value[Number(index)])
  );
};

/**
 * 处理进入拖放区域的逻辑
 * @param {*} evt
 */
const handleDragEnter = (evt) => {
  clearDropStyle();
  let dropNode = evt.target.closest("[data-drop]");
  if (
    dropNode &&
    dropNode.dataset.drop &&
    dropNode.dataset.drop === evt.dataTransfer.effectAllowed
  ) {
    dropNode.classList.add(LIST_DROPPABLE);
  }
};

const getTransferDataSource = (evt) => {
  try {
    let res = JSON.parse(evt.dataTransfer.getData("dataSource"));
    return res;
  } catch {
    return undefined;
  }
};

/**
 * 处理放置逻辑
 * @param {*} evt
 */
const handleDrop = (evt) => {
  clearDropStyle();
  let dataSource = getTransferDataSource(evt);
  let dropNode = evt.target.closest("[data-drop]");

  if (!evt.dataTransfer || !dataSource) return;
  if (!dataSource || !dropNode) return;

  const wrapperNode = dropNode.closest(`.target-list[data-model]`);
  const modelName = wrapperNode.dataset.model;
  const { dropType = "list", index, drop } = dropNode.dataset;
  console.log("drop", drop, dragTarget.dataset);
  if (drop !== dragTarget.dataset.effect) return;
  handleListAdd(modelName, dataSource, dropType, Number(index));
};

const handleListAdd = (modelName, dataSource, dropType, index) => {
  dataSource.name = "复制" + dataSource.name;
  if (!(modelName in targetList)) return;
  if (dropType === "item") {
    targetList[modelName].splice(index + 1, 0, dataSource);
  } else {
    targetList[modelName].push(dataSource);
  }
};
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
        content: "";
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
