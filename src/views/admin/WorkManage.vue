<template>
  <div class="work-manage-container">
    <div class="page-header mb-24 fade-in-down">
      <div class="header-left">
        <h2>💼 工作流统筹中枢</h2>
        <p class="subtitle">赛博 Pipeline 风格：可视化编排并行任务，全景掌控活动生命周期</p>
      </div>
      <el-button v-if="activeTab === 'templates'" type="primary" size="large" round class="publish-btn shadow-glow hover-lift" @click="handleOpenTemplateForm()">
        <el-icon class="icon-spacing"><Plus /></el-icon> 创造新流水线
      </el-button>
    </div>

    <el-tabs v-model="activeTab" class="premium-tabs fade-in-up" @tab-change="handleTabChange">
      
      <el-tab-pane name="templates">
        <template #label><span class="tab-label"><el-icon><Connection /></el-icon> 流程模板库</span></template>
        <el-card shadow="never" class="main-card">
          <el-empty v-if="templates.length === 0" description="暂无模板，点击右上角创造你的第一个流水线！" />
          <div class="grid-container">
            <div v-for="tpl in templates" :key="tpl._id" class="tpl-card group">
              <div class="tpl-card-header">
                <div>
                  <h3 class="tpl-card-title">{{ tpl.theme }}</h3>
                  <div class="tpl-card-subtitle flex-center">
                    <el-icon class="icon-spacing text-blue"><Timer /></el-icon> 
                    总周期跨度: <span class="highlight-text">{{ getMaxDays(tpl.stages) }} 天</span>
                  </div>
                </div>
                <div class="btn-group opacity-0 transition-opacity">
                  <el-button circle type="primary" plain icon="Edit" @click="handleOpenTemplateForm(tpl)" />
                  <el-button circle type="danger" plain icon="Delete" @click="deleteTemplate(tpl._id)" />
                </div>
              </div>
              
              <div class="pipeline-preview-container custom-scrollbar">
                <div class="pure-horizontal-flow">
                  <div class="pipeline-endpoint start">START</div>
                  <template v-for="(stage, sIdx) in tpl.stages" :key="sIdx">
                    <div class="pipeline-arrow-h"><el-icon><Right /></el-icon></div>
                    <div class="pipeline-stage-col-mini">
                      <div class="mini-stage-time">DDL前 {{ stage.daysBeforeEnd }} 天</div>
                      <div class="pure-vertical-col mini-gap">
                        <div v-for="task in stage.tasks" :key="task.id" class="mini-task-card" :class="getDeptColorClass(task.dept)">
                          {{ task.dept }}
                        </div>
                      </div>
                    </div>
                  </template>
                  <div class="pipeline-arrow-h"><el-icon><Right /></el-icon></div>
                  <div class="pipeline-endpoint end">END</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane name="publish">
        <template #label><span class="tab-label"><el-icon><Promotion /></el-icon> 任务发布中心</span></template>
        <el-card shadow="never" class="main-card overflow-hidden">
          <div class="layout-split min-h-60vh">
            <div class="layout-left custom-box">
              <h3 class="panel-title flex-center">
                <div class="circle-badge bg-blue">1</div>
                基础设置
              </h3>
              <el-form label-position="top" size="large">
                <el-form-item label="套用工作流模板" required>
                  <el-select v-model="publishForm.templateId" placeholder="请选择模板" class="full-width" @change="handleTemplateSelect">
                    <el-option v-for="tpl in templates" :key="tpl._id" :label="tpl.theme" :value="tpl._id" />
                  </el-select>
                </el-form-item>
                <transition name="el-fade-in">
                  <div v-if="publishForm.templateId">
                    <el-form-item label="本次具体活动全称" required>
                      <el-input v-model="publishForm.activityName" placeholder="例如：2024秋季百团大战物资筹备" />
                    </el-form-item>
                    <el-form-item label="最终落地 DDL (活动收尾日)" required>
                      <el-date-picker v-model="publishForm.finalDDL" type="datetime" placeholder="选择活动的最终结束时间" class="full-width" @change="calculatePublishDDLs" />
                    </el-form-item>
                    <el-button type="primary" round class="full-width margin-top-lg shadow-glow hover-lift" size="large" @click="submitPublish" :loading="submitting">
                      🚀 确认发布任务链
                    </el-button>
                  </div>
                </transition>
              </el-form>
            </div>

            <div class="layout-right custom-box custom-box-white relative">
              <h3 class="panel-title flex-center relative z-10">
                <div class="circle-badge bg-green">2</div>
                可视化节点派发 (Pipeline上帝视角)
              </h3>
              
              <el-empty v-if="!publishForm.templateId" description="请先在左侧选择模板" />
              <el-empty v-else-if="!publishForm.finalDDL" description="请选择最终DDL以生成时间轴" />
              
              <div v-else class="full-width overflow-x-auto padding-bottom-lg custom-scrollbar relative z-10">
                <div class="pure-horizontal-flow align-start padding-x padding-top">
                  <div class="pipeline-endpoint start endpoint-offset">发布日</div>

                  <template v-for="(stage, sIdx) in publishStages" :key="sIdx">
                    <div class="pipeline-arrow-horizontal arrow-offset">
                      <div class="line"></div><div class="triangle"></div>
                    </div>
                    
                    <div class="pipeline-stage-col">
                      <div class="stage-time-badge mb-4">
                        <el-icon class="icon-spacing"><Clock /></el-icon> DDL: {{ formatDate(stage.calculatedDDL) }}
                      </div>

                      <div class="pure-vertical-col gap-md full-width">
                        <div v-for="task in stage.tasks" :key="task.id" class="publish-task-card" :class="getDeptColorClass(task.dept)">
                          <div class="task-dept-badge">{{ task.dept }}</div>
                          <div class="task-content-text">{{ task.content }}</div>
                          <div class="task-reward-text">完成后奖励: +{{ task.rewardPoints }} 积分</div>
                          
                          <el-select 
                            v-model="publishForm.assignments[task.id]" 
                            multiple filterable collapse-tags collapse-tags-tooltip
                            placeholder="选择负责干事" 
                            class="full-width custom-dark-select"
                          >
                            <el-option v-for="member in getMembersByDept(task.dept)" :key="member._id" :label="member.realName" :value="member._id" />
                          </el-select>
                        </div>
                      </div>
                    </div>
                  </template>

                  <div class="pipeline-arrow-horizontal arrow-offset">
                    <div class="line"></div><div class="triangle"></div>
                  </div>
                  <div class="pipeline-endpoint end endpoint-offset shadow-red">活动结束</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane name="progress">
        <template #label><span class="tab-label"><el-icon><DataBoard /></el-icon> 进度大盘</span></template>
        <el-card shadow="never" class="main-card">
          <el-empty v-if="publishedWorks.length === 0" description="暂无进行中的活动" />
          
          <div class="grid-container-single">
            <div v-for="work in publishedWorks" :key="work._id" class="prog-card">
              
              <div class="prog-header">
                <div class="prog-title-box">
                  <h3 class="prog-title">{{ work.activityName }}</h3>
                  <div class="prog-subtitle">
                    最终DDL: <span class="text-danger margin-x-sm">{{ formatDate(work.finalDDL) }}</span> | 套用模板: {{ work.templateTheme }}
                  </div>
                </div>
                
                <div class="flex-center gap-md">
                  <div class="prog-progress-wrap">
                    <div class="prog-progress-label">总进度</div>
                    <el-progress :percentage="calculateProgress(work)" :stroke-width="12" :color="customColors" style="width: 200px;" />
                  </div>
                  <el-button type="danger" circle icon="Delete" @click="recallWork(work._id)" title="撤回整条工作流" />
                </div>
              </div>

              <div class="prog-timeline-horizontal custom-scrollbar">
                <div class="pure-horizontal-flow align-start padding-bottom-lg padding-top">
                  
                  <template v-for="(stage, sIdx) in work.stages" :key="sIdx">
                    <div v-if="sIdx > 0" class="pipeline-arrow-horizontal" style="margin-top: 20px;">
                      <div class="line"></div><div class="triangle"></div>
                    </div>

                    <div class="prog-stage-col">
                      <div class="prog-stage-time">
                        <el-icon class="icon-spacing"><Calendar /></el-icon> 节点 {{ sIdx + 1 }} 截止: {{ formatDate(stage.ddl) }}
                      </div>
                      
                      <div class="pure-vertical-col gap-md full-width mt-4">
                        <div v-for="task in stage.tasks" :key="task.id" class="prog-task-item" :class="getDeptBorderClass(task.dept)">
                          <div class="prog-task-name">
                            {{ task.content }} <span class="prog-task-dept">({{ task.dept }})</span>
                          </div>
                          
                          <div class="prog-assignee-wrap">
                            <div v-for="assignee in task.assignees" :key="assignee.userId" class="prog-assignee-pill" :class="'status-' + assignee.status">
                              <span class="truncate-name" :title="assignee.realName">{{ assignee.realName }}</span>
                              <el-icon class="icon-spacing-left">
                                <component :is="getStatusIcon(assignee.status)" />
                              </el-icon>
                            </div>
                            <span v-if="task.assignees.length === 0" class="prog-no-assignee">尚未分配干事</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                </div>
              </div>

            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="tplFormVisible" :title="isEditingTpl ? '编辑 Pipeline 流水线' : '创造新 Pipeline 流水线'" width="90%" custom-class="glass-dialog" :close-on-click-modal="false" top="5vh">
      <div class="pure-vertical-col h-[75vh]">
        <div class="custom-box flex-shrink-0 mb-4">
          <el-input v-model="tplFormData.theme" placeholder="给这个工作流模板起个响亮的名字（如：百团大战）" size="large" class="custom-title-input" />
        </div>

        <div class="custom-box custom-box-gray flex-1 overflow-x-auto custom-scrollbar">
          <div class="pure-horizontal-flow align-start padding-x padding-top-lg padding-bottom-xl">
            
            <div class="pipeline-endpoint start endpoint-offset">时间起点</div>
            
            <template v-for="(stage, sIdx) in tplFormData.stages" :key="sIdx">
              <div class="pipeline-arrow-horizontal arrow-offset relative group">
                <div class="line"></div><div class="triangle"></div>
                <el-button circle icon="Plus" type="primary" size="small" class="absolute-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md" @click="addStage(sIdx)" title="在此处插入新阶段" />
              </div>

              <div class="pipeline-stage-col relative group/col">
                <el-button type="danger" circle icon="Delete" size="small" class="absolute-top-right opacity-0 group-hover/col:opacity-100 transition-opacity z-20 shadow-md scale-75" @click="removeStage(sIdx)" title="删除整列" />
                
                <div class="stage-time-badge mb-4 shadow-sm flex-center">
                  距最终DDL还有 <el-input-number v-model="stage.daysBeforeEnd" :min="0" :max="365" size="small" class="width-sm margin-x-sm" controls-position="right" /> 天
                </div>

                <div class="pure-vertical-col gap-md full-width">
                  <div v-for="(task, tIdx) in stage.tasks" :key="task.id" class="edit-task-card relative" :class="getDeptColorClass(task.dept)">
                    <el-button type="danger" circle icon="Close" size="small" class="absolute-top-right z-10 shadow-md scale-75" @click="removeTask(sIdx, tIdx)" />
                    <el-select v-model="task.dept" size="small" class="full-width mb-2 font-bold">
                      <el-option v-for="d in deptOptions" :key="d" :label="d" :value="d" />
                    </el-select>
                    <el-input v-model="task.content" type="textarea" :rows="2" placeholder="任务内容..." class="mb-2 font-sm" />
                    <div class="flex-center text-gray font-bold font-xs">
                      积分奖励: <el-input-number v-model="task.rewardPoints" :min="1" :max="500" size="small" class="width-sm ml-auto" controls-position="right" />
                    </div>
                  </div>
                  
                  <div class="add-task-btn" @click="addTaskToStage(sIdx)">
                    <el-icon><Plus /></el-icon> <span class="font-xs font-bold icon-spacing-left">添加并行任务</span>
                  </div>
                </div>
              </div>
            </template>

            <div class="pipeline-arrow-horizontal arrow-offset relative group">
              <div class="line"></div><div class="triangle"></div>
              <el-button circle icon="Plus" type="primary" size="small" class="absolute-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md" @click="addStage(tplFormData.stages.length)" title="在最后追加阶段" />
            </div>

            <div class="pipeline-endpoint end endpoint-offset shadow-red">活动结束</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="tplFormVisible = false" round>取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveTemplate" round class="shadow-glow btn-px">封装备案</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Plus, Edit, Delete, Promotion, DataBoard, Clock, Calendar, Right, Timer, CircleCheck, Loading } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const activeTab = ref('templates')
