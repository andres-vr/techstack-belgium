import { defineStore } from "pinia";
import { languageDeriveMap } from "~/data/tech";
import { TechType, type Company } from "~~/types";

export const useCompaniesStore = defineStore("companies", () => {
  const { getAllCompanies } = useCompanies();
  const companies = getAllCompanies();
  const filtersStore = useFiltersStore();

  const filtered = computed<Company[]>(() => {
    const selectedTechs = unref(filtersStore.selectedTechs) || [];
    const sort = unref(filtersStore.sort) || "name_asc";
    const selectedProvince = unref(filtersStore.selectedProvince) || null;
    const selectedMunicipality = unref(filtersStore.selectedMunicipality) || null;

    // Start from full list
    let result: Company[] = companies.slice();

    // Tech filtering
    if (selectedTechs.length > 0) {
      result = result.filter((company) =>
        selectedTechs.every((sel: string) => {
          if (company.tech.includes(sel)) return true;

          const selItem = techByName.get(sel);
          if (selItem?.type === TechType.LANGUAGE) {
            const derive = languageDeriveMap[sel];
            return (
              !!derive &&
              company.tech.some((u) => techByName.get(u)?.derives?.includes(derive))
            );
          }

          return false;
        })
      );
    }

    // Province filtering
    if (selectedProvince) {
      result = result.filter((company) =>
        (company.locations || []).some((loc) => loc.province === selectedProvince)
      );
    }

    // Municipality filtering
    if (selectedMunicipality) {
      result = result.filter((company) =>
        (company.locations || []).some((loc) => loc.municipality === selectedMunicipality)
      );
    }

    // sorting
    const sorted = [...result];

    switch (sort) {
      case "name_asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "founded_asc":
        sorted.sort((a, b) => (a.founded || 0) - (b.founded || 0));
        break;
      case "founded_desc":
        sorted.sort((a, b) => (b.founded || 0) - (a.founded || 0));
        break;
      case "employees_asc":
        sorted.sort(
          (a, b) => (a.employees || 0) - (b.employees || 0)
        );
        break;
      case "employees_desc":
        sorted.sort(
          (a, b) => (b.employees || 0) - (a.employees || 0)
        );
        break;
    }

    return sorted;
  });

  const count = computed(() => filtered.value.length);

  return {
    filtered,
    count,
  };
});

