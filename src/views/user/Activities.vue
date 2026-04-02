<template>
  <div class="activities-container">
    <div class="page-header mb-20 fade-in-down">
      <h2>🎉 发现精彩活动</h2>
      <p class="subtitle">打破边界，在这里遇见有趣的灵魂与知识</p>
    </div>

    <el-card shadow="never" class="main-card fade-in-up">
      <el-tabs v-model="activeTab" class="custom-tabs">
        
        <el-tab-pane name="available">
          <template #label>
            <span class="tab-label">🔥 热门推荐 <el-badge :value="availableList.length" class="mark" type="danger" :hidden="availableList.length===0" /></span>
          </template>
          
          <el-empty v-if="availableList.length === 0" description="近期暂无可参与的新活动" />
          
          <div class="grid-wrapper">
            <el-row :gutter="24">
              <transition-group name="grid">
                <el-col :xs="24" :sm="12" :md="8" :lg="8" v-for="(act, index) in availableList" :key="act._id" class="mb-24 grid-item">
                  <div class="premium-act-card">
                    <div class="cover-img" :style="{ background: getGradient(index) }">
                      <div class="tag-box">
                        <el-tag effect="dark" type="warning" size="small" v-if="act.deadline">
                          <el-icon><Timer /></el-icon> 截止: {{ formatDate(act.deadline) }}
                        </el-tag>
                      </div>
                      <h3>{{ act.theme }}</h3>
                    </div>
                    <div class="card-body">
                      <div class="info-row">
                        <el-icon class="icon-primary"><Calendar /></el-icon>
                        <span>活动时间：{{ formatDate(act.time) }}</span>
                      </div>
                      <div class="desc-box">{{ act.content || act.desc || '社团精彩活动，期待你的加入！' }}</div>
                    </div>
                    <div class="card-footer">
                      <el-button 
                        type="info" 
                        plain 
                        class="btn-ignore"
                        @click="handleAction(act, 'ignored')" 
                        :loading="actionLoading === act._id"
                      >
                        暂时忽略
                      </el-button>
                      <el-button 
                        type="primary" 
                        class="btn-register"
                        @click="handleAction(act, 'registered')" 
                        :loading="actionLoading === act._id"
                      >
                        🚀 立即报名
                      </el-button>
                    </div>
                  </div>
                </el-col>
              </transition-group>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane name="registered">
          <template #label>
            <span class="tab-label">✅ 我的行程 <el-badge :value="registeredList.length" class="mark" type="success" :hidden="registeredList.length===0" /></span>
          </template>

          <el-empty v-if="registeredList.length === 0" description="你还没有报名任何活动哦" />
          
          <div class="grid-wrapper">
            <el-row :gutter="24">
              <transition-group name="grid">
                <el-col :xs="24" :sm="12" :md="8" :lg="8" v-for="act in registeredList" :key="act._id" class="mb-24 grid-item">
                  <div class="schedule-card">
                    <div class="sc-header">
                      <h4 class="text-ellipsis">{{ act.theme }}</h4>
                      <el-tag size="small" type="success" effect="light"><el-icon><Select /></el-icon> 已入场</el-tag>
                    </div>
                    <div class="sc-body">
                      <p><el-icon><Clock /></el-icon> <strong>时间：</strong>{{ formatDate(act.time) }}</p>
                    </div>
                    <div class="sc-footer">
                      <el-button type="primary" link @click="openLink(act.link)" v-if="act.link">
                        查看活动外链 &rarr;
                      </el-button>
                      <el-button type="danger" link @click="handleCancel(act)" :loading="actionLoading === act._id">
                        取消报名
                      </el-button>
                    </div>
                  </div>
                </el-col>
              </transition-group>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane name="expired">
          <template #label>
            <span class="tab-label">🕰️ 历史记录</span>
          </template>

          <el-empty v-if="expiredList.length === 0" description="没有历史活动" />
          
          <el-table v-else :data="expiredList" style="width: 100%" size="small" stripe class="compact-table">
            <el-table-column prop="theme" label="活动主题" min-width="150" show-overflow-tooltip />
            <el-table-column label="举办时间" width="160">
              <template #default="scope">{{ formatDate(scope.row.time) }}</template>
            </el-table-column>
            <el-table-column label="我的状态" width="100" align="center">
              <template #default="scope">
                <el-tag v-if="registeredIds.includes(scope.row._id)" type="info" size="small" effect="plain">曾参与</el-tag>
                <span v-else-if="ignoredIds.includes(scope.row._id)" style="color: #c0c4cc; font-size: 12px;">已忽略</span>
                <span v-else style="color: #c0c4cc; font-size: 12px;">未参与</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="right">
              <template #default>
                <el-tag type="info" size="small">已结束</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Calendar, Location, Timer, Clock, Select } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '../../cloudbase'

