// submit-to-google-index.mjs
//
// Submits URLs to Google's Indexing API so they get crawled/indexed faster
// instead of waiting for Google to discover them naturally.
//
// SETUP (one-time):
// 1. npm install googleapis
// 2. Create a .env.local file in this same folder with:
//      GOOGLE_INDEXING_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
//      GOOGLE_INDEXING_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...-----END PRIVATE KEY-----\n"
//    (same values you added to Vercel's Environment Variables)
// 3. Make sure that service account email is added as an OWNER in
//    Google Search Console for ironcladautomations.xyz (Settings > Users and permissions)
//
// USAGE:
//   node submit-to-google-index.mjs
//
// Edit the URLS array below any time you add a new page to the site.

import { google } from 'googleapis';
import fs from 'fs';

// --- Load .env.local manually (no extra dependency needed) ---
function loadEnv(path) {
  if (!fs.existsSync(path)) {
    console.error(`Missing ${path} — create it first with your credentials.`);
    process.exit(1);
  }
  let raw = fs.readFileSync(path, 'utf-8');
  // strip BOM if present (common when files are created/saved on Windows)
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
  }
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    const eqIndex = trimmedLine.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmedLine.slice(0, eqIndex).trim();
    let value = trimmedLine.slice(eqIndex + 1).trim();
    // strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv('./.env.local');

const CLIENT_EMAIL = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error('Missing GOOGLE_INDEXING_CLIENT_EMAIL or GOOGLE_INDEXING_PRIVATE_KEY in .env.local');
  process.exit(1);
}

// --- Add / edit URLs here whenever you add a new page ---
const URLS = [
  'https://ironcladautomations.xyz/',
  'https://ironcladautomations.xyz/never-miss-a-lead.html',
];

async function main() {
  const jwtClient = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  await jwtClient.authorize();

  const indexing = google.indexing({ version: 'v3', auth: jwtClient });

  for (const url of URLS) {
    try {
      const res = await indexing.urlNotifications.publish({
        requestBody: {
          url,
          type: 'URL_UPDATED',
        },
      });
      console.log(`✅ Submitted: ${url}`);
      console.log(`   Status: ${res.status}`);
    } catch (err) {
      console.error(`❌ Failed: ${url}`);
      console.error(`   ${err.message}`);
    }
  }
}

main();
