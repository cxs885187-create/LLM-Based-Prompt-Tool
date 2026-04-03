import { defineStore } from "pinia";

import { apiClient } from "../api/http";
import { tracker } from "../utils/hci_tracker";

const STORAGE_KEY = "experiment_state_v1";
export const ADMIN_TOKEN_STORAGE_KEY = "dashboard_admin_token_v1";
const MAX_LOCAL_LOGS = 200;

const scenarios = [
  {
    id: "campus-traffic",
    title: "校园交通事故",
    topic: "校园安全",
    context: "校门口附近发生交通事故后，讨论迅速升级，出现情绪化表达。",
    riskLevel: "高",
    authorName: "校园观察员",
    authorHandle: "@campus_watch",
    postTime: "2 分钟前",
    postText:
      "刚在东门看到一起事故：一辆电动车闯红灯把行人撞倒了，现场很混乱。大家讨论交通治理时，能不能也关注下校园里越来越激进的发言氛围？",
    stats: {
      replies: 42,
      reposts: 17,
      likes: 218,
      views: "1.3万"
    },
    seedReplies: [
      {
        id: "ct-1",
        name: "理性讨论派",
        handle: "@thinkfirst",
        time: "1 分钟前",
        text: "先等警方通报吧，别急着下结论。"
      },
      {
        id: "ct-2",
        name: "早八路过",
        handle: "@morning_class",
        time: "刚刚",
        text: "我也在现场，确实挺危险，希望学校尽快处理。"
      }
    ]
  },
  {
    id: "grading-dispute",
    title: "课程给分争议",
    topic: "课程讨论",
    context: "给分争议引发同学之间互相指责，评论区两极分化明显。",
    riskLevel: "中",
    authorName: "课程吐槽Bot",
    authorHandle: "@grade_talk",
    postTime: "8 分钟前",
    postText:
      "这门课期末评分差异太大了，有人平时几乎不发言却拿了高分。大家觉得是评分标准不透明，还是我们误解了老师的要求？",
    stats: {
      replies: 36,
      reposts: 9,
      likes: 143,
      views: "9,862"
    },
    seedReplies: [
      {
        id: "gd-1",
        name: "作业党",
        handle: "@late_submitter",
        time: "4 分钟前",
        text: "建议把评分细则公开，这样争议会少很多。"
      },
      {
        id: "gd-2",
        name: "课程助教",
        handle: "@ta_notice",
        time: "2 分钟前",
        text: "可以先收集具体问题，再统一向老师反馈。"
      }
    ]
  },
  {
    id: "dorm-conflict",
    title: "宿舍矛盾",
    topic: "日常生活",
    context: "宿舍作息冲突引发点名指责，讨论正在快速情绪化。",
    riskLevel: "中",
    authorName: "宿舍生活墙",
    authorHandle: "@dorm_forum",
    postTime: "15 分钟前",
    postText:
      "凌晨一点还在外放视频，真的顶不住。反复沟通没用，现在连睡眠都保证不了。遇到这种室友行为，大家会怎么处理？",
    stats: {
      replies: 58,
      reposts: 12,
      likes: 305,
      views: "1.9万"
    },
    seedReplies: [
      {
        id: "dc-1",
        name: "早睡同盟",
        handle: "@sleepmatters",
        time: "10 分钟前",
        text: "先和辅导员沟通，别让冲突继续升级。"
      },
      {
        id: "dc-2",
        name: "冷静室友",
        handle: "@roommate_mode",
        time: "6 分钟前",
        text: "建议先定一个宿舍公约，写清楚安静时段。"
      }
    ]
  }
];

