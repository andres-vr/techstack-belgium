<template>
  <div class="mt-4">
    <div class="flex flex-col items-center gap-3">
      <button
        v-if="canSubmit"
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-800 px-6 py-3 rounded-md hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
      >
        <span v-if="isSubmitting" class="text-white">{{
          t(submittingLabel)
        }}</span>
        <span v-else class="text-white">{{ t(submitLabel) }}</span>
      </button>
    </div>

    <!-- Loading state -->
    <div
      v-if="isSubmitting && loadingLabel"
      class="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4"
    >
      <p class="text-sm text-blue-700">{{ t(loadingLabel) }}</p>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-md p-4 mt-4"
    >
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- Success Message -->
    <div
      v-if="success"
      class="bg-green-50 border border-green-200 rounded-md p-4 mt-4"
    >
      <p class="text-sm text-green-700">{{ success }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

defineProps<{
  canSubmit: boolean;
  isSubmitting: boolean;
  error?: string;
  success?: string;
  submitLabel: string;
  submittingLabel: string;
  loadingLabel?: string;
}>();
</script>
