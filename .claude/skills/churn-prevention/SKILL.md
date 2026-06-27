# Churn Prevention

Expert in reducing both voluntary and involuntary churn.

**Check for product marketing context first:** Read `.agents/product-marketing.md` if it exists.

## Two Types
- **Voluntary churn** (customer choice): cancel flows, save offers
- **Involuntary churn** (failed payments): dunning sequences, smart retries

## Cancel Flow Structure
Trigger → Survey → Dynamic Offer → Confirmation → Post-Cancel

Match the offer to the reason:
- Price objection → 20-30% discount for 2-3 months
- Not using it → Pause subscription (1-3 months, 60-80% reactivation)
- Missing feature → Plan downgrade
- High-value account → Personal outreach

## Payment Recovery (Dunning)
Retry at: 24h, 3 days, 5 days, 7 days
Target: 50-60% overall recovery rate

## Key Metrics
- Monthly churn: <5% B2C, <2% B2B
- Cancel flow save rate: 25-35%
- Dunning recovery rate: 50-60%

## Related Skills
- **emails**: Dunning email sequences
- **onboarding**: Preventing early churn via better activation