const loading = ref(true)
const submitting = ref(false)
const deptOptions = ['学术部', '行政部', '宣传部', '活动部']

const templates = ref([])
const publishedWorks = ref([])
const allMembers = ref([]) 

// 进度条颜色梯度
const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 50 },
  { color: '#5cb87a', percentage: 100 }
]

onMounted(() => { fetchData() })

const fetchData = async () => {
  loading.value = true
  try {
    const tplRes = await db.collection('work_templates').get()
    templates.value = tplRes.data || []

    const workRes = await db.collection('published_works').orderBy('createTime', 'desc').get()
    publishedWorks.value = workRes.data || []

    const memRes = await db.collection('users').where({ role: 'member' }).limit(500).get()
    allMembers.value = memRes.data || []
  } catch (error) { ElMessage.error('数据加载失败') } finally { loading.value = false }
}

const handleTabChange = () => {
  if (activeTab.value !== 'publish') {
    publishForm.templateId = ''; publishForm.activityName = ''; publishForm.finalDDL = ''; publishStages.value = []
  }
}

// 🌟 核心：计算整条流水线的总进度百分比
const calculateProgress = (work) => {
  if (!work.stages || work.stages.length === 0) return 0;
  let totalTasks = 0;
  let completedTasks = 0;
  
  work.stages.forEach(stage => {
    stage.tasks.forEach(task => {
      task.assignees.forEach(assignee => {
        totalTasks++;
        if (assignee.status === 'completed') completedTasks++;
      });
    });
  });

  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

// ================= 1. 模板管理 =================
const tplFormVisible = ref(false)
const isEditingTpl = ref(false)
const tplFormData = ref({ _id: '', theme: '', stages: [] })

const getMaxDays = (stages) => {
  if (!stages || stages.length === 0) return 0
  return Math.max(...stages.map(s => s.daysBeforeEnd))
}

const handleOpenTemplateForm = (tpl = null) => {
  if (tpl) {
    isEditingTpl.value = true
    tplFormData.value = JSON.parse(JSON.stringify(tpl))
  } else {
    isEditingTpl.value = false
    tplFormData.value = { 
      _id: '', theme: '', 
      stages: [{ daysBeforeEnd: 7, tasks: [{ id: Date.now().toString(), content: '', dept: '学术部', rewardPoints: 10 }] }] 
    }
  }
  tplFormVisible.value = true
}

const addStage = (index) => {
  const newDays = index === 0 ? 30 : Math.max(0, (tplFormData.value.stages[index-1]?.daysBeforeEnd || 10) - 5)
  tplFormData.value.stages.splice(index, 0, { daysBeforeEnd: newDays, tasks: [{ id: Date.now().toString(), content: '', dept: '活动部', rewardPoints: 10 }] })
}
const removeStage = (index) => tplFormData.value.stages.splice(index, 1)
const addTaskToStage = (stageIndex) => {
  tplFormData.value.stages[stageIndex].tasks.push({ id: Date.now().toString() + Math.random(), content: '', dept: '宣传部', rewardPoints: 10 })
}
const removeTask = (stageIndex, taskIndex) => {
  tplFormData.value.stages[stageIndex].tasks.splice(taskIndex, 1)
  if (tplFormData.value.stages[stageIndex].tasks.length === 0) removeStage(stageIndex)
}

const saveTemplate = async () => {
  if (!tplFormData.value.theme || tplFormData.value.stages.length === 0) return ElMessage.warning('请填写主题并构建至少一个阶段')
  tplFormData.value.stages.sort((a, b) => b.daysBeforeEnd - a.daysBeforeEnd)

  submitting.value = true
  try {
    const payload = { theme: tplFormData.value.theme, stages: tplFormData.value.stages, updateTime: Date.now() }
    if (isEditingTpl.value) {
      await db.collection('work_templates').doc(tplFormData.value._id).update(payload)
      ElMessage.success('工作流已更新')
    } else {
      payload.createTime = Date.now()
      await db.collection('work_templates').add(payload)
      ElMessage.success('新工作流已创造')
    }
    tplFormVisible.value = false; fetchData()
  } catch (error) { ElMessage.error('保存失败') } finally { submitting.value = false }
}

const deleteTemplate = (id) => {
  ElMessageBox.confirm('确定删除此模板吗？', '确认', { type: 'warning' }).then(async () => {
    await db.collection('work_templates').doc(id).remove(); fetchData()
  }).catch(() => {})
}

// ================= 2. 任务发布 =================
const publishForm = reactive({ templateId: '', activityName: '', finalDDL: '', assignments: {} })
const publishStages = ref([]) 

const handleTemplateSelect = () => {
  const tpl = templates.value.find(t => t._id === publishForm.templateId)
  if (tpl) {
    publishStages.value = JSON.parse(JSON.stringify(tpl.stages))
    publishForm.assignments = {}
    publishStages.value.forEach(s => s.tasks.forEach(t => publishForm.assignments[t.id] = []))
    calculatePublishDDLs()
  }
}

const calculatePublishDDLs = () => {
  if (!publishForm.finalDDL || publishStages.value.length === 0) return
  const finalTime = new Date(publishForm.finalDDL).getTime()
  publishStages.value.forEach(stage => {
    stage.calculatedDDL = finalTime - (stage.daysBeforeEnd * 24 * 60 * 60 * 1000)
  })
}

const getMembersByDept = (deptName) => allMembers.value.filter(m => m.department === deptName)

const submitPublish = async () => {
  if (!publishForm.activityName || !publishForm.finalDDL) return ElMessage.warning('请配置基础信息')
  let hasEmpty = false
  publishStages.value.forEach(s => s.tasks.forEach(t => { if(publishForm.assignments[t.id].length === 0) hasEmpty = true }))
  if (hasEmpty) return ElMessage.warning('有任务处于“真空”状态，请为每个任务至少分配一名干事！')

  submitting.value = true
  try {
    const tpl = templates.value.find(t => t._id === publishForm.templateId)
    const finalStages = publishStages.value.map(stage => {
      const finalTasks = stage.tasks.map(task => {
        const assignees = publishForm.assignments[task.id].map(userId => {
          const m = allMembers.value.find(x => x._id === userId)
          return { userId, realName: m.realName, username: m.username, status: 'pending' } // pending=待确认
        })
        return { ...task, assignees }
      })
      return { daysBeforeEnd: stage.daysBeforeEnd, ddl: stage.calculatedDDL, tasks: finalTasks }
    })

    const payload = {
      templateId: tpl._id, templateTheme: tpl.theme, activityName: publishForm.activityName,
      finalDDL: new Date(publishForm.finalDDL).getTime(), stages: finalStages, createTime: Date.now()
    }

    await db.collection('published_works').add(payload)
    ElMessage.success('🚀 全域任务流已发布！')
    publishForm.templateId = ''; activeTab.value = 'progress'; fetchData()
  } catch (error) { ElMessage.error('发布失败') } finally { submitting.value = false }
}

// ================= 3. 进度大盘 =================
const recallWork = (id) => {
  ElMessageBox.confirm('将从干事工作台中抹除此任务链。确定撤回？', '危险', { type: 'error' }).then(async () => {
    await db.collection('published_works').doc(id).remove(); fetchData()
  }).catch(() => {})
}

// ================= UI与样式映射函数 =================
const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts); return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const getDeptColorClass = (dept) => {
  const map = { '学术部': 'task-blue', '活动部': 'task-green', '宣传部': 'task-orange', '行政部': 'task-purple' }
  return map[dept] || 'task-gray'
}
const getDeptBorderClass = (dept) => {
  const map = { '学术部': 'border-left-blue', '活动部': 'border-left-green', '宣传部': 'border-left-orange', '行政部': 'border-left-purple' }
  return map[dept] || 'border-left-gray'
}

