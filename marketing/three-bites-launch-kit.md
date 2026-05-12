# Three Bites — Social Launch Kit

Drafted 2026-05-11. Post these in your voice from your accounts. Skim, edit, publish.

---

## 1. LinkedIn post

**Best framing for LinkedIn**: thoughtful builder voice, professional credibility, hook = "I'm using AI as a co-founder." Plays to the "AI in practice" audience.

> I've been running a side project where an AI is my co-founder. It writes the code, ships the commits, manages the analytics. Today it caught me on something I should have noticed weeks ago.
>
> I'd shipped 47 commits to our app — Bites, a private food memory journal — without ever actually saving a bite myself. I'd been building the product without using it.
>
> So I sent it three photos of meals I'd eaten this week: a heart-shaped croissant sandwich from Crostini & Java in SF, butter toast with jammy eggs from Ain't Normal in Berkeley, smoked pork ribs from Everett & Jones in Oakland. We saved them into Bites together.
>
> In 40 minutes of dogfooding, the AI found:
>
> → Six concrete UX bugs I'd never have spotted from looking at the code
> → Two product ideas worth prototyping (photo EXIF auto-fill, smart tag suggestions)
> → One blind spot in our analytics that meant we had 37 sessions and zero measurable activation — not because nobody activated, but because the event was stored locally and never reached us
>
> It shipped a fix for the analytics blind spot the same afternoon.
>
> The lesson is older than software: use what you make. The product will tell you what it needs if you ask it like a user instead of like a builder.
>
> Full write-up + the actual three bites are here: bites.kitchen/blog/three-bites.html
>
> Bites itself is at bites.kitchen — no signup, no tracking, just a place to remember what you ate.

**Why this works for LinkedIn**: leads with the "AI co-founder" hook which is novel + topical, structure is professional, the bullet list is scannable, ends with a concrete CTA. LinkedIn algorithm favors longer posts with clear value structure — this is ~220 words.

---

## 2. Twitter/X thread

**Best framing for Twitter**: contrarian build-in-public, optimized for thread structure. Each tweet stands alone but pulls the reader forward.

**Tweet 1 (hook):**
> I'm building a startup where the CEO is an AI.
>
> Today it caught me on something embarrassing:
>
> I'd shipped 47 commits to our product without ever actually using it once. 🧵

**Tweet 2:**
> The product is @bites_kitchen — a private food memory journal. Save the dish, not the restaurant. No signup, no tracking.
>
> 47 commits. Three blog posts. One landing page redesign. Zero bites saved.

**Tweet 3:**
> So I sent the AI three food photos:
>
> → Heart-shaped croissant sandwich, Crostini & Java SF
> → Butter toast w/ jammy eggs, Ain't Normal Berkeley
> → Smoked pork ribs, Everett & Jones Oakland
>
> We saved them together. 40 minutes.

**Tweet 4:**
> What it found in those 40 minutes:
>
> 6 UX bugs I'd never spot from the code
> 2 product ideas worth prototyping
> 1 analytics blind spot (37 sessions, 0 measurable activation — not because nobody activated, but because the data never reached us)
>
> It shipped the fix the same day.

**Tweet 5:**
> The lesson is older than software.
>
> Use what you make.
>
> The product will tell you what it needs if you ask it like a user instead of like a builder.

**Tweet 6 (CTA):**
> Full write-up + the three bites: bites.kitchen/blog/three-bites.html
>
> Bites itself: bites.kitchen
>
> No signup, no auth, just save the dish.

**Why this works for Twitter**: hooky first line, builds curiosity, the 40-minute timestamp gives concreteness, three real bites give visual proof, ends on a quotable line. 6 tweets is the sweet spot — enough story, not enough to lose people.

**Alt version — single tweet for time-pressed posters:**

> I shipped 47 commits to my food app without ever using it.
>
> 40 minutes of dogfooding found 6 UX bugs, 2 product ideas, and an analytics blind spot that I shipped a fix for the same afternoon.
>
> Use what you make.
>
> bites.kitchen

---

## 3. Reddit post

**Subreddit: r/SideProject or r/IndieHackers**. r/IndieHackers slightly better — they reward dogfooding stories.

**Title:**
> I'm building a food memory app with an AI as my co-founder. Today it caught me having never used my own product.

**Body:**
> Short version: I'm running Bites (bites.kitchen) — a private food journal where you save the dish, not the restaurant. No signup, no tracking, vanilla HTML/CSS/JS, lives entirely in localStorage. Sells a $9.99 cookbook PDF.
>
> The unusual bit: my CEO is an AI. It writes commits, ships features, runs the analytics. We've been at it for about a week.
>
> Today it noticed something I should have noticed weeks ago. I had shipped 47 commits to the product and never once used it as a user. So I sent it three photos of food I actually ate this week and we walked through saving them as bites.
>
> In 40 minutes of dogfooding, the AI found:
>
> - Six concrete UX bugs (tag placeholder uses a Gregory-ism that means nothing to new users, dish name field truncates real menu names, no photo EXIF auto-fill, no tag suggestions, etc.)
> - Two product ideas worth shipping (auto-fill date + city from photo metadata, smart tag suggestions from a flat lookup)
> - One genuinely embarrassing blind spot in our analytics: we had 37 unique sessions over 4 days and zero measurable activation events. Not because nobody activated — because the activation event was stored in users' browsers waiting for them to tap a "Send to founder" button that nobody taps.
>
> It shipped the analytics fix the same afternoon. Tomorrow I'll know whether the 0% activation rate was real or a measurement artifact.
>
> Three real bites — the croissant, the toast, the ribs — are now in the seed data so first-time visitors see real food on first load.
>
> Full write-up here: https://bites.kitchen/blog/three-bites.html
>
> Bites is live at https://bites.kitchen if you want to try it. The hard part is convincing your future self that saving the dish is worth 30 seconds tonight.
>
> Happy to answer questions about the AI-CEO setup, the cost economics ($232 for 47 commits + the blog + the landing page + the deck so far), or the product itself.

