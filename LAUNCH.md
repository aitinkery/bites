# Bites — Launch Plan

**Owner:** Tinkery Bot, CEO
**Target launch window:** Within 7 days of v0.1 ship

## Pre-flight checklist (don't launch without these)

- [ ] v0.1 deployed with share-card metadata
- [ ] og:image renders in Twitter Card Validator + iMessage preview
- [ ] Reservation flow tested end-to-end on iPhone Safari and Mac Chrome
- [ ] At least 5 of Gregory's friends pre-tested it and added 3+ bites each
- [ ] Cookbook pre-order endpoint working (mailto: confirmed receiving)
- [ ] One Stanford-affiliated reviewer pre-quoted (for credibility hook)
- [ ] At least 2 polished example bites in seed-data with real food photos (not generic placeholder)

## Channel 1: Show HN (Tuesday 9am ET)

**Title:** `Show HN: Bites – A personal food memory app (not Yelp)`

**Body:**
```
Hi HN. I built Bites because Yelp tells me what 4,000 strangers think
of a restaurant, but nothing tells me what *I* thought of a place 8
months ago.

It's a private journal where you save dishes (not restaurants), with
photo + rating + notes. Search by restaurant later: "what did I have
at Tatsu Ramen?" Answer in 2 seconds. No account required, no ads,
no AI gimmicks (yet).

It's a vanilla HTML/JS PWA — works offline, "Add to Home Screen"
on iOS, all data stays in your browser. No backend.

Coming next: optional cloud sync ($4.99/mo) for multi-device, and
a printable Cookbook PDF of your year (one-time $9.99 — pre-orders
open today).

What I want from HN: I'd love feedback on (1) is the "personal not
social" framing legible, and (2) what would make you actually use
this past day 1?

https://aitinkery.github.io/bites/

— [me]
```

**Why this works:**
- Specific complaint hook ("Yelp tells me what strangers think")
- Builder transparency (vanilla stack, no backend)
- Honest about what's missing (no AI yet, hosted on GitHub Pages)
- Specific ask in last paragraph (HN loves being asked the right question)
- Pricing transparent up front
- No emoji, no breathless adjectives — HN will downvote those instantly

**Don't post if:**
- The og:image isn't perfect (HN screenshots get scrutinized)
- Less than 7 working sample bites in the seed
- Mobile breaks at 375px

## Channel 2: Twitter thread

```
1/  I built Bites — a personal food journal that
    remembers what *you* thought of every meal.

    Yelp = strangers' opinions. The Infatuation = critics.
    Bites = your own private memory.

    Live now: https://aitinkery.github.io/bites/

2/  The killer query: "what did I think of that ramen
    place 8 months ago?"

    Currently solved by digging through 8,000 untagged
    camera roll photos.

    Bites makes it 2 seconds.

3/  Built with vanilla HTML/JS. No backend. No frameworks.
    No tracking. No accounts.

    Your data stays in your browser. PWA — add to home
    screen on iPhone, works offline.

    Inspired by Day One but for food, by 8 years of
    "remember that pasta?" texts to my partner.

4/  Coming next:
    - Cloud sync + multi-device → Pro tier
    - Visual dish ID from a photo
    - Group features for "where should we go" trips
    - Printable Cookbook PDF of your year

    Pre-orders for the Cookbook are open today.

5/  No reviews. No ratings to game. No "best ramen in
    SF" leaderboard. Just what *you* thought.

    Anti-network-effects, on purpose.
    Personal memory > popularity contest.

    bites.app (link from above)
```

**Posting time:** Tuesday-Thursday, 10am-2pm PT (when food Twitter is awake).
**Don't post:** Weekends (food Twitter is logged off).

## Channel 3: Niche subreddits

**r/foodporn** — "Built a private food journal because I kept losing track of which restaurants I liked. Photo grid included." [link]

**r/AskCulinary** — "Built a tool for tracking my own dish ratings, not restaurant ratings. Useful for anyone who eats out a lot. Free, no signup."

**r/iOSProgramming** — "Shipped a vanilla HTML/JS PWA to App-Store-quality polish. Lessons learned." (Lessons learned framing avoids ad accusations.)

**Don't post:** r/programming, r/webdev, r/javascript — wrong audience, will get nuked for self-promo.

## Channel 4: Founder/builder reach-outs (within 30 days)

- 🎯 **Joel Califa** (food tech designer, Twitter: @notdetails) — DM with the launch link, ask if he'd take a look. He's posted about food UX several times.
- 🎯 **Patrick Collison** — Stanford alum, food obsessive, would appreciate a Stanford-built passion project.
- 🎯 **Casey Newton** (Platformer newsletter) — has done "small apps that I love" coverage.
- 🎯 **Ben Sandofsky** (Halide camera app) — would understand the camera-first thesis.

Keep the ask small: "Would love your eyes on this, no expectation."

## Anti-channels (do not waste time on)

- ❌ Product Hunt — race to the bottom, full of bots, won't drive actual users
- ❌ Reddit r/SideProject — community is mostly other builders, not customers
- ❌ Hacker Noon, Medium reposts — paid amplification with weak conversion
- ❌ TikTok — wrong founder for that medium, requires constant feed
- ❌ "Cold email to journalists" mass blast — burns goodwill

## Metrics to watch (first 14 days)

| Day | Target | Real |
|---|---|---|
| 1 | 50 unique visitors | TBD |
| 1 | 5 bites added in localStorage (we can't see, ask testers) | TBD |
| 3 | 100 unique visitors | TBD |
| 3 | 5 cookbook reservations | TBD |
| 7 | 500 unique visitors | TBD |
| 7 | 30 cookbook reservations | TBD |
| 14 | 30 active users adding 1+ bite/week | TBD |
| 14 | First paid customer (when v0.2 is shipped) | TBD |

## What success looks like for the launch

- Show HN: top 30 of the day, ≥30 comments
- 500 visitors first day
- 30 cookbook reservations (15% conversion of intent → email)
- 5 follow-up emails from real people (not bots) saying "I want this"
- One reply from a name I recognize (industry validation)

## What failure looks like

- Show HN: dies on page 2, <50 visitors
- 5 cookbook reservations
- 0 follow-up emails

If failure: the product is not the problem; the framing is. Iterate the
hero copy, retry in 2 weeks with sharper positioning. Don't add features.
