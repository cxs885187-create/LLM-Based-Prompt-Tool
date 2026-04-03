import { defineStore } from "pinia";

import { apiClient } from "../api/http";
import { tracker } from "../utils/hci_tracker";

const STORAGE_KEY = "experiment_state_v1";
export const ADMIN_TOKEN_STORAGE_KEY = "dashboard_admin_token_v1";
const MAX_LOCAL_LOGS = 200;

const GROUP_LABELS = {
  empathy: "共情提示",
  consequence: "后果提示",
  normative: "规范提示",
  alternative: "替代表达提示",
  control: "对照组提示"
};

const LOCAL_GROUPS = Object.keys(GROUP_LABELS);

const scenarioCatalog = [
  {
    id: "campus-traffic",
    title: "校园交通事故讨论",
    topic: "校园安全",
    context: "校门口突发交通事故后，评论区快速升温，容易出现带情绪的人身指责。",
    riskLevel: "高",
    authorName: "校园观察员",
    authorHandle: "@campus_watch",
    postTime: "2 分钟前",
    postText:
      "刚在东门看到一起交通事故：一辆电动车闯红灯把行人撞倒了，现场很混乱。大家讨论交通治理时，能不能也关注一下校园里越来越激烈的发言氛围？",
    stats: { replies: 42, reposts: 17, likes: 218, views: "1.3万" },
    seedReplies: [
      { id: "ct-1", name: "理性讨论派", handle: "@thinkfirst", time: "1 分钟前", text: "先等警方通报吧，别急着下结论。" },
      { id: "ct-2", name: "早八路过", handle: "@morning_class", time: "刚刚", text: "我也在现场，确实挺危险，希望学校尽快处理。" }
    ]
  },
  {
    id: "grading-dispute",
    title: "课程评分争议",
    topic: "课程讨论",
    context: "期末给分引发学生互相指责，评论区出现明显两极化和标签化表达。",
    riskLevel: "中",
    authorName: "课程吐槽 Bot",
    authorHandle: "@grade_talk",
    postTime: "8 分钟前",
    postText:
      "这门课期末评分差异太大了，有人平时几乎不发言却拿了高分。大家觉得是评分标准不透明，还是我们误解了老师的要求？",
    stats: { replies: 36, reposts: 9, likes: 143, views: "9862" },
    seedReplies: [
      { id: "gd-1", name: "作业群友", handle: "@late_submitter", time: "4 分钟前", text: "建议把评分细则公开，这样争议会少很多。" },
      { id: "gd-2", name: "课程助教", handle: "@ta_notice", time: "2 分钟前", text: "可以先收集具体问题，再统一向老师反馈。" }
    ]
  },
  {
    id: "dorm-conflict",
    title: "宿舍作息冲突",
    topic: "日常生活",
    context: "宿舍矛盾在匿名社区持续发酵，评论很容易从抱怨升级为点名攻击。",
    riskLevel: "中",
    authorName: "宿舍生活墙",
    authorHandle: "@dorm_forum",
    postTime: "15 分钟前",
    postText:
      "凌晨一点还在外放视频，真的顶不住。反复沟通没用，现在连睡眠都保证不了。遇到这种室友行为，大家会怎么处理？",
    stats: { replies: 58, reposts: 12, likes: 305, views: "1.9万" },
    seedReplies: [
      { id: "dc-1", name: "早睡同盟", handle: "@sleepmatters", time: "10 分钟前", text: "先和辅导员沟通，别让冲突继续升级。" },
      { id: "dc-2", name: "冷静室友", handle: "@roommate_mode", time: "6 分钟前", text: "建议先定一个宿舍公约，把安静时段写清楚。" }
    ]
  }
];

