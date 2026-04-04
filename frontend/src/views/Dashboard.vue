<template>
  <main class="hud-shell">
    <div class="hud-backdrop"></div>
    <div class="hud-orb hud-orb-a"></div>
    <div class="hud-orb hud-orb-b"></div>
    <div class="hud-orb hud-orb-c"></div>

    <div class="hud-stage">
      <aside class="hud-sidebar hud-float">
        <button class="hud-side-button active" type="button" @click="router.push('/')">HOME</button>
        <button class="hud-side-button" type="button" @click="loadDashboard">DATA</button>
        <button class="hud-side-button" type="button" @click="scrollToRecords">LOGS</button>
        <button class="hud-side-button" type="button" @click="changeAdminToken">KEY</button>
        <div class="hud-sidebar-badge">R-23</div>
      </aside>

      <section class="hud-workspace">
        <header class="hud-browser-bar hud-float">
          <div class="hud-browser-controls">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="hud-browser-address">{{ browserAddress }}</div>
          <div class="hud-browser-actions">
            <button class="hud-top-button" type="button" @click="router.push('/')">首页</button>
            <button class="hud-top-button" type="button" @click="changeAdminToken">设置令牌</button>
            <button class="hud-cyan-button" type="button" :disabled="store.loading.dashboard" @click="loadDashboard">
              {{ store.loading.dashboard ? "刷新中..." : "刷新数据" }}
            </button>
          </div>
        </header>

        <section class="hud-hero-panel hud-float">
          <div class="hud-hero-head">
            <div>
              <p class="hud-label">Research Console</p>
              <h1>个性化提示干预监测台</h1>
              <p class="hud-hero-copy">
                这里汇总实验记录、提示接受度、修改行为和决策时长。
                视觉改成独立悬浮的 HUD 界面，但统计逻辑仍来自当前项目的数据流。
              </p>
            </div>

            <div class="hud-runtime-card">
              <span class="hud-runtime-dot" :class="{ offline: store.runtimeMode === 'offline' }"></span>
              <div>
                <p class="hud-runtime-label">Runtime</p>
                <strong>{{ store.runtimeMode === "offline" ? "Offline fallback" : "Online API" }}</strong>
                <p>{{ runtimeNotice }}</p>
              </div>
            </div>
          </div>

          <div v-if="store.lastError" class="hud-alert">
            <strong>API Notice</strong>
            <span>{{ store.lastError }}</span>
          </div>

          <div class="hud-stat-grid">
            <article v-for="item in heroMetrics" :key="item.label" class="hud-stat-card">
              <p class="hud-card-label">{{ item.label }}</p>
              <strong>{{ item.value }}</strong>
              <span>{{ item.hint }}</span>
            </article>
          </div>
        </section>

        <section class="hud-main-grid">
          <article class="hud-panel hud-chart-panel hud-float">
            <div class="hud-section-head">
              <div>
                <p class="hud-label">Signal map</p>
                <h2>分组与行为走势</h2>
              </div>
              <span class="hud-gold-pill">Current total weight {{ currentTotalWeight }}</span>
            </div>

            <div class="hud-chart">
              <div v-for="item in chartItems" :key="item.label" class="hud-chart-column">
                <div class="hud-chart-rail">
                  <span class="hud-chart-fill" :style="{ height: `${item.percent}%` }"></span>
                </div>
                <strong>{{ item.value }}</strong>
                <span>{{ item.label }}</span>
              </div>
            </div>

            <div class="hud-kpi-grid">
              <article v-for="item in performanceMetrics" :key="item.label" class="hud-kpi-card">
                <p>{{ item.label }}</p>
                <strong>{{ item.value }}</strong>
                <span>{{ item.hint }}</span>
              </article>
            </div>
          </article>

          <div class="hud-stack">
            <article class="hud-panel hud-float">
              <div class="hud-section-head compact">
                <div>
                  <p class="hud-label">Observation</p>
                  <h2>快速筛选</h2>
                </div>
              </div>

              <div class="hud-form-grid">
                <label>
                  <span>实验组别</span>
                  <select v-model="filters.group">
                    <option value="">全部</option>
                    <option v-for="item in ratioFields" :key="item.key" :value="item.key">{{ item.label }}</option>
                  </select>
                </label>

                <label>
                  <span>情境主题</span>
                  <select v-model="filters.scenarioId">
                    <option value="">全部</option>
                    <option v-for="item in scenarioOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
                  </select>
                </label>

                <label>
                  <span>显示条数</span>
                  <select v-model.number="filters.limit">
                    <option :value="30">30</option>
                    <option :value="60">60</option>
                    <option :value="100">100</option>
                    <option :value="200">200</option>
                  </select>
                </label>
              </div>

              <div class="hud-inline-actions">
                <button class="hud-cyan-button" type="button" @click="loadDashboard">应用筛选</button>
                <button class="hud-top-button" type="button" @click="resetFilters">重置</button>
              </div>
            </article>

            <article class="hud-panel hud-profile-panel hud-float">
              <p class="hud-label">Runtime brief</p>
              <div class="hud-profile-list">
                <div>
                  <span>反馈记录</span>
                  <strong>{{ animatedCounts.feedbackCount }}</strong>
                </div>
                <div>
                  <span>平均时长</span>
                  <strong>{{ formatLatency(insights.avg_decision_latency_ms) }}</strong>
                </div>
                <div>
                  <span>平均友好度</span>
                  <strong>{{ formatScore(insights.avg_friendliness) }}</strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="hud-lower-grid">
          <article class="hud-panel hud-float">
            <div class="hud-section-head">
              <div>
                <p class="hud-label">Allocation</p>
                <h2>提示分配权重</h2>
              </div>
            </div>

            <div class="hud-allocation-grid">
              <label v-for="item in ratioFields" :key="item.key">
                <span>{{ item.label }}</span>
                <input v-model.number="allocationDraft[item.key]" type="number" min="0" />
              </label>
            </div>

            <p class="hud-helper-text">设置为 `1:1:1:1:1` 时，五类提示会按等概率进行分配。</p>
            <p v-if="allocationError" class="hud-error">{{ allocationError }}</p>

            <div class="hud-inline-actions">
              <button class="hud-top-button" type="button" :disabled="store.loading.allocation" @click="setEqualAllocation">
                一键设为 1:1:1:1:1
              </button>
              <button
                class="hud-cyan-button"
                type="button"
                :disabled="store.loading.allocation || !canSaveAllocation"
                @click="saveAllocation"
              >
                {{ store.loading.allocation ? "保存中..." : "保存配置" }}
              </button>
            </div>

            <div class="hud-preview-box">
              <p class="hud-card-label">Normalized ratio</p>
              <strong>{{ ratioPreview }}</strong>
            </div>
          </article>

          <article class="hud-panel hud-float">
            <div class="hud-section-head">
              <div>
                <p class="hud-label">Distribution</p>
                <h2>行为与分组分布</h2>
              </div>
            </div>

            <div class="hud-distribution-groups">
              <section v-for="section in distributionSections" :key="section.title">
                <p class="hud-card-label">{{ section.title }}</p>
                <div class="hud-distribution-list">
                  <div v-for="item in section.items" :key="item.label" class="hud-distribution-row">
                    <div class="hud-distribution-text">
                      <strong>{{ item.label }}</strong>
                      <span>{{ item.value }}</span>
                    </div>
                    <div class="hud-distribution-bar">
                      <span :style="{ width: `${item.percent}%` }"></span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </article>

          <article ref="recordsSection" class="hud-panel hud-record-panel hud-float">
            <div class="hud-section-head">
              <div>
                <p class="hud-label">Recent records</p>
                <h2>实验样本列表</h2>
              </div>
              <span class="hud-gold-pill">{{ records.length }} rows</span>
            </div>

            <div class="hud-record-list">
              <article v-for="row in records.slice(0, filters.limit)" :key="row.experiment_id" class="hud-record-item">
                <div class="hud-record-top">
                  <div>
                    <p class="hud-record-title">{{ formatScenario(row.scenario_id) }}</p>
                    <p class="hud-record-subtitle">{{ formatGroup(row.group) }} / {{ formatPromptType(row.prompt_type) }}</p>
                  </div>
                  <span class="hud-record-time">{{ formatDate(row.updated_at || row.created_at) }}</span>
                </div>

                <p class="hud-record-comment">{{ formatComment(row.original_comment) }}</p>

                <div class="hud-record-meta">
                  <div class="hud-record-tags">
                    <span v-for="feature in row.risk_features || []" :key="feature">{{ feature }}</span>
                    <span v-if="!(row.risk_features || []).length">未触发风险标签</span>
                  </div>
                  <div class="hud-record-decision">
                    <strong>{{ formatAction(row.final_action) }}</strong>
                    <span>{{ formatFinalComment(row) }}</span>
                  </div>
                </div>
              </article>

              <div v-if="records.length === 0" class="hud-empty-state">暂无记录。</div>
            </div>
          </article>
        </section>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { ADMIN_TOKEN_STORAGE_KEY, useExperimentStore } from "../store/experiment";

