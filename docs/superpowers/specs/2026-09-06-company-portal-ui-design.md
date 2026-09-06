# AgroMedConnect Company Portal — UI Redesign (Phase 1)

**Date:** 2026-09-06
**Status:** Approved for planning
**Scope:** Phase 1 only — the portal UI. The Company API is Phase 2 and gets its own spec.

---

## 1. Why this document exists

The brief asks for eight things at once: a visual redesign, five removals, market
intelligence, discounts, a three-role permission model, two delivery state machines, legal
onboarding, and account/auth flows — plus caching, queueing and RLS-safe aggregation on the
server. That is more than one spec can hold honestly.

The brief's own workflow already splits it: build the UI, pause for confirmation, then build
the API. This document is the first half. It defines **what the portal looks like, what
screens exist, what data shapes they consume, and what the server will therefore have to
provide.** The mock layer it specifies is not throwaway scaffolding — its TypeScript-shaped
contracts *are* the Phase 2 API contract, agreed before a single endpoint is written.

---

## 2. Current state

### 2.1 The portal

`agromedconnectcompanyportal` is a Vite + React 18 + Tailwind + Recharts SPA, ~1,950 lines
across 20 page components and one 376-line `mockData.js`. A single commit, no branches.

What it has: routing, a sidebar/topbar shell, a small component kit (`Card`, `Badge`,
`Button`, `StatCard`, `ProgressBar`), and static mock content.

What it does not have, and now needs: authentication, any role or permission concept,
internationalisation, a data-fetching layer, loading/error/empty states, form validation,
or a second layout. All five are cross-cutting. This is why the approach is a
foundation-first rebuild rather than a retheme (see §4).

### 2.2 The API and database

`agromed-api` is a .NET 10 layered solution (Domain / Application / Infrastructure / Api /
Gateway) using Dapper against a **live SQL Server**, with 28 applied migrations tracked in
`meta.schema_migration`.

The finding that governs this whole project:

> **Every endpoint that exists today is buyer/farmer-facing.** Auth, Catalogue, Discovery,
> Cart, Orders (buyer view), Payments, Bookings, Reviews, Profile, Privacy. There is no
> seller write surface at all — no listing creation, no order fulfilment, no offer
> management, no team management.

So the Company API is **net-new**, not a refactor. The regression risk to the completed
farmer side is structurally low: Phase 2 adds controllers and stored procedures, and does
not modify existing ones. This is the strongest possible position relative to the brief's
critical constraint.

### 2.3 What the schema already models

The database is far ahead of the brief. Six of the eight features have tables already:

| Feature in the brief | Existing schema |
|---|---|
| Discounts | `pricing.offer` — percentage/fixed, per-listing or per-category, `starts_at`/`ends_at`, `funding_source='seller'`, `status` draft→pending_approval→active→paused→expired→cancelled, plus `is_stackable`/`stack_priority`/`stack_group` |
| Two delivery paths | `sales.order.delivery_type` CHECK is exactly `own \| partner \| pickup`; `sales.shipment.status` runs `pending→dispatched→in_transit→delivered\|failed\|returned` |
| Status audit trail | `sales.order_status_history` (from, to, actor, reason, `occurred_at`) and immutable `audit.audit_log` (trigger-enforced) |
| Legal verification | `admin.verification_queue`, `compliance.certificate`, `compliance.verification_event`, `organisation.verification_status`, and `trade_licence_no` / `bin_number` / `tin_number` columns |
| Roles & permissions | `iam.role` (seller scope, `authority_rank`), `iam.permission` (46 seeded codes), `iam.role_permission`, and per-member overrides in `iam.membership_permission` (`effect` = grant\|deny) |
| Product licence gating | `compliance.certificate` with `subject_type='listing'` and a `listing_id` FK |

**Seeded seller roles today:** `owner` (rank 900), `manager` (700), `inventory_staff` (400),
`support` (300).

### 2.4 Gaps found — Phase 2 migration work

Five gaps. All additive; none touches a farmer table, column or predicate.

