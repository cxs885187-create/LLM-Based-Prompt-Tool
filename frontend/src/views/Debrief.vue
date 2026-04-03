<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
    <section class="panel p-6 md:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span class="eyebrow-pill">步骤 3 / 3</span>
          <h1 class="display-title mt-5 text-4xl font-semibold text-slate-900 md:text-5xl">评论流程已经完成，接下来补上研究反馈。</h1>
          <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            申报书中明确提到会收集提示帮助感、贴合度、友好度以及后测问卷。下面这组量表会直接进入研究分析。
          </p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-white/80 px-5 py-4">
          <p class="section-label">最终行为</p>
          <p class="mt-3 text-2xl font-semibold text-slate-900">{{ actionLabel }}</p>
        </div>
      </div>

      <div class="mt-8 grid gap-4 md:grid-cols-4">
        <article class="metric-card">
          <p class="section-label">实验情境</p>
          <p class="mt-3 text-lg font-semibold text-slate-900">{{ store.currentScenario?.title || store.scenarioId }}</p>
        </article>
        <article class="metric-card">
          <p class="section-label">提示组别</p>
          <p class="mt-3 text-lg font-semibold text-slate-900">{{ groupLabel }}</p>
        </article>
        <article class="metric-card">
          <p class="section-label">是否触发提示</p>
          <p class="mt-3 text-lg font-semibold text-slate-900">{{ store.isUncivil ? '是' : '否' }}</p>
        </article>
        <article class="metric-card">
          <p class="section-label">决策时长</p>
          <p class="mt-3 text-lg font-semibold text-slate-900">{{ latencyLabel }}</p>
        </article>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section class="panel-soft p-5">
          <p class="section-label">表达对比</p>
          <div class="mt-4 grid gap-4">
            <div class="rounded-[22px] bg-white/80 p-4">
              <p class="text-sm font-semibold text-slate-900">原始评论</p>
              <p class="mt-2 text-sm leading-7 text-slate-600">{{ store.originalComment || "无" }}</p>
            </div>
            <div class="rounded-[22px] bg-white/80 p-4">
              <p class="text-sm font-semibold text-slate-900">最终提交</p>
              <p class="mt-2 text-sm leading-7 text-slate-600">{{ store.finalSubmittedComment || "已取消发布" }}</p>
            </div>
            <div v-if="store.promptText" class="rounded-[22px] bg-white/80 p-4">
              <p class="text-sm font-semibold text-slate-900">系统建议文本</p>
              <p class="mt-2 text-sm leading-7 text-slate-600">{{ store.promptText }}</p>
            </div>
          </div>
        </section>

        <section class="grid gap-4">
          <ScaleField
            v-if="store.isUncivil"
            v-model="promptFeedback.helpfulness"
            label="这条提示对你修改表达有多大帮助？"
            hint="1 表示几乎没帮助，5 表示非常有帮助。"
          />
          <ScaleField
            v-if="store.isUncivil"
            v-model="promptFeedback.friendliness"
            label="你觉得提示的语气有多友好？"
            hint="用于评估提示是否显得说教、生硬，还是更像一种温和引导。"
          />
          <ScaleField
            v-if="store.isUncivil"
            v-model="promptFeedback.relevance"
            label="提示内容与你这条评论的贴合度如何？"
            hint="这对应申报书中的“贴合度 / 接受度”评价。"
          />
          <ScaleField
            v-model="postSurvey.reflectionGain"
            label="这次流程是否让你更愿意在发布前复核表达？"
            hint="用于衡量干预是否促发了反思。"
          />
          <ScaleField
            v-model="postSurvey.realWorldAdoption"
            label="如果真实平台提供类似功能，你愿意继续使用吗？"
            hint="用于评估原型的接受度与应用潜力。"
          />

          <label class="text-sm">
            <span class="field-label">补充反馈（可选）</span>
            <textarea
              v-model="postSurvey.openFeedback"
              maxlength="300"
              class="field-textarea h-32"
              placeholder="可以写下你觉得最有用或最不自然的地方。"
            />
            <p class="mt-2 text-xs text-slate-500">{{ postSurvey.openFeedback.length }}/300</p>
          </label>
        </section>
      </div>

      <p v-if="errorMessage" aria-live="polite" class="mt-4 text-sm font-semibold text-rose-600">{{ errorMessage }}</p>

      <div class="mt-8 flex flex-wrap gap-3">
        <button
          class="primary-button disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="store.loading.feedback || store.feedbackSubmitted"
          @click="submitFeedback"
        >
          {{ store.feedbackSubmitted ? "反馈已提交" : store.loading.feedback ? "提交中..." : "提交反馈并完成" }}
        </button>
        <button class="secondary-button" :disabled="!store.feedbackSubmitted" @click="startAnother">
          再做一次实验
        </button>
        <button class="secondary-button" :disabled="!store.feedbackSubmitted" @click="router.push('/dashboard')">
          查看仪表盘
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";

import ScaleField from "../components/ScaleField.vue";
import { useExperimentStore } from "../store/experiment";

const router = useRouter();
const store = useExperimentStore();
const errorMessage = computed(() => store.lastError);

const promptFeedback = reactive({ ...store.promptFeedback });
const postSurvey = reactive({ ...store.postSurvey });

watch(
  promptFeedback,
  (value) => {
    store.setPromptFeedback(value);
  },
  { deep: true }
);

watch(
  postSurvey,
  (value) => {
    store.setPostSurvey(value);
  },
  { deep: true }
);

const actionLabel = computed(() => {
  const labels = {
    post: "直接发布原评论",
    modify: "发布修改后评论",
    cancel: "取消发布"
  };
  return labels[store.finalAction] || "暂无";
});

const groupLabel = computed(() => {
  const labels = {
    empathy: "共情组",
    consequence: "后果组",
    normative: "规范组",
    alternative: "替代表达组",
    control: "控制组"
  };
  return labels[store.group] || "暂无";
});

const latencyLabel = computed(() => {
  if (!store.decisionLatencyMs) {
    return "未记录";
  }
  if (store.decisionLatencyMs < 1000) {
    return `${store.decisionLatencyMs} ms`;
  }
  return `${(store.decisionLatencyMs / 1000).toFixed(1)} s`;
});

async function submitFeedback() {
  try {
    await store.saveExperimentFeedback();
  } catch {
    // The store already exposes the user-facing error text.
  }
}

function startAnother() {
  store.resetExperimentFlow();
  router.push("/intro");
}
</script>
