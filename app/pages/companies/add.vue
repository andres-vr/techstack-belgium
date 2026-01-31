<template>
  <div class="py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-[95dvw] md:max-w-[75dvw] mx-auto pt-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1
          class="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2"
        >
          {{ t("add.title") }}
        </h1>
        <p class="text-sm md:text-lg text-slate-600 dark:text-slate-400">
          {{ t("add.subtitle") }}
        </p>
        <div
          v-if="pendingRedirectMessage"
          class="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4 flex items-start justify-between"
        >
          <p class="text-sm text-blue-700">{{ pendingRedirectMessage }}</p>
        </div>
      </div>

      <!-- Form -->
      <form
        @submit.prevent="handleSubmit"
        class="bg-surface rounded-lg shadow-lg p-4 md:p-8 space-y-6"
      >
        <FormField
          id="cbeNumber"
          :label="t('form.cbe')"
          v-model="form.cbe"
          type="text"
          :placeholder="t('form.cbePlaceholder')"
          :hint="t('form.cbeHint')"
          required
        />

        <!-- Website (required) -->
        <FormField
          id="website"
          :label="t('form.website')"
          v-model="form.website"
          type="url"
          :placeholder="t('form.websitePlaceholder')"
          :hint="t('form.websiteHintAdd')"
          required
        />

        <div
          v-if="form.cbe && form.cbe.length >= 10"
          class="grid gap-6 md:grid-cols-2"
        >
          <!-- Left column: proof URLs or email verification -->
          <div class="space-y-6">
            <!-- Verification Method Selection -->
            <FormVerificationMethodSelector v-model="form.verificationMethod" />

            <!-- Proof URLs (shown when proof method is selected) -->
            <FormProofUrls
              v-if="form.verificationMethod === 'proof'"
              v-model="form.proofUrls"
            />

            <!-- Email Verification (shown when email method is selected) -->
            <FormEmailVerification
              v-else-if="form.verificationMethod === 'email'"
              :contact-email="form.contactEmail"
              :website="form.website"
              :otp-sent="otpSent"
              :email-verified="emailVerified"
              :sending-email="sendingEmail"
              :verifying-otp="verifyingOtp"
              :otp-error="otpError"
              :email-domain-matches-website="emailDomainMatchesWebsite"
              @update:contact-email="form.contactEmail = $event"
              @send-verification-email="sendVerificationEmail"
              @verify-otp="handleVerifyOtp"
            />
          </div>

          <!-- Right column: tech stack -->
          <div class="space-y-6">
            <FormTechStackSelector v-model="form.techStack" />
          </div>
        </div>

        <!-- Submit area: button, messages and guidelines -->
        <FormSubmit
          :can-submit="canSubmit"
          :is-submitting="isSubmitting"
          :error="error"
          :success="success"
          submit-label="add.submit"
          submitting-label="add.submitting"
          loading-label="add.loading"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tech } from "~/data/tech";

const { t } = useI18n();
const localePath = useLocalePath();

const form = reactive({
  cbe: "",
  website: "",
  techStack: [] as string[],
  proofUrls: ["", "", "", "", ""] as string[],
  verificationMethod: "proof" as "proof" | "email",
  contactEmail: "",
});

const isSubmitting = ref(false);
const error = ref("");
const success = ref("");
const pendingRedirectMessage = ref("");
const emailVerificationSent = ref(false);

const {
  otpSent,
  emailVerified,
  sendingEmail,
  verifyingOtp,
  error: emailError,
  otpError,
  emailDomainMatchesWebsite,
  sendVerificationEmail,
  verifyOtp,
} = useEmailVerification(form);

// Centralized form validation
const { canSubmit } = useFormValidation(form, {
  emailVerified,
  emailDomainMatchesWebsite,
  formType: "add",
});

// Wrapper for verifyOtp that receives code from component
async function handleVerifyOtp(code: string) {
  await verifyOtp(code);
}

// Watch for errors from composable
watch(emailError, (val) => {
  if (val) error.value = val;
});

const incompleteModules: Record<string, any> = import.meta.glob(
  "../../data/companies/incomplete/*.{json,js,ts}",
  { eager: true },
);
const allIncompleteCompanies: any[] = [];
Object.values(incompleteModules).forEach((m: any) => {
  const data = m.default ?? m;
  if (Array.isArray(data)) allIncompleteCompanies.push(...data);
  else allIncompleteCompanies.push(data);
});

