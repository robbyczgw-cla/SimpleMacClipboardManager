# Commerce Plan

## v1 offer

- Founder launch: **€9.99** one-time purchase.
- Standard price after validation: **€17.99** one-time purchase.
- One purchase covers up to three personal Macs.
- No subscription and no account requirement in the app.
- The paid build is a signed/notarized convenience distribution with curated
  releases, updates and support; the existing MIT source remains public.

## Recommended checkout

Start with **Lemon Squeezy** as the Merchant of Record candidate. Its official
documentation describes global sales-tax/VAT handling and a checkout suitable
for digital products. Validate onboarding, payout availability, refund
handling, acceptable-use rules and the final fee schedule in the owner's
account before committing to it.

Fallbacks are Gumroad for the fastest low-volume test and Paddle for a more
operationally mature software-sales path. Gumroad's official pricing currently
lists 10% + $0.50 for direct sales, while Lemon Squeezy documents a percentage
plus fixed-fee model and additional international-payment handling; compare
the final EUR-inclusive economics before launch.

## Delivery

1. Customer completes the hosted checkout.
2. Provider delivers the current signed arm64/x64 DMG and ZIP, or a protected
   download link to the same release artifacts.
3. Release notes and SHA-256 checksums accompany the download.
4. Updates remain signed and architecture-specific. A provider outage must
   not destroy access to already downloaded app data.
5. Manual download remains the fallback; no clipboard content is sent to the
   provider.

## Refund and support policy

Document the final refund window and jurisdiction-specific consumer rights on
the checkout page and Terms page before taking money. Support should receive
the order identifier and app version only; never request a clipboard export by
default. If a diagnostic export is needed, ask the customer to redact it.

## Optional entitlement layer

Do not add online activation for the first paid test. If future Pro features
need an entitlement, place a provider adapter behind a main-process-only
`EntitlementService`, store tokens with macOS `safeStorage`, allow an offline
grace period, and never block access to a user's history, export, deletion or
privacy settings because a provider is unavailable.

## Required owner inputs before launch

- [ ] Confirm the Merchant of Record after account/legal review.
- [ ] Create the provider product and one-time variants.
- [ ] Supply the hosted checkout URL as configuration, not hardcoded source.
- [ ] Define refund, support and privacy/terms pages.
- [ ] Decide whether paid downloads are private or whether GitHub releases are
      public convenience artifacts.
- [ ] Configure provider/webhook secrets only if delivery automation is added.

## Sources

- [Lemon Squeezy Merchant of Record](https://www.lemonsqueezy.com/blog/merchant-of-record)
- [Lemon Squeezy tax and fee example](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat)
- [Gumroad official pricing](https://gumroad.com/pricing)
- [Paddle Merchant of Record overview](https://www.paddle.com/blog/what-is-merchant-of-record)
