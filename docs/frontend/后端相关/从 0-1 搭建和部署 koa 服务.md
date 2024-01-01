# 从 0-1 搭建和部署 koa 服务

## 技术架构的特点

1. 使用`typescript`作为开发语言

2. 动态导入 api 目录下的文件，注册路由

3. 使用装饰器为方法注册路由

4. 项目经过 `tsc` 的打包，通过`docker`镜像部署，线上使用 `pm2` 启动服务

## 项目目录

```
dist                // 生产包目录
src                 // 源码目录
|- api              // 存放路由文件的目录
  |- v1
    |- user.ts
    |- hello.ts
|- config           // 存放配置文件的目录
|- publish          // 存放公共文件的目录
|- utils            // 存放工具方法的目录有
|- app.ts           // 启动文件
|- index.ts         // 入口文件
|- init.ts          // 存放初始化方法的文件
package.json        // 包管理配置
tsconfig.json       // ts配置
```

## TypeScript 环境搭建

### 首先需要经过`tsc init`的初始化，定义 ts 编译的相关配置

生成的 tsconfig.json 如下

```json
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "allowJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@/*": ["./src/*"],
      "@app": ["./src/app"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

文件中还指定了源码目录和别名

可以通过引入 `module-alias` 来让项目获得别名支持

::: code-group

```ts [src/index.js]
import 'module-alias/register'
import '@/app'
```

```ts [src/app.js]
import Koa from 'koa'
import InitManager from './init'
import { PORT } from './config/constants'
import cors from 'koa-cors'

const app = new Koa()
let routerMap: any = []

// 解除跨域限制
app.use(cors())
// 初始化
InitManager.initCore(app).then(list => {
  console.log('router Map', list)
  routerMap = list
})

app.use((ctx, next) => {
  // 请求根目录直接返回可用的接口列表
  if (ctx.request.path === '/') {
    ctx.body = {
      ok: 1,
      data: routerMap
    }
    return
  }
  next()
})

app.listen(PORT)

console.log('server is running at: ' + `http://localhost:${PORT}`)

export default app
```

:::

与此同时，package.json 中也需要指定目录别名，这是为了在开发过程中获得路径的提示。

```json
"_moduleAliases": {
  "@": "./src",
  "@app": "./src/app"
}
```

### 项目开发模式下的启动方式

通过`ts-node-dev`替代`tsc`来启动项目，这是为了监听文件的变化并重启服务，作用和`nodemon`类似

```shell
npm i ts-node-dev
```

`package.json` 配置脚本命令

```json
{
  "scripts": {
    "dev": "tsnd --respawn src/index.ts"
  }
}
```

### 项目打包

```json
{
  "scripts": {
    "build": "run-s clearBuild compile copyPublic",
    "compile": "tsc && tsc-alias",
    "clearBuild": "rimraf dist/*",
    "copyPublic": "copyfiles -u 1 src/public/* dist"
  }
}
```

打包过程有 3 步，分别是清空 dist 目录、ts 编译、public 文件拷贝，这里涉及了几个 npm 依赖：

1. `npm-run-all`：批量启动 npm 脚本，通过`run-s`启动

2. `tsc-alias`：用于把 ts 文件中的别名替换为 tsconfig 配置中的别名

3. `copyfiles`： 用于文件目录的深拷贝

## 使用装饰器注册路由

路由使用了 `koa-router`，这是因为如果直接使用 koa 来开发的话，需要在 use 回调中写一大堆 if else 来处理不同路由

```ts
import Koa from 'koa'

const app = new Koa()

app.use(ctx => {
  if (ctx.request.path === '/api-1') {
    // ...
  } else if (ctx.request.path === '/api-2') {
    // ...
  } else if (ctx.request.path === '/api-3') {
    // ...
  } else if (ctx.request.path === '/api-4') {
    // ...
  }
})

app.listen(3000)
```

而通过`koa-router`，不但可以将定义路由的代码块分开，还可以分别放置到不同的文件下，便于实现关注点分离，减少心智负担

```ts
import Koa from 'koa'
import Router from 'koa-router'

const app = new Koa()

// 后续可以拆分到不同的文件中，再通过app.use挂载
const router = new Router()
router.get('/api-1', ctx => {
  // ...
})
router.get('/api-2', ctx => {
  // ...
})
router.get('/api-3', ctx => {
  // ...
})
router.get('/api-4', ctx => {
  // ...
})
app.use(router.routes())

app.listen(3000)
```

而在本项目中，对 router.get 进一步抽象，实现类似以下写法的封装方式

```ts
// src/api/v1/user
import { get, post } from '@/utils/route-controller'
import Koa from 'koa'

const users = [{ name: 'tom', age: 20 }]

class User {
  @get('/list')
  public getList(ctx: Koa.Context) {
    ctx.body = {
      ok: 1,
      data: users
    }
  }

