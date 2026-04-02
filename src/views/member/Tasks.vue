<template>
  <div class="member-tasks">
    <div class="header-area mb-24 animate-down">
      <div class="title-section">
        <h2>🚀 任务执行工作区</h2>
        <p class="subtitle">确认并推进属于你的社团工作，积累荣誉积分</p>
      </div>
    </div>

    <el-tabs type="border-card" v-model="activeTab" class="task-tabs premium-tabs animate-up">
      
      <el-tab-pane name="pending">
        <template #label>
          <span class="tab-label">
            🔔 待确认接收 
            <el-badge :value="pendingConfirmList.length" :hidden="pendingConfirmList.length === 0" type="danger" />
          </span>
        </template>
        <el-empty v-if="pendingConfirmList.length === 0" description="暂无新任务派发给你" :image-size="100" />
        
        <el-row :gutter="20">
          <transition-group name="list">
            <el-col :xs="24" :sm="12" :md="8" v-for="task in pendingConfirmList" :key="task.uniqueKey" class="mb-20 grid-item">
              <div class="modern-task-card danger-line">
                <div class="task-header">
                  <el-tag type="danger" effect="dark" size="small" round>NEW</el-tag>
                  <span class="deadline">截止: {{ formatDate(task.ddl) }}</span>
                </div>
                <h3 class="theme">{{ task.activityName }}</h3>
                <div class="task-detail">
                  <div class="dept-tag">{{ task.dept }}</div>
                  <p class="content-text">{{ task.content }}</p>
                </div>
                <el-button type="danger" class="confirm-btn w-100" @click="handleConfirm(task)" :loading="actionLoading === task.uniqueKey">
                  确认接收任务
                </el-button>
              </div>
            </el-col>
          </transition-group>
        </el-row>
      </el-tab-pane>

      <el-tab-pane name="doing">
        <template #label>
          <span class="tab-label">
            ⚒️ 正在执行中
            <el-badge :value="pendingCompleteList.length" :hidden="pendingCompleteList.length === 0" type="warning" />
          </span>
        </template>
        <el-empty v-if="pendingCompleteList.length === 0" description="目前没有进行中的任务" :image-size="100" />
        
        <el-row :gutter="20">
          <transition-group name="list">
            <el-col :xs="24" :sm="12" :md="8" v-for="task in pendingCompleteList" :key="task.uniqueKey" class="mb-20 grid-item">
              <div class="modern-task-card warning-line">
                <div class="task-header">
                  <el-tag type="warning" effect="dark" size="small" round>执行中</el-tag>
                  <span class="deadline warning-text">截止: {{ formatDate(task.ddl) }}</span>
                </div>
                <h3 class="theme">{{ task.activityName }}</h3>
                <div class="task-detail">
                  <div class="dept-tag">{{ task.dept }}</div>
                  <p class="content-text">{{ task.content }}</p>
                </div>
                <el-button type="warning" class="complete-btn w-100" @click="handleComplete(task)" :loading="actionLoading === task.uniqueKey">
                  标记已完成 (+{{ task.rewardPoints }} 分)
                </el-button>
              </div>
            </el-col>
          </transition-group>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="✅ 荣誉记录" name="completed">
        <el-empty v-if="completedList.length === 0" description="暂无交付记录" />
        <div class="history-list">
          <div v-for="task in completedList" :key="task.uniqueKey" class="history-item">
            <div class="history-marker"><el-icon class="check-icon"><CircleCheckFilled /></el-icon></div>
            <div class="history-content">
              <h4>{{ task.activityName }} <span class="text-xs text-gray-400 font-normal ml-2">({{ task.dept }})</span></h4>
              <p>{{ task.content }}</p>
              <div class="history-meta">已交付，获得 +{{ task.rewardPoints }} 积分</div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const activeTab = ref('pending')
const myTasks = ref([])
const actionLoading = ref('')
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// 匹配新架构的状态：pending(待确认) -> doing(执行中) -> completed(已完成)
const pendingConfirmList = computed(() => myTasks.value.filter(t => t.status === 'pending'))
const pendingCompleteList = computed(() => myTasks.value.filter(t => t.status === 'doing'))
const completedList = computed(() => myTasks.value.filter(t => t.status === 'completed'))

onMounted(() => { fetchMyTasks() })

// 🌟 核心升级：遍历全新的嵌套 Pipeline 数据结构
const fetchMyTasks = async () => {
  try {
    const res = await db.collection('published_works').orderBy('createTime', 'desc').limit(100).get()
    const allWorks = res.data || []
    const tasks = []
    
    allWorks.forEach(work => {
      if (!work.stages) return // 兼容可能存在的脏数据
      
      // 遍历每一个阶段
      work.stages.forEach((stage, sIdx) => {
        // 遍历阶段里的并行任务
        stage.tasks.forEach((taskObj, tIdx) => {
          if (!taskObj.assignees) return
          
          // 查找当前登录干事是否在这个任务的指派名单里
          const myIndex = taskObj.assignees.findIndex(a => a.userId === currentUser.value._id)
          
          if (myIndex !== -1) {
            const myStatus = taskObj.assignees[myIndex].status || 'pending'
            
            tasks.push({
              uniqueKey: `${work._id}_${taskObj.id}`, 
              workId: work._id, 
              sIdx: sIdx,          // 记录在数组里的索引，为了等会儿精准更新数据库
              tIdx: tIdx, 
              aIdx: myIndex, 
              activityName: work.activityName, 
              dept: taskObj.dept, 
              content: taskObj.content,
              ddl: stage.ddl,      // 截止日期在 stage 层级
              rewardPoints: taskObj.rewardPoints || 10, 
              status: myStatus
            })
          }
        })
      })
    })
    
    // 按截止日期从近到远排序
    myTasks.value = tasks.sort((a, b) => a.ddl - b.ddl)
  } catch (error) { 
    ElMessage.error('加载任务失败') 
  }
}

