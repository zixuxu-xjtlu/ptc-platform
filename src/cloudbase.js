import cloudbase from "@cloudbase/js-sdk";

// 1. 初始化环境
const app = cloudbase.init({
  env: "ptc-5g9r5l7d8b826df2"
});

const auth = app.auth();
const db = app.database();

// 2. 核心新增：自动获取“访客牌”的逻辑
async function initAuth() {
  try {
    // 检查当前是否已经有身份了（比如之前成功登录过）
    const loginState = await auth.getLoginState();
    
    if (!loginState) {
      // 如果没有任何身份，就自动进行“匿名登录”领个访客牌
      await auth.signInAnonymously();
      console.log("✅ 成功获取临时访客身份，数据库通行证已发放！");
    } else {
      console.log("✅ 当前用户已登录，无需访客身份。");
    }
  } catch (error) {
    console.error("❌ 获取身份失败：", error);
  }
}

// 运行初始化
initAuth();

// 3. 导出模块供页面使用
export { app, auth, db };