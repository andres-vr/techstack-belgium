<template>
  <div class="w-[min(90dvw,1200px)] mx-auto px-6 py-10">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mt-4">
        {{ seoData.h1 || provinceLabel }}
      </h1>
      <p class="text-sm text-muted mt-1">
        {{ seoData.intro }}
      </p>
      <p class="text-sm text-muted mt-1">
        {{ municipalitiesWithCompanies.length }} {{ t("index.municipalities") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
      <NuxtLink
        v-for="mun in municipalitiesWithCompanies"
        :key="mun.id"
        :to="
          localePath(
            `companies/provinces/${provinceId}/municipalities/${mun.id}`,
          )
        "
        class="bg-surface border border-surface rounded p-4 text-left hover:border-surface min-w-0 cursor-pointer"
      >
        <div class="font-semibold truncate">{{ mun.name }}</div>
        <div class="text-sm text-muted">
          {{ companyCountLabel(mun.companiesCount) }}
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getAllCompanies } = useCompanies();
const companies = getAllCompanies();
const route = useRoute();
const provinceId = computed(() => (route.params.province as string) || "");

const { getMunicipalities } = useLocations();
const { getProvinceName } = useProvince();
const { t, locale } = useI18n();
const localePath = useLocalePath();
const companyCountLabel = useCountLabel();

const municipalitiesWithCompanies = computed(() => {
  const allMunis = getMunicipalities(provinceId.value);
  const counts = new Map<string, number>();

  for (const c of companies) {
    const seen = new Set<string>();
    for (const loc of c.locations ?? []) {
      if (loc.province === provinceId.value) {
        if (!seen.has(loc.municipality)) {
          counts.set(loc.municipality, (counts.get(loc.municipality) || 0) + 1);
          seen.add(loc.municipality);
        }
      }
    }
  }

  return allMunis
    .map((m) => ({
      ...m,
      companiesCount: counts.get(m.id) || 0,
    }))
    .filter((m) => m.companiesCount > 0)
    .sort((a, b) => b.companiesCount - a.companiesCount);
});

const provinceLabel = computed(() => {
  const loc = (locale as any)?.value || "en";
  return getProvinceName(provinceId.value as any, loc as any);
});

// compute approximate company count for the province and register SEO
const provinceCompanyCount = computed(() =>
  municipalitiesWithCompanies.value.reduce(
    (s: number, m: { companiesCount?: number }) => s + (m.companiesCount || 0),
    0,
  ),
);

const { seoData } = useAppSEO({
  count: Number(provinceCompanyCount.value),
  province: provinceId.value,
  companies: companies,
});
</script>
