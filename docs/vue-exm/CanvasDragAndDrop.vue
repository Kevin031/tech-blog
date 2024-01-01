<template>
  <canvas ref="cvsRef" style="width: 700px; height: 800px"></canvas>
</template>

<script setup lang="ts">
import { ElementNode } from '@vue/compiler-core'
import { ref, onMounted } from 'vue'

const cvsRef = ref<any>()

const getRandom = (min, max) => {
  return Math.floor(min + Math.random() * (max - min))
}

onMounted(() => {
  const canvas = cvsRef.value as HTMLCanvasElement
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  canvas.width = 700 * devicePixelRatio
  canvas.height = 800 * devicePixelRatio

  const init = () => {
    ctx.strokeStyle = '#000'
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
  }
  init()

  class Rectangle {
    color: string
    startX: number
    startY: number
    endX: number
    endY: number

    constructor(color, startX, startY) {
      this.color = color
      this.startX = startX
      this.startY = startY
      this.endX = startX
      this.endY = startY
    }

    get minX() {
      return Math.min(this.startX, this.endX) * devicePixelRatio
    }

    get maxX() {
      return Math.max(this.startX, this.endX) * devicePixelRatio
    }

    get minY() {
      return Math.min(this.startY, this.endY) * devicePixelRatio
    }

    get maxY() {
      return Math.max(this.startY, this.endY) * devicePixelRatio
    }

    draw() {
      ctx.beginPath()
      ctx.moveTo(this.minX, this.minY)
      ctx.lineTo(this.maxX, this.minY)
      ctx.lineTo(this.maxX, this.maxY)
      ctx.lineTo(this.minX, this.maxY)
      ctx.lineTo(this.minX, this.minY)
      ctx.lineCap = 'square'
      ctx.fillStyle = this.color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 3
      ctx.stroke()
    }

    isInside(x, y) {
      x *= devicePixelRatio
      y *= devicePixelRatio
      return (
        x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY
      )
    }
  }

  const shapes: Rectangle[] = []

  const draw = () => {
    requestAnimationFrame(draw)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const shape of shapes) {
      shape.draw()
    }
  }

  const getShape = (x, y) => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i]
      if (shape.isInside(x, y)) {
        return shape
      }
    }
    return null
  }

  canvas.onmousedown = e => {
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const existShape = getShape(clickX, clickY)
    if (existShape) {
      const { startX, startY, endX, endY } = existShape
      // 拖动
      window.onmousemove = e => {
        const disX = e.clientX - rect.left - clickX
        const disY = e.clientY - rect.top - clickY
        existShape.startX = startX + disX
        console.log('disX', disX, startX, existShape.startX)
        existShape.endX = endX + disX
        existShape.startY = startY + disY
        existShape.endY = endY + disY
      }
    } else {
      // 新建
      const shape = new Rectangle('#f00', clickX, clickY)
      shapes.push(shape)
      window.onmousemove = e => {
        shape.endX = e.clientX - rect.left
        shape.endY = e.clientY - rect.top
        draw()
      }
    }

    window.onmouseup = e => {
      window.onmousemove = null
      window.onmouseup = null
    }
  }
})
</script>
