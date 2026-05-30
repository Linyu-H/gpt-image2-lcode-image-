<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import AppLayout from '../layouts/AppLayout.vue'
import { fetchFeaturedExample, fetchPublicStatistics } from '../api/image'
import { useI18nStore } from '../stores/i18n'
import { useThemeStore } from '../stores/theme'

const i18n = useI18nStore()
const themeStore = useThemeStore()

const trendRef = ref(null)
const sourceRef = ref(null)
const cycleRef = ref(null)
const trendChart = ref(null)
const sourceChart = ref(null)
const cycleChart = ref(null)
const statistics = ref(null)
const featuredExample = ref(null)
const charts = []
const chartFontFamily = '"Songti SC", "STSong", "Source Han Serif SC", "Noto Serif SC", "SimSun", serif'

function readCssVar(name, fallback = '') {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function readChartTokens() {
  return {
    text: readCssVar('--chart-text', '#1f2a1f'),
    muted: readCssVar('--chart-text-muted', '#617261'),
    axis: readCssVar('--chart-axis', 'rgba(120, 145, 124, 0.32)'),
    split: readCssVar('--chart-split', 'rgba(120, 145, 124, 0.18)'),
    tooltipBg: readCssVar('--chart-tooltip-bg', 'rgba(15, 28, 18, 0.94)'),
    tooltipText: readCssVar('--chart-tooltip-text', '#f7fbf7'),
    color1: readCssVar('--chart-color-1', '#39a86b'),
    color2: readCssVar('--chart-color-2', '#6f8cff'),
    color3: readCssVar('--chart-color-3', '#f08a5d'),
    cardStrong: readCssVar('--color-card-strong', '#ffffff'),
  }
}

const summaryCards = computed(() => [
  {
    label: i18n.t('totalGenerated'),
    value: statistics.value?.totalImages ?? 0,
  },
  {
    label: i18n.t('activeImages'),
    value: statistics.value?.activeImages ?? 0,
  },
  {
    label: i18n.t('todayGenerated'),
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
  const tokens = readChartTokens()

  const buckets = {
    shared: { value: 0, name: i18n.t('sharedToken'), itemStyle: { color: tokens.color1 } },
    private: { value: 0, name: i18n.t('privateToken'), itemStyle: { color: tokens.color2 } },
  }

  rows.forEach((item) => {
    const total = Number(item.total || 0)
    const type = item.sourceType
    if (type === 'private') {
      buckets.private.value += total
    } else if (type === 'shared' || type === 'contributor') {
      buckets.shared.value += total
    }
  })

  return [buckets.shared, buckets.private]
})

const retentionSeries = computed(() => {
  const rows = statistics.value?.retention || []
  const totals = new Map(rows.map((item) => [item.bucket, Number(item.total || 0)]))

  return [
    { key: 'within_1_day', label: i18n.t('remainingTime', { days: 1, hours: 0, minutes: 0 }), total: totals.get('within_1_day') || 0 },
    { key: 'within_2_days', label: i18n.t('remainingTime', { days: 2, hours: 0, minutes: 0 }), total: totals.get('within_2_days') || 0 },
    { key: 'within_3_days', label: i18n.t('remainingTime', { days: 3, hours: 0, minutes: 0 }), total: totals.get('within_3_days') || 0 },
    { key: 'expired', label: i18n.isEnglish ? 'Expired' : '已过期', total: totals.get('expired') || 0 },
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
  const t = readChartTokens()
  return {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: chartFontFamily, color: t.text },
    tooltip: {
      trigger: 'item',
      backgroundColor: t.tooltipBg,
      borderWidth: 0,
      padding: [8, 12],
      textStyle: { color: t.tooltipText, fontFamily: chartFontFamily, fontSize: 13 },
      formatter: '{b}<br/>{c} 张 · {d}%',
    },
    legend: {
      bottom: 6,
      left: 'center',
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: t.text, fontSize: 12, fontFamily: chartFontFamily },
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
          borderColor: t.cardStrong,
          borderWidth: 4,
          shadowBlur: 18,
          shadowColor: 'rgba(0, 0, 0, 0.08)',
        },
        label: {
          show: true,
          position: 'outer',
          formatter: '{d}%',
          color: t.text,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: chartFontFamily,
        },
        labelLine: { length: 10, length2: 8, lineStyle: { color: t.axis } },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: { color: t.text },
        },
        data: sourceSeries.value,
      },
    ],
  }
}

