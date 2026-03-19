<template>
  <section class="panel overflow-hidden p-0">
    <div class="border-b border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
      撰写回复
    </div>

    <div class="px-5 py-4">
      <div class="flex gap-3">
        <div class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          你
        </div>

        <div class="min-w-0 flex-1">
          <textarea
            v-model="comment"
            class="h-28 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] leading-7 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            maxlength="220"
            placeholder="发表你的回复..."
          />

          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-slate-500">{{ comment.length }}/220 · 内容仅用于实验研究，不会真实发布</p>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                :disabled="loading"
                @click="comment = ''"
              >
                重写
              </button>
              <button
                type="button"
                class="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!comment.trim() || loading"
                @click="onSubmit"
              >
                {{ loading ? "检测中..." : "回复" }}
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

const props = defineProps({
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
