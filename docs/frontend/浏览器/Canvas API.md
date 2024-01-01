# Canvas API

## 基本绘图

```js
// 获取绘制上下文
const ctx = canvas.getContext('2d')
// 使用上下文对象ctx完成后续绘图
```

**2d 的 canvas 上下文支持以下图形的绘制**：

1. 直线（矩形 API）

`ctx.beginPath`, `ctx.moveTo`, `ctx.lineTo`, `ctx.stroke`, `ctx.closePath`

2. 曲线（椭圆 API）

`ctx.arc`

3. 文字

`ctx.font`, `ctx.fillText`, `ctx.strokeText`

4. 图片

`ctx`

**绘制流程**：

1. 生成路径

2. 绘制

```vue
<template>
  <canvas ref="canvasRef" width="600" height="400"></canvas>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const canvasRef = ref()
onMounted(() => {
  const canvas = canvasRef1.value

  const ctx = canvas.getContext('2d')

  // 画一个三角形
  ctx.beginPath()
  ctx.moveTo(100, 50)
  ctx.lineTo(300, 100)
  ctx.lineTo(123, 222)
  ctx.closePath()
  ctx.strokeStyle = '#000'
  ctx.stroke()

  // 画一个圆
  ctx.beginPath()
  ctx.arc(200, 300, 100, 0, 2 * Math.PI)
  ctx.strokeStyle = '#f00'
  ctx.stroke()

  // 画文字
  ctx.font = '50px serif'
  ctx.fillText('Hello world', 300, 100)

  // 画图片
  let image = new Image()
  image.src = '/img-example.jpg'
  image.onload = () => {
    ctx.drawImage(
      image,
      350,
      200,
      image.naturalWidth / 4,
      image.naturalHeight / 4
    )
  }
})
</script>
```

<canvas ref="canvasRef1" width="600" height="400"></canvas>

<script setup>
  import CanvasLinePoint from '../../vue-exm/CanvasLinePoint.vue'
  import CanvasDragAndDrop from '../../vue-exm/CanvasDragAndDrop.vue'
  import { ref, onMounted } from 'vue'
  const canvasRef1 = ref()
  onMounted(() => {
    const canvas = canvasRef1.value

    const ctx = canvas.getContext('2d')

    // 画一个三角形
    ctx.beginPath()
    ctx.moveTo(100, 50)
    ctx.lineTo(300, 100)
    ctx.lineTo(123, 222)
    ctx.closePath()
    ctx.strokeStyle = '#000'
    ctx.stroke()

    // 画一个圆
    ctx.beginPath()
    ctx.arc(200, 300, 100, 0, 2 * Math.PI)
    ctx.strokeStyle = '#f00'
    ctx.stroke()

    // 画文字
    ctx.font = '50px serif'
    ctx.fillText("Hello world", 300, 100);

    // 画图片
    let image = new Image()
    image.src = '/img-example.jpg'
    image.onload = () => {
      ctx.drawImage(image, 350, 200, image.naturalWidth / 4, image.naturalHeight / 4)
    }
  })
</script>

## 自定义封装方法

<CanvasLinePoint />

源码如下：

<<< ../../vue-exm/CanvasLinePoint.vue

## 在 canvas 中进行用户交互

<CanvasDragAndDrop />

源码如下：

<<< ../../vue-exm/CanvasDragAndDrop.vue
