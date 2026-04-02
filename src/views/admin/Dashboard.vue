<template>
  <div class="admin-dashboard">
    
    <div class="page-header mb-24 animate-down">
      <div class="header-left">
        <div class="admin-badge">
          <el-icon><Monitor /></el-icon> SYSTEM ADMIN
        </div>
        <h2>✨ 最高管理决策台</h2>
        <p class="subtitle">欢迎回来，管理员。当前系统运行平稳，所有权限已就绪。</p>
      </div>
      <div class="header-right hide-on-mobile">
        <el-tag type="danger" effect="dark" round class="level-tag">
          <el-icon><Operation /></el-icon> 核心管理层
        </el-tag>
      </div>
    </div>

    <el-row :gutter="15" class="mb-24">
      <el-col :xs="24" :sm="8" v-for="(card, index) in statCards" :key="index" :class="['animate-up-' + (index+1), 'mb-15-mobile']">
        <div class="data-card-premium" :class="card.bgClass">
          <div class="card-glass"></div>
          <div class="inner-content">
            <div class="icon-wrapper">
              <el-icon><component :is="card.icon" /></el-icon>
            </div>
            <div class="data-text">
              <span class="label">{{ card.title }}</span>
              <div class="value">
                {{ card.value }} <small>{{ card.unit }}</small>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="flex-row-stretch">
      <el-col :xs="24" :md="14" class="animate-up-4 flex-col">
        <el-card shadow="never" class="main-card-premium mb-20-mobile">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon class="mr-1"><Histogram /></el-icon>近期活动部署
              </div>
              <el-button type="primary" size="small" round @click="$router.push('/admin/activities')">
                管理中心 <el-icon class="ml-1"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          
          <el-table :data="recentActivities" v-loading="loading" stripe class="admin-table">
            <el-table-column prop="theme" label="活动主题" min-width="150" show-overflow-tooltip />
            <el-table-column label="可见级别" width="100">
              <template #default="scope">
                <el-tag v-for="tag in scope.row.targets" :key="tag" size="small" :type="tag === 'admin' ? 'danger' : 'success'" class="target-badge">
                  {{ tag === 'user' ? '普通' : (tag === 'member' ? '干事' : '管理') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发布状态" width="90" align="center">
              <template #default>
                <span class="status-dot"></span> 已上线
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10" class="animate-up-5 flex-col">
        <el-card shadow="never" class="main-card-premium scroll-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon class="mr-1"><ChatLineSquare /></el-icon>系统快讯推送
              </div>
            </div>
          </template>
          
          <div class="timeline-box">
            <el-empty v-if="recentNotices.length === 0" description="暂无公告" />
            
            <el-timeline v-else style="padding-top:5px;">
              <el-timeline-item
                v-for="(notice, index) in recentNotices"
                :key="notice._id"
                :timestamp="formatDate(notice.createTime)"
                placement="top"
                :type="index === 0 ? 'danger' : 'primary'"
              >
                <div class="notice-preview-card" @click="showNoticeDetail(notice)">
                  <div class="np-header">
                    <h4>{{ notice.title }}</h4>
                    <el-icon><ArrowRight /></el-icon>
                  </div>
                  <p class="np-excerpt">{{ notice.content.substring(0, 30) }}...</p>
                  <div class="np-footer">
                    <span class="scope-text">推送至: {{ notice.targets.join('/') }}</span>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="noticeDialogVisible" title="公告详情预览" width="90%" max-width="500px" center custom-class="admin-dialog">
      <div class="notice-full-view">
        <div class="nv-header">
          <h3>{{ selectedNotice.title }}</h3>
          <div class="nv-meta">
            <span>发布时间: {{ formatDate(selectedNotice.createTime) }}</span>
          </div>
        </div>
        <el-divider />
        <div class="nv-content">
          <p>{{ selectedNotice.content }}</p>
        </div>
        <div class="nv-footer mt-20">
          <el-tag size="small" v-for="t in selectedNotice.targets" :key="t" class="mr-5">{{ t }}</el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { User, Calendar, Bell, ArrowRight, Histogram, ChatLineSquare, Monitor, Operation } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const loading = ref(false)
const stats = ref({ users: 0, activities: 0, notices: 0 })
const recentActivities = ref([])
const recentNotices = ref([])

const noticeDialogVisible = ref(false)
const selectedNotice = ref({ title: '', content: '', targets: [] })

const statCards = computed(() => [
  { title: '注册用户总数', value: stats.value.users, unit: '人', icon: 'User', bgClass: 'bg-indigo' },
  { title: '已发布活动', value: stats.value.activities, unit: '场', icon: 'Calendar', bgClass: 'bg-emerald' },
  { title: '已发布公告', value: stats.value.notices, unit: '条', icon: 'Bell', bgClass: 'bg-rose' }
])

onMounted(async () => {
  loading.value = true
  try {
    const [uCount, aCount, nCount] = await Promise.all([
      db.collection('users').count(),
      db.collection('activities').count(),
      db.collection('announcements').count()
    ])
    stats.value = { users: uCount.total, activities: aCount.total, notices: nCount.total }

    const [actRes, noticeRes] = await Promise.all([
      db.collection('activities').orderBy('createTime', 'desc').limit(6).get(),
      db.collection('announcements').orderBy('createTime', 'desc').limit(5).get()
    ])
    recentActivities.value = actRes.data || []
    recentNotices.value = noticeRes.data || []
  } finally {
    loading.value = false
  }
})

const showNoticeDetail = (notice) => {
  selectedNotice.value = notice
  noticeDialogVisible.value = true
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.admin-dashboard { padding: 20px; max-width: 1400px; margin: 0 auto; background: #f4f7fa; min-height: 100vh; }
.mb-24 { margin-bottom: 24px; }
.mr-1 { margin-right: 6px; }
.ml-1 { margin-left: 6px; }

.flex-row-stretch { display: flex; align-items: stretch; }
.flex-col { display: flex; flex-direction: column; }
.main-card-premium { flex: 1; border-radius: 20px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.03) !important; }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; }
.admin-badge { font-size: 11px; font-weight: 900; color: #3b82f6; letter-spacing: 2px; margin-bottom: 8px; }
.page-header h2 { margin: 0 0 4px; color: #1e293b; font-size: 30px; font-weight: 800; }
.subtitle { margin: 0; color: #64748b; font-size: 15px; }
.level-tag { height: 32px; padding: 0 16px; font-weight: bold; border: none; }

.data-card-premium {
  height: 120px; border-radius: 24px; position: relative; overflow: hidden;
  padding: 24px; display: flex; align-items: center; color: white; transition: 0.3s;
}
.data-card-premium:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
.bg-indigo { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); }
.bg-emerald { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
.bg-rose { background: linear-gradient(135deg, #e11d48 0%, #fb7185 100%); }

.inner-content { display: flex; align-items: center; z-index: 2; width: 100%; }
.icon-wrapper {
  width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px;
  display: flex; align-items: center; justify-content: center; font-size: 28px; margin-right: 20px; flex-shrink: 0;
}
.data-text .label { font-size: 13px; opacity: 0.8; font-weight: 500; }
.data-text .value { font-size: 32px; font-weight: 800; line-height: 1.2; }
.data-text .value small { font-size: 14px; font-weight: 400; opacity: 0.7; }
.card-glass { position: absolute; top: -20%; right: -10%; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%; }

.admin-table { padding: 10px; }
.target-badge { margin-right: 4px; border-radius: 6px; font-weight: bold; margin-bottom: 2px;}
.status-dot { display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 6px; }

.timeline-box { padding: 10px 15px; height: 400px; overflow-y: auto; }
.notice-preview-card {
  padding: 16px; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9;
  cursor: pointer; transition: 0.3s;
}
.notice-preview-card:hover { background: white; border-color: #3b82f6; transform: translateX(5px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.np-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.np-header h4 { margin: 0; font-size: 15px; color: #1e293b; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
.np-excerpt { font-size: 13px; color: #64748b; margin-bottom: 10px; line-height: 1.5; }
.scope-text { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }

.notice-full-view h3 { margin: 0 0 10px; color: #1e293b; font-size: 20px; }
.nv-meta { font-size: 12px; color: #94a3b8; }
.nv-content { line-height: 1.8; color: #475569; font-size: 15px; white-space: pre-wrap; }

.animate-down { animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.animate-up-1 { animation: fadeInUp 0.6s 0.1s both; }
.animate-up-4 { animation: fadeInUp 0.6s 0.4s both; }
.animate-up-5 { animation: fadeInUp 0.6s 0.5s both; }

@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

/* 📱 手机端适配 */
@media screen and (max-width: 768px) {
  .hide-on-mobile { display: none !important; }
  .page-header h2 { font-size: 24px; }
  .mb-15-mobile { margin-bottom: 15px; }
  .mb-20-mobile { margin-bottom: 20px; }
  .card-header { padding-bottom: 10px; }
  .data-text .value { font-size: 26px; }
  .timeline-box { height: 300px; }
}
</style>