const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const activeTab = ref('available')
const actionLoading = ref('')

const allActivities = ref([])
const myRegRecords = ref([]) 

onMounted(() => {
  fetchData()
})

const fetchData = async () => {
  try {
    const role = currentUser.value.role
    const [actRes, regRes] = await Promise.all([
      db.collection('activities').where({ targets: role }).limit(200).get(),
      db.collection('activity_registrations').where({ userId: currentUser.value._id }).get()
    ])
    allActivities.value = actRes.data || []
    myRegRecords.value = regRes.data || []
  } catch (error) {
    ElMessage.error('数据加载失败')
  }
}

const registeredIds = computed(() => myRegRecords.value.filter(r => r.status === 'registered').map(r => r.activityId))
const ignoredIds = computed(() => myRegRecords.value.filter(r => r.status === 'ignored').map(r => r.activityId))
const nowTime = new Date().getTime()

const availableList = computed(() => {
  return allActivities.value.filter(act => {
    const actTime = new Date(act.time).getTime()
    return actTime > nowTime && !registeredIds.value.includes(act._id) && !ignoredIds.value.includes(act._id)
  }).sort((a, b) => new Date(a.time) - new Date(b.time))
})

const registeredList = computed(() => {
  return allActivities.value.filter(act => {
    const actTime = new Date(act.time).getTime()
    return actTime > nowTime && registeredIds.value.includes(act._id)
  }).sort((a, b) => new Date(a.time) - new Date(b.time))
})

const expiredList = computed(() => {
  return allActivities.value.filter(act => {
    const actTime = new Date(act.time).getTime()
    return actTime <= nowTime
  }).sort((a, b) => new Date(b.time) - new Date(a.time)) 
})

const handleAction = async (act, status) => {
  actionLoading.value = act._id
  try {
    await db.collection('activity_registrations').add({
      activityId: act._id, userId: currentUser.value._id, title: act.theme,
      eventTime: act.time, status: status, createTime: new Date().getTime()
    })
    if (status === 'registered') {
      if (act.link) window.open(act.link, '_blank') 
      ElMessage.success('🎉 报名成功！已为您加入行程表。')
    } else {
      ElMessage.info('已忽略该活动，界面已清爽。')
    }
    await fetchData() 
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  } finally { actionLoading.value = '' }
}

const handleCancel = async (act) => {
  try {
    await ElMessageBox.confirm('确定要取消报名该活动吗？', '取消提示', { type: 'warning', confirmButtonText: '狠心取消', cancelButtonText: '再想想' })
    actionLoading.value = act._id
    const record = myRegRecords.value.find(r => r.activityId === act._id && r.status === 'registered')
    if (!record) {
      actionLoading.value = ''
      return ElMessage.error('❌ 找不到对应的报名记录，请刷新')
    }
    const removeRes = await db.collection('activity_registrations').doc(record._id).remove()
    if (removeRes && removeRes.deleted === 0) {
      actionLoading.value = ''
      return ElMessage.error('❌ 取消失败')
    }
    myRegRecords.value = myRegRecords.value.filter(r => r._id !== record._id)
    ElMessage.success('已取消报名')
    setTimeout(() => { fetchData() }, 1000)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('取消发生异常')
  } finally { actionLoading.value = '' }
}

const openLink = (url) => { window.open(url, '_blank') }

const formatDate = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const getGradient = (index) => {
  const colors = ['linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)']
  return colors[index % colors.length]
}
</script>

