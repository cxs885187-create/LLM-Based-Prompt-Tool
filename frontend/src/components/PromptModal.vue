<template>
  <div v-if="open" class="fixed inset-0 z-30 grid place-items-center bg-slate-900/50 p-4">
    <section
      ref="dialogRef"
      class="panel w-full max-w-3xl p-6 lg:p-8"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
    >
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 :id="titleId" class="font-display text-2xl font-bold text-slate-900">AIGC 干预提示</h3>
          <p class="mt-1 text-sm text-slate-500">提示类型：{{ promptTypeLabel }} · 改写来源：{{ promptSourceLabel }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">
            建议复核
          </span>
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            :disabled="loading"
            @click="emitClose"
          >
            关闭
          </button>
        </div>
      </header>

      <p class="mt-4 rounded-xl bg-slate-100 p-4 text-slate-700">
        {{ promptText }}
      </p>

      <div class="mt-6 grid gap-4 lg:grid-cols-2">
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h4 class="font-semibold text-emerald-800">选项 1：采纳建议</h4>
          <textarea
            v-model="adoptComment"
            maxlength="500"
            class="mt-3 h-24 w-full resize-none rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <p class="mt-1 text-xs text-emerald-800/80">{{ adoptComment.length }}/500</p>
          <button
            class="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            :disabled="loading || !adoptComment.trim()"
            @click="emitDecision('adopt_suggestion', adoptComment)"
          >
            采纳并继续
          </button>
        </div>

        <div class="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <h4 class="font-semibold text-cyan-800">选项 2：自行修改</h4>
          <textarea
            v-model="customComment"
            maxlength="500"
            class="mt-3 h-24 w-full resize-none rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-cyan-200"
            placeholder="请用你自己的表达重新撰写"
          />
          <p class="mt-1 text-xs text-cyan-800/80">{{ customComment.length }}/500</p>
          <button
            class="mt-3 w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
            :disabled="loading || !customComment.trim()"
            @click="emitDecision('self_rewrite', customComment)"
          >
            提交修改版
          </button>
        </div>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          class="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
          :disabled="loading"
          @click="emitDecision('post_anyway')"
        >
          选项 3：执意原发
        </button>
        <button
          class="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
          :disabled="loading"
          @click="emitDecision('cancel_publish')"
        >
          选项 4：取消发布
        </button>
      </div>
    </section>
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
  }
});

const emit = defineEmits(["decision", "close"]);

const dialogRef = ref(null);
const adoptComment = ref("");
const customComment = ref("");

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
    await nextTick();
    focusFirstElement();
    document.addEventListener("keydown", handleGlobalKeydown);
  }
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleGlobalKeydown);
});
</script>
