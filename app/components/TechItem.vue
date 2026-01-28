<template>
  <div class="flex flex-wrap gap-2">
    <label
      v-for="item in items"
      :key="item.name"
      class="flex items-center gap-2 cursor-pointer"
    >
      <input
        type="checkbox"
        :value="item.name"
        class="sr-only"
        :checked="selected.includes(item.name)"
        :aria-checked="selected.includes(item.name)"
        @change="
          (e) => toggleItem(item.name, (e.target as HTMLInputElement).checked)
        "
        :disabled="
          props.lockedTech === item.name ||
          (getCompanyCount
            ? getCompanyCount(item.name) === 0 && !selected.includes(item.name)
            : false)
        "
      />
      <template v-if="href">
        <NuxtLink
          :to="localePath(`/companies/technologies/${slug(item.name)}`)"
          :title="`Open tech page: ${item.name}`"
          class="inline-flex text-xs font-medium px-2 py-1 rounded items-center gap-2 border transition-all duration-150"
          :class="[
            getCategoryClasses(item.name),
            props.lockedTech === item.name
              ? 'opacity-60 cursor-not-allowed'
              : '',
          ]"
          @click.stop
        >
          <NuxtImg
            :src="techUtil.getLogoUrl(item.name)"
            preset="logo"
            sizes="20px"
            width="20"
            height="20"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            :alt="item.name + ' logo'"
            :class="[
              techUtil.getLogoClasses(item.name),
              techUtil.getTextColorClasses(item.name),
            ]"
            class="object-contain"
          />
          {{ item.name }}
        </NuxtLink>
      </template>
      <template v-else>
        <span
          :title="item.name"
          class="inline-flex text-xs font-medium px-2 py-1 rounded items-center gap-2 border transition-all duration-150"
          :class="[
            getCategoryClasses(item.name),
            props.lockedTech === item.name
              ? 'opacity-60 cursor-not-allowed'
              : '',
          ]"
        >
          <NuxtImg
            :src="techUtil.getLogoUrl(item.name)"
            preset="logo"
            sizes="20px"
            width="20"
            height="20"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            :alt="item.name + ' logo'"
            :class="[
              techUtil.getLogoClasses(item.name),
              techUtil.getTextColorClasses(item.name),
            ]"
            class="object-contain"
          />
          {{ item.name }}
          <span v-if="getCompanyCount">({{ getCompanyCount(item.name) }})</span>
        </span>
      </template>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { Tech } from "~~/types";

const techUtil = useTech();
const { getSlug } = useCompany();

const props = defineProps<{
  items: Tech[];
  selected: string[];
  href?: boolean;
  getCompanyCount?: (name: string) => number;
  getCategoryClasses: (name: string) => string;
  toggleItem: (name: string, checked: boolean) => void;
  lockedTech?: string | null;
}>();

const localePath = useLocalePath();
const slug = (s: string) => getSlug(s);
</script>
