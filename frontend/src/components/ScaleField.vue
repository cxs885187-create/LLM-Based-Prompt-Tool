<template>
  <div class="panel-soft p-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-slate-900">{{ label }}</p>
        <p v-if="hint" class="mt-1 text-xs leading-5 text-slate-500">{{ hint }}</p>
      </div>
      <span class="chip chip-gold">{{ modelValue }}/5</span>
    </div>

    <div class="mt-4 grid grid-cols-5 gap-2">
      <button
        v-for="value in [1, 2, 3, 4, 5]"
        :key="value"
        type="button"
        class="rounded-2xl border px-3 py-3 text-sm font-semibold transition"
        :class="modelValue === value
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'"
        @click="$emit('update:modelValue', value)"
      >
        {{ value }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  hint: {
    type: String,
    default: ""
  },
  modelValue: {
    type: Number,
    required: true
  }
});

defineEmits(["update:modelValue"]);
</script>
