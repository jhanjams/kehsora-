# Kehsora — Shopify Online Store 2.0 Theme

A complete Shopify theme for Kehsora: a continuous deep-maroon background, warm ivory text, brass-gold accents and Cormorant Garamond / Jost typography (the fonts are self-hosted in `assets/`).

## Structure

| Folder | Contents |
|---|---|
| `layout/` | `theme.liquid` (every page), `password.liquid` (store-closed page) |
| `templates/` | JSON templates for home, product, collection, cart, search, 404, blog, article, list-collections, page, `page.ingredients`, `page.contact`, password; `gift_card.liquid`; `customers/*` account pages |
| `sections/` | Every section is editable in **Online Store › Themes › Customize**. The header and footer live in section groups (`header-group.json`, `footer-group.json`). |
| `snippets/` | Product card, price, rating, cart line, icons, mandala, headings |
| `assets/` | `kehsora.css`, `kehsora.js`, fonts, favicon |
| `config/` | Theme settings: colours, contact details, cart behaviour, free-shipping threshold |
| `locales/` | English interface text |

## Store setup after uploading

1. **Products.** Create the 5 products with a **Size** option (30ml / 50ml), prices, compare-at prices and images.
   The home page is pre-linked to these product handles:
   - `bhringraj-hair-oil-concentrate`
   - `rosemary-hair-oil-concentrate`
   - `pumpkin-seed-hair-oil-concentrate`
   - `jojoba-hair-oil-concentrate`
   - `sweet-almond-hair-oil-concentrate`

   If you use different handles, re-pick the products in the theme editor.
2. **Tags** drive the concern filters on the shop page: `Hair Fall`, `Dandruff & Scalp`, `Growth & Density`, `Dryness & Shine`.
3. **Product metafields (optional).** Create these in *Settings › Custom data › Products*:

   | Metafield | Type | Shown as |
   |---|---|---|
   | `custom.kicker` | Single line text | Small gold line above the title, e.g. "HAIR FALL & ROOTS" |
   | `custom.short_benefit` | Single line text | Benefit line on product cards |
   | `custom.benefits` | List of single line text | Benefit chips on the product page |
   | `custom.badge` | Single line text | Card badge, e.g. "Bestseller" (a tag like `badge:Bestseller` also works) |
   | `custom.ingredients` | Multi-line or rich text | The "Ingredients" accordion |
   | `custom.how_to_use` | Multi-line or rich text | Replaces the default "How to Use" text for that product |

   Star ratings appear automatically once a reviews app (Shopify Product Reviews, Judge.me, etc.) writes the standard `reviews.rating` metafields.
4. **Pages.** Create the page **Ingredients** with template `page.ingredients`, and the page **Contact** with template `page.contact`.
5. **Menus** (Online Store › Navigation):
   - `main-menu`: Shop All → /collections/all, Ingredients, Our Story → /#our-story, Contact
   - Footer menus, which the footer's link columns use: `footer`, `brand`, `support`
6. **Theme settings.** Colours, email, phone and WhatsApp, cart drawer or cart page, and the free-shipping threshold.
