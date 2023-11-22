<template>
  <canvas
    ref="cvsRef"
    style="width: 100vw; height: 100vh; background-color: #000"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const cvsRef = ref<any>();

const getRandom = (min, max) => {
  return Math.floor(min + Math.random() * (max - min));
};

onMounted(() => {
  const canvas = cvsRef.value;
  const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  /**
   * 生成一个点
   */
  class Point {
    x: number;
    y: number;
    r: number;
    xSpeed: number;
    ySpeed: number;
    lastDrawTime: number | null;

    constructor() {
      this.r = 2 * devicePixelRatio;
      this.x = getRandom(0, canvas.width - this.r / 2);
      this.y = getRandom(0, canvas.height - this.r / 2);
      this.xSpeed = getRandom(-50, 50);
      this.ySpeed = getRandom(-50, 50);
      this.lastDrawTime = null;
    }

    draw() {
      if (this.lastDrawTime) {
        // 计算新的坐标
        const duration = (Date.now() - this.lastDrawTime) / 1000;
        const xDis = this.xSpeed * duration;
        const yDis = this.ySpeed * duration;
        let x = this.x + xDis;
        let y = this.y + yDis;
        if (x > canvas.width - this.r / 2 || x < this.r / 2) {
          this.xSpeed = -this.xSpeed;
        }
        if (y > canvas.height - this.r / 2 || y < this.r / 2) {
          this.ySpeed = -this.ySpeed;
        }
        this.x = x;
        this.y = y;
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 2 * Math.PI, 0);
      ctx.fillStyle = `rgb(200,200,200)`;
      ctx.fill();
      this.lastDrawTime = Date.now();
    }
  }

  class Graph {
    /**
     * 点的集合
     */
    points: Point[];

    /**
     * 连线最大距离
     */
    maxDis: number = 150 * devicePixelRatio;

    constructor(pointNumber = 30) {
      this.points = new Array(pointNumber).fill(0).map(() => new Point());
    }

    drawLine(p1, p2) {
      // 计算2点间距离
      const d = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
      if (d > this.maxDis) return;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      // 计算连线清晰度
      ctx.strokeStyle = `rgba(200,200,200,${1 - d / this.maxDis})`;
      ctx.stroke();
    }

    /**
     * 绘制
     */
    draw() {
      requestAnimationFrame(() => {
        this.draw();
      });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < this.points.length; i++) {
        let p1 = this.points[i];
        p1.draw();
        // 进行连线
        for (let j = i + 1; j < this.points.length; j++) {
          const p2 = this.points[j];
          this.drawLine(p1, p2);
        }
      }
    }
  }
  let graph = new Graph(100);
  graph.draw();
});
</script>
