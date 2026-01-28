export class ScreenshotCapture {
  private browserlessApiKey: string
  private browserlessEndpoint: string

  constructor() {
    this.browserlessApiKey = process.env.BROWSERLESS_API_KEY || ''
    this.browserlessEndpoint = 'https://production-sfo.browserless.io/screenshot'
  }

  async captureFullPage(url: string): Promise<Buffer> {
    // First try to use a locally installed Puppeteer (Actions runner).
    try {
      // Dynamic import so this works even if puppeteer is not installed locally.
      const puppeteer = await import('puppeteer')
      try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        const buffer = await page.screenshot({ fullPage: true, type: 'png' })
        await browser.close()
        if (buffer && buffer.length) {
          return Buffer.from(buffer)
        }
        console.warn('Puppeteer returned empty buffer, will fall back to Browserless')
      } catch (puppErr) {
        console.warn('Puppeteer capture failed, falling back to Browserless:', puppErr)
      }
    } catch (impErr) {
      console.log('Puppeteer not available, using Browserless fallback')
    }

    // Fallback to Browserless if Puppeteer is not available or failed
    if (!this.browserlessApiKey) {
      throw new Error('No screenshot method available: neither Puppeteer succeeded nor BROWSERLESS_API_KEY configured')
    }

    const response = await fetch(`${this.browserlessEndpoint}?token=${this.browserlessApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        url: url,
        options: {
          fullPage: true,
          type: 'png',
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Browserless screenshot failed: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async captureMultiple(urls: string[]): Promise<Array<{ url: string; buffer: Buffer }>> {
    const results: Array<{ url: string; buffer: Buffer }> = []

    for (let i = 0; i < urls.length; i++) {
      try {
        const buffer = await this.captureFullPage(urls[i])
        results.push({ url: urls[i], buffer })
      } catch (err) {
        console.error(`Failed to capture ${urls[i]}:`, err)
      }
    }

    return results
  }
}

export const screenshotCapture = new ScreenshotCapture()
