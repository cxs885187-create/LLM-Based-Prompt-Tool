<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <button class="ghost-button" @click="router.push('/')">
        <span aria-hidden="true">&larr;</span>
        返回首页
      </button>
      <div class="flex flex-wrap items-center gap-2">
        <button class="secondary-button" @click="changeAdminToken">设置管理令牌</button>
        <button class="primary-button" :disabled="store.loading.dashboard" @click="loadDashboard">
          {{ store.loading.dashboard ? "刷新中..." : "刷新数据" }}
        </button>
      </div>
    </div>

    <header class="panel p-6 md:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span class="eyebrow-pill">Research Console</span>
          <h1 class="display-title mt-5 text-4xl font-semibold text-slate-900 md:text-5xl">
            实验后台不只看记录，也看“提示到底有没有起作用”。
          </h1>
          <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            这一版后台把行为结果、提示评价、后测反馈和决策时长集中到同一页中。若线上接口暂时不可用，也会自动回落到本地演示数据。
          </p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-white/80 px-5 py-4">
          <p class="section-label">反馈记录数</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ insights.feedback_count ?? 0 }}</p>
        </div>
      </div>

      <div v-if="store.runtimeMode === 'offline' && store.runtimeNotice" class="status-banner mt-6">
        <strong>当前为演示模式</strong>
        <span>{{ store.runtimeNotice }}</span>
      </div>

      <p v-if="store.lastError" aria-live="polite" class="mt-4 text-sm font-semibold text-amber-700">{{ store.lastError }}</p>
    </header>

    <section class="mt-6 grid gap-4 md:grid-cols-3">
      <StatsCard label="总记录数" :value="summary.total_records" hint="所有已初始化实验" />
      <StatsCard label="已完成数" :value="summary.completed_records" hint="完成评论与决策提交" />
      <StatsCard label="触发提示数" :value="summary.uncivil_triggered_records" hint="出现 AIGC 干预的记录" />
    </section>

    <section class="mt-6 grid gap-4 lg:grid-cols-4">
      <StatsCard label="修改率" :value="formatPercent(insights.modify_rate)" hint="最终选择修改后发布的占比" />
      <StatsCard label="平均帮助感" :value="formatScore(insights.avg_helpfulness)" hint="提示是否真正帮助了参与者" />
      <StatsCard label="平均贴合度" :value="formatScore(insights.avg_relevance)" hint="提示和原评论的匹配程度" />
      <StatsCard label="平均反思收益" :value="formatScore(insights.avg_reflection_gain)" hint="是否提升发布前复核意愿" />
    </section>

    <div class="mt-6 grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
      <section class="panel p-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="section-label">提示类型分配比例</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">实验分组配置</h2>
          </div>
          <p class="text-sm text-slate-500">当前总权重：{{ currentTotalWeight }}</p>
        </div>

        <div class="grid gap-3 md:grid-cols-5">
          <label v-for="item in ratioFields" :key="item.key" class="text-sm">
            <span class="field-label">{{ item.label }}</span>
            <input
              v-model.number="allocationDraft[item.key]"
              type="number"
              min="0"
              class="field-input"
            />
          </label>
        </div>

        <p class="mt-3 text-xs text-slate-500">设置为 `1:1:1:1:1` 时，系统会等概率分配五种提示类型。</p>
        <p v-if="allocationError" aria-live="polite" class="mt-2 text-sm font-semibold text-rose-600">{{ allocationError }}</p>

        <div class="mt-5 flex flex-wrap gap-3">
          <button class="secondary-button" :disabled="store.loading.allocation" @click="setEqualAllocation">
            一键设为 1:1:1:1:1
          </button>
          <button class="primary-button" :disabled="store.loading.allocation || !canSaveAllocation" @click="saveAllocation">
            {{ store.loading.allocation ? "保存中..." : "保存比例配置" }}
          </button>
        </div>

        <p v-if="!canSaveAllocation" class="mt-3 text-xs text-slate-500">
          当前没有可用的在线后台或管理令牌，暂时只能查看本地演示数据。
        </p>

        <div class="mt-5 rounded-[22px] bg-white/70 p-4">
          <p class="text-sm font-semibold text-slate-900">最新归一化比例</p>
          <p class="mt-2 text-sm leading-7 text-slate-600">{{ ratioPreview }}</p>
        </div>
      </section>

      <section class="panel p-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="section-label">筛选与洞察</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900">快速切换观察视角</h2>
          </div>
          <span class="chip chip-navy">支持按组别 / 情境筛选</span>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <label class="text-sm">
            <span class="field-label">组别筛选</span>
            <select v-model="filters.group" class="field-select">
              <option value="">全部</option>
              <option value="empathy">共情组</option>
              <option value="consequence">后果组</option>
              <option value="normative">规范组</option>
              <option value="alternative">替代表达组</option>
              <option value="control">对照组</option>
            </select>
          </label>

          <label class="text-sm">
            <span class="field-label">情境筛选</span>
            <select v-model="filters.scenarioId" class="field-select">
              <option value="">全部</option>
              <option v-for="item in store.scenarios" :key="item.id" :value="item.id">{{ item.title }}</option>
            </select>
          </label>

          <label class="text-sm">
            <span class="field-label">显示行数</span>
            <select v-model.number="filters.limit" class="field-select">
              <option :value="30">30</option>
              <option :value="60">60</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
          </label>
        </div>

        <div class="mt-5 flex flex-wrap gap-3">
          <button class="primary-button" @click="loadDashboard">应用筛选</button>
          <button class="secondary-button" @click="resetFilters">重置</button>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div class="panel-soft p-4">
            <p class="text-sm font-semibold text-slate-900">平均友好度</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ formatScore(insights.avg_friendliness) }}</p>
          </div>
          <div class="panel-soft p-4">
            <p class="text-sm font-semibold text-slate-900">继续使用意愿</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ formatScore(insights.avg_real_world_adoption) }}</p>
          </div>
          <div class="panel-soft p-4">
            <p class="text-sm font-semibold text-slate-900">平均决策时长</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ formatLatency(insights.avg_decision_latency_ms) }}</p>
          </div>
        </div>
      </section>
    </div>

    <section class="mt-6 grid gap-6 lg:grid-cols-3">
      <div class="panel p-5">
        <p class="section-label">行为分布</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-900">最终动作</h2>
        <div class="mt-4 grid gap-3">
          <DistributionBar
            v-for="item in actionDistribution"
            :key="item.label"
            :label="item.label"
            :value="item.value"
            :percent="item.percent"
          />
        </div>
      </div>

      <div class="panel p-5">
        <p class="section-label">组别分布</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-900">实验分组抽样</h2>
        <div class="mt-4 grid gap-3">
          <DistributionBar
            v-for="item in groupDistribution"
            :key="item.label"
            :label="item.label"
            :value="item.value"
            :percent="item.percent"
          />
        </div>
      </div>

      <div class="panel p-5">
        <p class="section-label">情境分布</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-900">议题覆盖</h2>
        <div class="mt-4 grid gap-3">
          <DistributionBar
            v-for="item in scenarioDistribution"
            :key="item.label"
            :label="item.label"
            :value="item.value"
            :percent="item.percent"
          />
        </div>
      </div>
    </section>

    <section class="mt-6 panel p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="section-label">原始记录</p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-900">最近实验样本</h2>
        </div>
        <span class="chip chip-gold">包含提示、动作与反馈</span>
      </div>

      <div class="table-shell overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>实验 ID</th>
              <th>情境 / 组别</th>
              <th>风险特征</th>
              <th>原始评论</th>
              <th>最终动作</th>
              <th>反馈均值</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in records" :key="row.experiment_id">
              <td class="text-xs text-slate-500">{{ row.experiment_id }}</td>
              <td>
                <p class="font-semibold text-slate-900">{{ formatScenario(row.scenario_id) }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ formatGroup(row.group) }} / {{ formatPromptType(row.prompt_type) }}</p>
              </td>
              <td>
                <div class="flex max-w-[220px] flex-wrap gap-2">
                  <span v-for="feature in row.risk_features || []" :key="feature" class="chip chip-coral">{{ feature }}</span>
                  <span v-if="!(row.risk_features || []).length" class="text-sm text-slate-400">-</span>
                </div>
              </td>
              <td class="max-w-sm">
                <p class="text-sm leading-6 text-slate-700">{{ formatComment(row.original_comment) }}</p>
              </td>
              <td>
                <p class="font-semibold text-slate-900">{{ formatAction(row.final_action) }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ formatFinalComment(row) }}</p>
              </td>
              <td>
                <p class="text-sm text-slate-600">帮助 {{ formatScore(row.prompt_feedback?.helpfulness) }}</p>
                <p class="text-sm text-slate-600">贴合 {{ formatScore(row.prompt_feedback?.relevance) }}</p>
                <p class="text-sm text-slate-600">反思 {{ formatScore(row.post_survey?.reflection_gain) }}</p>
              </td>
              <td class="text-sm text-slate-500">{{ formatDate(row.updated_at || row.created_at) }}</td>
            </tr>
            <tr v-if="records.length === 0">
              <td colspan="7" class="text-center text-slate-500">暂无记录。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import DistributionBar from "../components/DistributionBar.vue";
