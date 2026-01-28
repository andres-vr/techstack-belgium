import { geocodeAddress } from '../utils/geocode'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const address = body?.address
  console.info('[api/geocode] geocode request for address:', address)
  if (!address) {
    throw createError({ statusCode: 400, statusMessage: 'Missing address' })
  }

  const res = await geocodeAddress(address)
  if (!res) {
    console.warn('[api/geocode] geocoding returned no result for address:', address)
    // Return 422 so client can show a friendly validation message
    throw createError({ statusCode: 422, statusMessage: 'Unable to geocode address' })
  }

  console.info('[api/geocode] geocode success for address:', address, res)
  return { success: true, data: res }
})
