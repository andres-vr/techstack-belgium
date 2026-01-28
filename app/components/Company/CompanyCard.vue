<template>
  <div
    role="link"
    tabindex="0"
    @click="goToCompany"
    @keydown.enter="goToCompany"
    class="relative p-4 border border-surface rounded-lg shadow-sm hover:shadow-md transition-shadow bg-surface block cursor-pointer w-full max-w-[90dvw] md:max-w-[27dvw]"
    aria-label="Open company page"
    title="Open company page"
  >
    <!-- close X when rendered inside a map carousel -->
    <button
      v-if="inMap"
      @click.stop.prevent="$emit('close')"
      class="absolute -top-8 right-3 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-gray-700 z-50"
      aria-label="Close"
      title="Close"
    >
      <span class="text-sm font-semibold">✕</span>
    </button>
    <div class="space-y-2 mb-2">
      <div class="flex justify-between items-start">
        <div class="flex flex-row items-center gap-1">
          <h2
            class="text-lg font-semibold truncate max-w-150px max-w-[40dvw] md:max-w-[12dvw]"
            :title="company.name"
          >
            {{ company.name }}
          </h2>
          <a
            v-if="company.site"
            :href="normalizedSite"
            target="_blank"
            rel="noopener noreferrer"
            @click.stop
            @mousedown.stop
            :title="`Open company website: ${company.name}`"
          >
            <NuxtImg
              src="/icons/link-2.svg"
              alt="website"
              class="w-5 h-5"
              width="20"
              height="20"
            />
          </a>
        </div>
        <div class="flex flex-row justify-end gap-2">
          <div class="flex items-center gap-1 text-sm">
            <NuxtImg
              src="/icons/user.svg"
              alt="employees"
              class="w-5 h-5"
              width="20"
              height="20"
            />
            {{ getEmployeeRange(Number(company.employees)) }}
          </div>
          <div class="flex items-center gap-1 text-sm">
            <NuxtImg
              src="/icons/calendar.svg"
              alt="calendar"
              class="w-5 h-5"
              width="20"
              height="20"
            />
            {{ Number(company.founded) }}
          </div>
        </div>
      </div>
      <div class="flex justify-between items-start text-sm">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <NuxtImg
            src="/icons/map-pin.svg"
            alt="location"
            class="w-5 h-5"
            width="20"
            height="20"
          />
          <template v-for="(loc, index) in sortedLocations" :key="loc.mun.id">
            <NuxtLink
              :to="
                localePath(
                  `/companies/provinces/${loc.province}/municipalities/${loc.mun.id}`,
                )
              "
              :title="`Open municipality page: ${loc.mun.name}`"
              class="hover:text-primary text-muted transition-colors text-sm whitespace-normal break-words"
              @click.stop
            >
              {{ loc.mun.name }}
            </NuxtLink>
            <span v-if="index < sortedLocations.length - 1" class="text-muted">
              •
            </span>
          </template>
        </div>
      </div>
    </div>
    <TechItem
      :items="sortedTechItems"
      :selected="company.tech"
      :href="true"
      :getCategoryClasses="techUtil.getCategoryClasses"
      :toggleItem="() => {}"
    />
  </div>
</template>

<script setup lang="ts">
import type { Company } from "~~/types";

const props = defineProps<{
  company: Company;
  inMap?: boolean;
}>();

const emit = defineEmits(["close"]);

const { getUniqueMunicipalities } = useLocations();
const { getSlug, getEmployeeRange } = useCompany();

const sortedLocations = computed(() => {
  return getUniqueMunicipalities(props.company.locations || []);
});

const techUtil = useTech();

const sortedTechItems = computed(() =>
  techUtil.getSortedTechItems(props.company.tech),
);

const localePath = useLocalePath();

const companySlug = computed(() => getSlug(props.company.name));

const companyLink = computed(() =>
  localePath(`/companies/${companySlug.value}`),
);

const normalizedSite = computed(() => {
  const s = props.company.site || "";
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
});

function goToCompany() {
  navigateTo(companyLink.value);
}
</script>