**Why this works for Reddit**: detailed, no sales spam, transparent about cost and metrics, ends with an invitation to discuss rather than a pure CTA. Indie Hackers and r/SideProject reward this kind of openness.

---

## 4. Indie Hackers post

**Indie Hackers wants the operator's perspective**, especially around revenue, cost, and process. The audience reads carefully.

**Title:**
> 40 minutes of dogfooding found 6 UX bugs my AI co-founder hadn't seen in 47 commits

**Body:**
> Quick context: I'm running an experiment where an AI is the operator on a side project (Bites, a private food journal at bites.kitchen). It writes the code, ships the commits, manages the analytics. I'm the human in the loop for decisions, payments, and the things AIs can't do.
>
> Today it caught me having shipped 47 commits to the product without ever using it once.
>
> So I sent it three photos of meals from this week (croissant sandwich from Crostini & Java SF, jammy eggs from Ain't Normal Berkeley, BBQ ribs from Everett & Jones Oakland) and we walked through saving each one as a bite.
>
> **What the dogfood pass produced:**
>
> - 6 concrete UX bugs (e.g., the tag input placeholder reads "ramen, spicy, repeat" — but "repeat" is a tag only an existing user would invent. New users have no model for what tags should be.)
> - 2 product ideas worth shipping (auto-fill date + city from photo EXIF, smart tag suggestions from a flat lookup table — both small, high-perceived-intelligence moves)
> - 1 analytics blind spot: we had 37 unique sessions, watched the traffic graph daily, and had ZERO measurable activation events. Turns out our `bite_added` event was sitting in users' localStorage waiting for them to tap "Send to founder." Nobody taps "Send to founder."
>
> The AI shipped the analytics fix the same afternoon — a small allowlist of high-signal funnel events now pings to our central sheet immediately, with strictly sanitized props (booleans + bounded numbers only, never user content).
>
> **Cost shape so far:**
> - $232 in agent-time across 47 commits + 3 blog posts + landing page + pitch deck + this analytics fix
> - 12-day timeline
> - $9.99 cookbook PDF as the first SKU, Stripe Checkout wired in test mode
> - Domain + hosting essentially free (GitHub Pages)
>
> **The real lesson:** I had been measuring the wrong thing. Traffic is satisfying to look at because it goes up. But traffic without activation is just noise. The 40 minutes of dogfooding was the highest-leverage marketing/product work I've done all week.
>
> Full write-up: https://bites.kitchen/blog/three-bites.html
>
> Bites is live at https://bites.kitchen.
>
> Curious what other indie founders do to force the dogfood loop early. The mistake I made — building without using — feels like a default failure mode that's hard to notice from the inside.

**Why this works for IH**: leads with the metric, includes cost transparency (IH values this), ends with a question (drives comments which drives ranking). Probably the highest-conversion post of the four — IH readers will click through and explore.

---

## 5. Slack version (for your existing groups)

**The fastest version for Slack channels where you already have credibility:**

> I write code for a product called Bites — private food memory app, no signup, just a place to remember what you ate.
>
> An AI is my co-founder on it. Today it caught me having shipped 47 commits without ever using the app myself, so we saved three of my meals together and it found 6 UX bugs + an analytics blind spot in 40 minutes.
>
> Wrote it up here: https://bites.kitchen/blog/three-bites.html
>
> If you eat out a lot and want to try it, bites.kitchen — would love to know where it breaks.

**Why this works for Slack**: short, no sales tone, direct ask at the end, lets your existing credibility carry the post.

---

## Posting order I'd recommend

1. **Slack first** (tonight, 10 min). Test the framing. Friendly audience.
2. **Indie Hackers second** (tomorrow morning, peak traffic ~9am PT). Best audience for the story.
3. **LinkedIn third** (tomorrow afternoon, after IH gets some momentum). Cross-promote.
4. **Twitter/X fourth** (Wednesday morning). The thread is best when it can reference "this got X comments on IH" as social proof.
5. **Reddit (r/IndieHackers) fifth** (Wednesday afternoon or Thursday). Different audience from IH proper.

**Don't post everywhere at once.** Stagger by ~24 hours so each platform's traffic can run its course and you can compare which works best.

---

## What to track

For each post, note:

- Platform
- Posted at (time of day matters more than people admit)
- Initial engagement (likes/comments in first 30 min)
- Click-throughs to bites.kitchen (visible in our analytics dashboard via the `ref` column)
- DMs / replies received

Compare the conversion rates after a few days. The platform that gives the best activation rate (not the most clicks) is where to invest next.
