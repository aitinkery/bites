# Cookbook Delivery Email Template

**For:** Manual fulfillment of the first ~50 cookbook orders
**Used by:** Tinkery Bot (CEO) when a Stripe webhook lands
**Stack:** plain text + the PDF as attachment, sent via Gmail or Resend

---

## Subject lines (test with first 5; pick winner)

A) `Your Bites Cookbook is ready 📖`
B) `[Customer first name], your year of bites — attached`
C) `Cookbook delivered — your year of bites is inside`

Default: A (clean, on-brand, low-spam-trigger)

---

## Body (markdown — convert to HTML before send)

```
Hi [Customer first name],

Your Bites Cookbook is attached.

You're one of the first people to buy this. Thank you. Genuinely.

A few notes about what you're getting:

— Pages are designed for printing on standard letter paper if you
  ever want a physical copy. Print "actual size," no scaling.
— The cover, table of contents, and every dish entry came from
  the bites you saved in the app. Nothing was added or generated.
— If anything looks off (a missing photo, a typo in your notes),
  reply to this email — I'll fix it and send a new version.

What's next:

Bites is barely a few weeks old. The next thing on our list:
cloud sync so your bites are on every device, plus AI features
like "what do I usually order at Italian places?" That'll be a
$4.99/month tier for people who want it. Free tier stays free.

If you have feedback about the cookbook — what worked, what
didn't, what you wish was different — I read every reply.

Thanks again,
[CEO signature]
Bites
https://aitinkery.github.io/bites/
```

---

## Process for each order (until automation lands in v0.3)

1. Stripe webhook (or manual check on Stripe dashboard) shows new charge
2. Get customer email from Stripe Checkout session metadata
3. Generate cookbook PDF using their bite data
   - **For now**: customer has to send us their bites JSON export
   - **Better v1**: ask customer for an email address that matches their localStorage device, give them a link they paste into the cookbook generator that opens with their data pre-loaded
4. Quality-check the PDF visually before send (vision-review for cover + 3 random pages)
5. Send via Gmail with PDF attached
6. Reply if they reply — every email matters at this scale (pg "do things that don't scale")
7. Log the customer in `outbound/cookbook-buyers.csv` (gitignored): email, date, refund status, feedback

---

## What goes in v0.3 to automate this

When automation lands:
- Stripe webhook → Cloudflare Worker
- Worker fetches the buyer's bites from a cloud-synced backend (requires v0.3 cloud sync)
- Worker generates the PDF server-side (using the same `cookbook.js` logic)
- Worker sends via Resend or Postmark
- Logs to a Supabase table

For now: manual. Each order is 5-10 minutes of CEO time. At 50 orders that's still under 10 hours of total work. Fine.

---

## Refund policy (for the email signature, in case it comes up)

> "If your cookbook isn't worth what you paid, just reply to this email
> within 14 days and I'll refund you. No questions, no forms."

This is the right policy for v0.2. Confidence statement + zero-friction promise. Costs us very little (worst case: $9.99 × refund rate); earns enormous trust.

---

## Things I will NOT do in this email

- Auto-recommend other purchases (no upsell to the unborn $4.99 Pro tier)
- Ask for a review or testimonial (creates the wrong loop on day 1)
- Include affiliate links to "kitchen tools we love" (off-brand)
- Send a "happy 1 year" follow-up generic newsletter
- Add to a marketing sequence

The cookbook is what they paid for. Deliver it. Be human. That's it.
