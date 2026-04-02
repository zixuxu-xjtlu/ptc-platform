<template>
  <div class="quiz-container">
    <div class="page-header mb-20 fade-in-down">
      <div class="flex items-center gap-4">
        <el-button v-if="currentStep !== 'subjects'" circle icon="ArrowLeft" @click="goBack" class="shadow-md hover-scale" />
        <div>
          <h2>📝 智学挑战中心</h2>
          <p class="subtitle">{{ getSubtitle() }}</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-400 smooth-fade">
      <el-icon class="is-loading text-3xl mb-2 text-blue-400"><Loading /></el-icon>
      <p class="tracking-widest animate-pulse">正在同步云端数据...</p>
    </div>

    <div v-else class="smooth-fade">
      <div v-if="currentStep === 'subjects'">
        <el-empty v-if="subjects.length === 0" description="暂无开放的学科挑战" class="fade-in-up" />
        <div class="subject-grid">
          <div 
            v-for="(sub, index) in subjects" 
            :key="sub" 
            class="subject-card stagger-item" 
            :style="{ background: getSubjectGradient(index), animationDelay: `${index * 0.08}s` }" 
            @click="selectSubject(sub)"
          >
            <div class="sub-icon">{{ ['📐','💻','🔬','📊','🌍','📚'][index % 6] }}</div>
            <h3 class="sub-name">{{ sub }}</h3>
            <div class="sub-overlay">去挑战 &rarr;</div>
          </div>
        </div>
      </div>

      <div v-else-if="currentStep === 'quizSets'">
        <el-empty v-if="quizSets.length === 0" description="该学科下暂无发布的试卷" class="fade-in-up" />
        <div class="space-y-4">
          <div 
            v-for="(set, index) in quizSets" 
            :key="set._id" 
            class="quiz-set-card stagger-item flex justify-between items-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer" 
            :style="{ animationDelay: `${index * 0.08}s` }"
            @click="enterQuiz(set)"
          >
            <div>
              <h3 class="text-lg font-bold text-gray-800 mb-1 title-hover">{{ set.title }}</h3>
              <p class="text-xs text-gray-500 flex items-center gap-4">
                <span><el-icon class="mr-1"><Clock /></el-icon>{{ formatDate(set.createTime) }}</span>
                <span class="text-blue-500"><el-icon class="mr-1"><DataLine /></el-icon>{{ set.passScore || 60 }}分 及格</span>
                <span class="text-warning"><el-icon class="mr-1"><Coin /></el-icon>奖励: {{ set.rewardPoints || 20 }} 积分</span>
              </p>
            </div>
            
            <div class="flex-shrink-0">
              <el-tag v-if="hasRecord(set._id)" type="success" effect="dark" round size="large" class="shadow-sm">
                已作答 (得 {{ getRecordScore(set._id) }} 分)
              </el-tag>
              <el-button v-else type="primary" round class="shadow-glow hover-lift">开始挑战</el-button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="currentStep === 'doing' || currentStep === 'result'">
        
        <transition name="bounce-down">
          <el-card v-if="currentStep === 'result'" shadow="never" class="result-board mb-20" :class="score >= (activeSet.passScore || 60) ? 'bg-success-light' : 'bg-danger-light'">
            <div class="result-content text-center">
              <h1 class="score-text" :class="score >= (activeSet.passScore || 60) ? 'text-green-600' : 'text-red-500'">{{ score }} / {{ maxScore }} 分</h1>
              <h3 class="mt-2">{{ score >= (activeSet.passScore || 60) ? '🎉 恭喜达到及格线！' : '💪 还未及格，请查阅解析！' }}</h3>
              <p v-if="score >= (activeSet.passScore || 60) && !isHistoryView" class="mt-2 text-gray-600">
                积分奖励：<span class="font-bold text-blue-500">+{{ activeSet.rewardPoints || 20 }} 积分</span> 已发放！
              </p>
              <p v-if="isHistoryView" class="mt-2 text-gray-500 text-sm">此为历史作答记录，不可重复获取积分。</p>
            </div>
          </el-card>
        </transition>

        <el-empty v-if="questions.length === 0" description="这套卷子还没有题目哦" class="fade-in-up" />

        <div class="question-list">
          <el-card 
            v-for="(q, index) in questions" :key="q._id" shadow="hover" 
            class="question-card mb-20 stagger-item"
            :style="{ animationDelay: `${index * 0.1}s` }"
            :class="{ 'border-red-400': currentStep === 'result' && !isCorrect(q), 'border-green-400': currentStep === 'result' && isCorrect(q) }"
          >
            <div class="q-header mb-4">
              <span class="q-index">{{ index + 1 }}.</span>
              <el-tag size="small" :type="q.type === 'choice' ? 'primary' : 'warning'" class="mr-2">
                {{ q.type === 'choice' ? '选择题' : '填空题' }}
              </el-tag>
              <span class="text-xs text-gray-400 mr-3">({{ q.score || 10 }}分)</span>
              <span class="q-content math-text" v-html="q.content"></span>
            </div>

            <div class="q-body ml-8">
              <el-radio-group v-if="q.type === 'choice'" v-model="userAnswers[q._id]" :disabled="currentStep === 'result'" class="custom-radio-group">
                <el-radio v-for="opt in q.options" :key="opt.label" :label="opt.label" class="opt-radio block whitespace-normal w-full">
                  <span class="font-bold mr-2">{{ opt.label }}.</span> 
                  <span class="math-text" v-html="opt.text"></span>
                </el-radio>
              </el-radio-group>

              <div v-if="q.type === 'fill'">
                <el-input v-model="userAnswers[q._id]" placeholder="请输入答案" :disabled="currentStep === 'result'" class="w-64 custom-input" />
              </div>
            </div>

            <transition name="expand-fade">
              <div v-if="currentStep === 'result'" class="q-analysis mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100 ml-8">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-bold" :class="isCorrect(q) ? 'text-green-600' : 'text-red-500'">
                    <el-icon class="mr-1"><component :is="isCorrect(q) ? 'Check' : 'Close'" /></el-icon>
                    {{ isCorrect(q) ? `回答正确 (+${q.score || 10}分)` : '回答错误 (0分)' }}
                  </span>
                  <span class="text-gray-500 text-sm ml-4">正确答案：<span class="font-bold text-blue-600 math-text">{{ q.correctAnswer }}</span></span>
                </div>
                <el-divider border-style="dashed" class="my-3" />
                <div class="text-sm text-gray-700">
                  <span class="font-bold">📝 详细解析：</span>
                  <div class="math-text mt-2 leading-relaxed" v-html="q.explanation || '暂无解析'"></div>
                </div>
              </div>
            </transition>
          </el-card>
        </div>

        <div v-if="currentStep === 'doing'" class="text-center py-6 fade-in-up" style="animation-delay: 0.5s;">
          <el-button type="primary" size="large" round @click="submitQuiz" :loading="submitting" class="w-64 shadow-lg shadow-blue-500/40 font-bold text-lg hover-lift-lg">
            交卷并查看解析
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Check, Close, ArrowLeft, Clock, Coin, DataLine } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const loading = ref(true)
const submitting = ref(false)
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const currentStep = ref('subjects') 
const activeSubject = ref('')
const activeSet = ref(null)

