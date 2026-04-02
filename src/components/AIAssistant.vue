<template>
  <div class="ai-float-container">
    <div v-show="!isOpen" class="ai-circle" @click="isOpen = true">
      <img src="/11.jpg" alt="AI" class="ai-avatar" />
    </div>

    <transition name="expand">
      <div v-show="isOpen" class="ai-chat-box">
        <div class="chat-header">
          <div class="header-left">
            <img src="/11.jpg" alt="AI" class="header-avatar" />
            <span>PTC 小助手</span>
          </div>
          <div class="close-btn" @click="isOpen = false">✖</div>
        </div>
        
        <div class="chat-body" ref="chatBodyRef">
          <div class="message-item ai">
            <img src="/11.jpg" class="msg-avatar" />
            <div class="message-content">你好！我是 PTC 小助手，关于平台功能、学科知识或选专业，随时问我哦~</div>
          </div>

          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            :class="['message-item', msg.role]"
          >
            <img v-if="msg.role === 'ai'" src="/11.jpg" class="msg-avatar" />
            <div class="message-content" v-html="renderMarkdown(msg.content)"></div>
          </div>

          <div v-if="isLoading" class="message-item ai">
            <img src="/11.jpg" class="msg-avatar" />
            <div class="message-content typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <input 
            v-model="userInput" 
            @keyup.enter="sendMessage" 
            type="text" 
            placeholder="问点什么吧..." 
            :disabled="isLoading"
          />
          <button @click="sendMessage" :disabled="!userInput.trim() || isLoading">
            发送
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
// 🌟 引入刚刚安装的 marked 库
import { marked } from 'marked'

const isOpen = ref(false)
const chatBodyRef = ref(null)
const userInput = ref('')
const isLoading = ref(false)
const messages = ref([])

const API_URL = 'https://ptc-5g9r5l7d8b826df2.api.tcloudbasegateway.com/v1/aibot/bots/ibot-ptc-7j6vqt/send-message'
const API_TOKEN = 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL3B0Yy01ZzlyNWw3ZDhiODI2ZGYyLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJwdGMtNWc5cjVsN2Q4YjgyNmRmMiIsImV4cCI6NDA3NjMwNDQ1NywiaWF0IjoxNzcyNjIxMjU3LCJub25jZSI6IjRIbXlucDFvUnlDNkZzYTFYUXRZNUEiLCJhdF9oYXNoIjoiNEhteW5wMW9SeUM2RnNhMVhRdFk1QSIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJwdGMtNWc5cjVsN2Q4YjgyNmRmMiIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.r-Qbha9NE2NdEGff_wy77uELInEFrcfW8H42LYP5IaF1_giphUwzJrNd3hVxyVdfLU_eJnnopmJaW4rrDhkSU0qyqVQi3r-t_cgtXFBoOZVDNnDFrxJbF-pFf81I_6lOQ6yBQ54fyIqdmY0XE3akY7Pp6wMZtY93BfwJE5mwKPagciTIdBBSUpPDQliCzkk5IKOXNrN6aAvb__P-BoJYZnXGKxKDuM2Jq9ZTC_0WTqxwq2VarRMaGSdQ23yUIKo4ELOAvZjT0TBhp1ZtMtkkldM6Z4QdxgsicqmQStENA1Twfb7xfH8BNeY67mW6KJHPTuzqNNeNPEcfu7AxI2VWvQ'

