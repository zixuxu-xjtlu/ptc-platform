<template>
  <div class="admin-container">
    <transition name="fade" mode="out-in">
      <el-card v-if="!isAuthenticated" class="auth-card" shadow="hover">
        <template #header>
          <div class="auth-header">
            <el-icon class="lock-icon"><Lock /></el-icon>
            <h3>需要管理员权限</h3>
          </div>
        </template>
        
        <p class="auth-tips">请输入超级管理员密码以解锁发布功能</p>
        
        <el-input 
          v-model="passwordInput" 
          type="password" 
          placeholder="请输入密码" 
          show-password
          size="large"
          @keyup.enter="verifyPassword"
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>

        <el-button 
          type="primary" 
          class="unlock-btn" 
          size="large" 
          @click="verifyPassword"
          :loading="authLoading"
        >
          解 锁
        </el-button>
      </el-card>

      <el-card v-else class="publish-card" shadow="hover">
        <template #header>
          <div class="publish-header">
            <h3>🚀 发布新版本公告</h3>
            <el-tag type="success" effect="dark" round>已解锁</el-tag>
          </div>
        </template>
        
        <el-form label-width="100px">
          <el-form-item label="版本号">
            <el-input v-model="formData.latest_version" placeholder="例如: v1.2.0" />
          </el-form-item>
          
          <el-form-item label="公告标题">
            <el-input v-model="formData.title" placeholder="例如: 🎉 春季重磅更新来袭！" />
          </el-form-item>
          
          <el-form-item label="更新内容">
            <el-input 
              v-model="formData.content" 
              type="textarea" 
              :rows="6" 
              placeholder="请输入更新内容，每敲一次回车（换行）就算作一条" 
            />
          </el-form-item>

          <el-form-item label="强制弹窗">
            <el-switch v-model="formData.is_force" active-text="必须点确认才能关" inactive-text="可随意关闭" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="publishUpdate" :loading="loading" size="large" class="submit-btn">
              ⚡ 立即发布全网
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Key } from '@element-plus/icons-vue' // 引入图标
import { db } from '../../cloudbase' // 换成你实际的云开发路径

// --- 🔒 权限控制部分 ---
const isAuthenticated = ref(false)
const passwordInput = ref('')
const authLoading = ref(false)

// ⚠️ 已将管理员密码修改为你要求的 Zixu_1128
const ADMIN_PASSWORD = 'Zixu_1128' 

const verifyPassword = () => {
  if (!passwordInput.value) {
    return ElMessage.warning('密码不能为空')
  }
  
  authLoading.value = true
  // 模拟一个极其短暂的验证延迟，让交互更真实
  setTimeout(() => {
    if (passwordInput.value === ADMIN_PASSWORD) {
      ElMessage.success('身份验证成功！')
      isAuthenticated.value = true
    } else {
      ElMessage.error('密码错误，请重试！')
      passwordInput.value = '' // 清空错误密码
    }
    authLoading.value = false
  }, 400)
}

// --- 🚀 发布逻辑部分 ---
const loading = ref(false)
const formData = ref({
  latest_version: '',
  title: '',
  content: '', 
  is_force: false
})

const publishUpdate = async () => {
  if (!formData.value.latest_version || !formData.value.title) {
    return ElMessage.warning('版本号和标题不能为空哦！')
  }

  loading.value = true
  try {
    const contentArray = formData.value.content.split('\n').filter(item => item.trim() !== '')

    await db.collection('system_config').doc('version_notice').set({
      latest_version: formData.value.latest_version,
      title: formData.value.title,
      content: contentArray,
      is_force: formData.value.is_force,
      update_date: new Date().getTime()
    })

    ElMessage.success('发布成功！全网用户登录将立即看到新弹窗！')
    
    // 发布成功后清空表单，防止重复提交
    formData.value.latest_version = ''
    formData.value.title = ''
    formData.value.content = ''
    
  } catch (error) {
    ElMessage.error('发布失败：' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-container {
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 50px;
}

/* 密码面板样式 */
.auth-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  text-align: center;
}
.auth-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #303133;
}
.lock-icon {
  font-size: 20px;
  color: #f56c6c;
}
.auth-tips {
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
}
.unlock-btn {
  width: 100%;
  margin-top: 20px;
  border-radius: 8px;
  font-weight: bold;
}

/* 发布面板样式 */
.publish-card { 
  width: 100%;
  max-width: 650px; 
  border-radius: 12px; 
}
.publish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.publish-header h3 {
  margin: 0;
}
.submit-btn {
  border-radius: 8px;
  font-weight: bold;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>