<template>
  <div class="major-selection-container">
    <div class="header-section fade-in">
      <h1>西浦选专业指导 (2026版)</h1>
      <p>探索你的学术兴趣，提前规划大二专业</p>
      
      <div class="action-box">
        <el-button type="primary" size="large" round class="survey-btn" @click="goToSurvey">
          <el-icon class="mr-1"><MagicStick /></el-icon> 开始专业兴趣评估
        </el-button>
      </div>
    </div>

    <div v-if="majorList.length === 0 && !loading" class="init-box">
      <el-empty description="数据库中暂无专业数据">
        <el-button type="primary" size="large" @click="importData" :loading="importing">
          {{ importing ? '正在疯狂写入数据库...' : '一键导入全部 50+ 个专业数据' }}
        </el-button>
      </el-empty>
    </div>

    <div class="major-grid" v-else>
      <el-card 
        v-for="(item, index) in majorList" 
        :key="item._id" 
        class="major-card scale-in"
        :style="{ animationDelay: (index % 10) * 0.05 + 's' }"
        @click="goToDetail(item.cnName)"
        shadow="hover"
      >
        <div class="card-content">
          <h3 class="cn-name">{{ item.cnName }}</h3>
          <p class="en-name">{{ item.enName }}</p>
        </div>
        <div class="card-footer">
          <span>查看录取要求与分数线</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, MagicStick } from '@element-plus/icons-vue' // 引入魔法棒图标
import { ElMessage } from 'element-plus'
import { db } from '../../cloudbase'

const router = useRouter()
const majorList = ref([])
const loading = ref(true)
const importing = ref(false)

