<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="aside">
      <div class="logo" @click="goDashboard" title="返回控制台总览">
        <h2>👑 核心管理后台</h2>
      </div>
      
      <el-menu
        :default-active="route.path"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><Odometer /></el-icon><span>控制台总览</span>
        </el-menu-item>
        <el-menu-item index="/admin/majors">
          <el-icon><Guide /></el-icon><span>专业数据管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon><span>成员档案与积分</span>
        </el-menu-item>
        <el-menu-item index="/admin/shop">
          <el-icon><Goods /></el-icon><span>商城上货管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/activities">
          <el-icon><Calendar /></el-icon><span>活动与公告发布</span>
        </el-menu-item>
        <el-menu-item index="/admin/study"> 
          <el-icon><Reading /></el-icon><span>学习资料</span>
        </el-menu-item>
        <el-menu-item index="/admin/quiz-manage"> 
          <el-icon><EditPen /></el-icon><span>智学题库管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/work">
          <el-icon><Connection /></el-icon><span>工作分配与模板</span>
        </el-menu-item>
        <el-menu-item index="/admin/inventory">
          <el-icon><Box /></el-icon><span>物资仓库管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/publish-notice">
          <el-icon><Bell /></el-icon><span>全站更新发布</span>
        </el-menu-item>
        
        <div class="logout-box">
          <el-button type="danger" plain class="w-100" @click="handleLogout">退出管理后台</el-button>
        </div>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span>欢迎您，{{ currentDept ? `[${currentDept}] ` : '' }}{{ adminName }}</span>
        </div>
        <div class="header-right">
          <el-button type="primary" text bg @click="goDashboard">
            <el-icon style="margin-right: 4px;"><House /></el-icon> 返回大盘
          </el-button>
        </div>
      </el-header>
      
      <el-main class="main-bg">
        <router-view></router-view>
      </el-main>
    </el-container>

    <el-dialog 
      v-model="deptDialogVisible" 
      title="⚠️ 请完善管理层信息" 
      width="400px" 
      :show-close="false" 
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-alert title="检测到您暂未绑定所属部门，请选择后继续操作。" type="warning" :closable="false" style="margin-bottom: 20px" />
      <el-form label-position="top">
        <el-form-item label="所属部门 (必选)">
          <el-select v-model="selectedDept" placeholder="请选择您的部门" style="width: 100%">
            <el-option v-for="dept in deptOptions" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveDepartment" :loading="savingDept" :disabled="!selectedDept">
          确认绑定
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// ⚠️ 注意：这里补齐了 Box 和新增了 Bell 图标的引用
import { User, Goods, Calendar, Odometer, House, Connection, Guide, Reading, EditPen, View, Box, Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { db } from '../cloudbase'

const route = useRoute()
const router = useRouter()

const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const adminName = ref(currentUser.value.username || 'Admin')
const currentDept = ref(currentUser.value.department || '')

// 部门拦截逻辑
const deptDialogVisible = ref(false)
const selectedDept = ref('')
const savingDept = ref(false)
const deptOptions = ['主席团', '学术部', '行政部', '宣传部', '活动部']

onMounted(() => {
  if (currentUser.value.role === 'admin' && !currentUser.value.department) {
    deptDialogVisible.value = true
  }
})

// 保存部门
const saveDepartment = async () => {
  savingDept.value = true
  try {
    await db.collection('users').doc(currentUser.value._id).update({
      department: selectedDept.value
    })
    currentUser.value.department = selectedDept.value
    currentDept.value = selectedDept.value
    localStorage.setItem('user', JSON.stringify(currentUser.value))
    
    ElMessage.success(`成功绑定部门：${selectedDept.value}`)
    deptDialogVisible.value = false
  } catch (err) {
    ElMessage.error('绑定失败，请检查网络')
  } finally {
    savingDept.value = false
  }
}

const goDashboard = () => { if (route.path !== '/admin/dashboard') router.push('/admin/dashboard') }
const handleLogout = () => {
  localStorage.removeItem('user')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout { height: 100vh; }
.aside { background-color: #304156; display: flex; flex-direction: column; }
.logo { height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; background-color: #2b3643; cursor: pointer; transition: background-color 0.3s; }
.logo:hover { background-color: #1f2a35; }
.logo h2 { margin: 0; font-size: 18px; }
.el-menu-vertical { border-right: none; flex: 1; }
.logout-box { padding: 20px; position: absolute; bottom: 0; width: 100%; box-sizing: border-box; }
.w-100 { width: 100%; }
.header { background-color: #fff; box-shadow: 0 1px 4px rgba(0,21,41,0.08); display: flex; justify-content: space-between; align-items: center; padding: 0 20px; z-index: 10; }
.header-left { font-weight: 500; color: #303133; }
.main-bg { background-color: #f0f2f5; padding: 20px; overflow-y: auto; }
</style>