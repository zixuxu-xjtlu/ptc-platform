import { createRouter, createWebHistory } from 'vue-router'

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
      {
        path: 'dashboard',
        name: 'UserDashboard',
        component: UserDashboard
      },
      {
        path: 'shop',
        name: 'UserShop',
        component: () => import('../views/user/Shop.vue')
      },
      {
        path: 'notices', 
        name: 'UserNotices',
        component: () => import('../views/user/Notices.vue')
      },
      {
        path: 'activities', 
        name: 'UserActivities',
        component: () => import('../views/user/Activities.vue')
      },
      {
        path: 'my-activities', 
        name: 'UserMyActivities',
        component: () => import('../views/user/Activities.vue')
      },
      {
        path: 'study',
        name: 'UserStudy',
        component: () => import('../views/user/Study.vue')
      },
      {
        path: 'course/:code',
        name: 'UserCourseDetail',
        component: () => import('../views/user/CourseDetail.vue')
      },
      { 
        path: 'majors', 
        name: 'UserMajors',
        component: () => import('../views/user/MajorSelection.vue') 
      },
      { 
        path: 'survey', 
        name: 'UserSurvey',
        component: () => import('../views/user/Survey.vue') 
      },
      { 
        path: 'major/:name', 
        name: 'UserMajorDetail',
        component: () => import('../views/user/MajorDetail.vue') 
      },
      // 🌟 新增：在线答题挑战页路由
      { 
        path: 'quiz', 
        name: 'UserQuiz',
        component: () => import('../views/user/UserQuiz.vue') 
      }
    ]
  },

  // ================= 👑 管理员专属路由区域 =================
  {
    path: '/admin',
    component: () => import('../layout/AdminLayout.vue'),
    redirect: '/admin/dashboard', 
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      { 
        path: 'users', 
        name: 'AdminUsers',
        component: () => import('../views/admin/UserManage.vue') 
      },
      {
        path: 'activities',
        name: 'AdminActivities',
        component: () => import('../views/admin/ActivityManage.vue')
      },
      {
        path: 'shop',
        name: 'AdminShop',
        component: () => import('../views/admin/AdminShop.vue')
      },
      {
        path: 'work',
        name: 'AdminWork',
        component: () => import('../views/admin/WorkManage.vue')
      },
      {
        path: 'study',
        name: 'AdminStudy',
        component: () => import('../views/admin/StudyManage.vue')
      },
      {
        path: 'course/:code',
        name: 'AdminCourseDetail',
        component: () => import('../views/admin/CourseManage.vue')
      },
      {
        path: 'majors',
        name: 'AdminMajors',
        component: () => import('../views/admin/MajorManage.vue')
      },
      {
        path: 'quiz-manage',
        name: 'AdminQuizManage',
        // 直接复用 member 文件夹下的组件，逻辑和数据都是通用的！
        component: () => import('../views/member/QuizManage.vue')
      }
    ]
  },

  // ================= 💼 社团成员专属路由区域 =================
  {
    path: '/member',
    component: () => import('../layout/MemberLayout.vue'),
    redirect: '/member/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'MemberDashboard',
        component: () => import('../views/member/Dashboard.vue')
      },
      {
        path: 'notices',
        name: 'MemberNotices',
        component: () => import('../views/member/Notices.vue') 
      },
      {
        path: 'shop',
        name: 'MemberShop',
        component: () => import('../views/user/Shop.vue')
      },
      {
        path: 'tasks',
        name: 'MemberTasks',
        component: () => import('../views/member/Tasks.vue')
      },
      {
        path: 'ranking',
        name: 'MemberRanking',
        component: () => import('../views/member/Ranking.vue')
      },
      {
        path: 'study',
        name: 'MemberStudy',
        component: () => import('../views/member/Study.vue') 
      },
      {
        path: 'course/:code',
        name: 'MemberCourseDetail',
        component: () => import('../views/member/CourseDetail.vue') 
      },
      {
        path: 'quiz-manage',
        name: 'MemberQuizManage',
        // 指向我们接下来要写的题库管理组件
        component: () => import('../views/member/QuizManage.vue') 
      }
    ]
  }
] 

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router