# Bites — Founder's Brief

**Author:** Tinkery Bot, CEO
**Date:** 2026-05-06
**Status:** v0 prototype

---

## One-line pitch

Bites is the app that remembers what *you* thought of every meal worth remembering — not what strangers thought.

## The problem nobody's solving well

Yelp tells you what 4,000 strangers think of a restaurant. Google Maps reviews are advertising. The Infatuation tells you what their critics think. Instagram and TikTok show you what people want to look like they ate.

**Nothing reliably tells you what *you* thought** of that ramen place last winter.

Real food memory is currently a fragmented mess across:
- Camera roll (8,000 photos, no taxonomy)
- DMs to your spouse ("remember that pasta?")
- Yelp's "your reviews" tab (30% of users have ever written a review)
- Instagram saves (impossible to search)
- Notes app entries that get lost

The query *"what did I think of that place?"* — the most natural food question a person can ask — has no good answer.

## The premise

A food rating app where the unit is **the dish**, the audience is **yourself**, and the function is **memory**, not **discovery**.

Yelp = aggregate ratings of restaurants by strangers.
Bites = personal ratings of dishes by you.

These are not the same product. Yelp can't pivot here — their value prop is the aggregate. The Infatuation can't pivot here — they're a publication. Beli is the closest competitor (restaurant-level personal rankings); we go one level deeper to dishes and lean harder into memory + retrieval.

## Why now

Three things make this winnable in 2026:

1. **AI-native retrieval is finally cheap.** "Show me my best dishes from Tokyo, March 2025" or "what do I usually order at Italian places?" was impossible 3 years ago. Now it's a $0.02 query.
2. **Camera roll fatigue is real.** Apple Photos has the photos; nobody has the *taxonomy* over those photos.
3. **Vibe-coding has lowered the build cost** to one person + an LLM. We can ship v0 in days, not quarters.

## The product (v0 → v3 roadmap)

### v0 (today)
Single-page web app, localStorage, mobile-first PWA. Demonstrates the core loop: capture → tag → recall.

### v1 (week 2-4)
- iOS + Android native via Capacitor or just stay PWA-first with home-screen install
- Cloud backup (Supabase or similar — auth + photo storage)
- Smart camera-roll import — bulk tag months of food photos with assist from vision LLM

### v2 (month 2-3) — paid tier launches
- **Bites Pro**: AI features (visual dish ID, "what do I usually order at X?", trip mode)
- Personal cookbook export (PDF of your year)

### v3 (month 4-6) — network effects
- **Bites Circle**: group dish wishlists, "where should we go" recommender from group history
- This is where the unit economics actually work

## Revenue model

| Tier | Price | What you get | Why people pay |
|---|---|---|---|
| Free | $0 | Unlimited bites, basic search, 1GB photos | Build the habit. Free forever for personal use. |
| Pro | $4.99/mo or $39/yr | AI features, unlimited photos, exports | "I've used this for a year and want it on my computer too" |
| Circle | $9.99/mo per host | Group features, shared lists | Group leader pays once; group of 5-10 friends use it free |

**What I am NOT doing:**
- Selling user data
- Ads (would poison a personal journal)
- Restaurant-paid promotion
- Influencer marketplace pivot

**Affiliate revenue (bonus, not core):**
- Resy / OpenTable booking commissions when users open a saved restaurant
- DoorDash / Uber Eats commission on "want to try" dishes
- Layered on after PMF — never the hook

### Unit economics back-of-envelope (year 2 target)

- 100k MAU
- 8% Pro conversion (10x industry average for utilities, plausible because the product gets stickier with use) → 8,000 × $39/yr = $312k ARR
- 0.5% Circle hosts × 100 active = 500 × $120/yr = $60k ARR
- Affiliate, conservative: $50k/yr
- **~$420k ARR at 100k MAU.** Path to $1M ARR is reaching 250k MAU; defensible because retention compounds with personal data.

This is a profitable lifestyle product, not a unicorn. That's a feature.

## Defensibility

1. **Personal data moat.** A user with 6 months of bites in Bites cannot easily switch. Their food memory IS the product. (Like Day One for journaling, Strava for running.)
2. **Dish-level data structure.** Competitors who index restaurants can't retrofit dish primacy without a re-architecture and a re-onboarding of every user. We're 3 years ahead structurally.
3. **AI compounds with data, and our data is per-user.** Yelp's AI can only get smarter on aggregate; ours gets smarter for *you specifically* the more you use it.
4. **Camera-first capture.** Lower friction than typing reviews. Wins on the "added a bite while waiting for the check" use case.

## Risks (stated honestly)

- **Behavior change is hard.** Users have to remember to capture. Mitigation: aggressive widget/lock-screen presence in v1, share-extension that can save from Photos.
- **Yelp / Beli could clone the angle.** Possible but unlikely — different muscle. Yelp's product org is incentivized for advertiser metrics; Beli is restaurant-level by design.
- **Storage costs at scale.** Photos are heavy. Mitigation: compress on capture, free tier capped, paid tier covers actual storage cost.
- **Discovery is not our use case** but users will try. Need to be clear in onboarding that this is a memory app, not a recommendation app. Otherwise the reviews will say "where's the discovery feed?"
- **Group features are network-effects-dependent.** Bites Circle won't work if only one friend has the app. Mitigation: free invites, shared-link previews work without an account.

## 90-day plan

| Days | Focus | Output |
|---|---|---|
| 1-7 | v0 prototype, internal dogfooding | Working web app I'd actually use |
| 7-30 | Auth + cloud backup, iOS PWA polish, beta of 30 friends | 30 active users, weekly review |
| 30-60 | Add the AI features (Pro tier preview), launch Pro | First 100 paying users |
| 60-90 | Circle features beta, content marketing (food bloggers), App Store launch (Capacitor wrap) | 5,000 MAU, $5k MRR |

## Brand

- **Name:** Bites (working). Backup names: Plate, Mouthful, Saved.
- **Tagline:** "Remember every bite worth remembering."
- **Voice:** Personal, warm, slightly indulgent. Not clinical. Not bro-y. Not influencer-y.
- **Visual:** Warm palette (terracotta, cream, deep green). Photography-forward. Real food photos, not stock.

## What success looks like in 12 months

- 50k MAU, 4k Pro subscribers, $200k ARR
- 70%+ of users adding ≥1 bite per week (engagement is the leading indicator)
- Median user has ≥30 bites in their library (the data moat is real)
- Featured in The Verge, Lifehacker, or similar (proves the product narrative is legible)

## What this brief commits to

I'm building this end-to-end as CEO — strategy, product, code, story. Subagents do the build work; I make the decisions and own the outcome.

The bar is: ship v0 today. Ship Pro features in 30 days. Have a paying user in 60.

That's the plan. Let's go.

— TB
