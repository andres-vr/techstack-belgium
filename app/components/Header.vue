<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-surface"
  >
    <div
      class="w-[min(90dvw,1200px)] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <NuxtImg
          src="/icons/layers.svg"
          alt="Layers icon"
          width="24"
          height="24"
        />
        <NuxtLink to="/" class="text-lg sm:text-xl font-bold text-primary"
          >techstack</NuxtLink
        >
      </div>

      <nav class="hidden md:flex items-center gap-6 text-sm text-muted">
        <NuxtLink
          :to="localePath('/companies/')"
          :title="t('nav.companies')"
          class="hover:text-indigo-600"
          >{{ t("nav.companies") }}</NuxtLink
        >
        <NuxtLink
          :to="localePath('/provinces')"
          :title="t('nav.provinces')"
          class="hover:text-indigo-600"
          >{{ t("nav.provinces") }}</NuxtLink
        >
        <NuxtLink
          :to="localePath('/municipalities')"
          :title="t('nav.municipalities')"
          class="hover:text-indigo-600"
          >{{ t("nav.municipalities") }}</NuxtLink
        >
        <NuxtLink
          :to="localePath('/technologies')"
          :title="t('nav.technologies')"
          class="hover:text-indigo-600"
          >{{ t("nav.technologies") }}</NuxtLink
        >
      </nav>

      <!-- Mobile hamburger menu -->
      <button
        v-if="menuOpen"
        @click="menuOpen = false"
        class="md:hidden fixed inset-0 z-40"
        aria-label="Close menu"
      />
      <div
        v-if="menuOpen"
        class="md:hidden fixed top-16 left-0 right-0 bg-surface border-b border-surface z-50 shadow-lg"
      >
        <nav class="flex flex-col items-start p-4 gap-4 text-sm text-muted">
          <NuxtLink
            :to="localePath('/companies/')"
            :title="t('nav.companies')"
            class="hover:text-indigo-600 w-full"
            @click="menuOpen = false"
            >{{ t("nav.companies") }}</NuxtLink
          >
          <NuxtLink
            :to="localePath('/provinces')"
            :title="t('nav.provinces')"
            class="hover:text-indigo-600 w-full"
            @click="menuOpen = false"
            >{{ t("nav.provinces") }}</NuxtLink
          >
          <NuxtLink
            :to="localePath('/municipalities')"
            :title="t('nav.municipalities')"
            class="hover:text-indigo-600 w-full"
            @click="menuOpen = false"
            >{{ t("nav.municipalities") }}</NuxtLink
          >
          <NuxtLink
            :to="localePath('/technologies')"
            :title="t('nav.technologies')"
            class="hover:text-indigo-600 w-full"
            @click="menuOpen = false"
            >{{ t("nav.technologies") }}</NuxtLink
          >
        </nav>
      </div>

      <div class="flex items-center gap-2 md:gap-3">
        <HeaderLanguageSelector />
        <HeaderDarkModeToggle />
        <button
          @click="menuOpen = !menuOpen"
          class="md:hidden p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
          :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
        >
          <svg
            v-if="!menuOpen"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            v-else
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();
const menuOpen = ref(false);
</script>
