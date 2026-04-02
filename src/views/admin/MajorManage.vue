<template>
  <div class="admin-major-container" v-loading="loading">
    <el-card shadow="never" class="premium-card">
      <template #header>
        <div class="card-header">
          <div class="header-title"><el-icon class="mr-1"><Guide /></el-icon> 选专业数据管理</div>
          <el-button type="primary" :icon="Plus" @click="openAddDialog" round>新增专业</el-button>
        </div>
      </template>

      <el-table :data="majorList" stripe style="width: 100%" class="premium-table">
        <el-table-column prop="cnName" label="专业中文名" min-width="150" fixed="left">
          <template #default="scope">
            <strong>{{ scope.row.cnName }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="enName" label="英文名" min-width="250" show-overflow-tooltip />
        <el-table-column prop="sem1" label="第一学期先修课" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" :icon="Edit" circle @click="openEditDialog(scope.row)" />
            <el-button type="danger" size="small" :icon="Delete" circle @click="deleteMajor(scope.row)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑专业信息' : '新增专业'" 
      width="800px" 
      custom-class="premium-dialog mobile-dialog"
      :close-on-click-modal="false"
      top="5vh"
    >
      <el-tabs v-model="activeTab" class="custom-tabs">
        <el-tab-pane label="基础信息" name="basic">
          <el-form :model="form" label-position="top">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="中文名称 (必填)">
                  <el-input v-model="form.cnName" placeholder="例如：计算机科学与技术" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="英文名称">
                  <el-input v-model="form.enName" placeholder="例如：COMPUTER SCIENCE" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="学校官网链接">
              <el-input v-model="form.url" placeholder="以 https:// 开头" />
            </el-form-item>
            <el-form-item label="第一学期先修课">
              <el-input v-model="form.sem1" type="textarea" :rows="2" placeholder="无则填无" />
            </el-form-item>
            <el-form-item label="第二学期先修课">
              <el-input v-model="form.sem2" type="textarea" :rows="2" placeholder="无则填无" />
            </el-form-item>
            <el-form-item label="额外录取要求">
              <el-input v-model="form.extra" type="textarea" :rows="2" placeholder="无则填无" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="历年录取分数线" name="scores">
          <el-alert title="修改图表绑定的年份和分数" type="info" show-icon :closable="false" style="margin-bottom: 15px;" />
          <el-row :gutter="15" v-for="(item, index) in form.admissionScores" :key="'score'+index" class="mb-15">
            <el-col :span="10">
              <el-input v-model="item.year" placeholder="年份 (如 2023)">
                <template #prepend>年份</template>
              </el-input>
            </el-col>
            <el-col :span="14">
              <el-input-number v-model="item.score" :min="0" :max="1000" label="分数" style="width: 100%;" />
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="去年奖学金线" name="scholarships">
          <el-alert title="各年级 5%、10%、25% 比例的奖学金分数线" type="warning" show-icon :closable="false" style="margin-bottom: 15px;" />
          <div v-for="(item, index) in form.scholarships" :key="'sch'+index" class="scholarship-box mb-15">
            <div class="year-label">{{ item.year }}</div>
            <el-row :gutter="10">
              <el-col :span="8">
                <div class="sch-item"><span class="sch-tag s5">5%</span><el-input-number v-model="item.s5" :min="0" size="small" controls-position="right" /></div>
              </el-col>
              <el-col :span="8">
                <div class="sch-item"><span class="sch-tag s10">10%</span><el-input-number v-model="item.s10" :min="0" size="small" controls-position="right" /></div>
              </el-col>
              <el-col :span="8">
                <div class="sch-item"><span class="sch-tag s25">25%</span><el-input-number v-model="item.s25" :min="0" size="small" controls-position="right" /></div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="dialogVisible = false" round :disabled="saveLoading">取消</el-button>
        <el-button type="primary" @click="saveMajor" :loading="saveLoading" round>保存更改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Guide } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const loading = ref(true)
