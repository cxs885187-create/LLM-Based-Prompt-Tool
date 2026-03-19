<template>
  <main class="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
    <div class="mb-4 flex items-center justify-between">
      <button class="text-sm font-semibold text-slate-600 hover:text-slate-900" @click="router.push('/intro')">
        <span aria-hidden="true">&larr;</span>
        返回
      </button>
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">步骤 2 / 3</p>
    </div>

    <section class="panel mb-4 px-4 py-3">
      <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <p>实验 ID：<span class="font-semibold text-slate-800">{{ store.experimentId }}</span></p>
        <span class="text-slate-300">|</span>
        <p>组别：<span class="font-semibold text-slate-800">{{ groupLabel }}</span></p>
        <span class="text-slate-300">|</span>
        <p>提示类型：<span class="font-semibold text-slate-800">{{ store.promptTypeLabel }}</span></p>
      </div>
    </section>

    <ScenarioCard v-if="store.currentScenario" :scenario="store.currentScenario" />

    <div class="mt-4">
      <CommentBox :loading="store.loading.check || store.loading.action" @submit="handleCommentSubmit" />
      <p v-if="errorMessage" aria-live="polite" class="mt-3 text-sm font-semibold text-rose-600">{{ errorMessage }}</p>
    </div>

    <PromptModal
      :open="showPromptModal"
      :loading="store.loading.action"
      :prompt-text="store.promptText"
      :prompt-type="store.promptType"
      :prompt-source="store.promptSource"
      :seed-comment="suggestedComment"
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
    control: "控制组"
  };
  return labels[store.group] || "待分配";
});

function buildSuggestedComment(rawComment) {
  const normalized = (rawComment || "").trim();
  if (!normalized) {
    return "我有不同看法，我们可以更理性地讨论这件事。";
  }
  return `我有不同看法：${normalized}。希望我们能更尊重地交流。`;
}

function normalizeStateError(message) {
  if (
    message.includes("Invalid experiment state") ||
    message.includes("实验状态无效")
  ) {
    return "当前实验已经完成内容检测。同一个实验不能重复点击检测，请在弹窗里做选择，或返回说明页重新开始一次实验。";
  }
  return message;
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
    errorMessage.value = normalizeStateError(error.message);
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
