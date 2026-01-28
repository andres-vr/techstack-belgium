<template>
  <div
    class="bg-surface border border-surface rounded-xl overflow-y-auto p-4 md:max-h-[70dvh]"
  >
    <div class="flex items-center justify-between mb-2">
      <span class="text-lg sm:text-xl font-bold text-primary">{{
        t("filter.title")
      }}</span>
      <button
        v-if="overlay"
        @click="emit('close')"
        class="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded md:hidden"
        aria-label="Close filters"
      >
        <svg
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
    <div v-if="selectedCount > 0" class="mb-2">
      <div class="mb-2">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-muted">{{
            t("filter.selected", { count: selectedCount })
          }}</span>
          <button
            @click="clearAll"
            class="text-sm text-muted hover:text-primary px-2 py-1 rounded-lg"
          >
            {{ t("filter.clear") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sorting dropdown placed above first category -->
    <div class="mb-3 flex flex-row gap-4 items-center">
      <label class="text-sm text-muted mb-1 block">{{
        t("filter.sort")
      }}</label>
      <select
        v-model="sort"
        class="w-full border border-surface rounded-lg px-3 py-2 bg-white text-sm"
        aria-label="Sort companies"
      >
        <option value="name_asc">{{ t("filter.sortNameAsc") }}</option>
        <option value="name_desc">{{ t("filter.sortNameDesc") }}</option>
        <option value="founded_asc">{{ t("filter.sortFoundedAsc") }}</option>
        <option value="founded_desc">{{ t("filter.sortFoundedDesc") }}</option>
        <option value="employees_asc">
          {{ t("filter.sortEmployeesAsc") }}
        </option>
        <option value="employees_desc">
          {{ t("filter.sortEmployeesDesc") }}
        </option>
      </select>
    </div>

    <div class="flex flex-col gap-y-2">
      <Filter
        v-for="filter in filters"
        :key="filter.key"
        :category-key="filter.key"
        :available-tech="filter.available"
        v-model="filter.selected.value"
        :global-selected="selectedTechs"
        :companies="baseCompanies"
        :locked-tech="routeTechName"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { languageDeriveMap, tech } from "~/data/tech";
import {
  CategoryKey,
  Derives,
  SortCriterion,
  TechType,
  type Company,
  type Tech,
} from "~~/types";

const { overlay } = defineProps<{ overlay?: boolean }>();
const emit = defineEmits(["close"]);

const companiesStore = useCompaniesStore();
const companies = computed(() => companiesStore.filtered);
const { t } = useI18n();
const filterStore = useFiltersStore();

const selectedTechs = computed<string[]>({
  get: () => filterStore.selectedTechs,
  set: (val: string[]) => (filterStore.selectedTechs = val),
});

// Compute a base set of companies filtered only by non-tech filters (province/municipality)
const { getAllCompanies } = useCompanies();
const baseCompanies = computed(() => {
  const all = getAllCompanies();
  const prov = unref(filterStore.selectedProvince) as string | null;
  const mun = unref(filterStore.selectedMunicipality) as string | null;

  return all.filter((c) => {
    if (!prov && !mun) return true;
    const locs = c.locations || [];
    return locs.some((loc: any) => {
      if (prov && loc.province !== prov) return false;
      if (mun && loc.municipality !== mun) return false;
      return true;
    });
  });
});

const sort = computed<SortCriterion>({
  get: () => filterStore.sort,
  set: (val: SortCriterion) => (filterStore.sort = val),
});

const route = useRoute();

// Detect route tech (e.g., /companies/technologies/react)
const routeTechName = computed(() => {
  const slug = String(route.params.technology || "");
  if (!slug) return null;
  const t = tech.find((tt) => getSlug(tt.name) === slug);
  return t ? t.name : null;
});

const { getSlug } = useCompany();

function clearAll() {
  // Preserve locked route tech when clearing
  if (routeTechName.value) {
    selectedTechs.value = [routeTechName.value];
  } else {
    selectedTechs.value = [];
  }
}

const selectedCount = computed(() => {
  return selectedTechs.value.length;
});

// Get all tech names used by companies in the baseCompanies set (non-tech filters applied)
// Also ensure currently selected techs are included so they stay visible even when count is 0
const availableTechNames = computed(() => {
  const names = new Set<string>();
  const source = (unref(baseCompanies) as Company[]) || [];
  source.forEach((company) => {
    (company.tech || []).forEach((techName: string) => names.add(techName));
  });

  // include current selections even if they don't appear in baseCompanies
  (filterStore.selectedTechs || []).forEach((t) => names.add(t));
  return names;
});

// Get available tech for a category, sorted alphabetically
function getAvailableTech(category: CategoryKey): Tech[] {
  return tech
    .filter(
      (t) => t.category === category && availableTechNames.value.has(t.name),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Frontend tech: prefer CSS frameworks first, then other frameworks (alphabetical)
const availableFrontendTech = computed(() => {
  const list = getAvailableTech(CategoryKey.FRONTEND);
  const cssLike = list.filter((t) => /css|sass|bootstrap/i.test(t.name));
  const other = list.filter((t) => !/css|sass|bootstrap/i.test(t.name));
  cssLike.sort((a, b) => a.name.localeCompare(b.name));
  other.sort((a, b) => a.name.localeCompare(b.name));
  return [...cssLike, ...other];
});

// Communication tech
const availableCommunicationTech = computed(() =>
  getAvailableTech(CategoryKey.COMMUNICATION),
);

// Database tech (SQL + NoSQL only)
const availableDatabaseTech = computed(() =>
  tech
    .filter(
      (t) =>
        t.category === CategoryKey.DATABASE &&
        availableTechNames.value.has(t.name) &&
        (t.derives?.includes(Derives.SQL) ||
          t.derives?.includes(Derives.NOSQL)),
    )
    .sort((a, b) => a.name.localeCompare(b.name)),
);

// DevOps tech
const availableDevopsTech = computed(() =>
  getAvailableTech(CategoryKey.DEVOPS),
);

// Cloud tech
const availableCloudTech = computed(() => getAvailableTech(CategoryKey.CLOUD));

// Mobile tech
const availableMobileTech = computed(() =>
  getAvailableTech(CategoryKey.MOBILE),
);

// Backend tech - includes both direct languages and derived languages (from frameworks)
const availableBackendTech = computed(() => {
  const languages = new Set<Tech>();

  // Add directly used languages
  tech.forEach((t) => {
    if (
      t.category === CategoryKey.BACKEND &&
      t.type === TechType.LANGUAGE &&
      availableTechNames.value.has(t.name)
    ) {
      languages.add(t);
    }
  });

  // Add languages derived from frameworks (e.g., PHP from Laravel)
  const techUtil = useTech();
  (unref(companies) ?? []).forEach((company) => {
    company.tech.forEach((techName: string) => {
      const usedTech = techUtil.getTech(techName);
      if (usedTech?.derives && usedTech.category === CategoryKey.BACKEND) {
        usedTech.derives.forEach((derive: Derives) => {
          const language = tech.find(
            (t) =>
              t.category === CategoryKey.BACKEND &&
              t.type === TechType.LANGUAGE &&
              languageDeriveMap[t.name] === derive,
          );
          if (language) languages.add(language);
        });
      }
    });
  });

  return Array.from(languages).sort((a, b) => a.name.localeCompare(b.name));
});

// Get selected tech names for a category
function getSelectedForCategory(available: Tech[]): string[] {
  return available
    .map((t) => t.name)
    .filter((n) => selectedTechs.value.includes(n));
}

// Update selection for a category
function updateCategorySelection(available: Tech[], newSelection: string[]) {
  const categoryNames = new Set(available.map((t) => t.name));
  const updated = selectedTechs.value.filter(
    (name) => !categoryNames.has(name),
  );
  selectedTechs.value = [...updated, ...newSelection];
}

// Selected tech per category
const selectedFrontendTech = computed({
  get: () => getSelectedForCategory(availableFrontendTech.value),
  set: (val) => updateCategorySelection(availableFrontendTech.value, val),
});

const selectedCommunicationTech = computed({
  get: () => getSelectedForCategory(availableCommunicationTech.value),
  set: (val) => updateCategorySelection(availableCommunicationTech.value, val),
});

const selectedDatabaseTech = computed({
  get: () => getSelectedForCategory(availableDatabaseTech.value),
  set: (val) => updateCategorySelection(availableDatabaseTech.value, val),
});

const selectedDevopsTech = computed({
  get: () => getSelectedForCategory(availableDevopsTech.value),
  set: (val) => updateCategorySelection(availableDevopsTech.value, val),
});

const selectedCloudTech = computed({
  get: () => getSelectedForCategory(availableCloudTech.value),
  set: (val) => updateCategorySelection(availableCloudTech.value, val),
});

const selectedMobileTech = computed({
  get: () => getSelectedForCategory(availableMobileTech.value),
  set: (val) => updateCategorySelection(availableMobileTech.value, val),
});

// Backend requires special handling - show language as selected if its frameworks are selected
const selectedBackendTech = computed({
  get: () => {
    return availableBackendTech.value
      .map((t) => t.name)
      .filter((lang) => {
        // Selected directly
        if (selectedTechs.value.includes(lang)) return true;

        // Or a framework deriving from this language is selected
        const derive = languageDeriveMap[lang];
        if (!derive) return false;

        return selectedTechs.value.some((sel) => {
          const selTech = tech.find((t) => t.name === sel);
          return selTech?.derives?.includes(derive);
        });
      });
  },
  set: (val) => {
    const languageNames = new Set(
      availableBackendTech.value.map((t) => t.name),
    );
    const updated = selectedTechs.value.filter(
      (name) => !languageNames.has(name),
    );
    selectedTechs.value = [...updated, ...val];
  },
});

// Filters array for v-for rendering
const filters = computed(() =>
  [
    {
      key: CategoryKey.FRONTEND,
      available: availableFrontendTech.value,
      selected: selectedFrontendTech,
    },
    {
      key: CategoryKey.BACKEND,
      available: availableBackendTech.value,
      selected: selectedBackendTech,
    },
    {
      key: CategoryKey.COMMUNICATION,
      available: availableCommunicationTech.value,
      selected: selectedCommunicationTech,
    },
    {
      key: CategoryKey.DATABASE,
      available: availableDatabaseTech.value,
      selected: selectedDatabaseTech,
    },
    {
      key: CategoryKey.DEVOPS,
      available: availableDevopsTech.value,
      selected: selectedDevopsTech,
    },
    {
      key: CategoryKey.CLOUD,
      available: availableCloudTech.value,
      selected: selectedCloudTech,
    },
    {
      key: CategoryKey.MOBILE,
      available: availableMobileTech.value,
      selected: selectedMobileTech,
    },
  ].filter((f) => f.available.length > 0),
);
</script>