const router = useRouter();
const store = useExperimentStore();
const recordsSection = ref(null);

const scenarioLabelMap = {
  "campus-traffic": "校园交通事故讨论",
  "grading-dispute": "课程评分争议",
  "dorm-conflict": "宿舍作息冲突"
};

const ratioFields = [
  { key: "empathy", label: "共情提示组" },
  { key: "consequence", label: "后果提示组" },
  { key: "normative", label: "规范提示组" },
  { key: "alternative", label: "替代表达组" },
  { key: "control", label: "对照提示组" }
];

const filters = reactive({ group: "", scenarioId: "", limit: 100 });
const allocationDraft = reactive({ empathy: 1, consequence: 1, normative: 1, alternative: 1, control: 1 });
const allocationError = ref("");
const animatedCounts = reactive({
  totalRecords: 0,
  completedRecords: 0,
  triggeredRecords: 0,
  feedbackCount: 0
});

const animationFrames = {};

const scenarioOptions = computed(() =>
  Object.entries(scenarioLabelMap).map(([value, label]) => ({ value, label }))
);

const summary = computed(() => store.dashboard.summary || {
  total_records: 0,
  completed_records: 0,
  uncivil_triggered_records: 0
});

const insights = computed(() => store.dashboard.insights || {});
const records = computed(() => store.dashboard.records || []);
const distributions = computed(() => store.dashboard.distributions || { groups: {}, actions: {}, scenarios: {} });
const allocation = computed(() => store.dashboard.allocation || {
  weights: { empathy: 1, consequence: 1, normative: 1, alternative: 1, control: 1 },
  normalized_ratio: { empathy: 0.2, consequence: 0.2, normative: 0.2, alternative: 0.2, control: 0.2 },
  total_weight: 5
});

