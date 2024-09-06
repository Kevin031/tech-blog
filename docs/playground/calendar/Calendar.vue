<template>
  <div class="wrapper">
    <img style="width: 400px" :src="imgSrc" />
  </div>
</template>

<script setup lang="tsx">
import axios from 'axios'
import { ref } from 'vue'

let imgSrc = ref(null)

axios.get('https://root.zhuayuya.com:8325/get_calendar').then(res => {
  console.log('res', res)
  imgSrc.value = res.data.img
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
