<template>
  <div>
    <main class="w-[min(90dvw,1200px)] mx-auto px-4 sm:px-6 py-10 pt-20">
      <!-- Page title -->
      <div class="mb-6">
        <h1 class="text-2xl md:text-3xl font-bold mb-4">
          {{ seoData.h1 || t("seo.h1Default") }}
        </h1>
        <p class="text-xs md:text-sm text-muted">
          {{ seoData.intro }}
        </p>
      </div>

      <!-- Company search -->
      <div class="mb-8">
        <div
          class="bg-surface border border-surface rounded p-4 shadow-sm relative overflow-visible"
        >
          <div class="relative">
            <NuxtImg
              src="/icons/search.svg"
              alt="search"
              aria-hidden="true"
              class="text-blue-500 w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
              width="16"
              height="16"
            />
            <input
              v-model="searchQuery"
              :placeholder="t('index.search')"
              class="w-full pl-10 pr-4 py-2 dark:bg-black border border-surface rounded relative z-0 text-sm"
              @click="open = true"
            />
          </div>
          <div
            v-if="open === true && matchingCompanies.length > 0"
            class="mt-8 absolute left-4 right-4 z-[9999] max-h-[50dvh] overflow-y-auto bg-surface p-4"
          >
            <p class="text-xs md:text-sm text-muted mt-2">
              {{ companiesRef.length }} {{ t("index.companiesFound") }}
            </p>
            <div v-for="company in matchingCompanies" :key="company.name">
              <NuxtLink
                :to="localePath(`/companies/${getSlug(company.name)}`)"
                class="block py-2 hover:underline text-sm"
              >
                {{ company.name }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <NuxtLink
          :to="localePath('/companies')"
          class="bg-surface border border-surface rounded p-4 text-center hover:border-indigo-500 transition"
        >
          <div class="text-xl md:text-2xl font-bold">
            {{ completedCompaniesCount }} / {{ totalCompanies }}
          </div>
          <div class="text-xs md:text-sm text-muted">
            {{ t("index.companies") }}
          </div>
        </NuxtLink>
        <NuxtLink
          :to="localePath('/technologies')"
          class="bg-surface border border-surface rounded p-4 text-center hover:border-indigo-500 transition"
        >
          <div class="text-xl md:text-2xl font-bold">
            {{ uniqueTechnologies }}
          </div>
          <div class="text-xs md:text-sm text-muted">
            {{ t("index.technologies") }}
          </div>
        </NuxtLink>
        <NuxtLink
          :to="localePath('/municipalities')"
          class="bg-surface border border-surface rounded p-4 text-center hover:border-indigo-500 transition"
        >
          <div class="text-xl md:text-2xl font-bold">
            {{ municipalityCount }}
          </div>
          <div class="text-xs md:text-sm text-muted">
            {{ t("index.municipalities") }}
          </div>
        </NuxtLink>
        <NuxtLink
          :to="localePath('/provinces')"
          class="bg-surface border border-surface rounded p-4 text-center hover:border-indigo-500 transition"
        >
          <div class="text-xl md:text-2xl font-bold">
            {{ provinces.length }}
          </div>
          <div class="text-xs md:text-sm text-muted">
            {{ t("index.provinces") }}
          </div>
        </NuxtLink>
      </div>

      <div class="w-full h-[50dvh] md:h-[70dvh] rounded-2xl mb-8">
        <CompanyMap :companies="companies" />
      </div>

      <!-- Provinces -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg md:text-xl font-bold">
            {{ t("index.provinces") }}
          </h2>
          <NuxtLink
            :to="localePath('/provinces')"
            class="text-xs md:text-sm text-muted hover:text-primary flex items-center gap-1"
          >
            {{ t("index.viewAll") }}
            <NuxtImg
              src="/icons/arrow-right.svg"
              alt="arrow right"
              class="text-blue-500 w-4 h-4"
              width="14"
              height="14"
            />
          </NuxtLink>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-4">
          <NuxtLink
            v-for="p in provincesGrid"
            :to="localePath(`/companies/provinces/${p.id}`)"
            :key="p.id"
            :title="`${p.name} — ${companyCountLabel(p.companies)}`"
            :class="[
              'bg-surface border border-surface rounded p-3 md:p-4 text-left hover:border-indigo-500 transition min-w-0',
              p.id === 'brussels-capital' ? 'row-span-2 md:row-span-2' : '',
            ]"
          >
            <div
              :class="[
                'font-semibold text-sm',
                p.id === 'brussels-capital' ? 'whitespace-normal' : 'truncate',
              ]"
            >
              {{ p.name }}
            </div>
            <div class="text-xs text-muted">
              {{ companyCountLabel(p.companies) }}
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Municipalities -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg md:text-xl font-bold">
            {{ t("index.municipalities") }}
          </h2>
          <NuxtLink
            :to="localePath('/municipalities')"
            class="text-xs md:text-sm text-muted hover:text-primary flex items-center gap-1"
          >
            {{ t("index.viewAll") }}
            <NuxtImg
              src="/icons/arrow-right.svg"
              alt="arrow right"
              class="text-blue-500 w-4 h-4"
              width="14"
              height="14"
            />
          </NuxtLink>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-4">
          <NuxtLink
            v-for="m in topMunicipalities"
            :to="
              localePath(
                `/companies/provinces/${m.province}/municipalities/${m.id}`,
              )
            "
            :key="m.name"
            :title="`${m.name} — ${companyCountLabel(m.companies)}`"
            class="bg-surface border border-surface rounded p-4 text-left hover:border-surface"
          >
            <div class="flex items-center gap-2 mb-1 min-w-0">
              <NuxtImg
                src="/icons/map-pin.svg"
                alt="location"
                class="text-blue-500 w-4 h-4"
                width="16"
                height="16"
              />
              <div class="font-semibold truncate">{{ m.name }}</div>
            </div>
            <div class="text-sm text-muted">
              {{ companyCountLabel(m.companies) }}
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Technologies -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">{{ t("index.technologies") }}</h2>
          <NuxtLink
            :to="localePath('/technologies')"
            class="text-sm text-muted hover:text-primary flex items-center gap-1"
          >
            {{ t("index.viewAll") }}
            <NuxtImg
              src="/icons/arrow-right.svg"
              alt="arrow right"
              class="text-blue-500 w-4 h-4"
              width="14"
              height="14"
            />
          </NuxtLink>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
          <NuxtLink
            v-for="t in topTechnologies"
            :to="localePath(`/companies/technologies/${getSlug(t.name)}`)"
            :key="t.name"
            :title="`${t.name} — ${companyCountLabel(t.companies)}`"
            class="bg-surface border border-surface rounded p-4 text-left hover:border-surface"
          >
            <div class="flex items-center gap-2 mb-1 min-w-0">
              <NuxtImg
                :src="techUtil.getLogoUrl(t.name)"
                preset="logo"
                sizes="20px"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width="20"
                height="20"
                :alt="t.name + ' logo'"
                class="object-contain"
              />
              <div class="font-semibold truncate">{{ t.name }}</div>
            </div>
            <div class="text-sm text-muted">
              {{ companyCountLabel(t.companies) }}
            </div>
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import provincesData from "~/data/provinces";
import type { Locale } from "~~/types";

