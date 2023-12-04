<template>
  <button v-if="!socketLink" @click="openConnectWS">点我建立连接</button>
  <button v-else @click="closeConnectWS">点我断开连接</button>

  <div v-if="socketLink">
    <ul class="list">
      <li :class="['message', item.type]" v-for="item in messages">
        <div :class="['item', item.type]">{{ item.content }}</div>
      </li>
    </ul>
    <div class="input-area">
      <input
        v-model="inputVal"
        placeholder="输入任意内容"
        @keyup.enter="sendWSMessage"
      />
      <button @click="sendWSMessage">点我发送消息</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const messages = ref([])
const inputVal = ref('')
let socket = null
let socketLink = ref(false)
const openConnectWS = () => {
  socket = new WebSocket('ws://localhost:3000')

  socket.addEventListener('open', event => {
    console.log('WebSocket connection opened:', event)
    socketLink.value = true

    // 发送消息到服务器
    // socket.send('Hello, server!');
  })

  socket.addEventListener('message', event => {
    console.log('Received message:', event.data)
    messages.value.push({
      type: 'receive',
      content: event.data
    })
  })

  socket.addEventListener('close', event => {
    console.log('WebSocket connection closed:', event)
    socket = null
    socketLink.value = false
  })
}
const sendWSMessage = () => {
  if (!socket || !inputVal.value) return

  messages.value.push({
    type: 'send',
    content: inputVal.value
  })
  socket.send(inputVal.value)
  inputVal.value = ''
}
const closeConnectWS = () => {
  socket.close()
}
</script>

<style lang="less" scoped>
.list {
  list-style: none;
}
.message {
  list-style: none;
  display: flex;
  &.send {
    justify-content: flex-end;
  }

  .item {
    background-color: #fff;
    color: #333;
    padding: 12px 24px;
    border-radius: 999px;
  }
}
.input-area {
  display: flex;
  input {
    flex: 1;
    height: 32px;
    line-height: 32px;
  }
}
</style>
