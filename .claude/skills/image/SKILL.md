# Image Production

Create marketing images using AI generation, design tools, and optimization best practices.

**Check for product marketing context first:** Read `.agents/product-marketing.md` if it exists.

## Approach Selection
| Approach | Best For | Tools |
|----------|---------|-------|
| AI Generation | Blog heroes, social graphics, lifestyle | Gemini, Flux, Ideogram |
| AI Editing | Modify existing images | Gemini, Flux Kontext |
| Design Tools | Brand-consistent templates | Canva, Figma |
| Screenshot + Overlay | Product UI mockups | Browser + code |
| Stock | Speed over uniqueness | Unsplash, Pexels |

## Model Selection
- **Text in image** → Ideogram 3.0 (best), Gemini, GPT Image
- **Brand consistency across many images** → Flux, Recraft V3
- **Edit existing image** → Gemini, Flux Kontext
- **Highest quality/art direction** → Flux Pro 1.1, Midjourney v7

## Standard Sizes
- Blog hero / OG image: 1200×630
- Twitter/X: 1200×675 | LinkedIn: 1200×627
- Instagram: 1080×1080 | Stories: 1080×1920

## Optimization
Serve WebP with JPEG fallback. Compress to <200KB for heroes. Add `width`/`height` attributes. Use `loading="lazy"` below fold.

## Related Skills
- **ad-creative**: Paid ad image specs
- **aso**: App store screenshot specs
- **cro**: Image placement for conversion
