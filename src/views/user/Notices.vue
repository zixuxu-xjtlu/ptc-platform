<template>
  <div class="notices-container">
    <div class="page-header mb-20 fade-in-down">
      <h2>📢 社团公告中心</h2>
      <p class="subtitle">不错过每一次重要通知与精彩瞬间</p>
    </div>

    <el-card shadow="never" class="main-card fade-in-up">
      <el-tabs v-model="activeTab" class="custom-tabs">
        
        <el-tab-pane name="unread">
          <template #label>
            <span class="tab-label">
              🔔 最新未读 
              <el-badge :value="unreadNotices.length" class="mark" type="danger" :hidden="unreadNotices.length === 0" />
            </span>
          </template>

          <el-empty v-if="unreadNotices.length === 0" description="太棒了，所有公告都已读完！" :image-size="120" />

          <div class="notice-grid">
            <transition-group name="staggered-list">
              <div v-for="notice in unreadNotices" :key="notice._id" class="img-notice-card" @click="handleOpenNotice(notice)">
                <div class="card-cover-box">
                  <img v-if="notice.coverUrl" :src="notice.coverUrl" class="card-cover" />
                  <div v-else class="card-cover-placeholder">PTC<br>Notice</div>
                  <div class="unread-badge">未读</div>
                  <div class="cover-overlay"></div> </div>
                <div class="card-info">
                  <h3 class="card-title" :title="notice.title">{{ notice.title }}</h3>
                  <p class="card-desc">{{ notice.content || '点击查看详情...' }}</p>
                  <div class="card-bottom">
                    <span class="card-time"><el-icon><Clock /></el-icon> {{ formatDate(notice.createTime) }}</span>
                    <el-button link type="primary" size="small" class="read-btn">
                      {{ notice.link ? '查看文章' : '查看详情' }} &rarr;
                    </el-button>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </el-tab-pane>

        <el-tab-pane name="read">
          <template #label>
            <span class="tab-label">📦 历史已读</span>
          </template>

          <el-empty v-if="readNotices.length === 0" description="暂无已读记录" :image-size="120" />

          <div class="notice-grid">
            <transition-group name="staggered-list">
              <div v-for="notice in readNotices" :key="notice._id" class="img-notice-card read-state" @click="handleOpenNotice(notice)">
                <div class="card-cover-box">
                  <img v-if="notice.coverUrl" :src="notice.coverUrl" class="card-cover" />
                  <div v-else class="card-cover-placeholder bg-gray">PTC<br>Notice</div>
                  <div class="cover-overlay"></div>
                </div>
                <div class="card-info">
                  <h3 class="card-title">{{ notice.title }}</h3>
                  <p class="card-desc">{{ notice.content || '点击查看详情...' }}</p>
                  <div class="card-bottom">
                    <span class="card-time"><el-icon><Clock /></el-icon> {{ formatDate(notice.createTime) }}</span>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-card>

    <el-dialog v-model="detailVisible" title="公告详情" width="560px" class="notice-detail-dialog">
      <div v-if="currentNotice" class="detail-content">
        <img v-if="currentNotice.coverUrl" :src="currentNotice.coverUrl" class="detail-cover" />
        <h2 class="detail-title">{{ currentNotice.title }}</h2>
        <div class="detail-meta">
          <span>发布时间：{{ formatDate(currentNotice.createTime) }}</span>
        </div>
        <p class="detail-text">{{ currentNotice.content || '暂无正文内容' }}</p>
        <div v-if="currentNotice.link" class="detail-actions">
          <el-button type="primary" plain @click="openExternalLink(currentNotice.link)">查看外链原文</el-button>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">确认知晓</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const activeTab = ref('unread')
const allNotices = ref([])
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const detailVisible = ref(false)
const currentNotice = ref(null)

const readStorageKey = `readNotices_${currentUser.value._id}`
const readIds = ref(JSON.parse(localStorage.getItem(readStorageKey) || '[]'))

onMounted(async () => {
  try {
    const role = currentUser.value.role
    const res = await db.collection('announcements').where({ targets: role }).limit(100).get()
    allNotices.value = (res.data || []).sort((a,b) => new Date(b.createTime) - new Date(a.createTime))
  } catch (error) {}
})

const unreadNotices = computed(() => allNotices.value.filter(n => !readIds.value.includes(n._id)))
const readNotices = computed(() => allNotices.value.filter(n => readIds.value.includes(n._id)))

const handleOpenNotice = (notice) => {
  if (!readIds.value.includes(notice._id)) {
    readIds.value.push(notice._id)
    localStorage.setItem(readStorageKey, JSON.stringify(readIds.value))
  }
  if (notice.link) {
    window.open(notice.link, '_blank')
  } else {
    currentNotice.value = notice
    detailVisible.value = true
  }
}

