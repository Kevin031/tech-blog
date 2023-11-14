<script setup>
import DragAndDrop from "../../vue-exm/DragAndDrop.vue";
</script>

# 浏览器拖放操作 API

HTML 拖放（Drag and Drop）接口使应用程序能够在浏览器中使用拖放功能。例如，用户可使用鼠标选择可拖拽（draggable）元素，将元素拖拽到可放置（droppable）元素，并释放鼠标按钮以放置这些元素。拖拽操作期间，会有一个可拖拽元素的半透明快照跟随着鼠标指针。

具体可以参考 MDN 文档：[https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_Drag_and_Drop_API](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_Drag_and_Drop_API)

Demo 演示：

<DragAndDrop />

源码：

<<< ../../vue-exm/DragAndDrop.vue
