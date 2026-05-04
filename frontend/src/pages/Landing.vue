<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import AppLayout from '../layouts/AppLayout.vue'
import { fetchFeaturedExample, fetchPublicStatistics } from '../api/image'

const trendRef = ref(null)
const sourceRef = ref(null)
const cycleRef = ref(null)
const trendChart = ref(null)
const sourceChart = ref(null)
const cycleChart = ref(null)
const statistics = ref(null)
const featuredExample = ref(null)
const charts = []
const chartTextColor = 'var(--color-text-soft)'
const chartMutedColor = 'var(--color-text-secondary)'

const summaryCards = computed(() => [
  {
    label: '累计生成',
    value: statistics.value?.totalImages ?? 0,
  },
  {
    label: '当前有效',
    value: statistics.value?.activeImages ?? 0,
  },
  {
    label: '今日生成',
    value: statistics.value?.todayCount ?? 0,
  },
])

const trendSeries = computed(() => {
  const rows = statistics.value?.recentTrend || []
  const mapped = new Map(rows.map((item) => [item.day, Number(item.total || 0)]))

  return buildRecentDays(7).map((day) => ({
    ...day,
    total: mapped.get(day.key) || 0,
  }))
})

const sourceSeries = computed(() => {
  const rows = statistics.value?.sourceSplit || []
  const totals = new Map(rows.map((item) => [item.sourceType, Number(item.total || 0)]))

  return [
    { value: totals.get('shared') || 0, name: '共享令牌', itemStyle: { color: '#6f8cff' } },
    { value: totals.get('private') || 0, name: '个人令牌', itemStyle: { color: '#7cc8a4' } },
  ]
})

const retentionSeries = computed(() => {
  const rows = statistics.value?.retention || []
  const totals = new Map(rows.map((item) => [item.bucket, Number(item.total || 0)]))

  return [
    { key: 'within_1_day', label: '1 天内', total: totals.get('within_1_day') || 0 },
    { key: 'within_2_days', label: '2 天内', total: totals.get('within_2_days') || 0 },
    { key: 'within_3_days', label: '3 天内', total: totals.get('within_3_days') || 0 },
    { key: 'expired', label: '已过期', total: totals.get('expired') || 0 },
  ]
})

const featuredExampleDate = computed(() => {
  if (!featuredExample.value?.updatedAt) return ''
  return new Date(featuredExample.value.updatedAt).toLocaleDateString('zh-CN')
})

function buildRecentDays(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setUTCHours(0, 0, 0, 0)
    date.setUTCDate(date.getUTCDate() - (count - index - 1))
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    const day = `${date.getUTCDate()}`.padStart(2, '0')

    return {
      key: date.toISOString().slice(0, 10),
      label: `${month}/${day}`,
    }
  })
}

function createChart(el) {
  if (!el) return null
  const chart = echarts.init(el, null, { renderer: 'canvas' })
  charts.push(chart)
  return chart
}

function buildSharedOption() {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#f8fbff' },
      formatter: '{b}<br/>{c} 张 · {d}%',
    },
    legend: {
      bottom: 6,
      left: 'center',
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: chartMutedColor, fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['46%', '64%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        minAngle: 8,
        itemStyle: {
          borderRadius: 18,
          borderColor: 'rgba(255,255,255,0.9)',
          borderWidth: 4,
          shadowBlur: 18,
          shadowColor: 'rgba(79, 109, 201, 0.12)',
        },
        label: {
          show: true,
          position: 'outer',
          formatter: '{d}%',
          color: chartTextColor,
          fontSize: 12,
          fontWeight: 600,
        },
        labelLine: { length: 10, length2: 8, lineStyle: { color: 'rgba(120, 130, 170, 0.4)' } },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: { color: chartTextColor },
        },
        data: sourceSeries.value,
      },
    ],
  }
}

function buildTrendOption() {
  return {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 8, top: 26, bottom: 14, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#f8fbff' },
      axisPointer: {
        type: 'line',
        lineStyle: { color: 'rgba(111, 140, 255, 0.38)', width: 1.5 },
      },
      formatter: (params) => {
        const point = params?.[0]
        if (!point) return ''
        return `${point.axisValue}<br/>生成 ${point.value} 张`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendSeries.value.map((item) => item.label),
      axisLine: { lineStyle: { color: 'rgba(120, 130, 170, 0.2)' } },
      axisTick: { show: false },
      axisLabel: { color: chartMutedColor, margin: 12 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitNumber: 4,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(120, 130, 170, 0.12)', type: 'dashed' } },
      axisLabel: { color: chartMutedColor },
    },
    series: [
      {
        type: 'line',
        smooth: 0.35,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 9,
        lineStyle: {
          width: 4,
          color: '#6f8cff',
          shadowBlur: 16,
          shadowColor: 'rgba(111, 140, 255, 0.22)',
        },
        itemStyle: {
          color: '#6f8cff',
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        emphasis: {
          focus: 'series',
          scale: true,
          itemStyle: {
            color: '#7f96ff',
            borderColor: '#ffffff',
            borderWidth: 3,
          },
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(111, 140, 255, 0.30)' },
            { offset: 0.55, color: 'rgba(111, 140, 255, 0.12)' },
            { offset: 1, color: 'rgba(111, 140, 255, 0.02)' },
          ]),
        },
        data: trendSeries.value.map((item) => item.total),
      },
    ],
  }
}

