import * as fs from 'fs'
import * as path from 'path'
import type { Location } from '../../types'

const CBE_KEY = process.env.CBE_KEY

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function toTitleCase(str: string) {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatCbe(number?: string, formatted?: string) {
  if (formatted) return formatted
  const digits = (number || '').replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`
  }
  return number || ''
}

function extractName(item: any) {
  const candidates = [
    item.commercial_name,
    item.denomination,
    item.abbreviation,
    item.denomination_with_legal_form,
    item.branch_name,
  ]
    .map(v => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
  const name = candidates[0] || ''
  return toTitleCase(name)
}

function extractWebsite(item: any) {
  const site = item.contact_infos?.web
  if (!site || typeof site !== 'string') return ''
  return site.trim()
}

function extractFoundedYear(item: any) {
  if (!item.start_date) return null
  const match = String(item.start_date).match(/^(\d{4})/)
  if (match) return Number(match[1])
  return null
}

function stripParentheticalSuffix(str: string) {
  if (typeof str !== 'string') return str
  return str
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Build municipality maps from the data files
function buildMunicipalityMaps() {
  const municipalityMap = new Map<string, string>() // normalized name -> province
  const municipalityIdMap = new Map<string, string>() // normalized name -> id

  const MUNICIPALITIES_DIR = path.join(process.cwd(), 'app', 'data', 'municipalities')
  
  if (!fs.existsSync(MUNICIPALITIES_DIR)) return { municipalityMap, municipalityIdMap }

  const files = fs.readdirSync(MUNICIPALITIES_DIR).filter(file => file.endsWith('.ts'))

  const municipalityPattern = /\{\s*id:\s*"([^"]+)"[^}]*?province:\s*"([^"]+)"[^}]*?names:\s*\{([^}]+)\}/g

  for (const file of files) {
    const content = fs.readFileSync(path.join(MUNICIPALITIES_DIR, file), 'utf8')
    let match

    while ((match = municipalityPattern.exec(content)) !== null) {
      const [, id, province, namesBlock] = match
      const names = [
        id,
        (namesBlock.match(/nl:\s*"([^"]+)"/) || [])[1],
        (namesBlock.match(/fr:\s*"([^"]+)"/) || [])[1],
        (namesBlock.match(/en:\s*"([^"]+)"/) || [])[1],
        (namesBlock.match(/de:\s*"([^"]+)"/) || [])[1],
      ].filter(Boolean)

      for (const name of names) {
        const key = normalize(name as string)
        municipalityMap.set(key, province)
        municipalityIdMap.set(key, id)
      }
    }
  }

  return { municipalityMap, municipalityIdMap }
}

function resolveLocation(city: string, maps: ReturnType<typeof buildMunicipalityMaps>, fullAddress?: string) {
  const cleanCity = city ? String(city).replace(/\s*\([^)]*\)\s*$/g, '').trim() : ''
  const key = cleanCity ? normalize(cleanCity) : ''
  const province = (maps.municipalityMap.get(key) as any) || null
  const municipality = maps.municipalityIdMap.get(key) || null
  
  const cleanFullAddress = typeof fullAddress === 'string'
    ? fullAddress.replace(/\s*\([^)]*\)\s*$/g, '').trim()
    : fullAddress || ''

  if (!cleanFullAddress) return null

  return {
    province,
    municipality,
    address: cleanFullAddress,
  }
}

function extractAllLocations(item: any, maps: ReturnType<typeof buildMunicipalityMaps>) {
  const locations: Location[] = []
  if (!Array.isArray(item.establishments)) return locations

  for (const est of item.establishments) {
    if (!est.city) continue
    const location = resolveLocation(est.city, maps, est.full_address || '')
    if (location) {
      locations.push(location)
    }
  }

  // If no establishments resolved, try main address
  if (locations.length === 0 && item.address?.city) {
    const location = resolveLocation(item.address.city, maps, item.address?.full_address || '')
    if (location) {
      locations.push(location)
    }
  }

  return locations
}

function toCleanNumber(number: any) {
  if (number == null) return ''
  if (typeof number === 'number') return String(number).replace(/\D/g, '')
  if (typeof number === 'string') return number.replace(/\D/g, '')
  if (typeof number === 'object') {
    const candidates = [number.cbe, number.cbe_number, number.entityNumber, number.entity_number, number.number, number.id]
    for (const c of candidates) {
      if (c == null) continue
      if (typeof c === 'number' || typeof c === 'string') return String(c).replace(/\D/g, '')
    }
  }
  return ''
}

/**
 * Fetch company data from CBE API
 */
export async function fetchCompanyFromCBE(cbeNumber: string): Promise<any | null> {
  if (!CBE_KEY) {
    throw new Error('CBE_KEY environment variable not set')
  }

  const maxAttempts = 3
  let attempt = 0
  let backoff = 500
  const cleanNumber = toCleanNumber(cbeNumber)

  while (attempt < maxAttempts) {
    attempt++
    try {
      const response = await fetch(`https://cbeapi.be/api/v1/company/${cleanNumber}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CBE_KEY}`,
          Accept: 'application/json',
        },
      })

      if (response.status === 429) {
        const ra = response.headers.get('retry-after')
        const wait = ra ? parseInt(ra, 10) * 1000 : backoff
        console.warn(`[enrichCompany] HTTP 429 (attempt ${attempt}). Waiting ${wait}ms before retry.`)
        await sleep(wait + Math.round(Math.random() * 300))
        backoff *= 2
        continue
      }

      if (!response.ok) {
        if (response.status >= 500 && attempt < maxAttempts) {
          console.warn(`[enrichCompany] HTTP ${response.status} (attempt ${attempt}). Retrying after ${backoff}ms.`)
          await sleep(backoff + Math.round(Math.random() * 200))
          backoff *= 2
          continue
        }
        if (response.status === 404) {
          return null
        }
        throw new Error(`CBE API error: ${response.status}`)
      }

      const json = await response.json()
      const item = Array.isArray(json.data) ? json.data[0] : json.data
      return item || null
    } catch (err: any) {
      if (attempt < maxAttempts) {
        console.warn(`[enrichCompany] Fetch error (attempt ${attempt}): ${err.message}. Retrying after ${backoff}ms.`)
        await sleep(backoff + Math.round(Math.random() * 200))
        backoff *= 2
        continue
      }
      throw err
    }
  }
  return null
}