<style scoped>
.fade-in-down { animation: fadeInDown 0.6s ease-out; }
.fade-in-up { animation: fadeInUp 0.6s ease-out; }

@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.activities-container { padding: 10px; max-width: 1200px; margin: 0 auto;}
.mb-20 { margin-bottom: 20px; }
.mb-24 { margin-bottom: 24px; }
.page-header h2 { margin: 0 0 8px 0; color: #2c3e50; font-size: 26px; font-weight: 600;}
.subtitle { margin: 0; color: #7f8c8d; font-size: 15px; letter-spacing: 1px;}
.main-card { min-height: 600px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.03) !important; border: none; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);}

.tab-label { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: bold; letter-spacing: 1px;}
:deep(.el-tabs__item) { padding: 0 30px; height: 55px; line-height: 55px; color: #95a5a6; transition: all 0.3s;}
:deep(.el-tabs__item.is-active) { color: #409EFF; font-size: 17px; }
:deep(.el-tabs__active-bar) { height: 3px; border-radius: 3px; background-color: #409EFF;}
:deep(.el-tabs__nav-wrap::after) { background-color: #f0f2f5; height: 1px; }

.grid-wrapper { padding: 10px 5px 20px 5px; overflow: visible; }
.grid-item { display: inline-block; width: 100%; }
.grid-enter-active, .grid-leave-active { transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1); }
.grid-enter-from { opacity: 0; transform: translateY(30px) scale(0.95); }
.grid-leave-to { opacity: 0; transform: translateY(-30px) scale(0.95); }
.grid-leave-active { position: absolute; }

.premium-act-card { border-radius: 16px; background: #ffffff; border: 1px solid #f0f2f5; overflow: hidden; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.premium-act-card:hover { transform: translateY(-8px); box-shadow: 0 16px 32px rgba(0,0,0,0.08); border-color: transparent; }
.cover-img { height: 150px; padding: 20px; position: relative; display: flex; align-items: flex-end; color: white; }
.tag-box { position: absolute; top: 15px; right: 15px; }
.cover-img h3 { margin: 0; font-size: 22px; text-shadow: 0 2px 8px rgba(0,0,0,0.2); font-weight: 600; letter-spacing: 1px; line-height: 1.3;}

.card-body { padding: 20px; }
.info-row { display: flex; align-items: center; gap: 8px; color: #34495e; font-size: 14px; margin-bottom: 12px; font-weight: 500;}
.icon-primary { color: #409EFF; font-size: 16px; }
.desc-box { font-size: 13px; color: #7f8c8d; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 42px;}

.card-footer { padding: 0 20px 20px; display: flex; justify-content: space-between; gap: 15px; }
.btn-ignore { flex: 1; border-radius: 8px; font-weight: bold;}
.btn-register { flex: 2; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(64,158,255,0.3); transition: all 0.3s;}

.schedule-card { background: #fafbfc; border: 1px solid #ebeef5; border-radius: 12px; padding: 18px; transition: all 0.3s; }
.schedule-card:hover { background: #ffffff; box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: #dcdfe6;}
.sc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;}
.text-ellipsis { margin: 0; font-size: 17px; color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%; font-weight: 600;}
.sc-body p { margin: 0; font-size: 14px; color: #5c6bc0; display: flex; align-items: center; gap: 6px; background: #f0f2f5; padding: 8px 12px; border-radius: 6px;}
.sc-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px; border-top: 1px dashed #ebeef5; padding-top: 12px;}

.compact-table { border: 1px solid #ebeef5; border-radius: 10px; overflow: hidden; }
:deep(.el-table th.el-table__cell) { background-color: #f8f9fa !important; color: #34495e; font-weight: 600;}

/* 📱 手机端专属调优 */
@media (max-width: 768px) {
  :deep(.el-tabs__item) { padding: 0 15px; font-size: 14px; }
  .cover-img { height: 120px; }
  .cover-img h3 { font-size: 18px; }
  .card-footer { flex-direction: column; gap: 10px; } /* 按钮上下排列 */
  .btn-ignore, .btn-register { width: 100%; }
}
</style>