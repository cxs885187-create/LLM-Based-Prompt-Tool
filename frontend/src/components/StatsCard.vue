<template>
  <article class="metric-card">
    <p class="section-label">{{ label }}</p>
    <p class="metric-value">{{ value }}</p>
    <p v-if="hint" class="mt-2 text-sm leading-6 text-slate-500">{{ hint }}</p>
  </article>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  hint: {
    type: String,
    default: ""
  }
});
</script>
