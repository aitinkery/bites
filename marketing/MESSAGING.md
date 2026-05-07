# Bites — Alpha Messaging Templates

**Version:** v0.1
**Owner:** Tinkery Bot, CEO
**Status:** Pre-launch, recruiting alpha cohort

---

## Voice & tone (consistent across all channels)

- **Personal, warm, slightly indulgent.** Not clinical. Not bro-y. Not influencer-y.
- **Specific over generic.** "the ramen place last winter" beats "great restaurants nearby."
- **Honest about the stage.** "Alpha. Some things are rough. Your feedback shapes it."
- **Anti-corporate.** No "transformative experience" / "revolutionizing" / "the future of." Skip the marketing voice.
- **One ask per message.** Never a feature dump.

---

## Channel 1 — Personal text/DM to friends and family (10 testers)

Hand-typed per recipient. Not copy-paste. The person matters.

**Template, ~3 sentences max:**

```
Hey [name] — built a thing this week and you're one of the few
people I want trying it before anyone else.

It's called Bites. Save dishes (not restaurants), search them
later. Solves my "what was that pasta place last winter" problem.

10 minutes? I'll fix anything that breaks.

→ bites.kitchen/?ref=alpha&t=[their-initials]
```

**Why it works:**
- Names them ("you're one of the few") — personal stake
- "10 minutes" sets a small ask
- "I'll fix anything that breaks" promises responsiveness without overpromising
- The `?t=` URL parameter lets us track WHO clicked from WHERE (unique tracking per recipient)

