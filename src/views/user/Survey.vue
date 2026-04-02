<template>
  <div class="survey-container">
    <transition name="fade" mode="out-in">
      <div v-if="currentStep === 0" class="step-wrapper welcome-step">
        <div class="header-icon">🧬</div>
        <h1>PTC 16-Dimension Mindset Profiler</h1>
        <p class="subtitle">50 questions to uncover your academic DNA.</p>
        <div class="tips">
          <p>💡 Hint: Follow your intuition. Don't think about "is this major good for employment", just ask yourself "do I like it".</p>
          <p>⏱️ Estimated Time: 3-5 Minutes</p>
        </div>
        <el-button type="primary" size="large" round @click="startSurvey" class="start-btn">
          Start Profiling
        </el-button>
      </div>

      <div v-else-if="currentStep === 1" class="step-wrapper question-step">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: ((currentQuestionIndex + 1) / questions.length) * 100 + '%' }"></div>
        </div>
        <div class="question-header">
          <span>Question {{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
        </div>
        
        <transition name="slide-fade" mode="out-in">
          <div :key="currentQuestionIndex" class="question-card">
            <h2 class="question-text">{{ currentQuestion.text }}</h2>
            <div class="options-container">
              <button 
                v-for="option in scaleOptions" 
                :key="option.value"
                class="option-btn"
                @click="selectOption(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </transition>
      </div>

      <div v-else-if="currentStep === 2" class="step-wrapper result-step">
        <h2>🎉 Your Profile is Ready</h2>
        <p class="top-traits">Top Domains: <br/> <strong>{{ topTraits.join(' | ') }}</strong></p>
        
        <div ref="radarChartRef" class="radar-chart"></div>

        <div class="cipher-box">
          <div class="cipher-header">
            <span>🔒 Encrypted Profile Data (Copy to AI)</span>
            <el-button size="small" type="primary" plain @click="copyCipher">Copy Data</el-button>
          </div>
          <div class="cipher-content">{{ cipherText }}</div>
        </div>
        
        <el-button type="default" round @click="resetSurvey" style="margin-top: 30px;">Retake Test</el-button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// --- 1. 中英双语 16维度数据模型 ---
const dimensions = [
  // Quadrant 1: Tech & Computing
  { id: 'Logic', cn: '抽象逻辑推理', en: 'Abstract Logic', quad: 1 },
  { id: 'Algo', cn: '算法与编程思维', en: 'Algorithmic Thinking', quad: 1 },
  { id: 'Data', cn: '数据敏感与洞察', en: 'Data Sensitivity', quad: 1 },
  { id: 'Sys', cn: '系统与网络交互', en: 'Systems & Networks', quad: 1 },
  // Quadrant 2: Engineering & Physical
  { id: 'Hard', cn: '硬件与微电子设计', en: 'Hardware Design', quad: 2 },
  { id: 'Mech', cn: '机械与自动化控制', en: 'Mechanics & Control', quad: 2 },
  { id: 'Space', cn: '空间构建与规划', en: 'Spatial Planning', quad: 2 },
  { id: 'Chem', cn: '物质与材料合成', en: 'Chemical Synthesis', quad: 2 },
  // Quadrant 3: Bioscience & Business
  { id: 'Bio', cn: '生命机制微观探索', en: 'Bioscience', quad: 3 },
  { id: 'Econ', cn: '宏观经济与市场规律', en: 'Macro-Economy', quad: 3 },
  { id: 'Risk', cn: '金融风控与定价模型', en: 'Financial Risk', quad: 3 },
  { id: 'Corp', cn: '商业运营与规则秩序', en: 'Corporate Ops', quad: 3 },
  // Quadrant 4: Humanities & Arts
  { id: 'Social', cn: '人际感知与消费者心理', en: 'Human Behavior', quad: 4 },
  { id: 'Visual', cn: '视觉审美与形态创造', en: 'Visual Aesthetics', quad: 4 },
  { id: 'Media', cn: '多媒体与数字叙事', en: 'Digital Media', quad: 4 },
  { id: 'Global', cn: '跨文化桥梁与全球视野', en: 'Global Vision', quad: 4 }
]

const scaleOptions = [
  { label: '完全不符合 (Strongly Disagree)', value: 1 },
  { label: '不太符合 (Disagree)', value: 2 },
  { label: '一般 (Neutral)', value: 3 },
  { label: '比较符合 (Agree)', value: 4 },
  { label: '完全符合 (Strongly Agree)', value: 5 }
]

// 50题
const questions = [
  { text: '我非常享受推导复杂数学公式，以及探寻事物底层公理的过程。', dimension: 'Logic' },
  { text: '面对海量且杂乱无章的数字，我能本能地找到切入点进行清洗和归类。', dimension: 'Data' },
  { text: '我擅长通过剪辑视频、搭配音效、设计分镜来讲述一个引人入胜的故事。', dimension: 'Media' },
  { text: '我对复杂的机械传动齿轮、工业流水线或机器人运动控制非常着迷。', dimension: 'Mech' },
  { text: '相比于直觉，我更习惯用极端概率和数学模型来量化潜在的损失或风险。', dimension: 'Risk' },
  { text: '我对排版、色彩搭配、UI界面有着极高的标准，看到丑陋的设计会感到难受。', dimension: 'Visual' },
  { text: '我喜欢用代码或脚本来代替人工，解决生活或系统中的重复性问题。', dimension: 'Algo' },
  { text: '我热衷于了解不同国家的文化背景，对国际地缘政治和语言学充满兴趣。', dimension: 'Global' },
  { text: '走到一个新的建筑里，我会本能地观察它的承重结构、动线规划和空间布局。', dimension: 'Space' },
  { text: '我对细胞变异、基因编辑、人体病理以及自然界生命的微观密码极度好奇。', dimension: 'Bio' },
  { text: '我很容易察觉他人的情绪变化，并能巧妙地通过沟通引导他人的决定。', dimension: 'Social' },
  { text: '我喜欢研究央行利率调整、货币政策对宏观市场和资源配置带来的链式反应。', dimension: 'Econ' },
  { text: '我热衷于拆解电子设备，对微观电路、传感器和芯片的运作原理好奇。', dimension: 'Hard' },
  { text: '我做事极其严谨务实，喜欢整理复杂的账目或梳理组织内的合规运转流程。', dimension: 'Corp' },
  { text: '我对计算机网络如何路由、数据包如何通过协议传输、服务器如何架构感兴趣。', dimension: 'Sys' },
  { text: '我喜欢在实验室里混合化学试剂，或测试新型高分子材料的物理和化学性质。', dimension: 'Chem' },
  { text: '我玩游戏时经常会思考它的寻路算法或状态机是怎么写出来的。', dimension: 'Algo' },
  { text: '比起描述性的文字，我更喜欢看带有图表、折线、散点图的数据统计报告。', dimension: 'Data' },
  { text: '对于悬而未决的智力谜题或逻辑悖论，我会一直思考直到找出完美闭环的解释。', dimension: 'Logic' },
  { text: '我喜欢设计能够将想法具象化表达出来的标志、海报或三维模型。', dimension: 'Visual' },
  { text: '我认为构建一套无懈可击的企业管理制度，比单纯卖出一个产品更有成就感。', dimension: 'Corp' },
  { text: '我对金融衍生品的对冲策略感兴趣，喜欢研究如何在波动中锁定收益。', dimension: 'Risk' },
  { text: '我不仅喜欢看电影，还会刻意分析导演的镜头语言和光影运用。', dimension: 'Media' },
  { text: '遇到问题时，我习惯于把复杂的系统抽象成一个个可以代入计算的数学模型。', dimension: 'Logic' },
  { text: '我关注全球供应链的演变，喜欢研究跨国商业案例和国际法则。', dimension: 'Global' },
  { text: '我对药物分子如何靶向作用于人体特定受体的微观过程感兴趣。', dimension: 'Bio' },
  { text: '我喜欢组装硬件设备，比如自己挑选主板、CPU并了解它们之间的总线通信。', dimension: 'Hard' },
  { text: '我觉得无人机悬停或机械臂精准抓取的底层动力学原理非常酷。', dimension: 'Mech' },
  { text: '我对物联网（IoT）感兴趣，想知道如何把家里的各种设备连接到云端。', dimension: 'Sys' },
  { text: '我擅长分析消费者心理，总能猜到某个广告为什么能让人产生购买欲。', dimension: 'Social' },
  { text: '我关心城市宏观规划，比如为什么这片区域要建公园而不是高楼。', dimension: 'Space' },
  { text: '我喜欢关注新能源电池的材料研发，或对半导体硅材料的制程感兴趣。', dimension: 'Chem' },
  { text: '我经常思考如何利用有限的资源，在不同的市场约束条件下实现利益最大化。', dimension: 'Econ' },
  { text: '编写一段程序，看到终端输出预期结果的那一刻，我会有极大的多巴胺分泌。', dimension: 'Algo' },
  { text: '在团队中，我通常是那个负责把大目标拆解成具体任务并核对进度的人。', dimension: 'Corp' },
  { text: '遇到一个陌生现象，我第一反应是去搜集它的历史数据并寻找统计学规律。', dimension: 'Data' },
  { text: '我在三维空间中有极强的方向感和想象力，能在脑海中旋转一个立体结构。', dimension: 'Space' },
  { text: '我喜欢观察社会现象，并试图用经济学的供需曲线去解释它们。', dimension: 'Econ' },
  { text: '我对网络安全、黑客攻防、加密算法和系统漏洞的发现感兴趣。', dimension: 'Sys' },
  { text: '在制定计划时，我总会预留备用方案，并精准评估最坏情况发生时的代价。', dimension: 'Risk' },
  { text: '相比于和机器打交道，我更渴望在人群中工作，通过人际互动获取能量。', dimension: 'Social' },
  { text: '我喜欢阅读纯粹的数学理论或理论物理，哪怕它们看起来距离现实很遥远。', dimension: 'Logic' },
  { text: '我懂得如何利用不同的字体、字号和对比度，让画面传达出高级感。', dimension: 'Visual' },
  { text: '学习外语对我来说不是负担，而是一把开启另一种思维方式的钥匙。', dimension: 'Global' },
  { text: '对于复杂庞大的程序架构，我喜欢思考它各模块之间的解耦和性能优化。', dimension: 'Algo' },
  { text: '在参观工厂时，比起最终生产出的产品，我更关心那些精密的自动化机床是怎么运作的。', dimension: 'Mech' },
  { text: '我对动植物解剖学、遗传学和神经科学方面的科普纪录片百看不厌。', dimension: 'Bio' },
  { text: '我喜欢研究如何通过化学或物理手段改变物质的状态，以获得全新的特性。', dimension: 'Chem' },
  { text: '我对硬件底层的指令集、或者如何通过电路板控制发光二极管感到好奇。', dimension: 'Hard' },
  { text: '我热衷于捕捉和记录生活中的碎片，并将它们制作成具有感染力的数字媒体作品。', dimension: 'Media' }
]

const currentStep = ref(0)
const currentQuestionIndex = ref(0)
const answers = ref([]) 
const userScores = ref({}) 
const radarChartRef = ref(null)

const currentQuestion = computed(() => questions[currentQuestionIndex.value])

// 计算 Top 3，用中英文展示给用户看
const topTraits = computed(() => {
  const sorted = Object.entries(userScores.value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  return sorted.map(([id]) => {
    const dim = dimensions.find(d => d.id === id)
    return `${dim.cn} (${dim.en})`
  })
})

// 🌟 纯英语极简密文，给 AI 分析用的底层数据
const cipherText = computed(() => {
  const scoresStr = Object.entries(userScores.value).map(([k, v]) => `${k}:${v}`).join(',')
  const top3Str = Object.entries(userScores.value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)
    .join('|')

  return `[PTC_PROFILE_DATA]\nTOP_TRAITS=${top3Str}\nRAW_SCORES=${scoresStr}`
})

const startSurvey = () => {
  answers.value = new Array(questions.length).fill(0)
  currentStep.value = 1
}

const selectOption = (score) => {
  answers.value[currentQuestionIndex.value] = score
  if (currentQuestionIndex.value < questions.length - 1) {
    currentQuestionIndex.value++
  } else {
    calculateFinalScores()
    finishSurvey()
  }
}

const calculateFinalScores = () => {
  const rawScores = {}
  const counts = {}
  dimensions.forEach(d => { rawScores[d.id] = 0; counts[d.id] = 0 })
  questions.forEach((q, index) => {
    rawScores[q.dimension] += answers.value[index]
    counts[q.dimension] += 1
  })
  const finalScores = {}
  dimensions.forEach(d => {
    finalScores[d.id] = Number((rawScores[d.id] / counts[d.id]).toFixed(1))
  })
  userScores.value = finalScores
}

const finishSurvey = () => {
  currentStep.value = 2
  // 🌟 使用 setTimeout 确保 DOM 彻底挂载并且有固定的高度
  setTimeout(() => {
    initRadarChart()
  }, 500)
}

const resetSurvey = () => {
  currentStep.value = 0
  currentQuestionIndex.value = 0
  answers.value = []
  userScores.value = {}
}

const copyCipher = async () => {
  try {
    await navigator.clipboard.writeText(cipherText.value)
    ElMessage.success('Data copied successfully!')
  } catch (err) {
    ElMessage.error('Failed to copy, select text manually.')
  }
}

// 🌟 绘制标准 16边形中英双语雷达图 (🌟修复重叠)
const initRadarChart = () => {
  if (!radarChartRef.value) return
  const myChart = echarts.init(radarChartRef.value)
  
  const indicator = dimensions.map((d, index) => {
    let color = '#303133'
    if(d.quad === 1) color = '#409EFF' 
    if(d.quad === 2) color = '#67c23a' 
    if(d.quad === 3) color = '#e6a23c' 
    if(d.quad === 4) color = '#f56c6c' 
    
    // 🌟 计算文本标签的垂直对齐方式，特别针对 Logic和Algo进行抬高，Bioscience和Corp进行降低
    let verticalAlign = 'middle'
    // ECharts 将雷达图分为上下左右。 Logic(1)和Algo(2)在顶部。 Bioscience(9)和Corp(12)在底部。 (数组索引是 0-15)
    if (index === 0 || index === 1) verticalAlign = 'bottom' // 将顶部标签上移
    if (index === 8 || index === 11) verticalAlign = 'top' // 将底部标签下移
    
    return { 
      // 🌟 核心：使用 \n 将中英文字符强制换行，上下排布
      name: `${d.cn}\n${d.en}`, 
      max: 5, 
      color: color,
      // 🌟 科学对齐：中英文上下居中
      textAlign: 'center',
      verticalAlign: verticalAlign // 针对特定位置进行垂直抬高或降低
    }
  })

  const dataValues = dimensions.map(d => userScores.value[d.id])

  const option = {
    backgroundColor: 'transparent',
    tooltip: { position: 'top', formatter: () => 'Max Score: 5.0' },
    radar: {
      indicator: indicator,
      shape: 'polygon', // 标准多边形
      splitNumber: 5,
      // 🌟 缩小半径以确保外部标签有足够空间
      radius: '48%', // 从 58% 或 65% 缩小
      // 🌟 增加间距
      nameGap: 35, // 标签与图形本体的间距大一倍
      axisName: { 
        fontWeight: 'bold', 
        fontSize: 11,
        lineHeight: 14, 
        align: 'center' 
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(64,158,255, 0.03)', 'rgba(64,158,255, 0.08)', 'rgba(64,158,255, 0.13)', 'rgba(64,158,255, 0.18)', 'rgba(64,158,255, 0.25)'],
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          shadowBlur: 10
        }
      },
      axisLine: { lineStyle: { color: 'rgba(64,158,255, 0.4)' } },
      splitLine: { lineStyle: { color: 'rgba(64,158,255, 0.4)' } }
    },
    series: [{
      name: 'Mindset Profile',
      type: 'radar',
      data: [
        {
          value: dataValues,
          name: 'Score',
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#409EFF', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64,158,255, 0.7)' },
              { offset: 1, color: 'rgba(64,158,255, 0.2)' }
            ])
          },
          lineStyle: { width: 3, color: '#409EFF' }
        }
      ]
    }]
  }
  myChart.setOption(option)
  window.addEventListener('resize', () => myChart.resize())
}
</script>

