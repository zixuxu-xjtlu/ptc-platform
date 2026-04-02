<template>
  <div class="admin-activity-container">
    <div class="page-header mb-24 animate-down">
      <div class="title-section">
        <div class="admin-badge">GLOBAL CONTROL</div>
        <h2>📢 发布中心与全域监控</h2>
        <p class="subtitle">统筹社团通知下发，实时追踪全站活动数据流</p>
      </div>
      <div class="action-section">
        <el-button type="primary" size="large" round class="publish-btn shadow-glow" @click="handleOpenForm">
          <el-icon class="mr-5"><Plus /></el-icon> 
          {{ activeTab === 'notices' ? '发布新公告' : '发起新活动' }}
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="premium-tabs animate-up" @tab-change="handleTabChange">
      
      <el-tab-pane name="notices">
        <template #label><span class="tab-label"><el-icon><Bell /></el-icon> 公告管理</span></template>
        
        <el-empty v-if="noticeList.length === 0" description="尚无公告，点击右上角发布第一条" />

        <div class="admin-grid" v-loading="tableLoading">
          <transition-group name="staggered-list">
            <div v-for="notice in noticeList" :key="notice._id" class="img-admin-card">
              <div class="card-cover-box">
                <img v-if="notice.coverUrl" :src="notice.coverUrl" class="card-cover" />
                <div v-else class="card-cover-placeholder">SYSTEM<br>NOTICE</div>
                
                <div class="status-badges">
                  <el-tag v-for="t in notice.targets" :key="t" size="small" :type="t==='admin'?'danger':(t==='member'?'warning':'success')" effect="dark" class="badge">
                    {{ t === 'user' ? '公开' : (t === 'member' ? '成员' : '管理') }}
                  </el-tag>
                </div>

                <div class="admin-actions">
                  <el-button circle size="small" type="primary" icon="Edit" @click="handleOpenForm(notice)" />
                  <el-button circle size="small" type="danger" icon="Delete" @click="handleDelete(notice._id, 'announcements')" />
                </div>
                <div class="cover-overlay"></div>
              </div>
              
              <div class="card-info">
                <h3 class="card-title">{{ notice.title }}</h3>
                <p class="card-desc">{{ notice.content || '暂无简介...' }}</p>
                <div class="card-bottom">
                  <span class="card-time"><el-icon><Clock /></el-icon> {{ formatDate(notice.createTime) }}</span>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </el-tab-pane>

      <el-tab-pane name="activities">
        <template #label><span class="tab-label"><el-icon><Calendar /></el-icon> 活动监控</span></template>
        
        <el-empty v-if="activityList.length === 0" description="暂无活动，开始策划一场精彩活动吧" />

        <div class="admin-grid" v-loading="tableLoading">
          <transition-group name="staggered-list">
            <div v-for="activity in activityList" :key="activity._id" class="img-admin-card">
              <div class="card-cover-box">
                <img v-if="activity.coverUrl" :src="activity.coverUrl" class="card-cover" />
                <div v-else class="card-cover-placeholder bg-blue">PTC<br>EVENT</div>
                
                <div class="status-badges">
                   <el-tag size="small" type="primary" effect="dark" class="badge">活动</el-tag>
                </div>

                <div class="admin-actions">
                  <el-button circle size="small" type="success" icon="User" @click="viewRegistrations(activity)" title="查看名单" />
                  <el-button circle size="small" type="primary" icon="Edit" @click="handleOpenForm(activity)" title="编辑" />
                  <el-button circle size="small" type="danger" icon="Delete" @click="handleDelete(activity._id, 'activities')" title="删除" />
                </div>
                <div class="cover-overlay"></div>
              </div>
              
              <div class="card-info">
                <h3 class="card-title">{{ activity.theme }}</h3>
                <div class="activity-meta mb-10">
                   <div class="meta-item"><el-icon><Timer /></el-icon> 活动: {{ formatDate(activity.time) }}</div>
                   <div class="meta-item text-danger"><el-icon><CircleClose /></el-icon> DDL: {{ formatDate(activity.deadline) }}</div>
                </div>
                <div class="card-bottom">
                   <span class="card-time"><el-icon><Collection /></el-icon> 权限: {{ activity.targets?.join('/') }}</span>
                   <el-button size="small" type="success" plain round @click="viewRegistrations(activity)">名单监控</el-button>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="formVisible" :title="isEditing ? '编辑内容' : '发布新内容'" width="600px" custom-class="admin-form-dialog">
      <el-form label-position="top">
        <el-form-item :label="activeTab === 'notices' ? '公告标题' : '活动主题'" required>
          <el-input v-model="formData.title" />
        </el-form-item>

        <el-form-item label="封面图片 (直传云存储)">
           <div class="upload-wrapper" v-loading="uploading">
              <el-upload class="cover-uploader" action="#" :show-file-list="false" :auto-upload="false" :on-change="handleFileUpload">
                <img v-if="formData.coverUrl" :src="formData.coverUrl" class="upload-preview" />
                <div v-else class="upload-trigger">
                  <el-icon><Plus /></el-icon><span>上传封面</span>
                </div>
              </el-upload>
           </div>
        </el-form-item>

        <el-form-item label="可见/参与群体" required>
          <el-checkbox-group v-model="formData.targets">
            <el-checkbox label="user">普通同学</el-checkbox>
            <el-checkbox label="member">社团干事</el-checkbox>
            <el-checkbox v-if="activeTab === 'notices'" label="admin">管理层</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <template v-if="activeTab === 'activities'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="活动开始时间"><el-date-picker v-model="formData.time" type="datetime" style="width:100%" /></el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="报名截止 (DDL)"><el-date-picker v-model="formData.deadline" type="datetime" style="width:100%" /></el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-form-item label="外部链接 (可选)">
          <el-input v-model="formData.link" placeholder="公众号文章链接或活动群二维码链接" />
        </el-form-item>

        <el-form-item label="详细介绍/正文">
          <el-input v-model="formData.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认提交发布</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" :title="`【${currentAct.theme}】实名名单`" size="80%">
       <div class="drawer-content p-20">
          <div class="stat-banner mb-20">
             <el-statistic title="当前报名人数" :value="regList.length" />
          </div>
          <el-table :data="regList" v-loading="drawerLoading" stripe border>
             <el-table-column label="报名者">
                <template #default="scope">
                   <div class="flex items-center">
                      <el-avatar :size="30" class="mr-10">{{ scope.row.realName?.charAt(0) }}</el-avatar>
                      <div>
                        <div class="font-bold">{{ scope.row.realName }}</div>
                        <div class="text-xs text-gray-400">@{{ scope.row.username }}</div>
                      </div>
                   </div>
                </template>
             </el-table-column>
             <el-table-column label="报名时间">
                <template #default="scope">{{ formatDate(scope.row.regTime) }}</template>
             </el-table-column>
          </el-table>
       </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Calendar, Plus, Delete, User, Check, Clock, Edit, Timer, CircleClose, Collection } from '@element-plus/icons-vue'
