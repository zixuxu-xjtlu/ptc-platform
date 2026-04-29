<template>
  <el-dialog
    v-model="visible"
    :title="updateData.title"
    width="90%"
    style="max-width: 400px; border-radius: 12px;"
    :show-close="!updateData.is_force"
    :close-on-click-modal="!updateData.is_force"
    :close-on-press-escape="!updateData.is_force"
    center
  >
    <div class="update-content">
      <div class="version-tag">版本号：{{ updateData.latest_version }}</div>
      <ul class="update-list">
        <li v-for="(item, index) in updateData.content" :key="index">
          {{ item }}
        </li>
      </ul>
    </div>
    <template #footer>
      <el-button type="primary" class="confirm-btn" @click="handleConfirm" :loading="loading">
        我知道啦，开启新版本！
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../../cloudbase' // 替换成你真实的 cloudbase 引入路径

const visible = ref(false)
const loading = ref(false)
const updateData = ref({})
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

onMounted(() => {
  checkUpdate()
})

// 核心逻辑：检查更新
// 核心逻辑：检查更新 (替换原有的 checkUpdate 方法)
const checkUpdate = async () => {
  if (!currentUser.value || !currentUser.value._id) return

  try {
    // 关键改动：直接从云开发数据库读取最新配置，取代读取静态文件
    const res = await db.collection('system_config').doc('version_notice').get()
    
    // 如果数据库里还没配这条数据，就直接 return 不弹窗
    if (!res.data || res.data.length === 0) return 
    
    const serverLog = res.data[0] // 获取数据库里的最新公告数据
    const userLastSeen = currentUser.value.last_seen_version || 'v1.0.0'

    // 比对版本号
    if (serverLog.latest_version && serverLog.latest_version !== userLastSeen) {
      updateData.value = serverLog
      visible.value = true
    }
  } catch (error) {
    console.error('获取全站更新日志失败:', error)
  }
}

// 用户点击确认阅读
const handleConfirm = async () => {
  loading.value = true
  const newVersion = updateData.value.latest_version

  try {
    // 1. 更新数据库中的用户字段
    await db.collection('users').doc(currentUser.value._id).update({
      last_seen_version: newVersion
    })

    // 2. 同步更新本地 LocalStorage
    currentUser.value.last_seen_version = newVersion
    localStorage.setItem('user', JSON.stringify(currentUser.value))

    // 3. 关掉弹窗
    visible.value = false
  } catch (error) {
    console.error('更新用户阅读状态失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.update-content { padding: 10px 0; }
.version-tag { display: inline-block; background: #e1f3d8; color: #67c23a; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-bottom: 15px; font-weight: bold; }
.update-list { list-style: none; padding: 0; margin: 0; }
.update-list li { font-size: 14px; color: #606266; line-height: 1.8; margin-bottom: 8px; }
.confirm-btn { width: 100%; border-radius: 8px; font-weight: bold; }
</style>