<style scoped>
.survey-container {
  max-width: 850px;
  margin: 30px auto;
  padding: 20px;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
}

.step-wrapper {
  width: 100%;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.06);
  padding: 50px;
  text-align: center;
}

/* 欢迎页样式不变 */
.welcome-step .header-icon { font-size: 70px; margin-bottom: 20px; }
.welcome-step h1 { color: #2c3e50; margin-bottom: 15px; font-weight: 800; letter-spacing: 1px;}
.welcome-step .subtitle { color: #606266; margin-bottom: 30px; font-size: 18px; }
.tips { background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 40px; text-align: left; border-left: 5px solid #409EFF;}
.tips p { margin: 8px 0; color: #7f8c8d; font-size: 14px;}
.start-btn { width: 250px; font-weight: bold; height: 50px; font-size: 16px; box-shadow: 0 8px 20px rgba(64,158,255,0.3);}

/* 答题区样式不变 */
.progress-bar {
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409EFF, #67c23a);
  transition: width 0.4s ease;
}
.question-header { color: #909399; font-weight: bold; margin-bottom: 40px; font-size: 14px;}
.question-card { min-height: 280px; display: flex; flex-direction: column; justify-content: center; }
.question-text { font-size: 24px; color: #2c3e50; margin-bottom: 45px; line-height: 1.6; font-weight: 600;}
.options-container { display: flex; flex-direction: column; gap: 14px; align-items: center; }
.option-btn {
  width: 100%;
  max-width: 450px;
  padding: 16px 20px;
  border: 2px solid #ebeef5;
  border-radius: 12px;
  background: #ffffff;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}
.option-btn:hover {
  background: #ecf5ff;
  border-color: #409EFF;
  color: #409EFF;
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(64,158,255,0.15);
}

/* 结果区 */
.result-step h2 { color: #2c3e50; margin-bottom: 15px; font-weight: 800; }
.top-traits { font-size: 16px; color: #606266; margin-bottom: 10px; line-height: 1.6; }
.top-traits strong { color: #f56c6c; margin: 0 5px; }

/* 🌟 确保雷达图容器有固定的高度 */
.radar-chart { width: 100%; height: 500px; margin: 0 auto; }

/* 密文框样式不变 */
.cipher-box {
  margin-top: 10px;
  background: #282c34;
  border-radius: 12px;
  text-align: left;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}
.cipher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #1e2227;
  color: #e5c07b;
  font-size: 14px;
  font-weight: bold;
}
.cipher-content {
  padding: 20px;
  color: #98c379;
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 13px;
  line-height: 1.6;
}

/* 动画过渡不变 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from { transform: translateX(30px); opacity: 0; }
.slide-fade-leave-to { transform: translateX(-30px); opacity: 0; }

@media (max-width: 768px) {
  .step-wrapper { padding: 30px 20px; }
  .question-text { font-size: 20px; }
  .radar-chart { height: 350px; }
}
</style>