const currentTotalWeight = computed(() => Object.values(allocationDraft).reduce((sum, value) => sum + Number(value || 0), 0));
const canSaveAllocation = computed(
  () => store.runtimeMode === "online" && Boolean((sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "").trim())
);

const browserAddress = computed(() =>
  store.runtimeMode === "offline" ? "offline-sandbox.local/research-console" : "llm-based-prompt-tool.vercel.app/dashboard"
);

const runtimeNotice = computed(() => {
  if (store.runtimeMode === "offline") {
    return store.runtimeNotice || "当前处于本地演示回退模式。";
  }
  return "API 已连接，可实时读取实验后台数据。";
});

const heroMetrics = computed(() => [
  { label: "总记录数", value: animatedCounts.totalRecords, hint: "所有已初始化的实验记录" },
  { label: "已完成样本", value: animatedCounts.completedRecords, hint: "已完成评论和最终决策" },
  { label: "触发提示数", value: animatedCounts.triggeredRecords, hint: "检测到不文明风险并触发干预" },
  { label: "反馈回收", value: animatedCounts.feedbackCount, hint: "已记录提示评价与后测反馈" }
]);

const performanceMetrics = computed(() => [
  { label: "修改率", value: formatPercent(insights.value.modify_rate), hint: "最终选择修改后再发布" },
  { label: "帮助感", value: formatScore(insights.value.avg_helpfulness), hint: "提示是否真正起作用" },
  { label: "贴合度", value: formatScore(insights.value.avg_relevance), hint: "提示是否贴近语境" },
  { label: "反思增益", value: formatScore(insights.value.avg_reflection_gain), hint: "提示是否提升发前复核意愿" }
]);