// 接收任务
const handleConfirm = async (task) => {
  actionLoading.value = task.uniqueKey
  try {
    // 🌟 NoSQL 点语法魔法：精准修改深层嵌套数组里属于我自己的那个状态
    const path = `stages.${task.sIdx}.tasks.${task.tIdx}.assignees.${task.aIdx}.status`
    
    await db.collection('published_works').doc(task.workId).update({ 
      [path]: 'doing' 
    })
    
    task.status = 'doing' // 本地无感刷新
    ElMessage.success('已接收任务，请按时完成！')
    setTimeout(() => { activeTab.value = 'doing' }, 400) // 丝滑切到执行中 Tab
  } catch (err) {
    ElMessage.error('操作失败，请重试')
  } finally { actionLoading.value = '' }
}

// 交付任务
const handleComplete = async (task) => {
  try {
    await ElMessageBox.confirm(`确认该工作已交付？积分 +${task.rewardPoints}`, '交付确认', { type: 'success' })
    actionLoading.value = task.uniqueKey
    
    const path = `stages.${task.sIdx}.tasks.${task.tIdx}.assignees.${task.aIdx}.status`
    const reward = task.rewardPoints
    const _ = db.command

    // 1. 更新任务大盘里的个人状态
    await db.collection('published_works').doc(task.workId).update({ 
      [path]: 'completed' 
    })

    // 2. 加分
    await db.collection('users').doc(currentUser.value._id).update({ 
      workPoints: _.inc(reward), 
      points: _.inc(reward) 
    })
    
    // 3. 写积分流水日志
    await db.collection('points_logs').add({ 
      userId: currentUser.value._id, 
      realName: currentUser.value.realName, 
      amount: reward, 
      reason: `完成工作任务：${task.activityName} - ${task.content}`, 
      createTime: new Date().getTime() 
    })
    
    // 4. 更新本地缓存
    currentUser.value.workPoints = (currentUser.value.workPoints || 0) + reward
    currentUser.value.points = (currentUser.value.points || 0) + reward
    localStorage.setItem('user', JSON.stringify(currentUser.value))

    task.status = 'completed'
    ElMessage.success(`交付成功！积分已入账`)
    setTimeout(() => { activeTab.value = 'completed' }, 400)
  } catch (err) {
    if(err !== 'cancel') ElMessage.error('提交失败')
  } finally { actionLoading.value = '' }
}

const formatDate = (date) => {
  if (!date) return '未设置'
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.member-tasks { padding: 15px; max-width: 1200px; margin: 0 auto; background: #f8fafc; min-height: 90vh; }
.mb-24 { margin-bottom: 24px; }
.w-100 { width: 100%; }

.animate-down { animation: fadeInDown 0.6s ease both; }
.animate-up { animation: fadeInUp 0.6s ease both; animation-delay: 0.1s; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.grid-item { transition: all 0.5s ease; }
.list-enter-from { opacity: 0; transform: scale(0.9); }
.list-leave-to { opacity: 0; transform: translateY(30px); }
.list-leave-active { position: absolute; }

.premium-tabs { border-radius: 20px; border: none; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.03); background: white;}
:deep(.el-tabs__header) { background-color: #f1f5f9; border: none; padding: 5px; }
:deep(.el-tabs__item) { border: none !important; border-radius: 12px; margin: 5px; font-weight: bold; transition: 0.3s; }
:deep(.el-tabs__item.is-active) { background: white !important; color: #409EFF; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.modern-task-card { background: white; border-radius: 20px; padding: 24px; border: 1px solid #f1f5f9; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.modern-task-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }

.danger-line { border-top: 6px solid #ef4444; }
.warning-line { border-top: 6px solid #f59e0b; }

.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.deadline { font-size: 12px; color: #94a3b8; font-weight: 700; }
.warning-text { color: #f59e0b; }
.theme { margin: 0 0 16px; font-size: 18px; color: #1e293b; font-weight: 800; line-height: 1.4; }

.task-detail { background: #f8fafc; border-radius: 16px; padding: 16px; margin-bottom: 24px; min-height: 100px;}
.dept-tag { font-size: 11px; font-weight: 900; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;}
.content-text { font-size: 14px; color: #475569; margin: 0; line-height: 1.6; font-weight: bold;}

.confirm-btn, .complete-btn { border-radius: 12px; height: 46px; font-weight: bold; border: none; font-size: 15px;}
.confirm-btn { background: #ef4444; color: white; }
.complete-btn { background: #f59e0b; color: white; }

.history-list { display: flex; flex-direction: column; gap: 16px; padding: 10px; }
.history-item { display: flex; gap: 20px; padding: 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9;}
.check-icon { font-size: 24px; color: #10b981; }
.history-content h4 { margin: 0 0 8px 0; font-size: 16px; color: #1e293b; font-weight: bold;}
.history-content p { margin: 0; font-size: 14px; color: #64748b;}
.history-meta { margin-top: 10px; font-size: 12px; color: #10b981; font-weight: bold;}

/* 📱 手机端适配 */
@media screen and (max-width: 768px) {
  :deep(.el-tabs__item) { padding: 0 10px; font-size: 13px; }
  .modern-task-card { padding: 20px; }
  .history-item { flex-direction: column; gap: 10px; padding: 15px; }
  .check-icon { font-size: 20px; }
}
</style>