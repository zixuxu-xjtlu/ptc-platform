<template>
  <div class="course-manage-container" v-loading="loading">
    <div class="header-banner fade-in-down">
      <el-button plain round :icon="ArrowLeft" @click="goBack" class="back-btn">返回列表</el-button>
      <div class="title-area">
        <div class="title-left">
          <h1>
            {{ courseData.code }}
            <el-button type="primary" link :icon="Edit" @click="openEditCourseDialog" class="edit-course-title-btn" title="修改课程名称" />
            <el-tag effect="dark" type="danger" round class="ml-10">编辑模式</el-tag>
          </h1>
        </div>
        <el-button type="danger" :icon="Delete" @click="deleteCourse" round class="delete-course-btn">
          删除此课程
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="main-card fade-in-up">
      <el-tabs v-model="activeTab" class="custom-tabs">
        <el-tab-pane v-for="tab in tabConfigs" :key="tab.name" :name="tab.name">
          <template #label><span class="tab-label"><el-icon><component :is="tab.icon" /></el-icon> {{ tab.label }}</span></template>
          
          <div class="section-content">
            <div class="admin-bar">
              <el-button type="primary" size="small" :icon="Plus" @click="openDialog(tab.name)">添加 {{ tab.short }}</el-button>
            </div>
            
            <el-table :data="courseData[tab.name]" style="width: 100%" stripe class="premium-table">
              <el-table-column prop="title" label="资源名称" min-width="120" />
              <el-table-column prop="url" label="直链/文件地址" min-width="150" show-overflow-tooltip />
              
              <el-table-column label="下载条件" width="100" align="center" v-if="tab.name === 'materials'">
                <template #default="scope">
                  <el-tag v-if="scope.row.isFree" type="success" size="small">免费</el-tag>
                  <el-tag v-else type="warning" size="small"><el-icon><Coin/></el-icon> {{ scope.row.cost }}分</el-tag>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="100" align="center">
                <template #default="scope">
                  <el-button type="primary" size="small" :icon="Edit" circle @click="openEditDialog(tab.name, scope.$index, scope.row)" />
                  <el-button type="danger" size="small" :icon="Delete" circle @click="deleteItem(tab.name, scope.$index)" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="editCourseDialogVisible" title="修改课程名称" width="400px" custom-class="premium-dialog mobile-dialog" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="课程名称 (无限制，支持中文、空格、符号)">
          <el-input v-model="newCourseName" placeholder="例如：MTH101 高等数学 (上)" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editCourseDialogVisible = false" round :disabled="courseEditLoading">取消</el-button>
        <el-button type="primary" @click="submitCourseNameEdit" :loading="courseEditLoading" round>保存修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="`添加新${currentTypeName}`" width="90%" custom-class="premium-dialog mobile-dialog" :close-on-click-modal="false">
      <el-form :model="resourceForm" label-position="top">
        <el-form-item label="资源标题 (必填)">
          <el-input v-model="resourceForm.title" placeholder="例如：期中复习考点总结.pdf" />
        </el-form-item>
        
        <el-form-item label="资源来源" v-if="currentType === 'materials'">
          <el-radio-group v-model="resourceForm.uploadMode" size="small">
            <el-radio-button label="file">上传真实文件</el-radio-button>
            <el-radio-button label="url">填写外部直链</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="文件直链 / 外部地址 (必填)" v-if="currentType !== 'materials' || resourceForm.uploadMode === 'url'">
          <el-input v-model="resourceForm.url" placeholder="请填入外部视频、网盘的链接" />
        </el-form-item>

        <el-form-item label="选择本地文件" v-if="currentType === 'materials' && resourceForm.uploadMode === 'file'">
          <el-upload
            class="custom-uploader"
            drag
            :limit="1"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :on-exceed="handleExceed"
            ref="uploadRef"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip text-muted">支持 PDF, Word, 视频等，单文件 &lt; 500MB</div>
            </template>
          </el-upload>
        </el-form-item>

        <div v-if="currentType === 'materials'" class="points-setting-box">
          <el-form-item label="下载权限设置" style="margin-bottom: 0;">
            <div class="permission-row">
              <el-switch 
                v-model="resourceForm.isFree" 
                active-text="免费下载" 
                inactive-text="需积分"
                active-color="#13ce66"
                inactive-color="#e6a23c"
              />
              <transition name="el-fade-in-linear">
                <el-input-number 
                  v-if="!resourceForm.isFree" 
                  v-model="resourceForm.cost" 
                  :min="1" :max="1000" 
                  size="small" 
                  placeholder="积分数" 
                />
              </transition>
            </div>
          </el-form-item>
        </div>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false" round :disabled="submitLoading">取消</el-button>
        <el-button type="primary" @click="submitResource" :loading="submitLoading" round>确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="快速编辑资源" width="90%" custom-class="premium-dialog mobile-dialog" :close-on-click-modal="false">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="资源标题 (必填)">
          <el-input v-model="editForm.title" />
        </el-form-item>

        <div v-if="editingType === 'materials'" class="points-setting-box">
          <el-form-item label="下载权限设置" style="margin-bottom: 0;">
            <div class="permission-row">
              <el-switch 
                v-model="editForm.isFree" 
                active-text="免费下载" 
                inactive-text="需积分"
                active-color="#13ce66"
                inactive-color="#e6a23c"
              />
              <transition name="el-fade-in-linear">
                <el-input-number 
                  v-if="!editForm.isFree" 
                  v-model="editForm.cost" 
                  :min="1" :max="1000" 
                  size="small" 
                  placeholder="积分数" 
                />
              </transition>
            </div>
          </el-form-item>
        </div>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false" round :disabled="editLoading">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editLoading" round>保存修改</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, VideoCamera, FolderOpened, EditPen, Coin, UploadFilled, Plus, Delete, Edit } from '@element-plus/icons-vue'
