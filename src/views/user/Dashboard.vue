<template>
  <div class="dashboard-wrapper">
    <div v-if="showOverlay" class="slogan-overlay" translate="no">
      <div class="slogan-container">
        
        <div class="line p-line">
          <div class="pre-box"><span class="pre">Your&nbsp;</span></div>
          <div class="init-box"><span class="init">P</span></div>
          <div class="post-box">
            <span class="mid">eer</span>
            <span class="suf">eers,</span>
          </div>
        </div>
        
        <div class="line t-line">
          <div class="pre-box"><span class="pre">Your&nbsp;</span></div>
          <div class="init-box"><span class="init">T</span></div>
          <div class="post-box">
            <span class="mid">utoring</span>
            <span class="suf">houghts,</span>
          </div>
        </div>
        
        <div class="line c-line">
          <div class="pre-box"><span class="pre">Your&nbsp;</span></div>
          <div class="init-box"><span class="init">C</span></div>
          <div class="post-box">
            <span class="mid">lub</span>
            <span class="suf">reativity.</span>
          </div>
        </div>

      </div>
    </div>

    <div class="dashboard-container">
      <el-row :gutter="20" class="mb-20">
        <el-col :xs="24" :md="8" class="animate-up-1">
          <el-card shadow="hover" class="welcome-card premium-card">
            <div class="user-info-wrapper">
              <div class="user-info">
                <el-avatar :size="64" :src="currentUser.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" class="avatar-glow" />
                <div class="info-text">
                  <h3>{{ timeGreeting }}，{{ currentUser.realName || currentUser.username || '同学' }}</h3>
                  <p>当前积分：<span class="points">{{ currentPoints }}</span></p>
                </div>
              </div>
              
              <div class="checkin-action">
                <el-button 
                  type="primary" 
                  round 
                  class="checkin-btn"
                  :disabled="hasCheckedInToday" 
                  @click="handleCheckIn"
                  :loading="loading"
                >
                  {{ hasCheckedInToday ? '已签到' : '📅 签到' }}
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :md="16" class="animate-up-2 mt-mobile">
          <el-card shadow="hover" class="notice-card premium-card">
            <template #header>
              <div class="card-header">
                <div class="header-title"><el-icon class="mr-1"><Notification /></el-icon> 📢 最新公告</div>
                <el-button link type="primary" @click="go('/user/notices')">查看全部 &rarr;</el-button>
              </div>
            </template>
            
            <el-empty v-if="notices.length === 0" description="暂无公告" :image-size="60" />
            
            <div class="notice-list">
              <div v-for="notice in notices" :key="notice._id" class="notice-item-with-img" @click="handleNoticeClick(notice)">
                <div class="notice-thumb-wrapper">
                  <img v-if="notice.coverUrl" :src="notice.coverUrl" class="notice-thumb" />
                  <div v-else class="notice-thumb-placeholder"><el-icon><Picture /></el-icon></div>
                </div>
                <div class="notice-content-right">
                  <div class="notice-title-line">
                    <el-tag size="small" type="danger" effect="dark" class="mr-1">最新</el-tag>
                    <span class="notice-title" :title="notice.title">{{ notice.title }}</span>
                  </div>
                  <span class="notice-date">{{ formatDate(notice.createTime) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :xs="24" :md="16" class="animate-up-3">
          <el-card shadow="hover" class="mb-20 premium-card">
            <template #header>
              <div class="card-header">
                <div class="header-title"><el-icon class="mr-1"><Calendar /></el-icon> 🔥 热门活动</div>
                <el-button link type="primary" @click="go('/user/activities')">去报名区 &rarr;</el-button>
              </div>
            </template>
            
            <el-empty v-if="hotActivities.length === 0" description="最近没有活动哦" :image-size="60" />
            
            <el-row :gutter="15">
              <el-col :xs="12" :sm="8" v-for="(item, index) in hotActivities" :key="item._id" class="mb-15">
                <div class="activity-card" @click="go('/user/activities')">
                  <div class="img-box">
                    <div class="mock-img" :style="{background: getGradient(index)}">
                      {{ item.theme ? item.theme.substring(0,4) : '活动' }}
                    </div>
                  </div>
                  <div class="act-info">
                    <h4>{{ item.theme }}</h4>
                    <p class="time"><el-icon><Clock /></el-icon> {{ formatDate(item.time) }}</p>
                    <el-button type="primary" size="small" round class="join-btn">查看</el-button>
                  </div>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <el-card shadow="hover" class="premium-card mb-20-mobile">
            <template #header>
              <div class="card-header">
                <div class="header-title"><el-icon class="mr-1"><Present /></el-icon> 🎁 积分商城</div>
                <el-button link type="primary" @click="go('/user/shop')">进入商城 &rarr;</el-button>
              </div>
            </template>
            
            <el-empty v-if="goods.length === 0" description="补货中" :image-size="60" />
            
            <el-row :gutter="15">
               <el-col :xs="12" :sm="6" v-for="good in goods" :key="good._id" class="mb-15">
                 <div class="goods-item" @click="go('/user/shop')">
                   <div class="goods-img-wrapper">
                     <img :src="good.image || defaultImg" class="goods-img" />
                   </div>
                   <p class="goods-name">{{ good.name }}</p>
                   <p class="goods-price"><el-icon><Coin /></el-icon> {{ good.cost }}</p>
                 </div>
               </el-col>
            </el-row>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="8" class="animate-up-4">
          <el-card shadow="hover" class="h-100 premium-card ddl-panel">
            <template #header>
              <div class="card-header">
                <div class="header-title"><el-icon class="mr-1"><Guide /></el-icon> 📅 我的日程</div>
                <el-button link type="primary" @click="go('/user/my-activities')">全部行程 &rarr;</el-button>
              </div>
            </template>
            
            <el-empty v-if="myActivities.length === 0" description="无安排" :image-size="80" />

            <el-timeline style="padding-top: 10px;" v-else>
              <el-timeline-item
                v-for="(activity, index) in myActivities"
                :key="activity._id"
                :type="index === 0 ? 'success' : 'primary'"
                :hollow="index !== 0"
                :timestamp="formatDate(activity.eventTime)"
                placement="top"
              >
                <el-card class="mini-card" shadow="hover">
                  <h4>{{ activity.title || activity.theme }}</h4>
                  <el-tag size="small" type="success" effect="plain">即将开始</el-tag>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            
            <div v-if="hasMoreActivities" class="more-hint" @click="go('/user/my-activities')">点击查看全部...</div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Notification, Calendar, Clock, Present, Coin, Guide, Picture } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const router = useRouter()
const defaultImg = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'
const loading = ref(false)
const hasCheckedInToday = ref(false)
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const currentPoints = ref(currentUser.value.points || 0)

const showOverlay = ref(false)

const timeGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 5) return '夜深了'
  if (hour < 9) return '早安'
  if (hour < 11) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 23) return '晚上好'
  return '早点休息'
})

