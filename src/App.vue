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

/* ================= 📱 移动端全局强制自适应补丁 ================= */
/* 只有当屏幕宽度小于 768px (手机端) 时，以下样式才会生效 */
@media screen and (max-width: 768px) {
  
  /* 1. 修复弹窗在手机上超出屏幕的问题 */
  .el-dialog, .premium-dialog, .node-dialog {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  /* 2. 修复大表格在手机上撑破页面的问题，允许左右滑动 */
  .el-table {
    display: block !important;
    width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch; 
  }

  /* 3. 手机屏幕小，卡片的留白(Padding)必须缩小 */
  .el-card__body, .el-card__header {
    padding: 12px !important;
  }

  /* 4. 强制打断 Flex 布局：让你原本并排的数据卡片，在手机上自动变成上下堆叠 */
  .el-row {
    display: flex !important;
    flex-direction: column !important;
  }
  .el-col {
    width: 100% !important; 
    max-width: 100% !important;
    flex: 0 0 100% !important;
    margin-bottom: 15px !important;
  }

  /* 5. 侧边栏/导航栏适配：在手机上自动收缩变窄，隐藏文字只留图标 */
  .el-aside {
    width: 60px !important;
    overflow: hidden;
  }
  .el-aside .el-menu-item span, 
  .el-aside .el-sub-menu__title span {
    display: none !important;
  }
  .el-main {
    padding: 10px !important;
  }

  /* 6. 字体自适应缩小 */
  h2 { font-size: 20px !important; }
  h3 { font-size: 16px !important; }
}
</style>