import StatsCard from "../components/StatsCard.vue";
import { ADMIN_TOKEN_STORAGE_KEY, useExperimentStore } from "../store/experiment";

const router = useRouter();
const store = useExperimentStore();

const ratioFields = [
  { key: "empathy", label: "共情组" },
  { key: "consequence", label: "后果组" },
  { key: "normative", label: "规范组" },
  { key: "alternative", label: "替代表达组" },
  { key: "control", label: "对照组" }
];

const filters = reactive({ group: "", scenarioId: "", limit: 100 });
const allocationDraft = reactive({ empathy: 1, consequence: 1, normative: 1, alternative: 1, control: 1 });
const allocationError = ref("");

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

const ratioPreview = computed(() => {
  const ratio = allocation.value.normalized_ratio || {};
  return ratioFields
    .map((item) => `${item.label} ${Math.round((Number(ratio[item.key]) || 0) * 100)}%`)
    .join(" / ");
});

function buildDistributionItems(map, formatter) {
  const entries = Object.entries(map || {});
  const max = Math.max(...entries.map(([, value]) => Number(value || 0)), 1);
  return entries.map(([key, value]) => ({
    label: formatter(key),
    value,
    percent: Math.max(8, Math.round((Number(value || 0) / max) * 100))
  }));
}

const actionDistribution = computed(() => buildDistributionItems(distributions.value.actions, formatAction));
const groupDistribution = computed(() => buildDistributionItems(distributions.value.groups, formatGroup));
const scenarioDistribution = computed(() => buildDistributionItems(distributions.value.scenarios, formatScenario));

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
    allocationError.value = "比例总和不能为 0，请至少设置一个大于 0 的值。";
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

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

function formatGroup(value) {
  const labels = {
    empathy: "共情组",
    consequence: "后果组",
    normative: "规范组",
    alternative: "替代表达组",
    control: "对照组"
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
    cancel: "取消发布"
  };
  return labels[value] || value || "-";
}

function formatScenario(value) {
  const map = Object.fromEntries(store.scenarios.map((item) => [item.id, item.title]));
  return map[value] || value || "-";
}

function formatComment(value) {
  return value || "-";
}

function formatFinalComment(row) {
  if (row.final_action === "cancel") {
    return "已取消发布";
  }
  return row.final_submitted_comment || "-";
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

onMounted(() => {
  loadDashboard();
});
</script>
