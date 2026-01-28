<template>
  <div class="w-full h-[70dvh] px-4 md:px-6">
    <div ref="scrollEl" class="overflow-y-auto h-full" @scroll="onScroll">
      <div :style="{ height: totalHeight + 'px', position: 'relative' }">
        <div :style="{ height: topSpacer + 'px' }" />

        <div
          :style="`display: grid; grid-template-columns: ${gridCols}; gap: 1rem; width: 100%; position: absolute; left: 0; right: 0;`"
        >
          <CompanyCard
            v-for="(company, idx) in visibleList"
            :key="company.cbe"
            :company="company"
            :inMap="false"
            :ref="
              (el) => {
                if (idx === 0 && el) firstCardRef = el;
              }
            "
          />
        </div>

        <div :style="{ height: bottomSpacer + 'px' }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Company } from "~~/types";

const props = defineProps<{ companies?: Company[] }>();

const companiesStore = useCompaniesStore();
const baseList = computed<Company[]>(() =>
  props.companies && Array.isArray(props.companies)
    ? props.companies
    : companiesStore.filtered,
);

const scrollEl = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(0);
const cardHeight = ref(160); // initial estimate
const columns = ref(3);
const overscan = 2;

const updateColumns = () => {
  if (import.meta.client) columns.value = window.innerWidth >= 768 ? 3 : 1;
};

function onScroll(e: Event) {
  if (!scrollEl.value) return;
  scrollTop.value = scrollEl.value.scrollTop;
}

onMounted(async () => {
  updateColumns();
  if (import.meta.client) window.addEventListener("resize", updateColumns);
  await nextTick();
  if (scrollEl.value) {
    viewportHeight.value = scrollEl.value.clientHeight || 0;
    // Try measuring first card if present
    const firstCard = scrollEl.value.querySelector(
      '[role="link"]',
    ) as HTMLElement | null;
    if (firstCard) {
      cardHeight.value = firstCard.offsetHeight || cardHeight.value;
    }
  }
});

onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener("resize", updateColumns);
});

const totalItems = computed(() => baseList.value.length);
const totalRows = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / columns.value)),
);
const totalHeight = computed(() => totalRows.value * cardHeight.value);

const startRow = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / cardHeight.value) - overscan),
);
const rowsInView = computed(
  () =>
    Math.ceil(
      (viewportHeight.value || cardHeight.value * 5) / cardHeight.value,
    ) + overscan,
);
const endRow = computed(() =>
  Math.min(totalRows.value, startRow.value + rowsInView.value + overscan),
);

const startIndex = computed(() => startRow.value * columns.value);
const endIndex = computed(() =>
  Math.min(totalItems.value, endRow.value * columns.value),
);

const visibleList = computed(() =>
  baseList.value.slice(startIndex.value, endIndex.value),
);

const topSpacer = computed(() => startRow.value * cardHeight.value);
const bottomSpacer = computed(() =>
  Math.max(0, (totalRows.value - endRow.value) * cardHeight.value),
);

const gridCols = computed(() =>
  columns.value === 3 ? "repeat(3, minmax(0, 1fr))" : "1fr",
);

const firstCardRef = ref(null);

// Keep viewportHeight updated on scroll/container resize
const resizeObserver =
  typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(() => {
        if (scrollEl.value) viewportHeight.value = scrollEl.value.clientHeight;
      })
    : null;

onMounted(() => {
  if (scrollEl.value && resizeObserver) resizeObserver.observe(scrollEl.value);
});

onBeforeUnmount(() => {
  if (scrollEl.value && resizeObserver) resizeObserver.disconnect();
});
</script>
