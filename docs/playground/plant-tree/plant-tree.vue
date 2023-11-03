<template>
  <div ref="container" class="container">
    <button class="reset" @click="reset">重新种一棵</button>
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, withCtx } from "vue";

const COLOR_MAP = {
  bg: "#ECE3CE",
  land: "#3A4D39",
  branch: "#333",
  leaf: "#739072",
  flower: "#CE5A67",
};

const canvasRef = ref();
const container = ref();

function initCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const outerWidth = container.value.offsetWidth;
  canvas.width = outerWidth;
  canvas.height = Math.max(outerWidth, 500);
  // 设置背景色
  ctx.fillStyle = COLOR_MAP.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // 画地面
  ctx.fillStyle = COLOR_MAP.land;
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
  // 建立坐标系
  // 起点设置在底部中间
  ctx.translate(canvas.width / 2, canvas.height);
  // 翻转Y轴
  ctx.scale(1, -1);
  // 开始绘制
  drawBranch(ctx, [0, 40], 8, 120, 90);
}

function reset() {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  ctx.scale(1, -1);
  ctx.translate(-canvas.width / 2, -canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  initCanvas(ctx, canvas);
}

/**
 *
 * @param ctx 绘制上下文
 * @param start 初始坐标
 */
function drawLeaf(ctx: CanvasRenderingContext2D, start: [number, number]) {
  ctx.beginPath();
  ctx.arc(...start, 2 + 5 * Math.random(), 0, 2 * Math.PI);
  ctx.fillStyle = Math.random() > 0.5 ? COLOR_MAP.leaf : COLOR_MAP.flower;
  ctx.fill();
  return;
}

/**
 *
 * @param ctx 绘制上下文
 * @param start 初始坐标
 * @param thick 粗细度
 * @param length 长度
 * @param dir 和x轴之间的夹角
 */
function drawBranch(
  ctx: CanvasRenderingContext2D,
  start: [number, number],
  thick: number,
  length: number,
  dir
) {
  if (thick < 1) {
    return drawLeaf(ctx, start);
  }
  ctx.beginPath();
  ctx.moveTo(...start);
  let end: [number, number] = [
    start[0] + length * Math.cos((dir * Math.PI) / 180),
    start[1] + length * Math.sin((dir * Math.PI) / 180),
  ];
  ctx.lineTo(...end);
  ctx.strokeStyle = COLOR_MAP.branch;
  ctx.lineCap = "round";
  ctx.lineWidth = thick;
  ctx.stroke();

  // 递归绘制剩余分支
  Math.random() > 0.1 &&
    drawBranch(
      ctx,
      end,
      thick * 0.8,
      length * 0.7 + Math.random() * 8,
      dir + Math.random() * 40
    );
  Math.random() > 0.1 &&
    drawBranch(
      ctx,
      end,
      thick * 0.8,
      length * 0.7 + Math.random() * 8,
      dir - Math.random() * 40
    );
  Math.random() > 0.8 &&
    drawBranch(
      ctx,
      end,
      thick * 0.8,
      length * 0.7 + Math.random() * 8,
      dir + Math.random() * 10
    );
}

onMounted(() => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  // 画布初始化
  initCanvas(ctx, canvas);
});
</script>

<style lang="less" scoped>
.container {
  // margin-top: 32px;
  position: relative;

  .reset {
    position: absolute;
    top: 32px;
    right: 32px;
    background-color: #fff;
    padding: 6px 12px;
    border-radius: 8px;
    box-shadow: 3px 3px #aaa;
    transition: all 0.2s linear;
    &:hover {
      box-shadow: 4px 5px #b4b4b4;
      transform: translate(-1px, -2px);
    }
  }
}
</style>
