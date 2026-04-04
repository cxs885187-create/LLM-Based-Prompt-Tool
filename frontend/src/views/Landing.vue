<template>
  <main class="editorial-page">
    <section class="editorial-marquee">
      <div class="editorial-container editorial-marquee-inner">
        <p>AIGC 个性化提示对大学生评论文明表达的干预效果研究</p>
        <button class="editorial-inline-link" @click="enterParticipant">进入实验</button>
      </div>
    </section>

    <header class="editorial-container editorial-nav-wrap">
      <nav class="editorial-nav">
        <button class="editorial-brand" @click="router.push('/')">
          <span class="editorial-brand-mark">评</span>
          <span>
            <strong>评心 Lab</strong>
            <small>评论发布前的文明表达提示原型</small>
          </span>
        </button>

        <div class="editorial-links">
          <a href="#overview">项目简介</a>
          <a href="#method">研究方法</a>
          <a href="#flow">研究流程</a>
        </div>

        <div class="editorial-actions">
          <button class="editorial-ghost-button" @click="enterDeveloper">研究后台</button>
          <button class="editorial-primary-button" @click="enterParticipant">开始测试</button>
        </div>
      </nav>
    </header>

    <section id="overview" class="editorial-container editorial-hero">
      <div class="editorial-grid">
        <div class="editorial-hero-copy">
          <p class="editorial-kicker">AIGC personalized civility prompting</p>
          <h1 class="editorial-title">
            评心
            <br />
            而论
          </h1>
          <p class="editorial-dek">
            项目聚焦大学生网络评论中的隐性不文明表达问题，基于 AIGC 构建面向评论发布前的识别与个性化提示机制。
            系统通过规则识别与语言优化结合的方式，在不替用户做决定的前提下，为评论发布前提供更自然、更贴合语境的文明表达提示。
          </p>

          <div class="editorial-cta-row">
            <button class="editorial-primary-button" @click="enterParticipant">进入参与流程</button>
            <button class="editorial-ghost-button" @click="scrollToSection('flow')">查看研究流程</button>
          </div>
        </div>

        <figure class="editorial-hero-image image-hover-reveal">
          <img
            src="https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1100"
            alt="大学生在数字环境中阅读与思考评论内容"
          />
        </figure>

        <div class="editorial-pullquote">
          <span class="editorial-accent-line"></span>
          <p>
            在不限制表达自由的前提下，
            <br />
            让评论发布前多一次温和而有效的提醒。
          </p>
        </div>

        <div class="editorial-metrics">
          <article>
            <strong>2000+</strong>
            <span>前期收集评论数据</span>
          </article>
          <article>
            <strong>5 类</strong>
            <span>不文明表达类型</span>
          </article>
          <article>
            <strong>4 类</strong>
            <span>个性化提示策略</span>
          </article>
        </div>

        <div class="editorial-side-note">
          <p>研究重点</p>
          <strong>识别大学生评论中的隐性不文明表达，并验证个性化提示对修改意愿、表达文明程度与提示接受度的影响。</strong>
        </div>
      </div>
    </section>

    <section id="method" class="editorial-container editorial-story">
      <div class="editorial-grid editorial-story-grid">
        <figure class="editorial-story-image tall image-hover-reveal">
          <img
            src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=900"
            alt="研究参与者在评论场景中思考表达"
          />
        </figure>

        <article class="editorial-story-copy">
          <p class="editorial-kicker">Experiment introduction</p>
          <h2>项目围绕评论识别、提示生成、实验验证与原型实现四个层面展开。</h2>
          <p>
            前期研究已基于“中传校园墙”收集原始评论数据，并完成评论样本数据库、不文明议题分类和评论类型分类的初步整理。
            在此基础上，项目将结合大学生日常使用场景，设计语境适配的提示文本，检验不同提示条件下表达行为的变化。
          </p>
        </article>

        <figure class="editorial-story-image square image-hover-reveal">
          <img
            src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=900"
            alt="研究中的数据整理与实验分析"
          />
        </figure>

        <article class="editorial-feed">
          <p class="editorial-kicker">Research method</p>
          <ul>
            <li>
              <button @click="scrollToSection('flow')">
                <span>样本来源以校园生活、公共争议、娱乐社交三类评论情境为核心</span>
                <span>→</span>
              </button>
            </li>
            <li>
              <button @click="enterParticipant">
                <span>系统通过规则识别结合 AIGC 语言优化，生成语境适配的个性化提示</span>
                <span>→</span>
              </button>
            </li>
            <li>
              <button @click="enterDeveloper">
                <span>实验记录原始评论、修改结果、是否修改及帮助感、贴合度、友好度等评价</span>
                <span>→</span>
              </button>
            </li>
          </ul>
        </article>

        <article class="editorial-fact-block">
          <p class="editorial-kicker">Prompt strategy</p>
          <h3>共情式、规范式、后果式与替代表达式提示，将对应不同类型的不文明评论。</h3>
          <p>项目的目标不是简单屏蔽评论，而是借助个性化软干预提升表达质量与提示接受度。</p>
        </article>
      </div>
    </section>

    <section id="flow" class="editorial-container editorial-flow">
      <div class="editorial-grid editorial-flow-grid">
        <div class="editorial-flow-heading">
          <p class="editorial-kicker">Flow</p>
          <h2>研究流程分为三段。</h2>
        </div>

        <article class="editorial-step editorial-step-a">
          <span>01</span>
          <h3>评论样本整理与类型分析</h3>
          <p>围绕大学生评论文本进行数据清洗、人工编码和风险特征提取，建立不文明表达分类体系。</p>
        </article>

        <article class="editorial-step editorial-step-b">
          <span>02</span>
          <h3>个性化提示生成与实验干预</h3>
          <p>针对不同评论类型匹配相应提示策略，通过规则识别与 AIGC 生成相结合的方式形成提示文本。</p>
        </article>

        <article class="editorial-step editorial-step-c">
          <span>03</span>
          <h3>效果评估与原型优化</h3>
          <p>通过情境实验和对照实验比较不同提示条件下的修改行为、文明表达意愿与提示接受度差异。</p>
        </article>
      </div>
    </section>

    <section class="editorial-container editorial-outro">
      <div class="editorial-grid editorial-outro-grid">
        <article class="editorial-outro-copy">
          <p class="editorial-kicker">Project significance</p>
          <h2>最终成果将形成可嵌入校园平台的文明表达助手原型，为高校网络文明教育与评论治理提供参考。</h2>
          <p>
            相较于删帖、封禁等事后硬管控，这一研究更强调评论发布前的软引导机制。
            项目希望在保障表达自由的前提下，提高大学生网络表达的文明程度，并为校园平台和更广泛的评论治理场景提供可复用方案。
          </p>
        </article>

        <figure class="editorial-outro-image image-hover-reveal">
          <img
            src="https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1000"
            alt="研究原型展示中的人物与屏幕"
          />
        </figure>

        <div class="editorial-outro-actions">
          <button class="editorial-primary-button" @click="enterParticipant">立即开始实验</button>
          <button class="editorial-ghost-button" @click="enterDeveloper">查看后台结果</button>
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

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<style scoped>
.editorial-page {
  background:
    radial-gradient(circle at top right, rgba(201, 90, 51, 0.09), transparent 26%),
    linear-gradient(180deg, #fcfaf7 0%, #f4f0e9 100%);
  color: #121212;
  padding-bottom: 5rem;
}

.editorial-container {
  margin: 0 auto;
  width: min(100%, 1440px);
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.editorial-marquee {
  border-bottom: 1px solid rgba(18, 18, 18, 0.08);
  background: rgba(249, 248, 246, 0.92);
}

.editorial-marquee-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  padding-top: 0.9rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.editorial-inline-link {
  border: 0;
  background: transparent;
  color: #c95a33;
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 0.35rem;
}

.editorial-nav-wrap {
  padding-top: 1.5rem;
}

.editorial-nav {
  position: sticky;
  top: 1rem;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid rgba(18, 18, 18, 0.08);
  background: rgba(249, 248, 246, 0.84);
  backdrop-filter: blur(18px);
  padding: 1rem 1.25rem;
}

.editorial-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-align: left;
}

.editorial-brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: #111111;
  color: #f9f8f6;
  font-size: 1.35rem;
  font-weight: 700;
}

