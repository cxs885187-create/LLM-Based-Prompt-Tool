import { createRouter, createWebHistory } from "vue-router";

import Dashboard from "../views/Dashboard.vue";
import Debrief from "../views/Debrief.vue";
import Intro from "../views/Intro.vue";
import Landing from "../views/Landing.vue";
import Scenario from "../views/Scenario.vue";

const STORAGE_KEY = "experiment_state_v1";

const routes = [
  { path: "/", name: "landing", component: Landing },
  { path: "/intro", name: "intro", component: Intro },
  { path: "/scenario", name: "scenario", component: Scenario },
  { path: "/debrief", name: "debrief", component: Debrief },
  { path: "/dashboard", name: "dashboard", component: Dashboard },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

function loadExperimentState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

router.beforeEach((to) => {
  const state = loadExperimentState();
  const hasScenarioAccess = Boolean(state.experimentId && state.scenarioId);
  const hasDebriefAccess = Boolean(state.experimentId && state.finalAction);

  if (to.name === "scenario" && !hasScenarioAccess) {
    return { name: "intro" };
  }

  if (to.name === "debrief" && !hasDebriefAccess) {
    if (hasScenarioAccess) {
      return { name: "scenario" };
    }
    return { name: "intro" };
  }

  return true;
});

export default router;
