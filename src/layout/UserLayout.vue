<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo-area">
        <h3>PTC平台</h3>
      </div>
      <el-menu
        active-text-color="#409EFF"
        background-color="#ffffff"
        text-color="#303133"
        :default-active="$route.path"
        router
        class="el-menu-vertical"
      >
        <el-menu-item index="/user/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>首页总览</span>
        </el-menu-item>
        <el-menu-item index="/user/activities">
          <el-icon><Basketball /></el-icon>
          <span>活动报名</span>
        </el-menu-item>
        <el-menu-item index="/user/notices">
          <el-icon><Calendar /></el-icon>
          <span>社团公告</span>
        </el-menu-item>
        <el-menu-item index="/user/shop">
          <el-icon><Goods /></el-icon>
          <span>积分兑换</span>
        </el-menu-item>
        <el-menu-item index="/user/study"> 
          <el-icon><Reading /></el-icon>
          <span>学习资料</span>
        </el-menu-item>
        <el-menu-item index="/user/quiz"> 
          <el-icon><EditPen /></el-icon>
          <span>智学挑战</span>
        </el-menu-item>
        
        <!-- <el-menu-item index="/user/achievements">
          <el-icon><Medal /></el-icon>
          <span>荣誉陈列室</span>
        </el-menu-item> -->

        <el-sub-menu index="tools">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>伴学小工具</span>
          </template>
          
          <el-menu-item-group title="专业相关">
            <el-menu-item index="/user/majors"> 
              <el-icon><Guide /></el-icon>
              <span>选专业指导</span>
            </el-menu-item>
            <el-menu-item index="/user/survey"> 
              <el-icon><DataLine /></el-icon>
              <span>兴趣评估</span>
            </el-menu-item>
          </el-menu-item-group>
        </el-sub-menu>
        
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span>欢迎回来，{{ currentUser.realName || currentUser.username }}</span>
        </div>
        <div class="header-right">
          <el-button type="danger" link @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <AIAssistant />
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Odometer, Basketball, Calendar, Goods, Reading, Guide, DataLine, EditPen, Box, Medal } from '@element-plus/icons-vue'
import { ref } from 'vue'
import AIAssistant from '../components/AIAssistant.vue'

const router = useRouter()
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const handleLogout = () => {
  localStorage.removeItem('user')
  sessionStorage.removeItem('sloganPlayed') 
  router.push('/login')
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.aside { background-color: #fff; border-right: 1px solid #e6e6e6; }
.logo-area { height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #f0f0f0; }
.header { background-color: #fff; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.main-content { background-color: #f5f7fa; padding: 20px; }

:deep(.el-menu-item-group__title) {
  font-size: 12px;
  color: #909399;
  padding-left: 20px;
}
</style>