import { db, app } from '../../cloudbase' // ⚠️ 确保引入 app 用于上传

const activeTab = ref('notices')
const loading = ref(false)
const tableLoading = ref(false)
const uploading = ref(false)
const submitting = ref(false)

const noticeList = ref([])
const activityList = ref([])
const regList = ref([])

// 弹窗表单逻辑
const formVisible = ref(false)
const isEditing = ref(false)
const formData = reactive({
  _id: '', title: '', content: '', targets: [], coverUrl: '', link: '', time: '', deadline: ''
})

const drawerVisible = ref(false)
const drawerLoading = ref(false)
const currentAct = ref({})

onMounted(() => { fetchNotices(); fetchActivities(); })

const fetchNotices = async () => {
  tableLoading.value = true
  try {
    const res = await db.collection('announcements').orderBy('createTime', 'desc').get()
    noticeList.value = res.data || []
  } finally { tableLoading.value = false }
}

const fetchActivities = async () => {
  tableLoading.value = true
  try {
    const res = await db.collection('activities').orderBy('createTime', 'desc').get()
    activityList.value = res.data || []
  } finally { tableLoading.value = false }
}

// ================= 图片上传核心逻辑 =================
const handleFileUpload = async (file) => {
  if (!file.raw) return
  uploading.value = true
  try {
    const ext = file.name.split('.').pop()
    const cloudPath = `admin_assets/${Date.now()}_${Math.random().toString(36).slice(-4)}.${ext}`
    
    // 上传
    const res = await app.uploadFile({ cloudPath, filePath: file.raw })
    // 换取 HTTPS 链接
    const linkRes = await app.getTempFileURL({ fileList: [res.fileID] })
    formData.coverUrl = linkRes.fileList[0].tempFileURL
    ElMessage.success('封面上传成功')
  } catch (e) {
    ElMessage.error('图片上传失败')
  } finally { uploading.value = false }
}

