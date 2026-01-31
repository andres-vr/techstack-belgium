<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
      {{ t("form.verificationMethod") }}
    </h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 italic">
      {{ t("form.verificationMethodDisclaimer") }}
    </p>
    <div class="space-y-3">
      <label class="flex items-center cursor-pointer">
        <input
          type="radio"
          :checked="modelValue === 'proof'"
          value="proof"
          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
          @change="$emit('update:modelValue', 'proof')"
        />
        <div class="ml-2">
          <span
            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {{ t("form.verificationMethodProof") }}
          </span>
          <span class="block text-xs text-slate-500">
            {{ t("form.verificationPurposeProof") }}
          </span>
        </div>
      </label>
      <label class="flex items-center cursor-pointer">
        <input
          type="radio"
          :checked="modelValue === 'email'"
          value="email"
          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
          @change="$emit('update:modelValue', 'email')"
        />
        <div class="ml-2">
          <span
            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {{ t("form.verificationMethodEmail") }}
          </span>
          <span class="block text-xs text-slate-500">
            {{ t("form.verificationPurposeEmail") }}
          </span>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

defineProps<{
  modelValue: "proof" | "email";
}>();

defineEmits<{
  "update:modelValue": [value: "proof" | "email"];
}>();
</script>