const notices = ref([])
const hotActivities = ref([])
const goods = ref([])
const myActivities = ref([])
const hasMoreActivities = ref(false)

onMounted(async () => {
  if (!sessionStorage.getItem('sloganPlayed')) {
    showOverlay.value = true
    sessionStorage.setItem('sloganPlayed', 'true')
    setTimeout(() => {
      showOverlay.value = false
    }, 11000)
  }

  const userStr = localStorage.getItem('user')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
    currentPoints.value = currentUser.value.points || 0
    checkIfSignedToday()
    fetchDashboardData()
  }
})

const checkIfSignedToday = () => {
  const lastTime = currentUser.value.lastCheckIn
  const today = new Date().toDateString()
  const lastDate = lastTime ? new Date(lastTime).toDateString() : ''
  hasCheckedInToday.value = (lastDate === today)
}

const handleCheckIn = async () => {
  if (hasCheckedInToday.value) return
  loading.value = true
  try {
    const _ = db.command
    const now = new Date().getTime()
    await db.collection('users').doc(currentUser.value._id).update({ points: _.inc(10), lastCheckIn: now })
    await db.collection('points_logs').add({ targetUser: currentUser.value.username, amount: 10, adminName: '系统自动', reason: '每日签到', createTime: now })

    currentPoints.value += 10
    hasCheckedInToday.value = true
    currentUser.value.points = currentPoints.value
    currentUser.value.lastCheckIn = now
    localStorage.setItem('user', JSON.stringify(currentUser.value))
    ElMessage({ message: '🎉 签到成功！积分 +10', type: 'success' })
  } catch (error) { ElMessage.error("签到失败") } finally { loading.value = false }
}

