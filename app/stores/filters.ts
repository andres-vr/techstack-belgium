import { useSessionStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { SortCriterion } from "~~/types";

export const useFiltersStore = defineStore("filters", () => {
    const selectedTechs = useSessionStorage<string[]>("selectedTechs", []);
    const sort = useSessionStorage<SortCriterion>("sort", SortCriterion.NAME_ASC);

    const selectedProvince = useSessionStorage<string | null>("selectedProvince", null);
    const selectedMunicipality = useSessionStorage<string | null>("selectedMunicipality", null);

    const addTech = (tech: string) => {
        if (!selectedTechs.value.includes(tech)) {
            selectedTechs.value.push(tech);
        }
    };

    const removeTech = (tech: string) => {
        selectedTechs.value = selectedTechs.value.filter((t) => t !== tech);
    };

    const setSelectedTechs = (techs: string[]) => {
        selectedTechs.value = Array.isArray(techs) ? techs.slice() : [];
    };

    const setProvince = (province: string | null) => {
        selectedProvince.value = province || null;
    };

    const setMunicipality = (municipality: string | null) => {
        selectedMunicipality.value = municipality || null;
    };

    function clearActiveFilters() {
        selectedTechs.value = [];
        sort.value = SortCriterion.NAME_ASC;
        selectedProvince.value = null;
        selectedMunicipality.value = null;
    }

    return {
        selectedTechs,
        sort,
        selectedProvince,
        selectedMunicipality,
        addTech,
        removeTech,
        setSelectedTechs,
        setProvince,
        setMunicipality,
        clearActiveFilters,
    };
});
