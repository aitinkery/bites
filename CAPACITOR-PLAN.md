# Capacitor / App Store Plan

**Owner:** Tinkery Bot, CEO
**Status:** PWA today; Capacitor wrap on trigger
**Updated:** 2026-05-07

## Current state

- ✅ Live as PWA at https://bites.kitchen/
- ✅ "Add to Home Screen" works on iOS + Android
- ✅ Fully offline-capable (service worker)
- ✅ Stripe Checkout wired in test mode
- ⏳ "Native polish" pass in progress (custom install banner, splash screens, haptics, etc.)

## When to flip from PWA → Capacitor

Stay on PWA until ANY of these triggers fires:

1. **First 5 paying customers complete cookbook purchases.** Product-market signal real; investing in distribution warranted.
2. **50+ users adding bites weekly** — push notifications start mattering for engagement loops.
3. **Multiple users report camera UX friction** in PWA Safari mode — native camera APIs become the unlock.
4. **Show HN or major launch post drives 500+ daily visitors** — credibility of App Store listing converts more.

If none of these hit in 4 weeks, Capacitor is premature.

## What Capacitor unlocks (vs PWA)

| Capability | PWA | Capacitor wrap |
|---|---|---|
| App Store / Play Store listing | ❌ | ✅ |
| Real iOS share extension ("Save photo to Bites") | ❌ | ✅ |
| Push notifications (reliable on iOS) | ❌ | ✅ |
| Native camera APIs (filters, framing, EXIF) | Limited | ✅ |
| Background sync | ❌ | ✅ |
| Native haptics | Vibration API only | ✅ |
| Trust signal for new users | Mixed | High |
| Cost | $0 | $99/yr Apple Developer |
| Time to ship | Hours | ~1 week from approved Apple account |

## Pre-trigger work (already done or in flight)

These ensure the Capacitor flip is ~1 day, not a week:

- ✅ Single-page web app with no build step (Capacitor wraps cleanly)
- ✅ Service worker handles offline correctly (Capacitor needs this anyway)
- ✅ All assets relative-pathed (`./` not `/`)
- ✅ No external CDN dependencies (Capacitor offline mode would break)
- 🔨 Native-feeling iOS standalone CSS (in flight, polish subagent)
- 🔨 Custom install banner (in flight)
- 🔨 Splash screens at iOS resolutions (in flight)
- 📁 `app/` directory scaffold for Capacitor config (in flight)
- 📁 `BUILD-IOS.md` runbook (in flight)

## Pre-trigger work CEO/founder owns

### 1. Apple Developer enrollment ($99/yr) — **DO THIS WEEK**
- URL: https://developer.apple.com/programs/enroll/
- Use email: `bites@aitinkery.com`
- Use legal entity matching Stripe (whatever that ends up being)
- Individual vs Organization: start Individual unless you have an LLC/Inc; can transfer later
- **Lead time: 2-7 business days** — bottleneck is Apple's review, not our code
- Don't wait for a trigger; start the enrollment now so when we trigger the flip, the account is ready

### 2. App Store Connect setup
- After Apple Developer is approved: log into appstoreconnect.apple.com
- Create the "Bites" app listing (placeholder fine; can edit before submission)
- Reserve the app name "Bites" — others might claim it if we wait

### 3. App Store assets prep
Need before submission, can prep in parallel:
- App icon (1024×1024) — already have via existing icon set, just resize
- 6.7" screenshots (iPhone 15 Pro Max, 1290×2796) × at least 3
- 6.1" screenshots (1170×2532) × at least 3
- App description, keywords, what's new text
- Privacy policy URL (Bites doesn't track, but Apple still needs the URL)
- Support URL

I'll generate these when the trigger fires.

## When trigger fires — the 1-day flip

Day 1 (focused work session):
1. `npm install @capacitor/core @capacitor/cli @capacitor/ios` in `app/`
2. `npx cap init "Bites" "ai.aitinkery.bites" --web-dir=../` (or copy index.html in)
3. `npx cap add ios`
4. Configure `Info.plist` for camera access, photo library access (with usage descriptions)
5. Add Capacitor Camera plugin if we want native camera shots; otherwise the existing PWA camera works fine
6. Set up app icon + splash screens via `cordova-res` or manually
7. Open the Xcode project, build to a real device, smoke-test
8. Generate App Store screenshots from the build
9. Upload via Xcode → App Store Connect
10. Submit for review

Day 2-7: Apple review (typically 24-48h, sometimes longer).

Day 8: Live on App Store (if approved).

## What I'm NOT doing

- Native rewrite (SwiftUI, React Native, Flutter) — overkill, months of work, no advantage at our stage
- Android Play Store first — iOS audience is the food-app demographic; Android is week-2
- Dual platform launch — sequence: iOS first (revenue + signal), Android after PMF

## Cost projection

| Item | Cost |
|---|---|
| Apple Developer | $99/yr |
| App Store Connect | $0 (included) |
| App Store Search Ads (optional) | $0 to start |
| Capacitor open-source plugins | $0 |
| Total annual | $99 |

Apple takes 30% of in-app purchases — but we're using Stripe Checkout for the cookbook, which happens *outside* the app per Apple's recent guideline relaxation (Reader app exception + the *Epic v Apple* fallout). Need to verify when the trigger fires.

If Apple insists on in-app purchase: 30% on $9.99 = $3 cut. Cookbook becomes $9.99 → $7 net. Still profitable.

## Risks

| Risk | Mitigation |
|---|---|
| App Store rejection (food rating apps are common) | Differentiate via privacy + personal-memory framing; nothing controversial |
| Apple takes 30% of cookbook revenue | Use external Stripe link if allowed; else absorb the cost |
| Capacitor wrap feels janky | Polish work this week makes the PWA already 90% native-feeling |
| Apple Developer enrollment takes too long | Start NOW, before the trigger fires |
