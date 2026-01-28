import { configDotenv } from 'dotenv'
import { antwerp } from '../../app/data/municipalities/antwerp'
import { brusselsCapital } from '../../app/data/municipalities/brussels-capital'
import { eastFlanders } from '../../app/data/municipalities/east-flanders'
import { flemishBrabant } from '../../app/data/municipalities/flemish-brabant'
import { hainaut } from '../../app/data/municipalities/hainaut'
import { liege } from '../../app/data/municipalities/liege'
import { limburg } from '../../app/data/municipalities/limburg'
import { luxembourg } from '../../app/data/municipalities/luxembourg'
import { namur } from '../../app/data/municipalities/namur'
import { walloonBrabant } from '../../app/data/municipalities/walloon-brabant'
import { westFlanders } from '../../app/data/municipalities/west-flanders'
import provinces from '../../app/data/provinces'

configDotenv()

type Maybe<T> = T | undefined | null

export type GeocodeResult = {
  province?: { id: string; name: string } | null
  municipality?: { id: string; name: string } | null
  address: string
  coords: [number, number]
}

// Build lookup maps once
const provinceNameToId = new Map<string, string>()
for (const p of provinces) {
  // include id and all localized names
  provinceNameToId.set(p.id.toLowerCase(), p.id)
  for (const key of Object.values(p.names)) {
    provinceNameToId.set(String(key).toLowerCase(), p.id)
  }
}

const allMunicipalities = [
  ...antwerp,
  ...brusselsCapital,
  ...eastFlanders,
  ...flemishBrabant,
  ...hainaut,
  ...liege,
  ...limburg,
  ...luxembourg,
  ...namur,
  ...walloonBrabant,
  ...westFlanders,
]

const municipalityNameToItem = new Map<string, { id: string; province: string; name: string }>()
for (const m of allMunicipalities) {
  municipalityNameToItem.set(m.id.toLowerCase(), { id: m.id, province: m.province, name: (m.names && m.names.nl) || m.id })
  for (const name of Object.values(m.names || {})) {
    municipalityNameToItem.set(String(name).toLowerCase(), { id: m.id, province: m.province, name: String(name) })
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address) return null
  console.info(`[geocode] geocodeAddress called for address: ${address}`)
  const token = process.env.VITE_MAPBOX_ACCESS_TOKEN
  if (!token) {
    console.warn('[geocode] MAPBOX_ACCESS_TOKEN not configured, skipping geocode')
    return null
  }
  console.debug('[geocode] MAPBOX_ACCESS_TOKEN found - proceeding with Mapbox request')

  const encoded = encodeURIComponent(address)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1&country=BE`
  console.debug('[geocode] Mapbox URL:', url)

  try {
    const res = await fetch(url)
    console.debug('[geocode] Mapbox response status:', res.status)
    if (!res.ok) {
      console.warn('[geocode] Mapbox response not OK:', res.status)
      return null
    }
    const json = await res.json()
    console.debug('[geocode] Mapbox response features length:', json?.features?.length || 0)
    const feat = json?.features?.[0]
    if (!feat || !feat.center || feat.center.length < 2) {
      console.warn('[geocode] No feature or center found for address:', address)
      return null
    }
    const [lng, lat] = feat.center

    console.debug('[geocode] Feature summary', { text: feat.text, place_name: feat.place_name, context: feat.context })
    const candidates: string[] = []
    if (feat.text) candidates.push(String(feat.text))
    if (feat.place_name) candidates.push(String(feat.place_name))
    const ctx = feat.context || []
    for (const c of ctx) {
      if (c && c.text) candidates.push(String(c.text))
      if (c && c.short_code) candidates.push(String(c.short_code))
    }
    console.debug('[geocode] candidates extracted from feature:', candidates)

    // normalize and try to find municipality first
    let matchedMunicipality: Maybe<{ id: string; province: string; name: string }> = undefined
    let matchedProvinceId: Maybe<string> = undefined

    for (const cand of candidates) {
      const key = cand.trim().toLowerCase()
      if (!matchedMunicipality && municipalityNameToItem.has(key)) {
        matchedMunicipality = municipalityNameToItem.get(key)
        matchedProvinceId = matchedMunicipality?.province
        break
      }
    }
    console.debug('[geocode] matchedMunicipality:', matchedMunicipality, 'matchedProvinceId:', matchedProvinceId)

    // If municipality not found, try to infer province from candidates
    if (!matchedProvinceId) {
      for (const cand of candidates) {
        const key = cand.trim().toLowerCase()
        if (provinceNameToId.has(key)) {
          matchedProvinceId = provinceNameToId.get(key)
          break
        }
      }
    }

    const provinceObj = matchedProvinceId ? { id: matchedProvinceId, name: provinces.find((p) => p.id === matchedProvinceId)?.names.nl || matchedProvinceId } : null
    const municipalityObj = matchedMunicipality ? { id: matchedMunicipality.id, name: matchedMunicipality.name } : null

    const addressLabel = (feat.place_name && String(feat.place_name)) || (feat.text && String(feat.text)) || ''

    const coordsTuple: [number, number] = [Number(lng), Number(lat)];
    const result: GeocodeResult = {
      province: provinceObj,
      municipality: municipalityObj,
      address: addressLabel,
      coords: coordsTuple,
    }
    console.info('[geocode] Geocode result for address:', address, result)
    return result
  } catch (err) {
    console.error('[geocode] Geocoding failed for address:', address, err)
    return null
  }
}

export default geocodeAddress
