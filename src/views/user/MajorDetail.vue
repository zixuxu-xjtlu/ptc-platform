<template>
  <div class="major-detail-container" v-loading="loading">
    <div class="top-nav fade-in-down" v-if="major">
      <div class="nav-left">
        <el-button :icon="ArrowLeft" circle @click="$router.back()"></el-button>
        <div class="title-box">
          <h2>{{ major.cnName }}</h2>
          <p>{{ major.enName }}</p>
        </div>
      </div>
      <el-button type="primary" size="large" round @click="openLink">进入学校官网</el-button>
    </div>

    <el-card class="info-card fade-in-up" shadow="hover" v-if="major">
      <template #header><div class="card-title">2026年选专业先修课与录取要求</div></template>
      <el-table :data="[major]" border stripe style="width: 100%; border-radius: 8px; overflow: hidden;">
        <el-table-column prop="sem1" label="第一学期先修课" min-width="200" />
        <el-table-column prop="sem2" label="第二学期先修课" min-width="200" />
        <el-table-column prop="extra" label="额外录取要求" min-width="250" />
      </el-table>
    </el-card>

    <el-row :gutter="25" class="chart-row" v-if="major">
      <el-col :md="12" :sm="24">
        <el-card class="chart-card fade-in-up" style="animation-delay: 0.2s" shadow="hover">
          <template #header><div class="card-title">历年录取分数线趋势</div></template>
          <div ref="scoreChartRef" class="chart-div"></div>
        </el-card>
      </el-col>
      <el-col :md="12" :sm="24">
        <el-card class="chart-card fade-in-up" style="animation-delay: 0.3s" shadow="hover">
          <template #header><div class="card-title">去年各年级奖学金分数线分布</div></template>
          <div ref="scholarshipChartRef" class="chart-div"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { db } from '../../cloudbase'

const route = useRoute()
const loading = ref(true)
const major = ref(null)
const scoreChartRef = ref(null)
const scholarshipChartRef = ref(null)

const initCharts = () => {
  if (!scoreChartRef.value || !scholarshipChartRef.value) return

  // 1. 录取分数线折线图
  const scoreChart = echarts.init(scoreChartRef.value)
  scoreChart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255, 255, 255, 0.9)' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: major.value.admissionScores.map(i => i.year) },
    yAxis: { type: 'value', min: 'dataMin' },
    series: [{
      name: '录取分数',
      data: major.value.admissionScores.map(i => i.score),
      type: 'line',
      smooth: true,
      symbolSize: 10,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset: 0, color: 'rgba(64,158,255,0.5)'}, {offset: 1, color: 'rgba(64,158,255,0.0)'}]) },
      itemStyle: { color: '#409EFF' },
      lineStyle: { width: 4 }
    }]
  })

  // 2. 奖学金三线图
  const scholarshipChart = echarts.init(scholarshipChartRef.value)
  scholarshipChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['5% 奖学金', '10% 奖学金', '25% 奖学金'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: major.value.scholarships.map(i => i.year) },
    yAxis: { type: 'value', min: 'dataMin' },
    series: [
      { name: '5% 奖学金', type: 'line', smooth: true, lineStyle: { width: 3 }, itemStyle: { color: '#f56c6c' }, data: major.value.scholarships.map(i => i.s5) },
      { name: '10% 奖学金', type: 'line', smooth: true, lineStyle: { width: 3 }, itemStyle: { color: '#e6a23c' }, data: major.value.scholarships.map(i => i.s10) },
      { name: '25% 奖学金', type: 'line', smooth: true, lineStyle: { width: 3 }, itemStyle: { color: '#67c23a' }, data: major.value.scholarships.map(i => i.s25) }
    ]
  })

  window.addEventListener('resize', () => { scoreChart.resize(); scholarshipChart.resize() })
}

onMounted(async () => {
  try {
    const res = await db.collection('majors').where({ cnName: route.params.name }).get()
    if (res.data && res.data.length > 0) {
      major.value = res.data[0]
      
      // 🌟 只兼容奖学金线，不动录取分数线
      if (major.value.scholarships && major.value.scholarships.length > 0 && major.value.scholarships[0].year === '2023') {
          major.value.scholarships[0].year = '大一'
          major.value.scholarships[1].year = '大二'
          major.value.scholarships[2].year = '大三'
      }

      await nextTick() 
      initCharts()
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

const openLink = () => {
  if(major.value.url) window.open(major.value.url, '_blank')
}
</script>

<style scoped>
.major-detail-container { padding: 30px; max-width: 1200px; margin: 0 auto; }
.top-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; background: white; padding: 25px 30px; border-radius: 16px; box-shadow: 0 5px 20px rgba(0,0,0,0.05);}
.nav-left { display: flex; align-items: center; gap: 20px; }
.title-box h2 { margin: 0; font-size: 28px; color: #303133; }
.title-box p { margin: 5px 0 0 0; color: #909399; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;}

.info-card { margin-bottom: 25px; border-radius: 16px; border: none; }
.card-title { font-weight: bold; font-size: 18px; color: #303133; }
:deep(.el-table th.el-table__cell) { background-color: #f5f7fa !important; color: #606266; }

.chart-row { margin-top: 25px; }
.chart-card { border-radius: 16px; height: 460px; border: none; }
.chart-div { height: 360px; width: 100%; margin-top: 10px;}

.fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.23, 1, 0.32, 1) both; }
.fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) both; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

@media screen and (max-width: 768px) {
  .top-nav { flex-direction: column; align-items: flex-start; gap: 20px; }
  .chart-card { margin-bottom: 20px; }
}
</style>