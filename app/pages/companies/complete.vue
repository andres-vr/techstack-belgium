<template>
  <div class="py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-[95dvw] md:max-w-[75dvw] mx-auto pt-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1
          class="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2"
        >
          {{ t("complete.title") }}
        </h1>
        <p class="text-sm md:text-lg text-slate-600 dark:text-slate-400">
          {{ t("complete.subtitle") }}
        </p>
        <p class="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-2">
          {{ t("complete.helpLocations") }}
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
          :options="incompleteOptions"
          required
        />

        <div v-if="formVisible" class="grid gap-6 md:grid-cols-2">
          <!-- Left column: text inputs & proofs -->
          <div class="space-y-6">
            <!-- Website -->
            <FormField
              id="website"
              :label="t('form.website')"
              v-model="form.website"
              type="url"
              :placeholder="t('form.websitePlaceholder')"
              :hint="t('form.websiteHint')"
              required
            />

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
          submit-label="complete.submit"
          submitting-label="complete.submitting"
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
const techUtil = useTech();

const form = reactive({
  companyName: "",
  website: "",
  locations: [{ province: "", municipality: "", address: "" }] as Array<{
    province?: string;
    municipality?: string;
    address?: string;
  }>,
  techStack: [] as string[],
  proofUrls: ["", "", "", "", ""] as string[],
  cbe: "" as string,
  employees: undefined as number | undefined,
  founded: undefined as number | undefined,
  verificationMethod: "proof" as "proof" | "email",
  contactEmail: "",
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
const error = ref("");
// Watch for errors from composable
watch(emailError, (val) => {
  if (val) error.value = val;
});
const success = ref("");
const formVisible = ref(false);

// Wrapper for verifyOtp that receives code from component
async function handleVerifyOtp(code: string) {
  await verifyOtp(code);
}

// Centralized form validation
const { canSubmit } = useFormValidation(form, {
  emailVerified,
  emailDomainMatchesWebsite,
  formType: "complete",
});

// Compute locked location indices (original company locations that can't be modified)
const lockedLocationIndices = computed(() => {
  // Locations that were already on the company when loaded are "locked"
  // We track this by the original locations count stored at load time
  const originalCount = originalLocationCount.value;
  return Array.from({ length: originalCount }, (_, i) => i);
});

const originalLocationCount = ref(0);

// Load incomplete company modules (build-time glob) and prepare options for select
const incompleteModules: Record<string, any> = import.meta.glob(
  "../../data/companies/incomplete/*.json",
  { eager: true },
);

// Flatten arrays from JSON files and extract company objects
const allIncompleteCompanies: any[] = [];
Object.values(incompleteModules).forEach((m: any) => {
  const data = m.default ?? m;
  if (Array.isArray(data)) {
    allIncompleteCompanies.push(...data);
  } else {
    allIncompleteCompanies.push(data);
  }
});

const incompleteOptions = allIncompleteCompanies
  .map((company: any) => {
    const name = company?.name || "";
    return { value: name, label: name };
  })
  .filter((o: any) => o.value)
  .sort((a: any, b: any) => a.label.localeCompare(b.label));

// Build a map from company name -> data for quick lookup when preloading locations
const incompleteMap = new Map<string, any>();
allIncompleteCompanies.forEach((company: any) => {
  const name =
    company?.name || company?.commercial_name || company?.denomination || "";
  if (name) incompleteMap.set(name, company);
});

// Also load completed companies so submit can detect real-company locations
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
const completedMap = new Map<string, any>();
allCompletedCompanies.forEach((company: any) => {
  const name =
    company?.name || company?.commercial_name || company?.denomination || "";
  if (name) completedMap.set(name, company);
});

// If a cbe query param is present, try to find the company and pre-select it
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
    if (match && (match.name || match.commercial_name || match.denomination)) {
      form.companyName =
        match.name || match.commercial_name || match.denomination || "";

      // show redirect notice if query param present
      const notice = String(useRoute().query?.notice || "");
      if (notice === "incomplete") {
        redirectNotice.value = t("complete.noticeRedirectFromAddIncomplete", {
          cbe: cbeQuery,
        });
      } else if (notice === "complete") {
        redirectNotice.value = t("complete.noticeRedirectFromAddComplete", {
          cbe: cbeQuery,
        });
      }
    }
  } catch (e) {
    console.warn("[complete] cbe preselect failed", e);
  }
});

// Track how many locations are preloaded (locked)
const preloadedCount = ref(0);
// Max locations allowed (used when loading company data)
const MAX_LOCATIONS = 60;

function isLockedLocation(index: number) {
  return index < (preloadedCount.value || 0);
}

