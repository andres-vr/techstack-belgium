export function useCountLabel() {
  const { t, locale } = useI18n()

  return (count: number) => {
    const n = Number(count || 0)
    if (n === 1) {
      const singularMap: Record<string, string> = {
        en: 'company',
        nl: 'bedrijf',
        fr: 'entreprise',
        de: 'Unternehmen',
      }
      const lang = (locale && (locale as any).value) ? (locale as any).value.split('-')[0] : 'en'
      const word = singularMap[lang] || t('index.company')
      return `${n} ${word}`
    }

    return t('index.companiesCount', { count: n })
  }
}
