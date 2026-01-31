<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-2">
      {{ t("form.locations") }} <span class="text-red-500">*</span>
    </label>
    <div class="space-y-3">
      <div
        v-for="(location, index) in visibleLocations"
        :key="index"
        class="flex gap-3 items-start p-3 bg-surface border border-surface rounded"
      >
        <div class="flex-1">
          <FormField
            :id="`location-address-${index}`"
            :label="t('form.address')"
            :model-value="modelValue[index]?.address || ''"
            @update:model-value="updateAddress(index, $event)"
            type="text"
            :placeholder="t('form.addressPlaceholder')"
            :required="index === 0"
            :readonly="isLocked(index)"
          />
        </div>

        <button
          v-if="!isLocked(index) && canRemove(index)"
          type="button"
          @click="removeLocation(index)"
          class="p-2 text-slate-400 hover:text-red-600 mt-6"
        >
          {{ t("form.remove") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Location {
  province?: string;
  municipality?: string;
  address?: string;
}

const { t } = useI18n();

const props = defineProps<{
  modelValue: Location[];
  lockedIndices?: number[];
  maxLocations?: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Location[]];
}>();

// Compute visible location indices (show next when previous is filled)
const MAX_LOCATIONS = computed(() => props.maxLocations ?? 60);

const visibleLocations = computed(() => {
  const result: number[] = [0];
  for (let i = 1; i < MAX_LOCATIONS.value; i++) {
    const prev = props.modelValue[i - 1];
    if (
      prev &&
      ((prev.province && prev.municipality) ||
        (prev.address && prev.address.trim() !== ""))
    ) {
      result.push(i);
    }
  }
  return result;
});

function isLocked(index: number): boolean {
  return props.lockedIndices?.includes(index) ?? false;
}

function canRemove(index: number): boolean {
  const loc = props.modelValue[index];
  return (
    props.modelValue.length > 1 ||
    Boolean(loc?.address && loc.address.trim() !== "")
  );
}

function updateAddress(index: number, value: string) {
  if (isLocked(index)) return;

  const newLocations = [...props.modelValue];
  if (!newLocations[index]) {
    newLocations[index] = { province: "", municipality: "", address: "" };
  }
  newLocations[index] = { ...newLocations[index], address: value };
  emit("update:modelValue", newLocations);
}

function removeLocation(index: number) {
  if (isLocked(index)) return;

  const newLocations = props.modelValue.filter((_, i) => i !== index);
  if (newLocations.length === 0) {
    newLocations.push({ province: "", municipality: "", address: "" });
  }
  emit("update:modelValue", newLocations);
}
</script>