// 🌟 解析 Markdown 的方法，去掉了因为换行导致的多余空白
const renderMarkdown = (text) => {
  if (!text) return ''
  return marked.parse(text)
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

const sendMessage = async () => {
  const text = userInput.value.trim()
  if (!text || isLoading.value) return

  messages.value.push({ role: 'user', content: text })
  userInput.value = ''
  isLoading.value = true
  scrollToBottom()

  const history = messages.value
    .slice(-7, -1)
    .map(m => ({ 
      role: m.role === 'ai' ? 'assistant' : 'user', 
      content: m.content 
    }))

  messages.value.push({ role: 'ai', content: '' })
  const aiMessageIndex = messages.value.length - 1

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': API_TOKEN,
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        msg: text,
        history: history
      })
    })

    if (!response.ok) throw new Error('请求失败')

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim()
          if (!dataStr || dataStr === '[DONE]') continue

          try {
            const data = JSON.parse(dataStr)
            const deltaText = data.content || data.text || data.msg || (data.choices && data.choices[0].delta.content) || ''
            
            if (deltaText) {
              messages.value[aiMessageIndex].content += deltaText
              scrollToBottom()
            }
          } catch (e) {
            // 忽略非 JSON 的心跳包
          }
        }
      }
    }
  } catch (error) {
    console.error('API 请求出错:', error)
    messages.value[aiMessageIndex].content = '网络似乎开小差了，请稍后再试呀。'
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.ai-float-container { position: fixed; bottom: 30px; right: 30px; z-index: 9999; }

.ai-circle {
  width: 60px; height: 60px; background: white; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden; border: 2px solid #3b82f6;
}
.ai-circle:hover { transform: scale(1.1); }
.ai-avatar { width: 100%; height: 100%; object-fit: cover; }

.ai-chat-box {
  width: 380px; height: 600px; background: #f8fafc; border-radius: 16px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2); overflow: hidden;
  display: flex; flex-direction: column; border: 1px solid #e2e8f0;
  transform-origin: bottom right;
}

.chat-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white; padding: 12px 16px; display: flex;
  justify-content: space-between; align-items: center; font-weight: bold;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-avatar { width: 24px; height: 24px; border-radius: 50%; }
.close-btn { cursor: pointer; font-size: 16px; opacity: 0.8; }
.close-btn:hover { opacity: 1; }

.chat-body { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.message-item { display: flex; align-items: flex-start; gap: 8px; width: 100%; }
.message-item.user { justify-content: flex-end; }
.message-item.ai { justify-content: flex-start; }

.msg-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

.message-content {
  max-width: 80%; padding: 10px 14px; border-radius: 12px;
  font-size: 14px; line-height: 1.6; word-break: break-all;
}
.user .message-content { background-color: #3b82f6; color: white; border-top-right-radius: 2px; }
.ai .message-content { background-color: white; color: #333; border: 1px solid #e2e8f0; border-top-left-radius: 2px; }

/* 🌟 核心修复点：为 Markdown 渲染出来的标签（段落、加粗、列表）写特定的样式 */
.message-content :deep(p) { margin: 0 0 8px 0; }
.message-content :deep(p:last-child) { margin-bottom: 0; }
.message-content :deep(strong) { color: #1e293b; font-weight: 700; }
.message-content :deep(ul), .message-content :deep(ol) { margin: 4px 0; padding-left: 20px; }
.message-content :deep(li) { margin-bottom: 4px; }

.chat-footer { padding: 12px; background: white; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; }
.chat-footer input {
  flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0;
  border-radius: 20px; outline: none; font-size: 14px; transition: border-color 0.2s;
}
.chat-footer input:focus { border-color: #3b82f6; }
.chat-footer button {
  background: #3b82f6; color: white; border: none; padding: 0 16px;
  border-radius: 20px; cursor: pointer; font-weight: bold; transition: opacity 0.2s;
}
.chat-footer button:disabled { opacity: 0.5; cursor: not-allowed; }

.typing-indicator span {
  display: inline-block; width: 6px; height: 6px; background-color: #94a3b8;
  border-radius: 50%; margin: 0 2px; animation: typing 1.4s infinite both;
}
.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

@media screen and (max-width: 768px) {
  .ai-chat-box { width: 90vw; height: 80vh; position: fixed; bottom: 90px; right: 5vw; }
  .ai-circle { width: 50px; height: 50px; }
}
</style>