const localePath = useLocalePath();
const { locale, t } = useI18n();
const companyCountLabel = useCountLabel();
const searchQuery = ref("");
const techUtil = useTech();
const open = ref(false);
const { getSlug } = useCompany();
const companiesService = useCompanies();
const companies = companiesService.getAllCompanies();
const completedCompaniesCount = computed(
  () => companiesService.getCompleteCompanies().length,
);

// load municipality lists to resolve localized names
const munModules = import.meta.glob("~/data/municipalities/*.ts") as Record<
  string,
  () => Promise<any>
>;
const municipalityMap = ref<Record<string, any>>({});

onMounted(async () => {
  const mods = await Promise.all(Object.values(munModules).map((m) => m()));
  const all = mods.flatMap((m: any) => Object.values(m)).flat();
  municipalityMap.value = all.reduce(
    (acc: Record<string, any>, item: any) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<string, any>,
  );
});

const matchingCompanies = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (query === "") {
    return [];
  }
  return companies
    .filter((c) => c.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const totalCompanies = computed(() => companies.length);

const technologyCounts = computed(() => {
  const map = new Map<string, number>();
  for (const c of companies) {
    for (const t of c.tech ?? []) {
      map.set(t, (map.get(t) || 0) + 1);
    }
  }
  return map;
});

const uniqueTechnologies = computed(() => technologyCounts.value.size);

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

const provinces = computed(() => {
  return provincesData
    .map((p) => ({
      id: p.id,
      name: p.names[locale.value as Locale] ?? p.names.en,
      companies: provinceCounts.value.get(p.id) || 0,
    }))
    .filter((p) => p.companies > 0)
    .sort((a, b) => b.companies - a.companies);
});

// Custom provinces grid ordering: Brussels first (spans two rows), then
// fill first row with Flemish provinces and second row with Walloon provinces.
const provincesGrid = computed(() => {
  const byId = Object.fromEntries(
    (provinces.value || []).map((p: any) => [p.id, p]),
  );

  const flandersOrder = [
    "west-flanders",
    "east-flanders",
    "antwerp",
    "flemish-brabant",
    "limburg",
  ];
  const walloniaOrder = [
    "hainaut",
    "walloon-brabant",
    "namur",
    "liege",
    "luxembourg",
  ];

  const out: any[] = [];

  // Add Brussels first if present
  if (byId["brussels-capital"]) out.push(byId["brussels-capital"]);

  // Fill first row with Flemish provinces (preserve counts if present)
  for (const id of flandersOrder) {
    if (byId[id]) out.push(byId[id]);
  }

  // Fill second row with Walloon provinces
  for (const id of walloniaOrder) {
    if (byId[id]) out.push(byId[id]);
  }

  // If any other provinces remain (edge cases), append them
  for (const p of provinces.value) {
    if (!out.find((o: any) => o.id === p.id)) out.push(p);
  }

  return out;
});

const municipalityCounts = computed(() => {
  const map = new Map<string, number>();
  for (const c of companies) {
    const seen = new Set<string>();
    for (const loc of c.locations ?? []) {
      const key = `${loc.province}::${loc.municipality}`;
      if (!seen.has(key)) {
        map.set(key, (map.get(key) || 0) + 1);
        seen.add(key);
      }
    }
  }
  return map;
});

const topMunicipalities = computed(() => {
  const items = Array.from(municipalityCounts.value.entries()).map(
    ([key, count]) => {
      const [province, muni = ""] = key.split("::");
      const entry = municipalityMap.value[muni as string];
      const name = entry
        ? ((entry.names as Record<string, string>)[
            (locale.value as string) || "en"
          ] ?? entry.names.en)
        : muni;
      return { province, id: muni, name, companies: count };
    },
  );
  return items.sort((a, b) => b.companies - a.companies).slice(0, 14);
});

const topTechnologies = computed(() => {
  return Array.from(technologyCounts.value.entries())
    .map(([name, companies]) => ({ name, companies }))
    .sort((a, b) => b.companies - a.companies)
    .slice(0, 12);
});

const municipalityCount = computed(() => municipalityCounts.value.size);

// expose SEO for the index page and use its h1 in the template
const companiesRef = ref(companies);
const { seoData } = useAppSEO({
  count: totalCompanies.value,
  companies: companiesRef.value,
});
</script>
