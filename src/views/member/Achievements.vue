<template>
  <div class="achievements-container">
    <div class="page-header mb-24 fade-in-down">
      <div class="header-left">
        <h2>🏆 个人荣誉陈列室</h2>
        <p class="subtitle">探索未知，完成挑战。在这里见证你在 PTC 平台的每一座里程碑。</p>
      </div>
      <div class="header-right">
        <div class="stats-badge">
          <span class="stats-label">已解锁</span>
          <span class="stats-value text-blue">{{ unlockedCount }} / {{ totalCount }}</span>
        </div>
        <div class="stats-badge">
          <span class="stats-label">成就积分</span>
          <span class="stats-value text-orange">+{{ earnedPoints }}</span>
        </div>
      </div>
    </div>

    <div class="progress-section fade-in-down mb-24">
      <div class="flex justify-between text-sm font-bold text-gray-500 mb-2">
        <span>全域收集进度</span>
        <span>{{ progressPercentage }}%</span>
      </div>
      <el-progress 
        :percentage="progressPercentage" 
        :stroke-width="12" 
        :color="customColors" 
        :show-text="false" 
      />
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-400">
      <el-icon class="is-loading text-3xl mb-2"><Loading /></el-icon>
      <p>正在擦拭陈列柜...</p>
    </div>

    <el-empty v-else-if="displayList.length === 0" description="上帝还没创造任何成就法则哦" />

    <div v-else class="grid-container fade-in-up">
      <div 
        v-for="ach in displayList" 
        :key="ach._id" 
        class="achivement-card"
        :class="{ 
          'is-unlocked': ach.unlocked, 
          'is-locked': !ach.unlocked,
          'is-hidden': !ach.unlocked && ach.isHidden 
        }"
      >
        <div class="card-glow" v-if="ach.unlocked"></div>
        
        <div class="ach-icon-box">
          <span class="ach-emoji" v-if="ach.unlocked || !ach.isHidden">{{ ach.icon || '🏆' }}</span>
          <span class="ach-emoji mystery" v-else>🔒</span>
        </div>
        
        <div class="ach-info">
          <h3 class="ach-title">
            {{ (ach.unlocked || !ach.isHidden) ? ach.title : '？？？' }}
          </h3>
          <p class="ach-desc">
            {{ ach.unlocked ? ach.description : (ach.isHidden ? ach.hiddenDesc : ach.description) }}
          </p>
        </div>

        <div class="ach-meta">
          <div class="reward-pill" :class="ach.unlocked ? 'bg-orange-light text-orange' : 'bg-gray-light text-gray'">
            +{{ ach.rewardPoints }} 积分
          </div>
          <div class="unlock-time" v-if="ach.unlocked">
            解锁于 {{ formatDate(ach.unlockTime) }}
          </div>
          <div class="unlock-time locked-hint" v-else>
            尚未达成
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { db } from '../../cloudbase'

const loading = ref(true)
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const allRules = ref([])
const myRecords = ref([])
const displayList = ref([])

const unlockedCount = ref(0)
const totalCount = ref(0)
const earnedPoints = ref(0)

const customColors = [
  { color: '#cbd5e1', percentage: 20 },
  { color: '#3b82f6', percentage: 60 },
  { color: '#f59e0b', percentage: 100 }
]

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((unlockedCount.value / totalCount.value) * 100)
})

