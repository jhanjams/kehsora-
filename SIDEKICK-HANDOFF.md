# Kehsora — Shopify Build Brief (for Shopify Sidekick)

Build the Kehsora store on Shopify to match the HTML/CSS in this folder exactly.
Every page is a working, styled reference. Open `index.html` in a browser to see it.

## Files

| File | Becomes in Shopify |
|---|---|
| `index.html` | Home page (`templates/index.json`) |
| `shop.html` | Collection page, "All products" (`templates/collection.json`) |
| `product.html` | Product template, **one layout used for all 5 products** (`templates/product.json`) |
| `ingredients.html` | Custom page template (`templates/page.ingredients.json`) |
| `contact.html` | Contact page (`templates/page.contact.json`) using Shopify's `{% form 'contact' %}` |
| `cart.html` | Cart page (`templates/cart.json`) + cart drawer; checkout stays Shopify-native at `/checkout` |
| `assets/styles.css` | Theme stylesheet (upload as `assets/kehsora.css`) |
| `assets/script.js` | Theme JS; swap the localStorage cart for the Shopify Ajax Cart API (`/cart/add.js`, `/cart/change.js`, `/cart.js`) |

## Non-negotiable design rules

1. **One continuous deep-maroon background on every page.** No section gets its own background colour.
   The whole site sits on `#280710`, with a fixed candle-glow and grain layer (`body::before` / `body::after`).
   As you scroll from the hero down, the colour must never change.
2. **Fonts**
   - Brand/display font: **Cormorant Garamond**. It's used for the logo, all headings, the manifesto note/quote, and prices in the cart.
   - Body/UI font: **Jost**.
   - Both are set as CSS variables (`--font-brand`, `--font-body`) at the top of `styles.css`.
3. **Palette**
   - Maroon base `#280710`, deep `#1F050C` and `#16030A`, brand maroon `#6E1729`
   - Gold `#C9A36A` / light gold `#E6CB9C` for accents, eyebrows, stars and primary buttons
   - Cream `#F7F0E4` for text; muted cream at 68% opacity for paragraphs
   - Hairlines: cream at 12% opacity
4. Sections are separated by **space and gold star flourishes, not colour blocks**.
5. Buttons are pill-shaped: gold gradient (primary), cream outline, or gold outline.

## Home page sections (in order)

1. Announcement marquee (scrolling offers)
2. Sticky header: transparent at the top, frosted maroon after scroll. Links on the left, `kehsora` logo in the centre, search and cart on the right.
3. **Hero.** A jharokha arch window with a slowly rotating mandala and a diya glow. The headline "Rooted in *what actually works*" has a gold shimmer on the italic line.
   Optional video: upload `hero-video.mp4` and it fades in inside the arch.
4. Trust strip: Plant Powered · Cruelty Free · Paraben Free · Silicone Free
5. Bestsellers: 4 product cards
6. The Kehsora note: an arch-framed quote card in the brand font
7. Shop by concern: tabs for Hair Fall, Dandruff & Scalp, Growth & Density, and Dryness & Shine
8. The Kehsora Standard: 8 values
9. Five ingredients: arch-framed niches
10. Our Story
11. Newsletter (Shopify customer form)
12. Footer: contact pills, link columns and a large faded `kehsora` wordmark

## Products (5), each with variants 30ml ₹349 (was ₹499) / 50ml ₹499 (was ₹699)

| Handle | Name | Concern tag | Badge |
|---|---|---|---|
| `bhringraj` | Bhringraj Hair Oil Concentrate | hairfall | BESTSELLER |
| `rosemary` | Rosemary Hair Oil Concentrate | growth | NEW |
| `pumpkin-seed` | Pumpkin Seed Hair Oil Concentrate | growth | TOP RATED |
| `jojoba` | Jojoba Hair Oil Concentrate | scalp | GENTLE DAILY |
| `sweet-almond` | Sweet Almond Hair Oil Concentrate | dryness | EVERYDAY |

The full copy for each product is in `PRODUCTS` at the top of `assets/script.js`: kicker, description, benefit chips and ingredients.
Store the kicker, chips and ingredients as product metafields.
**Before launch:** add the full label ingredient list for Rosemary, Pumpkin Seed, Jojoba and Sweet Almond. Only Bhringraj's list was provided; the other four are marked `[Add the full ingredient list…]`.

## Images to upload

`logo.png`, plus `<handle>-1.jpg` and `<handle>-2.jpg` for each product (for example `bhringraj-1.jpg`), and optionally `hero-video.mp4`.

## Contact details

- Email: info@kehsora.com
- Phone and WhatsApp: +91 63038 71560
- Instagram: @kehsora
- Shipping: free above ₹999, dispatched in 2–3 business days, order issues within 7 days of delivery

## Checkout

Checkout is Shopify-hosted. Match it via **Settings → Checkout → Customize**:
- Background `#280710`
- Accent and buttons `#C9A36A`
- Text `#F7F0E4`
- Heading font Cormorant Garamond, body font Jost
