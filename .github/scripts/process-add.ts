import * as fs from 'fs/promises'
import * as path from 'path'
import { prepareSubmission } from '../../server/utils/prepareSubmission'
import type { SubmissionPayload } from '../../types'

async function appendCompanyToJsonFile(filePath: string, company: any) {
  try {
    const content = await safeReadFile(filePath)
    const arr = JSON.parse(content)
    if (!Array.isArray(arr)) throw new Error('Target file is not a JSON array')

    // Check if company already exists by CBE
    const existingIndex = arr.findIndex((c: any) => c && c.cbe === company.cbe)
    if (existingIndex >= 0) {
      console.log(`Company with CBE ${company.cbe} already exists, skipping`)
      return
    }

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

async function main() {
  console.log('==== Process Add Script Starting ====')
  console.log('CWD:', process.cwd())
  
  const submissionsDir = path.join(process.cwd(), 'app', 'data', 'submissions')
  console.log('Looking for submissions in:', submissionsDir)
  
  try {
    await fs.access(submissionsDir)
    console.log('✓ Submissions directory exists')
  } catch {
    console.log('✗ No submissions directory found at:', submissionsDir)
    return
  }

  const allFiles = await fs.readdir(submissionsDir)
  console.log('All files in submissions directory:', allFiles)
  
  const files = allFiles.filter(f => f.endsWith('.json'))
  console.log('JSON files found:', files)
  
  if (files.length === 0) {
    console.log('No add files to process (no .json files found)')
    return
  }

  console.log(`Processing ${files.length} add(s)`)

  for (const file of files) {
    const filePath = path.join(submissionsDir, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const payload: SubmissionPayload = JSON.parse(content)

    console.log(`Processing add: ${payload.companyName}`)

    try {
      // Use the existing prepareSubmission utility - it handles screenshots and ImgBB upload
      const { company, screenshots } = await prepareSubmission(payload, { label: 'add' })

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
      
      // Clean up submission file
      await fs.unlink(filePath)
      console.log(`✓ Cleaned up: ${filePath}`)

      // Create a markdown comment body for Actions to post on the PR
      try {
        const commentLines: string[] = []
        commentLines.push('✅ New company added successfully! Screenshots captured and company added to database.')
        commentLines.push('')
        commentLines.push(`Added company: **${company.name}**`)
        commentLines.push('')

        // Markdown table with all fields except proof
        commentLines.push('| Field | Value |')
        commentLines.push('|---|---|')
        commentLines.push(`| Name | ${company.name || '-'} |`)
        commentLines.push(`| CBE | ${company.cbe || '-'} |`)
        const siteDisplay = company.site ? `[${company.site}](${company.site})` : '-'
        commentLines.push(`| Website | ${siteDisplay} |`)
        commentLines.push(`| Founded | ${company.founded || '-'} |`)
        commentLines.push(`| Employees | ${company.employees || '-'} |`)
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
        const outPath = path.join(process.cwd(), '.github', 'add-comment.md')
        await fs.writeFile(outPath, commentBody, 'utf-8')
        console.log(`✓ Wrote comment body to: ${outPath}`)
      } catch (err) {
        console.warn('Could not write add comment file:', err)
      }

    } catch (error) {
      console.error(`✗ Failed to process ${file}:`, error)
    }
  }

  console.log('Add processing complete')
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
