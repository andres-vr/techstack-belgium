<template>
  <div class="space-y-4">
    <FormField
      id="contactEmail"
      :label="t('form.contactEmail')"
      :model-value="contactEmail"
      @update:model-value="$emit('update:contactEmail', $event)"
      type="email"
      :placeholder="t('form.contactEmailPlaceholder')"
      :hint="t('form.contactEmailHint')"
      required
    />

    <!-- Domain mismatch warning -->
    <div
      v-if="contactEmail && website && !emailDomainMatchesWebsite"
      class="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-md p-3 text-sm"
    >
      <p class="text-amber-700 dark:text-amber-300">
        <svg
          class="w-4 h-4 inline mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        {{ t("form.emailDomainMismatch") }}
      </p>
    </div>

    <!-- Privacy Notice -->
    <div
      class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-3 text-sm"
    >
      <p class="text-blue-700 dark:text-blue-300">
        <svg
          class="w-4 h-4 inline mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          />
        </svg>
        {{ t("form.privacyNotice") }}
        <NuxtLink
          :to="localePath('/privacy')"
          class="font-semibold underline hover:no-underline"
        >
          {{ t("form.privacyPolicy") }}
        </NuxtLink>
      </p>
    </div>

    <!-- Email verified success -->
    <div
      v-if="emailVerified"
      class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-4"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-green-700 dark:text-green-300">
            {{ t("form.emailVerified") }}
          </p>
        </div>
      </div>
    </div>

    <!-- OTP sent, show input field -->
    <div v-else-if="otpSent && !emailVerified" class="space-y-4">
      <div
        class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700 dark:text-green-300">
              {{ t("form.otpSent") }}
            </p>
          </div>
        </div>
      </div>

      <FormField
        id="otpCode"
        :label="t('form.otpCode')"
        v-model="otpCodeLocal"
        type="text"
        maxlength="6"
        :placeholder="t('form.otpCodePlaceholder')"
        :hint="t('form.otpCodeHint')"
        required
      />

      <!-- OTP error message -->
      <div
        v-if="otpError"
        class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-3 text-sm"
      >
        <p class="text-red-700 dark:text-red-300">{{ otpError }}</p>
      </div>

      <button
        type="button"
        @click="verifyOtp"
        :disabled="verifyingOtp || otpCodeLocal.length !== 6"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <span v-if="verifyingOtp">{{ t("form.verifyingOtp") }}</span>
        <span v-else>{{ t("form.verifyOtp") }}</span>
      </button>
    </div>

    <!-- Send verification button (only when domain matches and OTP not sent) -->
    <button
      v-if="
        contactEmail && emailDomainMatchesWebsite && !otpSent && !emailVerified
      "
      type="button"
      @click="sendVerificationEmail"
      :disabled="sendingEmail"
      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      <span v-if="sendingEmail">{{ t("form.sendingEmail") }}</span>
      <span v-else>{{ t("form.sendVerificationEmail") }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();

const props = defineProps<{
  contactEmail: string;
  website: string;
  otpSent: boolean;
  emailVerified: boolean;
  sendingEmail: boolean;
  verifyingOtp: boolean;
  otpError: string;
  emailDomainMatchesWebsite: boolean;
}>();

const emit = defineEmits<{
  "update:contactEmail": [value: string];
  sendVerificationEmail: [];
  verifyOtp: [code: string];
}>();

const otpCodeLocal = ref("");

function sendVerificationEmail() {
  emit("sendVerificationEmail");
}

function verifyOtp() {
  emit("verifyOtp", otpCodeLocal.value);
}
</script>