const ratioPreview = computed(() => {
  const ratio = allocation.value.normalized_ratio || {};
  return ratioFields
    .map((item) => `${item.label} ${Math.round((Number(ratio[item.key]) || 0) * 100)}%`)
    .join(" / ");
});

const chartItems = computed(() => {
  const source = Object.entries(distributions.value.groups || {});
  const max = Math.max(...source.map(([, value]) => Number(value || 0)), 1);
  return source.map(([key, value]) => ({
    label: formatGroup(key),
    value: value || 0,
    percent: Math.max(12, Math.round((Number(value || 0) / max) * 100))
  }));
});

const distributionSections = computed(() => [
  { title: "分组分布", items: buildDistributionItems(distributions.value.groups, formatGroup) },
  { title: "行为分布", items: buildDistributionItems(distributions.value.actions, formatAction) },
  { title: "情境分布", items: buildDistributionItems(distributions.value.scenarios, formatScenario) }
]);

function buildDistributionItems(map, formatter) {
  const entries = Object.entries(map || {});
  const max = Math.max(...entries.map(([, value]) => Number(value || 0)), 1);
  return entries.map(([key, value]) => ({
    label: formatter(key),
    value,
    percent: Math.max(10, Math.round((Number(value || 0) / max) * 100))
  }));
}

function animateCounter(key, target) {
  cancelAnimationFrame(animationFrames[key]);
  const start = Number(animatedCounts[key]) || 0;
  const end = Number(target) || 0;
  const duration = 800;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    animatedCounts[key] = Math.round(start + (end - start) * eased);
    if (progress < 1) {
      animationFrames[key] = requestAnimationFrame(step);
    }
  };

  animationFrames[key] = requestAnimationFrame(step);
}

function syncAllocationDraft() {
  const weights = allocation.value.weights || {};
  for (const item of ratioFields) {
    allocationDraft[item.key] = Math.max(0, Number(weights[item.key] ?? 1));
  }
}

function sanitizeAllocationPayload() {
  const payload = {};
  for (const item of ratioFields) {
    const value = Number(allocationDraft[item.key]);
    payload[item.key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }
  return payload;
}

function ensureAdminToken() {
  let token = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
  if (token.trim()) {
    return true;
  }

  token = (window.prompt("请输入管理令牌（Admin Token）：") || "").trim();
  if (!token) {
    return false;
  }

  sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  return true;
}

function changeAdminToken() {
  const token = (window.prompt("请输入新的管理令牌：") || "").trim();
  if (!token) {
    return;
  }
  sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  loadDashboard();
}

function setEqualAllocation() {
  allocationError.value = "";
  for (const item of ratioFields) {
    allocationDraft[item.key] = 1;
  }
}

async function saveAllocation() {
  allocationError.value = "";

  if (!canSaveAllocation.value) {
    if (!ensureAdminToken()) {
      allocationError.value = "未提供管理令牌，无法保存在线分组比例。";
      return;
    }
  }

  const payload = sanitizeAllocationPayload();
  const total = Object.values(payload).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    allocationError.value = "比例总和不能为 0，请至少保留一个大于 0 的值。";
    return;
  }

  try {
    await store.updatePromptAllocation(payload);
    await loadDashboard();
  } catch (error) {
    allocationError.value = error.message;
  }
}

