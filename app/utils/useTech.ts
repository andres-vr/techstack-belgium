import { categoryColors } from '~/data/categories'
import { tech as techData } from '~/data/tech'
import type { CategoryKey, Tech } from '~~/types'

export const techByName = new Map<string, Tech>()
techData.forEach((t) => techByName.set(t.name, t))

export function useTech() {
  // Lowercase map for case-insensitive lookups
  const techByLower = new Map<string, Tech>()
  techData.forEach((t) => techByLower.set(t.name.toLowerCase(), t))

  // Slug map to handle common URL/query variants (e.g., "node-js", "nodejs", "node.js")
  const techSlugMap = new Map<string, Tech>()
  function slugify(s: string) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
  }
  techData.forEach((t) => {
    const slug = slugify(t.name)
    techSlugMap.set(slug, t)
    const nodash = slug.replace(/-/g, "")
    if (!techSlugMap.has(nodash)) techSlugMap.set(nodash, t)
  })

  function getTech(name?: string): Tech | undefined {
    if (!name) return undefined
    const q = String(name).trim()
    // Try exact (preserve performance)
    const exact = techByName.get(q)
    if (exact) return exact
    // Fallback to case-insensitive lookup
    const lower = techByLower.get(q.toLowerCase())
    if (lower) return lower

    // Try slug-based matching for queries or URL params (node-js, nodejs, node.js)
    const s = slugify(q)
    const bySlug = techSlugMap.get(s)
    if (bySlug) return bySlug

    return undefined
  }

  function getLogoUrl(name?: string): string {
    const t = getTech(name)
    const techName = t?.name ?? (name ?? '')
    // Normalize slug: remove whitespace, convert '.' -> 'dot' and '#' -> 'sharp'
    const slug = String(techName)
      .replace(/\s+/g, '')
      .replace(/\./g, 'dot')
      .replace(/#/g, 'sharp')
      .toLowerCase()

    if (slug === 'csharp') return `/tech/csharp.svg`
    if (slug === 'dotnet') return `/tech/dotnet.svg`
    if (slug === 'dotnetmaui') return `/tech/dotnet.svg`
    return `/tech/${slug}.svg`
  }

  function getCategory(key: CategoryKey) {
    return categoryColors[key] ? { key, ...categoryColors[key] } : null
  }

  function getCategoryColors(key: CategoryKey) {
    return categoryColors[key] || {
      border: "border-gray-500",
      bg: "bg-gray-50",
      text: "text-gray-700",
      accent: "bg-gray-500",
    }
  }

  function getCategoryClasses(techName: string): string {
    const t = getTech(techName)
    if (!t) return ""
    const c = getCategoryColors(t.category)
    return `${c.bg} ${c.text} ${c.border}`
  }

  function getLogoClasses(techName?: string): string {
    if (!techName) return ''
    const slug = String(techName).replace(/\s+/g, '').replace(/\./g, 'dot').toLowerCase()
    
    // Dark logos that need inversion in dark mode
    const darkLogos = ['nextjs', 'rust', 'symphony', 'fastify', 'express', 'kafka', 'aws', 'koa']
    
    if (darkLogos.includes(slug)) {
      return 'dark:invert'
    }
    
    return ''
  }

  function getTextColorClasses(techName?: string): string {
    if (!techName) return ''
    const slug = String(techName).replace(/\s+/g, '').replace(/\./g, 'dot').toLowerCase()
    if (slug === 'nuxt') return 'text-black dark:text-white'
    return ''
  }

  // Map sorted tech names to Tech objects and filter undefined
  function getSortedTechItems(techNames: string[] | undefined): Tech[] {
    if (!techNames || techNames.length === 0) return []

    const grouped = new Map<string, string[]>()
    for (const techName of techNames) {
      const t = getTech(techName)
      const category = t?.category || 'other'
      if (!grouped.has(category)) grouped.set(category, [])
      grouped.get(category)!.push(techName)
    }

    const categoryOrder = [
      'frontend',
      'backend',
      'communication',
      'database',
      'devops',
      'cloud',
      'mobile',
    ]

    const result: string[] = []
    for (const cat of categoryOrder) {
      if (grouped.has(cat)) {
        // Place languages first on backend
        if (cat === 'backend' ) {
          const langs = grouped.get(cat)!.filter((n) => {
            const t = getTech(n)
            return t?.type === 'language'
          })
          langs.sort((a, b) => a.localeCompare(b))
          const frameworks = grouped.get(cat)!.filter((n) => {
            const t = getTech(n)
            return t?.type === 'framework'
          })
          frameworks.sort((a, b) => a.localeCompare(b))
          result.push(...langs, ...frameworks)
          grouped.delete(cat)
        } else {
        const arr = grouped.get(cat)!.slice().sort((a, b) => a.localeCompare(b))
        // Special-case frontend: prefer CSS-like frameworks first
        if (cat === 'frontend') {
          const cssLike = arr.filter((n) => {
            const t = getTech(n)
            return t?.type === 'framework' && /css|sass|bootstrap/i.test(t.name)
          })
          const other = arr.filter((n) => !cssLike.includes(n))
          cssLike.sort((a, b) => a.localeCompare(b))
          other.sort((a, b) => a.localeCompare(b))
          result.push(...cssLike, ...other)
        } else {
          result.push(...arr)
        }
        grouped.delete(cat)
        }
      }
    }

    // Remaining categories
    for (const [cat, arr] of grouped.entries()) {
      result.push(...arr.slice().sort((a, b) => a.localeCompare(b)))
    }

    return result.map((n) => getTech(n)).filter((t): t is Tech => !!t)
  }

  return { getTech, getLogoUrl, getLogoClasses, getTextColorClasses, getCategory, getCategoryColors, getCategoryClasses, getSortedTechItems }
}

export default useTech