// ================= 发布与编辑核心逻辑 =================
const handleOpenForm = (item = null) => {
  if (item) {
    isEditing.value = true
    Object.assign(formData, {
      _id: item._id,
      title: item.title || item.theme,
      content: item.content,
      targets: item.targets,
      coverUrl: item.coverUrl || '',
      link: item.link || '',
      time: item.time || '',
      deadline: item.deadline || ''
    })
  } else {
    isEditing.value = false
    Object.assign(formData, { _id: '', title: '', content: '', targets: [], coverUrl: '', link: '', time: '', deadline: '' })
  }
  formVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.title || formData.targets.length === 0) return ElMessage.warning('请填写必要内容')
  submitting.value = true
  
  const collectionName = activeTab.value === 'notices' ? 'announcements' : 'activities'
  // 构造存入数据库的对象
  const payload = {
    targets: formData.targets,
    content: formData.content,
    coverUrl: formData.coverUrl,
    link: formData.link,
    updateTime: Date.now()
  }
  
  // 区分公告标题和活动主题
  if (activeTab.value === 'notices') payload.title = formData.title
  else {
    payload.theme = formData.title
    payload.time = formData.time ? new Date(formData.time).getTime() : ''
    payload.deadline = formData.deadline ? new Date(formData.deadline).getTime() : ''
  }

  try {
    if (isEditing.value) {
      await db.collection(collectionName).doc(formData._id).update(payload)
      ElMessage.success('已更新')
    } else {
      payload.createTime = Date.now()
      await db.collection(collectionName).add(payload)
      ElMessage.success('已成功发布')
    }
    formVisible.value = false
    activeTab.value === 'notices' ? fetchNotices() : fetchActivities()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally { submitting.value = false }
}

// ================= 撤回/删除逻辑 =================
const handleDelete = async (id, coll) => {
  try {
    await ElMessageBox.confirm('确定要撤回此内容吗？已报名/已读数据将无法找回。', '全域控制确认', { 
       confirmButtonText: '确定下线',
       type: 'warning' 
    })
    await db.collection(coll).doc(id).remove()
    ElMessage.success('已成功移除')
    coll === 'announcements' ? fetchNotices() : fetchActivities()
  } catch (e) {}
}

// ================= 名单监控逻辑 (保留) =================
const viewRegistrations = async (act) => {
  currentAct.value = act
  drawerVisible.value = true
  drawerLoading.value = true
  regList.value = []
  try {
    const regRes = await db.collection('activity_registrations').where({ activityId: act._id, status: 'registered' }).get()
    const rawData = regRes.data || []
    if (rawData.length === 0) return
    const uniqueUserIds = [...new Set(rawData.map(r => r.userId))]
    const _ = db.command
    const userRes = await db.collection('users').where({ _id: _.in(uniqueUserIds) }).get()
    const usersMap = {}; userRes.data.forEach(u => { usersMap[u._id] = u })
    
    const combined = rawData.map(record => {
      const u = usersMap[record.userId]
      return { realName: u?.realName || '未知', username: u?.username || '未知', regTime: record.createTime }
    }).sort((a,b) => b.regTime - a.regTime)
    regList.value = combined
  } catch (err) { ElMessage.error('加载名单失败') } 
  finally { drawerLoading.value = false }
}

