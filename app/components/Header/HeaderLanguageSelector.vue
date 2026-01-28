<template>
  <select
    aria-label="Choose language"
    class="border px-2 py-1 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
    :value="locale"
    @change="changeLocale"
  >
    <option v-for="opt in options" :key="opt.code" :value="opt.code">
      {{ opt.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
import type { Locale } from '~~/types';

const { locale, setLocale } = useI18n();

const options = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

function changeLocale(event: Event) {
  const target = event.target as HTMLSelectElement;
  const newLocale = target.value;
  if (newLocale && newLocale !== locale.value) {
    setLocale(newLocale as Locale);
  }
}
</script>