import { app, db } from '../../cloudbase' 

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const activeTab = ref('materials')
const courseData = ref({ links: [], materials: [], exams: [] })
let docId = ''

const goBack = () => {
  router.back()
}

const tabConfigs = [
  { name: 'links', label: '复习课链接', short: '视频', icon: VideoCamera },
  { name: 'materials', label: '相关资料', short: '课件资料', icon: FolderOpened },
  { name: 'exams', label: '往年真题', short: '真题考卷', icon: EditPen }
]

onMounted(async () => {
  try {
    const res = await db.collection('courses').where({ code: route.params.code }).get()
    if (res.data && res.data.length > 0) {
      courseData.value = res.data[0]
      docId = courseData.value._id
    }
  } finally { loading.value = false }
})

// ============== 🌟 新增：编辑课程名称逻辑 ==============
const editCourseDialogVisible = ref(false)
const newCourseName = ref('')
const courseEditLoading = ref(false)

const openEditCourseDialog = () => {
  newCourseName.value = courseData.value.code
  editCourseDialogVisible.value = true
}

const submitCourseNameEdit = async () => {
  const finalName = newCourseName.value.trim() // 只去除首尾空格，保留中间的空格
  if (!finalName) return ElMessage.warning('课程名称不能为空')
  
  courseEditLoading.value = true
  try {
    // 1. 更新数据库中的课程 code（你的表里课程名字对应的字段是 code）
    await db.collection('courses').doc(docId).update({
      code: finalName
    })
    
    // 2. 更新本地显示
    courseData.value.code = finalName
    ElMessage.success('课程名称修改成功！')
    editCourseDialogVisible.value = false
    
    // 3. 智能替换当前路由的参数 (防止用户刷新后变成 404)
    router.replace({ params: { ...route.params, code: finalName } })
  } catch (err) {
    console.error('修改课程名称失败:', err)
    ElMessage.error('修改失败，请检查网络')
  } finally {
    courseEditLoading.value = false
  }
}

