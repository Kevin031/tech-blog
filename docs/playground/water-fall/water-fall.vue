<template>
  <div class="container">
    <div class="list">
      <div
        class="item-card"
        v-for="item in dataSource"
        :style="`grid-row-end: span ${item.height + 8}; height: ${
          item.height
        }px;`"
      >
        <img :src="item.picture" />
      </div>
    </div>
    <div class="loading" ref="loadMoreDiv">
      <img src="./loading.svg" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

type PictureCardType = {
  picture: string;
  height: number;
};

const loadMoreDiv = ref();

const dataSource = ref<Array<PictureCardType>>([]);

const pushItems = () => {
  console.log("push item");
  dataSource.value = dataSource.value.concat(
    Array(10)
      .fill({})
      .map((item, idx) => {
        return {
          // picture: `https://t.mwm.moe/mp/?hash=${idx}`,
          picture: `http://api.mtyqx.cn/api/random.php?hash=${idx}`,
          height: Math.floor(Math.random() * 300) + 200,
        };
      })
  );
};

const createLoadMoreObserver = () => {
  const ob = new IntersectionObserver(
    (entries) => {
      let entrie = entries[0];
      if (entrie.isIntersecting) {
        // 模拟接口请求
        setTimeout(() => {
          pushItems();
        }, 800);
      }
    },
    {
      root: null,
      threshold: 1,
    }
  );
  ob.observe(loadMoreDiv.value);
};

onMounted(() => {
  createLoadMoreObserver();
});
</script>

<style lang="less" scoped>
.container {
  width: 100%;
  max-width: 960px;
  padding: 30px;
  margin: 0 auto;
}
.list {
  display: grid;
  column-gap: 8px;
  justify-items: center;
  grid-auto-rows: minmax(1px, 1px);
  grid-template-columns: repeat(3, 1fr);

  .item-card {
    grid-row-start: auto;
    width: 100%;
    overflow: hidden;
    border-radius: 12px;
    img {
      background-color: #808080;
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
  }
}

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
  padding: 30px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 32px;
    height: 32px;
    animation: circleLoop 2s linear infinite;
  }
}
</style>
