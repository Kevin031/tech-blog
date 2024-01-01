<template>
  <div class="container">
    <button class="button" @click="refresh">刷新</button>
    <div class="list">
      <div v-loading style="width: 200px" v-for="item in list">
        <img
          :src="`https://picsum.photos/200/300?${item}`"
          style="width: 200px; height: 300px"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  max-width: 1560px;
  padding: 30px;
  margin: 0 auto;
}
.button {
  margin-bottom: 10px;
  border: solid 1px #ddd;
  padding: 8px 12px;
  border-radius: 4px;
}
.list {
  display: flex;
  flex-wrap: wrap;
}
</style>

<script>
import { render, h, ref, nextTick } from 'vue'
import Loading from './Loading.vue'

export default {
  setup() {
    const list = ref(
      Array(100)
        .fill('')
        .map((_, idx) => idx)
    )

    const refresh = () => {
      let current = list.value[list.value.length - 1]
      list.value = []
      nextTick(() => {
        list.value = Array(100)
          .fill('')
          .map((_, idx) => idx + current)
        console.log('list', list)
      })
    }

    return {
      list,
      refresh
    }
  },
  directives: {
    loading: {
      mounted: el => {
        let img = el.querySelector('img')
        el.style.position = 'relative'
        const VNode = h(Loading)
        const div = document.createElement('div')
        div.setAttribute(
          'style',
          'position: absolute; width: 100%; height: 100%; top: 0; left: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.3);'
        )
        render(VNode, div)
        el.append(div)
        img.onload = () => {
          el.removeChild(div)
        }
        img.onerror = () => {
          el.removeChild(div)
        }
      }
    }
  }
}
</script>
