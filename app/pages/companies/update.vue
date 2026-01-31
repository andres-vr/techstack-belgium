<template>
  <div class="py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-[95dvw] md:max-w-[75dvw] mx-auto pt-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1
          class="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2"
        >
          {{ t("update.title") }}
        </h1>
        <p class="text-sm md:text-lg text-slate-600 dark:text-slate-400">
          {{ t("update.subtitle") }}
        </p>
        <p class="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-2">
          {{ t("update.helpLocations") }}
        </p>
        <div
          v-if="redirectNotice"
          class="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4 flex items-start justify-between"
        >
          <p class="text-sm text-blue-700">{{ redirectNotice }}</p>
          <button
            type="button"
            @click="redirectNotice = ''"
            class="text-blue-500 ml-4"
          >
            Dismiss
          </button>
        </div>
      </div>

      <!-- Form -->
      <form
        @submit.prevent="handleSubmit"
        class="bg-surface rounded-lg shadow-lg p-4 md:p-8 space-y-6"
      >
        <!-- Company selector always visible -->
        <FormSearchSelectField
          id="companyName"
          :label="t('form.companyName')"
          v-model="form.companyName"
          :placeholder="t('form.companyNamePlaceholder')"
          :options="completedOptions"
          required
        />

        <div v-if="formVisible" class="grid gap-6 md:grid-cols-2">
          <!-- Left column: text inputs & proofs -->
          <div class="space-y-6">
            <!-- Locations -->
            <FormLocations
              v-model="form.locations"
              :locked-indices="lockedLocationIndices"
            />

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
          submit-label="update.submit"
          submitting-label="update.submitting"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { antwerp } from "~/data/municipalities/antwerp";
import { brusselsCapital } from "~/data/municipalities/brussels-capital";
import { eastFlanders } from "~/data/municipalities/east-flanders";
import { flemishBrabant } from "~/data/municipalities/flemish-brabant";
import { hainaut } from "~/data/municipalities/hainaut";
import { liege } from "~/data/municipalities/liege";
import { limburg } from "~/data/municipalities/limburg";
import { luxembourg } from "~/data/municipalities/luxembourg";
import { namur } from "~/data/municipalities/namur";
import { walloonBrabant } from "~/data/municipalities/walloon-brabant";
import { westFlanders } from "~/data/municipalities/west-flanders";
import { tech } from "~/data/tech";

const { t } = useI18n();
const redirectNotice = ref("");
const localePath = useLocalePath();

const form = reactive({
  companyName: "",
  locations: [{ province: "", municipality: "", address: "" }] as Array<{
    province?: string;
    municipality?: string;
    address?: string;
  }>,
  techStack: [] as string[],
  proofUrls: ["", "", "", "", ""] as string[],
  verificationMethod: "proof" as "proof" | "email",
  contactEmail: "",
  website: "", // We need this to check domain match
});

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

const isSubmitting = ref(false);
// Track how many locations are preloaded (locked)
const preloadedCount = ref(0);

const error = ref("");
// Watch for errors from composable
watch(emailError, (val) => {
  if (val) error.value = val;
});

function isLockedLocation(index: number) {
  return index < (preloadedCount.value || 0);
}

// Compute locked location indices for FormLocations component
const lockedLocationIndices = computed(() => {
  return Array.from({ length: preloadedCount.value }, (_, i) => i);
});

// Wrapper for verifyOtp that receives code from component
async function handleVerifyOtp(code: string) {
  await verifyOtp(code);
}

// Centralized form validation
const { canSubmit } = useFormValidation(form, {
  emailVerified,
  emailDomainMatchesWebsite,
  formType: "update",
});

const success = ref("");

// Load completed company modules (build-time glob) and prepare options for select
const completedModules: Record<string, any> = import.meta.glob(
  "../../data/companies/complete/*.json",
  { eager: true },
);

// Flatten arrays from JSON files and extract company objects
const allCompletedCompanies: any[] = [];
Object.values(completedModules).forEach((m: any) => {
  const data = m.default ?? m;
  if (Array.isArray(data)) {
    allCompletedCompanies.push(...data);
  } else {
    allCompletedCompanies.push(data);
  }
});

const completedOptions = allCompletedCompanies
  .map((company: any) => {
    const name = company?.name || "";
    return { value: name, label: name };
  })
  .filter((o: any) => o.value)
  .sort((a: any, b: any) => a.label.localeCompare(b.label));

// Build a map for quick lookup of completed companies by name
const completedMap = new Map<string, any>();
allCompletedCompanies.forEach((company: any) => {
  if (company?.name) completedMap.set(company.name, company);
});

