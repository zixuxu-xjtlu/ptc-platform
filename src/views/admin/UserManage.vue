<template>
  <div class="user-manage-container">
    <div class="page-header mb-24 animate-down">
      <div class="title-section">
        <h2>👥 成员档案与积分中心</h2>
        <p class="subtitle">管理全员身份权限，当前已实现【待审核过滤】与【批量奖惩】</p>
      </div>
      <div class="action-group mt-15-mobile">
        <el-button type="warning" @click="openBatchDialog" class="batch-btn" round icon="MagicStick">
          批量奖惩
        </el-button>
        <div class="search-wrapper">
          <el-input v-model="searchKey" placeholder="搜索姓名或账号..." class="search-input" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="premium-card animate-up">
      <el-table :data="sortedFilteredUsers" style="width: 100%" v-loading="loading" stripe class="modern-table">
        <el-table-column label="权限等级" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.role === 'admin'" type="danger" effect="dark" round class="role-tag">管理层</el-tag>
            
            <el-tag v-else-if="scope.row.role === 'member' && scope.row.status === 'pending'" type="warning" effect="dark" round class="role-tag">待审核干事</el-tag>
            
            <el-tag v-else-if="scope.row.role === 'member'" type="success" effect="light" round class="role-tag">干事</el-tag>
            <el-tag v-else type="info" variant="plain" round class="role-tag">普通学生</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="成员信息" min-width="150">
          <template #default="scope">
            <div class="user-info-cell">
              <el-avatar :size="32" class="user-avatar hide-on-mobile" :style="getAvatarStyle(scope.row.role, scope.row.status)">
                {{ scope.row.realName?.substring(0, 1) || 'U' }}
              </el-avatar>
              <div class="user-text">
                <div class="real-name">{{ scope.row.realName || '未实名' }}</div>
                <div class="username">@{{ scope.row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="department" label="所属部门" width="100">
          <template #default="scope">
            <div class="dept-box">
              {{ scope.row.department || '未分配' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="总积分" width="90" align="center">
          <template #default="scope">
            <div class="points-badge blue"><span>{{ scope.row.points || 0 }}</span></div>
          </template>
        </el-table-column>

        <el-table-column label="工作分" width="90" align="center">
          <template #default="scope">
            <div v-if="scope.row.role === 'member' || scope.row.role === 'admin'" class="points-badge green">
              <span>{{ scope.row.workPoints || 0 }}</span>
            </div>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>

        <el-table-column label="管理操作" width="130" align="right" fixed="right">
          <template #default="scope">
            <div class="btn-group">
              <el-button 
                v-if="scope.row.role === 'member' && scope.row.status === 'pending'" 
                size="small" 
                type="warning" 
                link 
                @click="handleVerify(scope.row)"
              >
                通过验证
              </el-button>
              
              <el-button size="small" type="primary" link @click="openPointsDialog(scope.row, 'normal')">改分</el-button>
              <el-button v-if="scope.row.role !== 'user' && scope.row.status !== 'pending'" size="small" type="success" link @click="openPointsDialog(scope.row, 'work')">发奖</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="batchDialogVisible" title="⚡ 批量高效奖惩中心" width="90%" max-width="500px" class="premium-dialog">
      <div class="batch-hint mb-15">
        <el-icon class="mr-5"><InfoFilled /></el-icon>
        请输入成员**真实姓名**，名字之间用 <strong style="color: #f56c6c; margin:0 4px;">//</strong> 隔开
      </div>
      <el-form label-position="top">
        <el-form-item label="待操作名单 (例如：张三 // 李四 // 王五)">
          <el-input v-model="batchForm.names" type="textarea" :rows="4" placeholder="张三 // 李四 // 王五" />
        </el-form-item>
        <el-form-item label="积分变更类型">
          <el-radio-group v-model="batchForm.editType" size="small">
            <el-radio-button label="normal">仅调总积分</el-radio-button>
            <el-radio-button label="work">加工作积分</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="变更数额">
              <el-input-number v-model="batchForm.amount" :min="-1000" :max="1000" class="full-width" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="统一奖惩理由">
          <el-input v-model="batchForm.reason" placeholder="如：XX活动表现优异集体奖励" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false" round>取消</el-button>
        <el-button type="warning" @click="submitBatchPoints" :loading="batchSaving" round>执行批量更新</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="editType === 'work' ? '🏆 发放工作奖励' : '💰 系统积分调控'" width="90%" max-width="420px" class="premium-dialog">
      <div class="dialog-target">正在为 <strong>{{ currentUser.realName || currentUser.username }}</strong> 操作</div>
      <el-form label-position="top">
        <el-form-item label="变更数额"><el-input-number v-model="amount" :min="-1000" :max="1000" class="full-width" /></el-form-item>
        <el-form-item label="操作事由说明"><el-input v-model="reason" type="textarea" :rows="2" placeholder="填写具体理由" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" round>取消</el-button>
        <el-button type="primary" @click="submitPoints" :loading="saving" round>确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Coin, Trophy, OfficeBuilding, Edit, Medal, MagicStick, InfoFilled } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const loading = ref(false)
const users = ref([])
const searchKey = ref('')

const sortedFilteredUsers = computed(() => {
  // 🌟 排序权重：管理层最高，待审核干事次之（方便管理），已验证干事随后，普通学生最后
  const roleWeights = { admin: 100, pending_member: 80, member: 50, user: 10 }
  
  let result = users.value.filter(u => 
    (u.realName || '').includes(searchKey.value) || 
    (u.username || '').includes(searchKey.value)
  )
  
  return result.sort((a, b) => {
    const aWeight = (a.role === 'member' && a.status === 'pending') ? roleWeights.pending_member : (roleWeights[a.role] || 0)
    const bWeight = (b.role === 'member' && b.status === 'pending') ? roleWeights.pending_member : (roleWeights[b.role] || 0)
    return bWeight - aWeight
  })
})

onMounted(() => { fetchUsers() })

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await db.collection('users').limit(500).get()
    users.value = res.data || []
  } catch (e) {
    ElMessage.error('数据加载失败')
  } finally { loading.value = false }
}

// 🌟 修改：身份验证逻辑，将 status 设为 active
const handleVerify = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定通过【${user.realName}】的干事申请吗？\n通过后他将可以正常登录并执行内部工作。`, 
      '身份审核', 
      { confirmButtonText: '通过审核', cancelButtonText: '拒绝并忽略', type: 'warning' }
    )
    
    loading.value = true
    
    // 关键点：修改 status 为 active
    await db.collection('users').doc(user._id).update({
      status: 'active'
    })
    
    ElMessage.success(`审核已通过！${user.realName} 现在是正式干事了`)
    fetchUsers()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('审核操作失败')
  } finally { loading.value = false }
}

const dialogVisible = ref(false)
const saving = ref(false)
const currentUser = ref({})
const editType = ref('normal')
const amount = ref(10)
const reason = ref('')

const openPointsDialog = (user, type) => {
  currentUser.value = user
  editType.value = type
  amount.value = 10
  reason.value = type === 'work' ? '管理员手动发放工作奖励' : '系统积分调整'
  dialogVisible.value = true
}

const submitPoints = async () => {
  if (amount.value === 0) return ElMessage.warning('数额不能为0')
  saving.value = true
  try {
    const _ = db.command
    let updateData = editType.value === 'work' 
      ? { workPoints: _.inc(amount.value), points: _.inc(amount.value) }
      : { points: _.inc(amount.value) }

    await db.collection('users').doc(currentUser.value._id).update(updateData)
    await db.collection('points_logs').add({
      userId: currentUser.value._id,
      realName: currentUser.value.realName || currentUser.value.username,
      amount: amount.value,
      type: editType.value === 'work' ? 'work' : 'system',
      reason: reason.value,
      createTime: new Date().getTime()
    })
    ElMessage.success('操作成功')
    dialogVisible.value = false
    fetchUsers()
  } catch (e) {} finally { saving.value = false }
}

const batchDialogVisible = ref(false)
const batchSaving = ref(false)
const batchForm = ref({ names: '', editType: 'work', amount: 10, reason: '' })

const openBatchDialog = () => {
  batchForm.value = { names: '', editType: 'work', amount: 10, reason: '集体活动表现优异特别奖励' }
  batchDialogVisible.value = true
}

const submitBatchPoints = async () => {
  if (!batchForm.value.names.trim()) return ElMessage.warning('请先输入名单')
  const nameList = batchForm.value.names.split('//').map(n => n.trim()).filter(n => n)
  
  try {
    await ElMessageBox.confirm(`即将为【${nameList.length}】位成员发放积分，是否确认？`, '批量操作确认', { type: 'warning' })
    batchSaving.value = true
    
    const _ = db.command
    const targetRes = await db.collection('users').where({ realName: _.in(nameList) }).get()
    const targets = targetRes.data || []
    
    const updatePromises = targets.map(async (user) => {
      let updateData = batchForm.value.editType === 'work' 
        ? { workPoints: _.inc(batchForm.value.amount), points: _.inc(batchForm.value.amount) }
        : { points: _.inc(batchForm.value.amount) }
      
      await db.collection('users').doc(user._id).update(updateData)
      return db.collection('points_logs').add({
        userId: user._id, realName: user.realName, amount: batchForm.value.amount,
        type: batchForm.value.editType === 'work' ? 'work' : 'system',
        reason: batchForm.value.reason, createTime: new Date().getTime()
      })
    })

    await Promise.all(updatePromises)
    ElMessage.success(`操作完成！共处理 ${targets.length} 人`)
    batchDialogVisible.value = false
    fetchUsers()
  } catch (e) {
    if(e !== 'cancel') ElMessage.error('批量处理异常')
  } finally { batchSaving.value = false }
}

const getAvatarStyle = (role, status) => {
  if (role === 'admin') return 'background: linear-gradient(135deg, #e11d48 0%, #fb7185 100%)'
  if (role === 'member' && status === 'pending') return 'background: linear-gradient(135deg, #e6a23c 0%, #f3d19e 100%)'
  if (role === 'member') return 'background: linear-gradient(135deg, #10b981 0%, #34d399 100%)'
  return 'background: #94a3b8'
}
</script>

<style scoped>
/* 样式部分保持不变，保持美观 */
.user-manage-container { padding: 10px; max-width: 1400px; margin: 0 auto; }
.mb-24 { margin-bottom: 24px; }
.mb-15 { margin-bottom: 15px; }
.full-width { width: 100%; }
.animate-down { animation: fadeInDown 0.6s ease-out; }
.animate-up { animation: fadeInUp 0.6s ease-out 0.1s both; }
@keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 15px;}
.title-section h2 { margin: 0 0 6px 0; color: #1e293b; font-size: 26px; font-weight: 800; }
.subtitle { margin: 0; color: #64748b; font-size: 14px; }
.action-group { display: flex; gap: 10px; align-items: center; flex-wrap: wrap;}
.batch-btn { box-shadow: 0 4px 12px rgba(230, 162, 60, 0.2); font-weight: bold; }
.search-input { width: 200px; transition: all 0.3s; }
.search-input:focus-within { width: 240px; }
:deep(.el-input__wrapper) { border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
.premium-card { border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.02) !important; }
.modern-table { border-radius: 15px; overflow: hidden; }
.role-tag { font-weight: bold; padding: 0 10px; }
.user-info-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar { font-weight: bold; color: white; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.1); flex-shrink: 0;}
.real-name { font-size: 14px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
.username { font-size: 12px; color: #94a3b8; }
.dept-box { display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 13px; }
.points-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 13px; }
.points-badge.blue { background: #eff6ff; color: #3b82f6; }
.points-badge.green { background: #f0fdf4; color: #10b981; }
.text-placeholder { color: #cbd5e1; }
.btn-group { display: flex; flex-direction: column; gap: 5px; align-items: flex-end; }
.batch-hint { background: #fffcf5; border: 1px solid #ffeb3b; padding: 10px; border-radius: 10px; color: #856404; font-size: 12px; line-height: 1.5; }
.premium-dialog :deep(.el-dialog__title) { font-weight: 800; color: #1e293b; }
.dialog-target { background: #f8fafc; padding: 12px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #3b82f6; font-size: 13px;}
@media screen and (max-width: 768px) {
  .mt-15-mobile { margin-top: 15px; }
  .hide-on-mobile { display: none !important; }
  .search-input { width: 100%; }
  .btn-group { flex-direction: row; justify-content: flex-end; flex-wrap: wrap;}
}
</style>