| # | Gap | Proposed fix (Phase 2) |
|---|---|---|
| G1 | No NID. `iam.organisation` has `trade_licence_no`, `bin_number`, `tin_number` but the brief requires the company admin's **National ID**, which is personal PII and does not belong on the organisation row | New `compliance.admin_identity_document` table, keyed to `(organisation_id, user_id)`, encrypted at rest, readable only by `platform.pii.read` |
| G2 | No delivery-person assignment. `sales.shipment` has no column for who is carrying it | Nullable `assigned_to_user_id` + `assigned_at` on `sales.shipment` |
| G3 | No delivery-man role and no handover permission | Seed a `delivery_man` seller-scope role (rank 200) and an `order.handover` permission |
| G4 | No coordinates anywhere. `ref.geography` is a code hierarchy (country→division→district→upazila) with **no lat/lng**; `sales.order.delivery_address` is free text | Nullable `delivery_lat` / `delivery_lng` on `sales.order`, captured at checkout by the Flutter app (see §9, Risk R1) |
| G5 | No bundle concept behind the Solution Center screen | Deferred — flagged in §9, Open Question O1 |

---

## 3. Decisions taken

| # | Decision | Rationale |
|---|---|---|
| D1 | **Phase 1 runs on an API-shaped mock layer** | The brief demands both "UI first, no API code" and "real aggregated data, not placeholders". Those are incompatible. Mocks typed to the real DTO shapes satisfy the review need; the contract is agreed before endpoints are written, so Phase 2 swaps the adapter with zero screen changes. |
| D2 | **Delivery Man gets a dedicated mobile-first shell**, with a map and full run-sheet detail | A delivery man works on a phone at a gate and needs two actions. A sidebar-and-cards desktop layout is the wrong instrument. Same app, same login, separate layout selected by role at the route level. |
| D3 | **Map pin comes from exact coordinates captured at checkout** | Chosen for accuracy. Requires the Flutter change (R1). The DTO therefore carries `precision`, and the UI must render an honest address-only state when coordinates are absent — which is the case for 100% of existing orders. |
| D4 | **Unverified companies see the full portal with write actions disabled** | Lets a company prepare its catalogue while review is pending. Made safe by routing every gate through one resolver (§5.3) rather than scattering `disabled` props. |
| D5 | **Bilingual bn-BD / en-US with a toggle** | Consistent with the platform: the API negotiates locale per request, returns `Content-Language`, and renders money as `৳৪৯৫.০০`. An English-only portal would show ASCII chart axes beside Bengali money labels on the same screen. |
| D6 | **Foundation-first rebuild** | Four of the requirements are cross-cutting (auth/RBAC, i18n, data layer, second shell). Retrofitting them across 20 existing pages costs more than rebuilding on top of them. |
| D7 | **Leaflet + OpenStreetMap, not Google Maps** | No API key, no billing account. Google Cloud billing on this account is inactive. |
| D8 | **Charts get one encoding per screen** | Explicit brief requirement. `Analytics.jsx` currently violates it — an AreaChart and a LineChart both plotting value-over-time on one page. §7 assigns each screen a distinct-encoding chart set. |

---

## 4. Architecture

### 4.1 Layers

```
src/
  design/        tokens.css, tailwind preset            — §6
  i18n/          t(), locale ctx, bn/en dictionaries,
                 number + money + date formatters       — §5.2
  auth/          session ctx, login, route guards       — §5.1
  access/        permission map, can(), <Gate>          — §5.3
  data/          adapter interface, mock impl,
                 contracts/ (the Phase 2 DTO shapes)    — §5.4
  ui/            primitives (Card, Button, Field, Table,
                 EmptyState, Skeleton, ErrorState…)
  charts/        one component per encoding, all locale-
                 aware, all themed from tokens          — §7
  layouts/       CompanyShell, DeliveryShell, AuthShell — §5.5
  features/      one folder per screen group            — §8
```

Rule: `features/` may import from every layer above it; nothing imports from `features/`.
`data/contracts/` imports nothing at all — it is pure type declarations, and it is the
artefact Phase 2 implements against.

### 4.2 Why a data *adapter*, not fetch calls in components

Every screen consumes data through a single `DataAdapter` interface. Phase 1 ships
`MockAdapter`; Phase 2 adds `HttpAdapter` and swaps one provider value. This is what makes
"UI first, API second" a real sequence rather than rework — and it means Phase 2 integration
failures surface as adapter test failures, not as broken screens.

---

## 5. Foundation

### 5.1 Auth and session