  @post('/list')
  public postList(ctx: Koa.Context) {
    ctx.body = {
      ok: 1,
      data: users
    }
  }
}

export default User
```

与此同时，项目需要遍历 api 目录获取到所有文件，批量注册路由，并根据文件目录的路径补全路由的前缀路径

上面的文件最终生成以下 2 个路由

```
[get]/api/v1/user/list
[post]/api/v1/user/list
```

装饰器的实现方式如下：

```ts
// src/utils/route-controller.ts
type RouteOptions = {
  prefix: string
}

type MethodType = 'get' | 'post' | 'put' | 'delete'

const method =
  (type: MethodType) =>
  (path: string, options?: RouteOptions) =>
  (target: any, property: string) => {
    let url = options && options.prefix ? options.prefix + path : path
    target[property].router = {
      url,
      type
    }
  }

const get = method('get')
const post = method('post')
const put = method('put')
const _delete = method('delete')

export { get, post, put, _delete, MethodType }
```

它的关键在于给方法本身挂载路由的请求路径和请求方式，方便提供给下一步路由的批量注册进行遍历。

## 路由的批量注册

```ts
// src/init.ts

import Router from 'koa-router'
import Koa from 'koa'
import path from 'path'
import * as glob from 'glob'
import { MethodType } from '@/utils/route-controller'

const router = new Router()

class InitManager {
  static app: Koa

  static initCore(app: Koa) {
    InitManager.app = app
    return InitManager.initLoadRouters()
  }

  static initLoadRouters() {
    return new Promise((resolve, reject) => {
      let routerMap: Array<{
        type: string
        url: string
      }> = []
      Promise.all([
        ...glob.sync(path.resolve(__dirname, `./api/**/*.{js,ts}`)).map(item =>
          import(item).then(obj => {
            if (obj.default instanceof Router) {
              // 路由对象，直接执行注册
              InitManager.app.use(obj.default.routes())
            } else {
              // 自定义对象，遍历属性方法获取到对应的路由信息，补全文件基础路径，再执行注册
              let Prototype = obj.default.prototype
              Object.getOwnPropertyNames(Prototype).forEach(key => {
                if (key === 'constructor') return
                let method = Prototype[key]
                let pathMatch = item.match(/(\/api\/.+?)\.(js|ts)/)
                let basePath = pathMatch ? pathMatch[1] : ''
                if (method.router) {
                  const { url, type } = method.router
                  let fullPath = basePath + url
                  router[type as MethodType](fullPath, method)
                  routerMap.push({
                    url: fullPath,
                    type
                  })
                  console.log(`注册路由:[${type}]${fullPath}`)
                }
              })
            }
            return Promise.resolve()
          })
        )
      ]).then(() => {
        InitManager.app.use(router.routes())
        resolve(routerMap)
      })
    })
  }
}

export default InitManager
```

其核心原理是通过`glob.sync`深度遍历 api 目录获取到文件路径，再执行 `import` 得到模块导出的对象。

注意`import`是异步的，因此如果需要汇总路由信息，需要放到 Promise 中等待所有文件导入完毕再 `resolve`。

## 应用部署

CICD 的整体流程为：

`master分支推送代码` -> `触发github actions` -> `构建docker镜像并推送到docker hub` -> `ssh到服务器下拉取最新docker镜像` -> `重启服务`

### Docker

Dockerfile 代码如下

```Dockerfile
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json /app
RUN npm install -g pm2
RUN npm install
COPY . /app
RUN npm run build

EXPOSE 3000
CMD ["pm2-runtime", "start", "./dist/index.js"]
```

### github actions 脚本如下

```yml
name: Publish Docker image

on:
  push:
    branches:
      - master
jobs:
  push_to_registry:
    name: Push Docker image to Docker Hub
    runs-on: ubuntu-latest
    steps:
      # checkout
      - name: Check out the repo
        uses: actions/checkout@v2

      # build
      - name: Build the Docker image
        run: docker build . --file Dockerfile --tag kevin031/node-server:latest

      # login
      - name: Log in to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      # push to docker hub
      - name: Push to Docker Hub
        uses: docker/build-push-action@v2
        with:
          push: true
          tags: kevin031/node-server:latest

      - name: Execute SSH commmands on remote server
        uses: JimCronqvist/action-ssh@master
        with:
          hosts: ${{ secrets.HOST }}
          privateKey: ${{ secrets.SSH_PRIVATE_KEY }}
          debug: true
          command: |
            docker ps -a
            docker rm -f node-server-container
            docker pull kevin031/node-server
            docker run --name node-server-container -p 20238:3000 -v /opt/config/node-server:/app/config -d kevin031/node-server
```

## 后续待补充流程

1. eslint

2. 单元测试

3. 数据库