const allQuizSets = ref([]) 
const subjects = ref([]) 
const userRecords = ref([]) 
const quizSets = ref([]) 
const questions = ref([]) 
const userAnswers = ref({}) 

const score = ref(0)
const maxScore = ref(0) 
const isHistoryView = ref(false) 

onMounted(async () => {
  loading.value = true
  try {
    const setRes = await db.collection('quiz_sets').orderBy('createTime', 'desc').get()
    allQuizSets.value = (setRes.data || []).filter(s => s.status === 'published')
    
    const subSet = new Set(allQuizSets.value.map(s => s.subject))
    subjects.value = Array.from(subSet).filter(Boolean)

    const recRes = await db.collection('quiz_records').where({ userId: currentUser.value._id }).get()
    userRecords.value = recRes.data || []
  } catch (error) {
    ElMessage.error('数据初始化失败')
  } finally { loading.value = false }
})

const getSubtitle = () => {
  if (currentStep.value === 'subjects') return '选择你想挑战的学科，每套试卷仅有一次作答机会！'
  if (currentStep.value === 'quizSets') return `当前学科：${activeSubject.value}`
  return `当前套卷：${activeSet.value?.title}`
}

const goBack = () => {
  if (currentStep.value === 'quizSets') currentStep.value = 'subjects'
  else if (currentStep.value === 'doing' || currentStep.value === 'result') currentStep.value = 'quizSets'
}

