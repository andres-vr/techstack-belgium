<template>
  <button
    @click="toggle"
    :aria-pressed="isDark"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    class="inline-flex items-center gap-2 px-2 py-1 md:px-3 rounded-md border transition-colors"
  >
    <span class="md:hidden">{{ isDark ? "🌙" : "☀️" }}</span>
    <span class="hidden md:inline">{{ isDark ? "🌙 Dark" : "☀️ Light" }}</span>
  </button>
</template>

<script setup lang="ts">
const isDark = ref(false);

function apply(dark: boolean) {
  const root = document.documentElement;
  if (dark) root.classList.add("dark");
  else root.classList.remove("dark");
}

function toggle() {
  isDark.value = !isDark.value;
  apply(isDark.value);
  try {
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  } catch (e) {}
}

onMounted(() => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) {
      isDark.value = saved === "dark";
      apply(isDark.value);
      return;
    }
  } catch (e) {}

  // Default to light mode when no saved preference exists
  isDark.value = false;
  apply(false);
});
</script>