/**
 * Build a company object from CBE API data
 */
export function buildCompanyFromCBEData(item: any) {
  const maps = buildMunicipalityMaps()
  
  const cbe = formatCbe(item.cbe_number, item.cbe_number_formatted)
  const name = extractName(item)
  const site = extractWebsite(item)
  const locations = extractAllLocations(item, maps)
  
  // Clean addresses
  for (const loc of locations) {
    if (loc && loc.address) loc.address = stripParentheticalSuffix(loc.address)
  }
  
  const founded = extractFoundedYear(item)

  return {
    cbe,
    name,
    site: site || '',
    locations,
    tech: [] as string[],
    employees: null as number | null,
    founded: founded || null,
    proof: [] as { url: string; image?: string }[],
    emailVerified: false,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Main function: fetch company data from CBE API and build company object
 */
export async function enrichCompanyByCBE(cbeNumber: string) {
  console.log(`[enrichCompany] Fetching company data for CBE ${cbeNumber}`)
  
  const apiData = await fetchCompanyFromCBE(cbeNumber)
  
  if (!apiData) {
    return null
  }
  
  const company = buildCompanyFromCBEData(apiData)
  
  if (!company.name) {
    throw new Error('Company has no name in CBE data')
  }
  
  console.log(`[enrichCompany] Found: ${company.name}`)
  return company
}