// Also load incomplete companies so update form treats their locations as immutable too
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
const incompleteMap = new Map<string, any>();
allIncompleteCompanies.forEach((company: any) => {
  const name =
    company?.name || company?.commercial_name || company?.denomination || "";
  if (name) incompleteMap.set(name, company);
});

// If a cbe query param is present, try to find the matching completed company and pre-select it
onMounted(() => {
  try {
    const cbeQuery = String(useRoute().query?.cbe || "").replace(/\D/g, "");
    if (!cbeQuery) return;
    const match =
      allCompletedCompanies.find(
        (c: any) => String(c.cbe || "").replace(/\D/g, "") === cbeQuery,
      ) ??
      allIncompleteCompanies.find(
        (c: any) => String(c.cbe || "").replace(/\D/g, "") === cbeQuery,
      );
    if (match && match.name) {
      form.companyName = match.name as string;

      // Show redirect notice if query param present
      const notice = String(useRoute().query?.notice || "");
      if (notice === "complete") {
        redirectNotice.value = t("update.noticeRedirectFromAddComplete", {
          cbe: cbeQuery,
        });
      } else if (notice === "incomplete") {
        redirectNotice.value = t("update.noticeRedirectFromAddIncomplete", {
          cbe: cbeQuery,
        });
      }
    }
  } catch (e) {
    console.warn("[update] cbe preselect failed", e);
  }
});

// Whether the rest of the form is visible (company selected)
const formVisible = ref(false);

// When a company is selected from the search field, populate the form
watch(
  () => form.companyName,
  (name) => {
    if (!name) {
      formVisible.value = false;
      // clear fields
      form.locations = [{ province: "", municipality: "", address: "" }];
      form.techStack = [];
      form.proofUrls = ["", "", "", "", ""];
      return;
    }

    // prefer completed company, but accept incomplete company as well
    const data = (completedMap.get(name as string) ??
      incompleteMap.get(name as string)) as any;
    if (!data) {
      formVisible.value = false;
      return;
    }

    // populate fields from the selected company
    form.website = data.site || "";
    form.techStack = Array.isArray(data.tech) ? [...data.tech] : [];
    // map locations (ensure structure) and add one empty slot if allowed
    const locs = Array.isArray(data.locations)
      ? data.locations.map((l: any) => ({
          province: l.province || "",
          municipality: l.municipality || "",
          address: l.address || l.fullAddress || "",
        }))
      : [];
    if (locs.length === 0)
      locs.push({ province: "", municipality: "", address: "" });
    if (locs.length < MAX_LOCATIONS)
      locs.push({ province: "", municipality: "", address: "" });
    form.locations = locs.slice(0, MAX_LOCATIONS);

    preloadedCount.value = Array.isArray(data.locations)
      ? data.locations.length
      : 0;

    // populate proof urls from company.proof array if available
    form.proofUrls = ["", "", "", "", ""];
    if (Array.isArray(data.proof)) {
      for (let i = 0; i < Math.min(5, data.proof.length); i++) {
        form.proofUrls[i] = data.proof[i]?.url || "";
      }
    }

    formVisible.value = true;
  },
);

// Max locations allowed (used when loading company data)
const MAX_LOCATIONS = 60;

function removeLocation(index: number) {
  // Prevent removing locked/preloaded locations
  if (isLockedLocation(index)) return;
  form.locations.splice(index, 1);
  if (form.locations.length === 0) {
    // ensure at least one empty slot remains
    form.locations.push({ province: "", municipality: "", address: "" });
  }
}

