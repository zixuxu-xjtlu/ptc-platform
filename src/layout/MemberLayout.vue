<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo-area" @click="goDashboard" style="cursor: pointer;">
        <h3>✨ 社团工作台</h3>
      </div>
      
      <el-menu
        active-text-color="#409EFF"
        background-color="#ffffff"
        text-color="#303133"
        :default-active="route.path"
        router
        class="el-menu-vertical"
      >
        <el-menu-item index="/member/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>数据大盘</span>
        </el-menu-item>
        <el-menu-item index="/member/tasks">
          <el-icon><List /></el-icon>
          <span>我的工作区</span>
        </el-menu-item>
        <el-menu-item index="/member/notices">
          <el-icon><Bell /></el-icon>
          <span>内部公告</span>
        </el-menu-item>
        <el-menu-item index="/member/ranking">
          <el-icon><Trophy /></el-icon>
          <span>工作积分排行</span>
        </el-menu-item>
        <el-menu-item index="/member/study">
          <el-icon><Reading /></el-icon>
          <span>知识资产库</span>
        </el-menu-item>
        <el-menu-item index="/member/shop">
          <el-icon><Present /></el-icon>
          <span>积分兑换区</span>
        </el-menu-item>
        <el-menu-item index="/member/quiz-manage">
          <el-icon><EditPen /></el-icon>
          <span>智学题库管理</span>
        </el-menu-item>
        
        <!-- <el-menu-item index="/member/achievements">
          <el-icon><Medal /></el-icon>
          <span>荣誉陈列室</span>
        </el-menu-item> -->
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span>欢迎您，{{ currentDept ? `[${currentDept}] ` : '' }}{{ realName || userName }}</span>
        </div>
        <div class="header-right flex items-center">
          <el-tag type="warning" effect="dark" round>工作积分: {{ workPoints }}</el-tag>
          <el-tag type="success" effect="dark" round style="margin-left: 10px; margin-right: 20px;">总积分: {{ totalPoints }}</el-tag>
          <el-button type="danger" link @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view></router-view>
      </el-main>
    </el-container>

    <el-dialog 
      v-model="infoDialogVisible" 
      title="👋 欢迎加入！请完善档案" 
      width="400px" 
      :show-close="false" 
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-alert title="作为社团正式成员，请填写真实姓名并绑定部门（不可更改）。" type="info" :closable="false" style="margin-bottom: 20px" />
      <el-form label-position="top">
        <el-form-item label="真实姓名 (必填)">
          <el-input v-model="formInfo.realName" placeholder="请输入您的真实姓名" />
        </el-form-item>
        <el-form-item label="所属部门 (必选)">
          <el-select v-model="formInfo.department" placeholder="请选择您的部门" style="width: 100%">
            <el-option v-for="dept in deptOptions" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveInfo" :loading="saving" :disabled="!formInfo.realName || !formInfo.department">
          确认绑定，进入工作台
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataBoard, List, Trophy, Present, Reading, EditPen, Bell, Medal } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { db } from '../cloudbase'

const route = useRoute()
const router = useRouter()

const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const userName = ref(currentUser.value.username || '')
const realName = ref(currentUser.value.realName || '')
const currentDept = ref(currentUser.value.department || '')
const totalPoints = ref(currentUser.value.points || 0)
const workPoints = ref(currentUser.value.workPoints || 0)

const infoDialogVisible = ref(false)
const saving = ref(false)
const formInfo = ref({ realName: '', department: '' })
const deptOptions = ['学术部', '行政部', '宣传部', '活动部']

onMounted(() => {
  if (currentUser.value.role === 'member' && (!currentUser.value.department || !currentUser.value.realName)) {
    infoDialogVisible.value = true
  }
})

const saveInfo = async () => {
  if (!formInfo.value.realName.trim()) return ElMessage.warning('姓名不能为空')
  saving.value = true
  try {
    await db.collection('users').doc(currentUser.value._id).update({
      realName: formInfo.value.realName,
      department: formInfo.value.department
    })
    
    currentUser.value.realName = formInfo.value.realName
    currentUser.value.department = formInfo.value.department
    realName.value = formInfo.value.realName
    currentDept.value = formInfo.value.department
    localStorage.setItem('user', JSON.stringify(currentUser.value))
    
    ElMessage.success('档案完善成功！')
    infoDialogVisible.value = false
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const goDashboard = () => { if (route.path !== '/member/dashboard') router.push('/member/dashboard') }

const handleLogout = () => {
  localStorage.removeItem('user')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.aside { background-color: #fff; border-right: 1px solid #e6e6e6; display: flex; flex-direction: column; }
.logo-area { height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #f0f0f0; transition: background-color 0.3s; }
.logo-area:hover { background-color: #f9fafc; }
.logo-area h3 { margin: 0; font-size: 18px; color: #303133; font-weight: 800;}
.el-menu-vertical { border-right: none; flex: 1; }

.header { background-color: #fff; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; z-index: 10; }
.header-left { font-weight: 500; color: #303133; }
.main-content { background-color: #f5f7fa; padding: 20px; overflow-y: auto; }

.flex { display: flex; }
.items-center { align-items: center; }
</style>