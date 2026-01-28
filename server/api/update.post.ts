import type { ProvinceId, SubmissionPayload } from '../../types'
import { geocodeAddress } from '../utils/geocode'
import { createInitialPR } from '../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody<SubmissionPayload>(event)

  // Attempt to geocode any provided address fields server-side so stored
  // submission payloads include coordinates and resolved province/municipality.
  if (Array.isArray(body.locations)) {
    for (const loc of body.locations) {
      if (loc?.address && (loc.coords === undefined || !loc.province || !loc.municipality)) {
        try {
          const res = await geocodeAddress(loc.address)
          if (res) {
            if (!loc.province && res.province) loc.province = res.province.id as ProvinceId
            if (!loc.municipality && res.municipality) loc.municipality = res.municipality.id
            if (!loc.address && res.address) loc.address = res.address
            if (!loc.coords && res.coords) loc.coords = res.coords
          }
        } catch (e) {
          console.warn('[update] geocode failed for', loc.address, e)
        }
      }
    }
  }

  // Only create initial PR - Actions will handle screenshots and processing
  const prResult = await createInitialPR(body, 'update')
  const prNumber = prResult?.number

  return {
    success: true,
    message: `Update submitted! PR #${prNumber || 'pending'} created for review.`,
    prNumber,
    prUrl: prResult?.html_url,
  }
})