// ============== 删除课程逻辑 ==============
const deleteCourse = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要永久删除课程 【${courseData.value.code}】 及其包含的所有资料吗？此操作不可恢复！`,
      '危险操作确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error',
        center: true
      }
    )

    loading.value = true
    await db.collection('courses').doc(docId).remove()
    
    ElMessage.success('课程已彻底删除')
    router.back()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除课程失败:', err)
      ElMessage.error('删除失败，请检查网络或权限')
    }
  } finally {
    loading.value = false
  }
}

// ============== 资源添加逻辑 ==============
const dialogVisible = ref(false)
const currentType = ref('materials')
const submitLoading = ref(false)
const uploadRef = ref(null)

const resourceForm = ref({ title: '', url: '', isFree: true, cost: 10, uploadMode: 'file', file: null })
const currentTypeName = computed(() => tabConfigs.find(t => t.name === currentType.value)?.short || '')

const openDialog = (type) => {
  currentType.value = type
  resourceForm.value = { title: '', url: '', isFree: true, cost: 10, uploadMode: 'file', file: null }
  if (uploadRef.value) uploadRef.value.clearFiles()
  dialogVisible.value = true
}

const handleFileChange = (file) => { resourceForm.value.file = file.raw }
const handleFileRemove = () => { resourceForm.value.file = null }
const handleExceed = (files) => {
  if (uploadRef.value) { uploadRef.value.clearFiles(); uploadRef.value.handleStart(files[0]) }
}

const submitResource = async () => {
  if (!resourceForm.value.title) return ElMessage.warning('请填写资源标题')
  let finalUrl = resourceForm.value.url

  if (currentType.value === 'materials' && resourceForm.value.uploadMode === 'file') {
    if (!resourceForm.value.file) return ElMessage.warning('请选择要上传的文件')
  } else {
    if (!finalUrl) return ElMessage.warning('请填写文件链接')
  }

  submitLoading.value = true
  const _ = db.command

  try {
    if (currentType.value === 'materials' && resourceForm.value.uploadMode === 'file') {
      ElMessage.info({ message: '正在安全上传文件至云存储，请勿关闭弹窗...', duration: 0 })
      const file = resourceForm.value.file
      const cloudPath = `course_materials/${courseData.value.code}/${Date.now()}_${file.name}`
      const uploadRes = await app.uploadFile({ cloudPath: cloudPath, filePath: file })
      const urlRes = await app.getTempFileURL({ fileList: [uploadRes.fileID] })
      finalUrl = urlRes.fileList[0].tempFileURL
      ElMessage.closeAll() 
    }

    const newItem = { title: resourceForm.value.title, url: finalUrl, addTime: new Date().getTime() }
    if (currentType.value === 'materials') {
      newItem.isFree = resourceForm.value.isFree
      newItem.cost = resourceForm.value.isFree ? 0 : resourceForm.value.cost
    }

    await db.collection('courses').doc(docId).update({ [currentType.value]: _.push(newItem) })
    if (!courseData.value[currentType.value]) courseData.value[currentType.value] = []
    courseData.value[currentType.value].push(newItem)
    ElMessage.success('添加成功！')
    dialogVisible.value = false
  } catch (err) { 
    ElMessage.closeAll()
    ElMessage.error('上传失败，请检查网络') 
  } finally { submitLoading.value = false }
}

// ============== 资源编辑逻辑 ==============
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editingType = ref('')
const editingIndex = ref(-1)
const editForm = ref({ title: '', isFree: true, cost: 10 })

const openEditDialog = (type, index, row) => {
  editingType.value = type
  editingIndex.value = index
  editForm.value = {
    title: row.title,
    isFree: row.isFree !== undefined ? row.isFree : true,
    cost: row.cost || 10
  }
  editDialogVisible.value = true
}

const submitEdit = async () => {
  if (!editForm.value.title) return ElMessage.warning('请填写资源标题')
  editLoading.value = true

  try {
    const currentArr = [...courseData.value[editingType.value]]
    currentArr[editingIndex.value].title = editForm.value.title
    if (editingType.value === 'materials') {
      currentArr[editingIndex.value].isFree = editForm.value.isFree
      currentArr[editingIndex.value].cost = editForm.value.isFree ? 0 : editForm.value.cost
    }

    await db.collection('courses').doc(docId).update({
      [editingType.value]: currentArr
    })

    courseData.value[editingType.value] = currentArr
    ElMessage.success('修改已保存')
    editDialogVisible.value = false
  } catch (err) {
    console.error('编辑保存失败:', err)
    ElMessage.error('保存失败，请检查网络连接')
  } finally {
    editLoading.value = false
  }
}

// ============== 删除单项资源 ==============
const deleteItem = async (type, index) => {
  try {
    await ElMessageBox.confirm('确定要删除这份资料吗？', '警告', { type: 'warning' })
    const newArr = courseData.value[type].filter((_, i) => i !== index)
    await db.collection('courses').doc(docId).update({ [type]: newArr })
    courseData.value[type] = newArr
    ElMessage.success('已移除')
  } catch (err) {}
}
</script>

<style scoped>
.fade-in-down { animation: fadeInDown 0.6s ease; }
.fade-in-up { animation: fadeInUp 0.6s ease; }
@keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }

.course-manage-container { padding: 10px; max-width: 1200px; margin: 0 auto; }
.header-banner { background: #303133; border-radius: 16px; padding: 30px; color: white; margin-bottom: 25px; position: relative; box-shadow: 0 10px 20px rgba(0,0,0,0.1);}
.back-btn { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.3);}
.back-btn:hover { background: white; color: #303133; }

.title-area { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; }
.title-left h1 { margin: 0; font-size: 36px; display: flex; align-items: center;}

/* 🌟 编辑标题的按钮样式 */
.edit-course-title-btn { margin-left: 12px; font-size: 22px; color: rgba(255,255,255,0.7); }
.edit-course-title-btn:hover { color: #409EFF; }
.ml-10 { margin-left: 15px; }

.delete-course-btn { box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3); }

.main-card { border-radius: 16px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.03) !important; min-height: 500px;}
.tab-label { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: bold;}
:deep(.el-tabs__item) { height: 55px; line-height: 55px; padding: 0 30px;}
:deep(.el-tabs__item.is-active) { color: #409EFF; }
:deep(.el-tabs__active-bar) { height: 3px; border-radius: 3px; }
.section-content { padding: 20px 10px; }
.admin-bar { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #ebeef5;}

.premium-table { border-radius: 10px; border: 1px solid #ebeef5; }
:deep(.el-table th.el-table__cell) { background: #f8f9fa !important; color: #34495e; font-weight: 600;}

.text-muted { color: #909399; font-size: 12px; }

.custom-uploader :deep(.el-upload-dragger) { border-radius: 12px; background-color: #fafbfc; transition: all 0.3s; padding: 20px;}
.custom-uploader :deep(.el-upload-dragger:hover) { background-color: #f4f9ff; border-color: #409EFF; }
.points-setting-box { background: #fffcf5; padding: 15px; border-radius: 8px; border: 1px dashed #e6a23c; margin-top: 15px;}
.permission-row { display: flex; gap: 20px; align-items: center; }

/* 📱 手机端适配 */
@media screen and (max-width: 768px) {
  .header-banner { padding: 20px 15px; }
  .title-area { flex-direction: column; align-items: flex-start; gap: 15px; }
  .title-left h1 { font-size: 24px; }
  .edit-course-title-btn { font-size: 18px; margin-left: 8px; }
  .back-btn { top: 10px; right: 10px; padding: 5px 10px; font-size: 12px;}
  :deep(.el-tabs__item) { padding: 0 10px; font-size: 13px; }
  .permission-row { flex-direction: column; align-items: flex-start; gap: 10px;}
  .mobile-dialog { max-width: 500px; }
}
</style>