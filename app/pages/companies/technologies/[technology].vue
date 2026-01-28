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
      class="fixed md:hidden top-0 left-0 right-0 bottom-0 z-30 bg-black bg-opacity-50"
    />

    <div class="w-full md:w-[78%] flex flex-col h-full overflow-hidden">
      <div class="w-full px-4 md:px-6 py-4">
        <div
          class="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-0 mb-4"
        >
          <div>
            <h1 class="text-2xl md:text-3xl font-bold">
              {{ seoData.h1 || techParam }}
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
        <CompanyGrid v-if="viewMode === 'grid'" :companies="filteredByTech" />
        <div v-else class="h-[70dvh] px-4 md:px-6">
          <CompanyMap :companies="filteredByTech" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import techList, { languageDeriveMap } from "~/data/tech";

const { t } = useI18n();

definePageMeta({
  breadcrumb: {
    parent: { to: "/companies/technologies" },
    resolveLabel: (route: any) => route.params.tech || "",
  },
});

const route = useRoute();
const filtersStore = useFiltersStore();

// Determine selected tech from route slug (matches getSlug(name))
const techSlug = String(route.params.technology || "");
const { getSlug } = useCompany();
const matchedTech = techList.find((t: any) => getSlug(t.name) === techSlug);

// Keep the route tech in sync with the filters store (run on server and client)
const syncTechFromRoute = () => {
  filtersStore.clearActiveFilters();
  if (matchedTech) {
    filtersStore.setSelectedTechs([matchedTech.name]);
  } else {
    filtersStore.setSelectedTechs([]);
  }
};

watch(() => route.params.technology, syncTechFromRoute, { immediate: true });
const viewMode = ref<"grid" | "map">("grid");
const filtersOpen = ref(false);

// Extract tech from route param (slug -> human-readable)
const techParam = ((route.params.technology as string) || "").replace(
  /-/g,
  " ",
);

// Load full companies list and filter by tech only (ignore province/municipality)
const { getAllCompanies } = useCompanies();
const allCompanies = getAllCompanies();

const filteredByTech = computed(() => {
  // Start from full list
  let result = allCompanies.slice();

  // Always apply the route tech (if present)
  const routeTech = matchedTech ? matchedTech.name : techParam || null;
  if (routeTech) {
    result = result.filter((company: any) => {
      if (company.tech.includes(routeTech)) return true;
      const selItem = techByName.get(routeTech);
      if (selItem?.type === "language") {
        const derive = (languageDeriveMap as any)[routeTech];
        return (
          !!derive &&
          company.tech.some((u: string) =>
            techByName.get(u)?.derives?.includes(derive),
          )
        );
      }
      return false;
    });
  }

  // Then apply any additional selected tech filters from the store (conjunctive)
  const storeSelected = unref(filtersStore.selectedTechs) || [];
  // If store has selections, ensure company matches every selected tech
  if (Array.isArray(storeSelected) && storeSelected.length > 0) {
    result = result.filter((company: any) =>
      storeSelected.every((sel: string) => {
        if (company.tech.includes(sel)) return true;
        const selItem = techByName.get(sel);
        if (selItem?.type === "language") {
          const derive = (languageDeriveMap as any)[sel];
          return (
            !!derive &&
            company.tech.some((u: string) =>
              techByName.get(u)?.derives?.includes(derive),
            )
          );
        }
        return false;
      }),
    );
  }

  return result;
});

const count = computed(() => filteredByTech.value.length);

// SEO for tech-specific pages (pass refs so SEO updates reactively on filter changes)
const { seoData} = useAppSEO({
  count: count.value,
  tech: techParam,
  companies: filteredByTech.value,
});
</script>
