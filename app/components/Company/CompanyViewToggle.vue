<template>
  <div class="flex-1 overflow-y-auto">
    <div v-if="viewMode === 'grid'">
      <CompanyGrid />
    </div>
    <div v-else class="h-[70dvh] px-6">
      <CompanyMap :companies="companies" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Company } from "~~/types";

const props = defineProps<{
  companies: Company[];
  viewMode: "grid" | "map";
}>();
</script>
