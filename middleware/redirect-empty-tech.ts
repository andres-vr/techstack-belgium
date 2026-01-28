import techList, { languageDeriveMap } from "~/data/tech";
import useCompany from "~/app/utils/useCompany";
import useCompanies from "~/app/utils/useCompanies";

export default defineNuxtRouteMiddleware((to: any) => {
  // Only run on /companies/technologies/:technology routes
  if (!to.path.startsWith("/companies/technologies")) return;

  const techSlug = String(to.params.technology || "");
  if (!techSlug) return;

  const { getSlug } = useCompany();
  const matchedTech = techList.find((t: any) => getSlug(t.name) === techSlug);
  const routeTech = matchedTech ? matchedTech.name : techSlug;
  if (!routeTech) return;

  const { getAllCompanies } = useCompanies();
  const companies = getAllCompanies();

  const techByName = new Map(techList.map((t: any) => [t.name, t]));

  const hasCompany = companies.some((company: any) => {
    if (company.tech?.includes(routeTech)) return true;

    const selItem = techByName.get(routeTech) as any;
    if (selItem && selItem.type === "language") {
      const derive = (languageDeriveMap as any)[routeTech];
      if (!derive) return false;
      return company.tech?.some((u: string) => (techByName.get(u) as any)?.derives?.includes(derive));
    }

    return false;
  });

  if (!hasCompany) {
    const localePath = useLocalePath();
    return navigateTo(localePath("/companies/technologies"));
  }
});