<template>
  <section class="panel overflow-hidden p-0">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white/70 px-5 py-4">
      <div>
        <p class="section-label">撰写评论</p>
        <p class="mt-1 text-sm text-slate-500">系统会在必要时给出更温和、可发布的表达建议。</p>
      </div>
      <span class="chip chip-gold">220 字内</span>
    </div>

    <div class="px-5 py-5">
      <div class="flex gap-3">
        <div class="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          你
        </div>

        <div class="min-w-0 flex-1">
          <textarea
            v-model="comment"
            class="field-textarea h-36 text-[15px] leading-7"
            maxlength="220"
            placeholder="试着写下你此刻最想发出的回复。"
          />

          <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span class="chip chip-navy">{{ comment.length }}/220</span>
              <span>内容仅用于实验研究，不会真实发布。</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="secondary-button"
                :disabled="loading"
                @click="comment = ''"
              >
                清空重写
              </button>
              <button
                type="button"
                class="primary-button disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!comment.trim() || loading"
                @click="onSubmit"
              >
                {{ loading ? "检测中..." : "提交评论" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["submit"]);
const comment = ref("");

function onSubmit() {
  if (!comment.value.trim()) {
    return;
  }
  emit("submit", comment.value.trim());
}
</script>
