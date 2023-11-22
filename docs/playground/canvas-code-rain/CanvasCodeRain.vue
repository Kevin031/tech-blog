<template>
  <canvas
    ref="cvsRef"
    style="width: 100vw; height: 100vh; background-color: #000"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const cvsRef = ref<any>();
let interval;

function getRandomChar() {
  const str = "0123456789abcdefghijklmnopqrstuvwsyz";
  return str[Math.floor(Math.random() * str.length)];
}

onMounted(() => {
  const canvas = cvsRef.value;
  const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  const fontSize = 20 * devicePixelRatio;
  const columnCount = Math.floor(canvas.width / fontSize);
  const charIndex = new Array(columnCount).fill(0);

  function draw() {
    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6BE445";
    ctx.font = `${fontSize}px no-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < columnCount; i++) {
      const char = getRandomChar();
      const x = i * fontSize + fontSize;
      const y = charIndex[i] * fontSize;
      ctx.fillText(char, x, y);
      if (y > canvas.height && Math.random() > 0.99) {
        charIndex[i] = 0;
      } else {
        charIndex[i]++;
      }
    }
  }
  // (window as any).draw = draw;
  draw();

  interval = setInterval(draw, 50);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>
