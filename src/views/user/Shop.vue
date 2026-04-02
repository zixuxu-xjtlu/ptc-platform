<template>
  <div class="shop-container">
    
    <div class="header-area fade-in-down">
      <div class="title-section">
        <h2>✨ 积分兑换商城</h2>
        <p class="subtitle">用汗水换取的积分，值得最好的奖励</p>
      </div>
      <div class="points-card">
        <div class="points-bg-glow"></div>
        <span class="label">当前可用积分</span>
        <span class="value"><el-icon><Coin /></el-icon> {{ currentPoints }}</span>
      </div>
    </div>

    <el-card shadow="never" class="shop-main-card fade-in-up">
      <el-tabs v-model="activeTab" class="custom-tabs">
        
        <el-tab-pane name="merch">
          <template #label>
            <span class="tab-label"><el-icon><Present /></el-icon> 实体周边</span>
          </template>

          <el-empty v-if="merchList.length === 0" description="周边正在疯狂补货中..." :image-size="120" />
          
          <div class="shop-grid-wrapper">
            <el-row :gutter="15">
              <transition-group name="grid">
                <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="item in merchList" :key="item._id" class="mb-24 grid-item">
                  <div class="premium-product-card">
                    <div class="image-wrapper">
                      <img v-if="item.image" :src="item.image" class="product-img" />
                      <div v-else class="emoji-img">🎁</div>
                      
                      <div class="stock-tag urgent" v-if="item.stock <= 5 && item.stock > 0">
                        仅剩 {{ item.stock }} 件
                      </div>
                      <div class="stock-tag out" v-if="item.stock <= 0">
                        已售罄
                      </div>
                    </div>
                    
                    <div class="product-info">
                      <h4 class="name">{{ item.name }}</h4>
                      <div class="price-row">
                        <span class="cost">{{ item.cost }} <small>分</small></span>
                        <el-button 
                          type="primary" 
                          class="exchange-btn"
                          @click="handleExchange(item)"
                          :disabled="item.stock <= 0"
                          :loading="exchangeLoading === item._id"
                        >
                          {{ item.stock > 0 ? '兑换' : '售罄' }}
                        </el-button>
                      </div>
                    </div>
                  </div>
                </el-col>
              </transition-group>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane name="material">
          <template #label>
            <span class="tab-label"><el-icon><Document /></el-icon> 电子资料</span>
          </template>

          <el-empty v-if="materialList.length === 0" description="资料库建设中..." :image-size="120" />
          
          <div class="shop-grid-wrapper">
            <el-row :gutter="15">
              <transition-group name="grid">
                <el-col :xs="24" :sm="12" :md="8" :lg="8" v-for="item in materialList" :key="item._id" class="mb-24 grid-item">
                  <div class="premium-material-card">
                    <div class="mat-icon-box">
                      <el-icon><Files /></el-icon>
                    </div>
                    <div class="mat-content">
                      <h4 class="name">{{ item.name }}</h4>
                      <div class="price-row mt-15">
                        <span class="cost text-success">{{ item.cost }} <small>分</small></span>
                        <el-button 
                          type="success" 
                          size="small"
                          class="exchange-btn"
                          @click="handleExchange(item)"
                          :disabled="item.stock <= 0"
                          :loading="exchangeLoading === item._id"
                        >
                          下载
                        </el-button>
                      </div>
                    </div>
                  </div>
                </el-col>
              </transition-group>
            </el-row>
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Coin, Present, Document, Files } from '@element-plus/icons-vue'
import { db } from '../../cloudbase'

const activeTab = ref('merch')
const shopList = ref([])
const exchangeLoading = ref('')

const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const currentPoints = ref(currentUser.value.points || 0)

const merchList = computed(() => shopList.value.filter(item => item.type !== 'material'))
const materialList = computed(() => shopList.value.filter(item => item.type === 'material'))

onMounted(() => { fetchShopData() })

const fetchShopData = async () => {
  try {
    const res = await db.collection('shop').get()
    shopList.value = (res.data || []).filter(item => item.name && item.cost !== undefined)
  } catch (error) {
    ElMessage.error('无法连接到商城库')
  }
}

const handleExchange = async (product) => {
  if (currentPoints.value < product.cost) return ElMessage.warning(`积分不足！需要 ${product.cost} 积分`)
  if (product.stock <= 0) return ElMessage.warning('来晚一步，该物品已经被兑换完了！')

  const isMaterial = product.type === 'material'
  let buyerEmail = ''

  try {
    if (!isMaterial) {
      const { value } = await ElMessageBox.prompt(
        `兑换将消耗 ${product.cost} 积分。\n请输入学校邮箱以便发货：`,
        '填写收货邮箱',
        {
          confirmButtonText: '确定兑换', cancelButtonText: '取消',
          inputPattern: /^[a-zA-Z0-9._-]+@student\.xjtlu\.edu\.cn$/,
          inputErrorMessage: '后缀错误！必须是 @student.xjtlu.edu.cn 的邮箱',
        }
      )
      buyerEmail = value 
    } else {
      await ElMessageBox.confirm(`确定消耗 ${product.cost} 积分下载该资料吗？`, '兑换确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' })
    }
  } catch (err) { return }

  exchangeLoading.value = product._id
  const _ = db.command

  try {
    await db.collection('users').doc(currentUser.value._id).update({ points: _.inc(-product.cost) })
    await db.collection('shop').doc(product._id).update({ stock: _.inc(-1) })
    await db.collection('orders').add({
      buyerId: currentUser.value._id, buyerName: currentUser.value.username, buyerEmail: buyerEmail, 
      itemName: product.name, itemCost: product.cost, status: isMaterial ? '已自动发放' : '待发放', createTime: new Date().getTime()
    })

    currentPoints.value -= product.cost
    currentUser.value.points = currentPoints.value
    localStorage.setItem('user', JSON.stringify(currentUser.value))
    product.stock -= 1

    if (isMaterial && product.fileUrl) {
      ElMessage.success('兑换成功！开始下载...')
      const link = document.createElement('a')
      link.href = product.fileUrl
      link.setAttribute('download', product.name) 
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      ElMessage.success('兑换成功！留意邮箱通知')
    }
  } catch (err) {
    ElMessage.error('兑换发生异常')
  } finally { exchangeLoading.value = '' }
}
</script>

