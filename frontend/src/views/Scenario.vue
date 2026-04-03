<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8">
    <div class="mb-5 flex items-center justify-between gap-4">
      <button class="ghost-button" @click="router.push('/intro')">
        <span aria-hidden="true">&larr;</span>
        返回说明页
      </button>
      <div class="flex items-center gap-3">
        <span class="step-badge active">2</span>
        <span class="text-sm font-semibold text-slate-500">步骤 2 / 3</span>
      </div>
    </div>

    <div v-if="store.runtimeMode === 'offline' && store.runtimeNotice" class="status-banner mb-5">
      <strong>当前为演示模式</strong>
      <span>{{ store.runtimeNotice }}</span>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.08fr_0.56fr]">
      <section class="grid gap-4">
        <div class="panel flex flex-wrap items-center justify-between gap-4 p-4">
          <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span class="chip chip-navy">实验 ID {{ store.experimentId }}</span>
            <span class="chip chip-teal">分组 {{ groupLabel }}</span>
            <span class="chip chip-gold">提示类型 {{ store.promptTypeLabel }}</span>
          </div>
          <p class="text-sm text-slate-500">先按你的直觉评论，系统只会在必要时介入。</p>
        </div>

        <ScenarioCard v-if="store.currentScenario" :scenario="store.currentScenario" />

        <div class="mt-1">
          <CommentBox :loading="store.loading.check || store.loading.action" @submit="handleCommentSubmit" />
          <p v-if="errorMessage" aria-live="polite" class="mt-3 text-sm font-semibold text-rose-600">{{ errorMessage }}</p>
        </div>
      </section>

      <aside class="grid gap-4 self-start lg:sticky lg:top-6">
        <section class="panel p-5">
          <p class="section-label">研究侧栏</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-900">
            这不是在限制表达，而是在提供一个“重新组织语气”的台阶。
          </h2>
          <p class="mt-3 text-sm leading-7 text-slate-600">
            根据申报书，当前原型重点记录评论修改行为、提示接受度、决策时长与反思收益。你始终保有最终决定权。
          </p>
        </section>

        <section class="panel-soft p-5">
          <p class="section-label">当前状态</p>
          <div class="mt-4 grid gap-3">
            <div class="flex items-center justify-between gap-3 rounded-[20px] bg-white/70 px-4 py-3">
              <span class="text-sm text-slate-500">是否触发干预</span>
              <span class="font-semibold text-slate-900">{{ store.isUncivil ? "已触发" : "暂未触发" }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 rounded-[20px] bg-white/70 px-4 py-3">
              <span class="text-sm text-slate-500">风险特征数</span>
              <span class="font-semibold text-slate-900">{{ store.riskFeatures.length ? `${store.riskFeatures.length} 项` : "待检测" }}</span>
            </div>
            <div class="rounded-[20px] bg-white/70 px-4 py-3">
              <p class="text-sm text-slate-500">识别到的表达特征</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span v-for="feature in store.riskFeatures" :key="feature" class="chip chip-coral">{{ feature }}</span>
                <span v-if="store.riskFeatures.length === 0" class="text-sm text-slate-400">提交评论后显示</span>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <PromptModal
      :open="showPromptModal"
      :loading="store.loading.action"
      :prompt-text="store.promptText"
      :prompt-type="store.promptType"
      :prompt-source="store.promptSource"
      :seed-comment="suggestedComment"
      :original-comment="store.originalComment"
      :risk-features="store.riskFeatures"
      @decision="handleDecision"
      @close="handleModalClose"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import CommentBox from "../components/CommentBox.vue";
import PromptModal from "../components/PromptModal.vue";
import ScenarioCard from "../components/ScenarioCard.vue";
import { useExperimentStore } from "../store/experiment";

const router = useRouter();
const store = useExperimentStore();

const showPromptModal = ref(false);
const suggestionSeed = ref("");
const errorMessage = ref("");

const suggestedComment = computed(() => suggestionSeed.value);
const groupLabel = computed(() => {
  const labels = {
    empathy: "共情组",
    consequence: "后果组",
    normative: "规范组",
    alternative: "替代表达组",
    control: "对照组"
  };
  return labels[store.group] || "待分配";
});

function buildSuggestedComment(rawComment) {
  const normalized = (rawComment || "").trim();
  if (!normalized) {
    return "我有不同看法，但希望我们能基于事实继续讨论这件事。";
  }
  return `我对这件事有些不同意见。${normalized}。如果继续讨论，我更希望把重点放在事实和解决办法上。`;
}

async function handleCommentSubmit(commentText) {
  errorMessage.value = "";

  try {
    const result = await store.checkComment(commentText);
    if (!result.is_uncivil) {
      await store.submitDecision({ choice: "post_anyway" });
      router.push("/debrief");
      return;
    }

    suggestionSeed.value = result.prompt_text || buildSuggestedComment(commentText);
    showPromptModal.value = true;
  } catch (error) {
    errorMessage.value = error.message;
    if (store.isUncivil && store.promptText) {
      suggestionSeed.value = store.promptText;
      showPromptModal.value = true;
    }
  }
}

async function handleDecision({ choice, modifiedComment }) {
  errorMessage.value = "";

  try {
    await store.submitDecision({ choice, modifiedComment });
    showPromptModal.value = false;
    router.push("/debrief");
  } catch (error) {
    errorMessage.value = error.message;
  }
}

function handleModalClose() {
  showPromptModal.value = false;
}

onMounted(() => {
  if (store.isUncivil && store.promptText && !store.finalAction) {
    suggestionSeed.value = store.promptText;
    showPromptModal.value = true;
  }
});
</script>
