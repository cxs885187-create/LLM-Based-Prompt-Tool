<template>
  <div class="panel-soft p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-slate-900">{{ label }}</p>
      <span class="text-sm font-semibold text-slate-500">{{ value }}</span>
    </div>
    <div class="data-bar">
      <span :style="{ width: `${percent}%` }"></span>
    </div>
  </div>
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
  percent: {
    type: Number,
    required: true
  }
});
</script>
