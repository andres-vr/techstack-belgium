import type { AddPayload, ProvinceId } from '../../types'
import { enrichCompanyByCBE } from '../utils/enrichCompany'
import { getFTE } from '../utils/fetchFTE'
import { geocodeAddress } from '../utils/geocode'
import { createInitialPR } from '../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody<AddPayload>(event)

  if (!body.cbe || typeof body.cbe !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'CBE number is required',
    })
  }

  if (!Array.isArray(body.techStack) || body.techStack.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one technology is required',
    })
  }

  if (!Array.isArray(body.proofUrls) || body.proofUrls.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one proof URL is required',
    })
  }

  if (!body.website || typeof body.website !== 'string' || body.website.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Website is required',
    })
  }

  console.info('[api/add] Starting add process for CBE:', body.cbe)

  // Step 1: Enrich company data from CBE API
  let company
  try {
    company = await enrichCompanyByCBE(body.cbe)
  } catch (err: any) {
    console.error('[api/add] CBE enrichment failed:', err.message)
    throw createError({
      statusCode: 400,
      statusMessage: `Failed to fetch company data: ${err.message}`,
    })
  }

  if (!company) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Company not found in CBE database',
    })
  }

  console.info('[api/add] Company found:', company.name)

  // Step 2: Fetch FTE from NBB API
  let fteResult
  try {
    fteResult = await getFTE(body.cbe)
  } catch (err: any) {
    console.error('[api/add] FTE fetch failed:', err.message)
    // Don't throw here, just log - FTE is optional
  }

  if (fteResult?.fte != null) {
    company.employees = fteResult.fte
    console.info('[api/add] FTE count:', company.employees)
  } else {
    console.info('[api/add] No FTE data available')
  }

  // Step 3: Validate minimum FTE requirement (>= 2)
  if (company.employees != null && company.employees < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: `Company has fewer than 2 employees (${company.employees}). Only companies with 2+ FTE are eligible.`,
    })
  }

  // Step 4: Geocode any missing location data
  if (Array.isArray(company.locations)) {
    for (const loc of company.locations) {
      if (loc?.address && (!loc.coords || !loc.province || !loc.municipality)) {
        try {
          const res = await geocodeAddress(loc.address)
          if (res) {
            if (!loc.province && res.province) loc.province = res.province.id as ProvinceId
            if (!loc.municipality && res.municipality) loc.municipality = res.municipality.id
            if (!loc.coords && res.coords) loc.coords = res.coords
          }
        } catch (e) {
          console.warn('[api/add] geocode failed for', loc.address, e)
        }
      }
    }
  }

  // Step 5: Add user-provided data
  company.tech = body.techStack

  // Use user-provided website as fallback if CBE didn't return one
  if (!company.site && body.website) {
    company.site = body.website
  }

  // Create submission payload for the PR
  const submissionPayload = {
    companyName: company.name,
    website: company.site,
    locations: company.locations,
    techStack: body.techStack,
    proofUrls: body.proofUrls,
    cbe: company.cbe,
    employees: company.employees,
    founded: company.founded,
  }

  console.info('[api/add] Creating PR for new company')
  const prResult = await createInitialPR(submissionPayload, 'add')
  console.info('[api/add] createInitialPR result:', prResult)
  const prNumber = prResult?.number

  return {
    success: true,
    message: `Company "${company.name}" submitted! PR #${prNumber || 'pending'} created for review.`,
    company: {
      name: company.name,
      cbe: company.cbe,
      site: company.site,
      locations: company.locations,
      employees: company.employees,
      founded: company.founded,
    },
    prNumber,
    prUrl: prResult?.html_url,
  }
})
