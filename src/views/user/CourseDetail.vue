<template>
  <div class="course-detail-container" v-loading="loading">
    
    <div class="header-banner fade-in-down">
      <el-button plain round icon="ArrowLeft" @click="$router.back()" class="back-btn">返回资料库</el-button>
      <div class="title-area">
        <h1>{{ courseData.code }}</h1>
        <p class="subtitle">{{ courseData.name }} - 内部独家资料</p>
      </div>
    </div>

    <el-card shadow="never" class="main-card fade-in-up">
      <el-tabs v-model="activeTab" class="custom-tabs">
        
        <el-tab-pane name="links">
          <template #label><span class="tab-label"><el-icon><VideoCamera /></el-icon> 复习课</span></template>
          <div class="section-content">
            <el-empty v-if="!courseData.links || courseData.links.length === 0" description="暂无复习课" />
            <el-row :gutter="24">
              <el-col :xs="24" :sm="12" :md="12" v-for="(item, idx) in courseData.links" :key="idx" class="mb-20">
                <div class="resource-card link-card" @click="handleDownload(item)">
                  <div class="r-icon"><el-icon><VideoPlay /></el-icon></div>
                  <div class="r-info"><h4>{{ item.title }}</h4><p class="url-text">在线播放视频</p></div>
                  <div class="r-status"><el-tag type="success" size="small" effect="plain">免费</el-tag></div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane name="materials">
          <template #label><span class="tab-label"><el-icon><FolderOpened /></el-icon> 相关资料</span></template>
          <div class="section-content">
            <el-empty v-if="!courseData.materials || courseData.materials.length === 0" description="暂无资料" />
            <el-row :gutter="24">
              <el-col :xs="24" :sm="12" :md="8" v-for="(item, idx) in courseData.materials" :key="idx" class="mb-20">
                <div class="resource-card doc-card" @click="handleDownload(item)">
                  <div class="r-icon"><el-icon><Document /></el-icon></div>
                  <div class="r-info"><h4>{{ item.title }}</h4></div>
                  <div class="r-status">
                    <el-tag v-if="item.isFree" type="success" size="small" effect="plain">直接下载</el-tag>
                    <el-tag v-else type="warning" size="small" effect="dark"><el-icon><Lock/></el-icon> {{ item.cost }} 分</el-tag>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane name="exams">
          <template #label><span class="tab-label"><el-icon><EditPen /></el-icon> 往年真题</span></template>
          <div class="section-content">
            <el-empty v-if="!courseData.exams || courseData.exams.length === 0" description="暂无真题" />
            <el-row :gutter="24">
              <el-col :xs="24" :sm="12" :md="8" v-for="(item, idx) in courseData.exams" :key="idx" class="mb-20">
                <div class="resource-card exam-card" @click="handleDownload(item)">
                  <div class="r-icon"><el-icon><Medal /></el-icon></div>
                  <div class="r-info"><h4>{{ item.title }}</h4></div>
                  <div class="r-status"><el-tag type="success" size="small" effect="plain">免费</el-tag></div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, VideoCamera, FolderOpened, EditPen, VideoPlay, Document, Medal, Lock } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const route = useRoute()
const loading = ref(true)
const activeTab = ref('materials')
const courseData = ref({ links: [], materials: [], exams: [] })
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

onMounted(async () => {
  try {
    const res = await db.collection('courses').where({ code: route.params.code }).get()
    if (res.data && res.data.length > 0) courseData.value = res.data[0]
  } finally { loading.value = false }
})

const handleDownload = async (item) => {
  if (item.isFree || item.isFree === undefined) { window.open(item.url, '_blank'); return }
  const currentPoints = currentUser.value.points || 0
  if (currentPoints < item.cost) return ElMessage.warning(`你的积分不足哦！需要 ${item.cost} 积分`)

  try {
    await ElMessageBox.confirm(`下载将扣除 ${item.cost} 积分，确认下载吗？`, '解锁资料', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    loading.value = true
    const _ = db.command
    await db.collection('users').doc(currentUser.value._id).update({ points: _.inc(-item.cost) })
    currentUser.value.points -= item.cost
    localStorage.setItem('user', JSON.stringify(currentUser.value))
    
    ElMessage.success('解锁成功！')
    setTimeout(() => { window.open(item.url, '_blank'); loading.value = false }, 800)
  } catch (error) { loading.value = false }
}
</script>

<style scoped>
.fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }

.course-detail-container { padding: 10px; max-width: 1200px; margin: 0 auto; }
.header-banner { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-radius: 16px; padding: 30px; color: white; margin-bottom: 25px; position: relative; box-shadow: 0 10px 20px rgba(30, 60, 114, 0.2); }
.back-btn { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.3);}
.back-btn:hover { background: white; color: #1e3c72; }
.title-area h1 { margin: 0 0 10px 0; font-size: 42px; letter-spacing: 2px; text-shadow: 0 4px 10px rgba(0,0,0,0.3);}
.subtitle { margin: 0; font-size: 16px; opacity: 0.8;}

.main-card { min-height: 500px; border-radius: 16px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.03) !important;}
.tab-label { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: bold;}
:deep(.el-tabs__item) { padding: 0 30px; height: 55px; line-height: 55px; color: #95a5a6; transition: all 0.3s;}
:deep(.el-tabs__item.is-active) { color: #409EFF; font-size: 17px; }
:deep(.el-tabs__active-bar) { height: 3px; border-radius: 3px; }

.section-content { padding: 20px 10px; }
.mb-20 { margin-bottom: 20px; }
.resource-card { display: flex; align-items: center; padding: 20px 18px; border-radius: 14px; background: #ffffff; border: 1px solid #ebeef5; cursor: pointer; transition: all 0.4s; }
.resource-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); background: #fdfdfd;}

.r-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px; color: white; margin-right: 18px; flex-shrink: 0; }
.r-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;}
.r-info h4 { margin: 0 0 6px 0; font-size: 16px; color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;}
.url-text { margin: 0; font-size: 13px; color: #95a5a6;}

.link-card:hover { border-color: #f56c6c; } .link-card .r-icon { background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%); }
.doc-card:hover { border-color: #409EFF; } .doc-card .r-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.exam-card:hover { border-color: #e6a23c; } .exam-card .r-icon { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
.r-status { margin-left: 15px; }

/* 📱 手机端专属调优 */
@media (max-width: 768px) {
  .header-banner { padding: 20px; }
  .title-area h1 { font-size: 28px; }
  .back-btn { top: 15px; right: 15px; padding: 5px 10px; font-size: 12px; }
  :deep(.el-tabs__item) { padding: 0 15px; font-size: 14px; }
  .resource-card { padding: 15px; }
  .r-icon { width: 40px; height: 40px; font-size: 20px; margin-right: 10px; }
}
</style>