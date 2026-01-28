import { configDotenv } from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import type { Company } from '../../types'

configDotenv()

export interface UploadResult {
  url: string
  displayUrl: string
  deleteUrl?: string
}

/** ImgBB helper */
class ImgBBStorage {
  private apiKey: string
  private apiUrl = 'https://api.imgbb.com/1/upload'

  constructor() {
    this.apiKey = process.env.IMGBB_API_KEY || ''
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async uploadBuffer(buffer: Buffer, name: string): Promise<UploadResult> {
    if (!this.isConfigured()) throw new Error('ImgBB not configured')

    const base64Image = buffer.toString('base64')

    const formData = new FormData()
    formData.append('key', this.apiKey)
    formData.append('image', base64Image)
    formData.append('name', name)

    const res = await fetch(this.apiUrl, { method: 'POST', body: formData })
    if (!res.ok) throw new Error(`ImgBB upload failed: ${res.status}`)
    const json = await res.json()
    if (!json.success) throw new Error(`ImgBB error: ${json.error?.message || 'unknown'}`)

    return {
      url: json.data.url,
      displayUrl: json.data.display_url,
      deleteUrl: json.data.delete_url,
    }
  }
}

const imgbb = new ImgBBStorage()

export { imgbb }

/**
 * Safely read a file under the given base directory.
 * Prevents path traversal and symlink escapes by resolving and
 * canonicalizing both base and target paths before reading.
 */
export async function safeReadFile(localPath: string, options?: { baseDir?: string }) {
  const baseDir = options?.baseDir
    ? path.resolve(options.baseDir)
    : path.resolve(process.cwd(), 'app', 'data')

  // Resolve target against baseDir to ensure absolute path is inside base
  const target = path.resolve(baseDir, localPath)

  // Quick check to prevent simple path traversal
  const rel = path.relative(baseDir, target)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Invalid file path')
  }

  // Use realpath to protect against symlink escapes
  const [realBase, realTarget] = await Promise.all([
    fs.realpath(baseDir).catch(() => baseDir),
    fs.realpath(target).catch(() => null),
  ])

  if (!realTarget) {
    // File doesn't exist or cannot be resolved - avoid reading
    throw new Error('File not found or not accessible')
  }

  if (!realTarget.startsWith(realBase + path.sep) && realTarget !== realBase) {
    throw new Error('Invalid file path')
  }

  return fs.readFile(realTarget)
}

/** Serialize company object into TypeScript module */
export function serializeCompanyToTs(obj: Company) {
  const parts: string[] = []
  parts.push(`name: ${JSON.stringify(obj.name)}`)
  parts.push(`site: ${JSON.stringify(obj.site)}`)
  parts.push(`locations: ${JSON.stringify(obj.locations, null, 2)}`)
  parts.push(`tech: ${JSON.stringify(obj.tech, null, 2)}`)
  if (obj.proof) parts.push(`proof: ${JSON.stringify(obj.proof, null, 2)}`)

  return `import type { Company } from "~~/types"

const company: Company = {
  ${parts.join(',\n  ')}
}

export default company
`
}

