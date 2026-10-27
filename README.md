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

## Landing page, combos and ingredients (October 2026)

- **Product orbit** (`sections/product-orbit`, `assets/kehsora-orbit.*`): the reel-style hero.
  - The concentrates ride a turning maroon ring; customers can drag to spin it.
  - Tapping a bottle opens a spotlight with a giant name, sizes and Add to Cart.
  - Give each Bottle block a transparent PNG cutout for the floating look.
- **Combo studio** (`sections/combo-studio`): homepage tabs for each combo offer.
  - Customers pick concentrates into a tray and add the combo to the cart from the homepage.
  - Uses the same picker as the combo product page (`snippets/combo-picker`).
- **Lifestyle photo strip** (`sections/lifestyle-strip`): hidden until photos are added.
- **Ingredient details**: each ingredient now has a fact sheet and "The science" / "How to use it" panels:

  | Fact sheet field | |
  |---|---|
  | Botanical name | |
  | Origin | |
  | Key compounds | |
  | How we prepare it | |
  | Best for | |
  | Pairs well with | |

## Combos, reviews and certificates (late October 2026)

- **Combos are recognised from the product title** (`snippets/combo-meta.liquid`).
  "Any 2 Concentrates – Combo Offer" lets shoppers pick 2, "Any 3…" picks 3,
  "Bundle of All 5…" includes everything, and "Base Oil" in the title adds the
  base oil. Tags (`combo`, `pick-2`, `with-base-oil`) still work and win over the title.
- **Homepage combo studio** lists every combo automatically, in the order
  2 + base oil, any 3, any 2, all 5, all 5 + base oil. Add blocks only to choose
  the offers yourself.
- **Shop page** shows the oils and the combos in separate sections. The concern
  filters match product titles (e.g. Hair Fall → Bhringraj, Rosemary), so no tags
  are needed. Bestsellers hide combos.
- **How to use & certificates** (`sections/ritual-guide.liquid`) sits under
  "Every bottle, held to the same rule". The COAs are theme assets
  (`assets/coa-*.jpg`); swap any of them for a new upload in the section's
  certificate blocks.
- **Product reviews** (`sections/product-reviews.liquid`) sits under every product.
  Install Judge.me (free, photo + video reviews) and add its "Review widget" block
  to this section; until then a review form and a WhatsApp button for photos and
  videos are shown.
- **Ingredient arches** open a paragraph on tap. Upload ingredient pictures in
  the block's "Ingredient picture" setting.
