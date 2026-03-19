<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
    <div class="mb-5 flex items-center justify-between">
      <button class="text-sm font-semibold text-slate-600 hover:text-slate-900" @click="router.push('/')">
        <span aria-hidden="true">&larr;</span>
        返回首页
      </button>
      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          @click="changeAdminToken"
        >
          更换令牌
        </button>
        <button
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          :disabled="store.loading.dashboard"
          @click="loadDashboard"
        >
          {{ store.loading.dashboard ? "刷新中..." : "刷新" }}
        </button>
      </div>
    </div>

    <header class="mb-6">
      <h1 class="font-display text-3xl font-bold text-slate-900">开发者仪表盘</h1>
      <p class="mt-2 text-slate-600">查看实验数据、配置提示类型分配比例并追踪用户输入与最终提交文本。</p>
      <p v-if="store.lastError" aria-live="polite" class="mt-2 text-sm text-amber-700">{{ store.lastError }}</p>
    </header>

    <section class="mb-6 grid gap-4 md:grid-cols-3">
      <StatsCard label="总记录数" :value="summary.total_records" hint="所有已初始化实验" />
      <StatsCard label="已完成数" :value="summary.completed_records" hint="已走到最终行为提交" />
      <StatsCard label="触发提示数" :value="summary.uncivil_triggered_records" hint="出现过干预提示" />
    </section>

    <section class="panel mb-6 p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-slate-900">提示类型分配比例</h2>
        <p class="text-sm text-slate-500">当前总权重：{{ currentTotalWeight }}</p>
      </div>

      <div class="grid gap-3 md:grid-cols-5">
        <label v-for="item in ratioFields" :key="item.key" class="text-sm">
          <span class="mb-1 block font-semibold text-slate-600">{{ item.label }}</span>
          <input
            v-model.number="allocationDraft[item.key]"
            type="number"
            min="0"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
        </label>
      </div>

      <p class="mt-3 text-xs text-slate-500">
        示例：设为 1:1:1:1:1 时，系统会按加权均摊随机分配五种提示类型。
      </p>
      <p v-if="allocationError" aria-live="polite" class="mt-2 text-sm font-semibold text-rose-600">{{ allocationError }}</p>

      <div class="mt-4 flex flex-wrap gap-3">
        <button
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          :disabled="store.loading.allocation"
          @click="setEqualAllocation"
        >
          一键设为 1:1:1:1:1
        </button>
        <button
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          :disabled="store.loading.allocation"
          @click="saveAllocation"
        >
          {{ store.loading.allocation ? "保存中..." : "保存比例配置" }}
        </button>
      </div>

      <p class="mt-3 text-xs text-slate-500">最新归一化比例：{{ ratioPreview }}</p>
    </section>

    <section class="panel mb-6 p-5">
      <div class="grid gap-3 md:grid-cols-3">
        <label class="text-sm">
          <span class="mb-1 block font-semibold text-slate-600">组别筛选</span>
          <select v-model="filters.group" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">全部</option>
            <option value="empathy">共情组</option>
            <option value="consequence">后果组</option>
            <option value="normative">规范组</option>
            <option value="alternative">替代表达组</option>
            <option value="control">控制组</option>
          </select>
        </label>

        <label class="text-sm">
          <span class="mb-1 block font-semibold text-slate-600">情境筛选</span>
          <select v-model="filters.scenarioId" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">全部</option>
            <option v-for="item in store.scenarios" :key="item.id" :value="item.id">{{ item.title }}</option>
          </select>
        </label>

        <label class="text-sm">
          <span class="mb-1 block font-semibold text-slate-600">显示行数</span>
          <select v-model.number="filters.limit" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option :value="30">30</option>
            <option :value="60">60</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
          </select>
        </label>
      </div>

      <button
        class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        @click="loadDashboard"
      >
        应用筛选
      </button>
    </section>

    <section class="panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">实验 ID</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">组别</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">情境</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">提示类型</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">模型润色提示（备份）</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">初始语句</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">最终提交语句</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">最终行为</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">状态</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-600">更新时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="row in records" :key="row.experiment_id">
              <td class="px-4 py-3 text-slate-700">{{ row.experiment_id }}</td>
              <td class="px-4 py-3 text-slate-700">{{ formatGroup(row.group) }}</td>
              <td class="px-4 py-3 text-slate-700">{{ formatScenario(row.scenario_id) }}</td>
              <td class="px-4 py-3 text-slate-700">{{ formatPromptType(row.prompt_type) }}</td>
              <td class="max-w-xs px-4 py-3 text-slate-700 whitespace-normal">{{ formatComment(row.generated_prompt) }}</td>
              <td class="max-w-xs px-4 py-3 text-slate-700 whitespace-normal">{{ formatComment(row.original_comment) }}</td>
              <td class="max-w-xs px-4 py-3 text-slate-700 whitespace-normal">{{ formatFinalComment(row) }}</td>
              <td class="px-4 py-3 text-slate-700">{{ formatAction(row.final_action) }}</td>
              <td class="px-4 py-3 text-slate-700">{{ formatStatus(row.status) }}</td>
              <td class="px-4 py-3 text-slate-700">{{ formatDate(row.updated_at || row.created_at) }}</td>
            </tr>
            <tr v-if="records.length === 0">
              <td colspan="10" class="px-4 py-6 text-center text-slate-500">暂无记录。</td>
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