const selectSubject = (sub) => {
  activeSubject.value = sub
  quizSets.value = allQuizSets.value.filter(s => s.subject === sub)
  currentStep.value = 'quizSets'
}

const hasRecord = (setId) => userRecords.value.some(r => r.quizSetId === setId)
const getRecordScore = (setId) => {
  const record = userRecords.value.find(r => r.quizSetId === setId)
  return record ? record.score : 0
}

const enterQuiz = async (set) => {
  activeSet.value = set
  loading.value = true
  try {
    const qRes = await db.collection('questions').where({ quizSetId: set._id }).get()
    questions.value = qRes.data || []
    
    maxScore.value = questions.value.reduce((sum, q) => sum + (q.score || 10), 0)
    
    const record = userRecords.value.find(r => r.quizSetId === set._id)
    if (record) {
      userAnswers.value = record.answers || {}
      score.value = record.score
      isHistoryView.value = true
      currentStep.value = 'result'
    } else {
      userAnswers.value = {}
      questions.value.forEach(q => userAnswers.value[q._id] = '')
      isHistoryView.value = false
      currentStep.value = 'doing'
    }
    renderMath()
  } catch (err) { ElMessage.error('加载题目失败') } finally { loading.value = false }
}

const renderMath = () => {
  nextTick(() => {
    if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear()
    if (window.reMath) window.reMath()
  })
}

const isCorrect = (q) => {
  const uAns = (userAnswers.value[q._id] || '').toString().trim().toLowerCase()
  const cAns = (q.correctAnswer || '').toString().trim().toLowerCase()
  return uAns === cAns
}

