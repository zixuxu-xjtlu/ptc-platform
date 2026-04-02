// src/cloud.js
import cloudbase from '@cloudbase/js-sdk'

// 初始化连接
const app = cloudbase.init({
  env: '你的环境ID' // ⚠️ 必须替换成你在第一阶段复制的 "环境ID"
})

// 开启匿名登录（为了让大家都能先读写数据，正式项目通常用邮箱登录）
// 注意：你需要去控制台 -> 登录授权 -> 开启“匿名登录”
const auth = app.auth({ persistence: 'local' })

// 导出数据库实例
export const db = app.database()
export const _ = db.command // 数据库操作符
export const loginAnonymously = async () => {
  const loginState = await auth.getLoginState()
  if (!loginState) {
    await auth.signInAnonymously()
  }
}