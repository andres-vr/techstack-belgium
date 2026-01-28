import type { Company } from "~~/types";
import useCompanies from "./useCompanies";

export default function useCompany() {
  const { getAllCompanies } = useCompanies();
  const companies = getAllCompanies();

  /**
   * Generates a URL-friendly slug from a company name.
   * Converts to lowercase, removes non-alphanumeric chars (except hyphens), trims hyphens.
   */
  function getSlug(name: string): string {
    return String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  /**
   * Finds a company by its slug.
   */
  function getCompanyBySlug(slug: string): Company | undefined {
    return companies.find((c) => getSlug(c.name) === slug);
  }

  /**
   * Finds a company by its CBE number (string or number).
   */
  function getCompanyByCbe(cbe: string): Company | undefined {
    const key = String(cbe).trim();
    return companies.find((c) => String((c as any).cbe) === key);
  }

  /**
   * Get breadcrumb label for a company by name or slug.
   */
  function getCompanyBreadcrumbLabel(input: string): string {
    const company = getCompanyBySlug(input);
    return company ? company.name : decodeURIComponent(input);
  }

  /**
   * Get company's display website
   */
  function getDisplaySite(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname + u.pathname;
    } catch {
      return url;
    }
  }

  function getEmployeeRange(employees: number): string {
    if (employees <= 10) {
      return "2-10";
    } else if (employees <= 25) {
      return "11-25";
    } else if (employees <= 50) {
      return "26-50";
    } else if (employees <= 100) {
      return "51-100";
    } else if (employees <= 250) {
      return "101-250";
    } else if (employees <= 500) {
      return "251-500";
    } else if (employees <= 1000) {
      return "501-1000";
    } else if (employees > 1000) {
      return "1000+";
    }
    return String(employees);
  }

  return {
    getSlug,
    getCompanyBySlug,
    getCompanyByCbe,
    getCompanyBreadcrumbLabel,
    getDisplaySite,
    getEmployeeRange,
  };
}
