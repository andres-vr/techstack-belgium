import type { Company, SubmissionPayload } from '../../types'
import { screenshotCapture } from './screenshot'
import { imgbb } from './storage'

function slugify(input: string) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function prepareSubmission(body: SubmissionPayload, opts?: { label?: string }) {
  const label = opts?.label || 'submission'

  // Capture screenshots for all proof URLs and upload to ImgBB
  const safeName = slugify(body.companyName)
  const screenshots: Array<{ filename: string; imgbbUrl?: string; url?: string }> = []
  const proofForCompany: { url: string; image?: string }[] = []

  for (let i = 0; i < body.proofUrls.length; i++) {
    const proofUrl = body.proofUrls[i]
    if (!proofUrl) continue

    const screenshotFilename = `${safeName}-${Date.now()}-${i}`

    try {
      console.log(`[${label}] Capturing screenshot ${i + 1} for ${proofUrl}`)
      const buffer = await screenshotCapture.captureFullPage(proofUrl)

      // Upload to ImgBB
      let imgbbUrl: string | undefined
      if (imgbb.isConfigured()) {
        try {
          const uploadRes = await imgbb.uploadBuffer(buffer, screenshotFilename)
          imgbbUrl = uploadRes?.url
          console.log(`[${label}] Uploaded to ImgBB: ${imgbbUrl}`)
        } catch (uploadErr) {
          console.warn(`[${label}] ImgBB upload failed for URL ${i + 1}:`, uploadErr)
        }
      } else {
        console.log(`[${label}] ImgBB not configured, skipping upload`)
      }

      screenshots.push({ filename: screenshotFilename, imgbbUrl, url: proofUrl })
      proofForCompany.push({ url: proofUrl, image: imgbbUrl })
    } catch (err) {
      console.error(`[${label}] Screenshot capture/upload failed for URL ${i + 1}:`, err)
      proofForCompany.push({ url: proofUrl })
    }
  }

  const company: Company = {
    cbe: body.cbe,
    name: body.companyName,
    site: body.website,
    locations: body.locations.map((l: any) => ({ province: l.province, municipality: l.municipality, address: l.address, coords: l.coords })),
    tech: body.techStack,
    employees: body.employees,
    founded: body.founded,
    proof: proofForCompany,
    lastUpdated: new Date().toISOString(),
  }

  return { company, screenshots }
}

export default prepareSubmission