const fetchMajors = async () => {
  loading.value = true
  try {
    const res = await db.collection('majors').limit(100).get()
    majorList.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMajors)

const goToDetail = (name) => {
  router.push(`/user/major/${name}`)
}

// 🌟 新增：跳转到问卷的逻辑
const goToSurvey = () => {
  router.push('/user/survey')
}

// 一键导入逻辑保持不变
const importData = async () => {
  importing.value = true
  ElMessage.info('正在逐条导入专业数据，预计需要 5-10 秒，请勿关闭页面...')
  
  const mockScores = () => [ { year: '2023', score: 60 + Math.floor(Math.random()*15) }, { year: '2024', score: 62 + Math.floor(Math.random()*15) }, { year: '2025', score: 61 + Math.floor(Math.random()*15) } ]
  const mockScholarships = () => [
    { year: '2023', s5: 75, s10: 70, s25: 65 },
    { year: '2024', s5: 76, s10: 72, s25: 66 },
    { year: '2025', s5: 74, s10: 71, s25: 67 }
  ]

  const RAW_DATA = [
    { en: "COMPUTER SCIENCE AND TECHNOLOGY", cn: "计算机科学与技术", s1: "微积分: MTH013/023/025&027，线性代数: MTH007/015", s2: "多元微积分: MTH008", req: "取决于第一学期特定微积分及线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/computer-science-and-technology" },
    { en: "DIGITAL MEDIA TECHNOLOGY", cn: "数字媒体技术", s1: "微积分: MTH013/023/025&027，线性代数: MTH007/015", s2: "物理，多元微积分: MTH008", req: "取决于第一学期特定微积分及线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/digital-media-technology" },
    { en: "ELECTRICAL ENGINEERING", cn: "电气工程及其自动化", s1: "微积分: MTH013/023/025&027，线性代数: MTH007/015", s2: "物理，多元微积分: MTH008", req: "取决于第一学期特定微积分及线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/electrical-engineering" },
    { en: "ELECTRONIC SCIENCE AND TECHNOLOGY", cn: "电子科学与技术", s1: "微积分: MTH013/023/025&027，线性代数: MTH007/015", s2: "物理，多元微积分: MTH008", req: "取决于第一学期特定微积分及线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/electronic-science-and-technology" },
    { en: "INFORMATION AND COMPUTING SCIENCE", cn: "信息与计算科学", s1: "微积分: MTH013/023/025&027，线性代数: MTH007/015", s2: "多元微积分: MTH008", req: "取决于第一学期特定微积分及线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/information-and-computing-science" },
    { en: "MECHATRONICS AND ROBOTIC SYSTEMS", cn: "机械电子工程", s1: "微积分: MTH013/023/025&027，线性代数: MTH007/015", s2: "物理，多元微积分: MTH008", req: "取决于第一学期特定微积分及线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/mechatronics-and-robotic-systems" },
    { en: "TELECOMMUNICATIONS ENGINEERING", cn: "通信工程", s1: "微积分: MTH013/023/025&027，线性代数: MTH007/015", s2: "物理，多元微积分: MTH008", req: "取决于第一学期特定微积分及线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/telecommunications-engineering" },
    { en: "ARTIFICIAL INTELLIGENCE - INTELLIGENT SYSTEMS PATHWAY", cn: "人工智能", s1: "微积分，线性代数", s2: "物理，多元微积分", req: "取决于第一学期微积分和线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/artificial-intelligence" },
    { en: "ACCOUNTING", cn: "会计学", s1: "微积分", s2: "多元微积分", req: "取决于第一学期微积分课程的成绩", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/accounting" },
    { en: "BUSINESS ADMINISTRATION", cn: "工商管理", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/business-administration" },
    { en: "ECONOMICS AND FINANCE", cn: "经济与金融", s1: "微积分", s2: "多元微积分", req: "取决于第一学期微积分课程的成绩", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/economics-and-finance" },
    { en: "ECONOMICS", cn: "经济学", s1: "微积分", s2: "多元微积分", req: "取决于第一学期微积分课程的成绩", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/economics" },
    { en: "HUMAN RESOURCE MANAGEMENT AND PEOPLE ANALYTICS", cn: "人力资源管理", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/human-resource-management" },
    { en: "DIGITAL AND INTELLIGENT MARKETING", cn: "市场营销", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/marketing" },
    { en: "INTERNATIONAL BUSINESS WITH A LANGUAGE", cn: "国际商务", s1: "必须在大一修读第二外语课程且至少达阶段二", s2: "同左", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/international-business-with-a-language" },
    { en: "INFORMATION MANAGEMENT AND INFORMATION SYSTEMS", cn: "信息管理与信息系统", s1: "微积分，线性代数", s2: "多元微积分", req: "取决于第一学期微积分和线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/information-management-and-information-systems" },
    { en: "PHARMACEUTICAL SCIENCES", cn: "药学", s1: "微积分", s2: "多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/pharmaceutical-sciences" },
    { en: "BIOMEDICAL STATISTICS", cn: "应用统计学", s1: "微积分，线性代数", s2: "多元微积分: MTH004/008", req: "取决于第一学期微积分和线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/applied-statistics" },
    { en: "BIOPHARMACEUTICALS", cn: "生物制药", s1: "微积分", s2: "物理，多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/biopharmaceuticals" },
    { en: "CHINA STUDIES", cn: "汉语国际教育", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/china-studies" },
    { en: "INTERNATIONAL RELATIONS", cn: "国际事务与国际关系", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/international-relations" },
    { en: "MEDIA AND COMMUNICATION STUDIES", cn: "传播学", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/communication-studies" },
    { en: "APPLIED LINGUISTICS", cn: "应用语言学", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/applied-linguistics" },
    { en: "TRANSLATION AND INTERPRETING", cn: "翻译", s1: "无", s2: "无", req: "母语为非汉语的国际生及港澳台生需要通过能力测试或达到HSK 6级", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/translation-and-interpreting" },
    { en: "ENGLISH AND BUSINESS - Finance and Economics Pathway", cn: "金融商务英语 - 金融经济方向", s1: "微积分", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/english-and-business" },
    { en: "ENGLISH AND BUSINESS - Management Pathway", cn: "金融商务英语 - 商务管理方向", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/english-and-business" },
    { en: "ENGLISH STUDIES IN GLOBAL CONTEXT", cn: "全球语境下的英语研究", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate" },
    { en: "ENGLISH AND COMMUNICATIONS STUDIES", cn: "传媒英语", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/english-and-communication-studies" },
    { en: "APPLIED MATHEMATICS", cn: "数学与应用数学", s1: "微积分，线性代数", s2: "物理，多元微积分: MTH004/008", req: "取决于第一学期微积分和线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/applied-mathematics" },
    { en: "BIOINFORMATICS", cn: "生物信息学", s1: "微积分，线性代数", s2: "多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/bioinformatics" },
    { en: "BIOMEDICAL SCIENCES", cn: "生物医学科学", s1: "微积分", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/biomedical-sciences" },
    { en: "ACTUARIAL SCIENCE", cn: "精算学", s1: "微积分，线性代数", s2: "多元微积分: MTH004/008", req: "取决于第一学期微积分和线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/actuarial-science" },
    { en: "BIOLOGICAL SCIENCES", cn: "生物科学", s1: "微积分", s2: "无", req: "取决于第一学期微积分课程的成绩", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/biological-sciences" },
    { en: "MATERIALS SCIENCE AND ENGINEERING", cn: "材料科学与工程", s1: "微积分", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/materials-science-and-engineering-2" },
    { en: "INDUSTRIAL DESIGN", cn: "工业设计", s1: "微积分，线性代数", s2: "物理，多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/industrial-design" },
    { en: "FINANCIAL MATHEMATICS", cn: "金融数学", s1: "微积分: MTH029/023，线性代数: MTH017", s2: "多元微积分: MTH004/008", req: "取决于第一学期特定微积分及线性代数的算术平均分", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/financial-mathematics" },
    { en: "APPLIED CHEMISTRY", cn: "应用化学", s1: "微积分", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/applied-chemistry" },
    { en: "ENVIRONMENTAL SCIENCE", cn: "环境科学", s1: "微积分", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/environmental-science" },
    { en: "ARCHITECTURE", cn: "建筑学", s1: "微积分及 ARC001/DES003 等", s2: "多元微积分及 DES002/DES004", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/architecture" },
    { en: "URBAN PLANNING AND DESIGN", cn: "城乡规划", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/urban-planning-and-design" },
    { en: "CIVIL ENGINEERING", cn: "土木工程", s1: "微积分，线性代数", s2: "多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/civil-engineering" },
    { en: "TV PRODUCTION", cn: "广播电视学", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/film-and-television-production" },
    { en: "ARTS, TECHNOLOGY AND ENTERTAINMENT", cn: "艺术与科技 (Taicang)", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/arts-technology-and-entertainment" },
    { en: "INTERNET OF THINGS ENGINEERING", cn: "物联网工程 (Taicang)", s1: "微积分，线性代数", s2: "多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/internet-of-things-engineering" },
    { en: "INTELLIGENT MANUFACTURING ENGINEERING", cn: "智能制造工程 (Taicang)", s1: "微积分，线性代数", s2: "多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/intelligent-manufacturing-engineering" },
    { en: "DIGITAL MEDIA ARTS", cn: "数字媒体艺术", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/digital-media-arts" },
    { en: "FILMMAKING", cn: "影视摄影与制作", s1: "无", s2: "无", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/filmmaking" },
    { en: "DATA SCIENCE AND BIG DATA TECHNOLOGY", cn: "数据科学与大数据技术 (Taicang)", s1: "微积分，线性代数", s2: "多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/data-science-and-big-data-technology" },
    { en: "INTELLIGENT ROBOTICS ENGINEERING", cn: "机器人工程 (Taicang)", s1: "微积分，线性代数", s2: "多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/intelligent-robotics-engineering" },
    { en: "INTELLIGENT SUPPLY CHAIN", cn: "供应链管理 (Taicang)", s1: "微积分", s2: "多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/intelligent-supply-chain" },
    { en: "MICROELECTRONIC SCIENCE AND ENGINEERING", cn: "微电子科学与工程 (Taicang)", s1: "微积分，线性代数", s2: "多元微积分", req: "无", url: "https://www.xjtlu.edu.cn/zh/study/undergraduate/microelectronic-science-and-engineering" }
  ]

  try {
    const promises = RAW_DATA.map(item => {
      return db.collection('majors').add({
        enName: item.en,
        cnName: item.cn,
        url: item.url,
        sem1: item.s1,
        sem2: item.s2,
        extra: item.req,
        admissionScores: mockScores(),
        scholarships: mockScholarships()
      })
    })
    await Promise.all(promises)
    ElMessage.success('太棒了！51个专业数据已成功注入数据库！')
    fetchMajors()
  } catch (error) {
    console.error(error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.major-selection-container { padding: 40px 20px; max-width: 1400px; margin: 0 auto; }
.header-section { text-align: center; margin-bottom: 50px; }
.header-section h1 { font-size: 32px; color: #303133; margin-bottom: 10px; }
.header-section p { color: #909399; margin-bottom: 25px;}

.action-box { display: flex; justify-content: center; }
.survey-btn { font-size: 16px; font-weight: bold; padding: 12px 30px; box-shadow: 0 8px 20px rgba(64,158,255,0.2); transition: all 0.3s; }
.survey-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(64,158,255,0.3); }

.mr-1 { margin-right: 6px; }
.init-box { margin-top: 50px; text-align: center; }

.major-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
.major-card { cursor: pointer; border-radius: 16px; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid #ebeef5; height: 160px; display: flex; flex-direction: column; }
.major-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(64, 158, 255, 0.1) !important; border-color: #409EFF; }
.card-content { flex: 1; padding: 25px 20px; text-align: center; }
.cn-name { font-size: 20px; margin: 0 0 10px 0; color: #303133; font-weight: bold;}
.en-name { font-size: 12px; color: #909399; line-height: 1.2; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

.card-footer { padding: 12px; background: #f8fbff; display: flex; justify-content: center; align-items: center; gap: 5px; font-size: 13px; color: #409EFF; border-top: 1px solid #ebeef5; }

.scale-in { animation: scaleIn 0.5s ease backwards; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
</style>