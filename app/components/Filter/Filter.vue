<template>
  <section aria-labelledby="category-heading">
    <header>
      <div class="flex items-center gap-3 mb-3">
        <div
          :class="
            techUtil.getCategoryColors(props.categoryKey).accent +
            ' h-px flex-1 rounded-full'
          "
          aria-hidden="true"
        ></div>
        <h2
          id="category-heading"
          class="text-sm font-semibold text-center px-2"
        >
          {{ category?.label ?? props.categoryKey }}
        </h2>
        <div
          :class="
            techUtil.getCategoryColors(props.categoryKey).accent +
            ' h-px flex-1 rounded-full'
          "
          aria-hidden="true"
        ></div>
      </div>
    </header>

    <div v-for="(group, idx) in grouped" :key="group.header">
      <h3
        v-if="group.header !== category?.label"
        class="mt-2 mb-1 text-xs font-medium flex items-center gap-2"
      >
        <span
          :class="
            techUtil.getCategoryColors(props.categoryKey).accent +
            ' w-0.5 h-3 rounded'
          "
          aria-hidden="true"
        ></span>
        <span>{{ group.header }}</span>
        <span class="flex-1 h-px bg-transparent" aria-hidden="true"></span>
      </h3>

      <TechItem
        :items="group.items"
        :selected="selected"
        :getCompanyCount="getCompanyCount"
        :getCategoryClasses="getCategoryClasses"
        :toggleItem="toggleItem"
        :locked-tech="props.lockedTech"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { categories } from "~/data/categories";
import { languageDeriveMap } from "~/data/tech";
import {
  CategoryKey,
  Derives,
  TechType,
  type Company,
  type Tech,
} from "~~/types";

const props = defineProps<{
  categoryKey: CategoryKey;
  availableTech: Tech[];
  modelValue?: string[];
  globalSelected?: string[];
  companies: Company[];
  lockedTech?: string | null;
}>();
const emit = defineEmits<{ (e: "update:modelValue", val: string[]): void }>();

const selected = computed<string[]>({
  get: () => props.modelValue ?? [],
  set: (v: string[]) => emit("update:modelValue", v),
});

const category = computed(() =>
  categories.find((c) => c.key === props.categoryKey),
);

const grouped = computed(() => {
  const items = props.availableTech;
  const groups: Array<{ header: string; items: Tech[] }> = [];

  if (props.categoryKey === CategoryKey.DATABASE) {
    const sql = items.filter((i) => i.derives?.includes(Derives.SQL));
    const nosql = items.filter((i) => i.derives?.includes(Derives.NOSQL));
    if (sql.length) groups.push({ header: "SQL", items: sql });
    if (nosql.length) groups.push({ header: "NoSQL", items: nosql });
    return groups;
  }

  // For all other categories, show all items
  if (items.length) {
    groups.push({ header: category.value?.label || "", items });
  }
  return groups;
});

const techUtil = useTech();

function getCategoryClasses(techName: string) {
  const techItem = props.availableTech.find((t) => t.name === techName);
  if (!techItem) return "border border-surface text-muted bg-surface";

  if (selected.value.includes(techName)) {
    return techUtil.getCategoryClasses(techName);
  }

  const count = getCompanyCount(techName);
  if (count === 0) {
    return "border border-surface text-muted bg-gray-100 dark:bg-slate-800 cursor-not-allowed";
  }

  return "border border-surface text-muted bg-surface hover:border-surface";
}

function getCompanyCount(techName: string): number {
  const techItem = techUtil.getTech(techName);
  if (!techItem) return 0;

  // Build the set of selected filters to test: globalSelected U {techName}
  const global = new Set(props.globalSelected ?? []);
  const testSet = new Set(global);
  if (!global.has(techName)) testSet.add(techName);

  function companyMatches(company: { tech: string[] }) {
    // For every selected filter, the company must match it
    for (const sel of Array.from(testSet)) {
      // direct match
      if (company.tech.includes(sel)) continue;

      // otherwise, if selection is a language, a framework deriving from it counts
      const selItem = techUtil.getTech(sel);
      if (selItem && selItem.type === TechType.LANGUAGE) {
        const derive =
          languageDeriveMap[sel as keyof typeof languageDeriveMap as any];
        if (derive) {
          // if company uses any tech that derives from this language, it's a match
          const found = company.tech.some((u) =>
            techUtil.getTech(u)?.derives?.includes(derive),
          );
          if (found) continue;
        }
      }

      // no match for this selection
      return false;
    }
    return true;
  }

  let count = 0;
  const source = props.companies;
  source.forEach((company) => {
    if (companyMatches(company)) count += 1;
  });
  return count;
}

function toggleItem(name: string, checked: boolean) {
  // Prevent unchecking locked tech
  if (props.lockedTech && name === props.lockedTech && !checked) {
    return;
  }

  const curr = props.modelValue ?? [];
  let next: string[];
  if (checked) {
    next = curr.includes(name) ? curr : [...curr, name];
  } else {
    next = curr.filter((n) => n !== name);
  }
  emit("update:modelValue", next);
}
</script>
