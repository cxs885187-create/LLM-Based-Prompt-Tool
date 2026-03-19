<template>
  <article class="panel overflow-hidden p-0">
    <div class="border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-sm font-semibold text-slate-600">
      情境帖子
    </div>

    <div class="px-5 py-4">
      <div class="flex gap-3">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">
          {{ avatarInitial }}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="font-semibold text-slate-900">{{ scenario.authorName || "匿名用户" }}</span>
            <span class="text-slate-500">{{ scenario.authorHandle || "@anonymous" }}</span>
            <span class="text-slate-400">·</span>
            <span class="text-slate-500">{{ scenario.postTime || "刚刚" }}</span>
          </div>

          <p class="mt-2 whitespace-pre-line text-[15px] leading-7 text-slate-800">
            {{ scenario.postText || scenario.context }}
          </p>

          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span class="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">{{ scenario.topic }}</span>
            <span class="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">风险：{{ scenario.riskLevel }}</span>
          </div>

          <div class="mt-4 grid grid-cols-4 gap-2 border-y border-slate-100 py-3 text-xs text-slate-500">
            <p class="text-center">回复 {{ scenario.stats?.replies ?? 0 }}</p>
            <p class="text-center">转发 {{ scenario.stats?.reposts ?? 0 }}</p>
            <p class="text-center">喜欢 {{ scenario.stats?.likes ?? 0 }}</p>
            <p class="text-center">浏览 {{ scenario.stats?.views ?? 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-slate-200">
      <div
        v-for="reply in scenario.seedReplies || []"
        :key="reply.id"
        class="border-b border-slate-100 px-5 py-3 last:border-b-0"
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