// When companyName changes, preload immutable locations from the incomplete dataset
watch(
  () => form.companyName,
  (name) => {
    if (!name) {
      formVisible.value = false;
      // clear fields
      form.website = "";
      form.locations = [{ province: "", municipality: "", address: "" }];
      form.techStack = [];
      form.proofUrls = ["", "", "", "", ""];
      form.cbe = "";
      form.employees = undefined;
      form.founded = undefined;
      preloadedCount.value = 0;
      return;
    }

    // If company is already completed, redirect to update page
    const completedData = completedMap.get(name as string);
    if (completedData) {
      const cbe = String(completedData.cbe || "").replace(/\D/g, "");
      navigateTo(localePath(`/companies/update?cbe=${cbe}&notice=complete`));
      return;
    }

    // Otherwise, try incomplete
    const data = incompleteMap.get(name as string) as any;
    if (!data) {
      formVisible.value = false;
      return;
    }

    // populate fields from the selected company (completed or incomplete)
    form.website = data.site || data.siteUrl || data.website || "";
    form.techStack = Array.isArray(data.tech) ? [...data.tech] : [];
    form.cbe = data.cbe || "";
    form.employees = data.employees;
    form.founded = data.founded;

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

    // populate proof urls from company.proof array if available
    form.proofUrls = ["", "", "", "", ""];
    if (Array.isArray(data.proof)) {
      for (let i = 0; i < Math.min(5, data.proof.length); i++) {
        form.proofUrls[i] = data.proof[i]?.url || data.proof[i]?.image || "";
      }
    }

    preloadedCount.value = Array.isArray(data.locations)
      ? data.locations.length
      : 0;
    formVisible.value = true;
  },
);

async function handleSubmit() {
  error.value = "";
  success.value = "";

  // Prepare payload and normalize submitted URLs to origin (protocol + domain)
  const ensureProtocol = (s: string) => {
    if (!s) return s;
    s = s.trim();
    // Already has protocol
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) return s;
    // Has no protocol, add https://
    return `https://${s}`;
  };

  // Normalize website
  let normalizedWebsite = "";
  try {
    const url = ensureProtocol(String(form.website || ""));
    normalizedWebsite = new URL(url).origin;
  } catch (err) {
    error.value = "Invalid website URL";
    return;
  }

  // Proof URLs: keep exactly as submitted (trimmed), no normalization
  const rawProofs = form.proofUrls
    .map((u) => (u || "").trim())
    .filter((u) => u !== "");

  // Construct normalized payload and only include emailVerified flag (no contact email / useEmailVerification)
  const payload = {
    companyName: form.companyName,
    website: normalizedWebsite,
    // include locations that either have province+municipality OR an address
    locations: form.locations.filter(
      (l) =>
        (l.province && l.municipality) ||
        (l.address && (l.address || "").trim() !== ""),
    ),
    techStack: form.techStack,
    proofUrls: form.verificationMethod === "proof" ? rawProofs : [],
    emailVerified: emailVerified.value || false,
    cbe: form.cbe || undefined,
    employees: form.employees,
    founded: form.founded,
  };

  // Full client-side validation: require either proof or email verification
  const verificationResult = validateVerification({
    verificationMethod: form.verificationMethod,
    proofUrls: payload.proofUrls,
    emailVerified: emailVerified.value,
    emailDomainMatchesWebsite: emailDomainMatchesWebsite.value,
  });
  if (!verificationResult.ok) {
    if (verificationResult.error === "proof-required") {
      error.value = t("complete.errorProofRequired");
      return;
    }
    if (verificationResult.error === "email-domain-mismatch") {
      error.value = t("form.emailDomainMismatch");
      return;
    }
    if (verificationResult.error === "email-not-verified") {
      error.value = t("form.emailNotVerified");
      return;
    }
    if (verificationResult.error === "proof-or-email") {
      error.value = t("complete.errorProofRequired");
      return;
    }
  }

  if (!payload.companyName || !payload.website) {
    error.value = "Missing required fields: companyName, website";
    return;
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

  // Validate each location
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
    // If user provided explicit province+municipality, validate them.
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
        console.error("[complete] geocode failed for address:", loc.address, e);
        error.value =
          "Invalid address — please provide a valid address that can be geocoded.";
        return;
      }
    }
  }

  isSubmitting.value = true;

  try {
    const response = await $fetch("/api/complete", {
      method: "POST",
      body: payload,
    });

    success.value = t("complete.successMessage") as string;
    console.info("[complete] success, will navigate home shortly");

    // Clear form
    form.companyName = "";
    form.website = "";
    form.locations = [{ province: "", municipality: "", address: "" }];
    form.techStack = [];
    form.proofUrls = ["", "", "", "", ""];
    form.cbe = "";
    form.employees = undefined;
    form.founded = undefined;

    // Redirect to home page after a short delay, logging navigation outcome
    try {
      await new Promise((r) => setTimeout(r, 1500));
      console.info("[complete] navigating to home", localePath("/"));
      await navigateTo(localePath("/"));
    } catch (navErr) {
      console.error("[complete] navigation failed", navErr);
    }
  } catch (err: any) {
    error.value =
      err.data?.statusMessage || (t("complete.submissionFailed") as string);
    console.error("[complete] Error:", err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
