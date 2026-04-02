## 概述
本模板是一款 **开箱即用的 Vue.js 3 前端开发环境**，集成 Vite 构建工具与 Vue 全生态依赖，无需手动配置环境即可快速启动组件化开发。核心优势在于：
- **组件化开发**：基于 Vue 3 组件化思想，支持页面拆分与复用，降低代码耦合度；
- **高效构建工具**：采用 Vite 4.3.9 作为构建工具，实现开发服务器秒级启动、热模块替换（HMR），修改代码后浏览器实时刷新且保留页面状态；
- **组合式 API 支持**：默认适配 Vue 3 组合式 API（`<script setup>` 语法），逻辑组织更灵活，适合中小型项目与复杂业务场景；
- **云端适配**：针对 Cloud Studio 优化端口配置（默认 5173），启动后可直接通过浏览器预览，无需本地部署。

适合场景：前端开发者快速搭建 Vue 3 项目（如官网、管理系统、移动端应用）、学习 Vue 3 组件化与组合式 API 特性。


## 环境配置
模板已预集成所有 Vue 开发必需环境，无需手动安装依赖，关键配置如下：

| 环境/工具          | 版本/规格                | 说明                                                                 |
|---------------------|--------------------------|----------------------------------------------------------------------|
| Node.js             | 预装（推荐 v16+）         | 支持 ES6+ 语法与 npm/yarn 包管理，确保与 Vue 3、Vite 兼容性            |
| Vue.js              | 3.3.4                    | 核心前端框架，支持组合式 API、`<script setup>` 语法、响应式数据绑定     |
| 构建工具            | Vite 4.3.9               | 负责开发服务器启动、热刷新、生产打包，比传统 Webpack 启动速度快 5-10 倍 |
| 包管理工具          | npm + Yarn               | 两种工具可选，支持安装 Vue 生态插件（如 Vue Router、Pinia）            |
| Python              | 3.12（预装）             | 辅助工具，主要用于 Cloud Studio 环境适配，与 Vue 开发无直接关联        |
| 默认开发端口        | 5173                     | Vite 开发服务器默认端口，与 Cloud Studio 端口管理无缝适配              |
| 浏览器兼容性        | 适配 Chrome 87+/Firefox 84+/Safari 14.1+ | 支持 Vue 3 及 Vite 编译后的现代前端特性                              |


## 项目结构
模板采用 Vue 3 推荐的标准化目录设计，文件职责清晰，便于扩展与团队协作：
```
项目根目录
├── src/                  # 源代码主目录（核心开发目录）
│   ├── assets/          # 静态资源目录（样式、图片、字体等）
│   │   ├── base.css     # 基础样式文件（重置样式、全局通用样式）
│   │   └── main.css     # 主样式文件（项目全局样式，可引入第三方样式库）
│   ├── components/      # Vue 组件目录（可复用的 UI 组件）
│   │   ├── HelloWorld.vue  # 示例组件（默认首页展示组件）
│   │   └── icons/       # 图标组件目录（存放 SVG 图标或图标库组件）
│   ├── App.vue          # 应用根组件（所有页面的父组件，包含路由出口）
│   └── main.js          # 应用入口文件（初始化 Vue 实例、挂载根组件、引入全局依赖）
├── public/              # 公共静态资源目录（不经过 Vite 编译，直接复制到生产目录）
│   └── favicon.ico      # 网站图标（可替换为自定义图标）
├── index.html           # HTML 入口文件（Vite 以该文件为入口，自动注入 Vue 应用）
├── vite.config.js       # Vite 核心配置文件（可修改端口、配置代理、集成插件）
└── package.json         # 项目依赖与脚本配置（启动/构建命令、依赖列表）
```
- **关键文件说明**：
  - `src/App.vue`：项目核心组件，通常包含导航栏、页脚及 `<router-view>`（路由出口，用于渲染不同页面）；
  - `src/main.js`：入口文件，负责创建 Vue 实例并挂载到 HTML 的 `#app` 元素上，示例代码：
    ```javascript
    import { createApp } from 'vue'
    import App from './App.vue'
    import './assets/main.css'

    createApp(App).mount('#app')
    ```
  - `vite.config.js`：Vite 配置文件，可自定义开发端口、跨域代理等（如修改端口为 3000、配置 API 代理）。


## Vue.js 模板使用说明
### 1. 启动开发服务器

- 快速启动：你可以通过点击 JupyterLab 顶部的 **运行按钮** 快速启动。

    <img src="img/image1.png" width=800px>

- 手动启动： 打开 Cloud Studio 终端，确保当前目录为项目根目录；执行以下命令启动 Vite 开发服务器（支持热重载）：
   ```bash
   npm run dev
   ```

**启动成功终端输出示例：**
```
VITE v4.3.9 ready in 500 ms
➜  Local:   http://localhost:5173/
➜  Network: https://xxx--5173.ap-shanghai.cloudstudio.club/  # Cloud Studio 访问链接
```

### 2. 访问与预览项目
1. 点击 Cloud Studio 右侧的 **【端口管理】** 按钮；
2. 找到端口 `5173`（开发服务器默认端口），点击对应的 **【查看预览】**；

<img src="img/image.png" width=600px>

### 3. 核心开发流程
#### 步骤 1：编辑根组件（App.vue）
[`App.vue`](src/App.vue) 是项目根组件，可修改其模板、样式与逻辑。

