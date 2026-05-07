# BUILD-IOS.md — App Store flip runbook

**Status:** _Inactive. Activate this runbook the day Apple Developer is approved._

This is the framework for taking Bites from a vanilla PWA to a Capacitor-wrapped
iOS app on the App Store. The PWA is already designed to feel native (see
`index.html` standalone-mode CSS, splash screens, safe-area insets, haptics),
so the wrap is mostly ceremony — not a rewrite.

**Estimated effort once Apple approves:** ~1 day end-to-end (excluding the
Apple review queue itself, which is 24–72h these days).

> ⚠️ **Do NOT speculatively run the install / init commands below.** Each
> `TODO:` block needs to be confirmed against the current Capacitor docs at
> the moment we activate. Capacitor's CLI surface drifts every major release.

---

## 0. Prerequisites

- [ ] Apple Developer Program enrollment ($99/yr) — **APPROVED**
- [ ] App Store Connect account access
- [ ] App ID reserved: `com.aitinkery.bites` (matches `app/capacitor.config.json`)
- [ ] Xcode 15+ installed on a Mac (we have one — Mac mini)
- [ ] Node 18+ and npm 9+ on the build Mac
- [ ] A real iPhone for device testing (CEO has one)
- [ ] Privacy policy URL live (App Store requires one — point at the GitHub Pages
      site or a stub page; Bites stores nothing server-side, which simplifies it)

## 1. Initialize the Capacitor wrap

Working directory: `bites/app/`

```bash
cd app

# TODO: Confirm the latest Capacitor majors before running. As of this
# writing the install line looks like:
#   npm init -y
#   npm install @capacitor/core @capacitor/cli @capacitor/ios
#   npx cap init "Bites" "com.aitinkery.bites" --web-dir ".."
#
# Verify against: https://capacitorjs.com/docs/getting-started
```

After init, **delete the auto-generated `capacitor.config.ts`/`.json`** and
keep our hand-written `capacitor.config.json` (it has our brand colors,
splash plugin config, and `webDir: ".."`).

## 2. Add the iOS platform

```bash
# TODO: Confirm against current docs.
#   npx cap add ios
#
# This generates app/ios/App/App.xcodeproj.
```

After this:

```bash
# Copy the live PWA into the iOS bundle.
# TODO: confirm:
#   npx cap copy ios
#   npx cap sync ios
```

## 3. Configure the iOS project

Open `app/ios/App/App.xcworkspace` in Xcode and:

- [ ] Set **Display Name** to `Bites`
- [ ] Set **Bundle Identifier** to `com.aitinkery.bites`
- [ ] Select your **Team** (Apple Developer account) under Signing
- [ ] Set deployment target to iOS 14.0 (covers ~99% of active iPhones)
- [ ] Replace the default `AppIcon.appiconset` with `icons/apple/*` images
      via Xcode's Assets catalog (drag the matching sizes in)
- [ ] Replace `LaunchScreen.storyboard` with our cream + logo splash, or
      use the existing `icons/splash/*.png` images
- [ ] Set **Status Bar Style** to Default (matches our
      `apple-mobile-web-app-status-bar-style`)
- [ ] In `Info.plist`, add:
  - [ ] `NSCameraUsageDescription` — _"Bites uses the camera to capture photos
        of your meals so you can remember them later."_
  - [ ] `NSPhotoLibraryUsageDescription` — _"Bites lets you pick existing
        photos to add to your food journal."_
  - [ ] `UISupportedInterfaceOrientations` — Portrait only (matches manifest)

## 4. Wire the Capacitor camera plugin (later, optional)

The PWA already uses `<input type="file" capture="environment">`, which works
inside a Capacitor WebView too. **Don't add `@capacitor/camera` on day one** —
ship the wrap with the existing flow first, then upgrade in v1.1 if the
file-input experience feels off-native.

## 5. Test on device

```bash
# TODO: confirm:
#   npx cap open ios
# Then in Xcode: Product → Run, with the iPhone selected as the target.
```

Test checklist on real iPhone:

- [ ] App launches with our splash, not the default Capacitor one
- [ ] Status bar tint matches the cream theme
- [ ] Notch / Dynamic Island doesn't overlap content (safe-area insets
      already wired in CSS)
- [ ] Home indicator doesn't overlap the FAB
- [ ] Camera capture works (FAB → photo)
- [ ] Photo persists after force-quit (localStorage survives)
- [ ] Pull-to-refresh works on home grid
- [ ] Double-tap on Bites tab scrolls to top
- [ ] No "Address bar" hint banner appears (we already gate it on
      `display-mode: standalone`)

## 6. App Store Connect

- [ ] Create the app record in App Store Connect
- [ ] Bundle ID: `com.aitinkery.bites`
- [ ] Pricing: Free (with in-app purchase for the cookbook? Or external Stripe?
      — note: external payment outside Apple IAP is **only** allowed for
      "reader" apps and a few categories. For Bites, the cookbook PDF likely
      needs to flip to IAP for App Store review. Decide before submission.)
- [ ] Screenshots: required for 6.7" (Pro Max) and 6.1" (standard) — generate
      from real device + simulator
- [ ] App description, keywords, support URL, privacy policy URL
- [ ] App Privacy questionnaire — Bites collects nothing server-side; the
      cookbook email goes via `mailto:` (user's own mail client). Easy form.
- [ ] Age rating: 4+

## 7. Build & submit

```bash
# In Xcode: Product → Archive → Distribute App → App Store Connect → Upload
```

After upload:

- [ ] In App Store Connect, attach the build to the app version
- [ ] Submit for review
- [ ] Expected review time: 24–72h
- [ ] If rejected, the most likely reasons (and our defenses) are:
  - _"App is just a website wrapper"_ → emphasize offline mode (sw.js),
    haptics, safe-area handling, native splash, and the structured
    food-journal data model in the response.
  - _"External payment for digital goods"_ → flip the cookbook to IAP
    (already noted above) before submitting.
  - _"Insufficient functionality"_ → unlikely; we have search, stats,
    photo capture, export/import.

## 8. Post-launch

- [ ] Tag the release (`git tag v1.0-app-store`)
- [ ] Update `manifest.json` `start_url` if the App Store version diverges
      from the web version
- [ ] Decide cadence for syncing web ↔ app (probably: web ships continuously,
      app ships every ~2 weeks bundling web changes)

---

## What we DON'T do today

- ❌ Do not run `npm install` in `app/` until Apple Developer is approved
- ❌ Do not commit `app/node_modules/` or `app/ios/Pods/`
- ❌ Do not change `webDir` away from `..` (the root PWA is the source of truth)
- ❌ Do not duplicate JS/CSS into `app/` — the WebView loads the same files

---

_When this runbook gets executed, leave a "✅ done <date>" stamp at each
checkbox so future-you knows what was confirmed against current docs._
