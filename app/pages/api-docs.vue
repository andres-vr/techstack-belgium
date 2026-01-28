<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-4"
  >
    <div class="w-[min(90dvw,1200px)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <NuxtLink
          :to="localePath('/')"
          class="inline-flex items-center gap-2 text-muted hover:text-primary mb-4"
        >
          <span>←</span>
          <span>{{ t("ui.backToDirectory") }}</span>
        </NuxtLink>
        <h1
          class="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4"
        >
          {{ t("api.title") }}
        </h1>
        <p class="text-sm md:text-lg text-muted">
          {{ t("api.subtitle") }}
        </p>
      </div>

      <div class="space-y-8">
        <!-- Overview -->
        <section
          class="bg-surface border border-surface rounded-lg p-4 sm:p-6 md:p-8"
        >
          <h2 class="text-xl md:text-2xl font-bold text-primary mb-4">
            {{ t("api.overview") }}
          </h2>
          <p class="text-sm md:text-base text-muted mb-4">
            {{ t("api.overviewText") }}
          </p>
          <div
            class="bg-slate-100 dark:bg-slate-800 rounded p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto"
          >
            {{ baseUrl }}/companies.json
          </div>
        </section>

        <!-- Authentication -->
        <section
          class="bg-surface border border-surface rounded-lg p-4 sm:p-6 md:p-8"
        >
          <h2 class="text-xl md:text-2xl font-bold text-primary mb-4">
            {{ t("api.authentication") }}
          </h2>
          <p class="text-sm md:text-base text-muted">
            {{ t("api.authenticationText") }}
          </p>
        </section>

        <!-- Endpoints -->
        <section
          class="bg-surface border border-surface rounded-lg p-4 sm:p-6 md:p-8"
        >
          <h2 class="text-xl md:text-2xl font-bold text-primary mb-6">
            {{ t("api.endpoints") }}
          </h2>

          <!-- GET /api/companies -->
          <div class="mb-8">
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3"
            >
              <span
                class="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded font-mono text-xs sm:text-sm font-semibold"
              >
                GET
              </span>
              <code class="text-sm sm:text-base font-mono break-all"
                >/companies.json</code
              >
            </div>
            <p class="text-xs md:text-sm text-muted mb-4">
              {{ t("api.getCompaniesDescription") }}
            </p>

            <h4 class="font-semibold text-primary mb-2 text-sm md:text-base">
              {{ t("api.response") }}
            </h4>
            <pre
              class="bg-slate-100 dark:bg-slate-800 rounded p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm"
            ><code>{
  "companies": [
    {
      "name": "Example Company",
      "site": "https://example.com",
      "locations": [
        {
          "province": "antwerp",
          "municipality": "antwerp"
        }
      ],
      "tech": ["React", "Node.js", "PostgreSQL"],
      "employees": "RANGE_11_25",
      "founded": 2015,
      "lastUpdated": "2024-06-01",
      "proof": [
        {
          "url": "https://example.com/careers",
          "image": "https://example.com/screenshot.png"
        }
      ]
    }
  ],
  "count": 1234,
  "version": "1.0.0",
  "lastUpdated": "2024-06-01"
}</code></pre>
          </div>
        </section>

        <!-- Response Schema -->
        <section class="bg-surface border border-surface rounded-lg p-8">
          <h2 class="text-2xl font-bold text-primary mb-6">
            {{ t("api.schema") }}
          </h2>

          <div class="space-y-4">
            <div>
              <h4 class="font-semibold text-primary mb-2">Company Object</h4>
              <table class="w-full text-sm">
                <thead class="border-b border-surface">
                  <tr class="text-left">
                    <th class="py-2 font-semibold">{{ t("api.field") }}</th>
                    <th class="py-2 font-semibold">{{ t("api.type") }}</th>
                    <th class="py-2 font-semibold">
                      {{ t("api.description") }}
                    </th>
                  </tr>
                </thead>
                <tbody class="text-muted">
                  <tr class="border-b border-surface">
                    <td class="py-2 font-mono">name</td>
                    <td class="py-2">string</td>
                    <td class="py-2">{{ t("api.fieldName") }}</td>
                  </tr>
                  <tr class="border-b border-surface">
                    <td class="py-2 font-mono">site</td>
                    <td class="py-2">string</td>
                    <td class="py-2">{{ t("api.fieldSite") }}</td>
                  </tr>
                  <tr class="border-b border-surface">
                    <td class="py-2 font-mono">locations</td>
                    <td class="py-2">Location[]</td>
                    <td class="py-2">{{ t("api.fieldLocations") }}</td>
                  </tr>
                  <tr class="border-b border-surface">
                    <td class="py-2 font-mono">tech</td>
                    <td class="py-2">string[]</td>
                    <td class="py-2">{{ t("api.fieldTech") }}</td>
                  </tr>
                  <tr class="border-b border-surface">
                    <td class="py-2 font-mono">employees</td>
                    <td class="py-2">string</td>
                    <td class="py-2">{{ t("api.fieldEmployees") }}</td>
                  </tr>
                  <tr class="border-b border-surface">
                    <td class="py-2 font-mono">founded</td>
                    <td class="py-2">number</td>
                    <td class="py-2">{{ t("api.fieldFounded") }}</td>
                  </tr>
                  <tr class="border-b border-surface">
                    <td class="py-2 font-mono">lastUpdated</td>
                    <td class="py-2">string</td>
                    <td class="py-2">{{ t("api.fieldLastUpdated") }}</td>
                  </tr>
                  <tr>
                    <td class="py-2 font-mono">proof</td>
                    <td class="py-2">Proof[]</td>
                    <td class="py-2">{{ t("api.fieldProof") }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Rate Limits -->
        <section class="bg-surface border border-surface rounded-lg p-8">
          <h2 class="text-2xl font-bold text-primary mb-4">
            {{ t("api.rateLimits") }}
          </h2>
          <p class="text-muted">
            {{ t("api.rateLimitsText") }}
          </p>
        </section>

        <!-- Support -->
        <section class="bg-surface border border-surface rounded-lg p-8">
          <h2 class="text-2xl font-bold text-primary mb-4">
            {{ t("api.support") }}
          </h2>
          <p class="text-muted mb-4">
            {{ t("api.supportText") }}
          </p>
          <a
            :href="issues"
            target="_blank"
            rel="noopener noreferrer"
            class="text-indigo-600 hover:underline"
          >
            {{ t("api.githubIssues") }}
          </a>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();

const baseUrl = computed(() => {
  if (import.meta.client) {
    return window.location.origin;
  }
  return "https://techstack.be";
});

const issues = "https://github.com/andres-vr/techstack-belgium/issues";

useHead({
  title: computed(() => t("api.pageTitle")),
  meta: [
    {
      name: "description",
      content: computed(() => t("api.pageDescription")),
    },
  ],
});
</script>
