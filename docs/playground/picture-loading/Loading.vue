<template>
  <img src="./loading.svg" class="loading" />
</template>

<script setup></script>

<style lang="less">
@keyframes circleLoop {
  0% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading {
  animation: circleLoop 2s linear infinite;
  width: 32px;
  height: 32px;
}
</style>
