<template>
  <main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8">
    <section class="panel p-8 md:p-10">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">步骤 3 / 3</p>
      <h1 class="mt-3 font-display text-4xl font-bold text-slate-900">感谢参与</h1>
      <p class="mt-4 text-slate-600">
        你的决策已记录。该实验用于研究干预提示是否能促进更理性的线上表达与交流。
      </p>

      <div class="mt-7 grid gap-4 md:grid-cols-2">
        <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">实验情境</p>
          <p class="mt-2 font-semibold text-slate-900">{{ store.currentScenario?.title || store.scenarioId }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">最终行为</p>
          <p class="mt-2 font-semibold text-slate-900">{{ actionLabel }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">提示组别</p>
          <p class="mt-2 font-semibold text-slate-900">{{ groupLabel }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">是否触发提示</p>
          <p class="mt-2 font-semibold text-slate-900">{{ store.isUncivil ? '是' : '否' }}</p>
        </article>
      </div>

      <div class="mt-8 flex flex-wrap gap-3">
        <button
          class="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-700"
          @click="startAnother"
        >
          再做一次实验
        </button>
        <button
          class="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
          @click="router.push('/dashboard')"
        >
          查看仪表盘
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

import { useExperimentStore } from "../store/experiment";

const router = useRouter();
const store = useExperimentStore();

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

function startAnother() {
  store.resetExperimentFlow();
  router.push("/intro");
}
</script>