Token pair from `POST /api/v1/auth/login` (already exists and is farmer-tested; company
login reuses it). Access token in memory, refresh token in an httpOnly cookie once the API
supports it — until then, `sessionStorage`, and the spec says so rather than pretending
otherwise. Session context exposes `{ user, organisation, role, permissions[],
verificationStatus, locale }`.

Route guards: unauthenticated → `/login`. Authenticated → shell chosen by role (D2).

### 5.2 Internationalisation

- `t(key, vars)` against flat `bn-BD` / `en-US` dictionaries. No key may be missing from
  either file — a lint check fails the build on divergence, because a half-translated screen
  is worse than an untranslated one.
- **Formatters are the load-bearing part.** `formatMoney`, `formatNumber`, `formatDate`,
  `formatPercent` all read the active locale. In `bn-BD` they emit Bengali numerals with
  2,2,3 Indian digit grouping, matching the server's `display` string exactly.
- Money arriving from the API already carries a server-rendered `display`. **Prefer it.**
  The client formatter exists for values the client derives (chart ticks, computed
  subtotals), which the server never rendered.
- Every chart passes `tickFormatter={formatNumber}` — without it, Recharts renders ASCII
  digits next to Bengali money labels on the same card.

### 5.3 The capability gate

One resolver, because D4 makes "may this user do this?" a question asked on nearly every
screen:

```js
can(action) =>
  permissions.includes(requiredPermission[action])          // role check
  && (!writeActions.has(action) || verificationStatus === 'verified')  // verification gate
  && !organisation.isBlacklisted
```