const getStatusIcon = (status) => status === 'completed' ? 'CircleCheck' : (status === 'doing' ? 'Loading' : 'Clock')
</script>

<style scoped>
/* ================= 🌟 防弹级原生 CSS (彻底脱离 Tailwind 依赖) ================= */
.pure-horizontal-flow { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; align-items: center !important; min-width: max-content !important; gap: 16px !important; }
.pure-horizontal-flow.align-start { align-items: flex-start !important; }
.pure-vertical-col { display: flex !important; flex-direction: column !important; }
.flex-center { display: flex !important; align-items: center !important; }
.layout-split { display: flex !important; flex-direction: row !important; gap: 32px !important; }
@media (max-width: 1024px) { .layout-split { flex-direction: column !important; } .layout-left, .layout-right { width: 100% !important; } }
.layout-left { width: 320px; flex-shrink: 0; }
.layout-right { flex: 1; min-width: 0; }
.grid-container { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)) !important; gap: 24px !important; }
/* 大盘使用单列，给横向流水线让出空间 */
.grid-container-single { display: grid !important; grid-template-columns: 1fr !important; gap: 24px !important; }

/* 通用间距与排版 */
.full-width { width: 100% !important; }
.width-sm { width: 80px !important; }
.min-h-60vh { min-height: 60vh !important; }
.h-\[75vh\] { height: 75vh !important; }
.mb-2 { margin-bottom: 8px !important; } .mb-4 { margin-bottom: 16px !important; } .mb-24 { margin-bottom: 24px !important; }
.margin-top-lg { margin-top: 24px !important; } .margin-x-sm { margin: 0 8px !important; } .ml-auto { margin-left: auto !important; }
.padding-x { padding-left: 16px; padding-right: 16px; } .padding-top { padding-top: 16px; } .padding-top-lg { padding-top: 24px; } .padding-bottom-lg { padding-bottom: 40px; } .padding-bottom-xl { padding-bottom: 80px; }
.gap-md { gap: 16px !important; } .mini-gap { gap: 6px !important; }
.icon-spacing { margin-right: 4px; } .icon-spacing-left { margin-left: 4px; }

