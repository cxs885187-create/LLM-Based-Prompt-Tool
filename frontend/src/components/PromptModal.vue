<template>
  <div v-if="open" class="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px]">
    <div class="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-end p-4 sm:p-6">
      <section
        ref="dialogRef"
        class="panel assistant-glow w-full max-w-2xl p-6 lg:p-7"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span class="eyebrow-pill">AIGC 干预提示</span>
            <h3 :id="titleId" class="mt-3 text-3xl font-semibold text-slate-900">先别急着发，我们帮你把表达再修一遍。</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              当前策略：{{ promptTypeLabel }} · 生成来源：{{ promptSourceLabel }}
            </p>
          </div>
          <button
            type="button"
            class="ghost-button rounded-full border border-slate-200"
            :disabled="loading"
            @click="emitClose"
          >
            关闭
          </button>
        </header>

        <div class="mt-5 flex flex-wrap gap-2">
          <span v-for="tag in riskFeatures" :key="tag" class="chip chip-coral">{{ tag }}</span>
          <span class="chip chip-teal">{{ promptTypeLabel }}</span>
        </div>

        <div class="mt-5 rounded-[24px] border border-slate-200 bg-white/80 p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">系统建议</p>
          <p class="mt-3 text-sm leading-7 text-slate-700">{{ promptText }}</p>
        </div>

        <div class="mt-5 flex items-center gap-2">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="showCompare ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="showCompare = true"
          >
            对比查看
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="!showCompare ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="showCompare = false"
          >
            直接编辑
          </button>
        </div>

        <div v-if="showCompare" class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="panel-soft p-4">
            <p class="section-label">原始表达</p>
            <p class="mt-3 text-sm leading-7 text-slate-700">{{ originalComment || "暂无原始评论" }}</p>
          </div>
          <div class="panel-soft border-emerald-200 bg-emerald-50/70 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="section-label text-emerald-700">建议表达</p>
              <button type="button" class="chip chip-teal" @click="useSuggestion">一键采用</button>
            </div>
            <p class="mt-3 text-sm leading-7 text-slate-700">{{ adoptComment }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="panel-soft border-emerald-200 bg-emerald-50/70 p-4">
            <div class="flex items-center justify-between gap-3">
              <h4 class="font-semibold text-emerald-800">选项 1：采纳建议</h4>
              <button type="button" class="text-xs font-semibold text-emerald-700" @click="useSuggestion">填入建议</button>
            </div>
            <textarea
              v-model="adoptComment"
              maxlength="500"
              class="field-textarea mt-3 h-28 border-emerald-200 bg-white"
            />
            <p class="mt-2 text-xs text-emerald-800/80">{{ adoptComment.length }}/500</p>
            <button
              class="mt-3 w-full rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
              :disabled="loading || !adoptComment.trim()"
              @click="emitDecision('adopt_suggestion', adoptComment)"
            >
              采纳并继续
            </button>
          </div>

          <div class="panel-soft border-sky-200 bg-sky-50/70 p-4">
            <h4 class="font-semibold text-sky-800">选项 2：自行修改</h4>
            <textarea
              v-model="customComment"
              maxlength="500"
              class="field-textarea mt-3 h-28 border-sky-200 bg-white"
              placeholder="保留你的观点，但换成你自己的表达。"
            />
            <p class="mt-2 text-xs text-sky-800/80">{{ customComment.length }}/500</p>
            <button
              class="mt-3 w-full rounded-full bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
              :disabled="loading || !customComment.trim()"
              @click="emitDecision('self_rewrite', customComment)"
            >
              提交修改版
            </button>
          </div>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            class="rounded-full border border-rose-300 bg-rose-50 px-4 py-3 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            :disabled="loading"
            @click="emitDecision('post_anyway')"
          >
            保持原样发布
          </button>
          <button
            class="rounded-full border border-slate-300 bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            :disabled="loading"
            @click="emitDecision('cancel_publish')"
          >
            取消发布
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const titleId = "prompt-dialog-title";

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  promptText: {
    type: String,
    default: ""
  },
  promptType: {
    type: String,
    default: ""
  },
  promptSource: {
    type: String,
    default: ""
  },
  seedComment: {
    type: String,
    default: ""
  },
  originalComment: {
    type: String,
    default: ""
  },
  riskFeatures: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["decision", "close"]);

const dialogRef = ref(null);
const adoptComment = ref("");
const customComment = ref("");
const showCompare = ref(true);

const promptTypeLabel = computed(() => {
  const labels = {
    empathy: "共情提示",
    consequence: "后果提示",
    normative: "规范提示",
    alternative: "替代表达提示",
    control: "控制组提示"
  };
  return labels[props.promptType] || "控制组提示";
});

const promptSourceLabel = computed(() => {
  const labels = {
    llm: "大模型生成",
    fallback: "降级改写",
    mock: "Mock 模式"
  };
  return labels[props.promptSource] || "未知";
});

function getFocusableElements() {
  if (!dialogRef.value) {
    return [];
  }

  return [...dialogRef.value.querySelectorAll(
    "button, textarea, input, select, [href], [tabindex]:not([tabindex='-1'])"
  )].filter((el) => !el.hasAttribute("disabled"));
}

function focusFirstElement() {
  const focusable = getFocusableElements();
  if (!focusable.length) {
    dialogRef.value?.focus();
    return;
  }
  focusable[0].focus();
}

function handleGlobalKeydown(event) {
  if (!props.open) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    emitClose();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusable = getFocusableElements();
  if (!focusable.length) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey) {
    if (active === first || !dialogRef.value?.contains(active)) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === last) {
    event.preventDefault();
    first.focus();
  }
}

function useSuggestion() {
  adoptComment.value = props.seedComment;
}

function emitDecision(choice, text = "") {
  emit("decision", { choice, modifiedComment: text.trim() });
}

function emitClose() {
  emit("close");
}

watch(
  () => props.open,
  async (value) => {
    if (!value) {
      document.removeEventListener("keydown", handleGlobalKeydown);
      return;
    }

    adoptComment.value = props.seedComment;
    customComment.value = "";
    showCompare.value = true;
    await nextTick();
    focusFirstElement();
    document.addEventListener("keydown", handleGlobalKeydown);
  }
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleGlobalKeydown);
});
</script>
