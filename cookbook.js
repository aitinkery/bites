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

      // --- Pre-pass: assign page numbers per bite so the TOC reflects spreads.
      const imgInfoPre = await preloadImages(filtered.bites);
      const planning = [];
      let plannedPage = 1;
      for (const bite of filtered.bites) {
        const info = imgInfoPre.get(bite.id) || null;
        const hasPhoto = !!(info && info.dataUrl);
        const isHero = hasPhoto && typeof bite.rating === 'number' && bite.rating >= 4.5;
        planning.push({ bite, info, hasPhoto, isHero, page: plannedPage });
        plannedPage += isHero ? 2 : 1;
      }
      const tocMap = new Map(planning.map(p => [p.bite.id, p.page]));
      ctx.imgInfo = imgInfoPre;
      ctx.planning = planning;
      ctx.tocMap = tocMap;

      // --- TOC (one or two pages depending on count)
      const groups = Cookbook.groupByMonth(filtered.bites);
      doc.addPage([size.w, size.h]);
      drawTOC(ctx, groups);

      // --- Body: dispatch per bite. Three layouts:
      //   * Spread (rating ≥ 4.5 AND photo): two pages, photo left / typo right.
      //   * Photo: one page, refined photo-hero.
      //   * No-photo: one page, magazine pull-quote treatment.
      //  Page numbering starts at 1 and increments per *page emitted* so the
      //  TOC links stay accurate even when spreads consume two slots.
      let pageNum = 1;
      for (const plan of ctx.planning) {
        const { bite, info, hasPhoto, isHero } = plan;
        if (isHero) {
          doc.addPage([size.w, size.h]);
          drawSpreadPhoto(ctx, bite, info, pageNum);
          doc.addPage([size.w, size.h]);
          drawSpreadCopy(ctx, bite, pageNum + 1);
          pageNum += 2;
        } else if (hasPhoto) {
          doc.addPage([size.w, size.h]);
          drawBitePagePhoto(ctx, bite, info, pageNum);
          pageNum += 1;
        } else {
          doc.addPage([size.w, size.h]);
          drawBitePageTypographic(ctx, bite, pageNum);
          pageNum += 1;
        }
      }

      // --- Closing — "What I Loved" auto-curated, then signature
      doc.addPage([size.w, size.h]);
      drawWhatILoved(ctx, filtered.bites);
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
    doc.text('THE BITES COOKBOOK', margin, 1.3, { charSpace: 0.06 });

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
    // 'FIRST EDITION' — charSpace expands width past the alignment anchor,
    // which clips the last glyph. Pull the anchor in by the expansion delta.
    const fe = 'FIRST EDITION';
    const feCs = 0.04;
    const feShift = (fe.length - 1) * feCs;
    doc.text(fe, size.w - margin - feShift, size.h - 0.62, {
      align: 'right', charSpace: feCs,
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
    doc.text('The Year, in Order', margin, margin + 1.0, { charSpace: -0.014 });

    // Hairline
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.012);
    doc.line(margin, margin + 1.35, size.w - margin, margin + 1.35);

    let y = margin + 1.85;
    const tocMap = ctx.tocMap || new Map();

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
        const pageStr = `p.${tocMap.get(b.id) || ''}`;
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
      }
      y += 0.2;
    }
  }

  /**
   * PHOTO LAYOUT — refined.
   *
   * Kerning fix: the big serif heading used Times-bold via jsPDF's bundled
   * core fonts. Long words like "Margherita" showed visible kerning gaps.
   * Mitigations applied here:
   *   1. Body text (notes, restaurant + city, eyebrow) moved to Helvetica
   *      with explicit charSpace where appropriate. Helvetica's metrics in
   *      jsPDF's core set are tighter and more uniform.
   *   2. Display headlines kept in Times-bold but with a *negative* charSpace
   *      tightening (~ -0.012) which collapses the awkward inter-letter air.
   *   3. Headline size bumped slightly so the tracking issue is less visible
   *      relative to letter widths.
   *   We did not embed Fraunces/Inter (would push the bundle past 1MB; the
   *   cookbook is meant to be email-attachable). Documented decision.
   */
  function drawBitePagePhoto(ctx, bite, imgInfo, pageNum) {
    const { doc, size, margin, innerW } = ctx;
    paintBackground(doc, size);

    // ---- Photo region: hero, takes the upper half. Tightened to leave
    //      more breathing room for the larger body type below.
    const photoTop = margin;
    const photoBoxH = 0.50 * size.h - margin;
    const photoBoxW = innerW;

    const fit = fitContain(imgInfo.w, imgInfo.h, photoBoxW, photoBoxH);
    const px = margin + (photoBoxW - fit.w) / 2;
    const py = photoTop + (photoBoxH - fit.h) / 2;
    try {
      doc.addImage(imgInfo.dataUrl, imgInfo.format, px, py, fit.w, fit.h, undefined, 'FAST');
    } catch (e) {
      // fall through to caption — don't draw a placeholder, the no-photo
      // layout exists for that case
    }
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.008);
    doc.rect(px, py, fit.w, fit.h);

    // ---- Caption block
    let y = photoTop + photoBoxH + 0.40;

    // Eyebrow: DATE  ••••○  ·  $$
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.orange);
    const GAP = 0.18;
    let ex = margin;
    if (bite.date) {
      const dlabel = shortDate(bite.date).toUpperCase();
      doc.text(dlabel, ex, y, { charSpace: 0.04 });
      ex += doc.getTextWidth(dlabel) + 5 * 0.04 + GAP;
    }
    if (bite.rating != null) {
      ex = drawDotRating(doc, bite.rating, ex, y - 0.05);
      ex += GAP - 0.04;
    }
    if (bite.price_estimate) {
      doc.setTextColor(...COLOR.ink3);
      doc.text('·', ex, y);
      ex += doc.getTextWidth('·') + 0.08;
      doc.setTextColor(...COLOR.orange);
      doc.text(bite.price_estimate, ex, y);
    }
    y += 0.4;

    // Dish name — big serif, slight negative tracking to fix kerning gaps
    doc.setFont('times', 'bold');
    doc.setFontSize(34);
    doc.setTextColor(...COLOR.ink);
    const dishName = bite.dish_name || '(untitled bite)';
    const dishLines = doc.splitTextToSize(dishName, innerW);
    const dishToShow = dishLines.slice(0, 2);
    for (const line of dishToShow) {
      doc.text(line, margin, y, { charSpace: -0.025 });
      y += 0.46;
    }

    // Restaurant + city — Helvetica small caps for crisp rendering
    if (bite.restaurant_name || bite.city) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...COLOR.ink2);
      const rc = [bite.restaurant_name, bite.city].filter(Boolean).join('  ·  ').toUpperCase();
      doc.text(rc, margin, y, { charSpace: 0.08 });
      y += 0.28;
    }

    // Hairline
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.008);
    doc.line(margin, y, size.w - margin, y);
    y += 0.32;

    // Notes — Times italic, larger so it reads as body content not caption.
    // First sentence gets a slightly larger lead-in to give the paragraph a
    // typographic entry point (a soft drop-cap alternative).
    if (bite.notes) {
      const notes = String(bite.notes).trim();
      // Split on first sentence boundary; fall back to whole-paragraph treatment.
      const m = notes.match(/^([^.!?]+[.!?])(\s+)([\s\S]+)$/);
      const lead = m ? m[1] : null;
      const rest = m ? m[3] : notes;

      const lh = 0.26;
      const maxY = size.h - margin - 0.85; // reserve room for tag row + foot
      doc.setTextColor(...COLOR.ink);

      if (lead) {
        // Lead-in: 16pt, slightly heavier eye-pull. Wrap to inner width.
        doc.setFont('times', 'italic');
        doc.setFontSize(16);
        const leadLh = 0.30;
        const leadLines = doc.splitTextToSize(lead, innerW);
        for (const line of leadLines) {
          if (y > maxY) { doc.text('…', margin, y); break; }
          doc.text(line, margin, y);
          y += leadLh;
        }
        y += 0.04;
      }

      // Body: 14pt times italic
      doc.setFont('times', 'italic');
      doc.setFontSize(14);
      const lines = doc.splitTextToSize(rest, innerW);
      for (const line of lines) {
        if (y > maxY) { doc.text('…', margin, y); break; }
        doc.text(line, margin, y);
        y += lh;
      }
      y += 0.12;
    }

    // Tags as small-caps separator-dot chain (replaces filled pills).
    if (Array.isArray(bite.tags) && bite.tags.length) {
      const tagY = Math.min(y + 0.05, size.h - margin - 0.5);
      drawTagsInline(doc, bite.tags, margin, tagY, innerW);
    }

    drawFootSystem(doc, size, margin, pageNum, bite);
  }

  /**
   * NO-PHOTO LAYOUT — the magazine pull-quote treatment.
   *
   * Considered three sketches before writing this:
   *   (1) Vertical date anchor: "MARCH" set vertical along left margin.
   *       Risk: jsPDF rotated text is finicky and reads as gimmick.
   *   (2) Centered pull-quote with curly marks as the visual anchor.
   *       The notes do the heavy lifting the photo would have done.
   *   (3) Editorial folio: small eyebrow, dish name dominant, decorative
   *       ornament. Solid but felt too card-like.
   *   Picked (2): pull-quote replaces the photo's compositional weight,
   *   dish name still gets a hero treatment, and the rating becomes a real
   *   graphical element. Reads as a New Yorker callout, not a missing-data
   *   template.
   */
  function drawBitePageTypographic(ctx, bite, pageNum) {
    const { doc, size, margin, innerW } = ctx;
    paintBackground(doc, size);

    // ---- Eyebrow (top): DATE  ·  PRICE
    let y = margin + 0.4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.orange);
    const eyebrow = [
      bite.date ? shortDate(bite.date).toUpperCase() : null,
      bite.price_estimate || null,
    ].filter(Boolean).join('   ·   ');
    if (eyebrow) doc.text(eyebrow, margin, y, { charSpace: 0.08 });

    // Right side: small ornament — the orange square + thin rule
    doc.setFillColor(...COLOR.orange);
    doc.rect(size.w - margin - 0.16, y - 0.11, 0.16, 0.16, 'F');

    // ---- Decorative rule under eyebrow
    y += 0.18;
    doc.setDrawColor(...COLOR.orange);
    doc.setLineWidth(0.012);
    doc.line(margin, y, size.w - margin, y);

    // ---- Restaurant in small caps (magazine subhead)
    y += 0.6;
    if (bite.restaurant_name) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR.ink2);
      // Try restaurant + city; if too wide for the available column, drop
      // the city. Tracked-out caps eat width so we measure conservatively.
      const subMaxW = innerW - 0.7; // leave room for vertical-tag gutter
      const charSpaceSub = 0.12;
      const measure = (s) => doc.getTextWidth(s) + (s.length - 1) * charSpaceSub;
      let sub = (bite.city
        ? `${bite.restaurant_name}   ·   ${bite.city}`
        : bite.restaurant_name).toUpperCase();
      if (measure(sub) > subMaxW && bite.city) {
        sub = bite.restaurant_name.toUpperCase();
      }
      if (measure(sub) > subMaxW) {
        // Still too long: hard-truncate with ellipsis.
        while (sub.length > 6 && measure(sub + '…') > subMaxW) sub = sub.slice(0, -1);
        sub = sub.trimEnd() + '…';
      }
      doc.text(sub, margin, y, { charSpace: charSpaceSub });
      y += 0.85;
    }

    // ---- Dish name — hero display.
    //      jsPDF bundles only core fonts (Helvetica/Times/Courier) with no
    //      proper kerning tables, so long serif words like "Margherita" or
    //      "Tonkotsu" show visible inter-letter gaps. Mitigation: use
    //      Times-bold but apply aggressive negative tracking. Embedding
    //      Fraunces would fix it but adds ~600KB to the bundle, breaking
    //      the email-attachable target. Documented trade-off: ship a B+
    //      that's 100KB over an A that's 800KB.
    doc.setFont('times', 'bold');
    doc.setFontSize(42);
    doc.setTextColor(...COLOR.ink);
    const dishName = bite.dish_name || '(untitled bite)';
    const dishLines = doc.splitTextToSize(dishName, innerW - 0.6);
    for (const line of dishLines.slice(0, 2)) {
      doc.text(line, margin, y, { charSpace: -0.04 });
      y += 0.58;
    }

    // ---- Rating: large graphic flush-left, with a hairline trailing right
    //      that visually pulls the eye down toward the pull-quote.
    if (bite.rating != null) {
      y += 0.2;
      drawDotRatingLarge(doc, bite.rating, margin + 0.6, y);
      doc.setDrawColor(...COLOR.ink3);
      doc.setLineWidth(0.005);
      doc.line(margin + 1.9, y, size.w - margin - 1.0, y);
      y += 0.45;
    }

    // ---- Pull-quote of the notes — fills the available vertical band.
    //      We grow the type to fill the band TOP-anchored so the quote
    //      reads from the upper-mid down to the foot, not floating in the
    //      lower third with dead air above it.
    if (bite.notes) {
      const bandTop = y;
      // Tighten band bottom: reserve room for the where/when finale (~0.6)
      // plus the foot system (~0.35) so the lower third has structure.
      const bandBottom = size.h - margin - 1.55;
      drawPullQuoteTopAnchored(doc, ctx, bite.notes, bandTop, bandBottom, bite);
    }

    // ---- Tags as a vertical strip pinned to the right margin
    if (Array.isArray(bite.tags) && bite.tags.length) {
      drawVerticalTags(doc, ctx, bite.tags);
    }

    // ---- "Where & when" finale — restates already-known data as a
    //      typographic anchor for the lower third. The pull-quote layout
    //      previously left the bottom of the page unanchored; this band
    //      gives it a designed foot. (Considered: extending the cuisine
    //      sidebar full-height — visually heavier and fights the quote.
    //      Considered: oversized rating glyph — already rendered above.
    //      The where/when finale wins by adding info density without
    //      competing with the quote.)
    drawWhereWhenFinale(doc, ctx, bite);

    // ---- Foot-system (shared with photo + spread pages).
    drawFootSystem(doc, size, margin, pageNum, bite);
  }

  /**
   * SPREAD LAYOUT — photo left page, full-bleed.
   * Used for bites with rating ≥ 4.5 and an actual photo. Slows the reader
   * down for the year's best moments.
   */
  function drawSpreadPhoto(ctx, bite, imgInfo, pageNum) {
    const { doc, size, margin } = ctx;
    paintBackground(doc, size);

    // Full-bleed photo — no margins. If the image aspect ratio doesn't match
    // the page, we cover-crop centrally.
    const fit = fitCover(imgInfo.w, imgInfo.h, size.w, size.h);
    const x = (size.w - fit.w) / 2;
    const y = (size.h - fit.h) / 2;
    try {
      doc.addImage(imgInfo.dataUrl, imgInfo.format, x, y, fit.w, fit.h, undefined, 'FAST');
    } catch (e) { /* fall through */ }

    // Foot system on a cream pill so it stays legible over the photo.
    // Same Nº/cuisine treatment as the bite pages, just background-cleared.
    doc.setFillColor(...COLOR.paper);
    doc.rect(margin - 0.05, size.h - margin - 0.32, size.w - 2 * margin + 0.1, 0.40, 'F');
    drawFootSystem(doc, size, margin, pageNum, bite);
  }

  /**
   * SPREAD LAYOUT — right page, oversized typography. No photo here so the
   * dish has air. Mirrors the typographic layout but with a "featured" feel.
   */
  function drawSpreadCopy(ctx, bite, pageNum) {
    const { doc, size, margin, innerW } = ctx;
    paintBackground(doc, size);

    // Eyebrow: "FEATURED BITE" + date
    let y = margin + 0.4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.orange);
    const dateStr = bite.date ? shortDate(bite.date).toUpperCase() : '';
    doc.text(`FEATURED BITE${dateStr ? '  ·  ' + dateStr : ''}`, margin, y, { charSpace: 0.12 });

    // Decorative rule
    y += 0.18;
    doc.setDrawColor(...COLOR.orange);
    doc.setLineWidth(0.018);
    doc.line(margin, y, margin + 1.5, y);

    // Restaurant subhead
    y += 0.55;
    if (bite.restaurant_name) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...COLOR.ink2);
      const sub = (bite.city ? `${bite.restaurant_name}  ·  ${bite.city}` : bite.restaurant_name).toUpperCase();
      doc.text(sub, margin, y, { charSpace: 0.12 });
      y += 0.45;
    }

    // Hero dish name — even larger than typo layout, multi-line OK
    doc.setFont('times', 'bold');
    doc.setFontSize(54);
    doc.setTextColor(...COLOR.ink);
    const dishLines = doc.splitTextToSize(bite.dish_name || '(untitled)', innerW);
    for (const line of dishLines.slice(0, 3)) {
      doc.text(line, margin, y, { charSpace: -0.04 });
      y += 0.72;
    }

    // Rating as big dots
    if (bite.rating != null) {
      y += 0.2;
      drawDotRatingLarge(doc, bite.rating, margin + 0.8, y);
      y += 0.55;
    }

    // Notes as a left-aligned italic block (not pull-quote here — the photo
    // on the facing page already does the visual anchoring).
    if (bite.notes) {
      doc.setFont('times', 'italic');
      doc.setFontSize(15);
      doc.setTextColor(...COLOR.ink);
      const lines = doc.splitTextToSize(bite.notes, innerW - 0.5);
      const lh = 0.28;
      const maxY = size.h - margin - 0.9;
      for (const line of lines) {
        if (y > maxY) { doc.text('…', margin, y); break; }
        doc.text(line, margin, y);
        y += lh;
      }
    }

    // Tags as vertical strip on the right margin
    if (Array.isArray(bite.tags) && bite.tags.length) {
      drawVerticalTags(doc, ctx, bite.tags);
    }

    drawFootSystem(doc, size, margin, pageNum, bite);
  }

  /**
   * "What I Loved" closing — auto-curated from the bite list.
   * Top 3 by rating, then a cuisine cluster if any cluster has ≥3 entries.
   */
  function drawWhatILoved(ctx, bites) {
    const { doc, size, margin, innerW } = ctx;
    paintBackground(doc, size);

    // Eyebrow + title
    let y = margin + 0.4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.orange);
    doc.text('WHAT I LOVED', margin, y, { charSpace: 0.12 });

    y += 0.18;
    doc.setDrawColor(...COLOR.orange);
    doc.setLineWidth(0.012);
    doc.line(margin, y, size.w - margin, y);

    y += 0.6;
    doc.setFont('times', 'bold');
    doc.setFontSize(40);
    doc.setTextColor(...COLOR.ink);
    doc.text('The year, distilled.', margin, y, { charSpace: -0.014 });

    y += 0.5;
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(...COLOR.ink2);
    doc.text('Three bites that earned the highest marks, plus a cluster you kept coming back to.', margin, y);

    // Top 3 by rating
    const top3 = [...bites]
      .filter(b => typeof b.rating === 'number')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);

    y += 0.55;
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.008);
    doc.line(margin, y, size.w - margin, y);

    y += 0.4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.orange);
    doc.text('TOP RATED', margin, y, { charSpace: 0.12 });
    y += 0.32;

    for (let i = 0; i < top3.length; i++) {
      const b = top3[i];
      // Numeral
      doc.setFont('times', 'italic');
      doc.setFontSize(28);
      doc.setTextColor(...COLOR.ink3);
      doc.text(String(i + 1).padStart(2, '0'), margin, y + 0.05);

      // Dish name + meta
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...COLOR.ink);
      doc.text(b.dish_name || '(untitled)', margin + 0.7, y - 0.05, { charSpace: -0.008 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR.ink2);
      const meta = [b.restaurant_name, b.city].filter(Boolean).join(' · ').toUpperCase();
      if (meta) doc.text(meta, margin + 0.7, y + 0.18, { charSpace: 0.08 });

      // Note one-liner
      if (b.notes) {
        const oneLine = truncate(b.notes, 90);
        doc.setFont('times', 'italic');
        doc.setFontSize(11);
        doc.setTextColor(...COLOR.ink);
        doc.text(oneLine, margin + 0.7, y + 0.42, { maxWidth: innerW - 0.7 });
      }

      // Rating dots flush right
      drawDotRating(doc, b.rating, size.w - margin - 0.8, y + 0.05);

      y += 0.75;
    }

    // Cuisine cluster (if any tag has ≥3 bites)
    const cluster = detectCuisineCluster(bites);
    if (cluster) {
      y += 0.15;
      doc.setDrawColor(...COLOR.sand);
      doc.setLineWidth(0.008);
      doc.line(margin, y, size.w - margin, y);
      y += 0.4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR.orange);
      doc.text(`KEPT COMING BACK — ${cluster.tag.toUpperCase()}`, margin, y, { charSpace: 0.12 });
      y += 0.28;

      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(...COLOR.ink);
      doc.text(`${cluster.items.length} bites tagged “${cluster.tag}” this year:`, margin, y);
      y += 0.32;

      for (const b of cluster.items.slice(0, 5)) {
        if (y > size.h - margin - 0.6) break;
        doc.setFont('times', 'normal');
        doc.setFontSize(11.5);
        doc.setTextColor(...COLOR.ink);
        doc.text(`— ${b.dish_name || '(untitled)'}`, margin + 0.1, y);
        if (b.restaurant_name) {
          const dishW = doc.getTextWidth(`— ${b.dish_name || '(untitled)'}`);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...COLOR.ink3);
          doc.text(` at ${b.restaurant_name}`.toUpperCase(), margin + 0.1 + dishW, y, { charSpace: 0.08 });
        }
        y += 0.26;
      }
    }
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
    // instead of feeling like a stock UI component. (Legacy: replaced by
    // drawTagsInline on bite pages — kept in case other surfaces want it.)
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

  /**
   * Inline tag treatment: · PIZZA · ITALIAN · NEAPOLITAN ·
   * Replaces filled rounded-rect pills (which read as CMS-default UI). The
   * tracked-out small caps + dot separators pick up the same typographic
   * voice as the eyebrow and restaurant subhead, so tags now feel like part
   * of the editorial system instead of a tacked-on chip row.
   */
  function drawTagsInline(doc, tags, x, y, maxW) {
    if (!tags || !tags.length) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR.ink2);
    const charSpace = 0.14;
    const sep = '   ·   ';
    // Dots only BETWEEN tags. Earlier rev added leading/trailing dots which
    // read as four arbitrary separators for two items — designer flagged it.
    const upper = tags.slice(0, 8).map(t => String(t || '').toUpperCase()).filter(Boolean);
    if (!upper.length) return;
    let s = upper.join(sep);
    const measure = (str) => doc.getTextWidth(str) + (str.length - 1) * charSpace;
    while (upper.length > 1 && measure(s) > maxW) {
      upper.pop();
      s = upper.join(sep);
    }
    doc.text(s, x, y, { charSpace });
  }

  /**
   * Where-and-when finale: three-column band restating place / date / rating
   * as a typographic foot for the lower third of a no-photo page. Same
   * tracked-caps language as the cover’s stats row, just smaller and quieter.
   */
  function drawWhereWhenFinale(doc, ctx, bite) {
    const { size, margin, innerW } = ctx;
    // Anchor band at the bottom of the type column, just above the foot rule.
    const baseY = size.h - margin - 0.55;
    const colCount = 3;
    const colW = innerW / colCount;

    // Top hairline.
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.006);
    doc.line(margin, baseY - 0.30, size.w - margin, baseY - 0.30);

    const cells = [
      ['PLACE', bite.city ? bite.city : (bite.restaurant_name || '—')],
      ['WHEN',  bite.date ? longDate(bite.date) : '—'],
      ['RATING', bite.rating != null ? renderStarsString(bite.rating) : '—'],
    ];
    for (let i = 0; i < cells.length; i++) {
      const [label, value] = cells[i];
      const cx = margin + i * colW;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR.ink3);
      doc.text(label, cx, baseY - 0.13, { charSpace: 0.14 });
      // Value: serif, modest size; truncate if too long for the column.
      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(...COLOR.ink);
      let v = String(value);
      const cap = colW - 0.12;
      while (v.length > 4 && doc.getTextWidth(v) > cap) v = v.slice(0, -1);
      if (v !== String(value)) v = v.trimEnd() + '…';
      doc.text(v, cx, baseY + 0.12);
    }
  }

  /**
   * Foot system shared by every bite page (and the spread photo page).
   *   left:  Nº 03   in italic serif
   *   right: cuisine label in tracked-out caps
   *   hairline tying them together at the foot margin
   * Cover and TOC use a different bottom (wordmark / first-edition stamp);
   * we don't want to override those.
   */
  function drawFootSystem(doc, size, margin, pageNum, bite) {
    const footY = size.h - margin - 0.25;
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.006);
    doc.line(margin, footY, size.w - margin, footY);
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.ink3);
    doc.text(`Nº ${String(pageNum).padStart(2, '0')}`, margin, size.h - margin - 0.06);
    const cuisineLabel = bite ? pickCuisineLabel(bite) : null;
    if (cuisineLabel) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR.ink3);
      doc.text(cuisineLabel.toUpperCase(), size.w - margin,
               size.h - margin - 0.06,
               { align: 'right', charSpace: 0.12 });
    }
  }

  /**
   * Half-filled dot for a 4.5-style rating glyph.
   *   Right half: filled (paper-color rectangle masks the right side after
   *               drawing a fully filled circle) — nope, do it the other
   *               way: draw filled circle, then over-paint right half with
   *               paper, then draw the stroked outline on top so the seam
   *               disappears. Result reads as “half-full” at any zoom.
   * jsPDF has no real arc/clip primitive that survives older renderers, so
   * the rect-mask approach is the most portable.
   */
  function drawHalfDot(doc, cx, cy, r, fillColor, strokeColor) {
    // 1) Solid filled circle.
    doc.setFillColor(...fillColor);
    doc.circle(cx, cy, r, 'F');
    // 2) Mask right half with paper to leave only the LEFT half filled.
    //    (We pick “left half filled” as the reading convention — matches
    //    how scoring like “4.5” is built up: full dots fill from the left,
    //    the trailing half-dot extends that fill into the next slot.)
    doc.setFillColor(...COLOR.paper);
    doc.rect(cx, cy - r - 0.005, r + 0.01, r * 2 + 0.01, 'F');
    // 3) Re-stroke the outline on top so the divider vanishes into the curve.
    doc.setDrawColor(...strokeColor);
    doc.setLineWidth(0.01);
    doc.circle(cx, cy, r, 'S');
    // 4) Vertical hairline along the diameter to crisp the half/half seam
    //    (otherwise the masked edge can look slightly ragged at print res).
    doc.setDrawColor(...strokeColor);
    doc.setLineWidth(0.01);
    doc.line(cx, cy - r, cx, cy + r);
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

  function longDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
    const floor = Math.floor(rating);
    const frac = rating - floor;
    const halfFlag = frac >= 0.25 && frac < 0.75;
    const fullCount = halfFlag ? floor : Math.round(rating);
    for (let i = 0; i < 5; i++) {
      const cx = x + r + i * step;
      const cy = y;
      if (i < fullCount) {
        doc.setFillColor(...COLOR.orange);
        doc.circle(cx, cy, r, 'F');
      } else if (halfFlag && i === fullCount) {
        // Real half-filled dot glyph (replaces the old "+½" text marker).
        drawHalfDot(doc, cx, cy, r, COLOR.orange, COLOR.ink3);
      } else {
        doc.setDrawColor(...COLOR.ink3);
        doc.setLineWidth(0.01);
        doc.circle(cx, cy, r, 'S');
      }
    }
    return x + 5 * step + 0.02;
  }

  function fitContain(srcW, srcH, boxW, boxH) {
    if (!srcW || !srcH) return { w: boxW, h: boxH };
    const r = Math.min(boxW / srcW, boxH / srcH);
    return { w: srcW * r, h: srcH * r };
  }

  function fitCover(srcW, srcH, boxW, boxH) {
    if (!srcW || !srcH) return { w: boxW, h: boxH };
    const r = Math.max(boxW / srcW, boxH / srcH);
    return { w: srcW * r, h: srcH * r };
  }

  function truncate(s, n) {
    if (!s) return '';
    const flat = String(s).replace(/\s+/g, ' ').trim();
    if (flat.length <= n) return flat;
    return flat.slice(0, n - 1).trimEnd() + '…';
  }

  function pickCuisineLabel(bite) {
    const NON_CUISINE = new Set([
      'repeat', 'splurge', 'lunch', 'dinner', 'breakfast', 'brunch',
      'date-night', 'date night', 'winter', 'summer', 'fall', 'spring',
      'spicy', 'cheap', 'expensive',
    ]);
    if (!Array.isArray(bite.tags)) return null;
    for (const t of bite.tags) {
      const k = String(t || '').toLowerCase().trim();
      if (!k || NON_CUISINE.has(k)) continue;
      return capitalize(k);
    }
    return null;
  }

  function detectCuisineCluster(bites) {
    const NON_CUISINE = new Set([
      'repeat', 'splurge', 'lunch', 'dinner', 'breakfast', 'brunch',
      'date-night', 'date night', 'winter', 'summer', 'fall', 'spring',
      'spicy', 'cheap', 'expensive', 'soup', 'bread',
    ]);
    const tagToBites = new Map();
    for (const b of bites) {
      if (!Array.isArray(b.tags)) continue;
      for (const t of b.tags) {
        const k = String(t || '').toLowerCase().trim();
        if (!k || NON_CUISINE.has(k)) continue;
        if (!tagToBites.has(k)) tagToBites.set(k, []);
        tagToBites.get(k).push(b);
      }
    }
    let best = null;
    for (const [tag, items] of tagToBites) {
      if (items.length < 3) continue;
      if (!best || items.length > best.items.length) best = { tag, items };
    }
    return best;
  }

  /** Larger rating: 5 dots ~0.10in radius, centered horizontally if cx given. */
  function drawDotRatingLarge(doc, rating, cx, cy) {
    const r = 0.085;
    const gap = 0.12;
    const step = r * 2 + gap;
    const totalW = 5 * step - gap;
    const startX = cx - totalW / 2 + r;
    const floor = Math.floor(rating);
    const frac = rating - floor;
    const halfFlag = frac >= 0.25 && frac < 0.75;
    const fullCount = halfFlag ? floor : Math.round(rating);
    for (let i = 0; i < 5; i++) {
      const x = startX + i * step;
      if (i < fullCount) {
        doc.setFillColor(...COLOR.orange);
        doc.circle(x, cy, r, 'F');
      } else if (halfFlag && i === fullCount) {
        // Real half-filled dot glyph.
        drawHalfDot(doc, x, cy, r, COLOR.orange, COLOR.ink3);
      } else {
        doc.setDrawColor(...COLOR.ink3);
        doc.setLineWidth(0.014);
        doc.circle(x, cy, r, 'S');
      }
    }
  }

  /**
   * Pull-quote top-anchored, with line-height stretched so the block
   * fills (or nearly fills) the available band. This produces a tall,
   * generous quote that reads as the page's main body — the editorial
   * equivalent of a full-bleed photo. We follow it with an attribution
   * line ("— on [dish name]") so the lower edge has a typographic foot.
   */
  function drawPullQuoteTopAnchored(doc, ctx, notes, bandTop, bandBottom, bite) {
    const { size, margin, innerW } = ctx;
    const blockW = innerW - 1.0;
    const blockX = margin + 0.55;
    const availH = bandBottom - bandTop - 0.4; // reserve 0.4in for attribution

    // Pick the largest size whose natural leading uses most of the band.
    const candidates = [32, 28, 24, 20, 17, 15];
    let chosen = 15, lhChosen = 0.3, linesChosen = [];
    for (const fs of candidates) {
      doc.setFont('times', 'italic');
      doc.setFontSize(fs);
      const lhMin = fs / 72 * 1.35;
      const lines = doc.splitTextToSize(notes, blockW);
      if (lines.length * lhMin <= availH) {
        chosen = fs; linesChosen = lines;
        // Stretch leading so the block FILLS the band (visual-rhythm trick).
        const stretched = lines.length > 1 ? availH / lines.length : lhMin;
        lhChosen = Math.min(stretched, fs / 72 * 1.85); // cap to avoid airy text
        break;
      }
    }
    if (!linesChosen.length) {
      chosen = 14; lhChosen = 14 / 72 * 1.4;
      doc.setFont('times', 'italic'); doc.setFontSize(chosen);
      linesChosen = doc.splitTextToSize(notes, blockW).slice(0, Math.floor(availH / lhChosen));
    }
    // Cap leading stretch so the quote doesn't read as airy / forced.
    {
      const naturalLh = chosen / 72 * 1.45;
      if (lhChosen > chosen / 72 * 1.62) lhChosen = chosen / 72 * 1.62;
      if (lhChosen < naturalLh) lhChosen = naturalLh;
    }

    // Hanging open-quote — large faint orange, baseline-aligned with first line.
    doc.setFont('times', 'bold');
    doc.setFontSize(Math.max(80, chosen * 3.2));
    doc.setTextColor(...COLOR.soft);
    doc.text('“', blockX - 0.5, bandTop + 0.55);

    // Set the quote
    doc.setFont('times', 'italic');
    doc.setFontSize(chosen);
    doc.setTextColor(...COLOR.ink);
    let y = bandTop + chosen / 72 * 0.85; // first line baseline below bandTop
    for (const line of linesChosen) {
      doc.text(line, blockX, y);
      y += lhChosen;
    }
    y -= lhChosen; // back to last line baseline

    // Closing curly quote
    doc.setFont('times', 'italic');
    doc.setFontSize(chosen);
    doc.setTextColor(...COLOR.orange);
    const lastLine = linesChosen[linesChosen.length - 1] || '';
    const lastW = doc.getTextWidth(lastLine);
    doc.text('”', blockX + Math.min(lastW + 0.05, blockW - 0.2), y);

    // No closing attribution line on the no-photo page — the
    // where/when finale at the foot of the page now does that work.
    // (Previously we had “— RESTAURANT” which duplicated the eyebrow,
    // then “— LONG DATE” which duplicated the finale’s WHEN cell. Both
    // attempts triple-stamped the same data; better to let the finale
    // stand as the page’s typographic period.)
  }

  /**
   * (Legacy) Pull-quote bottom-anchored. Kept for reference but unused.
   */
  function drawPullQuoteBottomAnchored(doc, ctx, notes, bandTop, bandBottom) {
    const { size, margin, innerW } = ctx;
    const blockW = innerW - 1.0; // leave a sliver for the right-margin tag strip
    const blockX = margin + 0.55;
    const availH = bandBottom - bandTop;

    // Try sizes 30, 26, 22, 19, 16. Pick the largest that fits.
    const candidates = [30, 26, 22, 19, 16, 14];
    let chosen = 14, lhChosen = 0.28, linesChosen = [];
    for (const fs of candidates) {
      doc.setFont('times', 'italic');
      doc.setFontSize(fs);
      const lh = fs / 72 * 1.42;
      const lines = doc.splitTextToSize(notes, blockW);
      if (lines.length * lh <= availH) {
        chosen = fs; lhChosen = lh; linesChosen = lines; break;
      }
    }
    if (!linesChosen.length) {
      // Smallest fallback: truncate.
      chosen = 14; lhChosen = 14 / 72 * 1.42;
      doc.setFont('times', 'italic'); doc.setFontSize(chosen);
      linesChosen = doc.splitTextToSize(notes, blockW).slice(0, Math.floor(availH / lhChosen));
    }

    const blockH = linesChosen.length * lhChosen;
    // Bottom-anchor: place block so last line baseline = bandBottom.
    const startY = bandBottom - blockH + lhChosen;

    // Hanging open-quote — large, faint orange, positioned to the LEFT of the
    // text block, baseline-aligned with the first line of the quote.
    doc.setFont('times', 'bold');
    doc.setFontSize(Math.max(72, chosen * 3.2));
    doc.setTextColor(...COLOR.soft);
    doc.text('“', blockX - 0.5, startY + 0.45);

    // Set the quote
    doc.setFont('times', 'italic');
    doc.setFontSize(chosen);
    doc.setTextColor(...COLOR.ink);
    let y = startY;
    for (const line of linesChosen) {
      doc.text(line, blockX, y);
      y += lhChosen;
    }
    // Closing curly quote at end of last line, in orange, as a typographic
    // period to the page.
    doc.setFont('times', 'italic');
    doc.setFontSize(chosen);
    doc.setTextColor(...COLOR.orange);
    const lastLine = linesChosen[linesChosen.length - 1] || '';
    const lastW = doc.getTextWidth(lastLine);
    doc.text('”', blockX + Math.min(lastW + 0.05, blockW - 0.2), y - lhChosen);
  }

  /**
   * Vertical tag strip pinned to the right margin. The strip runs from the
   * upper-third of the page down toward the foot, so it acts as a true
   * editorial sidebar that anchors the right side of the entire page —
   * not just a corner ornament. Two tags max keeps the rhythm tight.
   */
  function drawVerticalTags(doc, ctx, tags) {
    const { size, margin } = ctx;
    // Truncate long tags so they don't clip off the top of the page when
    // rotated 90°. ~10 chars at 8.5pt fits in 1.4in vertically.
    const visible = tags.slice(0, 2).map(t => {
      const s = String(t || '').toUpperCase();
      return s.length > 10 ? s.slice(0, 9) + '…' : s;
    });
    if (!visible.length) return;
    const colStep = 0.30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR.ink2);
    // Baseline of the rotated text. We start lower than the rating row so
    // the strip extends the full height of the page's right gutter.
    const baseY = size.h - margin - 0.6;
    for (let i = 0; i < visible.length; i++) {
      const t = visible[i];
      const x = size.w - margin - 0.0 - i * colStep;
      // Estimate text length so each tag's top sits at a consistent height.
      // jsPDF's `text` with angle=90 anchors at (x, y) and extends UP. Tags
      // of different lengths therefore have different tops; we accept that
      // and place a single hairline tying their baselines together.
      doc.text(t, x, baseY, { angle: 90, charSpace: 0.2 });
    }
    // Hairline at the baseline ties the tags together as one element.
    const bandLeft  = size.w - margin - (visible.length - 1) * colStep - 0.18;
    const bandRight = size.w - margin + 0.05;
    doc.setDrawColor(...COLOR.sand);
    doc.setLineWidth(0.006);
    doc.line(bandLeft, baseY + 0.16, bandRight, baseY + 0.16);
    // Top rule sits up high near the dish-name area so the gutter spans the
    // page. Reads as a designed column.
    doc.line(bandLeft, margin + 1.3, bandRight, margin + 1.3);
  }

  function drawPageNumber(doc, size, margin, pageNum) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.ink3);
    doc.text(String(pageNum), size.w - margin, size.h - margin + 0.05, { align: 'right' });
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
