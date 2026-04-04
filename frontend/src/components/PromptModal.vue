<template>
  <div v-if="open" class="prompt-backdrop">
    <div class="prompt-shell">
      <section
        ref="dialogRef"
        class="prompt-panel assistant-glow"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <button type="button" class="prompt-close" :disabled="loading" @click="emitClose">关闭</button>

        <header class="prompt-header">
          <div class="prompt-header-copy">
            <p class="prompt-kicker">AIGC Prompt Intervention</p>
            <h3 :id="titleId">在评论真正发出前，再给表达一次变得更克制的机会。</h3>
            <p class="prompt-meta">当前策略：{{ promptTypeLabel }} / 生成来源：{{ promptSourceLabel }}</p>
          </div>

          <div class="prompt-meta-card">
            <span>Risk signals</span>
            <strong>{{ riskFeatures.length ? `${riskFeatures.length} 项` : "未命中标签" }}</strong>
            <p>系统会结合风险特征和提示策略，给出更适合当前语境的表达建议。</p>
          </div>
        </header>

        <div class="prompt-tag-row">
          <span v-for="tag in riskFeatures" :key="tag" class="chip chip-coral">{{ tag }}</span>
          <span class="chip chip-teal">{{ promptTypeLabel }}</span>
        </div>

        <section class="prompt-system-note">
          <p>System suggestion</p>
          <strong>{{ promptText }}</strong>
        </section>

        <div class="prompt-switches">
          <button
            type="button"
            class="prompt-switch"
            :class="{ active: showCompare }"
            @click="showCompare = true"
          >
            对比查看
          </button>
          <button
            type="button"
            class="prompt-switch"
            :class="{ active: !showCompare }"
            @click="showCompare = false"
          >
            直接编辑
          </button>
        </div>

        <div v-if="showCompare" class="prompt-compare">
          <article class="prompt-compare-card">
            <p>原始表达</p>
            <strong>{{ originalComment || "暂无原始评论" }}</strong>
          </article>
          <article class="prompt-compare-card prompt-compare-accent">
            <div class="prompt-compare-head">
              <p>建议表达</p>
              <button type="button" class="prompt-inline-button" @click="useSuggestion">一键填入</button>
            </div>
            <strong>{{ adoptComment || "点击“一键填入”可快速使用建议表达。" }}</strong>
          </article>
        </div>

        <div class="prompt-action-grid">
          <article class="prompt-action-card prompt-action-green">
            <div class="prompt-action-head">
              <h4>选项 1：采纳建议</h4>
              <button type="button" class="prompt-inline-button" @click="useSuggestion">填入建议</button>
            </div>
            <textarea v-model="adoptComment" maxlength="500" class="field-textarea prompt-textarea" />
            <p class="prompt-counter">{{ adoptComment.length }}/500</p>
            <button
              class="prompt-submit prompt-submit-green"
              :disabled="loading || !adoptComment.trim()"
              @click="emitDecision('adopt_suggestion', adoptComment)"
            >
              采纳并继续
            </button>
          </article>

          <article class="prompt-action-card prompt-action-blue">
            <div class="prompt-action-head">
              <h4>选项 2：自行修改</h4>
            </div>
            <textarea
              v-model="customComment"
              maxlength="500"
              class="field-textarea prompt-textarea"
              placeholder="保留你的观点，但换成你自己的表达方式。"
            />
            <p class="prompt-counter">{{ customComment.length }}/500</p>
            <button
              class="prompt-submit prompt-submit-blue"
              :disabled="loading || !customComment.trim()"
              @click="emitDecision('self_rewrite', customComment)"
            >
              提交修改稿
            </button>
          </article>
        </div>

        <div class="prompt-footer-actions">
          <button
            class="prompt-secondary danger"
            :disabled="loading"
            @click="emitDecision('post_anyway')"
          >
            保持原样发布
          </button>
          <button
            class="prompt-secondary"
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
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  promptText: { type: String, default: "" },
  promptType: { type: String, default: "" },
  promptSource: { type: String, default: "" },
  seedComment: { type: String, default: "" },
  originalComment: { type: String, default: "" },
  riskFeatures: { type: Array, default: () => [] }
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
    control: "对照提示"
  };
  return labels[props.promptType] || "对照提示";
});

