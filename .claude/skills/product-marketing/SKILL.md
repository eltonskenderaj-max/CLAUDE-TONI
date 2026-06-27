# Product Marketing Context Workflow

This skill helps users build a **foundational marketing document** (`.agents/product-marketing.md`) that captures positioning, audience, and messaging—preventing repeated context-gathering across projects.

## Core Process

**Step 1: Check for Existing Files**
- Look for `.agents/product-marketing.md`, `.claude/product-marketing.md`, or legacy `product-marketing-context.md`
- If found elsewhere, offer to migrate to canonical location
- If exists: summarize current state and ask what to update
- If missing: offer two paths forward

**Step 2: Two Gathering Approaches**

*Option A (Recommended):* Auto-draft from codebase (README, landing pages, copy, package.json) then refine
*Option B:* Conversational walkthrough, one section at a time

Prioritize **verbatim customer language** over polished descriptions—exact phrases resonate better in marketing.

**Step 3: Capture 12 Key Sections**
- Product Overview, Target Audience, Personas
- Problems & Pain Points, Competitive Landscape
- Differentiation, Objections & Anti-Personas
- Switching Dynamics (JTBD Four Forces)
- Customer Language, Brand Voice, Proof Points, Goals

**Step 4: Create & Confirm**
- Generate markdown document with structured sections
- Request final adjustments
- Save to `.agents/product-marketing.md`
- Confirm other skills now reference this context automatically

## Key Principles
- Ask specific, example-driven questions
- Validate each section before advancing
- Skip sections that don't apply to your product type
- Update anytime with `/product-marketing` command
