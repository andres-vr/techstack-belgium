<template>
  <div class="space-y-4">
    <div v-for="index in visibleFields" :key="index" class="space-y-1">
      <FormField
        :id="`proofUrl${index}`"
        :label="
          index === 0
            ? t('form.proofUrl')
            : t('form.proofUrlAdditional', { n: index + 1 })
        "
        :model-value="modelValue[index] ?? ''"
        @update:model-value="updateUrl(index, $event)"
        type="url"
        :placeholder="t('form.proofUrlPlaceholder')"
        :hint="
          index === 0
            ? t('form.proofUrlHint')
            : t('form.proofUrlHintAdditional')
        "
        :required="index === 0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const visibleFields = computed(() => {
  // Always show the first field. Show the next field when the previous one is filled.
  const indices: number[] = [0];
  for (let i = 1; i < 5; i++) {
    if (props.modelValue[i - 1]) {
      indices.push(i);
    }
  }
  return indices;
});

function updateUrl(index: number, value: string) {
  const newUrls = [...props.modelValue];
  newUrls[index] = value;
  emit("update:modelValue", newUrls);
}
</script>