function buildDefaultAllocation() {
  return {
    weights: {
      empathy: 1,
      consequence: 1,
      normative: 1,
      alternative: 1,
      control: 1
    },
    normalized_ratio: {
      empathy: 0.2,
      consequence: 0.2,
      normative: 0.2,
      alternative: 0.2,
      control: 0.2
    },
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
  return {
    helpfulness: 4,
    friendliness: 4,
    relevance: 4
  };
}

function buildDefaultPostSurvey() {
  return {
    reflectionGain: 4,
    realWorldAdoption: 4,
    openFeedback: ""
  };
}

function getAdminAuthHeaders() {
  const token = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  if (!token || !token.trim()) {
    return {};
  }

  return {
    Authorization: `Bearer ${token.trim()}`
  };
}

function buildDefaultState() {
  return {
    mode: "participant",
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
    requestControllers: {
      check: null,
      action: null
    },
    lastError: "",
    logs: [],
    dashboard: {
      summary: null,
      distributions: {
        groups: {},
        actions: {},
        scenarios: {}
      },
      insights: {},
      allocation: buildDefaultAllocation(),
      records: []
    },
    scenarios
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

function buildDashboardFallback(logs, allocation) {
  const localRecords = logs.map((item) => ({
    experiment_id: item.experimentId,
    group: item.group,
    scenario_id: item.scenarioId,
    prompt_type: item.promptType,
    generated_prompt: item.generatedPrompt || null,
    original_comment: item.originalComment || null,
    modified_comment: item.modifiedComment || null,
    final_submitted_comment: item.finalSubmittedComment || null,
    final_action: item.action,
    prompt_feedback: item.promptFeedback || null,
    post_survey: item.postSurvey || null,
    decision_latency_ms: item.decisionLatencyMs || null,
    status: "completed",
    created_at: item.createdAt,
    updated_at: item.createdAt
  }));

  const feedbackRows = localRecords.filter((item) => item.post_survey);
  const average = (values) => {
    if (!values.length) {
      return null;
    }
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
  };

  return {
    summary: {
      total_records: localRecords.length,
      completed_records: localRecords.length,
      uncivil_triggered_records: localRecords.filter((item) => !!item.prompt_type).length
    },
    distributions: {
      groups: {},
      actions: {},
      scenarios: {}
    },
    insights: {
      modify_rate: localRecords.length
        ? Math.round(
          (localRecords.filter((item) => item.final_action === "modify").length / localRecords.length) * 100
        ) / 100
        : null,
      avg_helpfulness: average(feedbackRows.map((item) => item.prompt_feedback?.helpfulness).filter(Boolean)),
      avg_friendliness: average(feedbackRows.map((item) => item.prompt_feedback?.friendliness).filter(Boolean)),
      avg_relevance: average(feedbackRows.map((item) => item.prompt_feedback?.relevance).filter(Boolean)),
      avg_reflection_gain: average(feedbackRows.map((item) => item.post_survey?.reflection_gain).filter(Boolean)),
      avg_real_world_adoption: average(
        feedbackRows.map((item) => item.post_survey?.real_world_adoption).filter(Boolean)
      ),
      avg_decision_latency_ms: average(localRecords.map((item) => item.decision_latency_ms).filter(Boolean)),
      feedback_count: feedbackRows.length
    },
    allocation: allocation || buildDefaultAllocation(),
    records: localRecords
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
      const labels = {
        empathy: "共情提示",
        consequence: "后果提示",
        normative: "规范提示",
        alternative: "替代表达提示",
        control: "控制组提示"
      };
      return labels[state.promptType] || "暂无";
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

        this.experimentId = data.experiment_id;
        this.group = data.group;
        this.scenarioId = data.scenario_id;
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
          group: this.group
        });

        this.persistState();
        return data;
      } catch (error) {
        this.lastError = error.message;
        throw error;
      } finally {
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
          {
            experiment_id: this.experimentId,
            comment_text: commentText
          },
          {
            signal: controller.signal,
            timeout: 20000
          }
        );

        tracker.end("check_api_latency", { uncivil: data.is_uncivil });

        this.isUncivil = data.is_uncivil;
        this.promptText = data.prompt_text || "";
        this.promptType = data.prompt_type || "";
        this.promptSource = data.prompt_source || "";
        this.riskFeatures = data.risk_features || [];

        if (this.isUncivil) {
          tracker.start("intervention_decision_latency");
        }

        tracker.log("comment_checked", {
          isUncivil: this.isUncivil,
          promptType: this.promptType,
          riskFeatures: this.riskFeatures
        });

        this.persistState();
        return data;
      } catch (error) {
        if (error?.code === "ERR_CANCELED") {
          throw new Error("重复提交已取消，请等待当前请求完成。");
        }
        this.lastError = error.message;
        throw error;
      } finally {
        if (this.requestControllers.check === controller) {
          this.requestControllers.check = null;
        }
        this.loading.check = false;
      }
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

      try {
        if (this.isUncivil) {
          this.decisionLatencyMs = Math.round(tracker.end("intervention_decision_latency", { choice }) || 0);
        }

        tracker.start("action_api_latency");

        const payload = {
          experiment_id: this.experimentId,
          action
        };

        if (action === "modify") {
          payload.modified_comment = modifiedComment;
        }

        const { data } = await apiClient.post("/comment/action", payload, {
          signal: controller.signal,
          timeout: 20000
        });

        tracker.end("action_api_latency", { action, choice });
        tracker.end("full_journey", { action, choice });

        this.finalAction = action;
        this.modifiedComment = action === "modify" ? modifiedComment : "";
        const finalSubmittedComment =
          action === "modify"
            ? modifiedComment
            : action === "post"
              ? this.originalComment
              : null;

        this.logs.push({
          id: crypto.randomUUID(),
          experimentId: this.experimentId,
          group: this.group,
          scenarioId: this.scenarioId,
          promptType: this.promptType,
          generatedPrompt: this.promptText || null,
          action,
          choice,
          uncivil: this.isUncivil,
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

        tracker.log("action_submitted", { action, choice, success: data.success });
        this.persistState();
        return data;
      } catch (error) {
        if (error?.code === "ERR_CANCELED") {
          throw new Error("重复提交已取消，请等待当前请求完成。");
        }
        this.lastError = error.message;
        throw error;
      } finally {
        if (this.requestControllers.action === controller) {
          this.requestControllers.action = null;
        }
        this.loading.action = false;
      }
    },
    async saveExperimentFeedback() {
      if (!this.experimentId || !this.finalAction || this.feedbackSubmitted) {
        return;
      }

      this.loading.feedback = true;
      this.lastError = "";

      try {
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

        await apiClient.post("/experiment/feedback", payload);
        this.feedbackSubmitted = true;

        const latestLog = [...this.logs].reverse().find((item) => item.experimentId === this.experimentId);
        if (latestLog) {
          latestLog.promptFeedback = this.isUncivil ? { ...this.promptFeedback } : null;
          latestLog.postSurvey = { ...this.postSurvey };
          latestLog.decisionLatencyMs = this.decisionLatencyMs;
        }

        this.persistState();
      } catch (error) {
        this.lastError = error.message;
        throw error;
      } finally {
        this.loading.feedback = false;
      }
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

        this.dashboard = {
          ...data,
          allocation: data.allocation || this.dashboard.allocation || buildDefaultAllocation()
        };
        return data;
      } catch (error) {
        if (
          error?.message?.includes("管理令牌") ||
          error?.message?.includes("401")
        ) {
          this.lastError = error.message;
          throw error;
        }

        this.dashboard = buildDashboardFallback(this.logs, this.dashboard.allocation);
        this.lastError = `${error.message}（已切换为本地日志数据）`;
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
        this.dashboard = {
          ...this.dashboard,
          allocation: data
        };
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
        this.dashboard = {
          ...this.dashboard,
          allocation: data
        };
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
