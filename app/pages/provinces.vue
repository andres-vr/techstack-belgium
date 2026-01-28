<template>
  <div class="h-full flex flex-col">
    <main
      class="flex-1 min-h-0 w-[min(90dvw,1200px)] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4 overflow-y-auto"
    >
      <div>
        <h1 class="text-2xl font-bold">
          {{ t("search.byProvince") }}
        </h1>
        <p class="text-sm text-muted">
          {{ provincesCount }} {{ t("index.provinces") }}
        </p>
      </div>
      <div class="space-y-3">
        <h2 class="text-xl font-semibold mb-4 mt-8">{{ t("provinces.brussels") }}</h2>
        <div v-if="brussels" class="flex">
          <NuxtLink
            :to="localePath(`/companies/provinces/${brussels.id}`)"
            :title="`${brussels.name} — ${companyCountLabel(brussels.companies)}`"
            class="bg-surface border border-surface rounded p-4 text-left hover:border-surface w-full md:w-1/3"
          >
            <div class="font-semibold">{{ brussels.name }}</div>
            <div class="text-sm text-muted">
              {{ t("index.companiesCount", { count: brussels.companies }) }}
            </div>
          </NuxtLink>
        </div>
        <h2 class="text-xl font-semibold mb-4 mt-8">{{ t("provinces.flanders") }}</h2>
        <div v-if="flanders.length" class="flex gap-4 flex-wrap items-stretch">
          <NuxtLink
            v-for="p in flanders"
            :key="p.id"
            :to="localePath(`/companies/provinces/${p.id}`)"
            :title="`${p.name} — ${companyCountLabel(p.companies)}`"
            class="bg-surface border border-surface rounded p-4 text-left hover:border-surface flex-1"
          >
            <div class="font-semibold">{{ p.name }}</div>
            <div class="text-sm text-muted">
              {{ t("index.companiesCount", { count: p.companies }) }}
            </div>
          </NuxtLink>
        </div>
        <h2 class="text-xl font-semibold mb-4 mt-8">{{ t("provinces.wallonia") }}</h2>
        <div v-if="wallonia.length" class="flex gap-4 flex-wrap items-stretch">
          <NuxtLink
            v-for="p in wallonia"
            :key="p.id"
            :to="localePath(`/companies/provinces/${p.id}`)"
            :title="`${p.name} — ${companyCountLabel(p.companies)}`"
            class="bg-surface border border-surface rounded p-4 text-left hover:border-surface flex-1"
          >
            <div class="font-semibold">{{ p.name }}</div>
            <div class="text-sm text-muted">
              {{ t("index.companiesCount", { count: p.companies }) }}
            </div>
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import provincesData from "~/data/provinces";
import type { Locale } from "~~/types";

const { getAllCompanies } = useCompanies();
const companies = getAllCompanies();
const localePath = useLocalePath();
const { locale, t } = useI18n();
const companyCountLabel = useCountLabel();

const provinceCounts = computed(() => {
  const map = new Map<string, number>();
  for (const c of companies) {
    const seen = new Set<string>();
    for (const loc of c.locations ?? []) {
      if (!seen.has(loc.province)) {
        map.set(loc.province, (map.get(loc.province) || 0) + 1);
        seen.add(loc.province);
      }
    }
  }
  return map;
});

const provincesWithCounts = computed(() => {
  return provincesData
    .map((p) => ({
      id: p.id,
      name: p.names[locale.value as Locale] ?? p.names.en,
      companies: provinceCounts.value.get(p.id) || 0,
    }))
    .filter((p) => p.companies > 0)
    .sort((a, b) => b.companies - a.companies);
});

const flandersOrder = [
  "antwerp",
  "east-flanders",
  "west-flanders",
  "flemish-brabant",
  "limburg",
];

const walloniaOrder = [
  "hainaut",
  "liege",
  "luxembourg",
  "namur",
  "walloon-brabant",
];

const provincesMap = computed(() => {
  const m = new Map<string, any>();
  for (const p of provincesWithCounts.value) m.set(p.id, p);
  return m;
});

const flanders = computed(() =>
  flandersOrder.map((id) => provincesMap.value.get(id)).filter(Boolean),
);
const wallonia = computed(() =>
  walloniaOrder.map((id) => provincesMap.value.get(id)).filter(Boolean),
);
const brussels = computed(
  () => provincesMap.value.get("brussels-capital") ?? null,
);

const provincesCount = computed(() => provincesData.length);

// Override head/title for provinces index to use a search-oriented title
const provincesPageTitle = computed(() => {
  const count = companies.length || 0;
  return `${count ? count + " " : ""}${t("search.byProvince")}`;
});
useHead({ title: provincesPageTitle });
</script>