const riskRulebook = [
  { tag: "人身攻击", patterns: [/傻/i, /蠢/i, /废物/i, /脑残/i, /有病/i, /恶心/i] },
  { tag: "命令式驱赶", patterns: [/滚/i, /闭嘴/i, /少来/i, /别装/i] },
  { tag: "绝对化指责", patterns: [/都怪/i, /一看就/i, /就是你们/i, /全都/i, /从来不/i] },
  { tag: "情绪升级", patterns: [/气死/i, /受不了/i, /烦死/i, /离谱/i, /真无语/i] },
  { tag: "标签化表达", patterns: [/这种人/i, /这类人/i, /一群/i, /某些人/i] }
];

function buildDefaultAllocation() {
  return {
    weights: { empathy: 1, consequence: 1, normative: 1, alternative: 1, control: 1 },
    normalized_ratio: { empathy: 0.2, consequence: 0.2, normative: 0.2, alternative: 0.2, control: 0.2 },
    total_weight: 5,
    updated_at: null
  };
}

function buildDefaultPreSurvey() {
  return {
    educationLevel: "lower_undergraduate",
    primaryPlatform: "campus_wall",
    commentingFrequency: "occasionally",
    civilityConfidence: 3
  };
}

function buildDefaultPromptFeedback() {
  return { helpfulness: 4, friendliness: 4, relevance: 4 };
}

function buildDefaultPostSurvey() {
  return { reflectionGain: 4, realWorldAdoption: 4, openFeedback: "" };
}

function getAdminAuthHeaders() {
  const token = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  if (!token || !token.trim()) {
    return {};
  }

  return { Authorization: `Bearer ${token.trim()}` };
}

function buildDefaultState() {
  return {
    mode: "participant",
    runtimeMode: "online",
    runtimeNotice: "",
    sessionId: "",
    experimentId: "",
    scenarioId: "",
    group: "",
    promptType: "",
    promptSource: "",
    promptText: "",
    riskFeatures: [],
    isUncivil: false,
    originalComment: "",
    finalAction: "",
    modifiedComment: "",
    consentAccepted: false,
    feedbackSubmitted: false,
    preSurvey: buildDefaultPreSurvey(),
    promptFeedback: buildDefaultPromptFeedback(),
    postSurvey: buildDefaultPostSurvey(),
    decisionLatencyMs: null,
    loading: {
      init: false,
      check: false,
      action: false,
      feedback: false,
      dashboard: false,
      allocation: false
    },
    requestControllers: { check: null, action: null },
    lastError: "",
    logs: [],
    dashboard: {
      summary: null,
      distributions: { groups: {}, actions: {}, scenarios: {} },
      insights: {},
      allocation: buildDefaultAllocation(),
      records: []
    },
    scenarios: scenarioCatalog
  };
}

function loadPersistedState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function average(values) {
  if (!values.length) {
    return null;
  }
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const bucket = item[key];
    if (!bucket) {
      return result;
    }
    result[bucket] = (result[bucket] || 0) + 1;
    return result;
  }, {});
}

