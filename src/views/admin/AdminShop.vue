<template>
  <div class="admin-shop-container">
    <div class="page-header mb-24 animate-down flex-header">
      <div class="title-section">
        <div class="admin-badge">INVENTORY MANAGEMENT</div>
        <h2>🛍️ 商城上货与库存中心</h2>
        <p class="subtitle">发布社团周边与学术资料，监控库存流转数据</p>
      </div>
      <div class="action-section">
        <el-button type="primary" size="large" round class="premium-add-btn" @click="openUploadDialog">
          <el-icon class="mr-5"><Plus /></el-icon> 发布新商品
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="premium-card animate-up">
      <el-tabs v-model="activeTab" class="modern-tabs">
        
        <el-tab-pane name="merch">
          <template #label>
            <span class="tab-label"><el-icon><Present /></el-icon> 实体周边</span>
          </template>
          
          <el-table :data="merchList" v-loading="loading" stripe class="modern-table">
            <el-table-column label="预览" width="80" align="center">
              <template #default="scope">
                <div class="img-preview-box">
                  <el-image 
                    v-if="scope.row.image" 
                    :src="scope.row.image" 
                    fit="cover" 
                    class="table-img"
                    :preview-src-list="[scope.row.image]"
                  />
                  <div v-else class="img-placeholder">🎁</div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="name" label="周边名称" min-width="120">
              <template #default="scope"><span class="item-name">{{ scope.row.name }}</span></template>
            </el-table-column>
            
            <el-table-column label="积分" width="90">
              <template #default="scope">
                <div class="price-badge"><el-icon><Coin /></el-icon><span>{{ scope.row.cost }}</span></div>
              </template>
            </el-table-column>
            
            <el-table-column label="库存" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.stock > 5 ? 'success' : 'danger'" effect="dark" round size="small" class="stock-tag">
                  {{ scope.row.stock > 0 ? `剩 ${scope.row.stock}` : '售罄' }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="160" align="right">
              <template #default="scope">
                <div class="op-btns">
                  <el-button type="success" link icon="List" @click="viewOrders(scope.row)">名单</el-button>
                  <el-button type="danger" link icon="Delete" @click="handleDelete(scope.row._id)">下架</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane name="material">
          <template #label>
            <span class="tab-label"><el-icon><Files /></el-icon> 电子资料</span>
          </template>
          
          <el-table :data="materialList" v-loading="loading" stripe class="modern-table">
            <el-table-column label="格式" width="70" align="center">
              <template #default><div class="file-icon-box">📄</div></template>
            </el-table-column>
            
            <el-table-column prop="name" label="资料名称" min-width="150">
              <template #default="scope"><span class="item-name">{{ scope.row.name }}</span></template>
            </el-table-column>
            
            <el-table-column label="积分" width="90">
              <template #default="scope">
                <div class="price-badge purple"><el-icon><Coin /></el-icon><span>{{ scope.row.cost }}</span></div>
              </template>
            </el-table-column>
            
            <el-table-column label="剩余下载" width="100">
              <template #default="scope"><el-tag type="info" round size="small" class="stock-tag">{{ scope.row.stock }} 次</el-tag></template>
            </el-table-column>
            
            <el-table-column label="操作" width="160" align="right">
              <template #default="scope">
                <div class="op-btns">
                  <el-button type="success" link icon="Download" @click="viewOrders(scope.row)">流水</el-button>
                  <el-button type="danger" link icon="Delete" @click="handleDelete(scope.row._id)">下架</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      title="🚀 发布新上架物品" 
      width="90%"
      max-width="500px" 
      @close="resetForm"
      class="premium-dialog"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="物品分类">
          <el-radio-group v-model="form.type" class="modern-radio">
            <el-radio-button label="merch">🎁 实体周边</el-radio-button>
            <el-radio-button label="material">📁 电子资料</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="form.type === 'merch' ? '周边名称' : '资料名称'" required>
          <el-input v-model="form.name" placeholder="请输入商品展示名称" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="单价 (积分)" required>
              <el-input-number v-model="form.cost" :min="0" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="初始库存/额度" required>
              <el-input-number v-model="form.stock" :min="1" class="full-width" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="form.type === 'merch' ? '展示主图 (建议比例1:1)' : '上传资料源文件 (必填)'">
          <el-upload
            class="premium-uploader"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            ref="uploadRef"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" round>取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploading" round class="confirm-btn">确认发布</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="orderDialogVisible" :title="`📦 【${currentViewItem.name}】流水看板`" width="95%" max-width="700px" class="order-dialog">
      <div class="order-table-wrapper">
        <el-table :data="orderList" v-loading="orderLoading" height="400" stripe>
          <el-table-column label="兑换人" width="100">
            <template #default="scope"><div class="buyer-name">{{ scope.row.buyerName }}</div></template>
          </el-table-column>
          <el-table-column prop="buyerEmail" label="联系方式" min-width="150" />
          <el-table-column label="兑换时间" width="120">
            <template #default="scope">
              <span class="time-text">{{ new Date(scope.row.createTime).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'}) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="orderList.length === 0 && !orderLoading" description="暂无历史兑换数据" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Present, Files, Coin, Delete, List, Download, UploadFilled } from '@element-plus/icons-vue'
import { db, app } from '../../cloudbase'

const activeTab = ref('merch')
const loading = ref(false)
const dialogVisible = ref(false)
const uploading = ref(false)
const uploadRef = ref(null)
const shopList = ref([])

const merchList = computed(() => shopList.value.filter(item => item.type !== 'material'))
const materialList = computed(() => shopList.value.filter(item => item.type === 'material'))

const form = ref({ type: 'merch', name: '', cost: 50, stock: 10 })
const selectedFile = ref(null)

const orderDialogVisible = ref(false)
const orderLoading = ref(false)
const orderList = ref([])
const currentViewItem = ref({})

onMounted(() => { fetchShopItems() })

const fetchShopItems = async () => {
  loading.value = true
  try {
    const res = await db.collection('shop').limit(100).get()
    shopList.value = (res.data || []).sort((a,b) => new Date(b.createTime) - new Date(a.createTime))
  } catch (error) {} finally { loading.value = false }
}

const viewOrders = async (item) => {
  currentViewItem.value = item
  orderDialogVisible.value = true
  orderLoading.value = true
  try {
    const res = await db.collection('orders').where({ itemName: item.name }).limit(500).get()
    orderList.value = (res.data || []).sort((a,b) => b.createTime - a.createTime)
  } catch (error) {} finally { orderLoading.value = false }
}

const openUploadDialog = () => dialogVisible.value = true
const handleFileChange = (file) => selectedFile.value = file.raw
const handleFileRemove = () => selectedFile.value = null

const resetForm = () => {
  form.value = { type: 'merch', name: '', cost: 50, stock: 10 }
  selectedFile.value = null
  if (uploadRef.value) uploadRef.value.clearFiles()
}

const submitUpload = async () => {
  if (!form.value.name) return ElMessage.warning('请输入名称')
  if (form.value.type === 'material' && !selectedFile.value) return ElMessage.error('电子资料必须上传文件！')
  uploading.value = true
  try {
    let fileUrl = ''
    if (selectedFile.value) {
      const file = selectedFile.value
      const path = `shop/${Date.now()}_${file.name}`
      const uploadRes = await app.uploadFile({ cloudPath: path, filePath: file })
      const urlRes = await app.getTempFileURL({ fileList: [uploadRes.fileID] })
      fileUrl = urlRes.fileList[0].tempFileURL
    }
    await db.collection('shop').add({
      name: form.value.name, type: form.value.type, cost: form.value.cost, stock: form.value.stock,
      image: form.value.type === 'merch' ? fileUrl : '', fileUrl: form.value.type === 'material' ? fileUrl : '',
      createTime: new Date().getTime()
    })
    ElMessage.success('🎉 商品已成功上架！')
    dialogVisible.value = false
    fetchShopItems()
  } catch (error) {} finally { uploading.value = false }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('下架确认吗？', '提醒', { type: 'warning' })
    loading.value = true
    await db.collection('shop').doc(id).remove()
    ElMessage.success('已下架')
    fetchShopItems()
  } catch (err) {} finally { loading.value = false }
}
</script>

<style scoped>
.admin-shop-container { padding: 15px; max-width: 1400px; margin: 0 auto; background: #f8fafc; min-height: 100vh; }
.mb-24 { margin-bottom: 24px; } .mr-5 { margin-right: 5px; } .full-width { width: 100%; }

.animate-down { animation: fadeInDown 0.6s ease-out; }
.animate-up { animation: fadeInUp 0.6s ease-out 0.1s both; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.flex-header { display: flex; justify-content: space-between; align-items: flex-end; }
.admin-badge { font-size: 11px; font-weight: 900; color: #6366f1; letter-spacing: 2px; margin-bottom: 8px; }
.page-header h2 { margin: 0 0 6px 0; color: #1e293b; font-size: 28px; font-weight: 800; }
.subtitle { margin: 0; color: #64748b; font-size: 15px; }
.premium-add-btn { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border: none; box-shadow: 0 8px 20px rgba(99,102,241,0.3); font-weight: bold; }

.premium-card { border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.02) !important; }

.modern-tabs :deep(.el-tabs__header) { border: none; background: #f1f5f9; padding: 6px; border-radius: 12px; margin-bottom: 20px; }
.modern-tabs :deep(.el-tabs__item) { border: none !important; border-radius: 8px; margin: 0 4px; height: 40px; font-weight: bold; transition: 0.3s; }
.modern-tabs :deep(.el-tabs__item.is-active) { background: white !important; color: #4f46e5; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.tab-label { display: flex; align-items: center; gap: 8px; }

.img-preview-box { width: 45px; height: 45px; border-radius: 8px; overflow: hidden; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; margin: 0 auto;}
.table-img { width: 100%; height: 100%; }
.img-placeholder, .file-icon-box { font-size: 20px; }

.item-name { font-weight: 700; color: #1e293b; font-size: 14px; }
.price-badge { display: inline-flex; align-items: center; gap: 2px; padding: 2px 6px; border-radius: 6px; background: #fff1f2; color: #e11d48; font-weight: 800; font-size: 12px; }
.price-badge.purple { background: #f5f3ff; color: #7c3aed; }
.stock-tag { font-weight: bold; border: none; letter-spacing: 0.5px; }
.op-btns { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }

.premium-uploader :deep(.el-upload-dragger) { border-radius: 16px; border: 2px dashed #e2e8f0; transition: 0.3s; padding: 20px;}
.premium-uploader :deep(.el-upload-dragger:hover) { border-color: #6366f1; background: #f5f3ff; }

.order-table-wrapper { padding: 0 5px; }
.buyer-name { font-weight: 700; color: #1e293b; font-size: 13px;}
.time-text { font-size: 12px; color: #94a3b8; }

/* 📱 手机端适配 */
@media screen and (max-width: 768px) {
  .flex-header { flex-direction: column; align-items: flex-start; gap: 15px; }
  .op-btns { flex-direction: row; justify-content: flex-end; }
}
</style>