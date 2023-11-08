# 如何理解 BFC

## 概念

块级格式化上下文 Block Formatting Context，简称 BFC。

它是一块**独立的**渲染区域，它规定了在该区域中，**常规流块盒的布局**。

- 常规流块盒在水平方向上，必须撑满包含块

- 常规流块盒在包含块的垂直方向上依次摆放

- 常规流块盒若外边距无缝相邻，则进行外边距合并

- 常规流块盒的自动高度和摆放位置，无视浮动元素

例子 1：高度坍塌问题

<script setup>
import { ref } from 'vue'

const boxList = ref(Array(10).fill(""))
</script>

<style scoped>
.container-1 {
  background-color: green;
  overflow: hidden;
}
.box-1 {
  width: 100px;
  height: 100px;
  background-color: red;
  float: left;
  margin-right: 30px;
  margin-bottom: 30px;
}
</style>

<div class="container-1">
  <div v-for="box in boxList" class="box-1"></div>
</div>

不同的 BFC 区域，它们进行渲染时互不干扰。

- BFC 元素内部的渲染不会影响到外部

- 创建 BFC 的元素，它的高度需要计算浮动元素

- 创建 BFC 的元素，它的边框盒不会和浮动元素重叠

- 创建 BFC 的元素，不会和它的子元素进行**外边距合并**（同一个 BFC 的元素才能合并）

例子 2：外边距合并问题

<div class="container-2">
  <div class="container-3"></div>
</div>

<style scoped>
.container-2 {
  background-color: green;
  margin-top: 30px;
  height: 300px;
  overflow: hidden;
}
.container-3 {
  background-color: red;
  margin-top: 30px;
  height: 200px;
}
</style>

以下元素会在内部创建 BFC 区域：

- 根元素

- 浮动和绝对定位元素

- overflow 不等于 visible 的块盒

- display 属性为 table 的元素

成本最小的方式：`overflow: hidden`

<!-- ## 视觉格式化模型

视觉格式化模型是浏览器根据基础盒模型将文档元素转换成一个个盒子的算法，它规定了客户端在媒介中如何处理文档树。

视觉格式化模型中包含了块级格式化上下文。

盒子的布局由以下因素决定：

1. 尺寸：宽高

2. 类型：行盒、快盒

3. 定位：正常流、浮动、绝对定位

4. 文档树中，当前盒子的子元素和兄弟元素

5. 视口的尺寸和位置

6. 盒子内部图片的尺寸

...

视觉格式化模型的计算取决于一个矩形的边界，这个矩形被称称作是**包含块**。

一般来说元素生成的框，又会扮演其子元素包含块的角色。 -->
