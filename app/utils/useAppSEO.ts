import type { Company, SEOProps } from '~~/types'

export function useAppSEO(props: SEOProps) {
  const { t, locale } = useI18n()
  const { getProvinceName } = useProvince()
  const { getTech } = useTech()
  const { getMunicipalityName } = useLocations()
  const route = useRoute()
  const url = useRequestURL()

  // Parse route and query params to determine page intent
  const provinceId = computed(() => (route.params.province as string) || '')
  const municipalityId = computed(() => (route.params.municipality as string) || '')
  const techParam = computed(() => (route.params.tech as string) || '')

  // Read techs from query string (e.g., ?tech=react,node-js)
  const queryTechs = computed(() => {
    const q = route.query.tech as string
    if (!q) return []
    return q
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  })

  // Determine all selected techs (route param + query params)
  const allSelectedTechs = computed(() => {
    const techs = new Set<string>()
    if (techParam.value) techs.add(techParam.value)
    queryTechs.value.forEach((t) => techs.add(t))
    return Array.from(techs)
  })

  const techCount = computed(() => allSelectedTechs.value.length)

  // Determine page intent classification
  const pageIntent = computed(() => {
    const hasSingleTech = techCount.value === 1
    const hasMultipleTechs = techCount.value >= 2

    if (hasMultipleTechs) {
      return 'filtered' // Multi-tech filter state, never indexable
    }

    if (hasSingleTech) {
      return 'single-tech' // Single-tech landing page
    }

    // Base location page (no tech selected)
    return 'base-location'
  })

  // Location display name
  const locationName = computed(() => {
    const pName = provinceId.value ? getProvinceName(provinceId.value as any, locale.value as any) : ''
    const mName = municipalityId.value ? getMunicipalityName(municipalityId.value) : ''

    if (mName && mName !== municipalityId.value) {
      return pName ? `${mName}, ${pName}` : mName
    }
    return pName || ''
  })

  // Main tech display name (only for single-tech pages)
  const mainTechName = computed(() => {
    if (techCount.value !== 1) return ''
    return getTech(allSelectedTechs.value[0])?.name || allSelectedTechs.value[0]
  })

  // Prefer store count for accuracy; fall back to props.count when store is not available
  const companiesStore = useCompaniesStore();
  const computedCount = computed(() => {
    try {
      const storeCount = unref((companiesStore as any).count) as any
      if (typeof storeCount === 'number') return storeCount
    } catch (e) {
      // ignore
    }

    const companiesProp = (props as any).count
    if (companiesProp !== undefined) {
      const n = Number(unref(companiesProp) || 0)
      if (!Number.isNaN(n)) return n
    }

    return 0
  })

  // Indexing decision logic — index only pages that actually have companies
  const isIndexable = computed(() => {
    const count = Number(unref(computedCount) || 0)
    return count > 0
  })

  // Robots meta rule — index only when there are companies on the page
  const robots = computed(() => (isIndexable.value ? 'index, follow' : 'noindex, nofollow'))

  // Canonical URL rules
  const canonical = computed(() => {
    if (!url) return undefined

    if (pageIntent.value === 'filtered') {
      // Multi-tech filters canonicalize to base location
      const basePath = municipalityId.value
        ? `/companies/provinces/${provinceId.value}/municipalities/${municipalityId.value}`
        : provinceId.value
        ? `/companies/provinces/${provinceId.value}`
        : '/companies'

      return `${url.origin}${basePath}`
    }

    if (isIndexable.value) {
      // Indexable single-tech and base location pages use self
      return url.href
    }

    // Non-indexable pages have no canonical
    return undefined
  })

  // H1 generation based on intent (factual, no buzzwords)
  const h1 = computed(() => {
    const loc = locationName.value
    const tech = mainTechName.value
    const count = Number(unref(computedCount) || 0)

    if (loc && tech) return t('seo.h1Template', { count, tech, location: loc })
    if (loc) return t('seo.h1NoTech', { count, location: loc })
    if (tech) return t('seo.h1NoLocation', { count, tech })
    return t('seo.h1Default', { count }) || 'Companies'
  })

  // Intro text generation (always present, factual only)
  const intro = computed(() => {
    const loc = locationName.value
    const tech = mainTechName.value
    const count = Number(unref(computedCount) || 0)

    // With companies: mention count, tech, location
    if (count > 0) {
      if (loc && tech) {
        return t('seo.introTemplate', { tech, location: loc, count }) ||
          `${count} ${count === 1 ? 'company' : 'companies'} in ${loc} using ${tech}.`
      }
      if (loc) {
        return t('seo.introNoTech', { location: loc, count }) ||
          `${count} ${count === 1 ? 'company' : 'companies'} in ${loc}.`
      }
      if (tech) {
        return t('seo.introNoLocation', { tech, count }) ||
          `${count} ${count === 1 ? 'company' : 'companies'} using ${tech}.`
      }
      return t('seo.introDefault', { count }) ||
        `${count} ${count === 1 ? 'company' : 'companies'}.`
    }

    // No companies
    if (loc && tech) {
      return t('seo.introDefault') || `No companies found using ${tech} in ${loc}.`
    }
    if (loc) {
      return t('seo.introDefault') || `No companies found in ${loc}.`
    }
    if (tech) {
      return t('seo.introDefault') || `No companies found using ${tech}.`
    }
    return t('seo.introDefault') || 'No companies found.'
  })

  // SEO data for templates
  const seoData = computed(() => ({
    h1: h1.value,
    intro: intro.value,
    title: isIndexable.value ? h1.value : undefined,
  }))

  // Structured data (only for indexable pages with companies)
  const structuredData = computed(() => {
    if (!isIndexable.value || !props.companies || props.companies.length === 0) {
      return undefined
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: (props.companies || []).map((c: Company, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: c.name,
        url: `${url.origin}/companies/${c.name.toLowerCase().replace(/\s+/g, '-')}`,
      })),
    }
  })

  // Set all head tags
  useHead({
    // Always set the document title to the H1 so users see updated counts immediately.
    title: () => (seoData.value.h1 ? `${seoData.value.h1}` : undefined),
    meta: computed(() => [
      {
        name: 'description',
        content:
          seoData.value.intro ||
          t('seo.descriptionFallback') ||
          'Discover tech companies by location and technology.',
      },
      {
        name: 'robots',
        content: robots.value,
      },
    ]),
    link: computed(() => {
      const links: any[] = []
      if (canonical.value) {
        links.push({
          rel: 'canonical',
          href: canonical.value,
        })
      }
      return links
    }),
    script: computed(() => {
      const scripts: any[] = []
      if (structuredData.value) {
        scripts.push({
          type: 'application/ld+json',
          children: JSON.stringify(structuredData.value),
        })
      }
      return scripts
    }),
  })

  return {
    isIndexable,
    seoData,
    pageIntent,
    techCount,
    robots,
    canonical,
  }
}
