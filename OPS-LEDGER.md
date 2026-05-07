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