/* 字体与颜色 */
.font-black { font-weight: 900 !important; } .font-bold { font-weight: bold !important; }
.font-xs { font-size: 12px !important; } .font-sm { font-size: 14px !important; }
.text-danger { color: #ef4444 !important; font-weight: bold; }
.text-blue { color: #3b82f6 !important; } .text-green { color: #22c55e !important; } .text-orange { color: #f97316 !important; } .text-gray { color: #94a3b8 !important; }
.bg-blue { background-color: #3b82f6 !important; } .bg-green { background-color: #22c55e !important; }

/* 基础容器 */
.work-manage-container { padding: 20px; max-width: 1600px; margin: 0 auto; min-height: 85vh;}
.custom-box { background-color: #f8fafc; padding: 24px; border-radius: 24px; border: 1px solid #f1f5f9; }
.custom-box-white { background-color: #ffffff; }
.custom-box-gray { background-color: #f1f5f9; border: 1px solid #e2e8f0; }
.panel-title { font-size: 18px; font-weight: 900; color: #1e293b; margin: 0 0 24px 0; }
.circle-badge { width: 32px; height: 32px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;}

/* 动画 */
.fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.shadow-glow { box-shadow: 0 6px 20px rgba(64,158,255,0.25); transition: all 0.3s;}
.hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(64,158,255,0.4); }

/* 页面头部与 Tabs */
.page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
.header-left h2 { margin: 0 0 5px 0; color: #2c3e50; font-size: 28px; font-weight: 900; letter-spacing: 1px;}
.subtitle { margin: 0; color: #7f8c8d; font-size: 14px; }
.premium-tabs { background: transparent; border: none; margin-top: 10px;}
:deep(.el-tabs__nav-wrap::after) { display: none; }
:deep(.el-tabs__header) { margin-bottom: 25px; }
.tab-label { display: flex; align-items: center; gap: 6px; font-weight: 900; font-size: 16px;}
.main-card { border-radius: 24px; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.03) !important; background: #fff;}

/* ================= 🌟 横向流水线 (Pipeline) 核心组件 ================= */
.custom-scrollbar::-webkit-scrollbar { height: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.pipeline-endpoint {
  width: 70px; height: 70px; border-radius: 50%; font-size: 12px; font-weight: 900; 
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; text-align: center;
  background: white; border: 4px solid; z-index: 10;
}
.pipeline-endpoint.start { border-color: #3b82f6; color: #3b82f6; box-shadow: 0 4px 15px rgba(59,130,246,0.2);}
.pipeline-endpoint.end { border-color: #ef4444; color: #ef4444; }

.pipeline-arrow-horizontal { display: flex; align-items: center; justify-content: center; width: 70px; flex-shrink: 0; }
.pipeline-arrow-horizontal .line { width: 100%; height: 4px; background-color: #cbd5e1; }
.pipeline-arrow-horizontal .triangle { border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 12px solid #cbd5e1; margin-left: -2px;}

/* 视觉对齐 */
.endpoint-offset { margin-top: 35px; } 
.arrow-offset { margin-top: 65px; }

.pipeline-stage-col { display: flex; flex-direction: column; align-items: center; min-width: 280px; flex-shrink: 0;}
.stage-time-badge { background: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; color: #475569; z-index: 10; border: 1px solid #e2e8f0;}

/* 任务卡片 */
.publish-task-card, .edit-task-card { 
  width: 100%; padding: 16px; border-radius: 16px; border: 2px solid transparent; transition: all 0.3s;
  display: flex; flex-direction: column; background: #fff; box-sizing: border-box;
}
.publish-task-card:hover, .edit-task-card:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(0,0,0,0.06); }

.task-dept-badge { font-size: 11px; font-weight: 900; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; align-self: flex-start; color: #475569;}
.task-content-text { font-size: 16px; font-weight: 900; color: #1e293b; margin: 8px 0; }
.task-reward-text { font-size: 12px; color: #64748b; font-weight: bold; margin-bottom: 16px; }

/* 卡片边框颜色映射 */
.task-blue { border-color: #bfdbfe !important; color: #1d4ed8; }
.task-green { border-color: #bbf7d0 !important; color: #15803d; }
.task-orange { border-color: #fed7aa !important; color: #c2410c; }
.task-purple { border-color: #e9d5ff !important; color: #7e22ce; }
.task-gray { border-color: #e2e8f0 !important; color: #475569; }

/* 弹窗中的特殊样式 */
.absolute-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.absolute-top-right { position: absolute; right: -8px; top: -8px; }
.shadow-red { box-shadow: 0 10px 25px rgba(239, 68, 68, 0.2); }
.add-task-btn { border-radius: 16px; border: 2px dashed #cbd5e1; padding: 12px; display: flex; align-items: center; justify-content: center; color: #94a3b8; cursor: pointer; transition: all 0.3s; background: rgba(255,255,255,0.5); }
.add-task-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
.btn-px { padding-left: 32px; padding-right: 32px; }

/* ================= 迷你预览 (Tab 1) ================= */
.tpl-card { border-radius: 20px; border: 2px solid #f8fafc; padding: 24px; transition: all 0.4s; background: #ffffff; }
.tpl-card:hover { border-color: #bfdbfe; box-shadow: 0 15px 30px rgba(59, 130, 246, 0.08); transform: translateY(-4px); }
.tpl-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;}
.tpl-card-title { font-size: 20px; font-weight: 900; color: #1f2937; margin: 0 0 4px 0; }
.tpl-card-subtitle { font-size: 14px; color: #6b7280; }
.highlight-text { font-weight: bold; color: #374151; margin-left: 4px; }
.group:hover .transition-opacity { opacity: 1; }
.pipeline-preview-container { background: #f8fafc; border-radius: 16px; padding: 16px; overflow-x: auto; }
.pipeline-stage-col-mini { display: flex; flex-direction: column; align-items: center; min-width: 80px;}
.mini-stage-time { font-size: 10px; color: #94a3b8; font-weight: bold; margin-bottom: 4px; white-space: nowrap;}
.mini-task-card { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; background: white; width: 100%; text-align: center;}
.pipeline-arrow-h { color: #cbd5e1; margin: 0 10px;}

/* ================= 3. 彻底修复的【进度大盘】样式 ================= */
.prog-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 30px; transition: all 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.02);}
.prog-card:hover { box-shadow: 0 15px 35px rgba(0,0,0,0.06); border-color: #cbd5e1;}
.prog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px dashed #e2e8f0;}
.prog-title { font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; }
.prog-subtitle { font-size: 14px; color: #64748b; }
.prog-progress-wrap { display: flex; flex-direction: column; align-items: flex-end; }
.prog-progress-label { font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 4px; }

/* 🌟 横向排列的流水线阶段区 */
.prog-timeline-horizontal { overflow-x: auto; padding-bottom: 16px; }
.prog-stage-col { display: flex; flex-direction: column; min-width: 280px; flex-shrink: 0; background: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #f1f5f9;}
.prog-stage-time { font-size: 13px; font-weight: 900; color: #475569; display: flex; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;}

.prog-task-item { background-color: #ffffff; padding: 16px; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.02);}
.prog-task-name { font-weight: 900; font-size: 15px; color: #1e293b; margin-bottom: 12px; }
.prog-task-dept { font-size: 12px; font-weight: normal; color: #94a3b8; margin-left: 4px; }
.prog-assignee-wrap { display: flex; flex-wrap: wrap; gap: 8px; }

/* 🌟 核心状态徽章样式 */
.prog-assignee-pill { display: flex; align-items: center; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;}
.status-pending { background-color: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; } /* 待确认 灰色 */
.status-doing { background-color: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; } /* 进行中 橙色 */
.status-completed { background-color: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; } /* 已完成 绿色 */

.truncate-name { max-width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }
.prog-no-assignee { font-size: 12px; color: #f87171; font-style: italic; background: #fef2f2; padding: 4px 10px; border-radius: 20px; border: 1px solid #fecaca;}

/* 进度部门边框 */
.border-left-blue { border-left: 6px solid #60a5fa !important; }
.border-left-green { border-left: 6px solid #4ade80 !important; }
.border-left-orange { border-left: 6px solid #fb923c !important; }
.border-left-purple { border-left: 6px solid #c084fc !important; }
.border-left-gray { border-left: 6px solid #cbd5e1 !important; }

/* ================= 杂项重置 ================= */
:deep(.custom-dark-select .el-input__wrapper) { background: #f8fafc; border-radius: 8px; box-shadow: none; border: 1px solid transparent; transition: all 0.3s;}
:deep(.custom-dark-select .el-input__wrapper:hover) { border-color: #cbd5e1; }
:deep(.custom-dark-select .el-input__wrapper.is-focus) { border-color: #3b82f6; background: #fff;}
:deep(.custom-title-input .el-input__wrapper) { box-shadow: none !important; background: transparent; padding: 0;}
:deep(.custom-title-input .el-input__inner) { font-size: 24px; font-weight: 900; color: #1e293b; text-align: center;}
</style>