const handleTabChange = () => { tableLoading.value = true; setTimeout(() => tableLoading.value = false, 300); }
const formatDate = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
/* 核心容器 */
.admin-activity-container { padding: 30px; max-width: 1300px; margin: 0 auto; background: #f0f4f8; min-height: 100vh; }
.mb-24 { margin-bottom: 24px; } .mb-20 { margin-bottom: 20px; } .mb-10 { margin-bottom: 10px; }
.mr-5 { margin-right: 5px; } .mr-10 { margin-right: 10px; }

/* 头部 Header */
.page-header { display: flex; justify-content: space-between; align-items: flex-end; }
.admin-badge { background: #1e293b; color: #38bdf8; display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 8px;}
.header-left h2 { margin: 0 0 5px; font-size: 28px; font-weight: 800; color: #0f172a;}
.subtitle { color: #64748b; font-size: 14px;}
.shadow-glow { box-shadow: 0 0 20px rgba(64,158,255,0.3); }

/* Tab 样式强化 */
.premium-tabs { background: transparent; border: none;}
:deep(.el-tabs__nav-wrap::after) { display: none; }
:deep(.el-tabs__header) { margin-bottom: 30px; }
.tab-label { display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 16px;}

/* 🌟 Admin 卡片网格 */
.admin-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
  gap: 25px; 
}

.img-admin-card { 
  background: white; border-radius: 20px; overflow: hidden; 
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid #e2e8f0; position: relative;
}
.img-admin-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }

.card-cover-box { height: 170px; width: 100%; position: relative; overflow: hidden; }
.card-cover { width: 100%; height: 100%; object-fit: cover; transition: 0.6s; }
.img-admin-card:hover .card-cover { transform: scale(1.1); }

.card-cover-placeholder { 
  width: 100%; height: 100%; background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  display: flex; align-items: center; justify-content: center; color: #38bdf8; font-weight: 900; text-align: center;
}
.card-cover-placeholder.bg-blue { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white;}

.status-badges { position: absolute; top: 15px; left: 15px; display: flex; gap: 5px; z-index: 5;}
.badge { box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: none;}

.admin-actions { 
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; 
  gap: 15px; background: rgba(0,0,0,0.4); opacity: 0; transition: 0.3s; z-index: 10;
}
.img-admin-card:hover .admin-actions { opacity: 1; }

.card-info { padding: 20px; }
.card-title { margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #1e293b; }
.card-desc { font-size: 13px; color: #64748b; line-height: 1.6; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;}

.activity-meta { background: #f8fafc; padding: 10px; border-radius: 12px; font-size: 12px; color: #475569; }
.meta-item { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.text-danger { color: #ef4444; }

.card-bottom { margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;}
.card-time { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 5px; }

/* 上传预览样式 */
.upload-wrapper { border: 2px dashed #cbd5e1; border-radius: 12px; height: 150px; overflow: hidden; transition: 0.3s; }
.upload-wrapper:hover { border-color: #3b82f6; }
.upload-trigger { height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #64748b; gap: 10px;}
.upload-preview { width: 100%; height: 150px; object-fit: cover; }

/* 动画系统 */
.staggered-list-enter-active, .staggered-list-leave-active { transition: all 0.5s ease; }
.staggered-list-enter-from { opacity: 0; transform: scale(0.9) translateY(30px); }

/* 📱 手机端适配 */
@media screen and (max-width: 768px) {
  .admin-activity-container { padding: 15px; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .action-section { width: 100%; margin-top: 20px; }
  .publish-btn { width: 100%; }
  .notice-grid { grid-template-columns: 1fr; }
  .admin-actions { opacity: 1; background: transparent; position: relative; justify-content: flex-end; padding: 10px 0; }
  .img-admin-card:hover .admin-actions { opacity: 1; }
}
</style>