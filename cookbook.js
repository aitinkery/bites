/* Bites Cookbook Generator — v0.2
 *
 * Layout choice: Option A (photo-hero per page).
 *   Considered:
 *     B) 4-up grid → felt like a spreadsheet, rejects "magazine" brief.
 *     C) chronological strip → looks like a journal, not a cookbook.
 *   Chose A: one bite = one magazine page. Photo as hero, then big serif
 *   dish name, restaurant/date/rating, italic note, tag pills, page number.
 *   This is what someone would actually want to flip through.
 *
 * Implementation: jsPDF native API (text + image) rather than html2canvas.
 *   Native API gives us:
 *     - vector text (sharp at any zoom, smaller PDFs)
 *     - real typography control (kerning, sizes, manual tracking)
 *     - more deterministic page breaks
 *   The cost is more layout math, but with a fixed per-page template that's
 *   manageable. The "leaves nobody will see" payoff: text in the PDF is
 *   selectable, copy-pasteable, and renders crisply at print resolution.
 *
 * Page sizes: US Letter (default) and A4. Read from
 *   localStorage['bites.v0.cookbookPageSize'] = 'letter' | 'a4'.
 *
 * Brand:
 *   --paper:  #FAF6F0  cream
 *   --ink:    #2A2118  warm near-black (matches app)
 *   --ink2:   #6B5E50  secondary
 *   --ink3:   #A89E91  faint
 *   --orange: #C84B31  burnt orange (brand)
 *   --sand:   #E9DFD0  muted accent
 *   --softorange: #F4D8CC  tinted background (placeholders)
 */

