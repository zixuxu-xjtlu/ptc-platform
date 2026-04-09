<template>
  <div class="inventory-manager">
    <div class="page-header mb-24 animate-down">
      <div class="header-left">
        <h2 class="text-glow">📦 资产与物资仓库</h2>
        <p class="subtitle">实时监控社团物资储备，严格追踪每一次出入库记录</p>
      </div>
      <div class="header-right">
        <el-button type="primary" size="large" round class="shadow-glow" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon> 登记新物资
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="main-card animate-up">
      <el-table :data="inventoryList" v-loading="loading" stripe class="premium-table">
        <el-table-column label="物资图" width="100" align="center">
          <template #default="scope">
            <el-image 
              v-if="scope.row.image" 
              :src="scope.row.image" 
              class="item-img" 
              :preview-src-list="[scope.row.image]"
              preview-teleported
            />
            <div v-else class="img-placeholder"><el-icon><Picture /></el-icon></div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="物资名称" min-width="150">
          <template #default="scope">
            <strong class="text-lg">{{ scope.row.name }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="当前库存" width="150" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.stock > 5 ? 'success' : 'danger'" effect="dark" size="large" round class="stock-tag">
              {{ scope.row.stock }} 件
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="首次登记时间" width="180">
          <template #default="scope">
            <span class="text-gray">{{ formatDate(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="right">
          <template #default="scope">
            <el-button type="warning" plain size="small" @click="openAdjustDialog(scope.row, 'out')">
              <el-icon><Remove /></el-icon> 取出
            </el-button>
            <el-button type="success" plain size="small" @click="openAdjustDialog(scope.row, 'in')">
              <el-icon><CirclePlus /></el-icon> 补充
            </el-button>
            <el-button type="info" link @click="openLogsDialog(scope.row)">
              <el-icon><List /></el-icon> 记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="📝 登记新物资种类" width="500px">
      <el-form label-position="top">
        <el-form-item label="物资照片 (必填)" required>
          <el-upload
            class="avatar-uploader"
            action=""
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            accept="image/png, image/jpeg, image/jpg"
          >
            <img v-if="newItem.image" :src="newItem.image" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="text-xs text-gray-400 mt-2">点击上传图片 (大小建议不超过 2MB)</div>
        </el-form-item>
        <el-form-item label="物资名称 (必填)" required>
          <el-input v-model="newItem.name" placeholder="例如：社团定制作业本 / 帐篷" />
        </el-form-item>
        <el-form-item label="初始数量 (必填)" required>
          <el-input-number v-model="newItem.stock" :min="0" class="w-100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNewItem" :loading="submitting" :disabled="!newItem.name || !newItem.image">确认登记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustDialogVisible" :title="adjustForm.type === 'in' ? '🟢 物资入库补充' : '🔴 物资出库领用'" width="450px">
      <div class="mb-4 text-center">
        正在操作：<strong class="text-lg">{{ activeItem?.name }}</strong><br/>
        当前库存：<el-tag type="info">{{ activeItem?.stock }}</el-tag>
      </div>
      <el-form label-position="top">
        <el-form-item :label="adjustForm.type === 'in' ? '增加数量' : '取出数量'" required>
          <el-input-number v-model="adjustForm.amount" :min="1" :max="adjustForm.type === 'out' ? activeItem?.stock : 9999" class="w-100" />
        </el-form-item>
        <el-form-item label="原因/用途说明 (必填，用于日后核对)" required>
          <el-input type="textarea" v-model="adjustForm.reason" placeholder="例如：迎新晚会布置现场需要 / 采购了新的一批..." :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button :type="adjustForm.type === 'in' ? 'success' : 'warning'" @click="submitAdjust" :loading="submitting" :disabled="!adjustForm.reason">
          确认{{ adjustForm.type === 'in' ? '入库' : '取出' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logsDialogVisible" :title="`📜 [${activeItem?.name}] 流水账本`" width="700px">
      <el-table :data="itemLogs" v-loading="loadingLogs" height="400px" stripe>
        <el-table-column label="时间" width="160">
          <template #default="scope">{{ formatDate(scope.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作人" prop="operator" width="100" />
        <el-table-column label="动作" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'in' ? 'success' : 'danger'" effect="dark">
              {{ scope.row.type === 'in' ? '+' : '-' }} {{ scope.row.amount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因/用途说明" show-overflow-tooltip />
      </el-table>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Remove, CirclePlus, List, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { db } from '../../cloudbase'

const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const loading = ref(false)
const inventoryList = ref([])

// 弹窗控制与表单数据
const addDialogVisible = ref(false)
const adjustDialogVisible = ref(false)
const logsDialogVisible = ref(false)
const submitting = ref(false)
const loadingLogs = ref(false)

const activeItem = ref(null)
const itemLogs = ref([])

const newItem = ref({ name: '', image: '', stock: 1 })
const adjustForm = ref({ type: 'in', amount: 1, reason: '' })

// 初始加载
onMounted(() => {
  fetchInventory()
})

const fetchInventory = async () => {
  loading.value = true
  try {
    const res = await db.collection('inventory').orderBy('createTime', 'desc').get()
    inventoryList.value = res.data || []
  } catch (e) {
    ElMessage.error('获取仓库数据失败')
  } finally {
    loading.value = false
  }
}

// 📸 图片转码黑科技：直接把图片转成 Base64 字符串存入数据库，无需配置云存储！
const handleImageChange = (file) => {
  // 检查文件大小 (限制 2MB)
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片太大了！请上传 2MB 以内的图片')
    return
  }
  const reader = new FileReader()
  reader.readAsDataURL(file.raw)
  reader.onload = () => {
    newItem.value.image = reader.result // 存入 Base64
  }
}

const openAddDialog = () => {
  newItem.value = { name: '', image: '', stock: 1 }
  addDialogVisible.value = true
}

const submitNewItem = async () => {
  submitting.value = true
  try {
    // 1. 在主库创建物资
    const addRes = await db.collection('inventory').add({
      ...newItem.value,
      createTime: Date.now()
    })
    
    // 2. 自动在日志库里记录“初始建仓”
    await db.collection('inventory_logs').add({
      itemId: addRes.id,
      itemName: newItem.value.name,
      type: 'in',
      amount: newItem.value.stock,
      reason: '首次登记建仓',
      operator: currentUser.value.realName || currentUser.value.username,
      createTime: Date.now()
    })

    ElMessage.success('物资登记成功！')
    addDialogVisible.value = false
    fetchInventory()
  } catch (e) {
    ElMessage.error('登记失败')
  } finally {
    submitting.value = false
  }
}

const openAdjustDialog = (item, type) => {
  activeItem.value = item
  adjustForm.value = { type, amount: 1, reason: '' }
  adjustDialogVisible.value = true
}

const submitAdjust = async () => {
  submitting.value = true
  try {
    const _ = db.command
    // 1. 修改主库总库存
    const stockChange = adjustForm.value.type === 'in' ? _.inc(adjustForm.value.amount) : _.inc(-adjustForm.value.amount)
    await db.collection('inventory').doc(activeItem.value._id).update({
      stock: stockChange,
      updateTime: Date.now()
    })

    // 2. 写入出入库流水账
    await db.collection('inventory_logs').add({
      itemId: activeItem.value._id,
      itemName: activeItem.value.name,
      type: adjustForm.value.type,
      amount: adjustForm.value.amount,
      reason: adjustForm.value.reason,
      operator: currentUser.value.realName || currentUser.value.username,
      createTime: Date.now()
    })

    ElMessage.success('库存更新成功！')
    adjustDialogVisible.value = false
    fetchInventory()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const openLogsDialog = async (item) => {
  activeItem.value = item
  logsDialogVisible.value = true
  loadingLogs.value = true
  try {
    // 精准只查这一个物品的记录
    const res = await db.collection('inventory_logs')
      .where({ itemId: item._id })
      .orderBy('createTime', 'desc')
      .get()
    itemLogs.value = res.data || []
  } catch (e) {
    ElMessage.error('获取记录失败')
  } finally {
    loadingLogs.value = false
  }
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}
</script>

<style scoped>
.inventory-manager { padding: 20px; max-width: 1400px; margin: 0 auto; min-height: 85vh; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;}
.header-left h2 { margin: 0 0 8px 0; color: #1e293b; font-size: 28px; font-weight: 800; }
.subtitle { margin: 0; color: #64748b; font-size: 15px; }

.main-card { border-radius: 16px; border: 1px solid #e2e8f0; }
.premium-table { --el-table-header-bg-color: #f8fafc; }

/* 图片相关 */
.item-img { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; border: 1px solid #e2e8f0; }
.img-placeholder { width: 60px; height: 60px; border-radius: 12px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 24px; }

/* 上传框样式 */
.avatar-uploader .el-upload { border: 2px dashed #dcdfe6; border-radius: 12px; cursor: pointer; position: relative; overflow: hidden; transition: 0.3s; }
.avatar-uploader .el-upload:hover { border-color: #409EFF; }
.avatar-uploader-icon { font-size: 28px; color: #8c939d; width: 120px; height: 120px; text-align: center; line-height: 120px; }
.avatar { width: 120px; height: 120px; display: block; object-fit: cover; }

.stock-tag { font-weight: 900; font-size: 14px; padding: 0 16px; height: 32px; border: none;}
.text-gray { color: #94a3b8; }
.w-100 { width: 100%; }
.mt-2 { margin-top: 8px; }
.mb-4 { margin-bottom: 16px; }

/* 动画 */
.animate-down { animation: fadeInDown 0.5s ease-out; }
.animate-up { animation: fadeInUp 0.5s ease-out; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>