onMounted(async () => {
  loading.value = true
  try {
    // 1. 获取上帝模式里配的所有成就法则
    const ruleRes = await db.collection('achievements').get()
    const allRawRules = ruleRes.data || []
    
    // 🌟 核心智能过滤：只显示属于当前登录人身份（role）的成就，以及全员通用（all）的成就
    allRules.value = allRawRules.filter(rule => 
      !rule.targetRole || 
      rule.targetRole === 'all' || 
      rule.targetRole === currentUser.value.role
    )
    
    totalCount.value = allRules.value.length

    // 2. 获取当前用户解锁的成就记录
    const recordRes = await db.collection('user_achievements').where({ userId: currentUser.value._id }).get()
    myRecords.value = recordRes.data || []

    // 3. 组合数据
    let ePoints = 0
    let uCount = 0
    
    displayList.value = allRules.value.map(rule => {
      const record = myRecords.value.find(r => r.achievementId === rule._id)
      if (record) {
        uCount++
        ePoints += (rule.rewardPoints || 0)
        return { ...rule, unlocked: true, unlockTime: record.createTime }
      } else {
        return { ...rule, unlocked: false, unlockTime: null }
      }
    })

    // 排序：已解锁的排在最前面
    displayList.value.sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1
      if (!a.unlocked && b.unlocked) return 1
      return 0
    })

    unlockedCount.value = uCount
    earnedPoints.value = ePoints

  } catch (error) {
    ElMessage.error('获取成就数据失败')
  } finally {
    loading.value = false
  }
})

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.achievements-container { padding: 20px; max-width: 1400px; margin: 0 auto; min-height: 85vh; }
.fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* 头部样式 */
.page-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px; }
.header-left h2 { margin: 0 0 8px 0; color: #1e293b; font-size: 32px; font-weight: 900; letter-spacing: 1px;}
.subtitle { margin: 0; color: #64748b; font-size: 15px; }
.header-right { display: flex; gap: 16px; }
.stats-badge { background: #fff; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02);}
.stats-label { font-size: 12px; color: #94a3b8; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;}
.stats-value { font-size: 24px; font-weight: 900; line-height: 1; }
.text-blue { color: #3b82f6; } .text-orange { color: #f59e0b; }

.progress-section { background: white; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
.flex { display: flex; } .justify-between { justify-content: space-between; }

/* 网格布局 */
.grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

/* 🌟 核心卡片样式 */
.achivement-card { 
  position: relative; background: #fff; border-radius: 24px; padding: 24px; 
  display: flex; flex-direction: column; overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 2px solid transparent;
}

/* 状态：已解锁 */
.is-unlocked { 
  border-color: #fde68a; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.1); 
  transform: translateY(-2px);
}
.is-unlocked:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 40px rgba(245, 158, 11, 0.2); border-color: #fbbf24;}
.card-glow { 
  position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle, rgba(253,230,138,0.4) 0%, rgba(255,255,255,0) 60%);
  pointer-events: none; z-index: 0;
}

/* 状态：未解锁（公开） */
.is-locked { background: #f8fafc; border-color: #e2e8f0; filter: grayscale(80%); opacity: 0.8; }
.is-locked:hover { filter: grayscale(20%); opacity: 1; border-color: #cbd5e1; }

/* 状态：未解锁（隐藏彩蛋） */
.is-hidden { background: #0f172a; border-color: #334155; filter: none; opacity: 1; }
.is-hidden .ach-title { color: #e2e8f0; letter-spacing: 4px; }
.is-hidden .ach-desc { color: #94a3b8; font-style: italic; }
.is-hidden:hover { box-shadow: 0 10px 30px rgba(0,0,0,0.3); border-color: #475569; }

/* 卡片内部元素 */
.ach-icon-box { 
  width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center;
  background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 16px; z-index: 1;
}
.is-locked .ach-icon-box { background: #e2e8f0; box-shadow: none; }
.is-hidden .ach-icon-box { background: #1e293b; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
.ach-emoji { font-size: 32px; }
.mystery { filter: drop-shadow(0 0 8px rgba(168,85,247,0.8)); opacity: 0.8;}

.ach-info { flex: 1; z-index: 1; margin-bottom: 20px;}
.ach-title { font-size: 20px; font-weight: 900; color: #1e293b; margin: 0 0 8px 0; }
.ach-desc { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }

.ach-meta { display: flex; justify-content: space-between; align-items: flex-end; z-index: 1; border-top: 1px dashed #e2e8f0; padding-top: 16px;}
.is-hidden .ach-meta { border-color: #334155; }

.reward-pill { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 900; }
.bg-orange-light { background: #fffbeb; } .text-orange { color: #f59e0b; }
.bg-gray-light { background: #f1f5f9; } .text-gray { color: #94a3b8; }
.is-hidden .bg-gray-light { background: #1e293b; color: #64748b; }

.unlock-time { font-size: 12px; color: #94a3b8; font-weight: bold; }
.locked-hint { opacity: 0.6; }
</style>