`<Gate action="product.publish">` renders children when permitted; otherwise renders them
disabled with a tooltip naming the actual reason ("Verification in progress" vs "Your role
does not permit this"). Two different blocks, two different messages — telling a user
"not permitted" when the truth is "not yet verified" sends them to the wrong screen.

Role → permission mapping (Phase 1 mock mirrors the DB seed):

| Portal role | DB role | Key permissions |
|---|---|---|
| Admin | `owner` (900) | everything non-platform: `organisation.manage`, `member.*`, `certificate.submit`, `catalog.*`, `offer.manage`, `payout.*`, `report.read` |
| Employee | `manager` (700) | as Admin minus `payout.approve`, `payout.request`, `organisation.manage`, `member.remove` |
| Delivery Man | `delivery_man` (200, **new**) | `order.read` (own assignments only), `order.handover` (**new**) |

### 5.4 Data contracts

Contracts follow the API's existing conventions, not invented ones:

- **Money is always** `{ amountMinor: number, currency: 'BDT', display: string }`. Never a
  float, never a bare number. The portal never does arithmetic on money for display.
- **Enums are the database's CHECK constraint values, verbatim**: order status is
  `pending_payment | paid | confirmed | processing | shipped | delivered | completed |
  cancelled | refunded | disputed`, not a UI-friendly rewording. Labels are an i18n
  concern; values are a contract.
- **Lists are paginated** — `{ items, page, pageSize, total }` — from the first mock, so no
  screen is built on the assumption that everything fits.
- Every adapter method can return a loading, error and empty state. Every screen renders
  all three. This is the single largest gap in the current portal.

### 5.5 Shells

- `AuthShell` — centred card, no chrome. Login, register, forgot, reset, accept-invite.
- `CompanyShell` — sidebar + topbar, for Admin and Employee. **No search in the topbar**
  (removal #5); search lives on Products, Orders, Inventory and Team, where it filters a
  real list.
- `DeliveryShell` — no sidebar. Bottom tab bar, large touch targets (44px minimum), single
  column, map-first. Selected by role at login.

---

## 6. Visual system — Olive Earth

### 6.1 Tokens

```
--primary          #004B23   deep olive — primary actions, active nav, headings on cream
--primary-hover    #00381A
--secondary        #6A994E   fills, chart series, badges
--accent           #A7C957   highlights, chart series, progress fills
--base             #F2E8CF   app background
--panel            #FDFBF4   cards — lifted off the cream base
--sunken           #EADFC0   table headers, inset wells
--border           #DDD0AC
--ink              #1B2A20
--ink-soft         #4A5A4E
--ink-faint        #7C8A7E
```

### 6.2 Two contrast findings that constrain usage

1. **`#6A994E` and `#A7C957` fail WCAG AA as text on `#F2E8CF`** (roughly 2.9:1 and 1.9:1).
   They are **fill and border colours only**. Every piece of text on the cream base is
   `--ink`, `--ink-soft` or `--primary`. This is a hard rule, not a preference.
2. **`#F2E8CF` is a saturated cream, not a neutral.** Pure-white cards on it read as holes.
   Cards use `--panel` `#FDFBF4`, which is warm enough to belong and light enough to lift.

### 6.3 Categorical chart colours

Olive Earth is a single-hue family. Three greens cannot encode four series — a stacked area
of five categories in green-only is unreadable. The chart palette therefore extends the
family with earth-adjacent hues of **differing lightness as well as hue**, so it survives
greyscale printing and the common forms of colour-vision deficiency:

```
series-1  #004B23   deep olive
series-2  #A7C957   light lime
series-3  #B8752F   clay
series-4  #2F6B8F   slate blue
series-5  #7D3C5A   plum
series-6  #C9A227   wheat
```

Semantic colours stay separate from series colours so "green" never means both *series 1*
and *success* on one screen: success `#3F7A34`, warning `#C77E23`, danger `#A8321E`,
info `#2F6B8F`.

### 6.4 Type

Retain the existing pairing (Fraunces display / Public Sans text / IBM Plex Mono numeric),
which is already well chosen. Bengali needs a companion face with real Bengali coverage —
**Noto Sans Bengali** — applied via `:lang(bn)`, because Public Sans has no Bengali glyphs
and would fall back to whatever the OS supplies, differently on every machine.

---

## 7. Chart plan — one encoding per screen

The rule is *no duplicate encodings on a screen*, and every chart must answer a decision.

| Screen | Charts (each a distinct encoding) | The decision it serves |
|---|---|---|
| **Dashboard** | 1. Line — revenue, 12 weeks<br>2. Funnel — order pipeline by status<br>3. Bullet — fulfilment SLA vs target | Am I growing? Where are orders stuck? Am I shipping on time? |
| **Market Intelligence** | 1. Stacked area — category demand share, whole market, 12 months<br>2. Dumbbell — my price vs market min/median/max per category<br>3. Choropleth (Leaflet) — demand intensity by district, competitor count in tooltip<br>4. Scatter — price vs volume, my listings against the market cloud | What is growing? Am I priced right? Where is demand? Where do I sit? |
| **Discounts** | 1. **Timeline/Gantt** — active and scheduled discount windows per product<br>2. Waterfall — list price → discount → commission → net per unit | *Do my discounts overlap?* and *Does this discount still leave a margin?* |
| **Reports** | 1. Grouped bar — revenue by category<br>2. Cohort heatmap — repeat-purchase by month<br>3. Donut — own vs partner delivery mix | Which categories earn? Do buyers return? Which delivery path do I lean on? |
| **Inventory** | 1. Bullet — stock on hand vs reorder point per SKU | What do I reorder today? |
| **Orders** | none — a filterable table with a status strip | Charts here would be vanity; the job is finding one order. |

The Gantt on Discounts is the highest-value chart in the portal: `pricing.offer` allows
overlapping windows on the same listing with `stack_priority` deciding the winner, and a
timeline is the only encoding that makes an accidental overlap *visible* rather than
discovered in a customer complaint.

Removed as vanity, per the brief: profile-view counts, "engagement" scores, and the
Business Insights dashboard widget.

---

## 8. Screen inventory

**Removed:** Farmer Opportunities, Farmer Request Center, Promotions (superseded by
Discounts), the Business Insights dashboard widget, and the dashboard/topbar search.

### Public — `AuthShell`
1. **Login** — phone or email + password; locale toggle present before sign-in
2. **Register company** — legal name, kind (`manufacturer` | `importer_supplier`), contact,
   admin user; ends on the verification checklist, not the dashboard
3. **Forgot password** → 4. **Reset password** (endpoints exist)
5. **Accept invitation** — staff joining an existing company

### Company — `CompanyShell` (Admin, Employee)
6. **Dashboard** — 3 charts (§7), pipeline shortcuts, verification banner when not verified
7. **Market Intelligence** — §7; whole-market, not own-data
8. **Products** — searchable, paginated list; status, licence-attached and image-review
   badges. Detail/editor with a **publish gate**: cannot go live without a verified
   `compliance.certificate` and at least one primary image
9. **Services** — same pattern for `kind='service'`, plus availability
10. **Solution Center** — bundles (see O1)
11. **Inventory** — stock levels, batches, reorder bullets
12. **Orders** — searchable list; detail shows the delivery state machine (§8.1) and full
    `order_status_history` audit trail
13. **Discounts** — list + editor; overlap timeline; conflict warnings on save
14. **Reviews & Trust** — reviews, responses (`review.respond`), reports
15. **Payments & Payouts** — settlements, payout requests (Admin only)
16. **Reports** — own performance; export
17. **Feedback to platform** — new; submit and track
18. **Notifications**
19. **Company Profile**
20. **Verification** — checklist, uploads, status timeline, "Verification in progress" state
21. **Team** — members, role assignment, per-member permission overrides
22. **Settings** — including the **delivery model** choice (own vs partner)
23. **Help Center** / 24. **Contact Support**

### Delivery — `DeliveryShell` (Delivery Man)
25. **My deliveries** — assigned, grouped by status, big rows
26. **Delivery detail** — Leaflet map (or honest address-only fallback, D3), buyer name and
    phone with tap-to-call, full run sheet from `order_line` snapshots (`sku_snapshot`,
    `name_snapshot`, quantity, unit, pack size, weight, **restricted-item warning**), and a
    single confirm-handover action
27. **History** — completed handovers

### 8.1 The two delivery state machines

Both are rendered as an explicit stepper with a timestamp and actor per step, sourced from
`sales.order_status_history` + `sales.shipment`.

**Own delivery** (`delivery_type='own'`)
`confirmed → processing → shipped (dispatched) → assigned to delivery man → delivered
(handed to customer)`
The delivery man performs the final transition; nobody else can.

**Our delivery** (`delivery_type='partner'`)
`confirmed → processing → shipped (dispatched) → handed to platform delivery → delivered
(confirmed by platform)`
The company performs the handover-to-platform step; the final transition is **not the
company's to make** and its button is absent, not disabled — the UI must not imply the
company can mark a partner delivery complete.

---

## 9. Risks and open questions

**R1 — Coordinate capture depends on a third repo.** D3 puts the pin source in the Flutter
farmer app, outside both project paths. Until that ships, every order has null coordinates.
Mitigated by `precision: 'exact' | 'none'` in the contract and a mandatory address-only
fallback state. Not a blocker for Phase 1.

**R2 — Bilingual doubles copy surface.** ~300 admin-domain terms (discount stacking,
commission, settlement, waterfall) have no settled Bengali convention. Mitigation: the
build-time key-parity check, and Bengali review by the user before Phase 1 sign-off.

**R3 — Image authenticity cannot be automated reliably.** The brief asks whether automated
checks are feasible. Honest answer: **not to a standard worth trusting.** Reverse-image
search catches stock photos already on the web and EXIF/perceptual hashing catches reuse
*within* the platform — both cheap, both easily defeated. Neither can tell whether a photo
shows the actual item. The design therefore ships a **manual admin review flag**
(`image_review_status`) as the mechanism, with duplicate-hash detection as an assist that
raises the flag, never as the decision.

**R4 — Market Intelligence fights RLS.** 73 predicates filter on `SESSION_CONTEXT('org_id')`;
a company connection sees only its own rows. Whole-market aggregation needs a
`WITH EXECUTE AS` stored procedure returning **only aggregates above a k-anonymity floor**
(no per-competitor figures), following the pattern of migrations 015/017/019. This is Phase 2
work but is called out here because it is the single hardest server task, and because
"competitor density" must never become "here is what that specific company sells".

**O1 — Solution Center has no database backing.** No bundle table exists. The screen is in
the inventory because it was not on the removal list, but Phase 2 cannot deliver it without
new tables. Confirm: build it, or remove it alongside the other four?

---

## 10. Out of scope for Phase 1

Any C# file, any migration, any endpoint. Real network calls. The Flutter app. The
platform-admin (super_admin) review console — the brief says review is manual and ours;
the company-side portal only needs to *show* status.

---

## 11. Definition of done

1. All 27 screens build and render in both locales with no missing translation keys.
2. Every list screen renders loading, empty, error and populated states.
3. Every chart uses locale-aware tick formatting, and no screen repeats an encoding.
4. `can()` governs every write affordance; no screen hard-codes `disabled`.
5. Logging in as each of the three roles produces the correct shell and nav.
6. Contrast audit passes AA for all text, with the §6.2 rules enforced.
7. `data/contracts/` is complete enough to serve as the Phase 2 API contract.