import StatsCard from "../components/StatsCard.vue";
import { ADMIN_TOKEN_STORAGE_KEY, useExperimentStore } from "../store/experiment";

const router = useRouter();
const store = useExperimentStore();

const ratioFields = [
  { key: "empathy", label: "共情组" },
  { key: "consequence", label: "后果组" },
  { key: "normative", label: "规范组" },
  { key: "alternative", label: "替代表达组" },
  { key: "control", label: "控制组" }
];

const filters = reactive({
  group: "",
  scenarioId: "",
  limit: 100
});

const allocationDraft = reactive({
  empathy: 1,
  consequence: 1,
  normative: 1,
  alternative: 1,
  control: 1
});

const allocationError = ref("");

function ensureAdminToken() {
  let token = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
  if (!token.trim()) {
    token = (window.prompt("请输入管理令牌（Admin Token）：") || "").trim();
    if (!token) {
      store.lastError = "未提供管理令牌，无法访问仪表盘。";
      router.replace("/");
      return false;
    }
    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  }
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

const summary = computed(
  () =>
    store.dashboard.summary || {
      total_records: 0,
      completed_records: 0,
      uncivil_triggered_records: 0
    }
);

const records = computed(() => store.dashboard.records || []);
const allocation = computed(
  () =>
    store.dashboard.allocation || {
      weights: {
        empathy: 1,
        consequence: 1,
        normative: 1,
        alternative: 1,
        control: 1
      },
      normalized_ratio: {
        empathy: 0.2,
        consequence: 0.2,
        normative: 0.2,
        alternative: 0.2,
        control: 0.2
      },
      total_weight: 5
    }
);

const currentTotalWeight = computed(() => {
  return Object.values(allocationDraft).reduce((sum, value) => sum + Number(value || 0), 0);
});

const ratioPreview = computed(() => {
  const ratio = allocation.value.normalized_ratio || {};
  const parts = ratioFields.map((item) => {
    const percent = Math.round((Number(ratio[item.key]) || 0) * 100);
    return `${item.label}${percent}%`;
  });
  return parts.join(" / ");
});

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

function setEqualAllocation() {
  allocationError.value = "";
  for (const item of ratioFields) {
    allocationDraft[item.key] = 1;
  }
}

async function saveAllocation() {
  allocationError.value = "";

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
    control: "控制组"
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

function formatStatus(value) {
  const labels = {
    initialized: "已初始化",
    checked: "已检测",
    completed: "已完成"
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

async function loadDashboard() {
  if (!ensureAdminToken()) {
    return;
  }

  try {
    await store.fetchDashboard({
      group: filters.group,
      scenarioId: filters.scenarioId,
      limit: filters.limit
    });
    syncAllocationDraft();
  } catch (error) {
    allocationError.value = error.message;
  }
}

onMounted(() => {
  if (ensureAdminToken()) {
    loadDashboard();
  }
});
</script>