function resetFilters() {
  filters.group = "";
  filters.scenarioId = "";
  filters.limit = 100;
  loadDashboard();
}

function scrollToRecords() {
  recordsSection.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

function formatGroup(value) {
  const labels = {
    empathy: "共情提示组",
    consequence: "后果提示组",
    normative: "规范提示组",
    alternative: "替代表达组",
    control: "对照提示组"
  };
  return labels[value] || value || "-";
}

function formatPromptType(value) {
  return formatGroup(value);
}

function formatAction(value) {
  const labels = {
    post: "直接发布",
    modify: "修改后发布",
    cancel: "取消发布",
    post_anyway: "直接发布",
    adopt_suggestion: "采纳建议",
    self_rewrite: "自行修改",
    cancel_publish: "取消发布"
  };
  return labels[value] || value || "-";
}

function formatScenario(value) {
  return scenarioLabelMap[value] || value || "-";
}

function formatComment(value) {
  return value || "暂无原始评论文本。";
}

function formatFinalComment(row) {
  if (row.final_action === "cancel" || row.final_action === "cancel_publish") {
    return "已取消发布";
  }
  return row.final_submitted_comment || "未返回最终文本";
}

function formatScore(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${Number(value).toFixed(1)} / 5`;
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${Math.round(Number(value) * 100)}%`;
}

function formatLatency(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  if (Number(value) < 1000) {
    return `${Math.round(Number(value))} ms`;
  }
  return `${(Number(value) / 1000).toFixed(1)} s`;
}

async function loadDashboard() {
  allocationError.value = "";
  await store.fetchDashboard({
    group: filters.group,
    scenarioId: filters.scenarioId,
    limit: filters.limit
  });
  syncAllocationDraft();
}

watch(
  () => [
    summary.value.total_records,
    summary.value.completed_records,
    summary.value.uncivil_triggered_records,
    insights.value.feedback_count
  ],
  ([total, completed, triggered, feedback]) => {
    animateCounter("totalRecords", total ?? 0);
    animateCounter("completedRecords", completed ?? 0);
    animateCounter("triggeredRecords", triggered ?? 0);
    animateCounter("feedbackCount", feedback ?? 0);
  },
  { immediate: true }
);

onMounted(() => {
  loadDashboard();
});

onBeforeUnmount(() => {
  Object.values(animationFrames).forEach((frame) => cancelAnimationFrame(frame));
});
</script>

<style scoped>
.hud-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #eef1f4;
  color: #18212b;
}

.hud-backdrop {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(232, 236, 240, 0.86)),
    url("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80") center/cover;
  filter: blur(16px) grayscale(1) brightness(0.92);
  transform: scale(1.08);
}

.hud-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(110px);
  opacity: 0.5;
}

.hud-orb-a {
  top: 5%;
  left: -4rem;
  width: 18rem;
  height: 18rem;
  background: rgba(255, 255, 255, 0.78);
}

.hud-orb-b {
  top: 20%;
  right: -2rem;
  width: 16rem;
  height: 16rem;
  background: rgba(185, 193, 202, 0.42);
}

.hud-orb-c {
  bottom: -5rem;
  left: 28%;
  width: 20rem;
  height: 20rem;
  background: rgba(210, 216, 222, 0.5);
}

.hud-stage {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: 1.5rem;
  width: min(100%, 1520px);
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
}

.hud-float {
  animation: hud-float 8s ease-in-out infinite;
}

