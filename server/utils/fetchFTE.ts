import { randomUUID } from 'crypto'

const NBB_KEY = process.env.NBB_KEY

function getHeaders(accept = 'application/json') {
  const headers: Record<string, string> = {
    Accept: accept,
    'X-Request-Id': randomUUID(),
  }
  if (NBB_KEY) {
    headers['NBB-CBSO-Subscription-Key'] = NBB_KEY
  }
  return headers
}

/**
 * Fetch FTE (Full-Time Equivalent) employee count from NBB API
 * Returns { fte: number | null, wages: number | null }
 */
export async function getFTE(enterpriseNumber: string, year = 2024): Promise<{ fte: number | null; wages: number | null }> {
  try {
    // Remove dots from enterprise number (API expects format without dots)
    const cleanNumber = enterpriseNumber.replace(/\./g, '')
    console.log(`[fetchFTE] Fetching filings for ${cleanNumber} (year: ${year})...`)

    // 1. Get filings for specified year
    const filingUrl = `https://ws.cbso.nbb.be/authentic/legalEntity/${cleanNumber}/references?year=${year}`
    const response = await fetch(filingUrl, {
      headers: getHeaders('application/json'),
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[fetchFTE] No filings found (404)`)
        return { fte: null, wages: null }
      }
      const errorText = await response.text().catch(() => '')
      throw new Error(`Failed to fetch filings: ${response.status}${errorText ? ` - ${errorText}` : ''}`)
    }

    const filings = await response.json()
    console.log(`[fetchFTE] Found ${filings?.length || 0} filing(s)`)

    if (!filings || !filings.length) {
      return { fte: null, wages: null }
    }

    // 2. Pick latest filing
    const latest = filings.sort((a: any, b: any) => {
      const aDate = a.ExerciseDates?.endDate || a.ExerciseDates?.EndDate || ''
      const bDate = b.ExerciseDates?.endDate || b.ExerciseDates?.EndDate || ''
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })[0]

    console.log(`[fetchFTE] Latest filing: ${latest.ReferenceNumber}`)

    // 3. Verify the reference exists
    const refCheckUrl = `https://ws.cbso.nbb.be/authentic/deposit/${latest.ReferenceNumber}/reference`
    const refCheckResponse = await fetch(refCheckUrl, {
      headers: getHeaders('application/json'),
    })

    if (!refCheckResponse.ok) {
      if (refCheckResponse.status === 404) {
        console.log(`[fetchFTE] Reference number not accessible (old filing)`)
        return { fte: null, wages: null }
      }
      throw new Error(`Failed to verify reference: ${refCheckResponse.status}`)
    }

    // 4. Get detailed data (JSON-XBRL format)
    const accountingUrl = `https://ws.cbso.nbb.be/authentic/deposit/${latest.ReferenceNumber}/accountingData`
    const accountingResponse = await fetch(accountingUrl, {
      headers: getHeaders('application/x.jsonxbrl'),
    })

    if (!accountingResponse.ok) {
      const errorText = await accountingResponse.text().catch(() => '(unable to read response)')

      // Check if this is a PDF-only filing (no JSON-XBRL available)
      if (
        accountingResponse.status === 404 &&
        (errorText.includes('pdf model has no published json xbrl') ||
          errorText.includes('reference.number.not.found.json'))
      ) {
        console.log(`[fetchFTE] PDF-only filing (no structured XBRL data available)`)
        return { fte: null, wages: null }
      }

      throw new Error(`Failed to fetch accountingData: ${accountingResponse.status} - ${errorText}`)
    }

    const data = await accountingResponse.json()

    // 5. Extract FTE from JSON-XBRL structure
    let fte: number | null = null
    let wages: number | null = null

    if (data?.Rubrics && Array.isArray(data.Rubrics)) {
      // Look for employee-related rubrics
      for (const rubric of data.Rubrics) {
        const code = rubric.Code || rubric.code || ''
        const value = rubric.Value

        // Employee count is typically in codes 9087, 9088, 9089
        if (['9087', '9088', '9089'].includes(code) && value != null && Number(value) > 0) {
          fte = Number(value)
          console.log(`[fetchFTE] Found FTE in rubric ${code}: ${fte}`)
          break
        }
      }

      // If FTE not found, extract wage data as fallback
      if (fte === null) {
        let totalWages = 0

        for (const rubric of data.Rubrics) {
          const code = rubric.Code || rubric.code || ''
          const value = rubric.Value

          // Sum all personnel cost rubrics (codes starting with 62)
          if ((code === '620' || code === '621' || code === '622' || code.startsWith('62')) &&
              value != null && !isNaN(value)) {
            const numValue = Number(value)
            if (numValue > 0) {
              totalWages += numValue
            }
          }
        }

        // Only keep wage totals relevant for FTE estimation (>= €110k)
        if (totalWages >= 110000) {
          wages = totalWages
          console.log(`[fetchFTE] Total wages: €${wages}`)
        }
      }
    }

    // Apply FTE estimation logic:
    // 1. Use reported FTE if available
    // 2. If not, and wages >= 110k, estimate: floor(wages / 55000)
    let fteFinal = fte
    if (fteFinal === null && wages != null && wages >= 110000) {
      fteFinal = Math.floor(wages / 55000)
      console.log(`[fetchFTE] Estimated FTE from wages: ${fteFinal} (€${wages} / €55k)`)
    }

    if (fteFinal != null) {
      console.log(`[fetchFTE] ✓ FTE: ${fteFinal}`)
    } else {
      console.log(`[fetchFTE] ✗ No FTE data found`)
    }

    return { fte: fteFinal, wages }
  } catch (err: any) {
    console.error(`[fetchFTE] Error for ${enterpriseNumber}:`, err.message || err)
    return { fte: null, wages: null }
  }
}