**Don't say:**
- "Game-changing"
- "Disrupting"
- "Built with AI"
- "Looking for feedback" (vague — they'll ignore)

---

## Channel 2 — Stanford-adjacent food enthusiasts (~10 testers)

Slightly more formal. Use the AI Tinkery network if it has any food-curious folks.

**Template:**

```
Subject: A small food-memory app, looking for early users

Hi [name],

Quick one. I've been building a private food journal — not a Yelp
replacement, but a "what did I think of that ramen place last
winter" app. Save dishes (not restaurants), search later. Camera-
first. Works offline. No account.

I'm in alpha — looking for ~30 testers in week one. Free for life
if you're in.

10-minute first session is enough to know if it's for you. Would
love your read on it.

→ bites.kitchen/?ref=alpha&from=stanford

— [signature]
```

**Why it works:**
- "Not a Yelp replacement" preempts the obvious wrong-frame
- "10-minute first session" matches Dirksen's motivation framing
- "Free for life" is the specific reciprocal value
- Personal email, not a mailshot — sent one at a time

---

## Channel 3 — Slack/Discord communities you're already in

ONE post per community. Be present in the community first; don't drop and run.

**Template (food / cooking community):**

```
Built a private food memory app — saving dishes (not restaurants),
searching them later. The "what was that ramen place last winter"
problem.

In alpha, looking for ~30 testers. No account needed, works on the
phone, free forever for testers. 10-minute first try.

Honest feedback welcome (and expected).

→ bites.kitchen/?ref=alpha&from=[community-tag]
```

**Don't post in:**
- Tech-only communities (wrong audience for first signal)
- Communities you're not active in (gets flagged as spam, deserved)
- Communities with "no self-promo" rules unless you have permission

---

## Channel 4 — Public alpha (after day 7, only if 1-3 hit ≥20 testers)

Show HN and Twitter. ONLY after we have ≥20 alpha testers from channels 1-3 to validate the messaging works on people we know.

### Show HN draft

**Title:** `Show HN: Bites – A private food memory app, not a Yelp replacement`

**Body:**

```
Hi HN.

Built this in 10 days. It's a private food journal — save dishes
(not restaurants), photo-first, no account, works offline. The
killer query is "what was that ramen place last winter" — currently
solved by digging through 8000 untagged camera roll photos.

It's vanilla HTML/JS hosted on GitHub Pages. PWA — add to home
screen on iPhone. Service worker handles offline. localStorage for
your data. No backend yet (cloud sync ships in v0.3).

In alpha. ~25 testers right now. Free forever for testers. Coming
soon: a printable cookbook PDF of your year ($9.99 one-time, but
not selling yet).

Two questions for HN:

1. Is the "personal not social" framing legible — or does it come
   off as "Yelp without ratings"?
2. What would make you actually use this past day 1?

→ bites.kitchen/

— [name]
```

**Posting rules:**
- Tuesday-Thursday, 9am-11am ET
- DO NOT post on weekends (HN traffic dies)
- DO NOT post until alpha cohort is ≥20 (need real users for credibility)
- DO NOT delete or repost if it dies (looks desperate; HN will notice)

### Twitter thread

```
1/  Built Bites in 10 days — a private food journal that
    remembers what *you* thought of every meal.

    Yelp = strangers' opinions.
    Bites = your private memory.

    bites.kitchen/

2/  The killer query: "what did I think of that ramen place
    last winter?"

    Currently solved by digging through 8000 untagged camera
    roll photos.

    Bites makes it 2 seconds.

3/  Vanilla HTML/JS. No backend. No tracking. No accounts.

    Your data stays in your browser. PWA — add to home screen
    on iPhone. Works offline.

    Inspired by Day One but for food.

4/  In alpha. ~25 testers. Free forever for testers.

    Coming soon: cloud sync, AI features ("what do I usually
    order at Italian places?"), and a printable cookbook PDF
    of your year.

5/  No reviews. No ratings to game. No "best ramen in SF"
    leaderboard. Just what *you* thought.

    Anti-network-effects, on purpose.

    Personal memory > popularity contest.
```

**Don't post:**
- Without a polished og-image (current is B+, may be insufficient)
- Without the alpha cohort already in
- Multiple times per day (looks desperate)
- With trending hashtags shoehorned in

---

## Channel 5 — 4 named contacts (warm outreach, not cold)

Specific people I (CEO) think will love this. ONE message per person, ~3-4 sentences. Not a list email.

**Targets (pre-vetted):**

1. **Joel Califa** (food tech designer, Twitter @notdetails) — has posted about food UX; would understand the camera-first thesis
2. **Patrick Collison** (Stripe founder, Stanford alum, food obsessive) — appreciates Stanford-built indie projects
3. **Casey Newton** (Platformer newsletter) — has covered "small apps that I love" before
4. **Ben Sandofsky** (Halide camera app) — would understand the camera-first technical thesis

**Template (Joel example):**

```
Hi Joel,

I've been chasing the "remember the dish, not the restaurant"
problem for years and finally built it. Bites — a private food
journal where the unit is the dish, not the place.

You've posted about food UX a few times — I'd love your eyes on
the capture flow specifically. No expectation; if it's not your
thing, totally fine.

→ bites.kitchen/?ref=joel

— [name]
```

**Don't:**
- BCC them on a mass email (career-ending move)
- Ask for a tweet, share, or signal-boost in the first message
- Overstate engagement ("I built this WITH AI" — frame is wrong)

---

## What we DON'T send

- ❌ Press releases (premature)
- ❌ Newsletter announcements to a list (we don't have one yet)
- ❌ Cold email to journalists (burns goodwill, wrong stage)
- ❌ Product Hunt (race to the bottom, wrong audience)
- ❌ Reddit r/SideProject (community is mostly other builders)
- ❌ "Following up" emails when someone doesn't reply

---

## URL parameters per channel (for tracking without trackers)

Every link we send carries a `?ref=` flag we can read in localStorage analytics:

| Channel | URL |
|---|---|
| Friend DMs | `?ref=alpha&t=[initials]` |
| Stanford / Tinkery | `?ref=alpha&from=stanford` |
| Slack/Discord | `?ref=alpha&from=[community-name]` |
| Show HN | `?ref=hn` |
| Twitter | `?ref=twitter` |
| Named outreach | `?ref=alpha&t=[firstname]` |
| Cookbook share footer (later) | `?ref=share` |

The analytics layer (when shipped) reads these and groups conversion by channel.

---

## Reply etiquette (when testers respond)

When a tester sends feedback:
- **Reply within 24 hours** for the first 30 testers. No exceptions.
- **Thank them by name.** Not "thanks for the feedback" generic.
- **Quote their specific words back** ("you said the photo capture felt slow on iOS — that's the third report I've had, fixing it tonight").
- **Tell them what you're going to do** — even if it's "not changing anything because [specific reason]." Honesty builds trust faster than agreement.
- **Send a follow-up at day 14:** "still using it? what changed?" The honest answer matters more than a polite no.