<style scoped>
.fade-in-down { animation: fadeInDown 0.6s ease; }
.fade-in-up { animation: fadeInUp 0.6s ease; }
@keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }

.grid-item { display: inline-block; width: 100%; }
.grid-enter-active, .grid-leave-active { transition: all 0.5s ease; }
.grid-enter-from, .grid-leave-to { opacity: 0; transform: scale(0.9) translateY(20px); }
.grid-leave-active { position: absolute; }

.shop-container { padding: 10px; max-width: 1200px; margin: 0 auto; }
.mb-24 { margin-bottom: 24px; }
.shop-grid-wrapper { padding: 10px 5px 20px 5px; overflow: visible; }

.header-area { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
.title-section h2 { margin: 0 0 8px; color: #2c3e50; font-size: 28px; font-weight: 600; letter-spacing: 1px;}
.subtitle { margin: 0; color: #7f8c8d; font-size: 15px; letter-spacing: 1px;}

.points-card { position: relative; background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%); color: white; padding: 16px 30px; border-radius: 16px; text-align: right; box-shadow: 0 8px 20px rgba(255, 154, 158, 0.3); transition: transform 0.3s;}
.points-card:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(255, 154, 158, 0.4); }
.points-card .label { display: block; font-size: 13px; opacity: 0.9; margin-bottom: 6px; font-weight: 500;}
.points-card .value { font-size: 28px; font-weight: bold; display: flex; align-items: center; gap: 6px;}

.shop-main-card { border-radius: 16px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.03) !important; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);}
.tab-label { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: bold;}
:deep(.el-tabs__item) { padding: 0 30px; height: 55px; line-height: 55px; color: #95a5a6; transition: all 0.3s;}
:deep(.el-tabs__item.is-active) { color: #409EFF; font-size: 17px; }
:deep(.el-tabs__active-bar) { height: 3px; border-radius: 3px; background-color: #409EFF;}

/* 周边卡片 */
.premium-product-card { height: 100%; display: flex; flex-direction: column; background: #ffffff; border-radius: 16px; border: 1px solid #ebeef5; overflow: hidden; transition: all 0.4s; }
.premium-product-card:hover { transform: translateY(-8px); box-shadow: 0 16px 32px rgba(0,0,0,0.08); border-color: transparent; }
.image-wrapper { position: relative; width: 100%; aspect-ratio: 1 / 1; background: #f8f9fa; display: flex; align-items: center; justify-content: center; overflow: hidden;}
.product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease;}
.premium-product-card:hover .product-img { transform: scale(1.08); }
.emoji-img { font-size: 60px; text-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.stock-tag { position: absolute; top: 12px; right: 12px; color: white; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 20px; backdrop-filter: blur(4px); }
.stock-tag.urgent { background: rgba(230, 162, 60, 0.85); border: 1px solid rgba(255, 255, 255, 0.3);}
.stock-tag.out { background: rgba(144, 147, 153, 0.85); border: 1px solid rgba(255, 255, 255, 0.3);}

.product-info { padding: 15px; display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; }
.name { margin: 0 0 10px 0; font-size: 14px; color: #2c3e50; font-weight: 600; line-height: 1.4; word-break: break-all;}
.price-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.cost { color: #f56c6c; font-weight: 800; font-size: 18px; white-space: nowrap;}
.cost small { font-size: 12px; font-weight: normal; margin-left: 2px; color: #95a5a6;}
.exchange-btn { border-radius: 8px; font-weight: bold; padding: 8px 12px; }

/* 资料卡片 */
.premium-material-card { height: 100%; display: flex; align-items: stretch; background: #ffffff; border-radius: 14px; border: 1px solid #ebeef5; padding: 15px; transition: all 0.3s; }
.premium-material-card:hover { transform: translateX(5px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: #dcdfe6;}
.mat-icon-box { width: 50px; height: 50px; background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; margin-right: 15px; flex-shrink: 0; }
.mat-content { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.mat-content .name { margin: 0 0 10px 0; font-size: 15px; color: #2c3e50; line-height: 1.4;}
.mt-15 { margin-top: auto; }
.text-success { color: #67c23a !important; }

/* 📱 手机端适配 */
@media (max-width: 768px) {
  .header-area { flex-direction: column; align-items: flex-start; gap: 15px; }
  .points-card { align-self: flex-start; padding: 10px 20px; }
  .points-card .value { font-size: 22px; }
  :deep(.el-tabs__item) { padding: 0 15px; font-size: 14px; }
  .name { font-size: 13px; }
  .exchange-btn { padding: 6px 10px; font-size: 12px;}
}
</style>