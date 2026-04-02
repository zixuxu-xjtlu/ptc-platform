<template>
  <div class="quiz-manage-container">
    <div class="page-header mb-24 fade-in-down">
      <div class="header-left">
        <h2>🧠 智学题库与套卷管理</h2>
        <p class="subtitle">管理学科套卷、配置 LaTeX 题目解析，实时追踪全站正确率</p>
      </div>
      <el-button v-if="activeTab === 'questions'" type="primary" size="large" round class="publish-btn shadow-glow" @click="handleOpenQuestionForm()">
        <el-icon class="mr-1"><Plus /></el-icon> 新增题目
      </el-button>
      <el-button v-if="activeTab === 'sets'" type="primary" size="large" round class="publish-btn shadow-glow" @click="handleOpenSetForm()">
        <el-icon class="mr-1"><Plus /></el-icon> 新增套卷
      </el-button>
    </div>

    <el-tabs v-model="activeTab" class="premium-tabs fade-in-up">
      <el-tab-pane name="sets">
        <template #label><span class="tab-label"><el-icon><Folder /></el-icon> 学科套卷管理</span></template>
        <el-card shadow="never" class="main-card">
          <el-table :data="quizSets" v-loading="loading" stripe class="modern-table" :row-key="row => row._id">
            <el-table-column prop="subject" label="所属学科" width="150">
              <template #default="scope">
                <el-tag effect="dark">{{ scope.row.subject }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="套卷标题" min-width="200" />
            <el-table-column label="满分积分奖励" width="120" align="center">
              <template #default="scope">
                <span class="text-warning font-bold">+{{ scope.row.rewardPoints || 20 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="right">
              <template #default="scope">
                <el-button type="primary" link icon="Edit" @click="handleOpenSetForm(scope.row)">编辑</el-button>
                <el-button type="danger" link icon="Delete" @click="handleDeleteSet(scope.row._id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane name="questions">
        <template #label><span class="tab-label"><el-icon><Document /></el-icon> 题目与解析池</span></template>
        <el-card shadow="never" class="main-card">
          <el-table :data="questionsWithStats" v-loading="loading" stripe class="modern-table" :row-key="row => row._id">
            
            <el-table-column label="所属套卷" width="180" show-overflow-tooltip>
              <template #default="scope">
                <el-tag size="small" type="info" effect="plain">{{ getSetName(scope.row.quizSetId) }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="题型" width="90">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.type === 'choice' ? 'primary' : 'warning'" effect="plain">
                  {{ scope.row.type === 'choice' ? '选择题' : '填空题' }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column label="题干 (原始文本)" min-width="220" show-overflow-tooltip>
              <template #default="scope">
                <span class="text-gray-600 font-mono text-sm">{{ scope.row.content }}</span>
              </template>
            </el-table-column>

            <el-table-column label="作答人数" width="90" align="center">
              <template #default="scope">
                <span class="font-bold text-gray-700">{{ scope.row.stats.total }}</span>
              </template>
            </el-table-column>

            <el-table-column label="正确率" width="140">
              <template #default="scope">
                <div class="flex items-center gap-2">
                  <el-progress 
                    :percentage="scope.row.stats.accuracy" 
                    :color="customColors" 
                    :stroke-width="8" 
                    :show-text="false" 
                    class="flex-1"
                  />
                  <span class="text-xs font-bold w-10">{{ scope.row.stats.accuracy }}%</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="120" align="right">
              <template #default="scope">
                <el-button type="primary" link icon="Edit" @click="handleOpenQuestionForm(scope.row)">编辑</el-button>
                <el-button type="danger" link icon="Delete" @click="handleDeleteQuestion(scope.row._id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="setFormVisible" :title="isEditingSet ? '编辑套卷' : '新增学科套卷'" width="500px">
      <el-form label-position="top">
        <el-form-item label="所属学科名称" required>
          <el-input v-model="setFormData.subject" placeholder="例如：高等数学、大学物理..." />
          <div class="text-xs text-gray-400 mt-1">注：若输入全新学科名，系统会自动在前台生成该学科的新卡片。</div>
        </el-form-item>
        <el-form-item label="套卷标题" required>
          <el-input v-model="setFormData.title" placeholder="例如：第一章 函数与极限 每周一测" />
        </el-form-item>
        <el-form-item label="及格(60分)奖励积分">
          <el-input-number v-model="setFormData.rewardPoints" :min="0" :max="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="setFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveSet">保存套卷</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="formVisible" 
      :title="isEditing ? '编辑题目' : '新增题目'" 
      width="900px" 
      custom-class="latex-dialog"
      :close-on-click-modal="false"
      top="5vh"
    >
      <div class="editor-layout">
        <div class="editor-pane pr-4 border-r border-gray-100">
          <el-form label-position="top">
            
            <el-form-item label="归属套卷" required>
              <el-select v-model="formData.quizSetId" placeholder="请选择这道题属于哪套卷子" class="w-full">
                <el-option v-for="set in quizSets" :key="set._id" :label="`[${set.subject}] ${set.title}`" :value="set._id" />
              </el-select>
            </el-form-item>

            <el-form-item label="题目类型">
              <el-radio-group v-model="formData.type" @change="handleTypeChange">
                <el-radio label="choice">选择题</el-radio>
                <el-radio label="fill">填空题</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="题干内容 (支持 LaTeX, 建议用 $$ 包裹公式)">
              <el-input v-model="formData.content" type="textarea" :rows="4" placeholder="例如: 求方程 $$x^2 + 2x + 1 = 0$$ 的解。" @input="triggerPreview" />
            </el-form-item>

            <template v-if="formData.type === 'choice'">
              <el-form-item label="配置选项 (支持 LaTeX)">
                <div v-for="(opt, index) in formData.options" :key="index" class="flex gap-2 mb-2 items-center w-full">
                  <el-tag effect="dark" class="w-10 text-center">{{ opt.label }}</el-tag>
                  <el-input v-model="opt.text" placeholder="选项内容" class="flex-1" @input="triggerPreview" />
                  <el-button type="danger" link icon="Remove" @click="removeOption(index)" :disabled="formData.options.length <= 2" />
                </div>
                <el-button type="primary" plain size="small" icon="Plus" @click="addOption" class="mt-2 w-full">添加选项</el-button>
              </el-form-item>
            </template>

            <el-form-item label="正确答案" required>
              <el-select v-if="formData.type === 'choice'" v-model="formData.correctAnswer" placeholder="请选择正确选项" class="w-full">
                <el-option v-for="opt in formData.options" :key="opt.label" :label="`选项 ${opt.label}`" :value="opt.label" />
              </el-select>
              <el-input v-else v-model="formData.correctAnswer" placeholder="请输入标准答案 (精确匹配)" />
            </el-form-item>

            <el-form-item label="详细解析 (展示给用户的讲解)">
              <el-input v-model="formData.explanation" type="textarea" :rows="4" placeholder="例如: 根据求根公式，可知 $$x = -1$$。" @input="triggerPreview" />
            </el-form-item>
          </el-form>
        </div>

        <div class="preview-pane pl-4 bg-gray-50 rounded-lg p-4 h-full overflow-y-auto">
          <h4 class="text-gray-400 mb-4 flex items-center gap-2"><el-icon><View /></el-icon> 实时渲染预览</h4>
          
          <div class="preview-card bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div class="mb-4">
              <el-tag size="small" :type="formData.type === 'choice' ? 'primary' : 'warning'" class="mr-2">
                {{ formData.type === 'choice' ? '选择题' : '填空题' }}
              </el-tag>
              <span class="math-preview" v-html="formData.content || '暂无题干'"></span>
            </div>

            <div v-if="formData.type === 'choice'" class="flex flex-col gap-2 ml-4">
              <div v-for="opt in formData.options" :key="opt.label" class="flex items-start gap-2">
                <el-radio disabled :label="opt.label">{{ '' }}</el-radio>
                <span class="font-bold mr-1">{{ opt.label }}.</span>
                <span class="math-preview" v-html="opt.text || '...'"></span>
              </div>
            </div>

            <div v-if="formData.type === 'fill'" class="ml-4">
              <el-input disabled placeholder="填空区" class="w-48" />
            </div>

            <div class="mt-6 pt-4 border-t border-dashed border-gray-300">
              <div class="text-sm font-bold text-gray-700 mb-2">💡 详细解析预览：</div>
              <div class="math-preview text-gray-600 text-sm leading-relaxed" v-html="formData.explanation || '暂无解析'"></div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveQuestion">保存题目</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View, Remove, Folder, Document } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const activeTab = ref('sets')
const loading = ref(true)
const submitting = ref(false)

// 数据集合
const quizSets = ref([])
const rawQuestions = ref([])
const questionsWithStats = ref([])

// 进度条颜色
const customColors = [
  { color: '#f56c6c', percentage: 40 },
  { color: '#e6a23c', percentage: 70 },
  { color: '#5cb87a', percentage: 100 }
]

onMounted(() => {
  fetchAllData()
})

const fetchAllData = async () => {
  loading.value = true
  try {
    // 1. 获取套卷
    const setRes = await db.collection('quiz_sets').orderBy('createTime', 'desc').get()
    quizSets.value = setRes.data || []

    // 2. 获取题目
    const qRes = await db.collection('questions').orderBy('createTime', 'desc').get()
    rawQuestions.value = qRes.data || []

    // 3. 获取答题记录并计算统计
    const rRes = await db.collection('quiz_records').get()
    const allRecords = rRes.data || []

    questionsWithStats.value = rawQuestions.value.map(q => {
      let totalAnswers = 0
      let correctAnswers = 0
      
      allRecords.forEach(record => {
        const userAns = record.answers?.[q._id]
        if (userAns !== undefined && userAns !== '') {
          totalAnswers++
          if (userAns.toString().trim().toLowerCase() === q.correctAnswer.toString().trim().toLowerCase()) {
            correctAnswers++
          }
        }
      })

      const accuracy = totalAnswers === 0 ? 0 : Math.round((correctAnswers / totalAnswers) * 100)
      return { ...q, stats: { total: totalAnswers, accuracy: accuracy } }
    })

  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// 辅助：获取套卷名称
const getSetName = (setId) => {
  const set = quizSets.value.find(s => s._id === setId)
  return set ? `[${set.subject}] ${set.title}` : '未知套卷(可能已删除)'
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

// ================= 1. 套卷逻辑 =================
const setFormVisible = ref(false)
const isEditingSet = ref(false)
const setFormData = ref({ _id: '', subject: '', title: '', rewardPoints: 20 })

const handleOpenSetForm = (set = null) => {
  if (set) {
    isEditingSet.value = true
    setFormData.value = { ...set }
  } else {
    isEditingSet.value = false
    setFormData.value = { _id: '', subject: '', title: '', rewardPoints: 20 }
  }
  setFormVisible.value = true
}

const saveSet = async () => {
  if (!setFormData.value.subject || !setFormData.value.title) return ElMessage.warning('请填写完整')
  submitting.value = true
  try {
    const payload = {
      subject: setFormData.value.subject,
      title: setFormData.value.title,
      rewardPoints: setFormData.value.rewardPoints,
      updateTime: new Date().getTime()
    }
    if (isEditingSet.value) {
      await db.collection('quiz_sets').doc(setFormData.value._id).update(payload)
      ElMessage.success('套卷修改成功')
    } else {
      payload.createTime = new Date().getTime()
      await db.collection('quiz_sets').add(payload)
      ElMessage.success('套卷创建成功')
    }
    setFormVisible.value = false
    fetchAllData()
  } catch (error) { ElMessage.error('保存失败') } finally { submitting.value = false }
}

const handleDeleteSet = (id) => {
  ElMessageBox.confirm('确定要删除该套卷吗？其下的题目仍会保留在数据库中。', '删除警告', { type: 'warning' })
    .then(async () => {
      try {
        await db.collection('quiz_sets').doc(id).remove()
        ElMessage.success('已删除')
        fetchAllData()
      } catch (e) { ElMessage.error('删除失败') }
    }).catch(() => {})
}


// ================= 2. 题目表单与预览逻辑 =================
const formVisible = ref(false)
const isEditing = ref(false)
const formData = ref({
  _id: '', quizSetId: '', type: 'choice', content: '',
  options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
  correctAnswer: '', explanation: ''
})

const handleOpenQuestionForm = (q = null) => {
  if (quizSets.value.length === 0) {
    return ElMessage.warning('请先去“套卷管理”中创建一个套卷！')
  }
  if (q) {
    isEditing.value = true
    formData.value = JSON.parse(JSON.stringify(q))
    if (!formData.value.options) formData.value.options = []
  } else {
    isEditing.value = false
    formData.value = {
      _id: '', quizSetId: quizSets.value[0]._id, type: 'choice', content: '', // 默认选中第一个套卷
      options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
      correctAnswer: '', explanation: ''
    }
  }
  formVisible.value = true
  triggerPreview()
}

const addOption = () => {
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const nextLabel = labels[formData.value.options.length] || '?'
  formData.value.options.push({ label: nextLabel, text: '' })
}
const removeOption = (index) => {
  formData.value.options.splice(index, 1)
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  formData.value.options.forEach((opt, i) => opt.label = labels[i])
}
const handleTypeChange = () => { formData.value.correctAnswer = '' }

// 🌟 强化版防抖公式渲染：强制清除 MathJax 缓存
let previewTimeout = null
const triggerPreview = () => {
  if (previewTimeout) clearTimeout(previewTimeout)
  previewTimeout = setTimeout(() => {
    nextTick(() => {
      if (window.MathJax && window.MathJax.typesetClear) {
        window.MathJax.typesetClear() // 清除记忆，防止不渲染
      }
      if (window.reMath) window.reMath()
    })
  }, 400)
}

const saveQuestion = async () => {
  if (!formData.value.quizSetId || !formData.value.content || !formData.value.correctAnswer) {
    return ElMessage.warning('归属套卷、题干和正确答案不能为空')
  }
  submitting.value = true
  const payload = {
    quizSetId: formData.value.quizSetId,
    type: formData.value.type,
    content: formData.value.content,
    correctAnswer: formData.value.correctAnswer,
    explanation: formData.value.explanation,
    updateTime: new Date().getTime()
  }
  if (formData.value.type === 'choice') payload.options = formData.value.options

  try {
    if (isEditing.value) {
      await db.collection('questions').doc(formData.value._id).update(payload)
      ElMessage.success('修改成功')
    } else {
      payload.createTime = new Date().getTime()
      await db.collection('questions').add(payload)
      ElMessage.success('新增成功')
    }
    formVisible.value = false
    fetchAllData()
  } catch (error) { ElMessage.error('保存失败') } finally { submitting.value = false }
}

const handleDeleteQuestion = (id) => {
  ElMessageBox.confirm('确定要删除这道题吗？', '删除确认', { type: 'warning' })
    .then(async () => {
      try {
        await db.collection('questions').doc(id).remove()
        ElMessage.success('已删除')
        fetchAllData()
      } catch (e) { ElMessage.error('删除失败') }
    }).catch(() => {})
}
</script>

<style scoped>
.quiz-manage-container { padding: 10px; max-width: 1300px; margin: 0 auto; }
.fade-in-down { animation: fadeInDown 0.6s ease; }
.fade-in-up { animation: fadeInUp 0.6s ease; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
.header-left h2 { margin: 0 0 8px 0; color: #2c3e50; font-size: 26px; font-weight: 800;}
.subtitle { margin: 0; color: #7f8c8d; font-size: 15px; }
.publish-btn { font-weight: bold; padding: 10px 24px; box-shadow: 0 4px 15px rgba(64,158,255,0.3); }

/* Tab 样式 */
.premium-tabs { background: transparent; border: none; margin-top: 10px;}
:deep(.el-tabs__nav-wrap::after) { display: none; }
:deep(.el-tabs__header) { margin-bottom: 20px; }
.tab-label { display: flex; align-items: center; gap: 6px; font-weight: bold; font-size: 16px;}

.main-card { border-radius: 16px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.03) !important; background: #fff;}
.modern-table { border-radius: 12px; overflow: hidden; }

/* ================= 编辑器弹窗样式 ================= */
:deep(.latex-dialog .el-dialog__body) { padding: 0; height: 65vh; }
.editor-layout { display: flex; height: 100%; }
.editor-pane { flex: 1; padding: 20px; overflow-y: auto; }
.preview-pane { flex: 1; padding: 20px; background-color: #f8fafc; border-left: 1px solid #f1f5f9; }

.math-preview { display: inline-block; word-break: break-all; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }

/* 实用工具类 */
.flex { display: flex; }
.items-center { align-items: center; }
.gap-2 { gap: 8px; }
.w-full { width: 100%; }

/* 📱 手机端适配 */
@media (max-width: 768px) {
  .editor-layout { flex-direction: column; }
  .editor-pane { border-right: none; border-bottom: 1px solid #f1f5f9; height: 50%; }
  .preview-pane { border-left: none; height: 50%; }
}
</style>