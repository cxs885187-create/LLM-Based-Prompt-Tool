<template>
  <article class="panel p-5">
    <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ label }}</p>
    <p class="mt-2 text-3xl font-display font-bold text-slate-900">{{ value }}</p>
    <p v-if="hint" class="mt-2 text-sm text-slate-500">{{ hint }}</p>
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
