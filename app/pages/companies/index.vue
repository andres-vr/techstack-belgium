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
      class="fixed md:hidden top-16 left-0 right-0 bottom-0 z-40 bg-black bg-opacity-50"
    />

    <!-- Main content -->
    <div class="w-full md:w-[78%] flex flex-col h-full overflow-hidden">
      <div class="w-full px-4 md:px-6 py-4">
        <div
          class="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-0 mb-2"
        >
          <h1 class="text-2xl md:text-3xl font-bold">
            {{ isIndexable ? seoData.h1 : t("nav.companies") }}
          </h1>
          <ViewModeToggle
            :view-mode="viewMode"
            @update:view-mode="viewMode = $event"
          />
        </div>
        <p v-if="isIndexable" class="text-xs md:text-sm text-muted">
          {{ seoData.intro }}
        </p>
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
const route = useRoute();
const provinceParam = (route.params.province as string) || "";

const filterStore = useFiltersStore();
const companiesStore = useCompaniesStore();
const { getCompaniesByArea } = useMap();
const { t } = useI18n();

// Clear filters on server and client when opening main companies index (ensures SSR matches client)
filterStore.clearActiveFilters();

const selectedTechs = filterStore.selectedTechs;
const { filtered, count } = companiesStore;

const viewMode = ref<"grid" | "map">("grid");
const filtersOpen = ref(false);

const companiesForMap = computed(() => {
  const prov = unref(filterStore.selectedProvince);
  const mun = unref(filterStore.selectedMunicipality);
  if (prov) return getCompaniesByArea(prov, mun || undefined);
  return filtered;
});

// SEO for companies listing (supports optional province filter)
const { seoData, isIndexable } = useAppSEO({
  count: count,
  province: provinceParam,
  selectedTechs,
  companies: filtered,
});
</script>
