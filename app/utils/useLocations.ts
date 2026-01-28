import { useNuxtApp } from '#app';
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
import { provinces as provinceData } from "~~/app/data/provinces";
import type { Location, ProvinceId } from '~~/types';

const municipalitiesByProvince: Record<string, any[]> = {
  antwerp,
  'east-flanders': eastFlanders,
  'west-flanders': westFlanders,
  'flemish-brabant': flemishBrabant,
  limburg,
  hainaut,
  liege,
  luxembourg,
  namur,
  'walloon-brabant': walloonBrabant,
  'brussels-capital': brusselsCapital,
};

export function useLocations() {
  const nuxtApp = useNuxtApp();
  const $i18n = (nuxtApp as any).$i18n;

  function currentLocale() {
    return ((($i18n && ($i18n.locale as any))?.value) as string) || ($i18n && $i18n.locale) || 'en';
  }

  const provinces = computed(() =>
    provinceData.map((p) => ({
      id: p.id,
      name: (p.names as any)[currentLocale()] || (p.names as any).en,
    }))
  );

  function getMunicipalities(provId: string) {
    const list = municipalitiesByProvince[provId] || [];
    return list.map((m) => ({ id: m.id, name: (m.names as any)[currentLocale()] || (m.names as any).en }));
  }

  function getMunicipalityName(munId: string) {
    for (const provId in municipalitiesByProvince) {
      const found = municipalitiesByProvince[provId]?.find(m => m.id === munId);
      if (found) {
        return (found.names as any)[currentLocale()] || (found.names as any).en;
      }
    }
    return munId;
  }

  // Sort locations on municipality names.
  function sortLocations(locs: Location[]) {
    if (!Array.isArray(locs)) return [] as Location[];
    return [...locs].sort((a, b) => {
      const na = getMunicipalityName(a.municipality);
      const nb = getMunicipalityName(b.municipality);
      return na.localeCompare(nb);
    });
  }

  function resolveMunicipalityId(val: string): string | null {
    if (!val) return null;
    // If it already matches an id in our data, return it
    for (const provId in municipalitiesByProvince) {
      const foundById = municipalitiesByProvince[provId]?.find((m) => m.id === val);
      if (foundById) return foundById.id;
    }

    // Try to match by localized name (current locale or english fallback)
    const locale = currentLocale();
    const lcVal = typeof val === 'string' ? val.toLowerCase() : '';
    for (const provId in municipalitiesByProvince) {
      const found = municipalitiesByProvince[provId]?.find((m) => {
        const names = (m.names as any) || {};
        const candidate = (names[locale] || names.en || '').toString();
        if (!candidate) return false;
        return candidate.toLowerCase() === lcVal;
      });
    if (found) return found.id;
    }

    return null;
  }

  // Return unique municipalities from a list of locations.
  function getUniqueMunicipalities(locs: Location[]) {
    if (!Array.isArray(locs)) return [] as Array<{ province: ProvinceId; mun: {id: string; name: string }; address?: string }>;
    const filtered = sortLocations(locs as any).filter((l) => l.municipality);
    const seen = new Set<string>();
    const uniq: Array<{ province: ProvinceId; mun: {id: string; name: string }; address?: string }> = [];

    for (const l of filtered) {
      const resolved = resolveMunicipalityId(l.municipality);
      const munId = resolved ?? l.municipality;
      if (seen.has(munId)) continue;
      seen.add(munId as any);
      uniq.push({ province: l.province, mun: {id: munId, name: getMunicipalityName(munId) }, address: l.address } as any);
    }
    return uniq;
  }

  // Return unique locations for display.
  function getLocationsForDisplay(locs: Location[]) {
    if (!Array.isArray(locs)) return [] as Array<{ province: ProvinceId; municipality: string; address?: string }>;
    const sorted = sortLocations(locs as any);
    const seen = new Set<string>();
    const out: Array<{ province: ProvinceId; municipality: string; address?: string }> = [];
    for (const l of sorted) {
      const resolved = resolveMunicipalityId(l.municipality);
      const munId = resolved ?? l.municipality;
      if (!munId || seen.has(munId)) continue;
      seen.add(munId as any);
      out.push({ province: l.province, municipality: munId as string, address: l.address });
    }
    return out;
  }

  return { provinces, getMunicipalities, getMunicipalityName, sortLocations, getUniqueMunicipalities, getLocationsForDisplay };
}
