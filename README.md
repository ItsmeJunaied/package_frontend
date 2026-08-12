# Onway Package Delivery Tracker — Dashboard

React 18 + Vite + TypeScript + Tailwind v4. This is the frontend half of the Onway technical
assessment; the Hono API lives in its own repo
([package_backend](https://github.com/ItsmeJunaied/package_backend)).

**Live:** https://package-frontend-five.vercel.app
**Sign in:** `admin@oneway.com` / `Defaulr@oneway` — pre-filled on the form, one click.

---

## Quick start

```bash
npm install
echo "VITE_API_URL=http://localhost:3000" > .env.local
npm run dev            # http://localhost:5173
```

Point `VITE_API_URL` at the deployed API instead if you don't want to run the backend locally —
but note the API's `CORS_ORIGIN` must include wherever you're serving from, so the deployed API
will reject `localhost`.

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run typecheck` | `tsc --noEmit` — also typechecks the backend source it imports `AppType` from |
| `npm run lint` | ESLint |
| `npm run build` | Production build to `dist/` |

### `VITE_API_URL`

Vite inlines this at **build** time, not runtime. On Vercel it has to be a project environment
variable set *before* the build — changing it afterwards requires a redeploy, not just a
restart.

---

## How it talks to the API

There is no generated client and no hand-written response types. The API's route types are
imported directly:

```ts
// tsconfig maps @api/* → ../backend/src/*
import type { AppType } from '@api/index';
const client = hc<AppType>(import.meta.env.VITE_API_URL);

export type Order = InferResponseType<typeof client.orders.$get, 200>['data'][number];
```

The import is **type-only**, so it is erased at build time — Vercel never needs the backend
folder present. The payoff is that a field renamed in the API surfaces as a compile error here
rather than as `undefined` in the browser. The cost is a path dependency between two repos that
are checked out separately; it is called out in the root `README.md` under tradeoffs.

**Components never call `fetch`.** Everything goes through the TanStack Query hooks in
[`src/api/queries.ts`](src/api/queries.ts), so caching, invalidation and error handling live in
one place. A mutation invalidates `orderKeys.all`, which refreshes the table and the dashboard
charts together.

### Auth

The token goes in `localStorage` and is attached by a wrapper around the RPC client. A `401` on
any request while a token is present dispatches a custom `onway:unauthorized` DOM event, which
`AuthProvider` listens for and uses to tear the session down — that's the bridge between a
React-free API module and React state. Every route except `/login` sits behind one `RequireAuth`
layout route, which redirects to `/login?next=<where you were>`.

localStorage is XSS-readable. For an assessment with one demo account that is a deliberate,
documented tradeoff; a real deployment wants an httpOnly cookie.

---

## Pages

| Route | What it is |
|---|---|
| `/dashboard` | Landing route. Six stat tiles, status donut, pipeline, daily volume, courier load, recent activity |
| `/orders` | The table: status filter, search, date range, pagination, create form |
| `/orders/:id` | Detail with the status history timeline and the status/cancel actions |
| `/courier` | The courier's own run — one column of touch-sized cards, polling every 30s |
| `/login` | Sign in |

### Filtering

Status, free-text search and a created-date range, **all in the URL** — so
`/orders?status=cancelled&q=hossain&from=2026-08-01&page=2` is bookmarkable and shareable.

The search box is debounced by 300 ms; the date inputs are not, because picking a date is a
single deliberate act that is already complete when it fires, whereas typing is a stream of
half-finished words.

**One subtlety worth naming.** TanStack Query's `placeholderData` keeps the previous result on
screen while the next loads. That is right for paging — the rows still belong to the same
filter, and blanking the table on every page click reads as slower than it is. It is wrong for
filtering: the old rows do *not* match the new search, so the table appeared to return
everything and then correct itself. `useOrders` now keeps previous data **only when the page
changed and nothing else did**; a filter change drops straight to skeletons.

### The dashboard window

Weekly by default, with 14/30-day presets and a custom range (capped at 90 days). Picking
"Custom" seeds the inputs from the current preset rather than opening empty, so the charts never
blank while you fill in two dates.

Every figure on the page shares that one window, and the header says which — "Everything below
covers 6 – 12 Aug (7 days)". This used to be inconsistent: only the volume chart was windowed
while the tiles and courier load counted all time, so the numbers genuinely did not add up
against the chart beside them.

---

## Design

A dark, near-black console with a single blue accent. Tokens are defined once in
[`src/index.css`](src/index.css) under Tailwind v4's `@theme`; there is no raw hex in any
component file.

| Token | Hex | Used for |
|---|---|---|
| Graphite / Deep / Surface / Raised | `#0E0F12` `#131418` `#17181B` `#202329` | page → card → hover |
| Ink / Fog / Fog-dim | `#EEF1F6` `#8B93A7` `#626A7B` | text |
| **Accent Blue** | `#2F6BFF` | brand, primary actions, active nav, `in_transit` |
| **Violet** | `#8B5CF6` | chrome only — logo, avatar, one tile accent |
| Haze | `#A9B8E8` | `picked_up` |
| Signal Amber | `#F5A623` | `out_for_delivery` — and nothing else |
| Delivered Green | `#2ED47A` | `delivered` |
| Alert Red | `#F04452` | `cancelled`, destructive actions |

Two rules hold it together. **Amber is not ambient** — it used to be the brand accent *and* a
status, which quietly turned a status colour into decoration. And **violet never becomes a chart
mark**: it sits one hue step from Accent Blue and measures ΔE 1.1 under protanopia, so it is
fine on a logo, where nothing depends on telling it apart, and banned from any chart.

Status colours live in [`src/lib/status.ts`](src/lib/status.ts) and nowhere else — badge classes
and chart hexes both come from `STATUS_META`.

---

## Charts, without a chart library

Every mark is a `div` or a CSS gradient. Recharts would have added ~90 kB gzipped and a second
set of design tokens to keep in sync, to draw shapes CSS already does natively and responsively —
and doing it this way keeps every label as real selectable text at the app's own type scale.

The status donut is a `conic-gradient` with transparent wedges for the gaps, masked to a ring.
Hovering a legend row dims the other five segments and swaps the centre figure, which is a
comparison a flat legend cannot make.

Mark shading comes from [`src/lib/chart-style.ts`](src/lib/chart-style.ts) — a sheen on the
leading edge and an offset bloom underneath, mixed in oklab so a pale periwinkle and a mid-blue
get the same perceptual lift. One light source everywhere. Hue and length are untouched: the
shading is decoration and carries none of the meaning.

**The palette is measured, not eyeballed.** Against the `#17181B` card surface all six status
colours clear 3.95:1 contrast, the worst adjacent pair separates at ΔE 8.9 under deuteranopia,
and the worst normal-vision pair at ΔE 21.6 against a floor of 15. Every mark also carries a
direct label, every legend its pipeline icon, and every chart an `sr-only` data table — colour
is never the only encoding.

Bars grow from their baseline on mount with a left-to-right stagger, and the animation is
removed entirely under `prefers-reduced-motion` rather than shortened.

---

## States

- **Table loading:** skeleton rows, not a spinner — the layout stays put, which reads as faster.
- **Paging:** the previous page stays visible at reduced opacity while the next loads.
- **Filtering:** skeletons, deliberately — see above.
- **Mutation failure:** a toast carrying the server's own `error.message`, with the form keeping
  everything typed.
- **Detail 404:** an explicit "this order doesn't exist or was removed" with a link back.
  TanStack Query is configured not to retry 4xx — a 404 is an answer, not a blip.

Responsive down to 375 px: the table collapses to stacked cards below `md`, the stat grid goes
to two columns, and wide plots scroll inside their own card rather than the page.

---

## Layout

```
src/
├── api/          # RPC client + TanStack Query hooks — the only place fetch happens
├── components/
│   ├── charts/   # the dashboard's marks, plain HTML/CSS
│   └── ui/       # button, dialog, field, toast, skeleton, states
├── hooks/        # use-auth, use-chart-tooltip, use-debounced-value
├── lib/          # status vocabulary, chart shading, date ranges, formatting, schemas
└── pages/        # dashboard, orders, order-detail, courier-view, login
```

---

## Known gaps

- The token is in `localStorage` (see above).
- No optimistic updates on status changes — the mutation waits for the server, since the server
  is the authority on whether a transition is legal.
- No component tests. The API contract is covered by the backend suite and by the compile-time
  binding to `AppType`; a Playwright pass over the create → advance → cancel flow is the gap.
