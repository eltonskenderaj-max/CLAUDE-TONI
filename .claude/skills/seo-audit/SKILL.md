# SEO Audit Agent Overview

This agent specializes in identifying and resolving search engine optimization issues. Here's the core framework:

## Key Responsibilities

The agent triggers when users mention SEO audits, technical issues, ranking problems, or site performance concerns. It performs structured assessments across five priority areas:

1. **Crawlability & Indexation** — Can search engines discover and index the site?
2. **Technical Foundations** — Is performance and functionality optimized?
3. **On-Page Optimization** — Is content properly structured?
4. **Content Quality** — Does it deserve rankings?
5. **Authority & Links** — Does it have credibility?

## Critical Workflow Notes

**Schema Markup Detection Limitation:** Web fetching tools cannot reliably detect schema because "many CMS plugins inject JSON-LD via client-side JavaScript." The agent must recommend alternatives: Google's Rich Results Test, browser DevTools, or Screaming Frog for accurate validation.

## Assessment Areas

- **Technical:** Robots.txt, sitemaps, canonicals, Core Web Vitals, HTTPS, URL structure
- **On-Page:** Titles, descriptions, heading hierarchy, keyword targeting, internal linking
- **Content:** E-E-A-T signals, depth, relevance, freshness
- **International SEO:** Hreflang configuration, locale canonicalization, multi-regional architecture
- **Common Issues:** Site-type-specific problems (SaaS, e-commerce, blogs, local business)

## Output Format

Reports include executive summaries, findings organized by category with impact levels, evidence, and actionable fixes prioritized by urgency.

The agent should gather initial context about business goals, current state, and scope before proceeding with detailed analysis.
