<template>
  <div class="reset-container">
    <div class="reset-card">
      <div class="header">
        <h2>重置密码</h2>
        <p class="subtitle">安全验证后即可设置新密码</p>
      </div>

      <el-steps :active="activeStep" finish-status="success" align-center class="steps-bar">
        <el-step title="验证身份" />
        <el-step title="重置密码" />
      </el-steps>

      <el-form 
        :model="resetForm" 
        :rules="rules" 
        ref="resetFormRef" 
        label-position="top"
        class="reset-form"
      >
        
        <div v-if="activeStep === 0">
          <el-form-item label="手机号码" prop="phone">
            <el-input 
              v-model="resetForm.phone" 
              placeholder="请输入注册时的手机号" 
              prefix-icon="Iphone"
            />
          </el-form-item>

          <el-form-item label="短信验证码" prop="code">
            <div class="code-row">
              <el-input 
                v-model="resetForm.code" 
                placeholder="6位验证码" 
                prefix-icon="Message"
              />
              <el-button 
                type="primary" 
                plain 
                :disabled="isCounting" 
                @click="handleSendCode"
                class="send-btn"
              >
                {{ isCounting ? `${count}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-button type="primary" class="action-btn" @click="handleNextStep">下一步</el-button>
        </div>

        <div v-if="activeStep === 1">
          <el-form-item label="新密码" prop="password">
            <el-input 
              v-model="resetForm.password" 
              type="password" 
              placeholder="请输入新密码" 
              show-password
              prefix-icon="Lock"
            />
          </el-form-item>

          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input 
              v-model="resetForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入新密码" 
              show-password
              prefix-icon="Lock"
            />
          </el-form-item>

          <el-button type="primary" class="action-btn" @click="handleSubmit" :loading="loading">
            确认修改
          </el-button>
        </div>

        <div class="footer-link">
          <span @click="router.push('/login')">想起密码了？返回登录</span>
        </div>

      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Iphone, Message, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeStep = ref(0)
const resetFormRef = ref(null)
const loading = ref(false)

// 倒计时
const isCounting = ref(false)
const count = ref(60)

const resetForm = reactive({
  phone: '',
  code: '',
  password: '',
  confirmPassword: ''
})

// 校验规则
const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== resetForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 16, message: '长度在 6 到 16 个字符', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validatePass2, trigger: 'blur' }]
}

// 发送验证码
const handleSendCode = () => {
  if (!/^1[3-9]\d{9}$/.test(resetForm.phone)) {
    ElMessage.error('请先输入正确的手机号码')
    return
  }
  isCounting.value = true
  ElMessage.success('验证码已发送')
  const timer = setInterval(() => {
    count.value--
    if (count.value <= 0) {
      clearInterval(timer)
      isCounting.value = false; count.value = 60
    }
  }, 1000)
}

// 第一步：验证身份并去下一步
const handleNextStep = () => {
  resetFormRef.value.validateField(['phone', 'code'], (valid) => {
    if (valid) {
      // 这里应该调用后端接口验证验证码是否正确
      activeStep.value = 1
    }
  })
}

// 第二步：提交修改
const handleSubmit = () => {
  resetFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        loading.value = false
        ElMessage.success('密码修改成功，请重新登录')
        router.push('/login')
      }, 1500)
    }
  })
}
</script>

<style scoped>
.reset-container {
  min-height: 100vh;
  width: 100%;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

/* 🌟 响应式卡片 */
.reset-card {
  width: 90%;
  max-width: 420px;
  padding: 40px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}
.header h2 { font-size: 24px; margin: 0 0 10px; color: #303133; }
.subtitle { font-size: 14px; color: #909399; margin: 0; }

.steps-bar {
  margin-bottom: 30px;
}

.code-row {
  display: flex;
  gap: 10px;
}

.send-btn {
  width: 120px;
  flex-shrink: 0;
}

.action-btn {
  width: 100%;
  height: 44px;
  margin-top: 10px;
  background-color: #409EFF;
  border-radius: 8px;
  font-size: 16px;
}

.footer-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}
.footer-link span {
  cursor: pointer;
  color: #409EFF;
}
.footer-link span:hover {
  text-decoration: underline;
}

/* 📱 手机端微调 */
@media screen and (max-width: 480px) {
  .reset-card { padding: 30px 20px; }
  .header h2 { font-size: 22px; }
}
</style>