function buildDashboardFallback(logs, allocation) {
  const localRecords = logs.map((item) => ({
    experiment_id: item.experimentId,
    group: item.group,
    scenario_id: item.scenarioId,
    prompt_type: item.promptType,
    prompt_source: item.promptSource,
    generated_prompt: item.generatedPrompt || null,
    original_comment: item.originalComment || null,
    modified_comment: item.modifiedComment || null,
    final_submitted_comment: item.finalSubmittedComment || null,
    final_action: item.action,
    risk_features: item.riskFeatures || [],
    prompt_feedback: item.promptFeedback || null,
    post_survey: item.postSurvey || null,
    decision_latency_ms: item.decisionLatencyMs || null,
    status: "completed",
    created_at: item.createdAt,
    updated_at: item.updatedAt || item.createdAt
  }));

  const feedbackRows = localRecords.filter((item) => item.post_survey);

  return {
    summary: {
      total_records: localRecords.length,
      completed_records: localRecords.length,
      uncivil_triggered_records: localRecords.filter((item) => !!item.prompt_type).length
    },
    distributions: {
      groups: countBy(localRecords, "group"),
      actions: countBy(localRecords, "final_action"),
      scenarios: countBy(localRecords, "scenario_id")
    },
    insights: {
      modify_rate: localRecords.length
        ? Math.round((localRecords.filter((item) => item.final_action === "modify").length / localRecords.length) * 100) / 100
        : null,
      avg_helpfulness: average(feedbackRows.map((item) => item.prompt_feedback?.helpfulness).filter(Boolean)),
      avg_friendliness: average(feedbackRows.map((item) => item.prompt_feedback?.friendliness).filter(Boolean)),
      avg_relevance: average(feedbackRows.map((item) => item.prompt_feedback?.relevance).filter(Boolean)),
      avg_reflection_gain: average(feedbackRows.map((item) => item.post_survey?.reflection_gain).filter(Boolean)),
      avg_real_world_adoption: average(feedbackRows.map((item) => item.post_survey?.real_world_adoption).filter(Boolean)),
      avg_decision_latency_ms: average(localRecords.map((item) => item.decision_latency_ms).filter(Boolean)),
      feedback_count: feedbackRows.length
    },
    allocation: allocation || buildDefaultAllocation(),
    records: localRecords
  };
}

function isLikelyNetworkError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("network error") ||
    message.includes("fetch") ||
    message.includes("xmlhttprequest") ||
    message.includes("timeout") ||
    message.includes("connect") ||
    message.includes("socket") ||
    message.includes("failed to load")
  );
}

function assignLocalGroup() {
  return LOCAL_GROUPS[Math.floor(Math.random() * LOCAL_GROUPS.length)];
}

function guessConcern(text, scenarioId) {
  const normalized = String(text || "").toLowerCase();

  if (scenarioId === "grading-dispute" || /分|评分|老师|作业|课程|期末/.test(normalized)) {
    return "评分标准和沟通方式";
  }
  if (scenarioId === "dorm-conflict" || /宿舍|室友|睡|安静|作息/.test(normalized)) {
    return "作息影响和解决办法";
  }
  if (scenarioId === "campus-traffic" || /交通|电动车|行人|校门|安全/.test(normalized)) {
    return "事件处理和校园安全";
  }
  return "问题本身和改进建议";
}

function normalizeSentence(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[!！?？]{2,}/g, "。")
    .trim();
}

function softenComment(text, scenarioId) {
  const concern = guessConcern(text, scenarioId);
  const cleaned = normalizeSentence(text)
    .replace(/傻|蠢|废物|脑残|有病|恶心/gi, "不合适")
    .replace(/滚|闭嘴|少来|别装/gi, "先冷静讨论")
    .replace(/你们|你这种人|这种人|某些人/gi, "相关同学")
    .replace(/都怪/gi, "问题可能与")
    .replace(/真无语|气死|烦死|离谱/gi, "确实让人不舒服");

  if (!cleaned) {
    return `我对这件事有些担心，尤其是${concern}。希望相关方能尽快回应，并给出清晰的改进方案。`;
  }

  return `我对这件事确实有些不满，主要担心的是${concern}。${cleaned}。希望大家把重点放在事实和解决办法上。`;
}

function analyzeLocalRiskFeatures(text) {
  const features = [];
  for (const rule of riskRulebook) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      features.push(rule.tag);
    }
  }
  return features;
}

function isLikelyUncivil(text) {
  return analyzeLocalRiskFeatures(text).length > 0;
}