const majorList = ref([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const activeTab = ref('basic')
const saveLoading = ref(false)
let currentId = ''

// 🌟 初始化时：录取线设为 2023 格式，奖学金线设为 大一 格式
const getInitialForm = () => ({
  cnName: '', enName: '', url: '', sem1: '', sem2: '', extra: '',
  admissionScores: [{ year: '2023', score: 0 }, { year: '2024', score: 0 }, { year: '2025', score: 0 }],
  scholarships: [
    { year: '大一', s5: 0, s10: 0, s25: 0 },
    { year: '大二', s5: 0, s10: 0, s25: 0 },
    { year: '大三', s5: 0, s10: 0, s25: 0 }
  ]
})
const form = ref(getInitialForm())

const fetchMajors = async () => {
  loading.value = true
  try {
    const res = await db.collection('majors').limit(100).get()
    majorList.value = res.data
  } catch (err) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchMajors)

const openAddDialog = () => {
  isEdit.value = false
  form.value = getInitialForm()
  activeTab.value = 'basic'
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  currentId = row._id
  form.value = JSON.parse(JSON.stringify(row))
  
  if (!form.value.admissionScores || form.value.admissionScores.length === 0) {
      form.value.admissionScores = getInitialForm().admissionScores
  }

  // 🌟 老数据兼容：只针对奖学金线转换为大一大二大三
  if (!form.value.scholarships || form.value.scholarships.length === 0) {
      form.value.scholarships = getInitialForm().scholarships
  } else if (form.value.scholarships[0].year === '2023') {
      form.value.scholarships[0].year = '大一'
      form.value.scholarships[1].year = '大二'
      form.value.scholarships[2].year = '大三'
  }

  activeTab.value = 'basic'
  dialogVisible.value = true
}

const saveMajor = async () => {
  if (!form.value.cnName) return ElMessage.warning('中文名称为必填项')
  saveLoading.value = true
  
  try {
    const dataToSave = { ...form.value }
    delete dataToSave._id 

    if (isEdit.value) {
      await db.collection('majors').doc(currentId).update(dataToSave)
      ElMessage.success('修改成功')
    } else {
      await db.collection('majors').add(dataToSave)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchMajors()
  } catch (error) {
    ElMessage.error('保存失败，请检查网络')
  } finally {
    saveLoading.value = false
  }
}

const deleteMajor = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要永久删除专业 【${row.cnName}】 吗？`, '危险操作确认', {
      type: 'error',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    })
    loading.value = true
    await db.collection('majors').doc(row._id).remove()
    ElMessage.success('删除成功')
    fetchMajors()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-major-container { padding: 10px; max-width: 1400px; margin: 0 auto; }
.premium-card { border-radius: 12px; border: none; box-shadow: 0 8px 20px rgba(0,0,0,0.04) !important; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 18px; font-weight: bold; display: flex; align-items: center; color: #303133; }
.mr-1 { margin-right: 8px; }

.premium-table { border-radius: 8px; border: 1px solid #ebeef5; margin-top: 10px; }
:deep(.el-table th.el-table__cell) { background: #f8f9fa !important; color: #34495e; font-weight: 600; }

.mb-15 { margin-bottom: 15px; }

.scholarship-box { background: #f8f9fa; padding: 12px 15px; border-radius: 8px; border: 1px dashed #dcdfe6; }
.year-label { font-weight: bold; margin-bottom: 10px; color: #409EFF; }
.sch-item { display: flex; align-items: center; gap: 5px; }
.sch-tag { font-size: 12px; font-weight: bold; padding: 2px 6px; border-radius: 4px; color: white; }
.sch-tag.s5 { background: #f56c6c; }
.sch-tag.s10 { background: #e6a23c; }
.sch-tag.s25 { background: #67c23a; }
:deep(.el-input-number.is-controls-right .el-input__inner) { padding-left: 5px; padding-right: 35px; }
</style>