async function handleSubmit() {
  error.value = "";
  success.value = "";

  // Prepare payload
  const payload = {
    companyName: form.companyName,
    locations: form.locations.filter(
      (l: any) =>
        (l.province && l.municipality) ||
        (l.address && (l.address || "").trim() !== ""),
    ),
    techStack: form.techStack,
    proofUrls:
      form.verificationMethod === "proof"
        ? form.proofUrls.filter((url: string) => url.trim() !== "")
        : [],
    emailVerified: emailVerified.value || false,
  };

  // Full client-side validation: require proof or verified email
  const verificationResult = validateVerification({
    verificationMethod: form.verificationMethod,
    proofUrls: payload.proofUrls,
    emailVerified: emailVerified.value,
    emailDomainMatchesWebsite: emailDomainMatchesWebsite.value,
  });

  if (!verificationResult.ok) {
    if (verificationResult.error === "proof-required") {
      error.value =
        "At least one proof URL is required when using proof verification";
      return;
    }
    if (verificationResult.error === "email-domain-mismatch") {
      error.value = "Email domain does not match website";
      return;
    }
    if (verificationResult.error === "email-not-verified") {
      error.value = "Email must be verified before submitting";
      return;
    }
  }

  if (!Array.isArray(payload.locations) || payload.locations.length === 0) {
    error.value =
      "Missing required field: locations (provide province+municipality or an address)";
    return;
  }

  if (!Array.isArray(payload.techStack) || payload.techStack.length === 0) {
    error.value = "techStack must be a non-empty array";
    return;
  }

  // Ensure selected company matches a completed company (page should be used for existing completed items)
  if (!completedOptions.some((o: any) => o.value === payload.companyName)) {
    error.value = "Selected company is not in the completed companies list";
    return;
  }

  // Validate each location (only validate province/municipality if provided)
  const municipalitiesByProvince: Record<string, any[]> = {
    antwerp: antwerp,
    "east-flanders": eastFlanders,
    "west-flanders": westFlanders,
    "flemish-brabant": flemishBrabant,
    limburg: limburg,
    hainaut: hainaut,
    liege: liege,
    luxembourg: luxembourg,
    namur: namur,
    "walloon-brabant": walloonBrabant,
    "brussels-capital": brusselsCapital,
  };

  for (const loc of payload.locations) {
    if (loc.province && loc.municipality) {
      const municipalitiesInProvince = municipalitiesByProvince[loc.province];
      if (!municipalitiesInProvince) {
        error.value = `Unknown province: ${loc.province}`;
        return;
      }
      const municipalityExists = municipalitiesInProvince.some(
        (m: any) => m.id === loc.municipality,
      );
      if (!municipalityExists) {
        error.value = `Invalid municipality '${loc.municipality}' for province '${loc.province}'`;
        return;
      }
    }
  }

  // Validate all tech stack items exist
  const techNames = tech.map((t: any) => t.name);
  const invalidTech = payload.techStack.filter(
    (t: any) => !techNames.includes(t),
  );
  if (invalidTech.length > 0) {
    error.value = `Invalid technologies: ${invalidTech.join(", ")}`;
    return;
  }

  // If any location only contains an address (no province/municipality), validate it by calling server geocode endpoint.
  // Skip geocoding for preloaded/locked locations (first preloadedCount indices)
  for (let i = 0; i < payload.locations.length; i++) {
    const loc = payload.locations[i] as any;
    const isLocked = i < (preloadedCount.value || 0);

    // Only geocode user-entered locations (not locked) that have an address but no province/municipality
    if (!isLocked && loc.address && (!loc.province || !loc.municipality)) {
      try {
        const res: any = await $fetch("/api/geocode", {
          method: "POST",
          body: { address: loc.address },
        });
        const geo = res?.data || res;

        // Accept either coords array or lat/lng fields
        if (
          !geo ||
          !((geo.coords && geo.coords.length >= 2) || (geo.lat && geo.lng))
        ) {
          throw new Error("geocode-no-coords");
        }

        // assign coordinates (geo.coords is [lng, lat])
        if (geo.coords && geo.coords.length >= 2) {
          loc.lat = geo.coords[1];
          loc.lng = geo.coords[0];
        } else {
          loc.lat = geo.lat;
          loc.lng = geo.lng;
        }

        // set province/municipality if available, prefer object.id when present
        if (geo.province)
          loc.province =
            typeof geo.province === "string" ? geo.province : geo.province.id;
        if (geo.municipality)
          loc.municipality =
            typeof geo.municipality === "string"
              ? geo.municipality
              : geo.municipality.id;

        if (geo.address) loc.address = geo.address;
      } catch (e) {
        console.error("[update] geocode failed for address:", loc.address, e);
        error.value =
          "Invalid address — please provide a valid address that can be geocoded.";
        return;
      }
    }
  }

  isSubmitting.value = true;

  try {
    const response = await $fetch("/api/update", {
      method: "POST",
      body: payload,
    });

    success.value = t("update.successMessage") as string;
    console.info("[update] success, will navigate home shortly");

    // Clear form
    form.companyName = "";
    form.locations = [{ province: "", municipality: "", address: "" }];
    form.techStack = [];
    form.proofUrls = ["", "", "", "", ""];

    // Redirect to home page after a short delay, logging navigation outcome
    try {
      await new Promise((r) => setTimeout(r, 1500));
      console.info("[update] navigating to home", localePath("/"));
      await navigateTo(localePath("/"));
    } catch (navErr) {
      console.error("[update] navigation failed", navErr);
    }
  } catch (err: any) {
    error.value =
      err.data?.statusMessage || (t("update.submissionFailed") as string);
    console.error("[submit] Error:", err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
