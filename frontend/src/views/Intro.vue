<template>
  <main class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
    <div class="mb-6 flex items-center justify-between">
      <button class="text-sm font-semibold text-slate-600 hover:text-slate-900" @click="router.push('/')">
        <span aria-hidden="true">&larr;</span>
        返回
      </button>
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">步骤 1 / 3</p>
    </div>

    <section class="panel p-6 md:p-8">
      <h1 class="font-display text-3xl font-bold text-slate-900">实验说明与知情同意</h1>
      <p class="mt-4 text-slate-600">
        你将阅读一个社交平台情境，撰写评论，并在必要时收到一条干预提示后做出最终发布决策。实验数据仅用于研究分析与系统优化。
      </p>

      <ul class="mt-5 space-y-2 text-sm text-slate-600">
        <li>- 参与完全自愿，可随时退出。</li>
        <li>- 在最终提交前你都可以选择取消发布。</li>
        <li>- 当前为模拟环境，不会连接真实社交账号。</li>
      </ul>

      <label class="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <input v-model="consentChecked" type="checkbox" class="h-4 w-4 rounded border-slate-400" />
        我已阅读并理解以上内容，同意参与本次实验。
      </label>

      <div class="mt-8">
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">选择实验情境</p>
        <div class="mt-3 grid gap-3 md:grid-cols-3">
          <button
            v-for="item in store.scenarios"
            :key="item.id"
            type="button"
            class="rounded-xl border px-4 py-4 text-left transition"
            :class="selectedScenarioId === item.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'"
            @click="selectedScenarioId = item.id"
          >
            <p class="font-semibold text-slate-900">{{ item.title }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ item.topic }}</p>
          </button>
        </div>
      </div>

      <p v-if="errorMessage" aria-live="polite" class="mt-4 text-sm font-semibold text-rose-600">{{ errorMessage }}</p>

      <button
        type="button"
        class="mt-6 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!consentChecked || !selectedScenarioId || store.loading.init"
        @click="startExperiment"
      >
        {{ store.loading.init ? "正在初始化..." : "同意并进入实验" }}
      </button>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useExperimentStore } from "../store/experiment";

const router = useRouter();
const store = useExperimentStore();

const selectedScenarioId = ref(store.scenarioId || store.scenarios[0]?.id || "");
const consentChecked = ref(store.consentAccepted);
const errorMessage = ref("");

async function startExperiment() {
  errorMessage.value = "";

  try {
    store.markConsent(consentChecked.value);
    await store.initExperiment({ scenarioId: selectedScenarioId.value });
    router.push("/scenario");
  } catch (error) {
    errorMessage.value = error.message;
  }
}
</script>
