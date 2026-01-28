import * as fs from 'fs/promises';
import * as path from 'path';
import { prepareSubmission } from '../../server/utils/prepareSubmission';
import type { SubmissionPayload } from '../../types';

async function findCompanyByName(name: string, completeDir: string): Promise<{ filePath: string; index: number; company: any } | null> {
  try {
    const files = await fs.readdir(completeDir)
    const jsonFiles = files.filter(f => f.startsWith('companies-') && f.endsWith('.json'))

    for (const fileName of jsonFiles) {
      const filePath = path.join(completeDir, fileName)
      const content = await safeReadFile(filePath)
      const arr = JSON.parse(content)

      const index = arr.findIndex((c: any) => c && c.name && c.name.toLowerCase() === name.toLowerCase())
      if (index >= 0) {
        return { filePath, index, company: arr[index] }
      }
    }
  } catch (err) {
    console.warn('Error searching for company:', err)
  }

  return null
}

async function updateCompanyInJsonFile(filePath: string, index: number, updatedCompany: any) {
  const content = await safeReadFile(filePath)
  const arr = JSON.parse(content)
  
  if (!Array.isArray(arr)) throw new Error('Target file is not a JSON array')

  if (index < 0 || index >= arr.length) {
    throw new Error(`Invalid index ${index} for company update`)
  }

  arr[index] = updatedCompany

  // Write to temp file then rename (atomic)
  const tmpPath = filePath + '.tmp'
  await fs.writeFile(tmpPath, JSON.stringify(arr, null, 2) + '\n', 'utf-8')
  await fs.rename(tmpPath, filePath)

  // Verify the write succeeded
  const verifyContent = await safeReadFile(filePath)
  const verifyArr = JSON.parse(verifyContent)
  const found = verifyArr.some((c: any) => c && c.cbe === updatedCompany.cbe)

  if (!found) {
    throw new Error(`Verification failed: ${updatedCompany.cbe} not present after update`)
  }
}

async function main() {
  const submissionsDir = path.join(process.cwd(), 'app', 'data', 'submissions')
  
  try {
    await fs.access(submissionsDir)
  } catch {
    console.log('No submissions directory found')
    return
  }

  const files = (await fs.readdir(submissionsDir)).filter(f => f.endsWith('.json'))
  
  if (files.length === 0) {
    console.log('No update files to process')
    return
  }

  console.log(`Processing ${files.length} update(s)`)

  for (const file of files) {
    const filePath = path.join(submissionsDir, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const payload: SubmissionPayload = JSON.parse(content)

    console.log(`Processing update: ${payload.companyName}`)

    try {
      // Use the existing prepareSubmission utility - it handles screenshots and ImgBB upload
      const { company, screenshots } = await prepareSubmission(payload, { label: 'update' })

      const completeDir = path.join(process.cwd(), 'app', 'data', 'companies', 'complete')
      
      // Ensure complete directory exists
      await fs.mkdir(completeDir, { recursive: true })

      // Find existing company by name
      const found = await findCompanyByName(company.name, completeDir)
      
      if (!found) {
        console.error(`✗ Could not find existing company: ${company.name}`)
        continue
      }

      const originalCompany = found.company

      // Merge with original company to preserve fields not in the update payload
      const mergedCompany = {
        ...originalCompany,           // Keep all original fields
        ...company,                   // Override with new data
        // Preserve original fields that shouldn't change or are missing in update
        cbe: originalCompany.cbe || company.cbe,
        site: company.site || originalCompany.site,  // Use original if new is empty
        employees: originalCompany.employees ?? company.employees,
        founded: originalCompany.founded ?? company.founded,
        // Always update these with new values
        locations: company.locations,
        tech: company.tech,
        proof: company.proof,
        lastUpdated: company.lastUpdated,
      }

      // Update the company in place
      await updateCompanyInJsonFile(found.filePath, found.index, mergedCompany)
      console.log(`✓ Updated company file: ${found.filePath}`)
      
      // Clean up submission file
      await fs.unlink(filePath)
      console.log(`✓ Cleaned up: ${filePath}`)

      // Build a comparison comment: original then updated
      try {
        const lines: string[] = []
        lines.push('✅ Update processed successfully! Screenshots captured and company data updated.')
        lines.push('')
        lines.push('**Original data**')
        lines.push('')
        lines.push('```json')
        lines.push(JSON.stringify(originalCompany, null, 2).trim())
        lines.push('```')

        lines.push('')
        lines.push('**Updated data**')
        lines.push('')
        lines.push('```json')
        lines.push(JSON.stringify(mergedCompany, null, 2).trim())
        lines.push('```')

        // Quick comparison table
        const origLocations = (originalCompany.locations || []).map((l: any) => `${l.municipality}, ${l.province}`).join('; ') || '-'
        const newLocations = (mergedCompany.locations || []).map((l: any) => `${l.municipality}, ${l.province}`).join('; ') || '-'
        const origTech = (originalCompany.tech || []).join(', ') || '-'
        const newTech = (mergedCompany.tech || []).join(', ') || '-'

        lines.push('')
        lines.push('**Quick comparison**')
        lines.push('')
        lines.push('| Field | Original | Updated |')
        lines.push('|---|---|---|')
        lines.push(`| Name | ${originalCompany.name || '-'} | ${mergedCompany.name || '-'} |`)
        lines.push(`| Website | ${originalCompany.site || '-'} | ${mergedCompany.site || '-'} |`)
        lines.push(`| Locations | ${origLocations} | ${newLocations} |`)
        lines.push(`| Tech Stack | ${origTech} | ${newTech} |`)

        lines.push('')
        lines.push('Proof URLs:')
        if (screenshots && screenshots.length) {
          for (const s of screenshots) {
            lines.push('')
            if (s.imgbbUrl) {
              lines.push(`${s.url} ([screenshot](${s.imgbbUrl}))`)
            } else {
              lines.push(`${s.url}`)
            }
          }
        } else if (company.proof && company.proof.length) {
          for (const p of company.proof) {
            lines.push('')
            if (p.image) {
              lines.push(`${p.url} ([screenshot](${p.image}))`)
            } else {
              lines.push(`${p.url}`)
            }
          }
        } else {
          lines.push('\nNone')
        }

        const out = lines.join('\n')
        const outPath = path.join(process.cwd(), '.github', 'update-comment.md')
        await fs.writeFile(outPath, out, 'utf-8')
        console.log(`✓ Wrote update comment to: ${outPath}`)
      } catch (err) {
        console.warn('Could not write update comment file:', err)
      }
      
    } catch (error) {
      console.error(`✗ Failed to process ${file}:`, error)
    }
  }

  console.log('Update processing complete')
}

// Helper to safely read files under an allowed base directory
async function safeReadFile(targetPath: string, allowedBase?: string) {
  const base = allowedBase ? path.resolve(allowedBase) : path.resolve(process.cwd())
  const target = path.resolve(targetPath)
  const rel = path.relative(base, target)
  if (rel.startsWith('..')) throw new Error(`Invalid file path: ${targetPath}`)
  return fs.readFile(target, 'utf-8')
}

main().catch(console.error)
