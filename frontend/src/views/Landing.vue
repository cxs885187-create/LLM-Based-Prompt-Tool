<template>
  <main class="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12 sm:px-8">
    <section class="panel w-full overflow-hidden p-8 md:p-12">
      <div class="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p class="font-display text-sm uppercase tracking-[0.24em] text-slate-500">AIGC 提示干预实验</p>
          <h1 class="mt-4 font-display text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
            面向网络文明的
            <span class="gradient-text">人机协同实验平台</span>
          </h1>
          <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            该系统用于研究干预提示是否能在用户发布不文明评论前触发反思，从而提升线上沟通质量。
          </p>
        </div>

        <div class="grid gap-4">
          <button
            class="group rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-left transition hover:-translate-y-1 hover:shadow-float"
            @click="enterParticipant"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">参与者入口</p>
            <h2 class="mt-2 font-display text-2xl font-bold text-slate-900">开始实验</h2>
            <p class="mt-2 text-slate-600">阅读说明与同意条款，进入情境并完成一次评论决策流程。</p>
            <p class="mt-3 text-sm font-semibold text-emerald-700">前往说明页 -></p>
          </button>

          <button
            class="group rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6 text-left transition hover:-translate-y-1 hover:shadow-float"
            @click="enterDeveloper"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">开发者入口</p>
            <h2 class="mt-2 font-display text-2xl font-bold text-slate-900">查看仪表盘</h2>
            <p class="mt-2 text-slate-600">查看实验记录总览、最终行为分布和干预触发情况。</p>
            <p class="mt-3 text-sm font-semibold text-cyan-700">打开仪表盘 -></p>
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
