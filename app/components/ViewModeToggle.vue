<template>
  <button
    @click="handleToggle"
    class="flex items-center gap-2 px-4 py-2 bg-surface border border-surface rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  >
    <span v-if="viewMode === 'grid'">🗺️ Map</span>
    <span v-else>⊞ Grid</span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  viewMode: "grid" | "map";
}>();

const emit = defineEmits<{
  (e: "update:viewMode", value: "grid" | "map"): void;
}>();

function handleToggle() {
  emit("update:viewMode", props.viewMode === "grid" ? "map" : "grid");
}
</script>
