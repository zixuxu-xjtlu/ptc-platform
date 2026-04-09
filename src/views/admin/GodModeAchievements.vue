<template>
  <div v-if="isGod" class="god-achievements-manager">
    <div class="page-header mb-24 animate-down">
      <div class="header-left">
        <h2 class="text-glow">👁️‍🗨️ 全局成就法则管理</h2>
        <p class="subtitle">上帝视角：定义规则、手动干预世界线、监控全员荣誉 (专属最高权限)</p>
      </div>
      <div class="header-right">
        <el-button type="warning" size="large" round class="shadow-glow" @click="handleOpenForm()">
          <el-icon class="mr-1"><MagicStick /></el-icon> 创造新法则
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="premium-tabs animate-up">
      <el-tab-pane name="rules">
        <template #label><span class="tab-label">📜 法则定义</span></template>
        <el-card shadow="never" class="main-card bg-dark border-dark">
          <el-table :data="achievements" v-loading="loading" stripe class="god-table">
            <el-table-column label="图标" width="70" align="center">
              <template #default="scope"><span class="text-2xl">{{ scope.row.icon }}</span></template>
            </el-table-column>
            <el-table-column prop="title" label="成就名称" width="180" />
            <el-table-column label="分类/状态" width="150">
              <template #default="scope">
                <el-tag size="small" effect="dark" :color="getCategoryColor(scope.row.category)" style="border:none; margin-bottom:4px;">
                  {{ getCategoryName(scope.row.category) }}
                </el-tag>
                <br />
                <el-tag v-if="scope.row.isHidden" size="small" type="info" effect="plain">🤫 隐藏成就</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="达成条件/描述" min-width="200" show-overflow-tooltip />
            <el-table-column label="奖励" width="100" align="center">
              <template #default="scope"><span class="text-warning font-bold">+{{ scope.row.rewardPoints }}</span></template>
            </el-table-column>
            <el-table-column label="神之干预" width="180" align="right">
              <template #default="scope">
                <el-button type="primary" link icon="Edit" @click="handleOpenForm(scope.row)">修改</el-button>
                <el-button type="warning" link icon="User" @click="handleOpenGrant(scope.row)">发放</el-button>
                <el-button type="danger" link icon="Delete" @click="handleDelete(scope.row._id)">抹除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane name="records">
        <template #label><span class="tab-label">📡 实时解锁流</span></template>
        <el-card shadow="never" class="main-card bg-dark border-dark">
          <el-table :data="allRecords" v-loading="loading" stripe class="god-table">
            <el-table-column label="时间" width="160">
              <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="社员" width="150">
              <template #default="scope">
                <span class="text-white font-bold">{{ scope.row.username }}</span>
              </template>
            </el-table-column>
            <el-table-column label="获得成就">
              <template #default="scope">
                <span class="text-warning">🏆 {{ scope.row.achievementTitle }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="right">
              <template #default="scope">
                <el-button type="danger" link @click="revokeAchievement(scope.row)">收回</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="formVisible" :title="isEditing ? '修改世界线' : '颁布新法则'" width="600px" custom-class="god-dialog">
      <el-form label-position="top">
        <el-row :gutter="20">
          <el-col :span="16"><el-form-item label="成就名" required><el-input v-model="formData.title" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="图标 Emoji"><el-input v-model="formData.icon" /></el-form-item></el-col>
        </el-row>
        
        <el-form-item label="适用角色限制" required>
          <el-radio-group v-model="formData.targetRole">
            <el-radio label="all">🌍 全员通用 (登录/注册类)</el-radio>
            <el-radio label="user">🧑 普通用户 (报名/题库/兑换类)</el-radio>
            <el-radio label="member">💼 社团干事 (工作台/任务类)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属领域" required>
              <el-select v-model="formData.category" class="w-100">
                <el-option label="基础/通用" value="login" />
                <el-option label="工作区 (Member)" value="work" />
                <el-option label="智学题库 (User)" value="quiz" />
                <el-option label="积分兑换 (User)" value="shop" />
                <el-option label="活动报名 (User)" value="activity" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="奖励积分"><el-input-number v-model="formData.rewardPoints" :min="0" class="w-100" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="真实描述 (达成后可见)" required><el-input type="textarea" v-model="formData.description" /></el-form-item>
        <el-form-item><el-switch v-model="formData.isHidden" active-text="设为隐藏成就" /></el-form-item>
        <el-form-item v-if="formData.isHidden" label="伪装描述 (未达成时可见)"><el-input v-model="formData.hiddenDesc" placeholder="？？？" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">闭眼</el-button>
        <el-button type="warning" :loading="submitting" @click="saveAchievement">颁布</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="grantVisible" title="授予荣誉" width="400px" custom-class="god-dialog">
      <el-form label-position="top">
        <el-form-item label="选择社员 (搜索用户名)">
          <el-select v-model="selectedUserId" filterable placeholder="输入用户名搜索" class="w-100">
            <el-option v-for="u in users" :key="u._id" :label="u.username" :value="u._id" />
          </el-select>
        </el-form-item>
        <p class="text-xs text-gray-400">将手动为该成员解锁成就：<br/><b class="text-warning">{{ activeAch?.title }}</b></p>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="confirmGrant" :loading="granting">确认授予</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MagicStick, Edit, Delete, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '../../cloudbase'

// --- 👑 终极权限控制 ---
const GOD_ACCOUNT = 'Zixu_Xu24' // 专属绑定！
const isGod = ref(false)
const router = useRouter()
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// --- 数据 ---
const activeTab = ref('rules')
const loading = ref(true)
const achievements = ref([])
const allRecords = ref([])
const users = ref([])

// --- 表单相关 ---
const formVisible = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const formData = ref({ title: '', icon: '🏆', targetRole: 'all', category: 'login', description: '', isHidden: false, hiddenDesc: '？？？', rewardPoints: 20 })

const grantVisible = ref(false)
const granting = ref(false)
const activeAch = ref(null)
const selectedUserId = ref('')

onMounted(async () => {
  // 严格校验用户名
  if (currentUser.value.username !== GOD_ACCOUNT) {
    ElMessage.error('⛔ 警告：非法越权！该区域仅限最高创建者访问。')
    router.push('/admin/dashboard')
    return
  }
  isGod.value = true
  fetchData()
})

const fetchData = async () => {
  loading.value = true
  try {
    const [achRes, recRes, userRes] = await Promise.all([
      db.collection('achievements').get(),
      db.collection('user_achievements').orderBy('createTime', 'desc').limit(50).get(),
      db.collection('users').limit(1000).get()
    ])
    achievements.value = achRes.data || []
    allRecords.value = recRes.data || []
    users.value = userRes.data || []
  } catch (e) { ElMessage.error('读取法则失败') }
  finally { loading.value = false }
}

const handleOpenForm = (row = null) => {
  if (row) {
    isEditing.value = true
    formData.value = { ...row }
  } else {
    isEditing.value = false
    // 🌟 修复点：新增时带上 targetRole 的默认值
    formData.value = { title: '', icon: '🏆', targetRole: 'all', category: 'login', description: '', isHidden: false, hiddenDesc: '？？？', rewardPoints: 20 }
  }
  formVisible.value = true
}

const saveAchievement = async () => {
  submitting.value = true
  try {
    if (isEditing.value) {
      await db.collection('achievements').doc(formData.value._id).update({ ...formData.value, updateTime: Date.now() })
    } else {
      await db.collection('achievements').add({ ...formData.value, createTime: Date.now() })
    }
    ElMessage.success('法则已生效')
    formVisible.value = false
    fetchData()
  } catch (e) { ElMessage.error('颁布失败') }
  finally { submitting.value = false }
}

const handleOpenGrant = (ach) => {
  activeAch.value = ach
  selectedUserId.value = ''
  grantVisible.value = true
}

const confirmGrant = async () => {
  if (!selectedUserId.value) return
  granting.value = true
  try {
    const user = users.value.find(u => u._id === selectedUserId.value)
    // 写入解锁记录
    await db.collection('user_achievements').add({
      userId: user._id,
      username: user.username,
      achievementId: activeAch.value._id,
      achievementTitle: activeAch.value.title,
      createTime: Date.now()
    })
    // 增加积分
    const _ = db.command
    await db.collection('users').doc(user._id).update({
      points: _.inc(activeAch.value.rewardPoints)
    })
    ElMessage.success(`已授予 ${user.username} 荣誉`)
    grantVisible.value = false
    fetchData()
  } catch (e) { ElMessage.error('授予失败，可能已拥有该成就') }
  finally { granting.value = false }
}

const revokeAchievement = async (record) => {
  ElMessageBox.confirm('确定要收回这项荣誉吗？（积分不会自动扣除，需手动调整用户积分）', '神之撤回').then(async () => {
    await db.collection('user_achievements').doc(record._id).remove()
    ElMessage.success('已撤回')
    fetchData()
  })
}

const handleDelete = (id) => {
  ElMessageBox.confirm('彻底抹除此项法则？', '警告').then(async () => {
    await db.collection('achievements').doc(id).remove()
    fetchData()
  })
}

// 辅助函数
const getCategoryName = (c) => ({ login:'登录', work:'工作', quiz:'题库', shop:'商城', activity:'活动' }[c] || '其他')
const getCategoryColor = (c) => ({ login:'#409EFF', work:'#E6A23C', quiz:'#67C23A', shop:'#F56C6C', activity:'#9333ea' }[c] || '#333')
const formatDate = (ts) => new Date(ts).toLocaleString()
</script>

<style scoped>
.god-achievements-manager { padding: 20px; background: #0a0d1a; min-height: 90vh; color: #fff; }
.text-glow { text-shadow: 0 0 15px rgba(0, 217, 255, 0.5); color: #00d9ff; font-size: 28px; font-weight: 900; }
.bg-dark { background: #111827 !important; border: 1px solid #1f2937 !important; border-radius: 16px; }
.god-table { background: transparent !important; color: #fff !important; }
:deep(.el-table) { --el-table-bg-color: transparent; --el-table-tr-bg-color: transparent; color: #e2e8f0; }
:deep(.el-table th) { background-color: #1f2937 !important; color: #9ca3af; }
:deep(.el-tabs__item) { color: #94a3b8; font-weight: bold; }
:deep(.el-tabs__item.is-active) { color: #00d9ff; }
.w-100 { width: 100%; }
.mb-24 { margin-bottom: 24px; }
.god-dialog { background: #1f2937 !important; }
</style>