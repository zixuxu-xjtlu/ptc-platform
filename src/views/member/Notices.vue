<template>
  <div class="member-notices-container">
    <div class="page-header mb-24 fade-in-down">
      <div class="header-left">
        <h2>📢 执行团队公告管理</h2>
        <p class="subtitle">同步社团动向，管理内外部通讯</p>
      </div>
      <el-button type="primary" size="large" round class="publish-btn shadow-glow" @click="handleOpenForm()">
        <el-icon class="mr-1"><EditPen /></el-icon> 发布新公告
      </el-button>
    </div>

    <el-card shadow="never" class="main-card fade-in-up">
      <el-tabs v-model="activeTab" class="custom-tabs">
        
        <el-tab-pane name="unread">
          <template #label>
            <span class="tab-label">
              🔔 最新动向 
              <el-badge :value="unreadNotices.length" class="mark" type="danger" :hidden="unreadNotices.length === 0" />
            </span>
          </template>

          <el-empty v-if="unreadNotices.length === 0" description="暂无新动向，保持关注" :image-size="120" />

          <div class="notice-grid">
            <transition-group name="staggered-list">
              <div v-for="notice in unreadNotices" :key="notice._id" class="img-notice-card" @click="openNoticeDetail(notice)">
                
                <div class="card-cover-box">
                  <img v-if="notice.coverUrl" :src="notice.coverUrl" class="card-cover" />
                  <div v-else class="card-cover-placeholder">PTC<br>Notice</div>
                  
                  <div class="status-badges">
                    <span class="badge unread-badge">未读</span>
                    <span :class="['badge target-badge', notice.targets === 'user' ? 'public-badge' : 'internal-badge']">
                      {{ notice.targets === 'user' ? '公开' : '内部' }}
                    </span>
                  </div>
                  <div class="cover-overlay"></div>
                  
                  <div class="admin-actions" @click.stop>
                    <el-button circle size="small" type="primary" icon="Edit" @click="handleOpenForm(notice)" />
                    <el-button circle size="small" type="danger" icon="Delete" @click="handleDelete(notice._id)" />
                  </div>
                </div>
                
                <div class="card-info">
                  <h3 class="card-title">{{ notice.title }}</h3>
                  <p class="card-desc">{{ notice.content || '点击查看详细内容...' }}</p>
                  <div class="card-bottom">
                    <span class="card-time"><el-icon><Clock /></el-icon> {{ formatDate(notice.createTime) }}</span>
                    <span class="read-hint text-primary font-bold text-sm">查看详情 &rarr;</span>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </el-tab-pane>

        <el-tab-pane name="read">
          <template #label>
            <span class="tab-label">📦 已读归档</span>
          </template>

          <el-empty v-if="readNotices.length === 0" description="暂无归档记录" :image-size="120" />

          <div class="notice-grid">
            <transition-group name="staggered-list">
              <div v-for="notice in readNotices" :key="notice._id" class="img-notice-card read-state" @click="openNoticeDetail(notice)">
                <div class="card-cover-box">
                  <img v-if="notice.coverUrl" :src="notice.coverUrl" class="card-cover" />
                  <div v-else class="card-cover-placeholder bg-gray">PTC<br>Notice</div>
                  <div class="status-badges">
                    <span :class="['badge target-badge', notice.targets === 'user' ? 'public-badge' : 'internal-badge']">
                      {{ notice.targets === 'user' ? '公开' : '内部' }}
                    </span>
                  </div>
                  <div class="cover-overlay"></div>
                  <div class="admin-actions" @click.stop>
                    <el-button circle size="small" type="primary" icon="Edit" @click="handleOpenForm(notice)" />
                    <el-button circle size="small" type="danger" icon="Delete" @click="handleDelete(notice._id)" />
                  </div>
                </div>
                <div class="card-info">
                  <h3 class="card-title">{{ notice.title }}</h3>
                  <p class="card-desc">{{ notice.content }}</p>
                  <div class="card-bottom">
                    <span class="card-time"><el-icon><Clock /></el-icon> {{ formatDate(notice.createTime) }}</span>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-card>

    <el-dialog v-model="detailVisible" title="公告详情" width="500px" custom-class="glass-dialog">
      <div v-if="currentNotice" class="detail-content">
        <img v-if="currentNotice.coverUrl" :src="currentNotice.coverUrl" class="detail-img mb-4" />
        <h2 class="detail-title mb-2">{{ currentNotice.title }}</h2>
        <div class="detail-meta mb-4 text-gray-400 text-sm flex items-center gap-4">
          <span>发布时间：{{ formatDate(currentNotice.createTime) }}</span>
          <el-tag size="small" :type="currentNotice.targets === 'user' ? 'success' : 'warning'">
            {{ currentNotice.targets === 'user' ? '面向全体' : '内部执行' }}
          </el-tag>
        </div>
        <p class="detail-text leading-relaxed text-gray-700 whitespace-pre-wrap">{{ currentNotice.content }}</p>
        <div v-if="currentNotice.link" class="mt-4 pt-4 border-t border-gray-100">
          <el-button type="primary" plain @click="window.open(currentNotice.link, '_blank')">查看外链原文</el-button>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">确认知晓</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="formVisible" :title="isEditing ? '修改公告' : '发布新公告'" width="600px" :close-on-click-modal="false">
      <el-form :model="formData" label-width="90px" @submit.prevent>
        
        <el-form-item label="公告标题" required>
          <el-input v-model="formData.title" placeholder="请输入引人注目的标题" />
        </el-form-item>
        
        <el-form-item label="发布对象" required>
          <el-radio-group v-model="formData.targets">
            <el-radio label="user">全体用户 (公开)</el-radio>
            <el-radio label="member">仅执行团队 (内部)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="封面图片">
          <div class="upload-area" v-loading="uploading">
            <el-upload
              class="cover-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept="image/*"
            >
              <img v-if="formData.coverUrl" :src="formData.coverUrl" class="cover-preview" />
              <div v-else class="uploader-placeholder">
                <el-icon class="text-2xl mb-2 text-gray-400"><Plus /></el-icon>
                <span class="text-xs text-gray-400">点击上传封面</span>
              </div>
            </el-upload>
            <p class="text-xs text-gray-400 mt-2 line-height-normal">建议尺寸比例 16:9。图片将自动上传至腾讯云存储。</p>
          </div>
        </el-form-item>

        <el-form-item label="正文/简述" required>
          <el-input v-model="formData.content" type="textarea" :rows="4" placeholder="请填写公告正文，或用于展示在卡片上的简介" />
        </el-form-item>

        <el-form-item label="外部链接">
          <el-input v-model="formData.link" placeholder="例如: https://mp.weixin.qq.com/... (选填)" />
        </el-form-item>

      </el-form>
      <template #footer>
        <el-button @click="formVisible = false" :disabled="submitting">取消</el-button>
        <el-button type="primary" @click="submitNotice" :loading="submitting">
          {{ isEditing ? '保存修改' : '确认发布' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, EditPen, Edit, Delete, Plus } from '@element-plus/icons-vue'
import { db, app } from '../../cloudbase' // ⚠️ 确保 cloudbase.js 中导出了 app

const activeTab = ref('unread')
const allNotices = ref([])
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// 本地阅读记录
const readStorageKey = `member_read_${currentUser.value._id}`
const readIds = ref(JSON.parse(localStorage.getItem(readStorageKey) || '[]'))

// 弹窗与表单状态
const detailVisible = ref(false)
const currentNotice = ref(null)

const formVisible = ref(false)
const isEditing = ref(false)
const uploading = ref(false)
const submitting = ref(false)
const formData = ref({
  _id: '',
  title: '',
  content: '',
  targets: 'user', // 默认公开
  coverUrl: '',
  link: ''
})

// 初始化获取数据
const fetchNotices = async () => {
  try {
    // Member 可以看到发给 user 和 member 的所有公告
    const res = await db.collection('announcements').limit(100).get()
    allNotices.value = (res.data || []).sort((a,b) => new Date(b.createTime) - new Date(a.createTime))
  } catch (error) {
    ElMessage.error('获取公告列表失败')
  }
}

onMounted(() => {
  fetchNotices()
})

const unreadNotices = computed(() => allNotices.value.filter(n => !readIds.value.includes(n._id)))
const readNotices = computed(() => allNotices.value.filter(n => readIds.value.includes(n._id)))

// ================= 阅读公告逻辑 =================
const openNoticeDetail = (notice) => {
  currentNotice.value = notice
  detailVisible.value = true
  
  // 标记为已读
  if (!readIds.value.includes(notice._id)) {
    readIds.value.push(notice._id)
    localStorage.setItem(readStorageKey, JSON.stringify(readIds.value))
  }
}

// ================= 发布/编辑公告逻辑 =================
const handleOpenForm = (notice = null) => {
  if (notice) {
    isEditing.value = true
    formData.value = { ...notice }
  } else {
    isEditing.value = false
    formData.value = { _id: '', title: '', content: '', targets: 'user', coverUrl: '', link: '' }
  }
  formVisible.value = true
}

// 处理图片选择并直传云存储
const handleFileChange = async (file) => {
  if (!file.raw) return
  const rawFile = file.raw
  
  // 简单校验格式和大小
  if (!rawFile.type.startsWith('image/')) {
    return ElMessage.error('只能上传图片文件！')
  }
  if (rawFile.size / 1024 / 1024 > 5) {
    return ElMessage.error('图片大小不能超过 5MB！')
  }

  uploading.value = true
  try {
    // 构造云存储路径，避免重名
    const extension = rawFile.name.split('.').pop()
    const cloudPath = `ptc_covers/notice_${Date.now()}_${Math.floor(Math.random()*1000)}.${extension}`
    
    // 1. 上传到 CloudBase 云存储
    const uploadRes = await app.uploadFile({
      cloudPath: cloudPath,
      filePath: rawFile
    })
    
    // 2. 获取真实的 HTTPS 下载链接
    const tempUrlRes = await app.getTempFileURL({
      fileList: [uploadRes.fileID]
    })
    
    // 3. 将真实链接赋给表单
    if (tempUrlRes.fileList && tempUrlRes.fileList[0].code === 'SUCCESS') {
      formData.value.coverUrl = tempUrlRes.fileList[0].tempFileURL
      ElMessage.success('图片上传成功！')
    } else {
      throw new Error('获取图片链接失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('图片上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

const submitNotice = async () => {
  if (!formData.value.title || !formData.value.content) {
    return ElMessage.warning('标题和正文不能为空')
  }

  submitting.value = true
  try {
    const dataToSave = {
      title: formData.value.title,
      content: formData.value.content,
      targets: formData.value.targets,
      coverUrl: formData.value.coverUrl,
      link: formData.value.link,
      updateTime: new Date().getTime()
    }

    if (isEditing.value) {
      await db.collection('announcements').doc(formData.value._id).update(dataToSave)
      ElMessage.success('修改成功')
    } else {
      dataToSave.createTime = new Date().getTime()
      dataToSave.authorId = currentUser.value._id
      await db.collection('announcements').add(dataToSave)
      ElMessage.success('发布成功')
    }
    
    formVisible.value = false
    fetchNotices() // 刷新列表
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// ================= 删除公告逻辑 =================
const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条公告吗？此操作不可恢复。', '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await db.collection('announcements').doc(id).remove()
      ElMessage.success('删除成功')
      fetchNotices() // 刷新列表
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${d.getFullYear()}/${(d.getMonth() + 1)}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}
</script>

<style scoped>
/* 动画与布局基础 */
.fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.member-notices-container { padding: 10px; max-width: 1200px; margin: 0 auto; }
.mb-24 { margin-bottom: 24px; }
.mr-1 { margin-right: 4px; }

