<template>
  <div class="register-container">
    <div class="register-card" :class="{ 'expanded': activeStep === 2 }">
      
      <div v-if="activeStep === 1" class="step-one">
        <div class="header">
          <h2>选择您的身份</h2>
          <p class="subtitle">请选择您在校园中的角色以继续</p>
        </div>

        <div class="role-cards-wrapper">
          <div class="role-card" @click="selectRole('user')">
            <el-icon class="role-icon"><Avatar /></el-icon>
            <div class="role-info">
              <div class="role-title">我是学校同学</div>
              <div class="role-desc">浏览社团动态，参与公开活动</div>
            </div>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>

          <div class="role-card" @click="selectRole('member')">
            <el-icon class="role-icon"><UserFilled /></el-icon>
            <div class="role-info">
              <div class="role-title">我是社团成员</div>
              <div class="role-desc">执行内部工作，需管理层审核</div>
            </div>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>

          <div class="role-card" @click="selectRole('admin')">
            <el-icon class="role-icon"><Key /></el-icon>
            <div class="role-info">
              <div class="role-title">我是社团管理层</div>
              <div class="role-desc">拥有最高权限，需内部邀请码</div>
            </div>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>
        </div>
        
        <div class="footer-links">
          <span class="login-link" @click="goToLogin">已有账号？返回登录</span>
        </div>
      </div>

      <div v-if="activeStep === 2" class="step-two">
        <div class="form-header">
          <el-button link icon="ArrowLeft" @click="activeStep = 1">返回重新选择</el-button>
          <h3>填写注册信息 ({{ roleNames[regForm.role] }})</h3>
        </div>

        <el-form :model="regForm" :rules="rules" ref="regFormRef" label-position="top">
          <div v-if="regForm.role === 'user'" class="role-specific-area">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="真实姓名" prop="realName">
                  <el-input v-model="regForm.realName" placeholder="张三" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="学校邮箱" prop="email">
                  <el-input v-model="regForm.email" placeholder="xxx@student.xjtlu.edu.cn" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div v-if="regForm.role === 'member'" class="role-specific-area warning-bg">
            <p class="audit-notice">⚠️ 提交后需等待管理层审核通过方可登录</p>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="真实姓名" prop="realName">
                  <el-input v-model="regForm.realName" placeholder="张三" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="学号" prop="studentId">
                  <el-input v-model="regForm.studentId" placeholder="请输入您的学号" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div v-if="regForm.role === 'admin'" class="role-specific-area danger-bg">
            <el-form-item label="管理员邀请码" prop="inviteCode">
              <el-input v-model="regForm.inviteCode" prefix-icon="Key" placeholder="请输入内部核心邀请码" type="password" show-password />
            </el-form-item>
          </div>

          
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="用户名" prop="username">
                <el-input v-model="regForm.username" placeholder="唯一登录名" prefix-icon="User" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="设置密码" prop="password">
                <el-input v-model="regForm.password" type="password" placeholder="6-16位字符" show-password prefix-icon="Lock" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="手机号码" prop="phone">
            <el-input v-model="regForm.phone" placeholder="请输入手机号" prefix-icon="Iphone" />
          </el-form-item>

          <el-form-item label="验证码" prop="code">
            <div class="code-row">
              <el-input v-model="regForm.code" placeholder="请输入短信验证码" prefix-icon="Message" />
              <el-button type="primary" plain :disabled="isCounting" @click="handleSendCode" class="send-btn">
                {{ isCounting ? `${count}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="人机验证" prop="captchaInput">
            <div class="captcha-row">
              <el-tag size="large" type="info" class="captcha-question">{{ captcha.num1 }} + {{ captcha.num2 }} = ?</el-tag>
              <el-input v-model="regForm.captchaInput" placeholder="请输入计算结果" style="flex: 1;" />
              <el-button @click="generateCaptcha" icon="Refresh" circle></el-button>
            </div>
          </el-form-item>

          <div class="agreement-row">
            <el-checkbox v-model="regForm.agree">
              我已阅读并同意 <el-button link type="primary" @click.prevent="dialogVisible = true">《伴学社用户服务与隐私协议》</el-button>
            </el-checkbox>
          </div>

          <el-button type="primary" class="submit-btn" @click="handleRegister" :loading="loading">
            {{ regForm.role === 'member' ? '提交审核' : '立即注册' }}
          </el-button>
        </el-form>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="伴学社用户服务与隐私协议" width="90%" max-width="600px" center custom-class="mobile-dialog">
      <div class="agreement-content">
        <p><strong>甲方：伴学社管理平台</strong></p>
        <p><strong>乙方：注册用户</strong></p>
        <p>欢迎您注册并使用伴学社系统！在您注册前，请务必审慎阅读、充分理解各条款内容：</p>
        <h4>一、 信息与隐私保护</h4>
        <p>1. 乙方在注册时需提供真实、准确的个人资料（包含但不限于姓名、学号、手机号码等）。如提供虚假信息，甲方有权拒绝提供服务或注销账号。</p>
        <p>2. 甲方承诺严格保护乙方的个人隐私，未经乙方许可，绝不向任何第三方（非学校及相关管理部门）泄露、出售或共享乙方的个人数据。</p>
        <p>3. 收集的数据仅用于社团内部的活动通知、积分统计与工作流管理。</p>
        <h4>二、 账号安全</h4>
        <p>1. 乙方账号采取“单手机号单账号”实名制注册原则。乙方需妥善保管账号密码，不得将账号转让、借用或售卖给他人。</p>
        <p>2. 因乙方个人原因导致的账号被盗或信息泄露，由此产生的责任由乙方自行承担。</p>
        <h4>三、 用户行为规范</h4>
        <p>1. 乙方承诺在使用本平台时遵守国家法律法规及学校规章制度，不得发布违法、违规、暴力、色情或恶意攻击他人的不当言论。</p>
        <p>2. 针对社团内部管理层及成员，需对平台内分配的内部工作流及核心资料进行保密。若因故意泄露导致社团遭受损失，甲方保留追究责任的权利。</p>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="agreeAndClose">我已阅读并同意</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Iphone, Message, Lock, Key, Avatar, UserFilled, ArrowRight, ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { auth, db } from '../cloudbase'

const router = useRouter()
const regFormRef = ref(null)
const loading = ref(false)
const isCounting = ref(false)
const count = ref(60)

const activeStep = ref(1)
const roleNames = { user: '学校同学', member: '社团成员', admin: '管理层' }
const dialogVisible = ref(false)

const captcha = reactive({ num1: 0, num2: 0 })
const generateCaptcha = () => {
  captcha.num1 = Math.floor(Math.random() * 10) + 1
  captcha.num2 = Math.floor(Math.random() * 10) + 1
  regForm.captchaInput = ''
}

onMounted(() => { generateCaptcha() })

const regForm = reactive({
  role: 'user', username: '', realName: '', studentId: '', email: '',
  inviteCode: '', phone: '', code: '', password: '', captchaInput: '', agree: false
})

const rules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 3, max: 20, message: '长度3-20字符', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '格式错误', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, max: 16, message: '需6-16位', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  inviteCode: [{ required: true, message: '请输入邀请码', trigger: 'blur' }],
  captchaInput: [{ required: true, message: '请输入计算结果', trigger: 'blur' }]
})

const selectRole = (role) => {
  regForm.role = role
  if(regFormRef.value) regFormRef.value.resetFields()
  activeStep.value = 2
  generateCaptcha()
}

const agreeAndClose = () => { regForm.agree = true; dialogVisible.value = false }

const handleSendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(regForm.phone)) return ElMessage.error('手机号格式不正确')
  try {
    const checkPhone = await db.collection('users').where({ phone: regForm.phone }).get()
    if (checkPhone && checkPhone.data && checkPhone.data.length > 0) return ElMessage.error('该手机号已被注册')

    await auth.getVerification({ phone_number: `+86 ${regForm.phone}` })
    isCounting.value = true
    ElMessage.success('验证码发送成功')
    const timer = setInterval(() => {
      count.value--
      if (count.value <= 0) { clearInterval(timer); isCounting.value = false; count.value = 60 }
    }, 1000)
  } catch (error) { ElMessage.error('发送失败：' + error.message) }
}

const handleRegister = () => {
  if (!regFormRef.value) return
  regFormRef.value.validate(async (valid) => {
    if (valid) {
      if (!regForm.agree) return ElMessage.warning('请先阅读并同意隐私协议')
      if (parseInt(regForm.captchaInput) !== captcha.num1 + captcha.num2) {
        generateCaptcha()
        return ElMessage.error('人机验证错误')
      }
      if (regForm.role === 'admin' && regForm.inviteCode !== '56539') return ElMessage.error('邀请码不正确')

      loading.value = true
      try {
        const loginState = await auth.getLoginState();
        if (!loginState) await auth.signInAnonymously(); 

        const checkPhone = await db.collection('users').where({ phone: regForm.phone }).get()
        if (checkPhone && checkPhone.data && checkPhone.data.length > 0) { loading.value = false; return ElMessage.error('手机号已被注册') }

        const checkUser = await db.collection('users').where({ username: regForm.username }).get()
        if (checkUser && checkUser.data && checkUser.data.length > 0) { loading.value = false; return ElMessage.error('用户名已被注册') }

        const userStatus = regForm.role === 'member' ? 'pending' : 'active'

        const addResult = await db.collection('users').add({
          username: regForm.username, password: regForm.password, phone: regForm.phone,
          role: regForm.role, status: userStatus,
          realName: (regForm.role === 'member' || regForm.role === 'user') ? regForm.realName : '',
          studentId: regForm.role === 'member' ? regForm.studentId : '',
          email: regForm.role === 'user' ? regForm.email : '',
          department: '', workPoints: 0, avatar: '', points: 0, createTime: new Date().getTime()
        })
        
        if (addResult && addResult.code) { loading.value = false; return ElMessage.error(`写入失败：${addResult.message}`) }

        loading.value = false
        if (regForm.role === 'member') ElMessage.success('提交成功！等待审核')
        else ElMessage.success('注册成功！请登录')
        router.push('/login')
      } catch (error) {
        loading.value = false
        ElMessage.error('注册异常：' + (error.message || error.errMsg))
      }
    } else { ElMessage.warning('请检查必填项') }
  })
}

const goToLogin = () => router.push('/login')
</script>

<style scoped>
.register-container { min-height: 100vh; width: 100%; background-color: #f5f7fa; display: flex; justify-content: center; align-items: center; padding: 20px 0; }

/* 🌟 响应式卡片 */
.register-card { 
  width: 90%; 
  max-width: 420px; 
  padding: 40px; 
  background: #ffffff; 
  border-radius: 16px; 
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08); 
  transition: all 0.3s ease; 
  margin: 0 auto;
}
.register-card.expanded { max-width: 550px; }

.header { text-align: center; margin-bottom: 30px; }
.header h2 { margin: 0; color: #303133; font-size: 24px; }
.subtitle { margin: 10px 0 0; color: #909399; font-size: 14px; }

.role-cards-wrapper { display: flex; flex-direction: column; gap: 16px; }
.role-card { display: flex; align-items: center; padding: 20px; border: 2px solid #ebeef5; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; background: #fafafa;}
.role-card:hover { border-color: #409EFF; background: #ecf5ff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(64,158,255,0.15); }
.role-icon { font-size: 32px; color: #409EFF; width: 50px; }
.role-info { flex: 1; margin-left: 10px; }
.role-title { font-size: 16px; font-weight: bold; color: #303133; margin-bottom: 4px; }
.role-desc { font-size: 12px; color: #909399; }
.arrow-icon { color: #c0c4cc; font-size: 20px; transition: color 0.3s; }
.role-card:hover .arrow-icon { color: #409EFF; }

.form-header { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 25px; border-bottom: 1px solid #ebeef5; padding-bottom: 15px; }
.form-header h3 { margin: 15px 0 0; color: #303133; font-size: 20px; }

.role-specific-area { background-color: #f9fafc; padding: 15px 15px 0; border-radius: 8px; margin-bottom: 20px; border: 1px dashed #dcdfe6; }
.warning-bg { background-color: #fdf6ec; border-color: #f5dab1; }
.danger-bg { background-color: #fef0f0; border-color: #fbc4c4; }
.audit-notice { font-size: 12px; color: #e6a23c; margin: 0 0 15px 0; font-weight: bold; }

.code-row, .captcha-row { display: flex; gap: 10px; align-items: center; }
.send-btn { width: 120px; flex-shrink: 0; }
.captcha-question { font-size: 16px; font-weight: bold; width: 90px; text-align: center; flex-shrink: 0; }

.agreement-row { margin-bottom: 20px; display: flex; align-items: center; }
.agreement-content { line-height: 1.6; color: #606266; font-size: 14px; max-height: 400px; overflow-y: auto; padding: 0 10px; }
.agreement-content h4 { color: #303133; margin: 15px 0 8px 0; }
.submit-btn { width: 100%; height: 44px; background-color: #409EFF; font-size: 16px; border-radius: 8px;}
.footer-links { margin-top: 25px; text-align: center; font-size: 14px; color: #409EFF; cursor: pointer; }
.login-link:hover { text-decoration: underline; }

/* 📱 手机端微调 */
@media screen and (max-width: 480px) {
  .register-card { padding: 30px 20px; }
  .header h2 { font-size: 22px; }
  .role-card { padding: 15px; }
  .role-icon { font-size: 28px; width: 40px; }
  .role-title { font-size: 15px; }
}
</style>