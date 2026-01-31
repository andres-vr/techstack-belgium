<template>
  <div class="space-y-6">
    <div v-for="category in techCategories" :key="category.key" class="mb-2">
      <h1 class="text-lg font-bold">{{ category.label }}</h1>

      <div v-if="category.key === CategoryKey.BACKEND">
        <div class="text-sm font-medium text-slate-600 mb-1">Languages</div>
        <TechItem
          :items="tech.filter((t) => t.category === category.key && !t.derives)"
          :selected="modelValue"
          :getCategoryClasses="getCategoryClasses"
          :toggleItem="handleToggle"
          class="mb-3"
        />

        <div class="text-sm font-medium text-slate-600 mb-1">Frameworks</div>
        <TechItem
          :items="tech.filter((t) => t.category === category.key && t.derives)"
          :selected="modelValue"
          :getCategoryClasses="getCategoryClasses"
          :toggleItem="handleToggle"
        />
      </div>

      <div v-else-if="category.key === CategoryKey.DATABASE">
        <div class="text-sm font-medium text-slate-600 mb-1">SQL</div>
        <TechItem
          :items="
            tech.filter(
              (t) =>
                t.category === category.key &&
                t.derives &&
                t.derives.includes(Derives.SQL),
            )
          "
          :selected="modelValue"
          :getCategoryClasses="getCategoryClasses"
          :toggleItem="handleToggle"
          class="mb-3"
        />

        <div class="text-sm font-medium text-slate-600 mb-1">NoSQL</div>
        <TechItem
          :items="
            tech.filter(
              (t) =>
                t.category === category.key &&
                t.derives &&
                t.derives.includes(Derives.NOSQL),
            )
          "
          :selected="modelValue"
          :getCategoryClasses="getCategoryClasses"
          :toggleItem="handleToggle"
        />
      </div>

      <div v-else>
        <TechItem
          :items="tech.filter((t) => t.category === category.key)"
          :selected="modelValue"
          :getCategoryClasses="getCategoryClasses"
          :toggleItem="handleToggle"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { categories as techCategories } from "~/data/categories";
import { languageDeriveMap, tech } from "~/data/tech";
import { CategoryKey, Derives } from "~~/types";

const techUtil = useTech();

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

function getCategoryClasses(techName: string) {
  const techItem = tech.find((t) => t.name === techName);
  if (!techItem) return "border border-surface text-muted bg-surface";

  if (props.modelValue.includes(techName)) {
    return techUtil.getCategoryClasses(techName);
  }

  return "border border-surface text-muted bg-surface hover:border-surface";
}

function handleToggle(name: string, checked: boolean) {
  const techItem = techUtil.getTech(name);
  let newStack = [...props.modelValue];

  if (checked) {
    // Add the tech itself
    if (!newStack.includes(name)) {
      newStack.push(name);
    }

    // If it derives languages, add them too
    if (techItem?.category === CategoryKey.BACKEND && techItem.derives) {
      techItem.derives.forEach((derive) => {
        const derivedTech = languageDeriveMap[derive];
        if (derivedTech && !newStack.includes(derivedTech)) {
          newStack.push(derivedTech);
        }
      });
    }
  } else {
    // Remove the tech itself
    newStack = newStack.filter((t) => t !== name);

    // For derived languages, only remove if no other selected tech derives them
    if (techItem?.category === CategoryKey.BACKEND && techItem.derives) {
      techItem.derives.forEach((derive) => {
        const derivedTech = languageDeriveMap[derive];
        if (!derivedTech) return;

        // Check if any OTHER selected tech still derives this language
        const stillNeeded = newStack.some((selectedName) => {
          const selectedTech = techUtil.getTech(selectedName);
          return (
            selectedTech?.category === CategoryKey.BACKEND &&
            selectedTech.derives?.includes(derive)
          );
        });

        if (!stillNeeded) {
          newStack = newStack.filter((t) => t !== derivedTech);
        }
      });
    }
  }

  emit("update:modelValue", newStack);
}
</script>
