<template>
  <div class="max-w-[95dvw] mx-auto px-4 sm:px-6 lg:px-8 pt-20 py-4">
    <div v-show="!company" class="text-center py-20">
      <h1 class="text-3xl font-bold text-primary mb-4">
        {{ t("ui.companyNotFound") }}
      </h1>
      <p class="text-muted">
        {{ t("ui.companyNotFound") }}
      </p>
    </div>

    <div v-if="company" class="space-y-8">
      <div
        class="grid grid-cols-1 md:grid-cols-[minmax(0,45dvw)_minmax(0,45dvw)] gap-6"
      >
        <div class="space-y-8">
          <div class="bg-surface border border-surface rounded-lg p-8">
            <NuxtLink
              to="/"
              class="inline-flex items-center gap-2 text-muted hover:text-primary mb-4"
            >
              <span>←</span>
              <span>{{ t("ui.backToDirectory") }}</span>
            </NuxtLink>
            <div class="flex items-start justify-between mb-6">
              <div>
                <h1
                  class="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2"
                >
                  {{ company.name }}
                </h1>
                <a
                  :href="company.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >{{ displaySite }}</a
                >
              </div>
            </div>

            <div
              class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-surface"
            >
              <div class="flex items-center gap-3">
                <NuxtImg
                  src="/icons/user.svg"
                  alt="user"
                  class="w-5 h-5"
                  width="20"
                  height="20"
                />
                <div>
                  <div class="text-sm text-muted mb-1">
                    {{ t("ui.employees") }}
                  </div>
                  <div class="text-lg font-semibold text-primary">
                    {{ getEmployeeRange(Number(company.employees)) }}
                  </div>
                </div>
              </div>

              <div v-if="company.founded" class="flex items-center gap-3">
                <NuxtImg
                  src="/icons/calendar.svg"
                  alt="calendar"
                  class="w-5 h-5"
                  width="20"
                  height="20"
                />
                <div>
                  <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    {{ t("ui.founded") }}
                  </div>
                  <div
                    class="text-lg font-semibold text-slate-900 dark:text-white"
                  >
                    {{ company.founded }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <NuxtImg
                  src="/icons/map-pin.svg"
                  alt="location"
                  class="w-5 h-5"
                  width="20"
                  height="20"
                />
                <div>
                  <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    {{ t("ui.locations") }}
                  </div>
                  <div
                    class="text-lg font-semibold text-slate-900 dark:text-white"
                  >
                    {{ company.locations.length }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-surface border border-surface rounded-lg p-8">
            <h2 class="text-xl sm:text-2xl font-bold text-primary mb-6">
              {{ t("ui.locations") }}
            </h2>
            <div class="flex flex-col gap-y-2 mb-2">
              <div
                v-for="(row, rowIndex) in locationRows"
                :key="rowIndex"
                class="flex flex-row gap-x-2 justify-start"
              >
                <a
                  v-for="(location, idx) in row"
                  :key="rowIndex + '-' + idx"
                  :href="`/companies/provinces/${location.province}/municipalities/${location.municipality}`"
                  class="group flex items-center gap-3 p-4 rounded-lg w-full md:w-[8dvw] min-w-0 overflow-hidden transition-colors bg-slate-200 dark:bg-slate-800"
                >
                  <div class="min-w-0 w-full">
                    <div
                      class="font-semibold text-primary group-hover:text-indigo-600 truncate transition-colors"
                    >
                      {{ getMunicipalityName(location.municipality) }}
                    </div>
                    <div class="text-sm text-muted truncate">
                      {{ getProvinceName(location.province) }}
                    </div>
                  </div>
                </a>
              </div>
            </div>
            <!-- Company Map -->
            <div
              class="bg-surface border border-surface rounded-lg overflow-hidden h-64 md:h-[400px]"
            >
              <CompanyMap :company="company" />
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <div class="bg-surface border border-surface rounded-lg p-8">
            <div class="flex flex-row justify-between">
              <h2 class="text-2xl font-bold text-primary mb-6">
                {{ t("ui.techStack") }}
              </h2>
              <span class="text-sm">
                {{ t("ui.lastUpdated") }}
                {{ lastUpdated }}
              </span>
            </div>
            <TechItem
              :items="sortedTechItems"
              :selected="company.tech"
              :href="true"
              :getCategoryClasses="techUtil.getCategoryClasses"
              :toggleItem="() => {}"
            />
          </div>
          <div
            v-if="company.proof && company.proof.length > 0"
            class="bg-surface border border-surface rounded-lg p-8"
          >
            <h2 class="text-2xl font-bold text-primary mb-6">
              {{ t("ui.proofReferences") }}
            </h2>
            <div class="space-y-3">
              <div
                v-for="(proof, index) in company.proof"
                :key="index"
                class="bg-white rounded border border-gray-200 p-4"
              >
                <div class="flex items-center gap-3">
                  <div class="text-sm text-gray-500">
                    Reference {{ index + 1 }}
                  </div>
                  <span class="h-5 w-px bg-gray-200" aria-hidden="true"></span>
                  <a
                    :href="proof.image"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    <NuxtImg
                      src="/icons/image.svg"
                      alt="screenshot"
                      :size="14"
                    />
                    <span>Screenshot</span>
                  </a>
                </div>
                <a
                  :href="proof.url"
                  class="text-sm text-gray-900 break-all mb-3"
                >
                  {{ proof.url }}</a
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { provinces } from "~/data/provinces";
import type { ProvinceId } from "~~/types";

const { t, locale: i18nLocale } = useI18n();
const {
  getCompanyBreadcrumbLabel,
  getDisplaySite: getDisplaySiteUtil,
  getCompanyBySlug,
  getEmployeeRange,
} = useCompany();

definePageMeta({
  breadcrumb: {
    parent: { to: "/companies" },
    resolveLabel: (route: any) => {
      const name = route.params.name as string;
      return getCompanyBreadcrumbLabel(name);
    },
  },
});

const route = useRoute();
const companyName = computed(() => route.params.company as string);
const techUtil = useTech();

const company = computed(() => {
  return getCompanyBySlug(companyName.value);
});

const sortedTechItems = computed(() =>
  techUtil.getSortedTechItems(company.value?.tech ?? []),
);

const displaySite = computed(() =>
  getDisplaySiteUtil(company.value?.site || ""),
);

const { getMunicipalityName, getLocationsForDisplay } = useLocations();

const lastUpdated = computed(() =>
  company.value?.lastUpdated
    ? new Date(company.value.lastUpdated).toLocaleDateString()
    : "Never",
);

const locationRows = computed((): any[][] => {
  const locs = getLocationsForDisplay(company.value?.locations ?? []);
  const rows: any[][] = [];
  for (let i = 0; i < locs.length; i += 5) {
    rows.push(locs.slice(i, i + 5));
  }
  return rows;
});

function getProvinceName(provinceId: ProvinceId): string {
  const province = provinces.find((p) => p.id === provinceId);
  const current = (i18nLocale as any)?.value || "en";
  return province
    ? (province.names as any)[current] || (province.names as any).en
    : provinceId;
}

useHead({
  title: computed(() =>
    company.value
      ? t("ui.companyPageTitle", { name: company.value.name })
      : t("ui.companyNotFound"),
  ),
  meta: [
    {
      name: "description",
      content: computed(() =>
        company.value
          ? t("ui.companyPageDescription", {
              name: company.value.name,
              tech: company.value.tech.join(", "),
            })
          : t("ui.companyNotFound"),
      ),
    },
  ],
});
</script>
