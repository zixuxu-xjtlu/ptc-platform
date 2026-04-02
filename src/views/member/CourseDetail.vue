<template>
  <div class="course-detail-container" v-loading="loading">
    
    <div class="member-header-banner fade-in-down">
      <el-button plain round icon="ArrowLeft" @click="$router.back()" class="back-btn">返回资产库</el-button>
      <div class="title-area">
        <div class="badge-row">
          <el-tag effect="dark" type="info" size="small" round>执行团队内部资料</el-tag>
        </div>
        <h1>{{ courseData.code }}</h1>
        <p class="subtitle">{{ courseData.name }}</p>
      </div>
    </div>

    <el-card shadow="never" class="main-card fade-in-up">
      <el-tabs v-model="activeTab" class="member-custom-tabs">
        
        <el-tab-pane name="links">
          <template #label>
            <span class="tab-label"><el-icon><VideoCamera /></el-icon> 复习课录屏</span>
          </template>
          <div class="section-content">
            <el-empty v-if="!courseData.links || courseData.links.length === 0" description="暂无视频记录" />
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" v-for="(item, idx) in courseData.links" :key="idx" class="mb-20">
                <div class="resource-card link-card" @click="openLink(item.url)">
                  <div class="r-icon"><el-icon><VideoPlay /></el-icon></div>
                  <div class="r-info">
                    <h4>{{ item.title }}</h4>
                    <p class="tagline">点击跳转视频源</p>
                  </div>
                  <el-icon class="arrow-icon"><Right /></el-icon>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane name="materials">
          <template #label>
            <span class="tab-label"><el-icon><FolderOpened /></el-icon> 核心学习资料</span>
          </template>
          <div class="section-content">
            <el-empty v-if="!courseData.materials || courseData.materials.length === 0" description="暂无课件资料" />
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="8" v-for="(item, idx) in courseData.materials" :key="idx" class="mb-20">
                <div class="resource-card doc-card" @click="openLink(item.url)">
                  <div class="r-icon"><el-icon><Document /></el-icon></div>
                  <div class="r-info">
                    <h4>{{ item.title }}</h4>
                    <div class="meta-tags">
                      <el-tag v-if="!item.isFree" type="warning" size="small" effect="plain">{{ item.cost }} 积分</el-tag>
                      <el-tag v-else type="success" size="small" effect="plain">公开资料</el-tag>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane name="exams">
          <template #label>
            <span class="tab-label"><el-icon><EditPen /></el-icon> 历年真题库</span>
          </template>
          <div class="section-content">
            <el-empty v-if="!courseData.exams || courseData.exams.length === 0" description="暂无真题收录" />
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="8" v-for="(item, idx) in courseData.exams" :key="idx" class="mb-20">
                <div class="resource-card exam-card" @click="openLink(item.url)">
                  <div class="r-icon"><el-icon><Medal /></el-icon></div>
                  <div class="r-info">
                    <h4>{{ item.title }}</h4>
                    <p class="tagline">真题模拟/答案</p>
                  </div>
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
import { 
  ArrowLeft, VideoCamera, FolderOpened, EditPen, 
  VideoPlay, Document, Medal, Right 
} from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const route = useRoute()
const loading = ref(true)
const activeTab = ref('materials') 
const courseData = ref({ links: [], materials: [], exams: [] })

onMounted(async () => {
  try {
    const res = await db.collection('courses').where({ code: route.params.code }).get()
    if (res.data && res.data.length > 0) courseData.value = res.data[0]
  } finally { loading.value = false }
})

const openLink = (url) => { if (url) window.open(url, '_blank') }
</script>

<style scoped>
.course-detail-container { padding: 15px; max-width: 1200px; margin: 0 auto; }
.mb-20 { margin-bottom: 20px; }

.member-header-banner { background: #1e293b; border-radius: 20px; padding: 45px 35px; color: white; margin-bottom: 30px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.back-btn { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.05); color: white; border-color: rgba(255,255,255,0.1); }
.back-btn:hover { background: white; color: #1e293b; }

.badge-row { margin-bottom: 12px; }
.title-area h1 { margin: 0; font-size: 42px; font-weight: 900; letter-spacing: 2px; }
.subtitle { margin: 10px 0 0; opacity: 0.6; font-size: 16px; font-weight: 500; }

.main-card { border-radius: 24px; border: none; box-shadow: 0 4px 25px rgba(0,0,0,0.04) !important; min-height: 600px; }
.tab-label { display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 15px; }

:deep(.el-tabs__item) { height: 60px; line-height: 60px; padding: 0 30px; font-weight: 700; color: #94a3b8; transition: all 0.3s;}
:deep(.el-tabs__item.is-active) { color: #3b82f6; }
:deep(.el-tabs__active-bar) { height: 3px; border-radius: 3px; background-color: #3b82f6; }

.section-content { padding: 25px 10px; }

.resource-card { display: flex; align-items: center; padding: 22px; border-radius: 18px; background: #f8fafc; border: 1px solid #f1f5f9; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.resource-card:hover { transform: translateY(-5px); background: #fff; box-shadow: 0 12px 30px rgba(0,0,0,0.06); border-color: #e2e8f0; }

.r-icon { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; color: white; margin-right: 20px; flex-shrink: 0; }
.r-info { flex: 1; min-width: 0; }
.r-info h4 { margin: 0 0 6px; font-size: 16px; color: #1e293b; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tagline { margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500; }
.meta-tags { margin-top: 5px; }

.link-card .r-icon { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
.doc-card .r-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.exam-card .r-icon { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }

.arrow-icon { font-size: 18px; color: #cbd5e1; transition: 0.3s; }
.resource-card:hover .arrow-icon { transform: translateX(5px); color: #3b82f6; }

.fade-in-down { animation: fadeInDown 0.6s ease both; }
.fade-in-up { animation: fadeInUp 0.6s ease both; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* 📱 移动端微调 */
@media screen and (max-width: 768px) {
  .member-header-banner { padding: 30px 20px; }
  .title-area h1 { font-size: 28px; }
  .back-btn { top: 15px; right: 15px; padding: 5px 12px; font-size: 12px;}
  :deep(.el-tabs__item) { padding: 0 15px; font-size: 14px; height: 50px; line-height: 50px;}
  .resource-card { padding: 15px; }
  .r-icon { width: 45px; height: 45px; font-size: 22px; margin-right: 15px; }
}
</style>