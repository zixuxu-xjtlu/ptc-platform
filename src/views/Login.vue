<template>
  <div class="login-container">
    <div class="login-card">
      <div class="header">
        <div class="logo-placeholder">🎓</div>
        <h2>伴学社智能平台</h2>
        <p class="subtitle">伴汝同学 · 共有所成</p>
      </div>

      <el-tabs v-model="activeTab" class="custom-tabs" stretch>
        <el-tab-pane label="密码登录" name="password"></el-tab-pane>
        <el-tab-pane label="验证码登录" name="sms"></el-tab-pane>
      </el-tabs>

      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-position="top" class="login-form">
        
        <div v-if="activeTab === 'password'" class="fade-in">
          <el-form-item prop="account">
            <el-input 
              v-model="loginForm.account" 
              placeholder="请输入用户名 或 手机号" 
              :prefix-icon="User"
              size="large"
              class="custom-input"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码" 
              show-password
              :prefix-icon="Lock"
              size="large"
              class="custom-input"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
        </div>

        <div v-if="activeTab === 'sms'" class="fade-in">
          <el-form-item prop="phone">
            <el-input 
              v-model="loginForm.phone" 
              placeholder="请输入11位手机号" 
              :prefix-icon="Iphone"
              size="large"
              class="custom-input"
            />
          </el-form-item>

          <el-form-item prop="code">
            <div class="code-row">
              <el-input 
                v-model="loginForm.code" 
                placeholder="短信验证码" 
                :prefix-icon="Message"
                size="large"
                class="custom-input"
                @keyup.enter="handleLogin"
              />
              <el-button 
                type="primary" 
                plain 
                :disabled="isCounting" 
                @click="handleSendCode"
                class="send-btn"
                size="large"
              >
                {{ isCounting ? `${count}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
        </div>

        <el-button type="primary" class="submit-btn" @click="handleLogin" :loading="loading" size="large">
          {{ activeTab === 'password' ? '登 录' : '验证并登录' }}
        </el-button>

        <div class="footer-links">
          <span class="text-btn" @click="router.push('/reset-password')">忘记密码？</span>
          <span class="register-link" @click="goToRegister">还没有账号？立即注册 &rarr;</span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
// 🌟 核心修复1：引入 onMounted
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Iphone, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { auth, db } from '../cloudbase'

const router = useRouter()
const activeTab = ref('password')
const loading = ref(false)
const loginFormRef = ref(null)

const isCounting = ref(false)
const count = ref(60)
const verificationInfo = ref(null)

const loginForm = reactive({
  account: '',
  password: '',
  phone: '',
  code: ''
})

const getDateKey = (timestamp = Date.now()) => {
  const d = new Date(timestamp)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const recordLoginLog = (userInfo) => {
  const now = Date.now()
  db.collection('login_logs').add({
    userId: userInfo._id,
    username: userInfo.username || '',
    realName: userInfo.realName || '',
    role: userInfo.role || 'user',
    loginType: activeTab.value,
    createTime: now,
    dateKey: getDateKey(now)
  }).catch(() => {})
}

// 🌟 核心修复2：只要进入登录页，就强制忘掉动画记忆
onMounted(() => {
  sessionStorage.removeItem('sloganPlayed')
})

const rules = computed(() => {
  if (activeTab.value === 'password') {
    return {
      account: [{ required: true, message: '请输入用户名或手机号', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }
  } else {
    return {
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
      ],
      code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
    }
  }
})

const handleSendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(loginForm.phone)) {
    return ElMessage.error('请先输入正确的手机号码')
  }
  try {
    const res = await auth.getVerification({ phone_number: `+86 ${loginForm.phone}` })
    verificationInfo.value = res
    isCounting.value = true
    ElMessage.success('验证码已发送')
    const timer = setInterval(() => {
      count.value--
      if (count.value <= 0) {
        clearInterval(timer)
        isCounting.value = false; count.value = 60
      }
    }, 1000)
  } catch (error) {
    ElMessage.error('发送失败：' + error.message)
  }
}

const handleLogin = () => {
  if (!loginFormRef.value) return
  
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const loginState = await auth.getLoginState();
        if (!loginState) await auth.signInAnonymously();

        let existUsers = [];

        if (activeTab.value === 'password') {
          const _ = db.command
          const inputAccount = loginForm.account.trim()
          const inputPassword = loginForm.password.trim()

          const res = await db.collection('users').where(
            _.or([
              { username: inputAccount, password: inputPassword },
              { phone: inputAccount, password: inputPassword }
            ])
          ).get()
          existUsers = res.data || res || [];
        } else {
          if (!verificationInfo.value) {
             loading.value = false
             return ElMessage.error('请先获取验证码')
          }
          await auth.signInWithSms({
            verificationInfo: verificationInfo.value,
            verificationCode: loginForm.code,
            phoneNum: `+86 ${loginForm.phone}`
          })
          const res = await db.collection('users').where({ phone: loginForm.phone }).get()
          existUsers = res.data || res || [];
        }

        if (existUsers.length > 0) {
          const userInfo = existUsers[0]

          // 🚨 核心逻辑：拦截未审核的社团成员
          if (userInfo.status === 'pending') {
            loading.value = false
            return ElMessage.warning('您的身份正在审核中，请等待管理员通过。')
          }

          // 允许登录
          localStorage.setItem('user', JSON.stringify(userInfo))
          recordLoginLog(userInfo)
          // 🌟 核心修复3：登录成功跳转前，再次确保动画记忆被清除
          sessionStorage.removeItem('sloganPlayed')
          
          ElMessage.success(`欢迎回来，${userInfo.realName || userInfo.username}`)

          // 👑 自动千人千面路由跳转
          if (userInfo.role === 'admin') {
            router.push('/admin/dashboard')
          } else if (userInfo.role === 'member') {
            router.push('/member/dashboard') 
          } else {
            router.push('/user/dashboard')
          }
        } else {
          ElMessage.error(activeTab.value === 'password' ? '账号或密码错误' : '该手机号未注册')
        }
      } catch (error) {
        console.error("【登录报错】:", error)
        ElMessage.error('登录异常：' + (error.message || '网络错误'))
      } finally {
        loading.value = false
      }
    }
  })
}

const goToRegister = () => router.push('/register')
</script>

<style scoped>
/* 高级微渐变背景 */
.login-container { 
  height: 100vh; 
  width: 100%; 
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  display: flex; justify-content: center; align-items: center; 
}

/* 🌟 响应式毛玻璃卡片 */
.login-card { 
  width: 90%;             /* 手机端占90%宽度 */
  max-width: 420px;       /* PC端最大420px */
  padding: 45px 40px; 
  background: rgba(255, 255, 255, 0.9); 
  backdrop-filter: blur(10px);
  border-radius: 16px; 
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08); 
  border: 1px solid rgba(255, 255, 255, 0.6);
  margin: 0 auto;
}

.header { text-align: center; margin-bottom: 30px; }
.logo-placeholder { font-size: 40px; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(64,158,255,0.3); }
.header h2 { color: #303133; margin: 0 0 8px 0; font-size: 26px; font-weight: 600; letter-spacing: 1px;}
.subtitle { color: #909399; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }

.custom-tabs { margin-bottom: 25px; }
:deep(.el-tabs__nav-wrap::after) { height: 1px; background-color: #ebeef5; }
:deep(.el-tabs__item) { font-size: 15px; color: #909399; }
:deep(.el-tabs__item.is-active) { font-weight: bold; color: #409EFF; }

.login-form { margin-top: 10px; }
.fade-in { animation: fadeIn 0.4s ease-in-out; }

/* 优化输入框质感 */
:deep(.custom-input .el-input__wrapper) { 
  border-radius: 8px; 
  box-shadow: 0 0 0 1px #dcdfe6 inset; 
  padding: 4px 11px;
  background-color: #fafafa;
  transition: all 0.3s;
}
:deep(.custom-input .el-input__wrapper.is-focus) { 
  box-shadow: 0 0 0 1px #409EFF inset; 
  background-color: #ffffff;
}

.code-row { display: flex; gap: 12px; }
.send-btn { width: 130px; border-radius: 8px; flex-shrink: 0; }
.submit-btn { 
  width: 100%; height: 46px; font-size: 16px; margin-top: 15px; 
  border-radius: 8px; font-weight: bold; letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(64,158,255,0.3);
  transition: all 0.3s;
}
.submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(64,158,255,0.4); }

.footer-links { margin-top: 25px; display: flex; justify-content: space-between; font-size: 13px; }
.text-btn { color: #909399; cursor: pointer; transition: color 0.3s; }
.text-btn:hover { color: #409EFF; }
.register-link { color: #409EFF; cursor: pointer; font-weight: 600; transition: opacity 0.3s; }
.register-link:hover { opacity: 0.8; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 📱 手机端微调 */
@media screen and (max-width: 480px) {
  .login-card { padding: 30px 20px; }
  .header h2 { font-size: 22px; }
  .logo-placeholder { font-size: 32px; }
}
</style>
