# Bites — Revenue Roadmap

**Owner:** Tinkery Bot, CEO
**Updated:** 2026-05-07

## North star

First paying customer within 14 days.

Every decision below serves that. Anything that doesn't is parked.

## v0 — SHIPPED ✅
- Live at https://bites.kitchen/
- Vanilla web app, localStorage, mobile-first PWA
- Capture, browse, search, edit, export
- 7 seed bites for first-run

## v0.1 — Make it monetizable (this week)
- Desktop polish + cross-viewport audit
- Share-card metadata (`og:image`, twitter card) so iMessage/Slack previews are credible
- Landing-page hero for stranger-arrivals (no localStorage = first visit)
- **"Bites Cookbook" pre-order stub** — email capture in Stats tab
- Goal: 30 reserved emails before any code is written for the actual cookbook

## v0.2 — Sell the cookbook (next week)
- Build the actual cookbook PDF generator (jsPDF or server-side via Cloudflare Worker)
- Stripe Checkout integration — single-item, $9.99
- Send the PDF + receipt automatically via email (Resend or SendGrid)
- **First paying customer goal: end of week 2**

## v0.3 — Cloud sync + Bites Pro ($4.99/mo)
- Auth: Magic Link (no passwords) via Supabase or self-hosted
- Cross-device sync of bites + photos
- Conversion trigger: user has ≥30 bites AND opens on a second device
- Goal: 5% of cookbook buyers convert to Pro

## v0.4 — AI features in Pro
- Visual dish identification on photo capture (Claude vision)
- "What do I usually order at X?" semantic search over personal history
- "Trip mode" — group bites by city + date range
- Goal: Pro retention >60% at 30 days

## v0.5 — Bites Circle ($9.99/mo per host)
- Group dish wishlists
- "Where should we go" group recommender
- Goal: First Circle host on board within month 3

## Channels — How money finds the app

### Free / organic
- ✅ Share-card metadata (so when users send the link, it looks legit)
- 🔨 Twitter/X "I built this in 2 days" thread on launch
- 🔨 Show HN post (Tuesday 9am ET sweet spot)
- 🔨 Posting in r/foodporn / r/AskCulinary with "I built a food journal"
- 🔨 Find 3 mid-tier food bloggers with newsletters; offer Pro free in exchange for a writeup

### Paid (defer until $1k MRR)
- App Store Search Ads — $5/day test on "food journal" keyword
- Twitter/X promoted post on launch thread

### Word of mouth (the only one that compounds)
- Every shared link should preview beautifully — DONE in v0.1
- Every cookbook PDF should have "Made with Bites — try it at bites.app" footer
- Saved drawer "Email me this list" should default-include "Made with Bites" sig

## Money clock

| Week | Goal | Trigger |
|---|---|---|
| 1 (now) | v0.1 deployed; 30 cookbook pre-orders | Share metadata + hero + paywall stub live |
| 2 | First paying customer | Stripe + cookbook generator live |
| 4 | $100 MRR proof of concept | 10+ cookbook sales OR 1 Pro convert |
| 8 | $1k MRR | Cloud sync + Pro tier launched |
| 12 | $5k MRR | Circle features for first hosts |
| 26 | $10k MRR | First hire is signal of PMF |

## What I'm NOT doing

- ❌ Raising money (revenue is faster)
- ❌ App Store launch before web PWA is proven
- ❌ "Influencer marketing" (paid promo) before organic distribution works
- ❌ Restaurant partnerships (different product, killed by Beli)
- ❌ Anything the user has to learn before getting value

## Risks I'm watching

| Risk | Trigger | Mitigation |
|---|---|---|
| Pre-order with no follow-through | Cookbook PDF not shippable in 7 days | Refund + delay; don't charge until ready |
| GitHub Pages outage / cold start | Pages goes down on launch | Have Cloudflare Pages mirror ready |
| Yelp/Beli copies | Public if/when seen on HN | Unique data shape (dishes not restaurants) is structural moat |
| User keeps app private | Network effects don't materialize | Bites Circle (paid group features) bypasses need for public sharing |

## What I commit to as CEO

- Ship every commit reviewed against the framework files
- Don't add features that don't serve the revenue clock
- Tell Gregory the truth about progress, including stalls
- Charge first user within 14 days or surface a real blocker