.editorial-brand strong,
.editorial-brand small {
  display: block;
}

.editorial-brand small {
  color: rgba(18, 18, 18, 0.58);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.editorial-links,
.editorial-actions,
.editorial-cta-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.editorial-links a {
  color: inherit;
  font-size: 0.92rem;
  text-decoration: none;
}

.editorial-primary-button,
.editorial-ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.9rem;
  padding: 0 1.25rem;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 700;
  transition:
    transform 180ms ease,
    background 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.editorial-primary-button {
  border: 1px solid #111111;
  background: #111111;
  color: #f9f8f6;
  box-shadow: 0 1rem 2.5rem rgba(17, 17, 17, 0.14);
}

.editorial-primary-button:hover,
.editorial-ghost-button:hover {
  transform: translateY(-1px);
}

.editorial-ghost-button {
  border: 1px solid rgba(18, 18, 18, 0.12);
  background: rgba(255, 255, 255, 0.35);
  color: #111111;
}

.editorial-hero {
  padding-top: 3rem;
}

.editorial-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.35rem;
}

.editorial-hero-copy {
  grid-column: 1 / span 6;
  padding-top: 2.5rem;
}

.editorial-kicker {
  margin: 0;
  color: #c95a33;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.editorial-title {
  margin: 1.2rem 0 0;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: clamp(4.2rem, 8.4vw, 8.6rem);
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 0.96;
}

