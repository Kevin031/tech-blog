<template>
  <div class="wrapper">
    <img style="width: 400px" :src="imgSrc" />
  </div>
</template>

<script setup lang="tsx">
import axios from 'axios'
import { onMounted, ref } from 'vue'

let imgSrc = ref(null)

onMounted(() => {
  axios.get('https://root.zhuayuya.com:8325/get_calendar').then(res => {
    imgSrc.value = res.data.img
  }).catch(err => {
    console.error('获取日历图片失败', err)
  })
})
</script>

<style scoped>
.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}
</style>
