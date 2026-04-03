<template>
  <main class="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-8">
    <section class="panel w-full overflow-hidden p-6 md:p-10">
      <div class="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div class="flex flex-col justify-between gap-8">
          <div>
            <span class="eyebrow-pill">AIGC 文明表达实验平台</span>
            <h1 class="display-title mt-6 max-w-4xl text-5xl font-semibold leading-[1.04] text-slate-900 md:text-7xl">
              在评论发出之前，
              <span class="gradient-text">给冲动一个更体面的出口。</span>
            </h1>
            <p class="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              面向大学生校园社交场景的实验型原型系统。我们用真实评论情境、前置提示和行为记录，
              研究 AIGC 个性化提示是否能让表达从情绪升级转向更理性的讨论。
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <article class="metric-card">
              <p class="section-label">研究流程</p>
              <p class="mt-3 text-lg font-semibold text-slate-900">知情同意 → 情境评论 → 反馈复盘</p>
            </article>
            <article class="metric-card">
              <p class="section-label">实验分组</p>
              <p class="mt-3 text-lg font-semibold text-slate-900">共情 / 规范 / 后果 / 替代表达 / 控制</p>
            </article>
            <article class="metric-card">
              <p class="section-label">采集指标</p>
              <p class="mt-3 text-lg font-semibold text-slate-900">修改行为、接受度、反思收益</p>
            </article>
          </div>
        </div>

        <div class="grid gap-5">
          <article class="panel-soft p-5">
            <p class="section-label">设计参考</p>
            <div class="mt-4 grid gap-3">
              <div class="flex items-start gap-3">
                <span class="step-badge active">1</span>
                <div>
                  <p class="font-semibold text-slate-900">Maze / Typeform</p>
                  <p class="mt-1 text-sm leading-6 text-slate-500">用更聚焦的实验流程和问卷结构，让参与过程像一次被精心设计的研究体验。</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="step-badge active">2</span>
                <div>
                  <p class="font-semibold text-slate-900">Anthropic</p>
                  <p class="mt-1 text-sm leading-6 text-slate-500">提示层采用克制、可信、非说教的表达气质，避免“安全弹窗感”。</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="step-badge active">3</span>
                <div>
                  <p class="font-semibold text-slate-900">Linear / Dovetail</p>
                  <p class="mt-1 text-sm leading-6 text-slate-500">仪表盘更像研究洞察工作台，而不是只有表格的数据仓库。</p>
                </div>
              </div>
            </div>
          </article>

          <button class="panel assistant-glow p-6 text-left transition hover:-translate-y-1" @click="enterParticipant">
            <span class="chip chip-teal">参与者入口</span>
            <h2 class="mt-4 text-3xl font-semibold text-slate-900">开始实验流程</h2>
            <p class="mt-3 max-w-xl text-sm leading-7 text-slate-600">
              阅读说明、完成简短前测、进入评论情境，并在需要时体验 AIGC 个性化提示。
            </p>
            <p class="mt-5 text-sm font-semibold text-slate-900">进入参与端 →</p>
          </button>

          <button class="panel-soft p-6 text-left transition hover:-translate-y-1" @click="enterDeveloper">
            <span class="chip chip-coral">研究后台</span>
            <h2 class="mt-4 text-2xl font-semibold text-slate-900">查看数据与分组配置</h2>
            <p class="mt-3 text-sm leading-7 text-slate-600">
              查看提示类型分布、实验行为结果、反馈量表均值和原始评论记录。
            </p>
            <p class="mt-5 text-sm font-semibold text-slate-900">进入仪表盘 →</p>
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { useRouter } from "vue-router";

import { useExperimentStore } from "../store/experiment";

const router = useRouter();
const store = useExperimentStore();

function enterParticipant() {
  store.setMode("participant");
  router.push("/intro");
}

function enterDeveloper() {
  store.setMode("developer");
  router.push("/dashboard");
}
</script>