function buildTrendOption() {
  const t = readChartTokens()
  return {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: chartFontFamily, color: t.text },
    grid: { left: 8, right: 8, top: 26, bottom: 14, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: t.tooltipBg,
      borderWidth: 0,
      padding: [8, 12],
      textStyle: { color: t.tooltipText, fontFamily: chartFontFamily, fontSize: 13 },
      axisPointer: {
        type: 'line',
        lineStyle: { color: t.color2, width: 1.5, opacity: 0.4 },
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
      axisLine: { lineStyle: { color: t.axis } },
      axisTick: { show: false },
      axisLabel: { color: t.text, margin: 12, fontSize: 12, fontFamily: chartFontFamily },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitNumber: 4,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: t.split, type: 'dashed' } },
      axisLabel: { color: t.text, fontSize: 12, fontFamily: chartFontFamily },
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
          color: t.color2,
          shadowBlur: 16,
          shadowColor: t.color2,
          shadowOpacity: 0.22,
        },
        itemStyle: {
          color: t.color2,
          borderColor: t.cardStrong,
          borderWidth: 2,
        },
        emphasis: {
          focus: 'series',
          scale: true,
          itemStyle: {
            color: t.color2,
            borderColor: t.cardStrong,
            borderWidth: 3,
          },
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: t.color2 + '4d' },
            { offset: 0.55, color: t.color2 + '1f' },
            { offset: 1, color: t.color2 + '05' },
          ]),
        },
        data: trendSeries.value.map((item) => item.total),
      },
    ],
  }
}

function buildCycleOption() {
  const t = readChartTokens()
  return {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: chartFontFamily, color: t.text },
    grid: { left: 12, right: 14, top: 18, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: t.tooltipBg,
      borderWidth: 0,
      padding: [8, 12],
      textStyle: { color: t.tooltipText, fontFamily: chartFontFamily, fontSize: 13 },
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: t.color1 + '14' },
      },
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: t.text, fontSize: 12, fontFamily: chartFontFamily },
      splitLine: { lineStyle: { color: t.split, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: retentionSeries.value.map((item) => item.label),
      axisLabel: { color: t.text, margin: 14, fontSize: 12, fontFamily: chartFontFamily },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barWidth: 14,
        showBackground: true,
        backgroundStyle: {
          color: t.split,
          borderRadius: 999,
        },
        itemStyle: {
          borderRadius: [0, 999, 999, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: t.color1 },
            { offset: 1, color: t.color2 },
          ]),
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: t.color1 },
              { offset: 1, color: t.color3 },
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
watch(() => themeStore.theme, () => {
  // give CSS vars one frame to update on the documentElement before reading
  requestAnimationFrame(syncCharts)
})

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
          <div class="hero-badge">{{ i18n.t('landingBadge') }}</div>
          <h1>{{ i18n.t('landingTitle') }}</h1>
          <p class="hero-text muted">
            {{ i18n.t('landingText') }}
          </p>
          <div class="hero-actions">
            <RouterLink to="/create" class="button-primary hero-link">{{ i18n.t('startCreate') }}</RouterLink>
            <RouterLink to="/history" class="button-secondary hero-link">{{ i18n.t('viewHistory') }}</RouterLink>
          </div>
          <div class="hero-points muted">
            <span>{{ i18n.t('responsive') }}</span>
            <span>{{ i18n.t('themeSwitch') }}</span>
            <span>{{ i18n.t('tokenChannels') }}</span>
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
                <strong>{{ i18n.t('featuredPrompt') }}</strong>
                <p class="muted">{{ featuredExample?.prompt || '' }}</p>
                <span v-if="featuredExampleDate" class="preview-meta muted">{{ i18n.t('featuredUpdated', { date: featuredExampleDate }) }}</span>
                <span v-else class="preview-meta muted">{{ i18n.t('noFeatured') }}</span>
              </div>
            </div>
          </div>
          <div class="visual-chip card">{{ i18n.t('retention3Days') }}</div>
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
              <p class="info-eyebrow">{{ i18n.t('generationTrend') }}</p>
              <h2>{{ i18n.t('trendTitle') }}</h2>
            </div>
            <p class="muted card-note">{{ i18n.t('trendNote') }}</p>
          </div>
          <div ref="trendRef" class="chart-box chart-box--trend" />
        </section>

        <section class="card insight-card source-card chart-card-polished">
          <div class="card-head">
            <div>
              <p class="info-eyebrow">{{ i18n.t('sourceEyebrow') }}</p>
              <h2>{{ i18n.t('sourceTitle') }}</h2>
            </div>
            <p class="muted card-note">{{ i18n.t('sourceNote') }}</p>
          </div>
          <div ref="sourceRef" class="chart-box chart-box--donut" />
        </section>
      </section>

      <section class="card insight-card cycle-card chart-card-polished">
        <div class="card-head">
          <div>
            <p class="info-eyebrow">{{ i18n.t('cycleEyebrow') }}</p>
            <h2>{{ i18n.t('cycleTitle') }}</h2>
          </div>
          <p class="muted card-note">{{ i18n.t('cycleNote') }}</p>
        </div>
        <div ref="cycleRef" class="chart-box chart-box--wide" />
      </section>

      <section class="card landing-cta">
        <div>
          <p class="info-eyebrow">{{ i18n.t('ctaEyebrow') }}</p>
          <h2>{{ i18n.t('ctaTitle') }}</h2>
          <p class="muted">{{ i18n.t('ctaText') }}</p>
        </div>
        <RouterLink to="/create" class="button-primary hero-link">{{ i18n.t('enterCreate') }}</RouterLink>
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