const promptSourceLabel = computed(() => {
  const labels = {
    llm: "大模型生成",
    fallback: "降级改写",
    mock: "Mock 模式",
    offline_heuristic: "本地演示模式"
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

<style scoped>
.prompt-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(15, 23, 42, 0.46);
  backdrop-filter: blur(10px);
}

.prompt-shell {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
}

.prompt-panel {
  width: min(100%, 1100px);
  max-height: calc(100vh - 2.5rem);
  overflow: auto;
  border-radius: 2rem;
  padding: 1.5rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 244, 237, 0.96));
}

.prompt-close,
.prompt-switch,
.prompt-inline-button,
.prompt-submit,
.prompt-secondary {
  cursor: pointer;
  transition:
    transform 180ms ease,
    background 180ms ease,
    border-color 180ms ease,
    color 180ms ease;
}

.prompt-close:hover,
.prompt-switch:hover,
.prompt-inline-button:hover,
.prompt-submit:hover,
.prompt-secondary:hover {
  transform: translateY(-1px);
}

.prompt-close {
  margin-left: auto;
  display: inline-flex;
  min-height: 2.6rem;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: #334155;
  font-weight: 700;
}

.prompt-header {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(16rem, 0.7fr);
  gap: 1rem;
  margin-top: 0.75rem;
}

.prompt-kicker,
.prompt-system-note p,
.prompt-compare-card p {
  margin: 0;
  color: #cf6c57;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.prompt-header h3 {
  margin: 0.9rem 0 0;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1.03;
  letter-spacing: -0.05em;
  color: #0f172a;
}

.prompt-meta {
  margin: 1rem 0 0;
  color: #64748b;
  line-height: 1.8;
}

.prompt-meta-card,
.prompt-system-note,
.prompt-compare-card,
.prompt-action-card {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 1.6rem;
  background: rgba(255, 255, 255, 0.74);
}

.prompt-meta-card {
  padding: 1.2rem;
}

.prompt-meta-card span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.prompt-meta-card strong {
  display: block;
  margin-top: 0.8rem;
  font-size: 1.6rem;
  color: #0f172a;
}

.prompt-meta-card p {
  margin: 0.75rem 0 0;
  color: #64748b;
  line-height: 1.7;
}

.prompt-tag-row,
.prompt-footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.prompt-tag-row {
  margin-top: 1.1rem;
}

.prompt-system-note {
  margin-top: 1rem;
  padding: 1.2rem;
}

.prompt-system-note strong,
.prompt-compare-card strong {
  display: block;
  margin-top: 0.75rem;
  color: #1e293b;
  line-height: 1.9;
  font-weight: 600;
}

.prompt-switches,
.prompt-compare,
.prompt-action-grid {
  display: grid;
  gap: 0.9rem;
}

.prompt-switches {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1rem;
}

.prompt-switch {
  min-height: 3rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.88);
  color: #64748b;
  font-weight: 700;
}

.prompt-switch.active {
  background: #0f172a;
  color: #fff;
}

.prompt-compare,
.prompt-action-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1rem;
}

.prompt-compare-card,
.prompt-action-card {
  padding: 1.15rem;
}

.prompt-compare-accent {
  background: rgba(236, 253, 245, 0.8);
  border-color: rgba(16, 185, 129, 0.16);
}

.prompt-compare-head,
.prompt-action-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.prompt-inline-button {
  border: 0;
  background: transparent;
  color: #0f766e;
  font-weight: 700;
}

.prompt-textarea {
  min-height: 8.5rem;
  margin-top: 0.9rem;
}

.prompt-counter {
  margin: 0.55rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
}

.prompt-submit,
.prompt-secondary {
  min-height: 3rem;
  width: 100%;
  border-radius: 999px;
  font-weight: 700;
}

.prompt-submit {
  margin-top: 0.9rem;
  border: 0;
  color: #fff;
}

.prompt-submit-green {
  background: #047857;
}

.prompt-submit-blue {
  background: #0369a1;
}

.prompt-secondary {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(241, 245, 249, 0.9);
  color: #334155;
}

.prompt-secondary.danger {
  background: rgba(255, 241, 242, 0.9);
  color: #be123c;
  border-color: rgba(244, 63, 94, 0.14);
}

.prompt-footer-actions {
  margin-top: 1rem;
}

.prompt-footer-actions > * {
  flex: 1 1 14rem;
}

@media (max-width: 920px) {
  .prompt-header,
  .prompt-compare,
  .prompt-action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
