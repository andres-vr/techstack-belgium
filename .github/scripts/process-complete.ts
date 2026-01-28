import * as fs from 'fs/promises'
import * as path from 'path'
import { prepareSubmission } from '../../server/utils/prepareSubmission'
import type { SubmissionPayload } from '../../types'

async function appendCompanyToJsonFile(filePath: string, company: any) {
  try {
    const content = await safeReadFile(filePath)
    const arr = JSON.parse(content)
    if (!Array.isArray(arr)) throw new Error('Target file is not a JSON array')

    // Check if company already exists
    const existingIndex = arr.findIndex((c: any) => c && c.cbe === company.cbe)
    if (existingIndex >= 0) return

    arr.push(company)
    const tmpPath = filePath + '.tmp'
    await fs.writeFile(tmpPath, JSON.stringify(arr, null, 2) + '\n', 'utf-8')
    await fs.rename(tmpPath, filePath)
  } catch (err) {
    // If the file doesn't exist, create it with the new company as the first element
    if ((err as any).code === 'ENOENT') {
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, JSON.stringify([company], null, 2) + '\n', 'utf-8')
      return
    }
    throw err
  }
}

async function removeCompanyFromIncomplete(company: any) {
  const firstChar = (company.name || '').charAt(0).toLowerCase()
  const letter = /^[a-z]$/.test(firstChar) ? firstChar : 'other'
  const targetFileName = `companies-${letter}.json`
  const incompleteDir = path.join(process.cwd(), 'app', 'data', 'companies', 'incomplete')
  const incompleteFilePath = path.join(incompleteDir, targetFileName)

  console.log(`[removeFromIncomplete] Looking for company: name="${company.name}", cbe="${company.cbe}"`)
  console.log(`[removeFromIncomplete] Checking file: ${incompleteFilePath}`)

  try {
    const content = await safeReadFile(incompleteFilePath)
    const arr = JSON.parse(content)
    if (!Array.isArray(arr)) {
      console.log('[removeFromIncomplete] File is not an array, skipping')
      return
    }

    console.log(`[removeFromIncomplete] Found ${arr.length} companies in incomplete file`)

    // Find and remove company by CBE or name (case-insensitive)
    const companyNameLower = (company.name || '').toLowerCase().trim()
    const originalLength = arr.length
    const filtered = arr.filter((c: any) => {
      if (!c) return true
      // Match by CBE if available
      if (company.cbe && c.cbe === company.cbe) {
        console.log(`[removeFromIncomplete] Found match by CBE: ${c.cbe}`)
        return false
      }
      // Match by name (case-insensitive)
      const cNameLower = (c.name || '').toLowerCase().trim()
      if (companyNameLower && cNameLower === companyNameLower) {
        console.log(`[removeFromIncomplete] Found match by name: ${c.name}`)
        return false
      }
      return true
    })

    if (filtered.length < originalLength) {
      const tmpPath = incompleteFilePath + '.tmp'
      await fs.writeFile(tmpPath, JSON.stringify(filtered, null, 2) + '\n', 'utf-8')
      await fs.rename(tmpPath, incompleteFilePath)
      console.log(`✓ Removed ${originalLength - filtered.length} company(s) from incomplete: ${incompleteFilePath}`)
    } else {
      console.log(`[removeFromIncomplete] No matching company found in incomplete file`)
    }
  } catch (err) {
    // File doesn't exist or other error - just skip
    if ((err as any).code === 'ENOENT') {
      console.log(`[removeFromIncomplete] File does not exist: ${incompleteFilePath}`)
    } else {
      console.warn(`[removeFromIncomplete] Error: ${err}`)
    }
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
    console.log('No submission files to process')
    return
  }

  console.log(`Processing ${files.length} submission(s)`)

  for (const file of files) {
    const filePath = path.join(submissionsDir, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const payload: SubmissionPayload = JSON.parse(content)

    console.log(`Processing completion: ${payload.companyName}`)

    try {
      // Use the existing prepareSubmission utility - it handles screenshots and ImgBB upload
      const { company, screenshots } = await prepareSubmission(payload, { label: 'complete' })

      // Determine the target file based on company name
      const firstChar = (company.name || '').charAt(0).toLowerCase()
      const letter = /^[a-z]$/.test(firstChar) ? firstChar : 'other'
      const targetFileName = `companies-${letter}.json`
      const completeDir = path.join(process.cwd(), 'app', 'data', 'companies', 'complete')

      // Ensure complete directory exists
      await fs.mkdir(completeDir, { recursive: true })

      const companyFilePath = path.join(completeDir, targetFileName)
      await appendCompanyToJsonFile(companyFilePath, company)
      console.log(`✓ Added to: ${companyFilePath}`)

      // Remove from incomplete directory (if it exists there)
      await removeCompanyFromIncomplete(company)
      
      // Clean up completion file
      await fs.unlink(filePath)
      console.log(`✓ Cleaned up: ${filePath}`)

      // Create a markdown comment body for Actions to post on the PR
      try {
        const commentLines: string[] = []
        commentLines.push('✅ Completion processed successfully! Screenshots captured and company added.')
        commentLines.push('')
        commentLines.push(`Added company: ${company.name}`)
        commentLines.push('')

        // Markdown table with all fields except proof
        commentLines.push('| Field | Value |')
        commentLines.push('|---|---|')
        commentLines.push(`| Name | ${company.name || '-'} |`)
        const siteDisplay = company.site ? `[${company.site}](${company.site})` : '-'
        commentLines.push(`| Website | ${siteDisplay} |`)
        const locations = (company.locations || []).map(l => `${l.municipality}, ${l.province}`).join('<br>') || '-'
        commentLines.push(`| Locations | ${locations} |`)
        commentLines.push(`| Tech Stack | ${(company.tech && company.tech.length) ? company.tech.join(', ') : '-'} |`)

        commentLines.push('')
        // Proof URLs listed under the table
        commentLines.push('Proof URLs:')
        if (screenshots && screenshots.length) {
          for (const s of screenshots) {
            commentLines.push('')
            if (s.imgbbUrl) {
              commentLines.push(`${s.url} ([screenshot](${s.imgbbUrl}))`)
            } else {
              commentLines.push(`${s.url}`)
            }
          }
        } else if (company.proof && company.proof.length) {
          for (const p of company.proof) {
            commentLines.push('')
            if (p.image) {
              commentLines.push(`${p.url} ([screenshot](${p.image}))`)
            } else {
              commentLines.push(`${p.url}`)
            }
          }
        } else {
          commentLines.push('\nNone')
        }

        const commentBody = commentLines.join('\n')
        const outPath = path.join(process.cwd(), '.github', 'complete-comment.md')
        await fs.writeFile(outPath, commentBody, 'utf-8')
        console.log(`✓ Wrote comment body to: ${outPath}`)
      } catch (err) {
        console.warn('Could not write completion comment file:', err)
      }

    } catch (error) {
      console.error(`✗ Failed to process ${file}:`, error)
    }
  }

  console.log('Completion processing complete')
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
