# Copilot Instructions – The Pink Alien Candy Store

## Tech Stack (Important)
This project is intentionally built using:
- HTML
- CSS
- Vanilla JavaScript (ES6+)

Do NOT introduce frameworks such as:
- React
- Vue
- Svelte
- Angular

All functionality should be implemented using plain JavaScript and standard browser APIs.

Reasoning:
- The goal is to build a clear, understandable MVP
- Maintainability and learning clarity are prioritized over abstraction
- The project should remain easy to debug and extend

Frameworks may be introduced later only after the core functionality is complete.


## Project Overview
This project is a custom-coded candy store website for **The Pink Alien**, hosted on Netlify.
The site should be playful, whimsical, and space/alien-themed, but first and foremost must function as a real online store.

The site has three primary customer-facing pages:
1. Front Page (Home)
2. Build-a-Bag / Build-a-Box Page
3. Events / Table Setup Page

The site should prioritize clarity, usability, and ease of expansion over over-engineering.

---

## Tech Stack & Constraints
- Frontend: HTML, CSS, JavaScript (framework optional but not required)
- Hosting: Netlify
- State persistence: localStorage for MVP
- Backend: Serverless-friendly (Stripe checkout or quote forms later)
- No heavy frameworks unless clearly beneficial
- Favor readable, well-commented code

---

## Global Requirements
- Responsive design (mobile-first)
- Clear navigation between pages
- Shared header and footer across all pages
- Cart system accessible from all pages
- Accessible HTML where possible (alt text, semantic tags)

---

## Core Features (MVP)

### 1. Front Page (Home)
Purpose: Explain what the store is and guide users to the main actions.

Must include:
- Hero section with store branding and clear call-to-action
- Navigation links to:
  - Build a Box
  - Events
  - Cart
- Featured sections:
  - Best sellers or highlights
  - Build-a-Box teaser
  - Events teaser
- Basic trust elements:
  - Allergen disclaimer
  - Contact info
  - Pickup/shipping note

---

### 2. Build-a-Bag / Build-a-Box Page
Purpose: Allow users to customize a candy container and add it to the cart as a single product.

Flow:
## Copilot / Agent Quick Instructions — Pink Alien (concise)

Purpose: give an AI coding agent exactly the repo knowledge needed to be productive.

- Tech stack: static site (HTML/CSS) + vanilla JavaScript (ES6). Do NOT add frameworks.
- Key pages: `index.html`, `boxmaker.html`, `events.html`, `admin.html` (root of repo).
- Source-of-truth for products: `data/products.json` (check `RESOURCES/data/products.json` if present).
- Fallback: `RESOURCES/JS/products-data.js` defines `window.PRODUCTS` when `fetch` fails.

- Important JS entry points:
  - `RESOURCES/JS/boxmaker-render.js` — loads products, renders `#snack-grid`, then calls `window.boxmakerInit()`.
  - `RESOURCES/JS/boxmaker.js` — selection handlers and `animateToCart()` (owner UI removed).
  - `RESOURCES/JS/admin.js` — admin UI, JSON/HTML export logic (watch the exact wrapper regex).

- Data model (product object): must include `id` (stable string), `src` (relative image path), `name` (string), `price` (number preferred).

- Runtime patterns & gotchas:
  - The cart is persisted in `localStorage` (MVP). Look for code that reads/writes cart keys.
  - `fetch` will fail on `file://`; use a local dev server (examples below).
  - Export relies on an exact HTML wrapper shape; changing grid markup requires updating the export regex in `RESOURCES/JS/admin.js` and `RESOURCES/JS/boxmaker.js`.
  - Netlify (and Linux hosts) are case-sensitive — keep asset paths casing-consistent.

- When changing product fields: update all three places — `data/products.json`, `RESOURCES/JS/products-data.js`, and the render template in `RESOURCES/JS/boxmaker-render.js`.

- Dev server (quick):
  - `python -m http.server 8000`
  - `npx http-server -c-1 . -p 8000`

- What to change (agent checklist for PRs):
  1. Update `data/products.json` (new field → add to fallback file and renderer).
  2. Update `RESOURCES/JS/boxmaker-render.js` template injection.
  3. Update `RESOURCES/JS/admin.js` export regex if wrapper HTML changes.
  4. Run local server and verify plus/minus behavior, grid render, and cart persistence.

- Testing & scope: there is no automated test suite — validate changes manually across mobile and desktop widths.

If anything above is unclear or you want this expanded with examples (small product JSON, cart keys, or specific function locations), tell me which area to expand. 