const completedModules: Record<string, any> = import.meta.glob(
  "../../data/companies/complete/*.{json,js,ts}",
  { eager: true },
);
const allCompletedCompanies: any[] = [];
Object.values(completedModules).forEach((m: any) => {
  const data = m.default ?? m;
  if (Array.isArray(data)) allCompletedCompanies.push(...data);
  else allCompletedCompanies.push(data);
});

// Watch CBE input and redirect to submit/update if company exists
watch(
  () => form.cbe,
  (val) => {
    try {
      const clean = String(val || "").replace(/\D/g, "");
      if (clean.length >= 10) {
        const inc = allIncompleteCompanies.find(
          (c: any) => String(c.cbe || "").replace(/\D/g, "") === clean,
        );
        if (inc) {
          // show a short notice so user understands why we redirect
          pendingRedirectMessage.value = t("add.noticeRedirectToComplete", {
            cbe: clean,
          });
          setTimeout(() => {
            navigateTo(
              localePath(`/companies/complete?cbe=${clean}&notice=incomplete`),
            );
          }, 700);
          return;
        }
        const comp = allCompletedCompanies.find(
          (c: any) => String(c.cbe || "").replace(/\D/g, "") === clean,
        );
        if (comp) {
          pendingRedirectMessage.value = t("add.noticeRedirectToUpdate", {
            cbe: clean,
          });
          setTimeout(() => {
            navigateTo(
              localePath(`/companies/update?cbe=${clean}&notice=complete`),
            );
          }, 700);
          return;
        }
      }
    } catch (e) {
      console.warn("[add] cbe redirect check failed", e);
    }
  },
);

async function handleSubmit() {
  error.value = "";
  success.value = "";

  // Clean CBE number (remove dots and spaces)
  const cleanCbe = form.cbe.replace(/[\.\s]/g, "");
  if (cleanCbe.length < 10) {
    error.value = t("add.invalidCbe") as string;
    return;
  }

  // Proof URLs: keep exactly as submitted (trimmed), no normalization
  // Prepare payload based on verification method
  let payload;
  if (form.verificationMethod === "email") {
    payload = {
      cbe: cleanCbe,
      techStack: form.techStack,
      proofUrls: [], // Empty for email verification
      website: form.website.trim() || undefined,
      contactEmail: form.contactEmail.trim(),
      useEmailVerification: true,
      emailVerified: true,
    };
  } else {
    const rawProofs = form.proofUrls
      .map((u) => (u || "").trim())
      .filter((u) => u !== "");
    if (!Array.isArray(rawProofs) || rawProofs.length === 0) {
      error.value = t("add.proofRequired") as string;
      return;
    }

    payload = {
      cbe: cleanCbe,
      techStack: form.techStack,
      proofUrls: rawProofs,
      website: form.website.trim() || undefined,
      emailVerified: false,
    };
  }

  // Validate tech stack
  const techNames = tech.map((t: any) => t.name);
  const invalidTech = payload.techStack.filter(
    (t: any) => !techNames.includes(t),
  );
  if (invalidTech.length > 0) {
    error.value = `Invalid technologies: ${invalidTech.join(", ")}`;
    return;
  }

  isSubmitting.value = true;

  try {
    const response: any = await $fetch("/api/add", {
      method: "POST",
      body: payload,
    });

    success.value = t("add.successMessage", {
      name: response.company?.name || "Company",
    }) as string;
    console.info("[add] success, will navigate home shortly");

    // Clear form
    form.cbe = "";
    form.website = "";
    form.techStack = [];
    form.proofUrls = ["", "", "", "", ""];
    form.verificationMethod = "proof";
    form.contactEmail = "";
    emailVerificationSent.value = false;

    // Redirect to home page after a short delay
    try {
      await new Promise((r) => setTimeout(r, 2000));
      console.info("[add] navigating to home", localePath("/"));
      await navigateTo(localePath("/"));
    } catch (navErr) {
      console.error("[add] navigation failed", navErr);
    }
  } catch (err: any) {
    error.value =
      err.data?.statusMessage || (t("add.submissionFailed") as string);
    console.error("[add] Error:", err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
