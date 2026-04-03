<template>
  <main class="landing-page min-h-screen">
    <section class="landing-topbar">
      <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 text-sm sm:px-8">
        <p>Research prototype for the project “评心而论”</p>
        <button class="landing-topbar-link" @click="enterParticipant">立即进入测试</button>
      </div>
    </section>

    <section class="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 sm:px-8">
      <header class="landing-nav">
        <button class="landing-brand" @click="router.push('/')">
          <span class="landing-brand-mark">评</span>
          <span>
            <strong>评心 Lab</strong>
            <small>AIGC 评论干预实验</small>
          </span>
        </button>

        <nav class="landing-nav-links">
          <a href="#overview">项目概览</a>
          <a href="#flow">参与流程</a>
          <a href="#evidence">研究重点</a>
        </nav>

        <div class="flex items-center gap-3">
          <button class="secondary-button" @click="enterDeveloper">研究后台</button>
          <button class="primary-button" @click="enterParticipant">开始测试</button>
        </div>
      </header>
    </section>

    <section id="overview" class="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-8">
      <div class="landing-hero">
        <div class="landing-copy">
          <span class="landing-kicker">Personalized civility prompt system</span>
          <h1 class="landing-title">
            在评论真正发出去之前，
            <br />
            先给冲动一个更体面的出口。
          </h1>
          <p class="landing-subtitle">
            这个原型围绕大学生在线评论场景，研究 AIGC 个性化提示是否能减少不文明表达。
            参与者会先完成知情同意与前测，再进入校园讨论情境，在触发风险表达时收到更克制、更贴合语境的提示。
          </p>

          <div class="landing-actions">
            <button class="primary-button" @click="enterParticipant">进入参与流程</button>
            <button class="secondary-button" @click="scrollToSection('flow')">查看研究流程</button>
          </div>

          <div class="landing-metrics">
            <article class="landing-metric">
              <strong>3 个</strong>
              <span>校园争议情境</span>
            </article>
            <article class="landing-metric">
              <strong>5 类</strong>
              <span>个性化提示策略</span>
            </article>
            <article class="landing-metric">
              <strong>2-4 分钟</strong>
              <span>单次完整体验</span>
            </article>
          </div>
        </div>

        <div class="landing-visual">
          <article class="landing-card landing-card-primary">
            <img
              src="https://images.pexels.com/photos/7821494/pexels-photo-7821494.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200"
              alt="学生在研究讨论中协作"
            />
            <div class="landing-card-caption">
              <span>Scenario-based study</span>
              <strong>让研究流程看起来像一个精心设计的体验，而不是冷冰冰的表单。</strong>
            </div>
          </article>

          <article class="landing-card landing-card-stat">
            <p class="section-label">Prompt layers</p>
            <h2>共情 / 后果 / 规范 / 替代表达 / 对照</h2>
            <p>提示不直接替你做决定，而是帮助你在保留观点的同时，换一种更容易被接收的表达方式。</p>
          </article>

          <article class="landing-card landing-card-shot">
            <img
              src="https://images.pexels.com/photos/7947400/pexels-photo-7947400.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200"
              alt="数据分析和可视化工作台"
            />
          </article>

          <article class="landing-card landing-card-note">
            <p class="section-label">Research dashboard</p>
            <h2>不仅记录行为结果，也记录提示的帮助感、友好度和贴合度。</h2>
          </article>
        </div>
      </div>
    </section>

    <section id="flow" class="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-8">
      <div class="landing-panel">
        <div class="landing-panel-head">
          <span class="eyebrow-pill">Flow</span>
          <h2>首页结构参考 Maze 的信息节奏，但内容完全贴合你的申报书边界。</h2>
        </div>

        <div class="landing-steps">
          <article class="landing-step">
            <span>01</span>
            <h3>知情同意与前测</h3>
            <p>收集年级、常用平台、评论频率与文明表达自我效能等基础变量。</p>
          </article>
          <article class="landing-step">
            <span>02</span>
            <h3>情境评论与提示干预</h3>
            <p>进入校园讨论场景，系统识别高风险表达后给出对应类型的个性化提示。</p>
          </article>
          <article class="landing-step">
            <span>03</span>
            <h3>后测反馈与可视化</h3>
            <p>记录修改行为、决策时长、提示接受度，以及研究后台的分组与结果分布。</p>
          </article>
        </div>
      </div>
    </section>

    <section id="evidence" class="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-8">
      <div class="landing-evidence">
        <article class="landing-evidence-card">
          <span class="eyebrow-pill">Why this UI</span>
          <h3>更像研究产品，而不是课题附件</h3>
          <p>首页先建立可信度和参与意愿，再把实验流程分层呈现，减少受试者进入前的心理负担。</p>
        </article>
        <article class="landing-evidence-card">
          <span class="eyebrow-pill">What we measure</span>
          <h3>功能新增仍严格限定在申报书范围内</h3>
          <p>包括前测、提示评价、后测反馈、风险特征展示、表达对比、一键采纳建议与研究仪表板洞察。</p>
        </article>
        <article class="landing-evidence-card accent">
          <span class="eyebrow-pill">Try it now</span>
          <h3>如果线上接口暂时不可用，也能自动进入本地演示模式。</h3>
          <button class="primary-button mt-5" @click="enterParticipant">现在开始</button>
        </article>
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

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>
