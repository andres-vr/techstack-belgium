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
          <!-- Left column: proof URLs -->
          <div class="space-y-6">
            <!-- Proof URLs (First one required, up to 5 total) -->
            <div
              v-for="index in visibleProofFields"
              :key="index"
              class="space-y-1"
            >
              <FormField
                :id="`proofUrl${index}`"
                :label="
                  index === 0
                    ? t('form.proofUrl')
                    : t('form.proofUrlAdditional', { n: index + 1 })
                "
                :model-value="form.proofUrls[index] ?? ''"
                @update:model-value="form.proofUrls[index] = $event"
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

          <!-- Right column: tech stack -->
          <div class="space-y-6">
            <div
              v-for="category in techCategories"
              :key="category.key"
              class="mb-2"
            >
              <h1 class="text-lg font-bold">{{ category.label }}</h1>

              <div v-if="category.key === CategoryKey.BACKEND">
                <div class="text-sm font-medium text-slate-600 mb-1">
                  Languages
                </div>
                <TechItem
                  :items="
                    tech.filter(
                      (t) => t.category === category.key && !t.derives,
                    )
                  "
                  :selected="form.techStack"
                  :getCategoryClasses="getCategoryClasses"
                  :toggleItem="toggleItem"
                  class="mb-3"
                />

                <div class="text-sm font-medium text-slate-600 mb-1">
                  Frameworks
                </div>
                <TechItem
                  :items="
                    tech.filter((t) => t.category === category.key && t.derives)
                  "
                  :selected="form.techStack"
                  :getCategoryClasses="getCategoryClasses"
                  :toggleItem="toggleItem"
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
                  :selected="form.techStack"
                  :getCategoryClasses="getCategoryClasses"
                  :toggleItem="toggleItem"
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
                  :selected="form.techStack"
                  :getCategoryClasses="getCategoryClasses"
                  :toggleItem="toggleItem"
                />
              </div>

              <div v-else>
                <TechItem
                  :items="tech.filter((t) => t.category === category.key)"
                  :selected="form.techStack"
                  :getCategoryClasses="getCategoryClasses"
                  :toggleItem="toggleItem"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Submit area: button, messages and guidelines -->
        <div class="mt-4">
          <div class="flex flex-col items-center gap-3">
            <button
              v-if="canSubmit"
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-800 px-6 py-3 rounded-md hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
            >
              <span v-if="isSubmitting" class="text-white">{{
                t("add.submitting")
              }}</span>
              <span v-else class="text-white">{{ t("add.submit") }}</span>
            </button>
          </div>

          <!-- Loading state -->
          <div
            v-if="isSubmitting"
            class="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4"
          >
            <p class="text-sm text-blue-700">{{ t("add.loading") }}</p>
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
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { categories as techCategories } from "~/data/categories";
import { languageDeriveMap, tech } from "~/data/tech";
import { CategoryKey, Derives } from "~~/types";

const { t } = useI18n();
const localePath = useLocalePath();
const techUtil = useTech();

const form = reactive({
  cbe: "",
  website: "",
  techStack: [] as string[],
  proofUrls: ["", "", "", "", ""] as string[],
});

const isSubmitting = ref(false);
const error = ref("");
const success = ref("");
const pendingRedirectMessage = ref("");

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

const canSubmit = computed(() => {
  // CBE must be present (at least 10 chars for Belgian CBE format)
  if (!form.cbe || form.cbe.replace(/\D/g, "").length < 10) return false;
  // Website must be present
  if (!form.website || form.website.trim() === "") return false;
  // at least one tech
  if (!Array.isArray(form.techStack) || form.techStack.length === 0)
    return false;
  // at least one proof link non-empty
  const hasProof =
    Array.isArray(form.proofUrls) &&
    form.proofUrls.some((p) => (p || "").trim() !== "");
  if (!hasProof) return false;
  return true;
});

const visibleProofFields = computed(() => {
  // Always show the first field. Show the next field when the previous one is filled.
  const indices: number[] = [0];
  for (let i = 1; i < 5; i++) {
    if (form.proofUrls[i - 1]) {
      indices.push(i);
    }
  }
  return indices;
});

function getCategoryClasses(techName: string) {
  const techItem = tech.find((t) => t.name === techName);
  if (!techItem) return "border border-surface text-muted bg-surface";

  if (form.techStack.includes(techName)) {
    return techUtil.getCategoryClasses(techName);
  }

  return "border border-surface text-muted bg-surface hover:border-surface";
}

function toggleItem(name: string, checked: boolean) {
  const techItem = techUtil.getTech(name);

  if (checked) {
    // Add the tech itself
    if (!form.techStack.includes(name)) {
      form.techStack.push(name);
    }

    // If it derives languages, add them too
    if (techItem?.category === CategoryKey.BACKEND && techItem.derives) {
      techItem.derives.forEach((derive) => {
        const derivedTech = languageDeriveMap[derive];
        if (derivedTech && !form.techStack.includes(derivedTech)) {
          form.techStack.push(derivedTech);
        }
      });
    }
  } else {
    // Remove the tech itself
    form.techStack = form.techStack.filter((t) => t !== name);

    // For derived languages, only remove if no other selected tech derives them
    if (techItem?.category === CategoryKey.BACKEND && techItem.derives) {
      techItem.derives.forEach((derive) => {
        const derivedTech = languageDeriveMap[derive];
        if (!derivedTech) return;

        // Check if any OTHER selected tech still derives this language
        const stillNeeded = form.techStack.some((selectedName) => {
          const selectedTech = techUtil.getTech(selectedName);
          return (
            selectedTech?.category === CategoryKey.BACKEND &&
            selectedTech.derives?.includes(derive)
          );
        });

        if (!stillNeeded) {
          form.techStack = form.techStack.filter((t) => t !== derivedTech);
        }
      });
    }
  }
}

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
  const rawProofs = form.proofUrls
    .map((u) => (u || "").trim())
    .filter((u) => u !== "");
  if (!Array.isArray(rawProofs) || rawProofs.length === 0) {
    error.value = t("add.proofRequired") as string;
    return;
  }

  const payload = {
    cbe: cleanCbe,
    techStack: form.techStack,
    proofUrls: rawProofs,
    website: form.website.trim() || undefined,
  };

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