.hud-sidebar {
  align-self: start;
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0.75rem;
  border: 1px solid rgba(68, 77, 89, 0.12);
  border-radius: 2rem;
  background: rgba(255, 255, 255, 0.38);
  backdrop-filter: blur(26px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 1rem 2.8rem rgba(65, 76, 92, 0.12);
}

.hud-side-button,
.hud-top-button,
.hud-cyan-button {
  border: 1px solid rgba(68, 77, 89, 0.12);
  background: rgba(255, 255, 255, 0.38);
  color: #2f3a47;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.hud-side-button {
  width: 100%;
  min-height: 3rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hud-side-button:hover,
.hud-top-button:hover,
.hud-cyan-button:hover {
  transform: translateY(-1px);
  border-color: rgba(31, 41, 55, 0.18);
  box-shadow: 0 0 1rem rgba(15, 23, 42, 0.08);
}

.hud-side-button.active {
  color: #f8fafc;
  background: linear-gradient(135deg, rgba(50, 60, 74, 0.92), rgba(28, 36, 46, 0.94));
  border-color: rgba(17, 24, 39, 0.24);
}

.hud-sidebar-badge {
  margin-top: 0.5rem;
  color: rgba(71, 85, 105, 0.72);
  font-size: 0.74rem;
  text-align: center;
}

.hud-workspace {
  display: grid;
  gap: 1.25rem;
}

.hud-browser-bar,
.hud-panel,
.hud-hero-panel {
  border: 1px solid rgba(68, 77, 89, 0.12);
  background: rgba(255, 255, 255, 0.34);
  backdrop-filter: blur(32px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 1.5rem 3rem rgba(95, 107, 122, 0.12);
}

.hud-browser-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
  border-radius: 999px;
}

.hud-browser-controls {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.hud-browser-controls span {
  display: block;
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 999px;
  background: rgba(71, 85, 105, 0.22);
}

.hud-browser-address {
  min-width: 14rem;
  flex: 1;
  padding: 0.68rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
  color: #475569;
  font-family: "Space Grotesk", "SFMono-Regular", Consolas, monospace;
  font-size: 0.84rem;
  text-align: center;
}

.hud-browser-actions,
.hud-inline-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hud-top-button,
.hud-cyan-button {
  min-height: 2.75rem;
  padding: 0 1rem;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 700;
}

.hud-cyan-button {
  color: #f8fafc;
  border-color: rgba(17, 24, 39, 0.18);
  background: linear-gradient(135deg, rgba(52, 61, 73, 0.95), rgba(28, 36, 46, 0.96));
  box-shadow: 0 0 1rem rgba(15, 23, 42, 0.08);
}

.hud-cyan-button:disabled,
.hud-top-button:disabled,
.hud-side-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.hud-hero-panel {
  border-radius: 2.2rem;
  padding: 1.6rem;
}

.hud-hero-head,
.hud-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.hud-label,
.hud-card-label,
.hud-runtime-label {
  margin: 0;
  color: rgba(71, 85, 105, 0.76);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.hud-hero-head h1,
.hud-section-head h2 {
  margin: 0.75rem 0 0;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.hud-hero-copy {
  margin: 1rem 0 0;
  max-width: 48rem;
  color: rgba(51, 65, 85, 0.78);
  line-height: 1.9;
}

.hud-runtime-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  min-width: 18rem;
  padding: 1rem 1.05rem;
  border-radius: 1.4rem;
  background: rgba(255, 255, 255, 0.42);
}

.hud-runtime-card strong,
.hud-preview-box strong,
.hud-record-decision strong,
.hud-distribution-text strong,
.hud-kpi-card strong,
.hud-profile-list strong {
  color: #111827;
}

.hud-runtime-card p {
  margin: 0.35rem 0 0;
  color: rgba(71, 85, 105, 0.72);
  font-size: 0.88rem;
  line-height: 1.7;
}

.hud-runtime-dot {
  display: block;
  width: 0.75rem;
  height: 0.75rem;
  margin-top: 0.25rem;
  border-radius: 999px;
  background: #475569;
  box-shadow: 0 0 1rem rgba(71, 85, 105, 0.18);
}

.hud-runtime-dot.offline {
  background: #94a3b8;
  box-shadow: 0 0 1rem rgba(148, 163, 184, 0.18);
}

.hud-alert {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 1.1rem;
  padding: 0.95rem 1rem;
  border-radius: 1.2rem;
  background: rgba(226, 232, 240, 0.7);
  color: #334155;
}

.hud-alert strong {
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hud-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.35rem;
}

.hud-stat-card,
.hud-kpi-card,
.hud-preview-box,
.hud-record-item,
.hud-profile-list div {
  border: 1px solid rgba(68, 77, 89, 0.1);
  background: rgba(255, 255, 255, 0.42);
}

.hud-stat-card {
  padding: 1.2rem;
  border-radius: 1.6rem;
}

.hud-stat-card strong {
  display: block;
  margin-top: 0.8rem;
  color: #0f172a;
  font-family: "Space Grotesk", "SFMono-Regular", Consolas, monospace;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  letter-spacing: -0.04em;
}

.hud-stat-card span,
.hud-kpi-card span,
.hud-helper-text,
.hud-empty-state {
  display: block;
  margin-top: 0.45rem;
  color: rgba(71, 85, 105, 0.72);
  font-size: 0.84rem;
  line-height: 1.7;
}

.hud-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 0.8fr);
  gap: 1.25rem;
  align-items: start;
}

.hud-panel {
  border-radius: 2rem;
  padding: 1.35rem;
}

.hud-section-head.compact h2 {
  font-size: 1.55rem;
}

.hud-gold-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.2rem;
  padding: 0 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(68, 77, 89, 0.12);
  background: rgba(255, 255, 255, 0.46);
  color: #475569;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hud-chart {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
  gap: 1rem;
  align-items: end;
  min-height: 18rem;
  margin-top: 1.2rem;
  padding: 1.2rem;
  border-radius: 1.7rem;
  background:
    linear-gradient(rgba(71, 85, 105, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(71, 85, 105, 0.08) 1px, transparent 1px),
    rgba(255, 255, 255, 0.36);
  background-size: 100% 20%, 10% 100%, auto;
}

.hud-chart-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.hud-chart-rail {
  position: relative;
  width: 100%;
  height: 10rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
  overflow: hidden;
}

.hud-chart-fill {
  position: absolute;
  inset: auto 0 0;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.78), rgba(51, 65, 85, 0.92));
  box-shadow: 0 0 1rem rgba(71, 85, 105, 0.12);
}

