<template>
  <div class="py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto pt-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1
          class="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4"
        >
          {{ t("privacy.title") }}
        </h1>
        <p class="text-lg text-slate-600 dark:text-slate-400">
          {{ t("privacy.subtitle") }}
        </p>
      </div>

      <div class="bg-surface rounded-lg shadow-lg p-6 md:p-8 space-y-8">
        <!-- Email Usage Section -->
        <section>
          <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {{ t("privacy.emailUsage.title") }}
          </h2>
          <div class="space-y-4 text-slate-600 dark:text-slate-400">
            <p>{{ t("privacy.emailUsage.purpose") }}</p>
            <p>{{ t("privacy.emailUsage.verification") }}</p>
            <p>{{ t("privacy.emailUsage.deletion") }}</p>
          </div>
        </section>

        <!-- Data Collection Section -->
        <section>
          <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {{ t("privacy.dataCollection.title") }}
          </h2>
          <div class="space-y-4 text-slate-600 dark:text-slate-400">
            <p>{{ t("privacy.dataCollection.types") }}</p>
            <ul class="list-disc list-inside ml-4 space-y-2">
              <li>{{ t("privacy.dataCollection.companyInfo") }}</li>
              <li>{{ t("privacy.dataCollection.techStack") }}</li>
              <li>{{ t("privacy.dataCollection.locations") }}</li>
              <li>{{ t("privacy.dataCollection.proofUrls") }}</li>
              <li>{{ t("privacy.dataCollection.emailTemp") }}</li>
            </ul>
          </div>
        </section>

        <!-- Data Retention Section -->
        <section>
          <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {{ t("privacy.dataRetention.title") }}
          </h2>
          <div class="space-y-4 text-slate-600 dark:text-slate-400">
            <p>{{ t("privacy.dataRetention.companyData") }}</p>
            <p>{{ t("privacy.dataRetention.emailData") }}</p>
          </div>
        </section>

        <!-- Data Sources Section -->
        <section>
          <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {{ t("privacy.dataSources.title") }}
          </h2>
          <div class="space-y-4 text-slate-600 dark:text-slate-400">
            <p>{{ t("privacy.dataSources.description") }}</p>
            <ul class="list-disc list-inside ml-4 space-y-2">
              <li>{{ t("privacy.dataSources.cbe") }}</li>
              <li>{{ t("privacy.dataSources.nbb") }}</li>
              <li>{{ t("privacy.dataSources.community") }}</li>
            </ul>
          </div>
        </section>

        <!-- Contact Section -->
        <section>
          <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {{ t("privacy.contact.title") }}
          </h2>
          <div class="space-y-4 text-slate-600 dark:text-slate-400">
            <p>{{ t("privacy.contact.description") }}</p>
            <p>
              <a
                href="https://github.com/techlabbelgium/techstack-belgium"
                target="_blank"
                rel="noopener noreferrer"
                class="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {{ t("privacy.contact.github") }}
              </a>
            </p>
          </div>
        </section>

        <!-- Last Updated -->
        <section class="pt-8 border-t border-surface">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ t("privacy.lastUpdated") }}: {{ t("privacy.lastUpdatedDate") }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

useHead({
  title: computed(() => t("privacy.pageTitle")),
  meta: [
    {
      name: "description",
      content: computed(() => t("privacy.pageDescription")),
    },
  ],
});
</script>
