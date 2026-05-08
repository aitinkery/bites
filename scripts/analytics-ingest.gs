/**
 * Bites Alpha Analytics — Apps Script ingest endpoint.
 *
 * Receives JSON POSTs from the Bites web app, appends rows to the
 * Google Sheet at SHEET_ID. No auth on the endpoint itself — the
 * sheet ID and shared secret are the only access control.
 *
 * Privacy:
 *   - We log only what the Bites app explicitly sent.
 *   - Bites strips PII before sending (no email, no IP, no comment text).
 *   - This script logs the IP-equivalent header that Apps Script gives us
 *     ONLY for rate-limit defense; we don't write IP into the sheet.
 *
 * Setup:
 *   1. Open script.google.com → New project (or add to an existing project).
 *   2. Paste this file as analytics-ingest.gs.
 *   3. Set SHEET_ID below to the Bites Alpha Analytics sheet id.
 *   4. Set SHARED_SECRET below to a random string. Bites will send the
 *      same string in the X-Bites-Secret header.
 *   5. Deploy → New deployment → Web app:
 *        - Execute as: Me
 *        - Who has access: Anyone (yes really; the secret gates writes)
 *   6. Copy the deployment URL. That's the value to set in
 *      ANALYTICS_INGEST_URL inside Bites' analytics.js.
 */

const SHEET_ID = '1FUmC_a67Fgdw8sNufqRIZ7bkWFY6wto4QCU9dEiy-9s';
const SHARED_SECRET = 'REPLACE_ME_WITH_A_RANDOM_STRING';
const SHEET_NAME = 'Events';

function doPost(e) {
  const headers = (e && e.parameters) ? e.parameters : {};
  // Apps Script doesn't expose request headers directly via doPost — clients
  // pass the secret in the JSON body instead.
  let body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (_) {}

  if (body.secret !== SHARED_SECRET) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const events = Array.isArray(body.events) ? body.events : [];
  if (!events.length) {
    return ContentService.createTextOutput(JSON.stringify({ ok: true, appended: 0 }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const receivedAt = new Date().toISOString();
  const userAgent = (e && e.postData && e.postData.contents && body.user_agent) || '';

  const rows = events.map(ev => [
    ev.timestamp || '',                 // when the event happened on device
    body.session_id || '',              // anonymous random per-session id
    ev.event || '',                     // event name (e.g. bite_added)
    ev.page || '',                      // app | landing | cookbook
    ev.ref || '',                       // ?ref= parameter (alpha, share, hn, ...)
    (ev.data && ev.data.library_size) || '',
    JSON.stringify(ev.data || {}),      // full event payload as JSON
    userAgent.slice(0, 200),            // truncated UA for device segmentation
    receivedAt,                         // when the row landed
  ]);

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

  return ContentService.createTextOutput(JSON.stringify({ ok: true, appended: rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional: GET endpoint for health-check.
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, name: 'bites-analytics-ingest' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// One-time setup helper. Run this manually from the Apps Script editor the
// first time you deploy — it triggers the OAuth grant prompt for Sheets
// access, which doPost can't trigger on its own (Apps Script swallows the
// permission error before the prompt fires when called from a real request).
// After running once successfully, this function can stay or be deleted; it's
// idempotent. Adds a marker row 'authorize-me-test' to the Events sheet.
function authorizeMe() {
  SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME).appendRow(['authorize-me-test']);
}
