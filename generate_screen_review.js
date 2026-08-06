const { chromium } = require('playwright-core')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const baseURL = process.env.QUIKEYS_REVIEW_URL || 'http://localhost:3001'
const email = process.env.QUIKEYS_REVIEW_EMAIL || ''
const password = process.env.QUIKEYS_REVIEW_PASSWORD || ''
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const root = path.join(process.cwd(), 'deliverables', 'screen-review')

function localEnv() {
  const values = {}
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return values
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) values[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return values
}

const publicScreens = [
  ['01-landing', '/'],
  ['02-create-account', '/auth/signup'],
  ['03-sign-in', '/auth/signin'],
  ['04-check-email', '/auth/verify?email=review%40example.com'],
  ['05-email-verified', '/auth/verified'],
  ['06-reset-password', '/auth/reset-password'],
  ['07-admin-login', '/admin/login'],
]

const memberScreens = [
  ['11-discover', '/feed'],
  ['12-requests', '/requests'],
  ['13-messages', '/messages'],
  ['14-archive', '/archived'],
  ['15-my-profile', '/me'],
  ['16-blocked-profiles', '/me/blocked'],
  ['17-admin-dashboard', '/admin/dashboard'],
]

async function capture(page, folder, name, route) {
  await page.goto(baseURL + route, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(1800)
  await page.screenshot({ path: path.join(folder, `${name}.png`), fullPage: true })
  return { name, requestedRoute: route, actualUrl: page.url() }
}

async function login(page) {
  if (!email || !password) return false
  await page.goto(baseURL + '/auth/signin', { waitUntil: 'domcontentloaded' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(3000)
  if (!page.url().includes('/auth/signin')) return true

  const env = localEnv()
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return false
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: adminProfiles } = await admin
    .from('profiles')
    .select('email')
    .eq('role', 'ADMIN')
    .eq('status', 'ACTIVE')
    .limit(1)
  const reviewEmail = adminProfiles?.[0]?.email || email
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: reviewEmail,
    options: { redirectTo: `${baseURL}/auth/callback` },
  })
  if (error || !data?.properties?.action_link) return false
  await page.goto(data.properties.action_link, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(3000)
  return !page.url().includes('/auth/signin')
}

async function runViewport(browser, label, viewport, isMobile) {
  const folder = path.join(root, label)
  fs.mkdirSync(folder, { recursive: true })
  const context = await browser.newContext({ viewport, isMobile, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const results = []

  for (const [name, route] of publicScreens) {
    results.push(await capture(page, folder, name, route))
  }

  const signedIn = await login(page)
  if (signedIn) {
    for (const [name, route] of memberScreens) {
      results.push(await capture(page, folder, name, route))
    }

    await page.goto(baseURL + '/messages', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    const chatHref = await page.locator('a[href^="/chat/"]').first().getAttribute('href').catch(() => null)
    if (chatHref) results.push(await capture(page, folder, '18-conversation', chatHref))

    await page.goto(baseURL + '/feed', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    const profileHref = await page.locator('a[href^="/profile/"]').first().getAttribute('href').catch(() => null)
    if (profileHref) results.push(await capture(page, folder, '19-connection-profile', profileHref))
  }

  fs.writeFileSync(path.join(folder, 'capture-results.json'), JSON.stringify({ signedIn, results }, null, 2))
  await context.close()
  return { label, signedIn, results }
}

async function main() {
  fs.mkdirSync(root, { recursive: true })
  const browser = await chromium.launch({ executablePath: chrome, headless: true })
  const results = []
  results.push(await runViewport(browser, 'desktop', { width: 1440, height: 900 }, false))
  results.push(await runViewport(browser, 'mobile', { width: 390, height: 844 }, true))
  await browser.close()
  fs.writeFileSync(path.join(root, 'capture-summary.json'), JSON.stringify(results, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
