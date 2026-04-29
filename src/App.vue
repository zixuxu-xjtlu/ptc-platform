<template>
  <router-view />
</template>

<script setup>
</script>

<style>
/* ================= 全局基础样式 ================= */
body, html {
  margin: 0;
  padding: 0;
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  background-color: #f4f7fa;
  -webkit-font-smoothing: antialiased;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;
}

/* ================= 📱 移动端全局强制自适应补丁 (优化安全版) ================= */
@media screen and (max-width: 768px) {
  
  /* 1. 修复弹窗在手机上超出屏幕的问题 */
  .el-dialog, .premium-dialog, .node-dialog {
    width: 90% !important; /* 不用 95%，留一点呼吸感更好看 */
    /* 删除了强制 margin，以免破坏 Element Plus 弹窗自带的垂直居中/滚动逻辑 */
  }

  /* 2. 修复大表格在手机上撑破页面的问题 */
  .el-table {
    overflow-x: auto !important;
  }
  .el-table__body-wrapper {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch; /* 让 iOS 滑动更顺畅 */
  }

  /* 3. 手机屏幕小，卡片的留白(Padding)必须缩小 */
  .el-card__body, .el-card__header {
    padding: 12px !important;
  }

  /* 4. 侧边栏/导航栏适配：隐藏文字留图标 */
  .el-aside {
    width: 64px !important; /* Element 标准折叠宽度是 64px */
    transition: width 0.3s ease;
  }
  .el-aside .el-menu-item span, 
  .el-aside .el-sub-menu__title span {
    display: none !important;
  }
  .el-aside .el-sub-menu__icon-arrow {
    display: none !important; /* 把右侧的下拉小箭头也隐藏掉，不然挤在一起很丑 */
  }
  .el-main {
    padding: 10px !important;
  }

  /* 5. 字体自适应缩小 */
  h2 { font-size: 20px !important; }
  h3 { font-size: 16px !important; }

  /* 🚨 强烈警告：千万不要在这里写 .el-row 和 .el-col 的 100% 覆盖！
   正确的做法是：在你的具体页面里使用 <el-col :xs="24" :sm="12"> 来实现手机端堆叠！
  */
}
</style>