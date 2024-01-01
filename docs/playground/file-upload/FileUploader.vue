<template>
  <div class="file-uploader-wrapper">
    <input type="file" ref="inputRef" @change="onFileChange" />
    <div class="file-uploader">
      <div class="inner">
        <div class="selector" v-show="!previewUrl" @click="handleSelectFile">
          <div class="plus">+</div>
          <div class="text">上传图片</div>
        </div>
        <div class="previewer" v-if="previewUrl">
          <img :src="previewUrl" />
        </div>
        <div class="action" v-show="previewUrl && status === 'pending'">
          <div class="progress">
            <div class="progress-value">{{ progress }}%</div>
            <div class="progress-bar">
              <div class="track"></div>
              <div class="track-active" :style="`width: ${progress}%;`"></div>
            </div>
          </div>
          <div class="cancel">
            <a href="javascript:;" @click="handleCancel">取消</a>
          </div>
        </div>
      </div>
      <div class="close" @click="handleCancel" v-if="status === 'finished'">
        X
      </div>
    </div>

    <a href="javascript:;" @click="testFileBase64">获取文件base64</a>
    <br />
    <a href="javascript:;" @click="testFileChunk">获取文件切片信息</a>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { request } from './utils'

type StatusType = 'empty' | 'pending' | 'finished'

let file, currentXHR
const previewUrl = ref('')
const progress = ref(0)
const status = ref<StatusType>('empty')

let progressInterval
const inputRef = ref<HTMLInputElement>()

/**
 * 触发选择文件操作
 */
const handleSelectFile = () => {
  inputRef.value?.click()
}

/**
 * 监听文件变化
 */
const onFileChange = (evt: Event) => {
  const inputFiles = inputRef.value?.files
  if (inputFiles && inputFiles.length) {
    file = inputFiles[0]
    previewUrl.value = ''
    getFileBase64(file).then((url: string) => {
      previewUrl.value = url
    })
    handleUpload(file)
  }
}

/**
 * 获取文件的base64
 * @param {File} file
 */
const getFileBase64 = file => {
  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = evt => resolve(evt.target?.result)
    reader.readAsDataURL(file)
  })
}

const handleCancel = () => {
  file = undefined
  previewUrl.value = ''
  progress.value = 0
  status.value = 'pending'
  if (inputRef.value) {
    inputRef.value.value = ''
  }
  if (currentXHR) {
    currentXHR.abort()
  }
}

const getTencentPolicy = async () => {
  const res = await request({
    url: 'http://localhost:3000/api/v1/upload/policy'
  })
  const data = res.data
  return {
    // policy:
    //   "ewogICAgImV4cGlyYXRpb24iOiAiMjAyMy0xMS0yNFQwNjo0MjoxMy4wMDBaIiwKICAgICJjb25kaXRpb25zIjogWwogICAgICAgIHsicS1zaWduLWFsZ29yaXRobSI6ICJzaGExIn0sCiAgICAgICAgeyJxLWFrIjogIkFLSURMV1I1VGFRekhJM1hEY2xkRVhaTHEzemYzQTBhdHZnQSJ9LAogICAgICAgIHsicS1zaWduLXRpbWUiOiAiMTcwMDgwNDUzMzsxNzAwODA4MTMzIn0KICAgIF0KfQ==",
    // "q-sign-algorithm": "sha1",
    // "q-ak": "AKIDLWR5TaQzHI3XDcldEXZLq3zf3A0atvgA",
    // "q-key-time": "1700804533;1700808133",
    // "q-signature": "fdc93f06a77a6971e5bf7c57e6b4e3d251483b9f",
    policy: data.policy,
    'q-sign-algorithm': data.qSignAlgorithm,
    'q-ak': data.qAk,
    'q-key-time': data.qKeyTime,
    'q-signature': data.qSignature
  }
}

/**
 * 执行上传操作
 */
const handleUpload = async file => {
  status.value = 'pending'

  // 构造请求
  const formData = new FormData()
  const policy = await getTencentPolicy()
  formData.append('key', '/upload/${filename}')
  for (let key in policy) {
    formData.append(key, policy[key])
  }
  formData.append('file', file)
  const xhr = new XMLHttpRequest()
  xhr.upload.onprogress = evt => {
    let progressValue = Math.floor((evt.loaded / evt.total) * 100)
    progress.value = progressValue
  }
  xhr.onreadystatechange = evt => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status >= 200 && xhr.status < 400) {
        progress.value = 100
        status.value = 'finished'
      } else if (xhr.status === 0) {
        alert('用户取消上传')
      } else {
        alert('上传失败')
      }
    }
  }
  xhr.open('POST', 'http://peanut-1256322637.cos.ap-guangzhou.myqcloud.com')
  xhr.send(formData)
  currentXHR = xhr

  // 模拟上传
  // progressInterval = setInterval(() => {
  //   progress.value += 10;
  //   if (progress.value >= 100) {
  //     clearInterval(progressInterval);
  //     status.value = "finished";
  //   }
  // }, 100);
}

const testFileBase64 = async () => {
  let url = await getFileBase64(file)
  console.log('base64', url)
}

const testFileChunk = () => {
  const chunkSize = 10 * 1024
  let chunkList: Blob[] = []
  for (let i = 0; i < file.size; i += chunkSize) {
    let chunk = file.slice(i, i + chunkSize)
    chunkList.push(chunk)
  }
  console.log(chunkList)
}
</script>

<style lang="less" scoped>
.absolute-full {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.file-uploader-wrapper {
  > input {
    opacity: 0;
    position: absolute;
    width: 0;
    height: 0;
    top: 0;
    left: 0;
  }
}

.file-uploader {
  width: 200px;
  height: 200px;
  border: dashed 1px #d9d9d9;
  border-radius: 6px;
  position: relative;
  // overflow: hidden;
  padding: 8px;
  font-family: Helvetica, sans-serif;
  cursor: pointer;
  user-select: none;
  margin-right: 16px;
  margin-bottom: 16px;

  &:hover {
    border-color: #3778f7;
  }

  .inner {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .selector {
    .absolute-full;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    .plus {
      font-size: 60px;
      line-height: 1;
      padding-bottom: 12px;
      color: #666;
    }
    .text {
      font-size: 16px;
    }
  }

  .previewer {
    .absolute-full;
    z-index: 2;

    img {
      border: none;
      background-color: #fff;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .action {
    .absolute-full;
    z-index: 3;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    text-align: center;
    padding: 24px;

    .progress {
    }
    .progress-value {
      color: #fff;
      font-size: 18px;
    }
    .progress-bar {
      height: 4px;
      border-radius: 2px;
      flex: 1;
      margin: 8px 0;
      position: relative;
      overflow: hidden;

      .track {
        .absolute-full;
        background-color: #808080;
      }

      .track-active {
        position: absolute;
        height: 100%;
        width: 50%;
        top: 0;
        left: 0;
        background-color: #3778f7;
        transform: width 0.2s linear;
      }
    }
    .cancel {
      a {
        color: rgb(255, 73, 73);
        text-decoration: none;
        font-size: 12px;
      }
    }
  }

  .close {
    position: absolute;
    width: 24px;
    height: 24px;
    right: -12px;
    top: -12px;
    border-radius: 50%;
    background-color: #666;
    color: #fff;
    text-align: center;
    line-height: 24px;
    font-size: 18px;
  }
}
</style>