function buildCycleOption() {
  return {
    backgroundColor: 'transparent',
    grid: { left: 12, right: 14, top: 18, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#f8fbff' },
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(111, 140, 255, 0.08)' },
      },
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: chartMutedColor },
      splitLine: { lineStyle: { color: 'rgba(120, 130, 170, 0.12)', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: retentionSeries.value.map((item) => item.label),
      axisLabel: { color: chartMutedColor, margin: 14 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barWidth: 14,
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(124, 200, 164, 0.08)',
          borderRadius: 999,
        },
        itemStyle: {
          borderRadius: [0, 999, 999, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#7cc8a4' },
            { offset: 1, color: '#9be5c5' },
          ]),
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#73c59e' },
              { offset: 1, color: '#b0f0d0' },
            ]),
          },
        },
        data: retentionSeries.value.map((item) => item.total),
      },
    ],
  }
}

function syncCharts() {
  trendChart.value?.setOption(buildTrendOption(), true)
  sourceChart.value?.setOption(buildSharedOption(), true)
  cycleChart.value?.setOption(buildCycleOption(), true)
}

function resizeCharts() {
  charts.forEach((chart) => chart?.resize())
}

async function loadStatistics() {
  statistics.value = await fetchPublicStatistics()
}

async function loadFeaturedExample() {
  try {
    featuredExample.value = await fetchFeaturedExample()
  } catch {
    featuredExample.value = { prompt: '', imageUrl: '', updatedAt: '' }
  }
}

watch([trendSeries, sourceSeries, retentionSeries], syncCharts)

onMounted(async () => {
  trendChart.value = createChart(trendRef.value)
  sourceChart.value = createChart(sourceRef.value)
  cycleChart.value = createChart(cycleRef.value)
  syncCharts()
  window.addEventListener('resize', resizeCharts)
  await Promise.all([loadStatistics(), loadFeaturedExample()])
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  charts.forEach((chart) => chart.dispose())
  charts.length = 0
})
</script>

<template>
  <AppLayout>
    <div class="landing-shell">
      <section class="card landing-hero">
        <div class="hero-copy">
          <div class="hero-badge">Lcode-image · 公益 AI 图片生成站</div>
          <h1>把一句灵感，变成一张柔和、清晰、可立即保存的图片。</h1>
          <p class="hero-text muted">
            这是一个面向日常创作的轻量 AI 图片站。你可以直接输入提示词开始生成，也可以登录账号后绑定自己的图片 API 地址和身份令牌；
            系统会自动保留最近 3 天的图片记录，并由后台统一清理过期文件。
          </p>
          <div class="hero-actions">
            <RouterLink to="/create" class="button-primary hero-link">开始生成</RouterLink>
            <RouterLink to="/history" class="button-secondary hero-link">查看历史</RouterLink>
          </div>
          <div class="hero-points muted">
            <span>支持桌面与移动端</span>
            <span>双模式主题切换</span>
            <span>个人 / 共享 Token 双通道</span>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-card visual-main card">
            <div class="visual-top">
              <span class="visual-dot" />
              <span class="visual-dot" />
              <span class="visual-dot" />
            </div>
            <div class="visual-preview">
              <div class="preview-image" :class="{ 'preview-image--empty': !featuredExample?.imageUrl }">
                <img
                  v-if="featuredExample?.imageUrl"
                  :src="featuredExample.imageUrl"
                  :alt="featuredExample.prompt || '首页示例灵感图片'"
                  class="preview-photo"
                />
                <template v-else>
                  <div class="preview-glow" />
                  <div class="preview-orb" />
                </template>
              </div>
              <div class="preview-copy">
                <strong>示例灵感</strong>
                <p class="muted">{{ featuredExample?.prompt || '' }}</p>
                <span v-if="featuredExampleDate" class="preview-meta muted">最近更新：{{ featuredExampleDate }}</span>
                <span v-else class="preview-meta muted">当前还没有生成首页示例图</span>
              </div>
            </div>
          </div>
          <div class="visual-chip card">图片默认仅保留 3 天</div>
        </div>
      </section>

      <section class="landing-grid metric-grid">
        <article v-for="card in summaryCards" :key="card.label" class="card metric-card">
          <span class="muted">{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </article>
      </section>

      <section class="landing-grid chart-grid">
        <section class="card insight-card trend-card chart-card-polished">
          <div class="card-head">
            <div>
              <p class="info-eyebrow">生成节奏</p>
              <h2>最近 7 天真实生成趋势</h2>
            </div>
            <p class="muted card-note">按当天真实落库记录绘制，空白日期会自动补零。</p>
          </div>
          <div ref="trendRef" class="chart-box chart-box--trend" />
        </section>

        <section class="card insight-card source-card chart-card-polished">
          <div class="card-head">
            <div>
              <p class="info-eyebrow">身份来源</p>
              <h2>共享与个人的实际使用占比</h2>
            </div>
            <p class="muted card-note">展示当前所有已生成图片里两类身份来源的真实分布。</p>
          </div>
          <div ref="sourceRef" class="chart-box chart-box--donut" />
        </section>
      </section>

      <section class="card insight-card cycle-card chart-card-polished">
        <div class="card-head">
          <div>
            <p class="info-eyebrow">留存状态</p>
            <h2>近 3 天有效图片与已过期图片分布</h2>
          </div>
          <p class="muted card-note">根据 expires_at 实时聚合，能直接看出清理窗口内的存量情况。</p>
        </div>
        <div ref="cycleRef" class="chart-box chart-box--wide" />
      </section>

      <section class="card landing-cta">
        <div>
          <p class="info-eyebrow">现在开始</p>
          <h2>准备好之后，直接进入生成页就行。</h2>
          <p class="muted">如果你只是想先体验，可以直接走共享身份令牌；如果你有自己的额度，也可以登录账号后在右上角保存个人配置。</p>
        </div>
        <RouterLink to="/create" class="button-primary hero-link">进入生成页</RouterLink>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.landing-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 28px;
}

