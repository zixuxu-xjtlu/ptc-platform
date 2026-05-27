import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
// 🌟 新增：引入云数据库，用于记录访问数据
import { db } from '../cloudbase' 

// 1. 引入基础页面组件
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ResetPassword from '../views/ResetPassword.vue'

// 2. 引入用户布局和主页
import UserLayout from '../layout/UserLayout.vue'
import UserDashboard from '../views/user/Dashboard.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword },

  // ================= 🧑‍🎓 普通用户路由区域 =================
  {
    path: '/user',
    component: UserLayout,
    redirect: '/user/dashboard',
    children: [
      { path: 'dashboard', name: 'UserDashboard', component: UserDashboard },
      { path: 'shop', name: 'UserShop', component: () => import('../views/user/Shop.vue') },
      { path: 'notices', name: 'UserNotices', component: () => import('../views/user/Notices.vue') },
      { path: 'activities', name: 'UserActivities', component: () => import('../views/user/Activities.vue') },
      { path: 'my-activities', name: 'UserMyActivities', component: () => import('../views/user/Activities.vue') },
      { path: 'study', name: 'UserStudy', component: () => import('../views/user/Study.vue') },
      { path: 'course/:code', name: 'UserCourseDetail', component: () => import('../views/user/CourseDetail.vue') },
      { path: 'majors', name: 'UserMajors', component: () => import('../views/user/MajorSelection.vue') },
      { path: 'survey', name: 'UserSurvey', component: () => import('../views/user/Survey.vue') },
      { path: 'major/:name', name: 'UserMajorDetail', component: () => import('../views/user/MajorDetail.vue') },
      { path: 'quiz', name: 'UserQuiz', component: () => import('../views/user/UserQuiz.vue') }
    ]
  },

  // ================= 👑 管理员专属路由区域 =================
  {
    path: '/admin',
    component: () => import('../layout/AdminLayout.vue'),
    redirect: '/admin/dashboard', 
    children: [
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('../views/admin/Dashboard.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/UserManage.vue') },
      { path: 'activities', name: 'AdminActivities', component: () => import('../views/admin/ActivityManage.vue') },
      { path: 'shop', name: 'AdminShop', component: () => import('../views/admin/AdminShop.vue') },
      { path: 'work', name: 'AdminWork', component: () => import('../views/admin/WorkManage.vue') },
      { path: 'study', name: 'AdminStudy', component: () => import('../views/admin/StudyManage.vue') },
      { path: 'course/:code', name: 'AdminCourseDetail', component: () => import('../views/admin/CourseManage.vue') },
      { path: 'majors', name: 'AdminMajors', component: () => import('../views/admin/MajorManage.vue') },
      { path: 'quiz-manage', name: 'AdminQuizManage', component: () => import('../views/member/QuizManage.vue') },
      { path: 'inventory', name: 'AdminInventory', component: () => import('../views/admin/InventoryManage.vue') },
      
      // 🌟 新增：全站版本更新公告发布页面
      {
        path: 'publish-notice',
        name: 'AdminPublishNotice',
        component: () => import('../views/admin/PublishNotice.vue')
      }
    ]
  },

  // ================= 💼 社团成员专属路由区域 =================
  {
    path: '/member',
    component: () => import('../layout/MemberLayout.vue'),
    redirect: '/member/dashboard',
    children: [
      { path: 'dashboard', name: 'MemberDashboard', component: () => import('../views/member/Dashboard.vue') },
      { path: 'notices', name: 'MemberNotices', component: () => import('../views/member/Notices.vue') },
      { path: 'shop', name: 'MemberShop', component: () => import('../views/user/Shop.vue') },
      { path: 'tasks', name: 'MemberTasks', component: () => import('../views/member/Tasks.vue') },
      { path: 'ranking', name: 'MemberRanking', component: () => import('../views/member/Ranking.vue') },
      { path: 'study', name: 'MemberStudy', component: () => import('../views/member/Study.vue') },
      { path: 'course/:code', name: 'MemberCourseDetail', component: () => import('../views/member/CourseDetail.vue') },
      { path: 'quiz-manage', name: 'MemberQuizManage', component: () => import('../views/member/QuizManage.vue') }
    ]
  }
] 

const router = createRouter({
  history: createWebHistory(),
  routes
})

const getDateKey = (timestamp = Date.now()) => {
  const d = new Date(timestamp)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// === 🛡️ 全局路由前置守卫（门禁系统，决定能不能进页面） ===
router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const publicPaths = ['/login', '/register', '/reset-password']
  
  if (publicPaths.includes(to.path)) {
    if (user) {
      if (user.role === 'admin') return next('/admin/dashboard')
      if (user.role === 'member') return next('/member/dashboard')
      return next('/user/dashboard')
    }
    return next() 
  }

  if (!user || !user.role) {
    ElMessage.warning('检测到您未登录或登录已过期，请先登录！')
    return next('/login')
  }

  const role = user.role

  if (to.path.startsWith('/admin')) {
    if (role !== 'admin') {
      ElMessage.error('🛑 越权警告：您不是管理员，无法访问此区域！')
      return next(role === 'member' ? '/member/dashboard' : '/user/dashboard')
    }
  }

  if (to.path.startsWith('/member')) {
    if (role !== 'member' && role !== 'admin') {
      ElMessage.error('🛑 越权警告：您不是内部成员，无法访问此区域！')
      return next('/user/dashboard')
    }
  }

  next()
})

// === 📊 全局路由后置钩子（流量与在线状态统计，页面跳转后执行，不卡顿） ===
router.afterEach((to, from) => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const now = Date.now()

  try {
    // 1. 刷新在线状态：只要用户点了任何页面，就更新他的最后活跃时间
    if (user && user._id) {
      db.collection('users').doc(user._id).update({
        lastActiveTime: now
      }).catch(() => {}) // 忽略报错，静默执行
    }

    // 2. 增加访问量记录 (只记录非公开页面的有效访问，避免把刷新登录页也算进去)
    const publicPaths = ['/login', '/register', '/reset-password']
    if (!publicPaths.includes(to.path)) {
      db.collection('visit_logs').add({
        path: to.path,
        userId: user ? user._id : 'guest',
        role: user ? user.role : 'guest',
        createTime: now,
        dateKey: getDateKey(now)
      }).catch(() => {}) 
    }
  } catch (e) {
    // 即使出现异常，也绝对不影响用户的正常网页浏览
  }
})

export default router
