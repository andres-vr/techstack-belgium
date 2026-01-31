<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
  >
    <div class="w-[min(90dvw,1200px)] mx-auto px-4 sm:px-6 py-12 pt-4">
      <!-- Back Link -->
      <div class="mb-8">
        <NuxtLink
          :to="localePath('/')"
          class="inline-flex items-center gap-2 text-muted hover:text-primary mb-4 text-sm"
        >
          <span>←</span>
          <span>{{ t("ui.backToDirectory") }}</span>
        </NuxtLink>
        <h1 class="text-2xl md:text-4xl font-bold text-primary mb-4">
          {{ t("about.title") }}
        </h1>
        <p class="text-sm md:text-lg text-muted">
          {{ t("about.subtitle") }}
        </p>
      </div>

      <div class="space-y-8">
        <!-- Mission -->
        <section class="bg-surface border border-surface rounded-lg p-4 md:p-8">
          <h2 class="text-xl md:text-2xl font-bold text-primary mb-4">
            {{ t("about.mission") }}
          </h2>
          <p class="text-sm md:text-base text-muted mb-4">
            {{ t("about.missionText") }}
          </p>
        </section>

        <!-- Data Source -->
        <section class="bg-surface border border-surface rounded-lg p-4 md:p-8">
          <h2 class="text-xl md:text-2xl font-bold text-primary mb-4">
            {{ t("about.dataSource") }}
          </h2>
          <p class="text-sm md:text-base text-muted mb-4">
            {{ t("about.dataSourceText") }}
          </p>
          <div
            class="bg-slate-100 dark:bg-slate-800 rounded p-4 text-xs md:text-sm space-y-2 mb-4"
          >
            <p>
              <strong>{{ t("about.dataSourceDate") }}:</strong>
              {{ t("about.dataSourceDateValue") }}
            </p>
            <p>
              <strong>{{ t("about.dataSourceProvider") }}:</strong>
              {{ t("about.dataSourceProviderValue") }}
            </p>
          </div>
          <p class="text-muted text-sm">
            {{ t("about.dataSourcingText") }}
            <a
              href="https://cbeapi.be/"
              target="_blank"
              rel="noopener"
              class="text-primary hover:underline font-semibold"
            >
              CBEAPI
            </a>
            {{ t("about.dataSourcingAnd") }}
            <a
              href="https://developer.cbso.nbb.be/"
              target="_blank"
              rel="noopener"
              class="text-primary hover:underline font-semibold"
            >
              {{ t("about.dataSourcingNBB") }}
            </a>
            {{ t("about.dataSourcingEnd") }}
          </p>
        </section>

        <!-- Methodology -->
        <section class="bg-surface border border-surface rounded-lg p-8">
          <h2 class="text-2xl font-bold text-primary mb-4">
            {{ t("about.methodology") }}
          </h2>
          <p class="text-muted mb-6">
            {{ t("about.methodologyIntro") }}
          </p>

          <div class="space-y-6">
            <!-- Step 1 -->
            <div class="flex gap-4">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm"
              >
                1
              </div>
              <div>
                <h3 class="font-semibold text-primary mb-2">
                  {{ t("about.step1Title") }}
                </h3>
                <p class="text-muted">
                  {{ t("about.step1Text") }}
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex gap-4">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm"
              >
                2
              </div>
              <div>
                <h3 class="font-semibold text-primary mb-2">
                  {{ t("about.step2Title") }}
                </h3>
                <p class="text-muted mb-3">
                  {{ t("about.step2Text") }}
                </p>
                <div
                  class="bg-slate-100 dark:bg-slate-800 rounded p-3 font-mono text-sm space-y-1"
                >
                  <p>• NACE 62010 - {{ t("about.nace62010") }}</p>
                  <p>• NACE 62020 - {{ t("about.nace62020") }}</p>
                  <p>• NACE 62200 - {{ t("about.nace62200") }}</p>
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex gap-4">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm"
              >
                3
              </div>
              <div>
                <h3 class="font-semibold text-primary mb-2">
                  {{ t("about.step3Title") }}
                </h3>
                <p class="text-muted">
                  {{ t("about.step3Text") }}
                </p>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="flex gap-4">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm"
              >
                4
              </div>
              <div>
                <h3 class="font-semibold text-primary mb-2">
                  {{ t("about.step4Title") }}
                </h3>
                <p class="text-muted">
                  {{ t("about.step4Text") }}
                </p>
              </div>
            </div>

            <!-- Step 5 -->
            <div class="flex gap-4">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm"
              >
                5
              </div>
              <div>
                <h3 class="font-semibold text-primary mb-2">
                  {{ t("about.step5Title") }}
                </h3>
                <p class="text-muted">
                  {{ t("about.step5Text") }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Data Quality -->
        <section class="bg-surface border border-surface rounded-lg p-8">
          <h2 class="text-2xl font-bold text-primary mb-4">
            {{ t("about.dataQuality") }}
          </h2>
          <ul class="space-y-3 text-muted">
            <li class="flex gap-3">
              <span class="text-green-600 dark:text-green-400 font-bold"
                >✓</span
              >
              <span>{{ t("about.qualityPoint1") }}</span>
            </li>
            <li class="flex gap-3">
              <span class="text-green-600 dark:text-green-400 font-bold"
                >✓</span
              >
              <span>{{ t("about.qualityPoint2") }}</span>
            </li>
            <li class="flex gap-3">
              <span class="text-green-600 dark:text-green-400 font-bold"
                >✓</span
              >
              <span>{{ t("about.qualityPoint3") }}</span>
            </li>
            <li class="flex gap-3">
              <span class="text-green-600 dark:text-green-400 font-bold"
                >✓</span
              >
              <span>{{ t("about.qualityPoint4") }}</span>
            </li>
          </ul>
        </section>

        <!-- Verification -->
        <section class="bg-surface border border-surface rounded-lg p-8">
          <h2 class="text-2xl font-bold text-primary mb-4">
            {{ t("about.verification") }}
          </h2>
          <p class="text-muted mb-6">
            {{ t("about.verificationIntro") }}
          </p>

          <div class="space-y-6">
            <!-- Email Verification -->
            <div class="flex gap-4">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm"
              >
                1
              </div>
              <div>
                <h3 class="font-semibold text-primary mb-2">
                  {{ t("about.verificationByEmail") }}
                </h3>
                <p class="text-muted">
                  {{ t("about.verificationByEmailText") }}
                </p>
              </div>
            </div>

            <!-- Proof Verification -->
            <div class="flex gap-4">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm"
              >
                2
              </div>
              <div>
                <h3 class="font-semibold text-primary mb-2">
                  {{ t("about.verificationByProof") }}
                </h3>
                <p class="text-muted">
                  {{ t("about.verificationByProofText") }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Community -->
        <section class="bg-surface border border-surface rounded-lg p-8">
          <h2 class="text-2xl font-bold text-primary mb-4">
            {{ t("about.community") }}
          </h2>
          <p class="text-muted mb-6">
            {{ t("about.communityText") }}
          </p>
          <div class="flex flex-wrap gap-3">
            <NuxtLink
              :to="localePath('/companies/add')"
              class="inline-block bg-primary text-black dark:text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              {{ t("about.addNewCompany") }}
            </NuxtLink>

            <NuxtLink
              :to="localePath('/companies/complete')"
              class="inline-block bg-primary text-black dark:text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              {{ t("about.completeCompany") }}
            </NuxtLink>

            <NuxtLink
              :to="localePath('/companies/update')"
              class="inline-block bg-primary text-black dark:text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              {{ t("about.updateCompany") }}
            </NuxtLink>
          </div>
        </section>

        <!-- Contact -->
        <section class="bg-surface border border-surface rounded-lg p-8">
          <h2 class="text-2xl font-bold text-primary mb-4">
            {{ t("about.contact") }}
          </h2>
          <p class="text-muted">
            {{ t("about.contactText") }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();

useHead({
  title: () => t("about.pageTitle"),
  meta: [
    {
      name: "description",
      content: () => t("about.pageDescription"),
    },
  ],
});
</script>
