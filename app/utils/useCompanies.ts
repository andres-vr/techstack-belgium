import type { Company } from "~~/types";

export default function useCompany() {
  function flattenModuleOutput(modules: Record<string, any>) {
    const items: Company[] = [];
    for (const m of Object.values(modules)) {
      const data = m?.default ?? m;
      if (!data) continue;
      if (Array.isArray(data)) items.push(...(data as Company[]));
      else items.push(data as Company);
    }
    // Return a stable, predictable order (by name) to avoid SSR/client ordering differences
    return items.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  function getIncompleteCompanies(): Company[] {
    // load both .ts and .json incomplete files
    const modules = import.meta.glob("~/data/companies/incomplete/*.{ts,json}", {
      eager: true,
    }) as Record<string, any>;
    return flattenModuleOutput(modules);
  }

  function getCompleteCompanies(): Company[] {
    // load explicit complete modules and the aggregated all.ts if present
    const modules1 = import.meta.glob("~/data/companies/complete/*.{ts,js,json}", {
      eager: true,
    }) as Record<string, any>;
    const modules2 = import.meta.glob("~/data/companies/all.*", { eager: true }) as Record<string, any>;

    // concat and sort to keep deterministic ordering
    const list = flattenModuleOutput(modules1).concat(flattenModuleOutput(modules2));
    return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  function getAllCompanies(): Company[] {
    // Combine incomplete and complete datasets (incomplete first so edits can override)
    const incomplete = getIncompleteCompanies();
    const complete = getCompleteCompanies();
    // Avoid duplications by CBE
    const seen = new Set<string>();
    const out: Company[] = [];
    for (const c of incomplete.concat(complete)) {
      const key = String(c.cbe);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  function useGeojson() {
  return computed(() => {
    const companiesStore = useCompaniesStore();
    const companies = companiesStore.filtered;

    console.log("Creating GeoJSON from companies:", {
      displayedCount: companies.length,
      sample: companies.slice(0, 3), // Log first 3 companies
    });

    if (!companies || companies.length === 0) {
      console.log("No companies available for GeoJSON");
      return {
        type: "FeatureCollection",
        features: [],
      };
    }

    // Build GeoJSON from any available location coordinates; do not rely on `company.coords`.
    const features: any[] = [];

    function coordsFromLocation(loc: any): [number, number] | null {
      if (!loc) return null;
      if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        return [Number(loc.coordinates[0]), Number(loc.coordinates[1])];
      }
      if (Array.isArray(loc.coords) && loc.coords.length >= 2) {
        const a = loc.coords.map(Number);
        if (Math.abs(a[0]) <= 90 && Math.abs(a[1]) <= 180) return [a[1], a[0]];
        return [a[0], a[1]];
      }
      if (loc.lng != null && loc.lat != null) return [Number(loc.lng), Number(loc.lat)];
      if (loc.lon != null && loc.lat != null) return [Number(loc.lon), Number(loc.lat)];
      if (loc.longitude != null && loc.latitude != null)
        return [Number(loc.longitude), Number(loc.latitude)];
      return null;
    }

    for (const company of companies) {
      const locations = (company as any).locations || [];
      // Add a feature per location if coordinates exist
      for (const loc of locations) {
        const c = coordsFromLocation(loc);
        if (!c) continue;
        const [lng, lat] = c;
        if (Number.isNaN(lng) || Number.isNaN(lat)) continue;
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: {
            cbe: company.cbe,
            name: company.name,
            site: company.site,
            tech: company.tech,
            employees: company.employees,
            founded: company.founded,
            lastUpdated: company.lastUpdated,
            address: loc.address || loc.label || null,
          },
        });
      }
    }

    const geoJson = { type: "FeatureCollection", features };

    console.log("Generated GeoJSON:", {
      totalFeatures: geoJson.features.length,
      features: geoJson.features.slice(0, 3), // Log first 3 features
    });

    return geoJson;
  });
  }

  return {
    getIncompleteCompanies,
    getCompleteCompanies,
    getAllCompanies,
    useGeojson,
  };
}
