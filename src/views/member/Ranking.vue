<template>
  <div class="ranking-container">
    <div class="header-area mb-24 animate-down">
      <div class="title-section">
        <h2>🏆 部门风云榜</h2>
        <p class="subtitle">
          <el-tag effect="dark" type="warning" round class="dept-tag">{{ myDept }}</el-tag> 
          工作积分实时排行，你的每一滴汗水都算数！
        </p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :md="14" class="animate-up-1">
        <el-card shadow="never" class="premium-card ranking-main">
          <div class="my-status-banner mb-24">
            <div class="stat-item">
              <span class="label">当前排名</span>
              <div class="value"><small>No.</small>{{ myRank }}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="label">贡献积分</span>
              <div class="value color-success">{{ myWorkPoints }}</div>
            </div>
          </div>

          <el-table 
            :data="deptUsers" 
            style="width: 100%" 
            v-loading="loading" 
            :row-class-name="tableRowClassName"
            class="modern-table"
          >
            <el-table-column label="名次" width="80" align="center">
              <template #default="scope">
                <div class="rank-badge-wrapper">
                  <div v-if="scope.$index === 0" class="medal gold">1</div>
                  <div v-else-if="scope.$index === 1" class="medal silver">2</div>
                  <div v-else-if="scope.$index === 2" class="medal bronze">3</div>
                  <span v-else class="rank-num">{{ scope.$index + 1 }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="精英成员" min-width="120">
              <template #default="scope">
                <div class="user-info-cell">
                  <el-avatar :size="32" :src="scope.row._id === myId ? scope.row.avatar : ''" class="mr-10 avatar-sm">
                    {{ scope.row._id === myId ? scope.row.realName?.substring(0, 1) : '?' }}
                  </el-avatar>
                  
                  <span :class="{'my-name-text': scope.row._id === myId}" class="name-text">
                    {{ scope.row._id === myId ? scope.row.realName : '***' }}
                    <el-tag v-if="scope.row._id === myId" size="small" effect="plain" round class="ml-5">我</el-tag>
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="workPoints" label="荣誉积分" width="90" align="right">
              <template #default="scope">
                <span class="pts-text">{{ scope.row.workPoints || 0 }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10" class="animate-up-2 mt-mobile">
        <el-card shadow="never" class="premium-card history-card">
          <template #header>
            <div class="card-header">
              <el-icon class="mr-5"><DataLine /></el-icon>
              <span>📈 我的奋斗轨迹</span>
            </div>
          </template>
          
          <el-empty v-if="myLogs.length === 0" description="暂无工作记录" :image-size="80" />
          
          <div class="timeline-wrapper" v-else>
            <el-timeline>
              <el-timeline-item 
                v-for="(log, index) in myLogs" 
                :key="index"
                type="primary"
                :hollow="true"
                :timestamp="formatDate(log.createTime)"
                placement="top"
              >
                <div class="log-item-card">
                  <div class="log-body">
                    <span class="reason">{{ log.reason }}</span>
                    <span class="amount">+{{ log.amount }}</span>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DataLine } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
const myId = currentUser._id
const myDept = currentUser.department || '未分配'
const myWorkPoints = ref(currentUser.workPoints || 0)

const loading = ref(false)
const deptUsers = ref([])
const myRank = ref('-')
const myLogs = ref([])

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchRanking(), fetchMyLogs()])
  loading.value = false
})

const fetchRanking = async () => {
  try {
    const res = await db.collection('users').where({ role: 'member', department: myDept }).get()
    let users = res.data || []
    users.sort((a, b) => (b.workPoints || 0) - (a.workPoints || 0))
    deptUsers.value = users
    const index = users.findIndex(u => u._id === myId)
    if (index !== -1) {
      myRank.value = index + 1
      myWorkPoints.value = users[index].workPoints || 0
    }
  } catch (error) { ElMessage.error('获取排行榜失败') }
}

const fetchMyLogs = async () => {
  try {
    const res = await db.collection('points_logs').where({ userId: myId, type: 'work' }).get()
    myLogs.value = (res.data || []).sort((a, b) => b.createTime - a.createTime)
  } catch (error) {}
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
const tableRowClassName = ({ row }) => row._id === myId ? 'my-row-highlight' : ''
</script>

<style scoped>
.ranking-container { padding: 15px; max-width: 1200px; margin: 0 auto; background: #f8fafc; min-height: 90vh; }
.mb-24 { margin-bottom: 24px; }
.mr-5 { margin-right: 5px; }
.mr-10 { margin-right: 10px; }
.ml-5 { margin-left: 5px; }

.animate-down { animation: fadeInDown 0.6s ease both; }
.animate-up-1 { animation: fadeInUp 0.6s ease both; animation-delay: 0.1s; }
.animate-up-2 { animation: fadeInUp 0.6s ease both; animation-delay: 0.2s; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.premium-card { border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.03) !important; background: #fff; }

.header-area h2 { margin: 0 0 8px 0; color: #1e293b; font-size: 28px; font-weight: 800; }
.subtitle { margin: 0; color: #64748b; font-size: 15px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dept-tag { font-weight: bold; letter-spacing: 1px; }

.my-status-banner { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 18px; display: flex; align-items: center; justify-content: space-around; color: white; box-shadow: 0 10px 25px rgba(30, 41, 59, 0.2); }
.stat-item { text-align: center; }
.stat-item .label { font-size: 13px; opacity: 0.7; display: block; margin-bottom: 8px; font-weight: 500; }
.stat-item .value { font-size: 36px; font-weight: 800; letter-spacing: -1px; }
.stat-item .value small { font-size: 18px; margin-right: 4px; }
.stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); }
.color-success { color: #4ade80; }

.modern-table { margin-top: 10px; }
:deep(.el-table__row) { transition: all 0.3s; }
:deep(.my-row-highlight) { background-color: #f0f9ff !important; font-weight: bold; }

.rank-badge-wrapper { display: flex; justify-content: center; align-items: center; }
.medal { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.gold { background: linear-gradient(135deg, #facc15 0%, #eab308 100%); }
.silver { background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%); }
.bronze { background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%); }
.rank-num { font-size: 15px; color: #94a3b8; font-weight: 700; }

.user-info-cell { display: flex; align-items: center; }
.name-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; display: inline-block; vertical-align: middle;}
.my-name-text { color: #3b82f6; }
.pts-text { font-weight: 800; color: #1e293b; font-size: 17px; }

.history-card { min-height: 600px; display: flex; flex-direction: column; }
.card-header { display: flex; align-items: center; font-weight: 700; color: #1e293b; }
.timeline-wrapper { padding: 10px 5px; flex: 1; overflow-y: auto; }

.log-item-card { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; transition: all 0.3s; }
.log-item-card:hover { transform: translateX(5px); background: #fff; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border-color: #3b82f6; }
.log-body { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.reason { font-size: 14px; color: #334155; font-weight: 600; flex: 1; }
.amount { color: #10b981; font-weight: 800; font-size: 16px; white-space: nowrap; }

/* 📱 手机端适配 */
@media screen and (max-width: 768px) {
  .mt-mobile { margin-top: 20px; }
  .my-status-banner { padding: 20px 15px; }
  .stat-item .value { font-size: 28px; }
  .header-area h2 { font-size: 24px; }
  .avatar-sm { width: 24px; height: 24px; line-height: 24px; font-size: 12px; }
  .name-text { max-width: 70px; }
}
</style>