<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
    <div class="mb-6 flex items-center justify-between gap-4">
      <button class="ghost-button" @click="router.push('/')">
        <span aria-hidden="true">&larr;</span>
        返回首页
      </button>
      <div class="flex items-center gap-3">
        <span class="step-badge active">1</span>
        <span class="text-sm font-semibold text-slate-500">步骤 1 / 3</span>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section class="panel p-6 md:p-8">
        <span class="eyebrow-pill">知情同意</span>
        <h1 class="display-title mt-5 text-4xl font-semibold text-slate-900 md:text-5xl">
          进入情境测试之前，请先完成研究说明与基础前测。
        </h1>
        <p class="mt-4 text-sm leading-7 text-slate-600 md:text-base">
          本实验围绕大学生评论场景中的不文明表达干预展开。系统会记录你在模拟评论区中的输入、提示反馈、
          最终决策与简短问卷，仅用于课程研究分析与原型优化，不会连接真实社交平台。
        </p>

        <div v-if="store.runtimeMode === 'offline' && store.runtimeNotice" class="status-banner mt-6">
          <strong>当前为演示模式</strong>
          <span>{{ store.runtimeNotice }}</span>
        </div>

        <div class="divider-line my-6"></div>

        <div class="grid gap-4">
          <article class="panel-soft p-4">
            <p class="font-semibold text-slate-900">你将经历什么</p>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              阅读校园情境、输入评论、在必要时接收 AIGC 提示，再完成一组简短反馈量表。
            </p>
          </article>
          <article class="panel-soft p-4">
            <p class="font-semibold text-slate-900">参与原则</p>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              完全自愿、可随时退出、不要求绑定真实账号，最终是否发布仍由你自己决定。
            </p>
          </article>
          <article class="panel-soft p-4">
            <p class="font-semibold text-slate-900">研究记录内容</p>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              包括评论原文、触发的提示类型、修改行为、决策时长、提示接受度和后测反馈。
            </p>
          </article>
        </div>

        <label class="mt-6 flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white/80 p-4 text-sm text-slate-700">
          <input v-model="consentChecked" type="checkbox" class="h-4 w-4 rounded border-slate-400" />
          我已阅读并理解本次实验说明，同意参与本次研究。
        </label>
      </section>

      <section class="panel p-6 md:p-8">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="eyebrow-pill">前测与情境</span>
            <h2 class="mt-4 text-3xl font-semibold text-slate-900">先做一个轻量前测，再选择你要进入的评论场景。</h2>
          </div>
          <span class="chip chip-navy">限定在申报书范围内</span>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <label class="text-sm">
            <span class="field-label">当前学业阶段</span>
            <select v-model="preSurvey.educationLevel" class="field-select">
              <option value="lower_undergraduate">本科低年级</option>
              <option value="upper_undergraduate">本科高年级</option>
              <option value="postgraduate">研究生及以上</option>
              <option value="other">其他</option>
            </select>
          </label>
          <label class="text-sm">
            <span class="field-label">最常参与的平台</span>
            <select v-model="preSurvey.primaryPlatform" class="field-select">
              <option value="campus_wall">校园墙 / 校园社区</option>
              <option value="weibo">微博</option>
              <option value="xiaohongshu">小红书</option>
              <option value="bilibili">B 站</option>
              <option value="other">其他</option>
            </select>
          </label>
          <label class="text-sm">
            <span class="field-label">评论参与频率</span>
            <select v-model="preSurvey.commentingFrequency" class="field-select">
              <option value="rarely">几乎不评论</option>
              <option value="occasionally">偶尔评论</option>
              <option value="weekly">每周会评论</option>
              <option value="almost_daily">几乎每天评论</option>
            </select>
          </label>
          <label class="text-sm">
            <span class="field-label">你对自己文明表达的把握</span>
            <input v-model.number="preSurvey.civilityConfidence" type="range" min="1" max="5" class="w-full accent-slate-900" />
            <div class="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>1 较低</span>
              <span class="font-semibold text-slate-900">{{ preSurvey.civilityConfidence }}/5</span>
              <span>5 较高</span>
            </div>
          </label>
        </div>

        <div class="divider-line my-6"></div>

        <p class="section-label">选择实验情境</p>
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <button
            v-for="item in store.scenarios"
            :key="item.id"
            type="button"
            class="rounded-[24px] border p-4 text-left transition"
            :class="selectedScenarioId === item.id
              ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
              : 'border-slate-200 bg-white/80 text-slate-900 hover:-translate-y-1 hover:border-slate-300'"
            @click="selectedScenarioId = item.id"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="chip" :class="selectedScenarioId === item.id ? 'bg-white/15 text-white' : 'chip-teal'">{{ item.topic }}</span>
              <span class="text-xs font-semibold uppercase tracking-[0.16em]" :class="selectedScenarioId === item.id ? 'text-white/70' : 'text-slate-400'">
                风险 {{ item.riskLevel }}
              </span>
            </div>
            <p class="mt-4 text-xl font-semibold">{{ item.title }}</p>
            <p class="mt-3 text-sm leading-6" :class="selectedScenarioId === item.id ? 'text-white/75' : 'text-slate-500'">
              {{ item.context }}
            </p>
          </button>
        </div>

        <p v-if="errorMessage" aria-live="polite" class="mt-4 text-sm font-semibold text-rose-600">{{ errorMessage }}</p>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="primary-button disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!consentChecked || !selectedScenarioId || store.loading.init"
            @click="startExperiment"
          >
            {{ store.loading.init ? "正在初始化..." : "同意并进入实验" }}
          </button>
          <p class="text-sm text-slate-500">预计体验时长 2-4 分钟。</p>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useExperimentStore } from "../store/experiment";

const router = useRouter();
const store = useExperimentStore();

const selectedScenarioId = ref(store.scenarioId || store.scenarios[0]?.id || "");
const consentChecked = ref(store.consentAccepted);
const errorMessage = ref("");
const preSurvey = reactive({ ...store.preSurvey });

watch(
  preSurvey,
  (value) => {
    store.setPreSurvey(value);
  },
  { deep: true }
);

async function startExperiment() {
  errorMessage.value = "";

  try {
    store.markConsent(consentChecked.value);
    store.setPreSurvey(preSurvey);
    await store.initExperiment({ scenarioId: selectedScenarioId.value });
    router.push("/scenario");
  } catch (error) {
    errorMessage.value = error.message;
  }
}
</script>
