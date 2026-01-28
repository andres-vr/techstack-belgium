<template>
  <div>
    <main class="w-[min(90dvw,1200px)] mx-auto px-4 sm:px-6 py-10 pt-4">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl md:text-2xl font-bold">
            {{ t("search.byTechnology") }}
          </h1>
          <p class="text-xs md:text-sm text-muted">
            {{ techsCount }} {{ t("index.technologies") }}
          </p>
        </div>
      </div>

      <!-- Tech per category -->
      <div v-for="cat in categoriesWithCounts" :key="cat.key" class="mb-8">
        <h3 class="text-base md:text-lg font-semibold mb-3">{{ cat.label }}</h3>
        <div class="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-4">
          <NuxtLink
            v-for="t in techsByCategory[cat.key] || []"
            :key="t.name"
            :to="localePath(`/companies/technologies/${slug(t.name)}`)"
            :title="`${t.name} — ${companyCountLabel(t.companies)}`"
            class="bg-surface border border-surface rounded p-3 md:p-4 text-left hover:border-indigo-500 transition"
          >
            <div class="flex items-center gap-2 mb-1 min-w-0">
              <NuxtImg
                :src="techUtil.getLogoUrl(t.name)"
                preset="logo"
                sizes="20px"
                width="20"
                height="20"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                :alt="t.name + ' logo'"
                class="object-contain"
              />
              <div class="font-semibold truncate text-sm">{{ t.name }}</div>
            </div>
            <div class="text-xs md:text-sm text-muted">
              {{ companyCountLabel(t.companies) }}
            </div>
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { categories } from "~/data/categories";
import techList from "~/data/tech";

const { t } = useI18n();
const { getCompleteCompanies } = useCompanies();
const companies = getCompleteCompanies();

if (import.meta.env.DEV) {
  // Help debugging when counts are unexpectedly zero
  // eslint-disable-next-line no-console
  console.debug("[technologies] companies count:", companies.length);
}
const localePath = useLocalePath();
const techUtil = useTech();
const companyCountLabel = useCountLabel();
const { getSlug } = useCompany();

// count companies per tech name
const techCounts = computed(() => {
  const map = new Map<string, number>();
  for (const c of companies) {
    const seen = new Set<string>();
    for (const t of c.tech ?? []) {
      if (!seen.has(t)) {
        map.set(t, (map.get(t) || 0) + 1);
        seen.add(t);
      }
    }
  }
  return map;
});

// for each category compute how many companies use any tech in that category
const categoryCounts = computed(() => {
  const catMap = new Map<string, number>();
  const techByCategory = techList.reduce(
    (acc: Record<string, string[]>, t: { category: string; name: string }) => {
      const arr = acc[t.category] || [];
      arr.push(t.name);
      acc[t.category] = arr;
      return acc;
    },
    {} as Record<string, string[]>,
  );

  for (const c of companies) {
    const seenCats = new Set<string>();
    for (const t of c.tech ?? []) {
      for (const [cat, names] of Object.entries(techByCategory)) {
        if (names.includes(t) && !seenCats.has(cat)) {
          catMap.set(cat, (catMap.get(cat) || 0) + 1);
          seenCats.add(cat);
        }
      }
    }
  }
  return { catMap, techByCategory };
});

const categoriesWithCounts = computed(() => {
  const catMap = categoryCounts.value?.catMap ?? new Map<string, number>();
  return categories
    .map((c) => ({
      key: c.key,
      label: c.label,
      companies: catMap.get(c.key) || 0,
    }))
    .filter((c) => c.companies > 0);
});

// per-category techs with counts
const techsByCategory = computed(() => {
  const techByCategory =
    categoryCounts.value?.techByCategory ?? ({} as Record<string, string[]>);
  const result: Record<string, { name: string; companies: number }[]> = {};
  for (const [cat, names] of Object.entries(techByCategory)) {
    const entries = names
      .map((name) => ({ name, companies: techCounts.value.get(name) || 0 }))
      .filter((e) => e.companies > 0)
      .sort((a, b) => b.companies - a.companies);
    result[cat] = entries;
  }
  return result;
});

const slug = (s: string) => getSlug(s);

const techsCount = computed(() => {
  // Count only technologies that are actually used by at least one company
  return Object.values(techsByCategory.value || {}).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0,
  );
});
</script>