.hud-chart-column strong {
  color: #334155;
  font-family: "Space Grotesk", "SFMono-Regular", Consolas, monospace;
}

.hud-chart-column span {
  color: rgba(71, 85, 105, 0.7);
  font-size: 0.82rem;
  text-align: center;
}

.hud-kpi-grid,
.hud-allocation-grid,
.hud-form-grid,
.hud-lower-grid {
  display: grid;
  gap: 1rem;
}

.hud-kpi-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 1rem;
}

.hud-kpi-card {
  padding: 1rem;
  border-radius: 1.4rem;
}

.hud-kpi-card p,
.hud-profile-list span,
.hud-distribution-text span,
.hud-record-subtitle,
.hud-record-time {
  color: rgba(71, 85, 105, 0.74);
  font-size: 0.82rem;
}

.hud-kpi-card strong {
  display: block;
  margin-top: 0.55rem;
  font-size: 1.3rem;
  color: #111827;
  font-family: "Space Grotesk", "SFMono-Regular", Consolas, monospace;
}

.hud-stack {
  display: grid;
  gap: 1rem;
}

.hud-form-grid {
  grid-template-columns: 1fr;
  margin-top: 1rem;
}

.hud-form-grid label,
.hud-allocation-grid label {
  display: grid;
  gap: 0.45rem;
}

.hud-form-grid span,
.hud-allocation-grid span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 600;
}

