# Bites — Alpha Plan

**Owner:** Tinkery Bot, CEO
**Status:** OPERATIONAL
**Phase:** Validation (no payments live, no public launch)
**Goal:** Validate the product idea with **30 alpha testers in 14 days** before charging anyone.

This document is the working playbook. If a step here can't be executed, fix the document.

---

## What we're testing (the three hypotheses)

We are NOT trying to grow. We are trying to learn whether the product is worth building.

| # | Hypothesis | Validation threshold | How we measure |
|---|---|---|---|
| **H1** | People who try Bites capture ≥3 bites in their first session | **≥60% of testers** (18 of 30) reach 3+ bites in session 1 | `bite_added` event count per `installId`, filtered to first session by `sessionId` |
| **H2** | They come back within 7 days to add more (the engagement loop is real) | **≥40% of testers** (12 of 30) have ≥2 distinct sessions and `bite_added` events on day 2-7 | Distinct `sessionId` count + `bite_added` event timestamps per `installId` |
| **H3** | They say "yes, I'd pay $9.99 for the year-end cookbook" at day 14 | **≥30% of survey responders say "yes"** OR **≥10 testers (out of 30) say "yes"**, whichever is higher | Day-14 feedback email response — explicit yes/no/maybe field |

**Decision rule (day 21):**

- **All 3 pass** → ship v0.2 (Stripe + cookbook generator). Charge first user week 3.
- **2 of 3 pass** → ship v0.2 to the alpha cohort only, gather more data, decide on broader push at day 35.
- **1 of 3 passes** → the framing is wrong. Don't add features. Rewrite hero copy + landing, recruit 30 fresh testers in a different niche.
- **0 of 3 pass** → the *product* is wrong. Stop. Write a postmortem, talk to 5 testers individually, decide whether to pivot or kill.

---

## 7-day recruitment plan

**Goal:** 30 testers signed up by end of day 7.
**Channels:** 4. Each channel has an exact ask, exact message, and a target number.

### Channel A — Personal network (target: 12 testers)

The closest, highest-trust audience. These are people who'll text us back if something breaks. Recruit by direct DM (not group chat — direct).

**When:** Days 1–3.
**Where:** WhatsApp, iMessage, Signal — wherever the relationship lives.
**Ask:** 12 individual DMs, sent one at a time, personalized first line.

**Template (copy & personalize the first line):**

> Hey [name] — quick favor. I built a thing called Bites. It's a private food journal — you save dishes (not restaurants) so you can actually remember what you liked. I'm doing a 14-day alpha with 30 people. You'd get it free for life and you can shape what gets built.
>
> No signup, no app store, just open it: https://aitinkery.github.io/bites/?ref=alpha&from=dm-[name]
>
> If it sticks for a couple of days, I'd love a 5-minute "what worked / what didn't" reply at end of week 2. That's the whole ask.

**Tracking:** the `from=dm-[name]` URL param is logged in `analytics.js` as `ref:alpha|from:dm-[name]`. We'll know which DMs converted.

### Channel B — Twitter/X DMs to food-curious followers (target: 8 testers)

People who follow you for food/restaurant takes. Don't post publicly — DM. Public posting risks framing this as "launched" when it isn't.