/* 头部样式 */
.page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
.header-left h2 { margin: 0 0 8px 0; color: #2c3e50; font-size: 26px; font-weight: 800; letter-spacing: 1px;}
.subtitle { margin: 0; color: #7f8c8d; font-size: 15px; }
.publish-btn { font-weight: bold; padding: 10px 24px; }
.shadow-glow { box-shadow: 0 4px 15px rgba(64,158,255,0.3); transition: all 0.3s;}
.shadow-glow:hover { box-shadow: 0 6px 20px rgba(64,158,255,0.5); transform: translateY(-2px); }

/* 主体容器 */
.main-card { min-height: 700px; border-radius: 20px; border: none; box-shadow: 0 12px 40px rgba(0,0,0,0.04) !important; background: #fff;}
.tab-label { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700;}
:deep(.el-tabs__item) { height: 60px; line-height: 60px; padding: 0 30px; transition: all 0.3s;}
:deep(.el-tabs__item.is-active) { color: #409EFF; }
:deep(.el-tabs__active-bar) { height: 4px; border-radius: 4px; }

/* 🌟 网格布局与丝滑卡片 */
.notice-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 24px; 
  padding: 20px 0; 
}
.img-notice-card { 
  background: #ffffff; 
  border: 1px solid #ebeef5; 
  border-radius: 16px; 
  overflow: hidden; 
  cursor: pointer; 
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  position: relative;
}
.img-notice-card:hover { 
  box-shadow: 0 16px 32px rgba(0,0,0,0.12); 
  transform: translateY(-8px); 
  border-color: transparent;
}

/* 封面与遮罩 */
.card-cover-box { 
  width: 100%; 
  height: 160px; 
  position: relative; 
  overflow: hidden; 
}
.card-cover { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.img-notice-card:hover .card-cover { transform: scale(1.08); }
.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.img-notice-card:hover .cover-overlay { opacity: 1; }

/* 占位图 */
.card-cover-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.8); font-size: 24px; font-weight: 900; letter-spacing: 2px;
  transition: transform 0.6s ease;
}
.img-notice-card:hover .card-cover-placeholder { transform: scale(1.08); }
.card-cover-placeholder.bg-gray { background: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%); }

/* 角标与管理按钮 */
.status-badges {
  position: absolute; top: 12px; right: 12px;
  display: flex; gap: 6px; z-index: 10;
}
.badge {
  color: white; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 20px;
}
.unread-badge { background: #f56c6c; box-shadow: 0 2px 8px rgba(245,108,108,0.4); }
.public-badge { background: #67c23a; box-shadow: 0 2px 8px rgba(103,194,58,0.4); }
.internal-badge { background: #e6a23c; box-shadow: 0 2px 8px rgba(230,162,60,0.4); }

.admin-actions {
  position: absolute; bottom: 12px; right: 12px;
  display: flex; gap: 8px; z-index: 20;
  opacity: 0; transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.img-notice-card:hover .admin-actions { opacity: 1; transform: translateY(0); }

/* 卡片文本信息 */
.card-info { padding: 20px; display: flex; flex-direction: column; flex: 1; background: white; z-index: 2;}
.card-title { margin: 0 0 10px; font-size: 17px; color: #2c3e50; font-weight: 700; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.3s ease;}
.img-notice-card:hover .card-title { color: #409EFF; }
.card-desc { font-size: 13px; color: #7f8c8d; margin: 0 0 20px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; line-height: 1.6;}

.card-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f0f2f5; padding-top: 15px;}
.card-time { font-size: 12px; color: #95a5a6; display: flex; align-items: center; gap: 4px; font-weight: 500;}
.read-hint { opacity: 0; transform: translateX(-10px); transition: all 0.3s ease; }
.img-notice-card:hover .read-hint { opacity: 1; transform: translateX(0); color: #409EFF;}

/* 已读状态样式置灰 */
.read-state .card-title, .read-state .card-desc { color: #95a5a6; }
.read-state { filter: grayscale(50%); opacity: 0.85; }
.read-state:hover { filter: grayscale(0%); opacity: 1; } 

/* 列表过渡动画 */
.staggered-list-move, .staggered-list-enter-active, .staggered-list-leave-active { transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1); }
.staggered-list-enter-from, .staggered-list-leave-to { opacity: 0; transform: scale(0.9) translateY(30px); }
.staggered-list-leave-active { position: absolute; }

/* ================= 详情与表单样式 ================= */
.detail-img { width: 100%; border-radius: 12px; object-fit: cover; max-height: 250px; }
.upload-area { border: 2px dashed #dcdfe6; border-radius: 8px; padding: 10px; text-align: center; transition: all 0.3s; background: #fafafa;}
.upload-area:hover { border-color: #409EFF; background: #f0f7ff;}
.cover-uploader { display: block; width: 100%; height: 140px; }
.uploader-placeholder { height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
.cover-preview { width: 100%; height: 140px; object-fit: cover; border-radius: 6px; }
.text-primary { color: #409EFF; }

/* 📱 手机端适配 */
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .publish-btn { width: 100%; margin-top: 10px; }
  .notice-grid { grid-template-columns: 1fr; gap: 16px; }
  .admin-actions { opacity: 1; transform: translateY(0); } /* 手机端始终显示操作按钮 */
}
</style>