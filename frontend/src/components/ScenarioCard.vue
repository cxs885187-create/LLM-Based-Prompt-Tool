<template>
  <article class="panel overflow-hidden p-0">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white/70 px-5 py-4">
      <div>
        <p class="section-label">模拟评论区</p>
        <p class="mt-1 text-sm text-slate-500">阅读帖子与已有回复后，再写下你的评论。</p>
      </div>
      <span class="chip chip-coral">风险 {{ scenario.riskLevel }}</span>
    </div>

    <div class="px-5 py-5">
      <div class="flex gap-3">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white">
          {{ avatarInitial }}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="font-semibold text-slate-900">{{ scenario.authorName || "匿名用户" }}</span>
            <span class="text-slate-500">{{ scenario.authorHandle || "@anonymous" }}</span>
            <span class="text-slate-400">·</span>
            <span class="text-slate-500">{{ scenario.postTime || "刚刚" }}</span>
          </div>

          <p class="mt-3 whitespace-pre-line text-[15px] leading-8 text-slate-800">
            {{ scenario.postText || scenario.context }}
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span class="chip chip-teal">{{ scenario.topic }}</span>
            <span class="chip chip-gold">研究情境</span>
            <span class="chip chip-navy">仅模拟，不会真实发布</span>
          </div>

          <div class="mt-5 grid grid-cols-4 gap-2 border-y border-slate-100 py-3 text-xs text-slate-500">
            <p class="text-center">回复 {{ scenario.stats?.replies ?? 0 }}</p>
            <p class="text-center">转发 {{ scenario.stats?.reposts ?? 0 }}</p>
            <p class="text-center">喜欢 {{ scenario.stats?.likes ?? 0 }}</p>
            <p class="text-center">浏览 {{ scenario.stats?.views ?? 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-slate-200 bg-white/60">
      <div
        v-for="reply in scenario.seedReplies || []"
        :key="reply.id"
        class="border-b border-slate-100 px-5 py-4 last:border-b-0"
      >
        <div class="flex gap-3">
          <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {{ getInitial(reply.name) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="font-semibold text-slate-800">{{ reply.name }}</span>
              <span class="text-slate-500">{{ reply.handle }}</span>
              <span class="text-slate-400">·</span>
              <span class="text-slate-500">{{ reply.time }}</span>
            </div>
            <p class="mt-1 text-sm leading-6 text-slate-700">{{ reply.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  scenario: {
    type: Object,
    required: true
  }
});

const avatarInitial = computed(() => getInitial(props.scenario.authorName || "匿"));

function getInitial(name) {
  if (!name) {
    return "匿";
  }
  return String(name).trim().slice(0, 1).toUpperCase();
}
</script>
