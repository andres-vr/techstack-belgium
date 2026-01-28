import { provinces } from '~/data/provinces'
import type { ProvinceId } from '~~/types'

export function useProvince() {
  function getProvinceName(provinceId?: ProvinceId, locale: 'en' | 'nl' = 'en'): string {
    if (!provinceId) return ''
    const prov = provinces.find(p => p.id === provinceId)
    if (!prov) return ''
    return prov.names[locale] ?? ''
  }


  return { getProvinceName }
}