/** Create initial PR with raw submission payload - Actions will process it */
export async function createInitialPR(payload: any, label: 'add' |'complete' | 'update') {
  const token = process.env.GITHUB_TOKEN || ''
  const owner = 'andres-vr'
  const repo = 'techstack-belgium'

  if (!token) {
    console.log('[storage] TOKEN not set, skipping initial PR')
    return null
  }

  // Log token presence (mask token for safety)
  console.info('[storage] createInitialPR invoked', {
    owner,
    repo,
    tokenPresent: !!token,
    tokenMasked: token ? `${token.slice(0,6)}...${token.slice(-4)}` : null,
  })

  const safeName = String(payload.companyName || 'submission')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
  
  const branchName = `${label}/${safeName}-${Date.now()}`
  const headers: Record<string, string> = {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  }

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
    console.debug('[storage] repo fetch status:', repoRes.status)
    const repoJson = await repoRes.json()
    console.debug('[storage] repo fetch body:', repoJson)
    if (!repoRes.ok) throw new Error(`Repo fetch failed: ${repoRes.status}`)
    const baseBranch = repoJson.default_branch || 'main'

    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers })
    console.debug('[storage] ref fetch status:', refRes.status)
    const refJson = await refRes.json()
    console.debug('[storage] ref fetch body:', refJson)
    const baseSha = refJson.object?.sha

    // Create branch
    const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
    })
    console.debug('[storage] create ref status:', createRefRes.status)
    const createRefJson = await createRefRes.json().catch(() => null)
    console.debug('[storage] create ref body:', createRefJson)


    // Create a payload file in the new branch so PR has an actual commit.
    const payloadFilePath = `app/data/submissions/${safeName}-${Date.now()}.json`

    // Sanitize payload: prefer `coords` array and remove `lat`/`lng` properties
    const sanitizedPayload = JSON.parse(JSON.stringify(payload)) as any
    if (Array.isArray(sanitizedPayload.locations)) {
      sanitizedPayload.locations = sanitizedPayload.locations.map((l: any) => {
        const loc: any = { ...l }
        // If lat/lng present and coords absent, convert
        if ((loc.lat !== undefined && loc.lng !== undefined) && !(Array.isArray(loc.coords) && loc.coords.length >= 2)) {
          loc.coords = [Number(loc.lng), Number(loc.lat)]
        }
        // Ensure coords is an array of [lng, lat] if present
        if (Array.isArray(loc.coords) && loc.coords.length >= 2) {
          loc.coords = [Number(loc.coords[0]), Number(loc.coords[1])]
        }
        delete loc.lat
        delete loc.lng
        return loc
      })
    }

    const payloadContent = Buffer.from(JSON.stringify(sanitizedPayload, null, 2), 'utf-8').toString('base64')

    try {
      const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${payloadFilePath}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `${label === 'update' ? 'Update' : 'Add'} submission: ${payload.companyName}`,
          content: payloadContent,
          branch: branchName,
        }),
      })
      console.debug('[storage] create payload file status:', putRes.status)
      const putJson = await putRes.json().catch(() => null)
      console.debug('[storage] create payload file body:', putJson)

      if (!putRes.ok) {
        console.warn('[storage] Failed to create payload file in branch; will fall back to embedding payload in PR body')
      }
    } catch (putErr) {
      console.error('[storage] Error creating payload file:', putErr)
      // continue; we'll rely on the PR body embedding fallback and placeholder commit fallback
    }

    const labelText = label === 'update' ? 'Update' : label === 'add' ? 'Add' : 'Complete'
    const prBody = [
      `${labelText} request: ${payload.companyName}`,
      '',
      'Submission payload (JSON):',
      '```json',
      JSON.stringify(sanitizedPayload, null, 2),
      '```',
      '',
      'Actions will process screenshots and company files.'
    ].join('\n')

    // Try to create a PR. If it fails due to "No commits between" we'll create an empty commit on the branch and retry.
    let prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `${labelText}: ${payload.companyName}`,
        head: branchName,
        base: baseBranch,
        body: prBody,
      }),
    })

    console.debug('[storage] create PR status:', prRes.status)
    let prJson = await prRes.json()
    console.debug('[storage] create PR body:', prJson)

    // If validation failed because there are no commits between base and branch, attempt to add an empty commit and retry
    if (prRes.status === 422 && prJson && Array.isArray(prJson.errors) && prJson.errors.some((e: any) => /No commits between/i.test(e.message || e))) {
      console.info('[storage] PR creation failed due to no commits; creating placeholder commit and retrying')

      try {
        // Get base commit to extract tree
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${baseSha}`, { headers })
        const commitJson = await commitRes.json()
        console.debug('[storage] base commit:', commitJson)
        const treeSha = commitJson.tree?.sha
        if (!treeSha) throw new Error('base tree SHA not found')

        // Create a new empty commit that references the same tree
        const commitCreateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ message: `chore(submission): placeholder commit for ${payload.companyName}`, tree: treeSha, parents: [baseSha] }),
        })
        const commitCreateJson = await commitCreateRes.json()
        console.debug('[storage] created commit:', commitCreateJson)
        const newCommitSha = commitCreateJson.sha
        if (!newCommitSha) throw new Error('failed to create commit')

        // Update branch ref to new commit
        const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ sha: newCommitSha }),
        })
        console.debug('[storage] update ref status:', updateRefRes.status)
        const updateRefJson = await updateRefRes.json().catch(() => null)
        console.debug('[storage] update ref body:', updateRefJson)

        // Retry PR creation
        prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: `${labelText}: ${payload.companyName}`,
            head: branchName,
            base: baseBranch,
            body: prBody,
          }),
        })
        console.debug('[storage] retry create PR status:', prRes.status)
        prJson = await prRes.json()
        console.debug('[storage] retry create PR body:', prJson)
      } catch (createErr) {
        console.error('[storage] Failed to create placeholder commit and retry PR:', createErr)
      }
    }

    const prNumber = prJson.number

    // Add label
    if (prNumber) {
      const labelRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/labels`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ labels: [label] }),
      })
      console.debug('[storage] add label status:', labelRes.status)
      const labelJson = await labelRes.json().catch(() => null)
      console.debug('[storage] add label body:', labelJson)
    }

    return prJson
  } catch (err) {
    console.error('[storage] Initial PR creation failed:', err)
    return null
  }
}

