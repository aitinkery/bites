# Dogfooding Notes — First Real Bite

## What I did

Took Gregory's photo + text description of "The Ultimate" (heart-shaped croissant sandwich, Crostini & Java, SF) and walked through what saving it as a bite would actually feel like, step by step. Then added it as `bite-seed-008` in `seed-data.json` so first-time visitors clicking "Load samples" see a real recently-eaten dish alongside the generic seeds.

## Friction I'd hit if I were the user (in order of severity)

### 🔴 Tag input is unclear

The form has `tags` placeholder text reading `ramen, spicy, repeat`. Three issues:
1. "repeat" as an example tag is **a Gregory-ism** — the user has no idea what it means. Are tags moods? Categories? Ingredient lists?
2. No tag suggestions / autocomplete. The user has to invent their own vocabulary cold.
3. No indication of what tag delimiter the parser actually accepts (comma? space? both?). For my bite I'd guess `breakfast, sandwich, croissant`. But "comma OR space" should be told.

**Fix**: change placeholder to something like `breakfast, sandwich, worth it`. Drop "repeat" — only repeat users invent that tag. Add a small hint: *"separate with commas or spaces"*.

### 🟡 Photo upload behavior on desktop is ambiguous

`<input type="file" capture="environment">` works on mobile (opens camera). On desktop, `capture=environment` is ignored and you get a file picker. The placeholder text says "Tap to use camera or choose a photo" — but on desktop you can't tap with a finger and there's no camera option for most users. Fine, but the copy assumes mobile.

**Fix**: minor — the copy is fine because the alpha is mobile-first. Just a note.

### 🟡 No price detection from photo

I had to guess "$14" for the price field. The app doesn't help me figure out what it cost — there's no OCR on receipts, no "ask later" option, no fuzzy bucket pre-selected. The segmented price control is binary: pick a bucket or leave it blank.

**Fix v1**: nothing. Price-from-photo is a v3 feature. But add a "skip price" affordance so the field doesn't feel mandatory.

### 🟡 Rating UI: stars only

5-star rating is conventional but a sandwich at 4.5 stars vs 5 stars is meaningless. For a personal food journal where you're remembering bites to yourself, **a 3-bucket rating** ("worth it / fine / regret it") might capture how people actually feel about food more honestly than 0-5 stars.

**Fix**: not now. But worth A/B testing in v0.4.

### 🟢 The notes field is the best part

Big enough to write something real. The placeholder ("Rich broth, perfect chashu. Get the egg.") models exactly the right voice — sensory, specific, actionable for future-you. **This single design choice is what makes Bites different from a generic restaurant log.** Don't change it.

### 🟢 Date defaults to today

Small thing but right. The user doesn't have to pick a date 99% of the time.

### 🟢 Location field is optional

Lets you skip the geo-tagging dance for a quick save. Good.

## What I would do differently if redesigning the flow for new users

1. **First-save tutorial moment.** When a brand-new user opens the form for the first time, walk them through ONE field at a time with a "what makes a good bite note" hint. Right now they see 8 fields at once and have to figure out which matter.
2. **Smart defaults from photo metadata.** EXIF data in most phone photos has timestamp + GPS. Pre-fill `date` and `city` from EXIF if available. The user would see "We auto-filled date and city from the photo — change if wrong" and feel like the app is doing work for them.
3. **Tag suggestions based on dish_name.** If you type "ramen", suggest `[ramen, japanese, noodles]` as quick-tap chips. If you type "tacos", suggest `[mexican, tacos, lunch]`. No NLP needed — a flat lookup table covers 90% of cases.

## What worked surprisingly well

- **The form is genuinely fast.** I can imagine completing a bite save in <30 seconds on mobile once I know the muscle memory.
- **The "no log-in" thing is real and refreshing.** localStorage-only means I just open and save. Bites would feel slower if it required auth.
- **The form fields are short.** Nothing here demands an essay. The whole form fits in a single mobile viewport.

## What I'd ship next (priority order)

1. **Add `bite_saved` analytics event** so we can finally measure activation (currently only `pageview_ping` fires). I keep flagging this — it's the highest-leverage thing.
2. **EXIF auto-fill** for date + city. Small change, big "this app is smart" moment.
3. **Better tag placeholder** — drop "repeat".

---

*Saved 2026-05-11 after dogfooding flow on Gregory's bite of "The Ultimate" at Crostini & Java, SF.*