.editorial-dek {
  margin-top: 2rem;
  max-width: 38rem;
  color: rgba(18, 18, 18, 0.72);
  font-size: 1.05rem;
  line-height: 2.1;
}

.editorial-cta-row {
  margin-top: 2rem;
  flex-wrap: wrap;
}

.editorial-hero-image {
  grid-column: 8 / span 4;
  position: relative;
  margin-top: 1rem;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  box-shadow: 0 2rem 4rem rgba(18, 18, 18, 0.14);
}

.editorial-hero-image::after,
.editorial-story-image::after,
.editorial-outro-image::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid rgba(18, 18, 18, 0.08);
  pointer-events: none;
}

.editorial-hero-image img,
.editorial-story-image img,
.editorial-outro-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-hover-reveal img {
  filter: grayscale(1) contrast(1.04);
  transition:
    filter 260ms ease,
    transform 260ms ease;
}

.image-hover-reveal:hover img {
  filter: grayscale(0) contrast(1);
  transform: scale(1.02);
}

.editorial-pullquote {
  grid-column: 6 / span 4;
  margin-top: -4.6rem;
  background: rgba(249, 248, 246, 0.94);
  padding: 2rem 1.9rem 0.6rem 0;
  position: relative;
  z-index: 2;
}

.editorial-pullquote p {
  margin: 1.1rem 0 0;
  font-size: clamp(1.18rem, 2.1vw, 1.72rem);
  font-weight: 700;
  line-height: 1.55;
}

.editorial-accent-line {
  display: block;
  width: 6rem;
  height: 0.38rem;
  background: #c95a33;
}

.editorial-metrics {
  grid-column: 1 / span 5;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: -0.5rem;
}

.editorial-metrics article {
  padding-top: 1.35rem;
  border-top: 1px solid rgba(18, 18, 18, 0.12);
}

.editorial-metrics strong {
  display: block;
  font-size: clamp(1.7rem, 4vw, 2.3rem);
  font-weight: 800;
}

.editorial-metrics span {
  display: block;
  margin-top: 0.5rem;
  color: rgba(18, 18, 18, 0.6);
  font-size: 0.94rem;
  line-height: 1.8;
}

.editorial-side-note {
  grid-column: 10 / span 3;
  align-self: end;
  margin-top: -4rem;
  padding: 1.3rem 1.4rem;
  border-left: 3px solid #c95a33;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 1rem 2.4rem rgba(18, 18, 18, 0.08);
}

