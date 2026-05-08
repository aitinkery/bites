# Bites — OPS Ledger

Audit trail of autonomous purchases and ops actions taken by the AI co-founder.

Format: `YYYY-MM-DD | $X.XX | item | reference | running balance`

---

## Namecheap autonomy budget

**Funded:** $50.00 (2026-05-07 by founder)
**Whitelisted IP:** 171.66.12.245
**API username:** bitestinkery

### Transactions

| Date | Amount | Item | Reference | Balance after |
|---|---|---|---|---|
| 2026-05-07 | $9.18 | Domain registration: **bites.kitchen** (1 year, includes WhoisGuard, includes ICANN $0.20 fee) | DomainID 101901534 / OrderID 201869775 / TransactionID 245447849 | **$40.82** |

### Pending / queued

(none)

### Notifications to surface

- Balance below $15 → request CEO refill
- Any single purchase >$30 → request CEO approval first
- Purchase failure → surface immediately

---

## Stripe (test mode)

**Account:** acct_1TUYC3LbqPQ9xVav (provisioned 2026-05-07)
**Status:** test mode only; live mode pending CEO identity verification

### Products

| Stripe ID | Item | Price | Status |
|---|---|---|---|
| prod_UTVQ548rJZ7bGC | Bites Cookbook | $9.99 one-time USD | test |
| price_1TUYPwLbqPQ9xVavjbptLzkp | Bites Cookbook (price object) | $9.99 USD | test |
| plink_1TUYPwLbqPQ9xVavHZbFOpq2 | Bites Cookbook (payment link) | https://buy.stripe.com/test_4gMdRa1BS0OZ1Bx2Zh3F600 | test |

---

## GitHub

**Repo:** aitinkery/bites (public)
**Pages:** https://bites.kitchen/ (custom domain) and https://aitinkery.github.io/bites/ (legacy)
**HTTPS cert:** provisioning at deploy time

---

## Composio integrations

| Toolkit | Account ID | Used for |
|---|---|---|
| GitHub | ca_xJsxj-eT5by8 | Repo writes (commits via API) |
| Gmail | ca_9BAMIfrIiqeQ | Email sending (manual cookbook delivery) |
| Google Calendar | ca_us2dL-sTPlzY | Scheduling (unused for Bites yet) |
| Google Sheets | ca_6_j83xZN7cre | Future analytics aggregation |

---

## Self-discipline rules (CEO operating policy)

- Log every purchase here within 5 minutes of completion
- Surface any purchase >$30 to CEO BEFORE buying
- Surface balance ≤$15 to CEO so they can refill
- Never share credentials in commit messages or repo files
- Rotate any credential pasted in chat once the immediate task is done

---

## Claude API credits (the operator cost)

The AI co-founder isn't free. These numbers track what the project costs in Anthropic API tokens, settled through Composio. Logged for honest accounting and so we have a real burn rate to discuss at the day-21 decision gate.

### Per-task breakdown (subagent runs)

These are the focused build/distill tasks I dispatched. Costs are per-task, separate from the main-conversation cost which is amortized across all activity.

| Date | Task | Cost | Turns |
|---|---|---:|---:|
| 2026-04-21 | chatbot-card-refactor (AI Tinkery library v1) | $0.91 | 19 |
| 2026-04-21 | tinkery-library-build (full library redesign) | $2.30 | 22 |
| 2026-04-21 | hp-full-integration (Hackers & Painters distillation) | $3.03 | 37 |
| 2026-04-27 | dirksen-distill (Design for How People Learn) | $2.48 | 19 |
| 2026-05-07 | pg-essays-distill (240 PG essays integration) | $2.09 | 16 |
| 2026-05-06 | bites-v0-build (FAILED — died after scaffold) | $0.74 | 7 |
| 2026-05-06 | bites-v0-build-2 (full v0 prototype, 1676 lines) | $2.74 | 34 |
| 2026-05-07 | bites-v0.1-monetize (landing + paywall + share metadata) | $3.54 | 55 |
| 2026-05-07 | bites-cookbook-generator (PDF engine, cover, TOC) | $4.72 | 70 |
| 2026-05-07 | bites-ios-pwa-polish (feels-native iOS pass) | $2.80 | 53 |
| 2026-05-07 | bites-cookbook-redesign (3 layouts, magazine treatment) | $6.36 | 79 |
| 2026-05-07 | cookbook-finishing-pass (6-fix polish) | $2.82 | 50 |
| 2026-05-07 | bites-alpha-launch (landing + analytics + alpha flow) | $4.99 | 75 |
| 2026-05-07 | upd-distill (Universal Principles of Design) | $1.34 | 16 |

**Subagent total: $40.86 across 14 task runs** (Bites: $30.05 / Pre-Bites distillations: $11.24)

### Daily totals — main session, Bites era only

| Day | Turns | Spend |
|---|---:|---:|
| 2026-05-06 (started 19:08 PDT) | 5 | $3.14 |
| 2026-05-07 | 326 | $190.55 |
| 2026-05-08 (UTC rollover only) | 9 | $7.41 |

### Running totals

- **Bites total spend (subagents + main session, since May 6 19:08):** ~$232.82
- **All-time AI Tinkery main agent (since Apr 21):** $319.46
- **Average cost per Bites subagent task run:** $4.30
- **Most expensive task to date:** bites-cookbook-redesign at $6.36 (3 vision-review iterations on the bite-page typography)
- **Cheapest billable task:** bites-v0-build (failed/aborted) at $0.74 — cost of a dead subagent before it shipped meaningful code

### What $232.82 actually bought (Bites only)

- 47 commits to the Bites repo
- ~5,000 lines of working code (index.html, cookbook.js, analytics.js, landing/, blog/, deck/)
- 1 working PWA, 1 PDF generator, 1 landing page, 1 pitch deck, 1 blog post
- Custom domain registered, DNS configured, HTTPS provisioned
- Stripe Checkout wired in test mode
- 1 framework distillation (UPD) plus 5 prior framework files
- 1 honest UX evaluation against 20 named principles
- An OPS-LEDGER.md (this file)

Not a great cost-per-output if the product fails. Genuinely cheap if the product earns even modest revenue. **The verdict comes after the day-21 validation gate, not now.**

### Cost discipline rules going forward

- Daily summary appended here within 24 hours of session activity
- Spike alert: any single subagent task costing >$10 gets surfaced to CEO with reasoning
- $1,000 trigger: if total Bites spend hits $1,000 with zero paying customers by day 21, redesign the workflow before continuing
- Caveat: these numbers are read from local session logs (`~/.openclaw/agents/main/sessions/`), not from Anthropic's billing dashboard. They include Composio's pass-through pricing. May differ slightly from your actual Anthropic invoice.
