<template>
  <div class="study-manage-container">
    <div class="header-action mb-24 fade-in-down flex-header">
      <div class="title-section">
        <h2>🛠️ 学科板块管理</h2>
        <p class="subtitle text-muted">配置与管理各学科的核心资料入口</p>
      </div>
      <el-button type="primary" size="large" @click="handleAddCourse" class="add-btn" round>
        <el-icon class="mr-1"><Plus /></el-icon> 新增学科板块
      </el-button>
    </div>

    <el-empty v-if="courseList.length === 0" description="资料库为空，请先初始化" :image-size="120" />

    <el-row :gutter="20" v-else>
      <transition-group name="grid">
        <el-col :xs="24" :sm="12" :md="8" :lg="8" v-for="course in courseList" :key="course._id" class="mb-20 grid-item">
          <div class="premium-course-card" @click="$router.push(`/admin/course/${course.code}`)">
            <div class="action-badge">
              <span>编辑</span> <el-icon><Edit /></el-icon>
            </div>
            
            <div class="card-icon-wrapper">
              <el-icon><Collection /></el-icon>
            </div>
            
            <div class="card-text">
              <h3>{{ course.code }}</h3>
              <p>{{ course.name }}</p>
            </div>
          </div>
        </el-col>
      </transition-group>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Collection, Edit, Plus } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const courseList = ref([])

onMounted(async () => { await fetchCourses() })

const fetchCourses = async () => {
  try {
    const res = await db.collection('courses').get()
    if (!res.data || res.data.length === 0) {
      ElMessage.info('正在自动初始化基础课程...')
      const initCourses = ['MTH004', 'MTH008', 'PHY002']
      for (const code of initCourses) {
        await db.collection('courses').add({ code, name: '西浦核心课程', links: [], materials: [], exams: [], createTime: new Date().getTime() })
      }
      const newRes = await db.collection('courses').get()
      courseList.value = newRes.data || []
    } else {
      courseList.value = res.data.sort((a,b) => b.createTime - a.createTime)
    }
  } catch (error) { ElMessage.error('加载失败') }
}

const handleAddCourse = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新课程的代码 (例如：CSC101)', '新增学科板块', {
      confirmButtonText: '创建', cancelButtonText: '取消', inputPattern: /^[a-zA-Z0-9]+$/, inputErrorMessage: '只能包含字母和数字'
    })
    if (value) {
      const code = value.toUpperCase()
      if (courseList.value.find(c => c.code === code)) return ElMessage.warning('该课程已存在！')
      await db.collection('courses').add({ code, name: '新增课程', links: [], materials: [], exams: [], createTime: new Date().getTime() })
      ElMessage.success(`板块 ${code} 创建成功`)
      await fetchCourses()
    }
  } catch (err) {}
}
</script>

<style scoped>
.fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
.grid-item { display: inline-block; width: 100%; }
.grid-enter-active { transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1); }
.grid-enter-from { opacity: 0; transform: translateY(30px) scale(0.95); }

.study-manage-container { padding: 15px; max-width: 1200px; margin: 0 auto; overflow: visible;}
.header-action { display: flex; justify-content: space-between; align-items: flex-end; }
.title-section h2 { margin: 0 0 8px 0; color: #2c3e50; font-size: 28px; font-weight: 600;}
.subtitle { margin: 0; font-size: 15px; color: #7f8c8d;}
.mb-24 { margin-bottom: 24px; }
.mb-20 { margin-bottom: 20px; }
.add-btn { box-shadow: 0 4px 12px rgba(64,158,255,0.3); font-weight: bold;}

/* 🌟 全新重构的高级卡片 */
.premium-course-card {
  position: relative;
  background: #ffffff;
  border-radius: 20px;
  padding: 30px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 10px 30px rgba(0,0,0,0.02);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}
.premium-course-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(64,158,255,0.12);
  border-color: rgba(64,158,255,0.3);
}

/* 绝对定位的角标，不占流式空间，绝不挤压 */
.action-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: #fff0f0;
  color: #f56c6c;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s;
}
.premium-course-card:hover .action-badge { background: #f56c6c; color: white; }

.card-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 8px 16px rgba(142, 197, 252, 0.4);
  transition: transform 0.3s;
}
.premium-course-card:hover .card-icon-wrapper { transform: scale(1.1) rotate(-5deg); }

.card-text { width: 100%; }
.card-text h3 { margin: 0 0 8px 0; font-size: 24px; color: #2c3e50; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
.card-text p { margin: 0; font-size: 14px; color: #95a5a6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}

/* 📱 手机端专属调优 */
@media screen and (max-width: 768px) {
  .flex-header { flex-direction: column; align-items: flex-start; gap: 15px; }
  .premium-course-card { padding: 25px 20px; }
  .card-icon-wrapper { width: 50px; height: 50px; font-size: 24px; margin-bottom: 15px; }
  .card-text h3 { font-size: 20px; }
  .action-badge { top: 15px; right: 15px; padding: 4px 8px; font-size: 11px; }
}
</style>