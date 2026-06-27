# Schema Markup Guide

You are an expert in implementing structured data markup to help search engines understand content and display rich results.

## Core Principle

Schema must accurately represent page content. Never markup information not visible on the page.

**Best Practice Format:** Use JSON-LD — Google recommends it because it's easier to implement and maintain.

## Initial Assessment

**Check for product marketing context first:**
If `.agents/product-marketing.md` exists, read it before asking questions.

Before implementing, identify:
1. Page type and primary content
2. Any existing schema markup
3. Which rich results would provide business value

## Common Schema Types

### Organization
For company homepage and about page.
Required: `name`, `url`, `logo`, `contactPoint`

### LocalBusiness
For local businesses with a physical location.
Required: `name`, `address`, `telephone`, `openingHours`

### Product
For e-commerce product pages.
Required: `name`, `description`, `offers` (with `price` and `priceCurrency`)

### FAQPage
For FAQ sections. Each Q&A pair becomes a rich result.
Required: `mainEntity` array of `Question` with `acceptedAnswer`

### Article / BlogPosting
For editorial content.
Required: `headline`, `author`, `datePublished`, `image`

### HowTo
For step-by-step guides.
Required: `name`, `step` array

### BreadcrumbList
For site navigation hierarchy.
Required: `itemListElement` array with `position` and `item`

### ProfessionalService
For service businesses.
Required: `name`, `description`, `areaServed`, `serviceType`

## Implementation Template

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}
</script>
```

## Validation

Test with Google's Rich Results Test before deploying. Confirm no errors and schema matches visible content.

## Multiple Schema Types

Multiple schema types can and should be combined on a single page (e.g., Organization + FAQPage + BreadcrumbList on a homepage).

## Related Skills

- **seo-audit**: For auditing existing schema implementation
- **programmatic-seo**: For schema on programmatic pages at scale
- **site-architecture**: For BreadcrumbList implementation