.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 24px;
  padding: 28px;
  overflow: hidden;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.hero-badge,
.info-eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  width: fit-content;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.landing-hero h1,
.landing-cta h2,
.insight-card h2 {
  margin: 0;
  line-height: 1.12;
}

.landing-hero h1 {
  font-size: clamp(2rem, 5vw, 3.8rem);
  max-width: 11ch;
}

.hero-text,
.insight-card p,
.landing-cta p {
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.hero-points {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-points span {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-card-muted);
}

.hero-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.visual-main {
  padding: 18px;
  background: linear-gradient(180deg, var(--color-card) 0%, var(--color-card-strong) 100%);
}

.visual-top {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

.visual-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-border);
}

.visual-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-image {
  position: relative;
  min-height: 300px;
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.94), transparent 20%),
    linear-gradient(135deg, rgba(99, 203, 136, 0.36), rgba(81, 126, 255, 0.26));
}

.preview-image--empty {
  background:
    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.94), transparent 20%),
    linear-gradient(135deg, rgba(99, 203, 136, 0.36), rgba(81, 126, 255, 0.26));
}

.preview-photo {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: block;
  object-fit: cover;
}

[data-theme='eye'] .preview-image--empty {
  background:
    radial-gradient(circle at 30% 25%, rgba(203, 225, 255, 0.28), transparent 20%),
    linear-gradient(135deg, rgba(73, 124, 226, 0.4), rgba(19, 44, 88, 0.72));
}

[data-theme='eye'] .preview-image {
  background: var(--color-card-muted);
}

.preview-glow {
  position: absolute;
  inset: 16px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.36);
}

.preview-orb {
  position: absolute;
  right: 12%;
  bottom: 12%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.08));
  box-shadow: 0 20px 40px rgba(255, 255, 255, 0.2);
}

.preview-copy strong {
  display: block;
  margin-bottom: 8px;
}

.preview-meta {
  display: inline-flex;
  margin-top: 10px;
  font-size: 13px;
}

.preview-copy p,
.landing-cta h2,
.landing-cta p,
.insight-card p {
  margin: 0;
}

.visual-chip {
  align-self: flex-end;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.landing-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.metric-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-card strong {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  line-height: 1;
}

.insight-card,
.landing-cta {
  padding: 24px;
}

.chart-card-polished {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(111, 140, 255, 0.08), transparent 28%),
    linear-gradient(180deg, var(--color-card) 0%, var(--color-card-strong) 100%);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 14px;
}

.card-head h2 {
  margin-top: 8px;
}

.card-note {
  max-width: 240px;
}

.chart-grid {
  align-items: stretch;
}

.chart-box {
  width: 100%;
  min-height: 280px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.16));
}

.chart-box--trend {
  min-height: 300px;
}

.source-card .chart-box,
.chart-box--donut {
  min-height: 260px;
}

.chart-box--wide {
  min-height: 300px;
}

[data-theme='eye'] .chart-box {
  background: linear-gradient(180deg, rgba(25, 48, 88, 0.56), rgba(12, 24, 46, 0.24));
}

.landing-cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

@media (max-width: 1180px) {
  .landing-hero,
  .landing-grid {
    grid-template-columns: 1fr;
  }

  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .landing-hero h1 {
    max-width: 14ch;
  }
}

@media (max-width: 768px) {
  .landing-shell {
    gap: 16px;
  }

  .landing-hero,
  .insight-card,
  .landing-cta,
  .metric-card {
    padding: 18px;
  }

  .landing-hero h1 {
    max-width: none;
    font-size: clamp(1.8rem, 9vw, 2.8rem);
  }

  .preview-image {
    min-height: 220px;
  }

  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-note {
    max-width: none;
  }

  .chart-box,
  .source-card .chart-box,
  .chart-box--wide,
  .chart-box--trend {
    min-height: 240px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .landing-cta {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions,
  .hero-link {
    width: 100%;
  }

  .hero-actions :deep(a),
  .landing-cta :deep(a) {
    width: 100%;
  }
}
</style>