function buildLocalPrompt(group, text, scenarioId) {
  const concern = guessConcern(text, scenarioId);
  const suggested = softenComment(text, scenarioId);

  const promptMap = {
    empathy: `你现在很可能是因为${concern}而生气，这种情绪很真实。为了让别人更愿意听进去，可以先说事实和影响，再提出你的诉求。比如：${suggested}`,
    consequence: `如果这条评论直接发出，别人更容易记住攻击语气，而不是你真正关心的${concern}。你可以保留立场，但换成更容易被接受的表达。比如：${suggested}`,
    normative: `在校园讨论场景里，明确问题、避免贴标签，更容易推动事情被认真处理。建议把表达从情绪判断改成事实描述与诉求表达。比如：${suggested}`,
    alternative: `你完全可以保留不满，只是换一种说法。把“评价别人”改成“说明影响 + 提出建议”，通常更容易得到回应。参考改写：${suggested}`,
    control: `发送前先做一次自检：这条评论是否准确表达了你最想解决的${concern}？如果愿意，你也可以试试更克制的版本：${suggested}`
  };

  return {
    is_uncivil: true,
    prompt_type: group,
    prompt_source: "offline_heuristic",
    prompt_text: promptMap[group] || promptMap.control,
    risk_features: analyzeLocalRiskFeatures(text)
  };
}

function buildLocalInitPayload(sessionId, scenarioId, group) {
  return {
    experiment_id: `local-${crypto.randomUUID()}`,
    session_id: sessionId,
    scenario_id: scenarioId,
    group
  };
}

