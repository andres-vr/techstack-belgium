import type { Company } from "~~/types";

export function useMap() {
  const companiesStore = useCompaniesStore();

  // Build GeoJSON for a single company
  function buildGeojsonFromCompany(company: Company) {
    const features: any[] = [];

    const locations = (company as any).locations || [];
    
    for (const loc of locations) {
      if (!loc?.address || !loc?.coords) {
        continue;
      }
      
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: loc.coords },
        properties: {
          cbe: company.cbe,
          name: company.name,
          address: loc.address,
        },
      });
    }
    
    return { type: "FeatureCollection", features };
  }

  // Build GeoJSON for an array of companies
  function buildGeojsonFromCompanies(companies: Company[]) {
    const allFeatures: any[] = [];

    for (const company of companies) {
      const companyGeojson = buildGeojsonFromCompany(company);
      allFeatures.push(...companyGeojson.features);
    }

    return { type: "FeatureCollection", features: allFeatures };
  }

  // Filter companies to only keep locations within a given province/municipality
  // Uses store's filtered companies and applies geographic filtering
  function getCompaniesByArea(province?: string, municipality?: string): Company[] {
    const companies = companiesStore.filtered;
    
    if (!province || !Array.isArray(companies)) return companies;

    return companies
      .map((c) => {
        const locations = (c.locations || []).filter((loc) => {
          if (!loc || !loc.province) return false;
          if (loc.province !== province) return false;
          if (municipality) return loc.municipality === municipality;
          return true;
        });
        return { ...c, locations };
      })
      .filter((c) => (c.locations || []).length > 0);
  }

  return { buildGeojsonFromCompany, buildGeojsonFromCompanies, getCompaniesByArea };
}

export default useMap;
