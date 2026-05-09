/* ============================================================================
   Bites — privacy-respecting analytics (alpha edition)
   ----------------------------------------------------------------------------
   Decision: Option (d) from the plan. Local-only event log. No network calls,
   no IP logging, no cookies, no third-party trackers, no PII.

   Why: We have 30 alpha testers we know personally. The cost of running a
   network analytics pipeline (Worker, Sheet, ops, GDPR posture) is way larger
   than the value of having all 30 events streamed centrally. Each tester's
   device IS the analytics database. We ASK them to send their `?stats=1`
   export at day 14. pg "do things that don't scale".

   Stretch: if we ship a Cloudflare Worker later, this module is the only
   place that needs to change — `track()` already buffers events in a way
   that can be POSTed in batch.

   Storage shape (localStorage key `bites.v0.analytics`):
     {
       sessionId: <UUID, fresh per session via sessionStorage>,
       installId: <UUID, persistent — anonymous device id>,
       startedAt: <ISO ts of first ever event>,
       events: [
         { t: <unix ms>, name: <string>, page: <string>, ref: <string>, props: {...} },
         ...
       ]
     }

   `installId` is anonymous — random UUID, no link to a person. Used to
   distinguish "same device, multiple sessions" from "two different testers".
============================================================================ */
(function () {
  'use strict';

  var ANALYTICS_KEY = 'bites.v0.analytics';
  var INSTALL_KEY   = 'bites.v0.installId';
  var SESSION_KEY   = 'bites.v0.sessionId';
  var MAX_EVENTS    = 5000; // hard cap so a runaway loop can't fill localStorage

  // Optional ingest endpoint. When set (with the matching shared secret),
  // users can tap "Send to founder" in the ?stats=1 overlay to ship their
  // event log to the central Google Sheet via Apps Script proxy.
  // CEO note: this secret IS in the public client, by design — it's the
  // browser-side key for the Apps Script. Rotate it any time by editing
  // SHARED_SECRET in scripts/analytics-ingest.gs and bumping the value here.
  // Worst-case threat: someone scrapes it and writes junk rows to the Sheet.
  // Mitigation: rate limits in the Apps Script + sheet is easy to clean.
  var ANALYTICS_INGEST_URL = 'https://script.google.com/macros/s/AKfycbxXlo2LBqqKnKs29CXnFrcpQSG0DSSLS_nuKHDzwQCl9XQu6-aSVa1dL8fhcj8QfaUi/exec';
  var ANALYTICS_INGEST_SECRET = 'Hello World';

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function safeGet(store, key) {
    try { return store.getItem(key); } catch (e) { return null; }
  }
  function safeSet(store, key, val) {
    try { store.setItem(key, val); } catch (e) { /* full or blocked, ignore */ }
  }

  // --- IDs -----------------------------------------------------------------
  // installId: persistent across sessions, identifies device anonymously.
  var installId = safeGet(localStorage, INSTALL_KEY);
  if (!installId) {
    installId = uuid();
    safeSet(localStorage, INSTALL_KEY, installId);
  }

  // sessionId: fresh per browser tab session.
  var sessionId = safeGet(sessionStorage, SESSION_KEY);
  if (!sessionId) {
    sessionId = uuid();
    safeSet(sessionStorage, SESSION_KEY, sessionId);
  }

  // --- Store ---------------------------------------------------------------
  function loadStore() {
    var raw = safeGet(localStorage, ANALYTICS_KEY);
    if (!raw) return { sessionId: sessionId, installId: installId, startedAt: new Date().toISOString(), events: [] };
    try {
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object') throw new Error('bad shape');
      if (!Array.isArray(s.events)) s.events = [];
      // Always overwrite sessionId/installId with the live values
      s.sessionId = sessionId;
      s.installId = installId;
      if (!s.startedAt) s.startedAt = new Date().toISOString();
      return s;
    } catch (e) {
      return { sessionId: sessionId, installId: installId, startedAt: new Date().toISOString(), events: [] };
    }
  }
  function saveStore(s) {
    if (s.events.length > MAX_EVENTS) s.events = s.events.slice(-MAX_EVENTS);
    safeSet(localStorage, ANALYTICS_KEY, JSON.stringify(s));
  }

  // --- Page metadata -------------------------------------------------------
  function pagePath() {
    return (location.pathname || '/') + (location.search || '');
  }
  function refSource() {
    var params = new URLSearchParams(location.search);
    var ref = params.get('ref') || '';
    var from = params.get('from') || '';
    var doc = document.referrer || '';
    // Strip our own origin from doc referrer to avoid noise
    try {
      if (doc && new URL(doc).origin === location.origin) doc = '';
    } catch (e) {}
    return [ref && ('ref:' + ref), from && ('from:' + from), doc && ('doc:' + doc)]
      .filter(Boolean).join('|');
  }

  // --- Public API ----------------------------------------------------------
  function track(name, props) {
    if (!name) return;
    var s = loadStore();
    s.events.push({
      t: Date.now(),
      name: String(name),
      page: pagePath(),
      session: sessionId,
      ref: refSource(),
      props: props || null
    });
    saveStore(s);
  }

  function pageview(label) {
    track('pageview', { label: label || document.title || pagePath() });
    // Fire-and-forget anonymous ping so we know SOMEONE landed, not just that
    // someone tapped 'Send to founder.' One ping per session per page.
    // De-duped via sessionStorage so reloads in the same tab don't double-count.
    pingPageviewOnce(label);
  }

  // Anonymous pageview ping. Sends ONLY the pageview event (not the full log)
  // to the ingest endpoint, fire-and-forget. Privacy stance unchanged: no IP
  // logged (Apps Script proxy strips it), no cookies, anonymous installId only.
  // We dedupe within a tab session so a single visit isn't double-counted on
  // SPA route changes, but a fresh tab counts as a new pageview.
  var PING_DEDUP_KEY = 'bites.v0.pinged';
  function pingPageviewOnce(label) {
    if (!ANALYTICS_INGEST_URL) return;
    try {
      var pingedThisSession = safeGet(sessionStorage, PING_DEDUP_KEY);
      var thisPath = pagePath();
      if (pingedThisSession === thisPath) return; // already pinged this exact path this session
      safeSet(sessionStorage, PING_DEDUP_KEY, thisPath);
    } catch (e) { /* sessionStorage blocked, just send */ }

    var payload = {
      secret: ANALYTICS_INGEST_SECRET,
      session_id: installId,
      user_agent: (navigator && navigator.userAgent) || '',
      events: [{
        timestamp: Date.now(),
        session: sessionId,
        event: 'pageview_ping',
        page: pagePath(),
        ref: refSource(),
        data: { label: label || document.title || pagePath() }
      }]
    };
    try {
      fetch(ANALYTICS_INGEST_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        keepalive: true   // survive page navigation - critical for landing-page bounces
      }).catch(function () { /* fire-and-forget, ignore */ });
    } catch (e) { /* offline, ignore */ }
  }

  function exportJson() {
    return JSON.stringify(loadStore(), null, 2);
  }

  function exportCsv() {
    var s = loadStore();
    var rows = [['t_iso', 't_ms', 'name', 'page', 'session', 'ref', 'props']];
    s.events.forEach(function (e) {
      rows.push([
        new Date(e.t).toISOString(),
        e.t,
        e.name,
        e.page,
        e.session,
        e.ref,
        e.props ? JSON.stringify(e.props) : ''
      ]);
    });
    return rows.map(function (r) {
      return r.map(function (c) {
        c = String(c == null ? '' : c);
        if (c.indexOf(',') >= 0 || c.indexOf('"') >= 0 || c.indexOf('\n') >= 0) {
          c = '"' + c.replace(/"/g, '""') + '"';
        }
        return c;
      }).join(',');
    }).join('\n');
  }

  function reset() {
    try { localStorage.removeItem(ANALYTICS_KEY); } catch (e) {}
  }

  // Ship the local event log to the configured Apps Script ingest endpoint.
  // User-initiated only (Send to founder button). Returns a Promise<number>.
  function sendEventsToIngest() {
    if (!ANALYTICS_INGEST_URL) {
      return Promise.reject(new Error('ingest URL not configured'));
    }
    var s = loadStore();
    if (!s.events.length) return Promise.resolve(0);
    var payload = {
      secret: ANALYTICS_INGEST_SECRET,
      session_id: s.installId,
      user_agent: (navigator && navigator.userAgent) || '',
      events: s.events.map(function (ev) {
        return {
          timestamp: ev.t,
          session: ev.session,
          event: ev.name,
          page: (ev.data && ev.data.page) || '',
          ref: (ev.data && ev.data.ref) || '',
          data: ev.data || {}
        };
      })
    };
    // Apps Script expects text/plain to avoid CORS preflight; the script
    // parses JSON.parse(e.postData.contents) on its side.
    return fetch(ANALYTICS_INGEST_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script doesn't return CORS headers; we accept opaque
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function () {
      return payload.events.length;
    });
  }

  // --- Stats overlay (?stats=1) -------------------------------------------
  function showStatsOverlay() {
    var s = loadStore();
    var json = exportJson();
    var csv  = exportCsv();
    var sessionsBy = {};
    s.events.forEach(function (e) {
      sessionsBy[e.session] = (sessionsBy[e.session] || 0) + 1;
    });
    var sessionCount = Object.keys(sessionsBy).length;
    var counts = {};
    s.events.forEach(function (e) { counts[e.name] = (counts[e.name] || 0) + 1; });

    var summary = '';
    summary += 'installId: ' + s.installId + '\n';
    summary += 'sessionId: ' + s.sessionId + '\n';
    summary += 'started:   ' + s.startedAt + '\n';
    summary += 'events:    ' + s.events.length + '  (across ' + sessionCount + ' sessions)\n\n';
    summary += 'event counts:\n';
    Object.keys(counts).sort().forEach(function (k) {
      summary += '  ' + k.padEnd(28) + ' ' + counts[k] + '\n';
    });

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:ui-monospace,Menlo,Monaco,monospace;';
    var panel = document.createElement('div');
    panel.style.cssText = 'background:#FAF6F0;color:#2A2118;max-width:680px;width:100%;max-height:90vh;overflow:auto;padding:22px;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);font-size:13px;';
    panel.innerHTML = ''
      + '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px;">'
      +   '<h2 style="margin:0;font-family:Fraunces,Georgia,serif;font-weight:500;font-size:20px;">Bites — Alpha Stats</h2>'
      +   '<button id="bites-stats-close" style="border:0;background:transparent;font-size:22px;cursor:pointer;line-height:1;color:#6B5E50;">×</button>'
      + '</div>'
      + '<pre style="background:#F2EBDF;padding:14px;border-radius:8px;white-space:pre-wrap;word-break:break-word;margin:0 0 14px;">'
      +   summary.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      + '</pre>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">'
      +   '<button id="bites-stats-send"      style="padding:9px 14px;border:0;border-radius:8px;background:#23201C;color:#FAF6F0;font-weight:600;cursor:pointer;">Send to founder</button>'
      +   '<button id="bites-stats-copy-json" style="padding:9px 14px;border:0;border-radius:8px;background:#C84B31;color:#FAF6F0;font-weight:600;cursor:pointer;">Copy JSON</button>'
      +   '<button id="bites-stats-copy-csv"  style="padding:9px 14px;border:0;border-radius:8px;background:#C84B31;color:#FAF6F0;font-weight:600;cursor:pointer;">Copy CSV</button>'
      +   '<button id="bites-stats-download"  style="padding:9px 14px;border:1px solid #C84B31;border-radius:8px;background:transparent;color:#C84B31;font-weight:600;cursor:pointer;">Download JSON</button>'
      +   '<button id="bites-stats-reset"     style="padding:9px 14px;border:1px solid #6B5E50;border-radius:8px;background:transparent;color:#6B5E50;cursor:pointer;margin-left:auto;">Reset log</button>'
      + '</div>'
      + '<details style="margin-bottom:8px;"><summary style="cursor:pointer;color:#6B5E50;">Show raw JSON</summary>'
      +   '<pre style="background:#F2EBDF;padding:10px;border-radius:8px;max-height:280px;overflow:auto;font-size:11px;margin-top:8px;">'
      +     json.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      +   '</pre>'
      + '</details>'
      + '<p style="color:#6B5E50;margin:10px 0 0;font-family:Inter,system-ui,sans-serif;font-size:12px;">'
      +   'Privacy: events are stored only on this device. No IP, no cookies, no PII. '
      +   'Tap <strong>Copy JSON</strong> and send it to <strong>bites@aitinkery.com</strong> when asked.'
      + '</p>';
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    function flash(btn, txt) {
      var orig = btn.textContent;
      btn.textContent = txt;
      setTimeout(function () { btn.textContent = orig; }, 1400);
    }

    panel.querySelector('#bites-stats-close').onclick = function () { overlay.remove(); };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    panel.querySelector('#bites-stats-copy-json').onclick = function () {
      navigator.clipboard.writeText(json).then(function () { flash(this, '✓ Copied'); }.bind(this));
    };
    panel.querySelector('#bites-stats-copy-csv').onclick = function () {
      navigator.clipboard.writeText(csv).then(function () { flash(this, '✓ Copied'); }.bind(this));
    };
    // Send-to-founder button (only enabled when ingest URL is configured).
    var sendBtn = panel.querySelector('#bites-stats-send');
    if (sendBtn) {
      if (!ANALYTICS_INGEST_URL) {
        sendBtn.disabled = true;
        sendBtn.title = 'Ingest endpoint not configured — use Copy JSON instead';
        sendBtn.style.opacity = '0.5';
        sendBtn.style.cursor = 'not-allowed';
      } else {
        sendBtn.onclick = function () {
          sendBtn.textContent = 'Sending…';
          sendBtn.disabled = true;
          sendEventsToIngest()
            .then(function (n) {
              sendBtn.textContent = '✓ Sent ' + n + ' events';
              setTimeout(function () { sendBtn.textContent = 'Send to founder'; sendBtn.disabled = false; }, 2400);
            })
            .catch(function (err) {
              sendBtn.textContent = 'Send failed — see console';
              sendBtn.disabled = false;
              console.error('analytics ingest failed', err);
            });
        };
      }
    }

    panel.querySelector('#bites-stats-download').onclick = function () {
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'bites-alpha-stats-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    };
    panel.querySelector('#bites-stats-reset').onclick = function () {
      if (!confirm('Wipe local analytics log? This cannot be undone.')) return;
      reset();
      overlay.remove();
    };

    // Bind close buttons (re-grab; some renderers strip onclick from innerHTML)
    Array.from(panel.querySelectorAll('button')).forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); });
    });
  }

  // --- Boot: pageview + URL flag handlers ---------------------------------
  function autoStart() {
    pageview();

    // Track ref flags as discrete events so we can count by source.
    var params = new URLSearchParams(location.search);
    var ref = params.get('ref');
    if (ref === 'alpha')   track('ref_alpha', { from: params.get('from') || '' });
    if (ref === 'share')   track('ref_share', {});
    if (ref === 'landing') track('ref_landing', {});

    // Session-end timing: try to persist a session_end event when the tab
    // closes. Best-effort — the tab may be killed without firing.
    var startMs = Date.now();
    function endSession() {
      track('session_end', { duration_ms: Date.now() - startMs });
    }
    window.addEventListener('pagehide', endSession);
    window.addEventListener('beforeunload', endSession);

    if (params.get('stats') === '1') {
      // Defer so the page can render first.
      setTimeout(showStatsOverlay, 250);
    }
  }

  // Public surface
  window.BitesAnalytics = {
    track: track,
    pageview: pageview,
    showStats: showStatsOverlay,
    exportJson: exportJson,
    exportCsv: exportCsv,
    reset: reset,
    installId: installId,
    sessionId: sessionId
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart);
  } else {
    autoStart();
  }
})();