export const useExperimentStore = defineStore("experiment", {
  state: () => ({
    ...buildDefaultState(),
    ...(loadPersistedState() || {})
  }),
  getters: {
    currentScenario(state) {
      return state.scenarios.find((item) => item.id === state.scenarioId) || null;
    },
    promptTypeLabel(state) {
      return GROUP_LABELS[state.promptType] || "未触发";
    },
    canEnterScenario(state) {
      return Boolean(state.experimentId && state.scenarioId);
    },
    finalSubmittedComment(state) {
      if (state.finalAction === "modify") {
        return state.modifiedComment;
      }
      if (state.finalAction === "post") {
        return state.originalComment;
      }
      return "";
    }
  },
  actions: {
    persistState() {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: this.mode,
          runtimeMode: this.runtimeMode,
          runtimeNotice: this.runtimeNotice,
          sessionId: this.sessionId,
          experimentId: this.experimentId,
          scenarioId: this.scenarioId,
          group: this.group,
          promptType: this.promptType,
          promptSource: this.promptSource,
          promptText: this.promptText,
          riskFeatures: this.riskFeatures,
          isUncivil: this.isUncivil,
          originalComment: this.originalComment,
          finalAction: this.finalAction,
          modifiedComment: this.modifiedComment,
          consentAccepted: this.consentAccepted,
          feedbackSubmitted: this.feedbackSubmitted,
          preSurvey: this.preSurvey,
          promptFeedback: this.promptFeedback,
          postSurvey: this.postSurvey,
          decisionLatencyMs: this.decisionLatencyMs,
          logs: this.logs
        })
      );
    },
    setMode(mode) {
      this.mode = mode;
      this.persistState();
    },
    setPreSurvey(payload) {
      this.preSurvey = { ...this.preSurvey, ...payload };
      this.persistState();
    },
    setPromptFeedback(payload) {
      this.promptFeedback = { ...this.promptFeedback, ...payload };
      this.persistState();
    },
    setPostSurvey(payload) {
      this.postSurvey = { ...this.postSurvey, ...payload };
      this.persistState();
    },
    setRuntimeState(mode, notice = "") {
      this.runtimeMode = mode;
      this.runtimeNotice = notice;
      this.persistState();
    },
    resetExperimentFlow() {
      const keepMode = this.mode;
      const keepLogs = [...this.logs];
      const keepDashboard = this.dashboard;
      Object.assign(this, buildDefaultState());
      this.mode = keepMode;
      this.logs = keepLogs;
      this.dashboard = keepDashboard;
      sessionStorage.removeItem(STORAGE_KEY);
      this.persistState();
    },
    markConsent(value) {
      this.consentAccepted = value;
      this.persistState();
    },
    updateLatestLog(patch) {
      const latestLog = [...this.logs].reverse().find((item) => item.experimentId === this.experimentId);
      if (!latestLog) {
        return;
      }
      Object.assign(latestLog, patch, { updatedAt: new Date().toISOString() });
    },
    async initExperiment({ scenarioId }) {
      this.loading.init = true;
      this.lastError = "";

      try {
        this.sessionId = this.sessionId || crypto.randomUUID();
        const { data } = await apiClient.post("/experiment/init", {
          session_id: this.sessionId,
          scenario_id: scenarioId,
          pre_survey: {
            education_level: this.preSurvey.educationLevel,
            primary_platform: this.preSurvey.primaryPlatform,
            commenting_frequency: this.preSurvey.commentingFrequency,
            civility_confidence: this.preSurvey.civilityConfidence
          }
        });

        this.setRuntimeState("online", "");
        this.experimentId = data.experiment_id;
        this.group = data.group;
        this.scenarioId = data.scenario_id;
      } catch (error) {
        if (!isLikelyNetworkError(error)) {
          this.lastError = error.message;
          throw error;
        }

        const localGroup = assignLocalGroup();
        const localData = buildLocalInitPayload(this.sessionId || crypto.randomUUID(), scenarioId, localGroup);
        this.setRuntimeState("offline", "当前服务器不可用，已自动切换为本地演示模式。");
        this.experimentId = localData.experiment_id;
        this.group = localData.group;
        this.scenarioId = localData.scenario_id;
        this.lastError = this.runtimeNotice;
      } finally {
        this.promptType = "";
        this.promptSource = "";
        this.promptText = "";
        this.riskFeatures = [];
        this.isUncivil = false;
        this.finalAction = "";
        this.modifiedComment = "";
        this.feedbackSubmitted = false;
        this.decisionLatencyMs = null;
        this.promptFeedback = buildDefaultPromptFeedback();
        this.postSurvey = buildDefaultPostSurvey();

        tracker.reset();
        tracker.start("full_journey");
        tracker.start("scenario_to_submit");
        tracker.log("experiment_initialized", {
          experimentId: this.experimentId,
          scenarioId: this.scenarioId,
          group: this.group,
          runtimeMode: this.runtimeMode
        });

        this.persistState();
        this.loading.init = false;
      }
    },
    async checkComment(commentText) {
      if (!this.experimentId) {
        throw new Error("实验尚未初始化，请先完成说明页。");
      }

      if (this.requestControllers.check) {
        this.requestControllers.check.abort();
      }
      const controller = new AbortController();
      this.requestControllers.check = controller;

      this.loading.check = true;
      this.lastError = "";
      this.originalComment = commentText;

      try {
        tracker.end("scenario_to_submit", { stage: "comment_submit" });
        tracker.start("check_api_latency");

        const { data } = await apiClient.post(
          "/comment/check",
          { experiment_id: this.experimentId, comment_text: commentText },
          { signal: controller.signal, timeout: 20000 }
        );

        tracker.end("check_api_latency", { uncivil: data.is_uncivil });
        this.setRuntimeState("online", "");
        this.isUncivil = data.is_uncivil;
        this.promptText = data.prompt_text || "";
        this.promptType = data.prompt_type || "";
        this.promptSource = data.prompt_source || "";
        this.riskFeatures = data.risk_features || [];
      } catch (error) {
        if (error?.message?.includes("canceled")) {
          throw new Error("重复提交已取消，请等待当前请求完成。");
        }
        if (!isLikelyNetworkError(error)) {
          this.lastError = error.message;
          throw error;
        }

        const localResult = isLikelyUncivil(commentText)
          ? buildLocalPrompt(this.group || assignLocalGroup(), commentText, this.scenarioId)
          : {
            is_uncivil: false,
            prompt_type: "",
            prompt_source: "offline_heuristic",
            prompt_text: "",
            risk_features: analyzeLocalRiskFeatures(commentText)
          };

        this.setRuntimeState("offline", "服务器暂时无法响应，当前正在使用本地演示模式。");
        this.isUncivil = localResult.is_uncivil;
        this.promptText = localResult.prompt_text || "";
        this.promptType = localResult.prompt_type || "";
        this.promptSource = localResult.prompt_source || "";
        this.riskFeatures = localResult.risk_features || [];
        this.lastError = this.runtimeNotice;
      } finally {
        if (this.isUncivil) {
          tracker.start("intervention_decision_latency");
        }

        tracker.log("comment_checked", {
          isUncivil: this.isUncivil,
          promptType: this.promptType,
          riskFeatures: this.riskFeatures,
          runtimeMode: this.runtimeMode
        });

        this.persistState();
        if (this.requestControllers.check === controller) {
          this.requestControllers.check = null;
        }
        this.loading.check = false;
      }

      return {
        is_uncivil: this.isUncivil,
        prompt_text: this.promptText,
        prompt_type: this.promptType,
        prompt_source: this.promptSource,
        risk_features: this.riskFeatures
      };
    },
    async submitDecision({ choice, modifiedComment = "" }) {
      if (!this.experimentId) {
        throw new Error("实验尚未初始化，请先完成说明页。");
      }

      if (this.requestControllers.action) {
        this.requestControllers.action.abort();
      }
      const controller = new AbortController();
      this.requestControllers.action = controller;

      const choiceMap = {
        adopt_suggestion: "modify",
        self_rewrite: "modify",
        post_anyway: "post",
        cancel_publish: "cancel"
      };

      const action = choiceMap[choice];
      if (!action) {
        throw new Error("不支持的决策选项。");
      }
      if (action === "modify" && !modifiedComment.trim()) {
        throw new Error("选择“修改后发布”时必须填写修改后的评论。");
      }

      this.loading.action = true;
      this.lastError = "";

      if (this.isUncivil) {
        this.decisionLatencyMs = Math.round(tracker.end("intervention_decision_latency", { choice }) || 0);
      }

      const payload = { experiment_id: this.experimentId, action };
      if (action === "modify") {
        payload.modified_comment = modifiedComment;
      }

      try {
        tracker.start("action_api_latency");
        const { data } = await apiClient.post("/comment/action", payload, {
          signal: controller.signal,
          timeout: 20000
        });

        tracker.end("action_api_latency", { action, choice });
        tracker.end("full_journey", { action, choice });
        this.setRuntimeState("online", "");
        tracker.log("action_submitted", { action, choice, success: data.success });
      } catch (error) {
        if (error?.message?.includes("canceled")) {
          throw new Error("重复提交已取消，请等待当前请求完成。");
        }
        if (!isLikelyNetworkError(error)) {
          this.lastError = error.message;
          throw error;
        }

        this.setRuntimeState("offline", "动作记录未能写入服务器，已在本地完成本次演示。");
        this.lastError = this.runtimeNotice;
        tracker.log("action_submitted", { action, choice, success: true, runtimeMode: "offline" });
      } finally {
        this.finalAction = action;
        this.modifiedComment = action === "modify" ? modifiedComment : "";
        const finalSubmittedComment =
          action === "modify" ? modifiedComment : action === "post" ? this.originalComment : null;

        this.logs.push({
          id: crypto.randomUUID(),
          experimentId: this.experimentId,
          group: this.group,
          scenarioId: this.scenarioId,
          promptType: this.promptType,
          promptSource: this.promptSource,
          generatedPrompt: this.promptText || null,
          action,
          choice,
          uncivil: this.isUncivil,
          riskFeatures: [...this.riskFeatures],
          originalComment: this.originalComment,
          modifiedComment: action === "modify" ? modifiedComment : null,
          finalSubmittedComment,
          promptFeedback: null,
          postSurvey: null,
          decisionLatencyMs: this.decisionLatencyMs,
          createdAt: new Date().toISOString(),
          trackerEvents: tracker.getEvents()
        });
        if (this.logs.length > MAX_LOCAL_LOGS) {
          this.logs.splice(0, this.logs.length - MAX_LOCAL_LOGS);
        }

        this.persistState();
        if (this.requestControllers.action === controller) {
          this.requestControllers.action = null;
        }
        this.loading.action = false;
      }

      return { success: true };
    },
    async saveExperimentFeedback() {
      if (!this.experimentId || !this.finalAction || this.feedbackSubmitted) {
        return;
      }

      this.loading.feedback = true;
      this.lastError = "";

      const payload = {
        experiment_id: this.experimentId,
        post_survey: {
          reflection_gain: this.postSurvey.reflectionGain,
          real_world_adoption: this.postSurvey.realWorldAdoption,
          open_feedback: this.postSurvey.openFeedback?.trim() || ""
        },
        decision_latency_ms: this.decisionLatencyMs || 0
      };

      if (this.isUncivil) {
        payload.prompt_feedback = {
          helpfulness: this.promptFeedback.helpfulness,
          friendliness: this.promptFeedback.friendliness,
          relevance: this.promptFeedback.relevance
        };
      }

      try {
        await apiClient.post("/experiment/feedback", payload);
        this.setRuntimeState("online", "");
      } catch (error) {
        if (!isLikelyNetworkError(error)) {
          this.lastError = error.message;
          this.loading.feedback = false;
          throw error;
        }

        this.setRuntimeState("offline", "反馈已保存在当前浏览器中，服务器恢复后可再同步。");
        this.lastError = this.runtimeNotice;
      }

      this.feedbackSubmitted = true;
      this.updateLatestLog({
        promptFeedback: this.isUncivil ? { ...this.promptFeedback } : null,
        postSurvey: { ...this.postSurvey },
        decisionLatencyMs: this.decisionLatencyMs
      });

      this.persistState();
      this.loading.feedback = false;
    },
    async fetchDashboard({ group = "", scenarioId = "", limit = 100 } = {}) {
      this.loading.dashboard = true;
      this.lastError = "";

      try {
        const { data } = await apiClient.get("/experiment/dashboard", {
          params: {
            group: group || undefined,
            scenario_id: scenarioId || undefined,
            limit
          },
          headers: getAdminAuthHeaders()
        });

        this.setRuntimeState("online", "");
        this.dashboard = {
          ...data,
          allocation: data.allocation || this.dashboard.allocation || buildDefaultAllocation()
        };
        return data;
      } catch (error) {
        this.dashboard = buildDashboardFallback(this.logs, this.dashboard.allocation);

        if (isLikelyNetworkError(error)) {
          this.setRuntimeState("offline", "后台接口不可用，当前展示的是本地演示数据。");
          this.lastError = this.runtimeNotice;
        } else if (String(error?.message || "").includes("401")) {
          this.lastError = "未提供有效的管理令牌，当前仅展示本地演示数据。";
        } else {
          this.lastError = `${error.message}，当前已切换为本地演示数据。`;
        }

        return this.dashboard;
      } finally {
        this.loading.dashboard = false;
      }
    },
    async fetchPromptAllocation() {
      this.loading.allocation = true;
      this.lastError = "";

      try {
        const { data } = await apiClient.get("/experiment/allocation", {
          headers: getAdminAuthHeaders()
        });
        this.dashboard = { ...this.dashboard, allocation: data };
        this.setRuntimeState("online", "");
        return data;
      } catch (error) {
        this.lastError = error.message;
        throw error;
      } finally {
        this.loading.allocation = false;
      }
    },
    async updatePromptAllocation(weights) {
      this.loading.allocation = true;
      this.lastError = "";

      try {
        const { data } = await apiClient.put("/experiment/allocation", weights, {
          headers: getAdminAuthHeaders()
        });
        this.dashboard = { ...this.dashboard, allocation: data };
        this.setRuntimeState("online", "");
        return data;
      } catch (error) {
        this.lastError = error.message;
        throw error;
      } finally {
        this.loading.allocation = false;
      }
    }
  }
});
