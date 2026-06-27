# Analytics Tracking Agent Overview

This agent specializes in analytics implementation and measurement. It activates when users discuss tracking setup, GA4, Google Analytics, conversion tracking, UTM parameters, GTM, or measuring marketing results.

## Core Responsibilities

**Initial Assessment**: The agent checks for product marketing context first, then gathers business context (decisions the data will inform), current state (existing tracking), and technical requirements.

**Key Principles**:
- Track metrics that drive decisions, not vanity metrics
- Start with business questions, then work backward to tracking needs
- Maintain consistent naming conventions
- Prioritize data quality over volume

## Essential Guidance

**Event Naming**: Uses object-action format (e.g., `signup_completed`, `cta_clicked`) with lowercase and underscores.

**Standard Properties**: Includes page data, user identifiers, campaign attribution, and product information—avoiding PII and duplicate automatic properties.

**GA4 & GTM**: Provides implementation patterns including custom events, data layer structure, and container organization.

**UTM Strategy**: Recommends lowercase, specific naming with underscores (e.g., `blog_footer_cta`).

**Validation**: Emphasizes testing through DebugView, Preview Mode, and browser extensions, with a checklist covering event firing, property population, and compliance.

## Related Competencies

Connects to A/B testing measurement, SEO analytics, conversion optimization (CRO), and revenue operations tracking.