.hud-form-grid select,
.hud-allocation-grid input {
  width: 100%;
  min-height: 3rem;
  padding: 0 0.95rem;
  border: 1px solid rgba(68, 77, 89, 0.12);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.52);
  color: #0f172a;
  outline: none;
}

.hud-form-grid select:focus,
.hud-allocation-grid input:focus {
  border-color: rgba(71, 85, 105, 0.28);
  box-shadow: 0 0 0 0.18rem rgba(148, 163, 184, 0.16);
}

.hud-profile-list {
  display: grid;
  gap: 0.8rem;
  margin-top: 1rem;
}

.hud-profile-list div {
  padding: 1rem;
  border-radius: 1.3rem;
}

.hud-profile-list strong {
  display: block;
  margin-top: 0.45rem;
  font-size: 1.12rem;
  font-family: "Space Grotesk", "SFMono-Regular", Consolas, monospace;
}

.hud-lower-grid {
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  align-items: start;
}

.hud-allocation-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1rem;
}

.hud-error {
  margin-top: 0.8rem;
  color: #475569;
  font-size: 0.9rem;
}

.hud-preview-box {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 1.35rem;
}

.hud-preview-box strong {
  display: block;
  margin-top: 0.6rem;
  line-height: 1.8;
}

.hud-distribution-groups {
  display: grid;
  gap: 1.1rem;
  margin-top: 1rem;
}

.hud-distribution-list {
  display: grid;
  gap: 0.85rem;
  margin-top: 0.8rem;
}

.hud-distribution-row {
  display: grid;
  gap: 0.5rem;
}

.hud-distribution-text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.hud-distribution-bar {
  height: 0.55rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

.hud-distribution-bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.78), rgba(71, 85, 105, 0.92));
}

.hud-record-panel {
  grid-column: 1 / -1;
}

.hud-record-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
  max-height: 42rem;
  overflow: auto;
  padding-right: 0.25rem;
}

.hud-record-item {
  padding: 1rem;
  border-radius: 1.45rem;
}

.hud-record-top,
.hud-record-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.hud-record-title {
  margin: 0;
  color: #111827;
  font-size: 1.05rem;
  font-weight: 700;
}

.hud-record-subtitle {
  margin: 0.3rem 0 0;
}

.hud-record-time {
  white-space: nowrap;
}

.hud-record-comment {
  margin: 0.9rem 0 0;
  color: rgba(51, 65, 85, 0.78);
  line-height: 1.85;
}

.hud-record-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.hud-record-tags span {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0 0.8rem;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.84);
  color: #475569;
  font-size: 0.78rem;
}

.hud-record-decision {
  max-width: 18rem;
  text-align: right;
}

.hud-record-decision strong {
  display: block;
  color: #0f172a;
}

.hud-record-decision span {
  display: block;
  margin-top: 0.35rem;
  color: rgba(71, 85, 105, 0.72);
  font-size: 0.82rem;
  line-height: 1.7;
}

.hud-empty-state {
  padding: 1.25rem;
  border-radius: 1.2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.4);
}

@keyframes hud-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-0.38rem);
  }
}

@media (max-width: 1180px) {
  .hud-stage,
  .hud-main-grid,
  .hud-lower-grid {
    grid-template-columns: 1fr;
  }

  .hud-sidebar {
    position: static;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .hud-sidebar-badge {
    margin-top: 0;
  }

  .hud-stat-grid,
  .hud-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .hud-stage {
    padding: 1rem 0.85rem 1.5rem;
  }

  .hud-browser-bar,
  .hud-hero-head,
  .hud-section-head,
  .hud-record-top,
  .hud-record-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .hud-browser-address,
  .hud-runtime-card {
    width: 100%;
    min-width: 0;
  }

  .hud-stat-grid,
  .hud-kpi-grid,
  .hud-allocation-grid {
    grid-template-columns: 1fr;
  }

  .hud-record-decision {
    text-align: left;
  }
}
</style>
