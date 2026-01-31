<template>
  <footer class="bg-surface">
    <div class="w-[min(90dvw,1200px)] mx-auto px-4 sm:px-6 py-8">
      <div
        class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
      >
        <div>
          <h3 class="font-semibold text-surface mb-2">
            {{ t("footer.browse") }}
          </h3>
          <ul class="space-y-1">
            <li>
              <NuxtLink
                :to="localePath('/companies')"
                :title="t('nav.companies')"
                >{{ t("footer.allCompanies") }}</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                :to="localePath('/provinces')"
                :title="t('nav.provinces')"
                >{{ t("footer.byProvince") }}</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                :to="localePath('/municipalities')"
                :title="t('nav.municipalities')"
                >{{ t("footer.byMunicipality") }}</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                :to="localePath('/technologies')"
                :title="t('nav.technologies')"
                >{{ t("footer.byTechnology") }}</NuxtLink
              >
            </li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold text-surface mb-2">
            {{ t("footer.contribute") }}
          </h3>
          <ul class="space-y-1">
            <li>
              <NuxtLink :to="localePath('/companies/add')">{{
                t("footer.addCompany")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/companies/complete')">{{
                t("footer.completeCompany")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/companies/update')">{{
                t("footer.updateCompany")
              }}</NuxtLink>
            </li>
            <li>
              <a :href="github" target="_blank" rel="noopener noreferrer">{{
                t("nav.github")
              }}</a>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold text-surface mb-2">
            {{ t("footer.resources") }}
          </h3>
          <ul class="space-y-1">
            <li>
              <NuxtLink :to="localePath('/api-docs')">{{
                t("footer.apiDocs")
              }}</NuxtLink>
            </li>
            <li>
              <a href="/companies.json">{{ t("footer.apiEndpoint") }}</a>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold text-surface mb-2">
            {{ t("footer.about") }}
          </h3>
          <ul class="space-y-1">
            <li>
              <NuxtLink :to="localePath('/about')">{{
                t("footer.aboutProject")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/privacy')">{{
                t("footer.privacy")
              }}</NuxtLink>
            </li>
            <li>
              <a :href="license">{{ t("footer.license") }}</a>
            </li>
            <li>
              <a :href="linkedin" target="_blank" rel="noopener noreferrer">{{
                t("footer.contact")
              }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-surface pt-4 text-sm text-muted">
        {{ t("footer.description") }}
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
const { t } = useI18n();

const github = "https://github.com/andres-vr/techstack-belgium";
const linkedin = "https://www.linkedin.com/in/andres-vr/";
const license = "https://creativecommons.org/publicdomain/zero/1.0/";
</script>