.editorial-side-note p,
.editorial-fact-block p {
  margin: 0;
  color: rgba(18, 18, 18, 0.58);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.editorial-side-note strong {
  display: block;
  margin-top: 0.9rem;
  font-size: 1rem;
  line-height: 1.95;
}

.editorial-story,
.editorial-flow,
.editorial-outro {
  padding-top: 6rem;
}

.editorial-story-grid {
  align-items: start;
}

.editorial-story-image.tall {
  grid-column: 1 / span 3;
  aspect-ratio: 3 / 4;
  margin-top: 1.6rem;
  overflow: hidden;
}

.editorial-story-copy {
  grid-column: 4 / span 5;
  padding-top: 3.5rem;
}

.editorial-story-copy h2,
.editorial-flow-heading h2,
.editorial-outro-copy h2 {
  margin: 1rem 0 0;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: clamp(2rem, 4.3vw, 3.8rem);
  line-height: 1.12;
  letter-spacing: -0.045em;
}

.editorial-story-copy p:not(.editorial-kicker),
.editorial-fact-block p:last-child,
.editorial-step p,
.editorial-outro-copy p:not(.editorial-kicker) {
  margin-top: 1.2rem;
  color: rgba(18, 18, 18, 0.72);
  font-size: 1rem;
  line-height: 2;
}

.editorial-story-image.square {
  grid-column: 10 / span 3;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.editorial-feed {
  grid-column: 9 / span 4;
  margin-top: -5rem;
  padding-top: 2rem;
}

.editorial-feed ul {
  margin: 1.1rem 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid rgba(18, 18, 18, 0.12);
}

.editorial-feed li {
  border-bottom: 1px solid rgba(18, 18, 18, 0.12);
}

.editorial-feed button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 1.2rem 0;
  text-align: left;
}

.editorial-feed button span:first-child {
  line-height: 1.9;
}

.editorial-feed button span:last-child {
  color: #c95a33;
  font-size: 1.2rem;
  transition: transform 180ms ease;
}

.editorial-feed button:hover span:last-child {
  transform: translateX(0.2rem);
}

.editorial-fact-block {
  grid-column: 3 / span 4;
  margin-top: -3rem;
  padding: 1.5rem 1.6rem;
  background: #151515;
  color: #f7f2eb;
}

.editorial-fact-block h3 {
  margin: 0.95rem 0 0;
  font-size: 1.58rem;
  line-height: 1.55;
}

.editorial-fact-block p:last-child {
  color: rgba(247, 242, 235, 0.72);
}

.editorial-flow-grid {
  align-items: start;
}

.editorial-flow-heading {
  grid-column: 1 / span 5;
  padding-right: 2rem;
}

.editorial-step {
  min-height: 16rem;
  padding: 1.6rem;
  border-top: 4px solid #c95a33;
  background: rgba(255, 255, 255, 0.48);
  box-shadow: 0 1.25rem 2.8rem rgba(18, 18, 18, 0.08);
}

.editorial-step span {
  color: #c95a33;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.editorial-step h3 {
  margin: 1rem 0 0;
  font-size: 1.68rem;
  line-height: 1.35;
}

.editorial-step-a {
  grid-column: 7 / span 3;
  margin-top: 2rem;
}

.editorial-step-b {
  grid-column: 10 / span 3;
  margin-top: -1rem;
}

.editorial-step-c {
  grid-column: 8 / span 4;
  margin-top: 1.4rem;
}

.editorial-outro-grid {
  align-items: center;
}

.editorial-outro-copy {
  grid-column: 1 / span 5;
}

.editorial-outro-image {
  grid-column: 7 / span 4;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  margin-top: 1rem;
}

.editorial-outro-actions {
  grid-column: 10 / span 3;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  align-self: end;
  margin-bottom: 2rem;
}

@media (max-width: 1180px) {
  .editorial-nav {
    flex-wrap: wrap;
  }

  .editorial-links {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .editorial-hero-copy,
  .editorial-hero-image,
  .editorial-pullquote,
  .editorial-metrics,
  .editorial-side-note,
  .editorial-story-image.tall,
  .editorial-story-copy,
  .editorial-story-image.square,
  .editorial-feed,
  .editorial-fact-block,
  .editorial-flow-heading,
  .editorial-step-a,
  .editorial-step-b,
  .editorial-step-c,
  .editorial-outro-copy,
  .editorial-outro-image,
  .editorial-outro-actions {
    grid-column: 1 / -1;
    margin-top: 0;
  }

  .editorial-pullquote,
  .editorial-side-note,
  .editorial-feed,
  .editorial-fact-block {
    max-width: 42rem;
  }

  .editorial-hero-image,
  .editorial-outro-image {
    max-width: 30rem;
  }
}

@media (max-width: 780px) {
  .editorial-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .editorial-marquee-inner,
  .editorial-nav,
  .editorial-links,
  .editorial-actions,
  .editorial-cta-row,
  .editorial-outro-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .editorial-metrics {
    grid-template-columns: 1fr;
  }

  .editorial-title {
    font-size: clamp(3.2rem, 17vw, 5.4rem);
    line-height: 1.02;
  }

  .editorial-dek,
  .editorial-story-copy p:not(.editorial-kicker),
  .editorial-fact-block p:last-child,
  .editorial-step p,
  .editorial-outro-copy p:not(.editorial-kicker) {
    line-height: 1.9;
  }

  .editorial-story-copy h2,
  .editorial-flow-heading h2,
  .editorial-outro-copy h2 {
    font-size: clamp(2rem, 10vw, 3.1rem);
    line-height: 1.18;
  }
}
</style>