const fetchDashboardData = async () => {
  const role = currentUser.value.role
  try {
    const noticeRes = await db.collection('announcements').where({ targets: role }).limit(4).get()
    notices.value = (noticeRes.data || []).sort((a,b) => new Date(b.createTime) - new Date(a.createTime))

    const actRes = await db.collection('activities').where({ targets: role }).limit(3).get()
    hotActivities.value = (actRes.data || []).sort((a,b) => new Date(b.createTime) - new Date(a.createTime))

    const shopRes = await db.collection('shop').limit(4).get()
    goods.value = shopRes.data || []

    const myActRes = await db.collection('activity_registrations').where({ userId: currentUser.value._id, status: 'registered' }).get()
    const nowTime = new Date().getTime()
    const validActivities = (myActRes.data || []).filter(act => new Date(act.eventTime).getTime() > nowTime)
    validActivities.sort((a,b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime())
    
    if (validActivities.length > 4) {
      myActivities.value = validActivities.slice(0, 4)
      hasMoreActivities.value = true
    } else {
      myActivities.value = validActivities
    }
  } catch (error) {}
}

const go = (path) => router.push(path)

// 新增：处理公告点击逻辑
const handleNoticeClick = (notice) => {
  if (notice.link) {
    window.open(notice.link, '_blank')
  } else {
    go('/user/notices')
  }
}

const formatDate = (date) => date ? `${new Date(date).getMonth() + 1}-${new Date(date).getDate()} ${new Date(date).getHours()}:${new Date(date).getMinutes().toString().padStart(2, '0')}` : ''
const getGradient = (index) => ['linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)', 'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)'][index % 3]
</script>

<style scoped>
.slogan-overlay {
  position: fixed;
  inset: 0;
  background-color: #ffffff;
  z-index: 9999;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  animation: fadeOutOverlay 1.5s ease forwards 9.5s;
}

.slogan-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.line {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100vw;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: baseline;
}

.pre-box { justify-self: end; }
.pre {
  font-size: 30px;
  color: #1a365d;
  display: inline-block;
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  white-space: nowrap;
}

.init-box { justify-self: center; }
.init {
  font-size: 72px;
  font-weight: 900;
  color: #1a365d;
  animation: turnRed 1.5s forwards 1.5s;
}

.post-box { justify-self: start; display: flex; align-items: baseline; }
.mid {
  font-size: 72px;
  font-weight: 900;
  color: #1a365d;
  display: inline-block;
  overflow: hidden;
  transform-origin: left;
  white-space: nowrap; 
  animation: shrinkMid 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards 1.5s;
}

.suf {
  font-size: 30px;
  color: #1a365d;
  display: inline-block;
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  white-space: nowrap;
}


.p-line { animation: moveP 10s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes moveP {
  0%, 15% { transform: translate(-240px, -50%); } 
  30%, 40% { transform: translate(-80px, -50%); }
  55%, 100% { transform: translate(0px, calc(-50% - 95px)); }
}

.t-line { transform: translate(0, -50%); }

.c-line { animation: moveC 10s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes moveC {
  0%, 15% { transform: translate(400px, -50%); } 
  30%, 40% { transform: translate(80px, -50%); }
  55%, 100% { transform: translate(0px, calc(-50% + 95px)); }
}

@keyframes shrinkMid {
  0% { max-width: 600px; opacity: 1; padding-right: 15px;}
  100% { max-width: 0; opacity: 0; padding-right: 0;}
}

@keyframes turnRed {
  100% { color: #f56c6c; }
}

.p-line .pre, .p-line .suf { animation: expandText 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 5.5s; }
.t-line .pre, .t-line .suf { animation: expandText 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 6.2s; }
.c-line .pre, .c-line .suf { animation: expandText 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 6.9s; }

@keyframes expandText {
  0% { max-width: 0; opacity: 0; }
  100% { max-width: 600px; opacity: 1; }
}

@keyframes fadeOutOverlay {
  100% { opacity: 0; visibility: hidden; }
}

/* ================= 🌟 Dashboard 原有 CSS ================= */
.dashboard-container { padding: 10px; max-width: 1400px; margin: 0 auto; overflow-x: hidden; }
.mb-20 { margin-bottom: 20px; }
.mb-15 { margin-bottom: 15px; }
.mr-1 { margin-right: 6px; }
.premium-card { border: none; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.03) !important; transition: all 0.4s; }
.premium-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.08) !important; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-title { display: flex; align-items: center; font-weight: 600; color: #2c3e50; font-size: 16px;}

.welcome-card { background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); }
.user-info-wrapper { display: flex; justify-content: space-between; align-items: center; padding: 10px 5px;}
.user-info { display: flex; align-items: center; gap: 15px; }
.avatar-glow { border: 2px solid #fff; box-shadow: 0 4px 12px rgba(64,158,255,0.3); flex-shrink: 0; }
.info-text h3 { margin: 0 0 5px; font-size: 20px; color: #2c3e50; font-weight: 600;}
.info-text p { margin: 0; font-size: 14px; color: #7f8c8d; }
.points { color: #f56c6c; font-weight: bold; font-size: 22px; margin-left: 5px; }
.checkin-btn { font-weight: bold; padding: 10px 20px; box-shadow: 0 4px 12px rgba(64,158,255,0.2);}

/* 🌟 新版带图公告列表样式 */
.notice-list { display: flex; flex-direction: column; gap: 12px; }
.notice-item-with-img { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  cursor: pointer; 
  padding: 10px; 
  border-radius: 12px; 
  background-color: transparent;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 
  border: 1px solid transparent;
}
.notice-item-with-img:hover { 
  background-color: #ffffff; 
  transform: translateX(6px) translateY(-2px); 
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);
  border-color: #ebeef5;
}
.notice-thumb-wrapper { 
  width: 60px; 
  height: 60px; 
  border-radius: 8px; 
  overflow: hidden; 
  flex-shrink: 0; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
}
.notice-thumb { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  transition: transform 0.5s ease;
}
.notice-item-with-img:hover .notice-thumb { 
  transform: scale(1.15); 
}
.notice-thumb-placeholder { 
  width: 100%; 
  height: 100%; 
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: white; 
  font-size: 20px;
}
.notice-content-right { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  justify-content: space-between; 
  height: 50px; 
  overflow: hidden; 
}
.notice-title-line { 
  display: flex; 
  align-items: center; 
}
.notice-title { 
  flex: 1; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
  color: #34495e; 
  font-weight: 600; 
  font-size: 14px;
  transition: color 0.3s;
}
.notice-item-with-img:hover .notice-title {
  color: #409EFF;
}
.notice-date { color: #95a5a6; font-size: 12px; flex-shrink: 0;}

.activity-card { cursor: pointer; border: 1px solid #ebeef5; border-radius: 12px; overflow: hidden; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); background: #fff;}
.activity-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); border-color: transparent;}
.mock-img { height: 100px; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; letter-spacing: 2px; }
.act-info { padding: 15px; text-align: center; }
.act-info h4 { margin: 0 0 8px; font-size: 15px; color: #2c3e50; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600;}
.act-info .time { font-size: 12px; color: #7f8c8d; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 4px;}
.join-btn { width: 100%; transition: all 0.3s; }

.goods-item { text-align: center; cursor: pointer; padding: 12px; border-radius: 12px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); border: 1px solid transparent;}
.goods-item:hover { background-color: #fdfdfd; border-color: #ebeef5; transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0,0,0,0.06);}
.goods-img-wrapper { height: 80px; width: 80px; margin: 0 auto 10px; border-radius: 10px; overflow: hidden; background: #f0f2f5;}
.goods-img { height: 100%; width: 100%; object-fit: cover; transition: transform 0.4s ease; }
.goods-item:hover .goods-img { transform: scale(1.1); }
.goods-name { font-size: 13px; margin: 0 0 5px; color: #34495e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
.goods-price { font-size: 13px; color: #f56c6c; font-weight: bold; margin: 0; display: flex; align-items: center; justify-content: center; gap: 2px;}

.h-100 { height: 100%; }
.mini-card { margin-bottom: 0 !important; border-radius: 8px; border: 1px solid #ebeef5; box-shadow: none !important;}
.mini-card h4 { margin: 0 0 8px; font-size: 14px; color: #2c3e50; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.more-hint { text-align: center; font-size: 13px; color: #95a5a6; margin-top: 15px; cursor: pointer; padding-top: 10px; border-top: 1px dashed #ebeef5;}

.animate-up-1 { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.1s; }
.animate-up-2 { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.2s; }
.animate-up-3 { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.3s; }
.animate-up-4 { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.4s; }
@keyframes fadeInUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }

/* 📱 手机端适配 */
@media (max-width: 768px) {
  .init, .mid { font-size: 42px; }
  .pre, .suf { font-size: 18px; }
  
  @keyframes moveP {
    0%, 15% { transform: translate(-110px, -50%); } 
    30%, 40% { transform: translate(-45px, -50%); }
    55%, 100% { transform: translate(0px, calc(-50% - 55px)); }
  }
  @keyframes moveC {
    0%, 15% { transform: translate(200px, -50%); } 
    30%, 40% { transform: translate(45px, -50%); }
    55%, 100% { transform: translate(0px, calc(-50% + 55px)); }
  }

  .user-info-wrapper { flex-direction: column; gap: 15px; text-align: center; }
  .user-info { flex-direction: column; gap: 10px; }
  .mt-mobile { margin-top: 20px; }
  .mb-20-mobile { margin-bottom: 20px; }
  .ddl-panel { min-height: 300px; }
}
</style>