const submitQuiz = async () => {
  const unAnswered = questions.value.some(q => !userAnswers.value[q._id])
  if (unAnswered) {
    try { await ElMessageBox.confirm('您还有题目未作答，确定要强行交卷吗？', '提示', { type: 'warning' }) } catch { return }
  } else {
    try { await ElMessageBox.confirm('确定交卷？', '确认', { type: 'info' }) } catch { return }
  }

  submitting.value = true
  try {
    let earnedScore = 0
    questions.value.forEach(q => { 
      if (isCorrect(q)) earnedScore += (q.score || 10) 
    })
    score.value = earnedScore

    const recordPayload = {
      userId: currentUser.value._id,
      username: currentUser.value.username,
      quizSetId: activeSet.value._id,
      score: score.value,
      answers: userAnswers.value,
      createTime: new Date().getTime()
    }
    await db.collection('quiz_records').add(recordPayload)
    userRecords.value.push(recordPayload)

    const passMark = activeSet.value.passScore || 60
    if (score.value >= passMark) {
      const reward = activeSet.value.rewardPoints || 20
      const _ = db.command
      await db.collection('users').doc(currentUser.value._id).update({ points: _.inc(reward) })
      currentUser.value.points = (currentUser.value.points || 0) + reward
      localStorage.setItem('user', JSON.stringify(currentUser.value))
    }

    currentStep.value = 'result'
    renderMath()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) { ElMessage.error('交卷异常，请重试') } finally { submitting.value = false }
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth()+1}月${d.getDate()}日`
}

const getSubjectGradient = (index) => {
  const gradients = [
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  ]
  return gradients[index % gradients.length]
}
</script>

<style scoped>
/* ================= 基础布局与丝滑动画库 ================= */
.quiz-container { padding: 20px; max-width: 1000px; margin: 0 auto; min-height: 80vh; overflow-x: hidden;}

/* 高级缓动曲线 */
.smooth-fade { animation: smoothFade 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes smoothFade { from { opacity: 0; } to { opacity: 1; } }

.fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* 瀑布流交错进场 */
.stagger-item { opacity: 0; animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

/* 果冻弹跳效果 (成绩单进场) */
.bounce-down-enter-active { animation: bounceDown 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes bounceDown { 
  0% { opacity: 0; transform: translateY(-40px) scale(0.9); } 
  70% { transform: translateY(5px) scale(1.02); } 
  100% { opacity: 1; transform: translateY(0) scale(1); } 
}

/* 解析展开动画 */
.expand-fade-enter-active { transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); overflow: hidden; }
.expand-fade-enter-from { opacity: 0; max-height: 0; transform: translateY(-10px); }
.expand-fade-enter-to { opacity: 1; max-height: 500px; transform: translateY(0); }

/* 通用悬浮反馈 */
.hover-scale { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.hover-scale:hover { transform: scale(1.1); }
.hover-lift { transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.hover-lift:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(64,158,255,0.4); }
.hover-lift-lg { transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.hover-lift-lg:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(64,158,255,0.5); }

/* ================= 头部样式 ================= */
.page-header h2 { margin: 0 0 5px 0; color: #2c3e50; font-size: 26px; font-weight: 800;}
.subtitle { margin: 0; color: #7f8c8d; font-size: 14px; }
.shadow-glow { box-shadow: 0 4px 15px rgba(64,158,255,0.3); }

/* ================= 学科卡片（圆润可爱+丝滑悬浮） ================= */
.subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; padding: 10px 0; }
.subject-card { 
  border-radius: 30px; padding: 40px 20px; text-align: center; cursor: pointer; position: relative; 
  overflow: hidden; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 20px rgba(0,0,0,0.05); 
}
.subject-card:hover { transform: translateY(-10px) scale(1.03); box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
.sub-icon { font-size: 48px; margin-bottom: 15px; transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);}
.subject-card:hover .sub-icon { transform: scale(1.15) rotate(8deg); }
.sub-name { margin: 0; font-size: 22px; font-weight: 900; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: 2px;}
.sub-overlay { 
  position: absolute; bottom: -50px; left: 0; right: 0; height: 50px; background: rgba(255,255,255,0.25); 
  display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; 
  transition: bottom 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); backdrop-filter: blur(4px); 
}
.subject-card:hover .sub-overlay { bottom: 0; }

/* ================= 试卷列表样式 ================= */
.quiz-set-card { transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); border: 2px solid transparent; }
.quiz-set-card:hover { transform: translateX(8px); border-color: #e0e7ff; box-shadow: 0 10px 25px rgba(0,0,0,0.04); }
.title-hover { transition: color 0.3s ease; }
.quiz-set-card:hover .title-hover { color: #3b82f6; }

/* ================= 答题区样式 ================= */
.result-board { border-radius: 20px; border: none; overflow: hidden; }
.bg-success-light { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
.bg-danger-light { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); }
.score-text { font-size: 56px; font-weight: 900; margin: 0; text-shadow: 0 4px 10px rgba(0,0,0,0.05);}

.question-card { border-radius: 20px; transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); border: 2px solid transparent; box-shadow: 0 4px 12px rgba(0,0,0,0.02) !important;}
.question-card:hover { box-shadow: 0 12px 30px rgba(0,0,0,0.06) !important; transform: translateY(-2px); }

.q-header { display: flex; align-items: flex-start; }
.q-index { font-size: 20px; font-weight: 900; color: #3b82f6; margin-right: 12px; padding-top: 2px; font-style: italic;}
.q-content { font-size: 16px; color: #34495e; line-height: 1.8; flex: 1; font-weight: 500;}

.math-text { overflow-x: auto; overflow-y: hidden; max-width: 100%; padding-bottom: 5px;}

/* 🌟 极致丝滑的单选框体验 */
.custom-radio-group { display: flex; flex-direction: column; gap: 12px; width: 100%;}
:deep(.el-radio.opt-radio) { 
  border: 1px solid #f1f5f9; padding: 14px 18px; border-radius: 12px; 
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  background-color: #ffffff;
  height: auto;
}
:deep(.el-radio.opt-radio:not(.is-disabled):hover) { 
  border-color: #bfdbfe; background-color: #f8fafc; transform: translateX(6px); 
}
:deep(.el-radio.opt-radio.is-checked) { 
  background: #f0f7ff; border-color: #93c5fd; box-shadow: 0 4px 12px rgba(59,130,246,0.1); 
}
:deep(.el-radio__label) { display: inline-flex; align-items: center; white-space: normal; line-height: 1.6; color: #475569; font-size: 15px;}
:deep(.el-radio.is-checked .el-radio__label) { color: #2563eb; font-weight: bold;}

/* 丝滑输入框 */
:deep(.custom-input .el-input__wrapper) {
  border-radius: 10px; transition: all 0.3s ease; box-shadow: 0 0 0 1px #e2e8f0 inset;
}
:deep(.custom-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #3b82f6 inset; transform: translateY(-1px);
}
</style>