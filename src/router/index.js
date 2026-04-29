import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus' // 🌟 新增：引入消息提示

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

// === 🛡️ 全局路由守卫（门禁系统） ===
router.beforeEach((to, from, next) => {
  // 1. 从本地获取当前登录用户信息
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  // 2. 定义白名单（不需要登录就能访问的页面）
  const publicPaths = ['/login', '/register', '/reset-password']
  
  if (publicPaths.includes(to.path)) {
    // 防呆设计：如果已经登录了还去登录页，按照身份强行踢回控制台
    if (user) {
      if (user.role === 'admin') return next('/admin/dashboard')
      if (user.role === 'member') return next('/member/dashboard')
      return next('/user/dashboard')
    }
    return next() // 没登录的正常进入登录页
  }

  // 3. 如果没登录，且访问的不是公开页面，拦截！
  if (!user || !user.role) {
    ElMessage.warning('检测到您未登录或登录已过期，请先登录！')
    return next('/login')
  }

  // 4. 越权拦截：判断角色权限
  const role = user.role

  // 🚫 尝试闯入管理员专属页面
  if (to.path.startsWith('/admin')) {
    if (role !== 'admin') {
      ElMessage.error('🛑 越权警告：您不是管理员，无法访问此区域！')
      return next(role === 'member' ? '/member/dashboard' : '/user/dashboard')
    }
  }

  // 🚫 尝试闯入社团内部成员专属页面
  if (to.path.startsWith('/member')) {
    if (role !== 'member' && role !== 'admin') {
      ElMessage.error('🛑 越权警告：您不是内部成员，无法访问此区域！')
      return next('/user/dashboard')
    }
  }

  // 5. 检查全部通过，正式放行
  next()
})

export default router