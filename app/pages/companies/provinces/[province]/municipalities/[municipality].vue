<template>
  <div
    class="min-h-screen flex flex-col md:flex-row h-full justify-center p-2 md:p-4 md:gap-4"
  >
    <!-- Mobile filter toggle button -->
    <button
      v-if="!filtersOpen"
      @click="filtersOpen = true"
      class="md:hidden mb-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
    >
      {{ t("filter.title") }}
    </button>

    <!-- Sidebar / desktop visible -->
    <div
      :class="
        filtersOpen
          ? 'fixed top-16 left-0 right-0 bottom-0 z-50 w-full bg-surface h-full overflow-y-auto'
          : 'hidden md:block md:w-[22%]'
      "
    >
      <FilterSidebar :overlay="filtersOpen" @close="filtersOpen = false" />
    </div>

    <!-- Close overlay when filters open on mobile -->
    <div
      v-if="filtersOpen"
      @click="filtersOpen = false"
      class="fixed md:hidden top-16 left-0 right-0 bottom-0 z-40 bg-black bg-opacity-50"
    />

    <!-- Scrollable grid wrapper -->
    <div class="w-full md:w-[78%] flex flex-col h-full overflow-hidden">
      <div class="w-full px-6 py-4">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h1 class="text-3xl font-bold">
              {{ seoData.h1 || municipalityParam }}
            </h1>
            <p class="text-sm text-muted">
              {{ seoData.intro }}
            </p>
          </div>
          <ViewModeToggle
            :view-mode="viewMode"
            @update:view-mode="viewMode = $event"
          />
        </div>
      </div>
      <div class="flex-1 overflow-hidden">
        <CompanyGrid v-if="viewMode === 'grid'" />
        <div v-else class="h-[70dvh] px-6">
          <CompanyMap :companies="companiesForMap" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const router = useRouter();

definePageMeta({
  breadcrumb: {
    parent: { to: "/provinces" },
    resolveLabel: (route: any) => {
      try {
        const loc = useLocations();
        const id = (route.params.municipality as string) || "";
        return loc.getMunicipalityName(id) || id;
      } catch (e) {
        return route.params.municipality || "";
      }
    },
  },
});

const route = useRoute();
const provinceParam = (route.params.province as string) || "";
const municipalityParam = (route.params.municipality as string) || "";

const filterStore = useFiltersStore();
const companiesStore = useCompaniesStore();
const { getCompaniesByArea } = useMap();

const { filtered, count } = companiesStore;
const viewMode = ref<"grid" | "map">("grid");
const filtersOpen = ref(false);

const companiesForMap = computed(() => {
  return getCompaniesByArea(provinceParam, municipalityParam);
});

// Keep filters in sync with route params and query string (run on server and client)
const syncFromRoute = () => {
  filterStore.clearActiveFilters();
  if (provinceParam) filterStore.setProvince(provinceParam);
  if (municipalityParam) filterStore.setMunicipality(municipalityParam);

  const rawQuery = route.query.tech as string;
  if (rawQuery) {
    const { getTech } = useTech();
    const techs = rawQuery
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => getTech(t)?.name ?? t);
    if (techs.length > 0) {
      filterStore.setSelectedTechs(techs);
    } else {
      filterStore.setSelectedTechs([]);
    }
  } else {
    filterStore.setSelectedTechs([]);
  }
};

watch(
  [() => provinceParam, () => municipalityParam, () => route.query.tech],
  syncFromRoute,
  { immediate: true },
);

// Watch for filter changes and update query params (keeps previous behavior)
watch(
  () => filterStore.selectedTechs,
  (newTechs) => {
    const query: any = { ...route.query };
    if (newTechs && newTechs.length > 0) {
      // Any selected tech(s): keep them in the query string so location pages reflect filters
      query.tech = newTechs.join(",");
    } else {
      // No techs selected: remove query param
      delete query.tech;
    }
    router.push({ query });
  },
  { deep: true },
);

// SEO for municipality page (supports both base location and filtered states)
const { seoData} = useAppSEO({
  count: count,
  province: provinceParam,
  municipality: municipalityParam,
  companies: filtered,
});
</script>
