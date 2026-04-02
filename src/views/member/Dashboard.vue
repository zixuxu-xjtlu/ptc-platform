<template>
  <div class="member-dashboard">
    
    <el-row :gutter="15" class="mb-24 flex-row">
      <el-col :xs="12" :md="6" v-for="(stat, idx) in statsConfig" :key="idx" class="flex-col stat-col" :class="'animate-up-' + (idx+1)">
        <div class="stat-premium-card" :class="stat.bgClass">
          <div class="stat-icon-box">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">{{ stat.label }}</span>
            <div class="stat-number" :class="getFontSizeClass(stat.value)">
              {{ stat.value }} <small>{{ stat.unit }}</small>
            </div>
          </div>
          <div class="stat-decoration"></div>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="flex-row-stretch">
      <el-col :xs="24" :md="15" class="flex-col">
        <div class="welcome-banner mb-24">
          <div class="banner-text">
            <h2>下午好，{{ currentUser.realName || currentUser.username }} ✨</h2>
            <p>今天是全力以赴的一天，记得检查你的 DDL 安排。</p>
          </div>
          <el-button type="primary" class="banner-btn" @click="go('/member/tasks')">
            工作区 <el-icon class="ml-5"><ArrowRight /></el-icon>
          </el-button>
        </div>

        <el-card shadow="never" class="premium-card main-content-height">
          <template #header>
            <div class="card-header">
              <span class="header-title"><el-icon class="mr-1"><Notification /></el-icon> 社团最新动向</span>
              <el-button link type="primary" @click="go('/member/notices')">全部公告 &rarr;</el-button>
            </div>
          </template>
          
          <el-empty v-if="notices.length === 0" description="暂无新公告" :image-size="60" />
          
          <div class="notice-scroll-box" v-else>
            <div v-for="notice in notices" :key="notice._id" class="modern-notice-item" @click="viewNotice(notice)">
              <div class="notice-main">
                <el-tag size="small" type="danger" effect="dark" class="no-shrink">NEW</el-tag>
                <span class="n-title">{{ notice.title }}</span>
              </div>
              <span class="n-date">{{ formatDate(notice.createTime) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="9" class="flex-col mt-mobile">
        <el-card shadow="never" class="premium-card main-content-height ddl-panel">
          <template #header>
            <div class="card-header">
              <span class="header-title text-danger"><el-icon class="mr-1"><Timer /></el-icon> 紧迫死线 (DDL)</span>
            </div>
          </template>
          
          <el-empty v-if="upcomingDDLs.length === 0" description="暂无任务" :image-size="80" />

          <div class="ddl-scroll-area" v-else>
            <el-timeline style="padding-top:10px;">
              <el-timeline-item 
                v-for="(task, index) in upcomingDDLs" 
                :key="task.uniqueKey"
                :type="task.status === '待确认' ? 'danger' : 'warning'"
                :hollow="index !== 0"
                :timestamp="formatDate(task.ddl)"
                placement="top"
              >
                <div class="modern-ddl-card">
                  <el-tooltip :content="task.theme" placement="top" :show-after="500" :disabled="isMobile">
                    <h4 class="ddl-theme">{{ task.theme }}</h4>
                  </el-tooltip>
                  <div class="ddl-meta">
                    <el-tag :type="task.status === '待确认' ? 'danger' : 'warning'" size="small" round>
                      {{ task.status }}
                    </el-tag>
                    <span class="ddl-time-hint">{{ task.status === '待确认' ? '需尽快确认' : '请注意时间' }}</span>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog 
      v-model="noticeDialogVisible" 
      title="📢 社团系统快讯" 
      width="90%"
      max-width="500px" 
      custom-class="premium-dialog"
      append-to-body
    >
      <div class="notice-reader-box">
        <h3 class="nr-title">{{ currentNotice.title }}</h3>
        <div class="nr-meta">发布于：{{ formatDate(currentNotice.createTime) }}</div>
        <el-divider border-style="dashed" />
        <div class="nr-content">{{ currentNotice.content || '（暂无详细内容说明）' }}</div>
      </div>
      <template #footer>
        <el-button type="primary" round @click="noticeDialogVisible = false" style="padding: 0 30px;">我已阅知</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Timer, BellFilled, List, StarFilled, Trophy, ArrowRight, Notification } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const router = useRouter()
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const totalPoints = ref(currentUser.value.points || 0)
const workPoints = ref(currentUser.value.workPoints || 0)
const pendingConfirm = ref(0)
const pendingComplete = ref(0)
const upcomingDDLs = ref([])
const notices = ref([])

const noticeDialogVisible = ref(false)
const currentNotice = ref({})

const isMobile = ref(window.innerWidth <= 768)

const statsConfig = computed(() => [
  { label: '待确认工作', value: pendingConfirm.value, unit: '项', icon: 'BellFilled', bgClass: 'stat-orange' },
  { label: '待完成工作', value: pendingComplete.value, unit: '项', icon: 'List', bgClass: 'stat-blue' },
  { label: '工作积分', value: workPoints.value, unit: '分', icon: 'StarFilled', bgClass: 'stat-purple' },
  { label: '当前总积分', value: totalPoints.value, unit: '分', icon: 'Trophy', bgClass: 'stat-green' }
])

const getFontSizeClass = (val) => {
  const len = String(val).length
  if (len <= 3) return 'font-lg'
  if (len === 4) return 'font-md'
  if (len === 5) return 'font-sm'
  return 'font-xs'
}

onMounted(async () => {
  currentUser.value = JSON.parse(localStorage.getItem('user') || '{}')
  totalPoints.value = currentUser.value.points || 0
  workPoints.value = currentUser.value.workPoints || 0
  
  window.addEventListener('resize', () => isMobile.value = window.innerWidth <= 768)

  await Promise.all([fetchDashboardTasks(), fetchNotices()])
})

const fetchNotices = async () => {
  try {
    const role = currentUser.value.role
    const res = await db.collection('announcements').where({ targets: role }).limit(6).get()
    notices.value = (res.data || []).sort((a,b) => new Date(b.createTime) - new Date(a.createTime))
  } catch (error) {}
}

// 🌟 核心修复：适配全新的 Pipeline 瀑布流任务结构
const fetchDashboardTasks = async () => {
  try {
    const res = await db.collection('published_works').get()
    const allWorks = res.data || []
    let confirmCount = 0; 
    let completeCount = 0; 
    const ddlList = []
    
    allWorks.forEach(work => {
      if (!work.stages) return // 兼容过滤旧数据
      
      // 遍历阶段 -> 任务 -> 人员
      work.stages.forEach(stage => {
        stage.tasks.forEach(task => {
          if (!task.assignees) return
          
          const myAssigneeInfo = task.assignees.find(a => a.userId === currentUser.value._id)
          if (myAssigneeInfo) {
            const currentStatus = myAssigneeInfo.status || 'pending'
            
            if (currentStatus === 'pending') {
              confirmCount++
              ddlList.push({ uniqueKey: `${work._id}_${task.id}`, theme: work.activityName, status: '待确认', ddl: stage.ddl })
            }
            if (currentStatus === 'doing') {
              completeCount++
              ddlList.push({ uniqueKey: `${work._id}_${task.id}`, theme: work.activityName, status: '进行中', ddl: stage.ddl })
            }
          }
        })
      })
    })
    
    pendingConfirm.value = confirmCount
    pendingComplete.value = completeCount
    // 将死线按时间从近到远排序
    upcomingDDLs.value = ddlList.sort((a, b) => new Date(a.ddl) - new Date(b.ddl))
  } catch (error) {}
}

const viewNotice = (notice) => { currentNotice.value = notice; noticeDialogVisible.value = true }
const go = (path) => router.push(path)
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.flex-row { display: flex; flex-wrap: wrap; }
.flex-col { display: flex; flex-direction: column; }
.flex-row-stretch { display: flex; align-items: stretch; }

.member-dashboard { padding: 15px; max-width: 1400px; margin: 0 auto; background: #f8fafc; overflow-x: hidden; }
.mb-24 { margin-bottom: 24px; }
.mr-1 { margin-right: 6px; }
.ml-5 { margin-left: 5px; }

.stat-premium-card { flex: 1; position: relative; padding: 20px 18px; border-radius: 20px; color: white; display: flex; align-items: center; gap: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.06); min-height: 110px; }
.stat-icon-box { width: 48px; height: 48px; background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(4px); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.stat-info { flex: 1; min-width: 0; padding-left: 4px; display: flex; flex-direction: column; justify-content: center; }
.stat-label { font-size: 13px; opacity: 0.9; font-weight: 600; margin-bottom: 4px; white-space: nowrap; }
.stat-number { font-weight: 800; line-height: 1; display: flex; align-items: baseline; transition: all 0.3s; }
.font-lg { font-size: 32px; } .font-md { font-size: 26px; } .font-sm { font-size: 20px; } .font-xs { font-size: 16px; }
.stat-number small { font-size: 13px; font-weight: normal; margin-left: 4px; opacity: 0.8; flex-shrink: 0;}

.stat-orange { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
.stat-blue { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); }
.stat-purple { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
.stat-green { background: linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%); }
.stat-decoration { position: absolute; right: -15px; top: -15px; width: 70px; height: 70px; background: rgba(255,255,255,0.1); border-radius: 50%; }

.main-content-height { height: 100%; display: flex; flex-direction: column; }
.welcome-banner { background: white; padding: 24px 30px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #f1f5f9; }
.welcome-banner h2 { margin: 0 0 6px; font-size: 22px; color: #1e293b; }
.welcome-banner p { margin: 0; color: #64748b; font-size: 14px; }
.premium-card { border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 2px 10px rgba(0,0,0,0.02) !important; }

.modern-notice-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 12px; margin-bottom: 10px; background: #f8fafc; cursor: pointer; transition: 0.3s;}
.modern-notice-item:hover { transform: translateX(5px); background: #f1f5f9; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border-left: 3px solid #f56c6c;}
.notice-main { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.n-title { font-weight: 600; color: #334155; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.no-shrink { flex-shrink: 0; }
.n-date { font-size: 12px; color: #94a3b8; margin-left: 10px; flex-shrink: 0; }

.ddl-scroll-area { flex: 1; height: 460px; overflow-y: auto; padding-right: 8px; }
.ddl-scroll-area::-webkit-scrollbar { width: 4px; }
.ddl-scroll-area::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.modern-ddl-card { background: #f8fafc; padding: 15px; border-radius: 14px; border: 1px solid #f1f5f9; transition: 0.3s;}
.modern-ddl-card:hover { border-color: #ef4444; background: #fffcfc; }
.ddl-theme { margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ddl-meta { display: flex; justify-content: space-between; align-items: center; }
.ddl-time-hint { font-size: 11px; color: #94a3b8; }

.premium-dialog :deep(.el-dialog__header) { border-bottom: 1px solid #f1f5f9; margin-right: 0; padding-bottom: 15px;}
.premium-dialog :deep(.el-dialog__title) { font-weight: 800; color: #1e293b; }
.notice-reader-box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; }
.nr-title { margin: 0 0 10px; color: #1e293b; font-size: 20px; font-weight: 800; }
.nr-meta { font-size: 13px; color: #94a3b8; }
.nr-content { line-height: 1.8; color: #475569; font-size: 15px; white-space: pre-wrap; }

[class^="animate-up-"] { animation: fadeInUp 0.6s ease both; }
.animate-up-1 { animation-delay: 0.1s; } .animate-up-2 { animation-delay: 0.15s; } .animate-up-3 { animation-delay: 0.2s; } .animate-up-4 { animation-delay: 0.25s; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* 📱 手机端适配 */
@media screen and (max-width: 768px) {
  .stat-col { margin-bottom: 15px; } 
  .stat-premium-card { min-height: 90px; padding: 15px; }
  .stat-icon-box { width: 40px; height: 40px; font-size: 18px; }
  .font-lg { font-size: 24px; } .font-md { font-size: 20px; }
  .welcome-banner { flex-direction: column; text-align: center; gap: 15px; }
  .mt-mobile { margin-top: 20px; }
  .ddl-scroll-area { height: 300px; }
}
</style>