(function (global) {
  'use strict';

  // ------------------------------------------------------------------
  // Constants
  // ------------------------------------------------------------------
  const COLOR = {
    paper:  [250, 246, 240],
    ink:    [42,  33,  24],
    ink2:   [107, 94,  80],
    ink3:   [168, 158, 145],
    orange: [200, 75,  49],
    sand:   [233, 223, 208],
    soft:   [244, 216, 204],
  };

  // Page sizes in inches (jsPDF default unit 'in')
  const PAGE_SIZES = {
    letter: { w: 8.5, h: 11.0, label: 'Letter' },
    a4:     { w: 8.27, h: 11.69, label: 'A4' }, // 210x297 mm
  };
  const MARGIN = 0.5; // generous

  const STORAGE_KEY = 'bites.v0';
  const PAGESIZE_KEY = 'bites.v0.cookbookPageSize';
  const UNLOCKED_KEY = 'bites.v0.cookbookUnlocked';

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------
  const Cookbook = {
    /** Pull bites from localStorage. */
    loadBites() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('cookbook: loadBites failed', e);
        return [];
      }
    },

    /** Filter bites to a window. Default: last 365 days from today. */
    filterRange(bites, opts = {}) {
      const end = opts.end ? new Date(opts.end) : new Date();
      const start = opts.start
        ? new Date(opts.start)
        : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
      const within = bites.filter((b) => {
        if (!b.date) return false;
        const d = new Date(b.date);
        return d >= start && d <= end;
      });
      // newest first for display, but cookbook flows oldest → newest like a journal
      within.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      return { bites: within, start, end };
    },

    /** Compute headline stats for the cover. */
    computeStats(bites) {
      if (!bites.length) {
        return { count: 0, avgRating: null, topCuisine: null };
      }
      const rated = bites.filter((b) => typeof b.rating === 'number');
      const avg = rated.length
        ? rated.reduce((s, b) => s + b.rating, 0) / rated.length
        : null;
      // Top cuisine: most-frequent tag, but skip generic mood/context tags so
      // we don't end up with "Top tag: repeat" on the cover.
      const NON_CUISINE = new Set([
        'repeat', 'splurge', 'lunch', 'dinner', 'breakfast', 'brunch',
        'date-night', 'date night', 'winter', 'summer', 'fall', 'spring',
        'spicy', 'cheap', 'expensive',
      ]);
      const tagCount = new Map();
      for (const b of bites) {
        if (Array.isArray(b.tags)) {
          for (const t of b.tags) {
            if (!t) continue;
            const k = String(t).toLowerCase().trim();
            if (NON_CUISINE.has(k)) continue;
            tagCount.set(k, (tagCount.get(k) || 0) + 1);
          }
        }
      }
      let top = null;
      let topN = 0;
      for (const [k, n] of tagCount) {
        if (n > topN) { top = k; topN = n; }
      }
      // Fallback: if every tag was filtered, use the first tag we see.
      if (!top) {
        for (const b of bites) {
          if (Array.isArray(b.tags) && b.tags.length) { top = String(b.tags[0]).toLowerCase(); break; }
        }
      }
      return { count: bites.length, avgRating: avg, topCuisine: top };
    },

    /** Group bites by YYYY-MM. Returns array of {key, label, items}. */
    groupByMonth(bites) {
      const map = new Map();
      for (const b of bites) {
        if (!b.date) continue;
        const key = b.date.slice(0, 7); // YYYY-MM
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(b);
      }
      const keys = Array.from(map.keys()).sort();
      return keys.map((k) => ({
        key: k,
        label: monthLabel(k),
        items: map.get(k),
      }));
    },

    /**
     * Build the PDF and return { blob, filename, doc }.
     * opts: { pageSize: 'letter'|'a4', userName: string, start?, end? }
     */
    async generate(bites, opts = {}) {
      const { jsPDF } = global.jspdf || global; // UMD bundle exposes jspdf.jsPDF
      if (!jsPDF) throw new Error('jsPDF not loaded');

      const pageSizeKey =
        opts.pageSize ||
        (typeof localStorage !== 'undefined' && localStorage.getItem(PAGESIZE_KEY)) ||
        'letter';
      const size = PAGE_SIZES[pageSizeKey] || PAGE_SIZES.letter;

      const doc = new jsPDF({
        unit: 'in',
        format: [size.w, size.h],
        compress: true,
      });

      // --- Filter + stats
      const filtered = Cookbook.filterRange(bites, opts);
      const stats = Cookbook.computeStats(filtered.bites);
      const userName = (opts.userName || '').trim() || '—';
      const ctx = {
        doc,
        size,
        margin: MARGIN,
        innerW: size.w - MARGIN * 2,
        innerH: size.h - MARGIN * 2,
        userName,
        bites: filtered.bites,
        start: filtered.start,
        end: filtered.end,
        stats,
        pageSizeKey,
      };

      // --- Cover
      drawCover(ctx);

      // --- Empty state shortcut
      if (!filtered.bites.length) {
        doc.addPage([size.w, size.h]);
        drawEmptyState(ctx);
        drawClosing(ctx, true);
        return finish(doc, ctx);
      }

      // --- TOC (one or two pages depending on count)
      const groups = Cookbook.groupByMonth(filtered.bites);
      doc.addPage([size.w, size.h]);
      drawTOC(ctx, groups);

      // --- Body: one bite per page (need to preload images first so layout
      //          knows actual aspect ratio). Photos are data URLs, so we can
      //          read them synchronously via Image() but we await onload.
      const imgInfo = await preloadImages(filtered.bites);
      let pageNum = 1; // body page numbering starts at 1
      for (const bite of filtered.bites) {
        doc.addPage([size.w, size.h]);
        drawBitePage(ctx, bite, imgInfo.get(bite.id) || null, pageNum);
        pageNum += 1;
      }

      // --- Closing
      doc.addPage([size.w, size.h]);
      drawClosing(ctx, false);

      return finish(doc, ctx);
    },
  };

  // ------------------------------------------------------------------
  // Page drawers
  // ------------------------------------------------------------------

  function drawCover(ctx) {
    const { doc, size, margin } = ctx;

    paintBackground(doc, size);

    // ---- Top band: orange rule + eyebrow + small ornament dot.
    // Everything left-aligned to the same column for visual coherence.
    doc.setDrawColor(...COLOR.orange);
    doc.setLineWidth(0.04);
    doc.line(margin, 1.0, margin + 1.4, 1.0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.orange);
    doc.text('A BITES COOKBOOK', margin, 1.3, { charSpace: 0.06 });

    // Volume marker for personality, balances the right side a bit.
    const vol = `Vol. ${ctx.end.getFullYear()}`;
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(...COLOR.ink3);
    doc.text(vol, size.w - margin, 1.3, { align: 'right' });

    // ---- Title block. Larger, tighter, lower so it owns the upper third.
    doc.setFont('times', 'bold');
    doc.setFontSize(78);
    doc.setTextColor(...COLOR.ink);
    const titleY = 3.4;
    doc.text('My Year', margin, titleY);
    doc.text('of Bites.', margin, titleY + 1.05);

    // ---- Subtitle line tight under the title.
    doc.setFont('times', 'italic');
    doc.setFontSize(15);
    doc.setTextColor(...COLOR.ink2);
    const dateRange = formatDateRange(ctx.start, ctx.end);
    doc.text(`${ctx.userName} · ${dateRange}`, margin, titleY + 1.6);

    // ---- Stats row: pulled tight under the subtitle, all left-aligned to the
    //      same column as the title. No center-vs-left mixing.
    const statsY = titleY + 2.4;
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.012);
    doc.line(margin, statsY - 0.35, size.w - margin, statsY - 0.35);

    const colW = (size.w - margin * 2) / 3;
    const stats = [
      ['Total bites', ctx.stats.count > 0 ? String(ctx.stats.count) : '—'],
      ['Average rating', ctx.stats.avgRating != null ? ctx.stats.avgRating.toFixed(1) : '—'],
      ['Favorite cuisine', ctx.stats.topCuisine ? capitalize(ctx.stats.topCuisine) : '—'],
    ];
    for (let i = 0; i < stats.length; i++) {
      const [label, value] = stats[i];
      const x = margin + colW * i;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR.ink3);
      doc.text(label.toUpperCase(), x, statsY, { charSpace: 0.06 });
      doc.setFont('times', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(...COLOR.ink);
      doc.text(value, x, statsY + 0.55);
    }
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.012);
    doc.line(margin, statsY + 0.85, size.w - margin, statsY + 0.85);

    // ---- Pull-quote in the dead zone, leans on Leonardo / fanatical detail.
    //      A subtle voice anchor, not a marketing line.
    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(...COLOR.ink2);
    const quote = '“A year is just a stack of small, considered meals.”';
    const quoteLines = doc.splitTextToSize(quote, size.w - margin * 2 - 0.5);
    let qy = statsY + 1.8;
    for (const ln of quoteLines) { doc.text(ln, margin, qy); qy += 0.28; }

    // ---- Footer: wordmark anchors lower-left; ornament & url stay quiet.
    // Single accent: small orange square right next to the wordmark.
    doc.setFillColor(...COLOR.orange);
    doc.rect(margin, size.h - 0.95, 0.16, 0.16, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...COLOR.ink);
    doc.text('Bites', margin + 0.28, size.h - 0.82);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.ink3);
    doc.text('aitinkery.github.io/bites', margin, size.h - 0.5, { charSpace: 0.04 });

    // Edition stamp, right-aligned, balances the wordmark. Slightly tighter
    // tracking so it doesn't run past the right margin.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.ink3);
    doc.text('FIRST EDITION', size.w - margin, size.h - 0.62, {
      align: 'right', charSpace: 0.04,
    });
  }

  function drawTOC(ctx, groups) {
    const { doc, size, margin, innerW } = ctx;
    paintBackground(doc, size);

    // Eyebrow + title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.orange);
    doc.text('CONTENTS', margin, margin + 0.4, { charSpace: 0.04 });

    doc.setFont('times', 'bold');
    doc.setFontSize(34);
    doc.setTextColor(...COLOR.ink);
    doc.text('The Year, in Order', margin, margin + 1.0);

    // Hairline
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.012);
    doc.line(margin, margin + 1.35, size.w - margin, margin + 1.35);

    let y = margin + 1.85;
    let pageBite = 1; // body page number references

    for (const group of groups) {
      // Page break before a new month if too close to bottom
      if (y > size.h - margin - 1.0) {
        doc.addPage([size.w, size.h]);
        paintBackground(doc, size);
        y = margin + 0.6;
      }

      // Month header
      doc.setFont('times', 'italic');
      doc.setFontSize(16);
      doc.setTextColor(...COLOR.orange);
      doc.text(group.label, margin, y);
      y += 0.25;
      doc.setDrawColor(...COLOR.sand);
      doc.setLineWidth(0.008);
      doc.line(margin, y, size.w - margin, y);
      y += 0.25;

      for (const b of group.items) {
        if (y > size.h - margin - 0.4) {
          doc.addPage([size.w, size.h]);
          paintBackground(doc, size);
          y = margin + 0.6;
        }
        // Left: dish · restaurant
        doc.setFont('times', 'normal');
        doc.setFontSize(11.5);
        doc.setTextColor(...COLOR.ink);
        const dish = b.dish_name || '(untitled bite)';
        doc.text(dish, margin, y);

        const dishW = doc.getTextWidth(dish);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...COLOR.ink2);
        const restaurant = b.restaurant_name ? ` · ${b.restaurant_name}` : '';
        doc.text(restaurant, margin + dishW, y);

        // Right: date  [dots]  p.N. We compose right-aligned by measuring.
        const dateShort = b.date ? shortDate(b.date) : '';
        const pageStr = `p.${pageBite}`;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...COLOR.ink3);
        const pageW = doc.getTextWidth(pageStr);
        // page number flush right
        doc.text(pageStr, size.w - margin, y, { align: 'right' });
        // dot rating block ends just before page number with a small gap
        const dotsRight = size.w - margin - pageW - 0.18;
        const dotsWidth = 5 * (0.045 * 2 + 0.045);
        const dotsLeft = dotsRight - dotsWidth;
        if (b.rating != null) {
          drawDotRating(doc, b.rating, dotsLeft, y - 0.06);
        }
        // date sits left of the dots
        if (dateShort) {
          const dateW = doc.getTextWidth(dateShort);
          doc.text(dateShort, dotsLeft - 0.16 - dateW, y);
        }

        y += 0.32;
        pageBite += 1;
      }
      y += 0.2;
    }
  }

  function drawBitePage(ctx, bite, imgInfo, pageNum) {
    const { doc, size, margin, innerW } = ctx;
    paintBackground(doc, size);

    // ---- Photo region: ~45% of page height when present (still hero-sized
    //      for real photos) but leaves enough room for notes + pills.
    const photoTop = margin;
    const hasPhoto = !!(imgInfo && imgInfo.dataUrl);
    const photoBoxH = (hasPhoto ? 0.52 : 0.42) * size.h - margin;
    const photoBoxW = innerW;

    if (imgInfo && imgInfo.dataUrl) {
      // fit inside box keeping aspect ratio
      const fit = fitContain(imgInfo.w, imgInfo.h, photoBoxW, photoBoxH);
      const x = margin + (photoBoxW - fit.w) / 2;
      const y = photoTop + (photoBoxH - fit.h) / 2;
      try {
        doc.addImage(imgInfo.dataUrl, imgInfo.format, x, y, fit.w, fit.h, undefined, 'FAST');
      } catch (e) {
        drawPhotoPlaceholder(doc, margin, photoTop, photoBoxW, photoBoxH);
      }
      // thin sand frame
      doc.setDrawColor(...COLOR.sand);
      doc.setLineWidth(0.008);
      doc.rect(x, y, fit.w, fit.h);
    } else {
      drawPhotoPlaceholder(doc, margin, photoTop, photoBoxW, photoBoxH);
    }

    // ---- Caption block
    let y = photoTop + photoBoxH + 0.45;

    // Eyebrow: DATE  ••••○  ·  $$
    // Rating drawn as filled/hollow dots so it reads as a visual scale. We
    // place each segment with explicit gaps measured in inches, not via
    // charSpace fudge — that caused JAN 18 to overlap the first dot.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.orange);
    const GAP = 0.18; // breathing room between segments
    let ex = margin;
    // No charSpace on the date — it makes width math unreliable. Tracking is
    // already implied by the small-caps treatment.
    if (bite.date) {
      const dlabel = shortDate(bite.date).toUpperCase();
      doc.text(dlabel, ex, y);
      ex += doc.getTextWidth(dlabel) + GAP;
    }
    if (bite.rating != null) {
      ex = drawDotRating(doc, bite.rating, ex, y - 0.05);
      ex += GAP - 0.04; // drawDotRating already adds a tiny pad
    }
    if (bite.price_estimate) {
      // tiny middot separator
      doc.setTextColor(...COLOR.ink3);
      doc.text('·', ex, y);
      ex += doc.getTextWidth('·') + 0.08;
      doc.setTextColor(...COLOR.orange);
      doc.text(bite.price_estimate, ex, y);
    }
    y += 0.35;

    // Dish name (huge serif, possibly two lines)
    doc.setFont('times', 'bold');
    doc.setFontSize(34);
    doc.setTextColor(...COLOR.ink);
    const dishName = bite.dish_name || '(untitled bite)';
    const dishLines = doc.splitTextToSize(dishName, innerW);
    // Limit to 2 lines visually
    const dishToShow = dishLines.slice(0, 2);
    for (const line of dishToShow) {
      doc.text(line, margin, y);
      y += 0.45;
    }

    // Restaurant + city
    if (bite.restaurant_name || bite.city) {
      doc.setFont('times', 'italic');
      doc.setFontSize(14);
      doc.setTextColor(...COLOR.ink2);
      const rc = [bite.restaurant_name, bite.city].filter(Boolean).join(' · ');
      doc.text(rc, margin, y);
      y += 0.32;
    }

    // Hairline
    y += 0.05;
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.008);
    doc.line(margin, y, size.w - margin, y);
    y += 0.25;

    // Notes (italic serif)
    if (bite.notes) {
      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(...COLOR.ink);
      const lines = doc.splitTextToSize(bite.notes, innerW);
      // line height ~ 1.45em at 12pt = ~0.24 in
      const lh = 0.22;
      // Cap to whatever fits before tag pill region (reserve 0.6in bottom)
      const maxY = size.h - margin - 0.7;
      for (const line of lines) {
        if (y > maxY) {
          doc.text('…', margin, y);
          break;
        }
        doc.text(line, margin, y);
        y += lh;
      }
      y += 0.15; // breathing room before pills
    }

    // Tags as pills, flowed right after notes (not orphaned at the bottom).
    // Falls back to bottom-anchor if there's enough room left.
    if (Array.isArray(bite.tags) && bite.tags.length) {
      const pillY = Math.min(y + 0.05, size.h - margin - 0.3);
      drawTagPills(doc, bite.tags, margin, pillY, innerW);
    }

    // Page number bottom-right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.ink3);
    doc.text(String(pageNum), size.w - margin, size.h - margin + 0.05, {
      align: 'right',
    });
  }

  function drawClosing(ctx, isEmpty) {
    const { doc, size, margin } = ctx;
    paintBackground(doc, size);

    // Center vertically-ish
    const cx = size.w / 2;
    const baseY = size.h * 0.42;

    doc.setDrawColor(...COLOR.orange);
    doc.setLineWidth(0.04);
    doc.line(cx - 0.6, baseY - 0.4, cx + 0.6, baseY - 0.4);

    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...COLOR.ink);
    doc.text('Made with Bites', cx, baseY, { align: 'center' });

    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(...COLOR.ink2);
    doc.text(
      isEmpty
        ? 'No bites captured yet — your story starts on the next plate.'
        : 'A small ritual that adds up to a year.',
      cx, baseY + 0.4, { align: 'center' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.ink3);
    doc.text('aitinkery.github.io/bites', cx, baseY + 0.85, {
      align: 'center', charSpace: 0.02,
    });

    // Renewal nudge (small)
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.ink3);
    doc.text(
      'Want next year? Renew your cookbook at aitinkery.github.io/bites/renew',
      cx, size.h - 0.7, { align: 'center' }
    );
  }

  function drawEmptyState(ctx) {
    const { doc, size, margin } = ctx;
    paintBackground(doc, size);
    const cx = size.w / 2;
    const cy = size.h * 0.45;

    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...COLOR.ink);
    doc.text('No bites in this window', cx, cy, { align: 'center' });

    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(...COLOR.ink2);
    doc.text(
      'Add a few bites in the app, then come back to print your year.',
      cx, cy + 0.5, { align: 'center' }
    );
  }

  // ------------------------------------------------------------------
  // Helpers — drawing primitives
  // ------------------------------------------------------------------

  function paintBackground(doc, size) {
    doc.setFillColor(...COLOR.paper);
    doc.rect(0, 0, size.w, size.h, 'F');
  }

  function drawPhotoPlaceholder(doc, x, y, w, h) {
    // Quiet textured block. Goal: don't shout when a photo is missing —
    // we want the dish name to stay the hero, so the placeholder reads as
    // "intentional negative space, not error."
    doc.setFillColor(...COLOR.paper);
    doc.rect(x, y, w, h, 'F');
    // Subtle border
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.012);
    doc.rect(x, y, w, h);
    // Diagonal hatch, very faint
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.003);
    const step = 0.22;
    for (let dx = -h; dx < w; dx += step) {
      doc.line(x + dx, y + h, x + dx + h, y);
    }
    // Single orange corner accent (small, intentional)
    doc.setFillColor(...COLOR.orange);
    doc.rect(x + 0.3, y + h - 0.32, 0.04, 0.16, 'F');

    // Quiet caption, tucked into bottom-left rather than dead-center
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.ink3);
    doc.text('no photograph', x + 0.45, y + h - 0.2);
  }

  function drawTagPills(doc, tags, x, y, maxW) {
    // Warm cream pill with sand border, ink-soft text — matches the palette
    // instead of feeling like a stock UI component.
    let cx = x;
    const padX = 0.1;
    const padY = 0.06;
    const gap = 0.07;
    const h = 0.22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    for (const t of tags.slice(0, 8)) {
      const text = String(t);
      const w = doc.getTextWidth(text) + padX * 2;
      if (cx - x + w > maxW) break; // overflow guard
      doc.setFillColor(...COLOR.soft);
      doc.setDrawColor(...COLOR.sand);
      doc.setLineWidth(0.006);
      doc.roundedRect(cx, y - h + padY, w, h, 0.08, 0.08, 'FD');
      doc.setTextColor(...COLOR.ink2);
      doc.text(text, cx + padX, y - 0.04);
      cx += w + gap;
    }
  }

  // ------------------------------------------------------------------
  // Helpers — data
  // ------------------------------------------------------------------

  function monthLabel(yyyymm) {
    const [y, m] = yyyymm.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function shortDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatDateRange(start, end) {
    const fmt = { month: 'long', year: 'numeric' };
    const s = start.toLocaleDateString('en-US', fmt);
    const e = end.toLocaleDateString('en-US', fmt);
    if (s === e) return s;
    return `${s} – ${e}`;
  }

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function renderStarsString(rating) {
    // jsPDF's bundled fonts (helvetica/times) don't include the ★/☆ glyphs,
    // so we render a typographically clean "4.5 / 5" instead. Reads great in
    // print and survives any font swap. (HTML preview keeps real stars.)
    if (rating == null) return '';
    const r = Math.round(rating * 10) / 10;
    const display = Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1);
    return display + ' / 5';
  }

  /**
   * Draw a 5-dot rating scale at (x, y) and return the x position past it.
   * Filled dots = orange. Empty = sand outline. Half-stars are appended as a
   * tiny ".5" superscript so we never have to render an ambiguous
   * half-circle in jsPDF (which has no arc helpers and trips on \`lines\`
   * paths at small sizes).
   */
  function drawDotRating(doc, rating, x, y) {
    const r = 0.045;
    const gap = 0.045;
    const step = r * 2 + gap;
    const rounded = Math.round(rating); // 4.5 -> 5, 4.4 -> 4 (visual rounding)
    const halfFlag = Math.abs(rating - Math.floor(rating)) >= 0.25 &&
                     Math.abs(rating - Math.floor(rating)) < 0.75;
    for (let i = 0; i < 5; i++) {
      const cx = x + r + i * step;
      const cy = y;
      if (i < rounded) {
        doc.setFillColor(...COLOR.orange);
        doc.circle(cx, cy, r, 'F');
      } else {
        doc.setDrawColor(...COLOR.ink3);
        doc.setLineWidth(0.01);
        doc.circle(cx, cy, r, 'S');
      }
    }
    let endX = x + 5 * step + 0.02;
    if (halfFlag) {
      // Tiny "+½" marker, sits just past the dots, baseline-aligned with the
      // eyebrow text. Reads as "and a half" without the ambiguous half-glyph.
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const prevState = doc.getTextColor && doc.getTextColor();
      doc.setTextColor(...COLOR.ink3);
      doc.text('+½', endX, y + 0.04);
      endX += doc.getTextWidth('+½') + 0.04;
      doc.setFontSize(9);
      doc.setTextColor(...COLOR.orange);
    }
    return endX;
  }

  function fitContain(srcW, srcH, boxW, boxH) {
    if (!srcW || !srcH) return { w: boxW, h: boxH };
    const r = Math.min(boxW / srcW, boxH / srcH);
    return { w: srcW * r, h: srcH * r };
  }

  /** Preload images and collect natural dimensions. */
  async function preloadImages(bites) {
    const map = new Map();
    await Promise.all(bites.map((b) => new Promise((resolve) => {
      if (!b.photo_data_url) { resolve(); return; }
      const img = new Image();
      img.onload = () => {
        map.set(b.id, {
          dataUrl: b.photo_data_url,
          w: img.naturalWidth,
          h: img.naturalHeight,
          format: detectImgFormat(b.photo_data_url),
        });
        resolve();
      };
      img.onerror = () => resolve(); // skip broken images silently
      img.src = b.photo_data_url;
    })));
    return map;
  }

  function detectImgFormat(dataUrl) {
    const m = /^data:image\/(\w+);/i.exec(dataUrl || '');
    if (!m) return 'JPEG';
    const f = m[1].toUpperCase();
    if (f === 'JPG' || f === 'JPEG') return 'JPEG';
    if (f === 'PNG') return 'PNG';
    if (f === 'WEBP') return 'WEBP';
    return 'JPEG';
  }

  function finish(doc, ctx) {
    const blob = doc.output('blob');
    const fname = `bites-cookbook-${ctx.start.toISOString().slice(0,10)}-to-${ctx.end.toISOString().slice(0,10)}.pdf`;
    return { blob, filename: fname, doc };
  }

  /** Convenience: kick off a download in the browser. */
  Cookbook.download = async function (bites, opts = {}) {
    const out = await Cookbook.generate(bites, opts);
    const url = URL.createObjectURL(out.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = out.filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1000);
    return out;
  };

  /** True if cookbook export is unlocked (paid) for this device. */
  Cookbook.isUnlocked = function () {
    try { return localStorage.getItem(UNLOCKED_KEY) === '1'; }
    catch { return false; }
  };

  // Expose on globals
  global.BitesCookbook = Cookbook;

})(typeof window !== 'undefined' ? window : globalThis);
