const marks = new Map();
const events = [];

function now() {
  return performance.now();
}

function stamp() {
  return new Date().toISOString();
}

export const tracker = {
  start(name) {
    marks.set(name, now());
    events.push({ type: "timer_start", name, at: stamp() });
  },
  end(name, payload = {}) {
    const start = marks.get(name);
    const durationMs = start ? Math.round((now() - start) * 100) / 100 : null;
    if (marks.has(name)) {
      marks.delete(name);
    }
    const event = { type: "timer_end", name, durationMs, at: stamp(), ...payload };
    events.push(event);
    return durationMs;
  },
  log(type, payload = {}) {
    events.push({ type, at: stamp(), ...payload });
  },
  getEvents() {
    return [...events];
  },
  reset() {
    marks.clear();
    events.length = 0;
  }
};
