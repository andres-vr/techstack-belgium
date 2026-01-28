<template>
  <div class="">
    <main class="w-[min(90dvw,1200px)] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4">
      <div>
        <h1 class="text-2xl font-bold">
          {{ t("search.byMunicipality") }}
        </h1>
        <p class="text-sm text-muted">
          {{ municipalitiesCount }} {{ t("index.municipalities") }}
        </p>
      </div>
      <div v-for="province in displayProvinces" :key="province.id">
        <h2 class="text-xl font-semibold mb-4 mt-8">
          {{ provinceName(province.id) }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
          <NuxtLink
            v-for="m in groupedMunicipalities[province.id] || []"
            :key="`${m.province}-${m.id}`"
            :to="
              localePath(
                `/companies/provinces/${m.province}/municipalities/${m.id}`,
              )
            "
             :title="`${m.name} — ${companyCountLabel(m.companies)}`"
            class="bg-surface border border-surface rounded p-4 text-left hover:border-surface min-w-0"
          >
            <div class="font-semibold truncate">{{ m.name }}</div>
            <div class="text-sm text-muted">
              {{ companyCountLabel(m.companies) }}
            </div>
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { provinces } from "~/data/provinces";
import type { Locale } from "~~/types";

const { t } = useI18n();
const { getAllCompanies } = useCompanies();
const companies = getAllCompanies();

// load municipality lists to resolve localized names (lazy to reduce bundle size)
const munModules = import.meta.glob("~/data/municipalities/*.ts") as Record<
  string,
  () => Promise<any>
>;
const municipalityMap = ref<Record<string, any>>({});

onMounted(async () => {
  const mods = await Promise.all(Object.values(munModules).map((m) => m()));
  const all = mods.flatMap((m: any) => Object.values(m)).flat();
  municipalityMap.value = all.reduce(
    (acc: Record<string, any>, item: any) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<string, any>,
  );
});

const localePath = useLocalePath();
const { locale } = useI18n();
const companyCountLabel = useCountLabel();

const provinceName = (id: string) => {
  const province = provinces.find((p) => p.id === id);
  if (!province) return id;
  return province.names[locale.value as Locale] ?? province.names.en;
};

type MunicipalityEntry = {
  province: string;
  id: string;
  name: string;
  companies: number;
};

const groupedMunicipalities = computed<Record<string, MunicipalityEntry[]>>(
  () => {
    const map = new Map<string, number>();
    for (const c of companies) {
      const seen = new Set<string>();
      for (const loc of c.locations ?? []) {
        const key = `${loc.province}::${loc.municipality}`;
        if (!seen.has(key)) {
          map.set(key, (map.get(key) || 0) + 1);
          seen.add(key);
        }
      }
    }

    const groups: Record<string, MunicipalityEntry[]> = {};
    for (const [key, count] of map.entries()) {
      const [province, muni = ""] = key.split("::");
      const entry = municipalityMap.value?.[muni as string];
      let name = muni;
      if (entry) {
        const lang = (locale.value ?? "en") as string;
        name = (entry.names as Record<string, string>)[lang] ?? entry.names.en;
      }
      const obj: MunicipalityEntry = {
        province: province as string,
        id: muni as string,
        name,
        companies: count,
      };
      const arr =
        groups[province as string] ?? (groups[province as string] = []);
      arr.push(obj);
    }

    // sort groups by companies desc
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => b.companies - a.companies),
    );
    return groups;
  },
);

// Only show provinces that actually have municipalities
const displayProvinces = computed(() =>
  provinces.filter((p) => (groupedMunicipalities.value[p.id] ?? []).length > 0),
);

const municipalitiesCount = computed(
  () => Object.keys(municipalityMap.value).length,
);
</script>