#### 步骤 2：创建自定义组件
在 `src/components/` 目录下新建组件（如 `MyButton.vue`），示例：
```vue
<template>
  <button class="my-btn" @click="handleClick">
    {{ btnText }}
  </button>
</template>

<script setup>
// 接收父组件传递的 props（参数）
const props = defineProps({
  btnText: {
    type: String,
    required: true,
    default: '按钮'
  }
})

// 定义向父组件传递的事件
const emit = defineEmits(['click'])

// 按钮点击逻辑
const handleClick = () => {
  emit('click', '按钮被点击了') // 向父组件发送事件与参数
}
</script>

<style scoped>
.my-btn {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```
在 `App.vue` 中导入并使用该组件：
```vue
<template>
  <div class="app-container">
    <MyButton btnText="点击我" @click="handleBtnClick" />
  </div>
</template>

<script setup>
import MyButton from './components/MyButton.vue'

const handleBtnClick = (msg) => {
  alert(msg) // 弹出子组件传递的消息
}
</script>
```

#### 步骤 3：生产构建与预览
开发完成后，执行以下命令生成优化后的生产包（用于部署到服务器）：
```bash
# 生成生产构建包（输出到 dist/ 目录）
npm run build

# 预览生产构建包（验证部署效果）
npm run preview
```
- `dist/` 目录包含：压缩后的 JS/CSS、哈希命名的静态资源（避免浏览器缓存）、优化后的 HTML，可直接上传至 Nginx、Apache 等服务器部署。



## 学习资源
### 1. 官方资源（权威推荐）
- [Vue 3 官方文档](https://v3.vuejs.org/)：学习 Vue 3 核心概念、组合式 API、模板语法等；
- [Vite 官方文档](https://vitejs.dev/)：了解 Vite 配置、插件、生产优化等进阶用法；
- [Vue Router 官方文档](https://router.vuejs.org/)：Vue 路由管理库，用于实现页面跳转（如首页、详情页切换）；
- [Pinia 官方文档](https://pinia.vuejs.org/)：Vue 3 状态管理库，用于管理跨组件共享数据（如用户信息、全局设置）。

### 2. 推荐学习路径
1. 掌握 Vue 3 基础：模板语法、响应式数据（ref/reactive）、组合式 API；
2. 学习组件化开发：组件通信（props/emit、Provide/Inject）、插槽（Slot）、动态组件；
3. 集成生态工具：Vue Router（路由）、Pinia（状态管理）、Axios（API 请求）；
4. 进阶技能：性能优化、自定义指令、插件开发、TypeScript 集成。


## 常见问题解答
### 1. 环境与依赖相关问题
#### Q1：如何安装 Vue 生态插件（如 Vue Router、Pinia）？
A1：使用 npm 或 yarn 命令安装，示例：
```bash
# 安装 Vue Router（路由管理）
npm install vue-router@4  # Vue 3 需使用 Vue Router 4 版本

# 安装 Pinia（状态管理）
npm install pinia

# 安装 Axios（API 请求）
npm install axios
```

#### Q2：启动 `npm run dev` 提示“端口 5173 被占用”？
A2：修改 `vite.config.js` 中的端口配置，示例：
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000  // 改为未被占用的端口（如 3000、8080）
  }
})
```

### 2. 开发与功能相关问题
#### Q1：如何处理跨域请求（前端请求后端 API 报错 CORS）？
A1：在 `vite.config.js` 中配置代理，将前端请求转发到后端服务器，示例：
```javascript
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 匹配以 /api 开头的请求
      '/api': {
        target: 'http://localhost:8080',  // 后端 API 服务器地址
        changeOrigin: true,  // 允许跨域
        rewrite: (path) => path.replace(/^\/api/, '')  // 移除请求路径中的 /api 前缀（可选）
      }
    }
  }
})
```
前端请求时使用 `/api` 前缀：
```javascript
// src/utils/api.js
import axios from 'axios'

// 请求后端 /user 接口（实际转发到 http://localhost:8080/user）
axios.get('/api/user').then(res => {
  console.log(res.data)
})
```

#### Q2：如何实现组件间通信（如父组件向子组件传值，子组件向父组件传值）？
A2：
- **父 → 子**：通过 `props` 传值（如前文 `MyButton.vue` 示例，父组件通过 `btnText` 向子组件传值）；
- **子 → 父**：通过 `emit` 发送事件（子组件用 `emit('事件名', 参数)`，父组件用 `@事件名` 监听）；
- **跨层级组件**：使用 `Provide/Inject`（祖先组件 `provide('key', 值)`，后代组件 `inject('key')` 获取）或 Pinia 状态管理。


## 帮助和支持
### 1. Cloud Studio 相关支持
- [Cloud Studio 官方帮助文档](https://cloudstudio.net/docs/)
- [本模板已内置 腾讯云智能编码工具CodeBuddy Code, 点击查看使用文档](https://cloudstudio.net/docs/guide/code_editing/productivity_plugin/codebuddycode/)
### 2. 用户反馈群
扫码加入 Cloud Studio 用户反馈群，获取实时 Vue 开发技术支持：
- 腾讯云工程师群内答疑，解决 Vue 3 组件通信、Vite 配置、跨域等问题；
- 优先体验产品上新功能，获取 Vue 项目实战案例（如管理系统、移动端应用）；
- 与其他开发者交流 Vue 3 进阶技巧（如性能优化、TypeScript 集成）。

<img title="" src="img/qr-code.png" alt="Cloud Studio 用户反馈群" width="270">