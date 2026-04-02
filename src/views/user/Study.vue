<template>
  <div class="study-container">
    <div class="page-header mb-24 fade-in-down">
      <h2>📚 学科资料库</h2>
      <p class="subtitle">前人栽树，后人乘凉。掌握核心资料，逢考必过！</p>
    </div>

    <el-empty v-if="courseList.length === 0" description="资料库建设中，敬请期待..." :image-size="120" />

    <el-row :gutter="20" v-else>
      <transition-group name="grid">
        <el-col :xs="24" :sm="12" :md="8" :lg="8" v-for="course in courseList" :key="course._id" class="mb-20 grid-item">
          <div class="course-card" @click="$router.push(`/user/course/${course.code}`)">
            <div class="card-icon"><el-icon><Collection /></el-icon></div>
            <div class="card-info">
              <h3>{{ course.code }}</h3>
              <p>{{ course.name || '专业核心课程' }}</p>
            </div>
            <div class="card-arrow"><el-icon><ArrowRight /></el-icon></div>
          </div>
        </el-col>
      </transition-group>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Collection, ArrowRight } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const courseList = ref([])

onMounted(async () => {
  try {
    const res = await db.collection('courses').get()
    courseList.value = res.data ? res.data.sort((a,b) => b.createTime - a.createTime) : []
  } catch (error) {
    console.error('获取课程失败', error)
  }
})
</script>

<style scoped>
.fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
.grid-item { display: inline-block; width: 100%; }
.grid-enter-active { transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1); }
.grid-enter-from { opacity: 0; transform: translateY(30px) scale(0.95); }

.study-container { padding: 10px; max-width: 1200px; margin: 0 auto; }
.page-header h2 { margin: 0 0 8px 0; color: #2c3e50; font-size: 28px; font-weight: 600; letter-spacing: 1px;}
.subtitle { margin: 0; color: #7f8c8d; font-size: 15px; letter-spacing: 1px;}
.mb-24 { margin-bottom: 24px; }
.mb-20 { margin-bottom: 20px; }

.course-card { display: flex; align-items: center; padding: 25px 20px; background: #ffffff; border-radius: 16px; border: 1px solid #ebeef5; cursor: pointer; transition: all 0.4s; }
.course-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(64,158,255,0.15); border-color: #409EFF; background: #f4f9ff; }
.card-icon { width: 60px; height: 60px; border-radius: 14px; background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); color: white; display: flex; justify-content: center; align-items: center; font-size: 28px; margin-right: 20px; box-shadow: 0 4px 12px rgba(161, 140, 209, 0.4); flex-shrink: 0;}
.card-info { flex: 1; min-width: 0;}
.card-info h3 { margin: 0 0 6px 0; font-size: 22px; color: #2c3e50; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
.card-info p { margin: 0; font-size: 13px; color: #95a5a6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
.card-arrow { font-size: 24px; color: #c0c4cc; transition: all 0.3s; flex-shrink: 0;}
.course-card:hover .card-arrow { color: #409EFF; transform: translateX(5px); }

/* 📱 手机端适配 */
@media (max-width: 768px) {
  .course-card { padding: 20px 15px; }
  .card-icon { width: 45px; height: 45px; font-size: 22px; margin-right: 15px; }
  .card-info h3 { font-size: 18px; }
}
</style>