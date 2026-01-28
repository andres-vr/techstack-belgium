<template>
  <div
    class="flex flex-col md:flex-row min-h-screen h-full justify-center p-2 md:p-4 md:gap-4"
  >
    <!-- Mobile filter toggle button -->
    <button
      v-if="!filtersOpen"
      @click="filtersOpen = true"
      class="md:hidden mb-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
    >
      {{ t("filter.title") }}
    </button>

    <!-- Sidebar/Filters (full screen on mobile when open) -->
    <div
      :class="
        filtersOpen
          ? 'fixed top-16 left-0 right-0 bottom-0 z-50 w-full bg-surface h-full overflow-y-auto'
          : 'hidden md:block md:relative md:w-[22%] md:bg-transparent md:h-auto'
      "
    >
      <FilterSidebar :overlay="filtersOpen" @close="filtersOpen = false" />
    </div>

    <!-- Close overlay when filters open on mobile -->
    <div
      v-if="filtersOpen"
      @click="filtersOpen = false"
      class="fixed md:hidden top-0 left-0 right-0 bottom-0 z-30 bg-black bg-opacity-50"
    />

    <!-- Scrollable grid wrapper -->
    <div class="w-full md:w-[78%] flex flex-col h-full overflow-hidden">
      <div class="w-full px-4 md:px-6 py-4">
        <div
          class="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-0 mb-4"
        >
          <div>
            <h1 class="text-2xl md:text-3xl font-bold">
              {{ seoData.h1 || provinceParam }}
            </h1>
            <p class="text-xs md:text-sm text-muted">
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
        <div v-else class="h-[70dvh] px-4 md:px-6">
          <CompanyMap :companies="companiesForMap" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
import type { ProvinceId } from "~~/types";

definePageMeta({
  breadcrumb: {
    parent: { to: "/provinces" },
  },
  resolveLabel: (route: any) => {
    try {
      const prov = useProvince();
      const id = (route.params.province as ProvinceId) || "";
      return (
        prov.getProvinceName(id, (useI18n() as any).locale?.value || "en") || id
      );
    } catch (e) {
      return route.params.province || "";
    }
  },
});

const route = useRoute();
const provinceParam = (route.params.province as string) || "";

const filterStore = useFiltersStore();
const companiesStore = useCompaniesStore();
const { getCompaniesByArea } = useMap();

const { filtered, count } = companiesStore;
const viewMode = ref<"grid" | "map">("grid");
const filtersOpen = ref(false);

const companiesForMap = computed(() => getCompaniesByArea(provinceParam));

// Initialize and keep province filter in sync with route params and query (run on server and client)
const { getTech } = useTech();
const syncProvinceFilter = () => {
  filterStore.clearActiveFilters();
  if (provinceParam) filterStore.setProvince(provinceParam);

  // Normalize query ?tech=... to canonical tech names (so SSR counts and meta are correct)
  const q = route.query.tech as string | undefined;
  if (q) {
    const techs = q
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => getTech(t)?.name ?? t);
    filterStore.setSelectedTechs(techs);
  } else {
    filterStore.setSelectedTechs([]);
  }
};

watch(
  () => [provinceParam, () => route.query.tech],
  () => syncProvinceFilter(),
  { immediate: true },
);

// SEO for province page (supports both base location and filtered states)
const { seoData } = useAppSEO({
  count: count,
  province: provinceParam,
  companies: filtered,
});
</script>