const openExternalLink = (link) => {
  if (link) window.open(link, '_blank')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${d.getFullYear()}/${(d.getMonth() + 1)}/${d.getDate()}`
}
</script>

<style scoped>
.fade-in-down { animation: fadeInDown 0.6s ease-out; }
.fade-in-up { animation: fadeInUp 0.6s ease-out; }

@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.notices-container { padding: 10px; max-width: 1100px; margin: 0 auto; }
.mb-20 { margin-bottom: 20px; }
.page-header h2 { margin: 0 0 8px 0; color: #2c3e50; font-size: 26px; font-weight: 600;}
.subtitle { margin: 0; color: #7f8c8d; font-size: 15px; letter-spacing: 1px;}
.main-card { min-height: 700px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.03) !important; border: none; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);}

.tab-label { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: bold; letter-spacing: 1px;}
:deep(.el-tabs__item) { padding: 0 30px; height: 55px; line-height: 55px; color: #95a5a6; transition: all 0.3s;}
:deep(.el-tabs__item.is-active) { color: #409EFF; font-size: 17px; }
:deep(.el-tabs__active-bar) { height: 3px; border-radius: 3px; background-color: #409EFF;}
:deep(.el-tabs__nav-wrap::after) { background-color: #f0f2f5; height: 1px; }

/* 🌟 网格布局与极致动画核心样式 */
.notice-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 24px; 
  padding: 20px 0; 
}

.img-notice-card { 
  background: #ffffff; 
  border: 1px solid #ebeef5; 
  border-radius: 16px; 
  overflow: hidden; 
  cursor: pointer; 
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  position: relative;
}

.img-notice-card:hover { 
  box-shadow: 0 16px 32px rgba(0,0,0,0.12); 
  transform: translateY(-8px); 
  border-color: transparent;
}

.card-cover-box { 
  width: 100%; 
  height: 160px; 
  position: relative; 
  overflow: hidden; 
}

.card-cover { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.img-notice-card:hover .card-cover {
  transform: scale(1.08);
}

/* 增加一层黑色渐变遮罩，悬浮时稍微加深，让动画更高级 */
.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.img-notice-card:hover .cover-overlay {
  opacity: 1;
}

.card-cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.8);
  font-size: 24px;
  font-weight: 900;
  text-align: center;
  letter-spacing: 2px;
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.img-notice-card:hover .card-cover-placeholder {
  transform: scale(1.08);
}

.card-cover-placeholder.bg-gray {
  background: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%);
}

.unread-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f56c6c;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(245,108,108,0.4);
  z-index: 10;
}

.card-info { 
  padding: 20px; 
  display: flex; 
  flex-direction: column; 
  flex: 1;
  background: white; /* 防止遮罩影响下半部 */
  z-index: 2;
}

.card-title { 
  margin: 0 0 10px; 
  font-size: 17px; 
  color: #2c3e50; 
  font-weight: 600; 
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
}
.img-notice-card:hover .card-title {
  color: #409EFF;
}

.card-desc { 
  font-size: 13px; 
  color: #7f8c8d; 
  margin: 0 0 20px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-bottom { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-top: 1px solid #f0f2f5;
  padding-top: 15px;
}

.card-time { 
  font-size: 12px; 
  color: #95a5a6; 
  display: flex; 
  align-items: center; 
  gap: 4px; 
}

.read-btn {
  transition: transform 0.3s ease;
}
.img-notice-card:hover .read-btn {
  transform: translateX(4px);
}

/* 已读状态样式置灰 */
.read-state .card-title, .read-state .card-desc { color: #95a5a6; }
.read-state { filter: grayscale(50%); opacity: 0.85; }
.read-state:hover { filter: grayscale(0%); opacity: 1; } /* 悬浮时恢复色彩，增加互动感 */

/* Vue 列表动画：丝滑进出与位移 */
.staggered-list-move,
.staggered-list-enter-active,
.staggered-list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.staggered-list-enter-from,
.staggered-list-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(30px);
}
.staggered-list-leave-active {
  position: absolute;
}

.detail-content {
  color: #2c3e50;
}

.detail-cover {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 18px;
}

.detail-title {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.4;
}

.detail-meta {
  color: #95a5a6;
  font-size: 13px;
  margin-bottom: 18px;
}

.detail-text {
  color: #475569;
  font-size: 15px;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
}

.detail-actions {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #edf2f7;
}

/* 📱 手机端适配 */
@media (max-width: 768px) {
  .notice-grid { grid-template-columns: 1fr; gap: 16px; }
  .card-cover-box { height: 180px; }
  :deep(.notice-detail-dialog) { width: calc(100vw - 32px); }
}
</style>
