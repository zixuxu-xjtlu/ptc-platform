<template>
  <div class="member-study-container">
    <div class="page-header mb-24 animate-down">
      <h2>📚 知识资产库</h2>
      <p class="subtitle">作为社团成员，请熟悉各学科资料，以便更好地服务同学</p>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" v-for="course in courseList" :key="course._id" class="mb-24">
        <div class="member-course-card" @click="$router.push(`/member/course/${course.code}`)">
          <div class="card-glow"></div>
          <div class="card-icon"><el-icon><Reading /></el-icon></div>
          <div class="card-body">
            <h3>{{ course.code }}</h3>
            <p>{{ course.name }}</p>
          </div>
          <el-icon class="arrow"><Right /></el-icon>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Reading, Right } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const courseList = ref([])

onMounted(async () => {
  const res = await db.collection('courses').get()
  courseList.value = res.data || []
})
</script>

<style scoped>
.member-study-container { padding: 15px; max-width: 1200px; margin: 0 auto; }
.mb-24 { margin-bottom: 24px; }
.page-header h2 { margin: 0 0 8px; font-size: 28px; color: #1e293b; font-weight: 800; }
.subtitle { color: #64748b; font-size: 15px; }

.member-course-card {
  position: relative; background: #fff; padding: 30px 24px; border-radius: 20px;
  border: 1px solid #f1f5f9; display: flex; align-items: center; cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); overflow: hidden;
}
.member-course-card:hover { transform: translateY(-8px); border-color: #3b82f6; box-shadow: 0 15px 35px rgba(59, 130, 246, 0.1); }

.card-icon { width: 56px; height: 56px; background: #eff6ff; color: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-right: 20px; z-index: 2; flex-shrink: 0;}
.card-body { flex: 1; z-index: 2; min-width: 0; }
.card-body h3 { margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-body p { margin: 0; font-size: 13px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arrow { color: #cbd5e1; font-size: 20px; transition: 0.3s; z-index: 2; flex-shrink: 0;}
.member-course-card:hover .arrow { color: #3b82f6; transform: translateX(5px); }

.animate-down { animation: fadeInDown 0.6s ease both; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

/* 📱 手机端适配 */
@media screen and (max-width: 768px) {
  .member-course-card { padding: 20px 15px; }
  .card-icon { width: 46px; height: 46px; font-size: 22px; margin-right: 15px;}
  .card-body h3 { font-size: 18px; }
}
</style>