**When:** Days 2–5.
**Where:** Twitter/X DMs (or Bluesky if that's where the relationship is).
**Ask:** 15 DMs to people who've ever liked or replied to a food post.

**Template:**

> [first line referencing a specific food thing they posted]
>
> I built a private food journal called Bites — saves dishes, not restaurants. Doing a 14-day alpha with 30 people. Free for life if you're in.
>
> https://aitinkery.github.io/bites/landing/?ref=alpha&from=tw
>
> Honest reply at day 14 is the only thing I want back. Up for it?

### Channel C — One small food/tech Discord or Slack (target: 6 testers)

Pick ONE community where you're a known member. Not a stranger drop. Do not post to /r/foodporn — saves that for the public launch.

**When:** Day 4 or 5.
**Where:** A specific server you're in. Suggested: a Bay Area food group, a builder Slack, the Stanford alum food channel.
**Ask:** ONE post in the community — not a barrage.

**Template:**

> Hey — I shipped a small thing this week. It's a private food journal (save dishes, not restaurants). I'm doing a 14-day alpha with ~30 people; if 5–6 of you want a slot, hit me up.
>
> Free for life if you're in. Honest "what worked / what didn't" at day 14 is the only ask.
>
> https://aitinkery.github.io/bites/landing/?ref=alpha&from=slack-[community-name]

### Channel D — In-person referrals (target: 4 testers)

Highest-quality data — they'll actually use it because you watched them install it.

**When:** Days 1–7, opportunistic.
**Where:** Coffee, dinner, hallway conversations.
**Ask:** "Want to see something I built? It's an alpha. Open this link, add a bite of what we just ate." Watch them do it on their phone.

**No template — it's a conversation.** But ALWAYS: get them to add at least one bite while you're standing next to them. That's the activation.

**Tracking:** use `?ref=alpha&from=irl-[name-or-event]` so we can distinguish in-person testers in the analytics.

---

## 14-day testing plan

| Day | What we ask | How we ask | Success looks like |
|---|---|---|---|
| **0** | Sign up, open the app, add 1 bite | DM with the link | They add ≥1 bite within 24h |
| **3** | Have you added more bites? Anything confusing? | Soft check-in DM (only to people who haven't added a 2nd bite by day 3) | 2nd bite added by day 5 |
| **7** | Mid-alpha pulse: 2-question DM | DM (all 30 testers): "Quick check — still using it? Anything broken?" | At least 50% reply |
| **10** | Nudge: "Try the Search tab" | DM | Users discover search (it's the long-term retention loop) |
| **14** | Day-14 survey: feedback email + cookbook willingness-to-pay | DM with link to the in-app Feedback button + analytics export | ≥20 of 30 testers reply with feedback email |
| **14** | Collect `?stats=1` JSON exports | DM each tester: "When you have a sec, open https://aitinkery.github.io/bites/?stats=1 and email me the JSON. Takes 10 seconds." | ≥20 of 30 send the export |

### Day-14 survey (the only structured data we collect)

The Feedback button is on every screen. Pre-filled `mailto:` template:

```
Subject: Bites alpha feedback

What I liked:
What confused me:
What I wish was different:
Would I pay $9.99 for a year-end cookbook (yes/no/maybe):
```

**This is the single most important data we'll collect.** The day-14 reply rate is the H3 numerator.

---

## Analytics — what we're capturing

**Decision: Option (d) from the brief — local-only event log, no network calls.**

**Why:** 30 testers we know personally. The cost of running a Cloudflare Worker + Google Sheet pipeline (ops, GDPR posture, debugging, latency) is way larger than the value of having events streamed centrally. We ASK each tester for their `?stats=1` export at day 14. pg "do things that don't scale".

**What's logged** (in localStorage, key `bites.v0.analytics`, on each tester's device):
- `pageview` — every page load (which page, when, referrer, ref flags)
- `bite_added` / `bite_updated` — with `has_photo`, `rating`, `tag_count`, `library_size` props
- `bite_searched` — debounced; logs query length only (not query content)
- `cookbook_clicked` — with `unlocked` and `alpha` flags
- `hero_dismissed` — landing hero removal (auto on first save, or manual)
- `alpha_banner_shown` / `alpha_banner_dismissed` — for the alpha welcome
- `install_banner_shown` / `install_banner_dismissed` / `install_banner_accepted` — PWA install funnel
- `feedback_clicked` — feedback button taps
- `cta_click`, `landing_to_app` — landing page → app conversion
- `ref_alpha`, `ref_share`, `ref_landing` — which entry path
- `session_end` — duration in ms (best-effort, may not fire on tab kill)

**Privacy properties** (verified in `analytics.js`):
- ❌ No IP logging (we never send to a server)
- ❌ No cookies
- ❌ No third-party trackers (no GA, no Plausible, no Umami)
- ❌ No PII (the only IDs are random UUIDs: `installId` per device, `sessionId` per tab)
- ✅ Search query *content* never logged — only length
- ✅ All events readable by the user via `?stats=1`
- ✅ User can wipe via `?stats=1` → "Reset log"

**How we collect at day 14:** DM each tester with the link, ask them to copy-paste the JSON, paste into a reply. Manual but high-signal. Ten minutes total per tester to read.

**Stretch (post-alpha, not blocking):** add a Cloudflare Worker endpoint that batches events from `BitesAnalytics.track` and appends to a Google Sheet. Single ~30-line file. Not needed for the alpha.

---

## Day-21 decision gate

**Date:** Day 21 from kickoff (= day 7 of recruitment + day 14 of testing).

**Inputs to read:**
- All 30 (target) `?stats=1` JSON exports, parsed and aggregated
- All feedback emails received via the Feedback button
- 5–10 1:1 follow-up calls (15 min each) with the most engaged testers

**Pass criteria** (all three required to ship v0.2):
- H1: ≥18 of 30 testers added ≥3 bites in their first session
- H2: ≥12 of 30 testers added bites on day 2-7 of their alpha period
- H3: ≥10 testers said "yes" to the $9.99 cookbook

**On pass:** ship Stripe + cookbook PDF generator within 7 days. Sell to the cohort first ("you said yes — here's the link, $9.99, ships today"). First paying customer goal: week 4.

**On partial pass:** see "Decision rule" at the top of this doc.

**On fail:** stop building. Run a 30-min postmortem. Read every feedback email twice. Talk to 3 testers who said "no" and 3 who said "yes". Decide: pivot framing, pivot product, or kill.

---

## Alpha tester roster (CEO fills this in)

Track each tester here as they sign up. The `installId` is the anonymous ID
in their `?stats=1` export — match it to the name when they send the export at day 14.

| # | Name | Channel | Recruited (date) | First bite (date) | Day-14 reply | Bites @ d14 | $9.99 (Y/N/M) | Notes |
|---|------|---------|------------------|-------------------|---------------|-------------|---------------|-------|
| 1 |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |
| 11 |  |  |  |  |  |  |  |  |
| 12 |  |  |  |  |  |  |  |  |
| 13 |  |  |  |  |  |  |  |  |
| 14 |  |  |  |  |  |  |  |  |
| 15 |  |  |  |  |  |  |  |  |
| 16 |  |  |  |  |  |  |  |  |
| 17 |  |  |  |  |  |  |  |  |
| 18 |  |  |  |  |  |  |  |  |
| 19 |  |  |  |  |  |  |  |  |
| 20 |  |  |  |  |  |  |  |  |
| 21 |  |  |  |  |  |  |  |  |
| 22 |  |  |  |  |  |  |  |  |
| 23 |  |  |  |  |  |  |  |  |
| 24 |  |  |  |  |  |  |  |  |
| 25 |  |  |  |  |  |  |  |  |
| 26 |  |  |  |  |  |  |  |  |
| 27 |  |  |  |  |  |  |  |  |
| 28 |  |  |  |  |  |  |  |  |
| 29 |  |  |  |  |  |  |  |  |
| 30 |  |  |  |  |  |  |  |  |

**Channel codes:** A = personal DM, B = Twitter DM, C = community post, D = in-person.

---

## Operational links

- **Live app:** https://aitinkery.github.io/bites/
- **Landing (alpha):** https://aitinkery.github.io/bites/landing/
- **Alpha entry URL:** https://aitinkery.github.io/bites/?ref=alpha&from=landing
- **Feedback inbox:** bites@aitinkery.com
- **Stats overlay (per device):** https://aitinkery.github.io/bites/?stats=1

---

## What this plan does NOT commit to

- ❌ Public Show HN / Twitter launch (that's `LAUNCH.md`, post-validation)
- ❌ Charging anyone (Stripe is test-mode, won't be live until day-21 gate passes)
- ❌ Adding features during the 14 days (the v0 is the test surface; if we change it, we contaminate the data)
- ❌ Recruiting >30 testers (we want signal, not volume)
- ❌ Network analytics (local-only by design — pg "do things that don't scale")

---

_Last updated: alpha-launch subagent, on the day this file was created._
