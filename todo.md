# Progress Tracker - ECGO Battery Swap Dashboard

## Phase 1: Infrastructure ✅
- [x] Project scaffold Next.js 15 App Router
- [x] Tailwind CSS configuration
- [x] TypeScript strict mode (tsconfig.json)
- [x] Docker PostgreSQL configuration (docker-compose.yml)
- [x] Environment files (.env.example)
- [x] ESLint & Prettier configuration

## Phase 2: Database Setup ✅
- [x] Drizzle ORM configuration (drizzle.config.ts)
- [x] Database schema (cabinets, slots, transactions) - lib/db/schema.ts
- [x] Database connection - lib/db/index.ts
- [x] Initial migration (db:push ke Postgres lokal 5432)
- [x] Seeding data (50 cabinets, 600 slots, 20k transaksi)

## Phase 3: API Routes ✅
- [x] GET /api/dashboard/cabinets (list with filter, search, sort, pagination)
- [x] GET /api/dashboard/cabinets/[id] (detail with slots, transactions, chart)
- [x] Zod validation untuk semua endpoint
- [x] Error handling standar

## Phase 4: UI Components ✅
- [x] CabinetTable.tsx (daftar cabinet dengan pagination)
- [x] LoadingSpinner.tsx
- [x] ErrorMessage.tsx
- [x] SlotGrid.tsx (integrasi dalam page.tsx)
- [x] SwapChart.tsx (integrasi dalam page.tsx)
- [x] TransactionList.tsx (integrasi dalam page.tsx)

## Phase 5: Pages ✅
- [x] app/dashboard/page.tsx (overview - KPI dashboard)
- [x] app/dashboard/cabinets/page.tsx (daftar cabinet)
- [x] app/dashboard/cabinets/[id]/page.tsx (detail cabinet)
- [x] app/dashboard/transactions/page.tsx (riwayat transaksi)
- [x] app/layout.tsx
- [x] app/globals.css

## Phase 6: Quality & Testing ✅
- [x] Vitest configuration (vitest.config.ts)
- [x] Unit tests untuk schema & utils (82 tests: lib/validation/schemas.test.ts + lib/checkin/evaluateCheckin.test.ts + API routes + components)
- [x] Component tests (StatusBadge, CabinetTable, Sidebar, Topbar)
- [x] API route tests (cabinets, detail, export, transactions, dashboard — mock @/lib/db)
- [x] Code coverage ≥ 80% (All files: 96.9% statements, 86.11% branches, 92% functions)
- [x] Lint passing (bun run lint)
- [x] Type checking passing (bun run typecheck)
- [x] Build successful (bun run build)

## Phase 7: Deployment ✅
- [x] Dockerize Next.js app (Dockerfile pakai oven/bun, COPY bun.lock, CMD bun run start)
- [x] Workflow CI/CD deploy.yml (lint, typecheck, test mock DB, build, validate compose)
- [x] Deploy ke production VM via Cloudflare Tunnel: .env.prod manual di VM → up postgres → build → migrate → seed (hanya saat DB kosong) → up dashboard → health check
- [x] Verifikasi `docker compose build` lokal (image oven/bun sukses dengan flag streaming-install workaround)

## Phase 8: Refactor & Cleanup ✅
- [x] Konsistensi package manager Bun (scripts bunx/bun, README, AGENTS, phase)
- [x] Dockerfile pindah ke base image oven/bun:1-alpine (build pakai bun.lock)
- [x] eslint.config.js tambah ignores (.next, coverage, drizzle, mockup, dll)
- [x] Alias script `seed` → `npm run seed` sesuai spek take-home
- [x] Postgres host mapping docker-compose 5432 (docker postgres dikhususkan untuk deploy VM; docs diselaraskan)
- [x] Restructure `components/ui/` per domain (Cabinet/, SlotGrid/ — tiap folder + test)
- [x] Extract SlotGrid dari page detail → `components/ui/SlotGrid` + test (66 total test)
- [x] Stale indicator cabinet OFFLINE (Asumsi #3: grid redup + banner saat OFFLINE)

---

## Phase 18: Timezone Bug Fix Post-Migration (2026-08-16)
- [x] MIGRATION FIX: Inline timezone `'Asia/Jakarta'` as SQL literal (not parameter) in `lib/time/wib.sql.ts` to fix GROUP BY parameter mismatch after timestamp→timestamptz migration
  - Root cause: Each call to `wibDateKey()` created separate SQL with different parameter indices ($1 vs $3)
  - Fix: Use raw SQL literal `'Asia/Jakarta'` instead of parameter → identical expressions in SELECT & GROUP BY
- [x] Fix `/api/dashboard/dashboard` 500 error (error: "column must appear in GROUP BY")
- [x] Fix `/api/dashboard/cabinets/[id]` GROUP BY parameter mismatch for `wibHour`
- [x] Fix `/api/dashboard/forecast` GROUP BY parameter mismatch for `wibDayTrunc`, `wibDow`, `wibHour`
- [x] Update tests in `lib/time/wib.sql.test.ts` to expect inline timezone literals (no params)
- [x] Verify all API endpoints work correctly

---

## Phase 19: Lib Folder Restructuring ✅ (2026-08-19)
- [x] Create `lib/time/` folder: group `time.ts` + `time-sql.ts` → `wib.ts` + `wib.sql.ts` + `index.ts`
- [x] Rename functions: `jakartaDayStart` → `wibStartOfDay`, `jakartaDayEndExclusive` → `wibEndOfDayExclusive`, `jakartaDateKey` → `wibDateKey`, `jakartaTodayStart` → `wibTodayStart`, `formatJakarta` → `formatWIB`
- [x] Bug fix: `wibStartOfDay`/`wibEndOfDayExclusive` sekarang benar untuk Date apapun (sebelumnya hanya benar jika input UTC midnight)
- [x] Create `lib/db/` folder: group `db.ts` → `db/index.ts` + `db/schema.ts`
- [x] Backward-compat re-export: `lib/schema.ts` → `export * from './db/schema'`
- [x] Create `lib/validation/` folder: group `validation.ts` → `validation/index.ts` + `validation/schemas.test.ts`
- [x] Add barrel `index.ts` to `lib/alerts/`, `lib/checkin/`, `lib/maintenance/`
- [x] Update all 18+ callers (4 API routes + 13 UI components + 1 time-sql import)
- [x] Delete old loose files from `lib/` root
- [x] Update tests (`wib.test.ts`, `wib.sql.test.ts`)
- [x] Verify: 219 tests pass, typecheck clean, lint clean

---

## Phase 9: Transactions Filter ✅
- [x] Filter rentang tanggal (startDate/endDate) di API GET /api/dashboard/transactions + export + validation (inclusive endDate)
- [x] Dropdown cabinet/cabang (param cabinetId) di halaman transactions — API sudah support, tinggal UI
- [x] Select status diperluas (Semua/Sukses/Gagal) — placeholder jaga-jaga (tabel belum punya kolom status)
- [x] Reset halaman ke 1 saat filter berubah
- [x] Tests: route date filter (valid + invalid 400) + page test baru (87 total test)

---

## Phase 10: Check-in & Swap Flow ✅
- [x] Schema: cabinets + `lat`/`lng`/`radiusM`, tabel `checkins` + enum `check_in_result`/`check_in_reason` (migration 0001)
- [x] Seed: 50 cabinets + koordinat/radius, 20 riwayat check-in dummy (campuran VALID/OUT_OF_RANGE/REJECTED)
- [x] POST /api/dashboard/checkins (evaluateCheckIn → INSERT checkins) + GET /api/dashboard/checkins (riwayat paginated)
- [x] POST /api/dashboard/swaps (gate ketat: check-in VALID ≤ 15m, cabang cocok, slot FULL/EMPTY → INSERT tx + update slot)
- [x] Halaman /dashboard/checkins (demo: pilih cabinet target → prefill lat/lng → jarak real-time haversine → check-in → swap)
- [x] Menu Sidebar "Check-in"
- [x] Tests: routes checkins/swaps (6 skenario gate) + page (82 total test)
- [x] E2E nyata ke DB docker: VALID→swap 201, OUT_OF_RANGE, 403 tanpa check-in, REJECTED low accuracy
- [x] Docs (README, AGENTS) + verifikasi lint/typecheck/build

---

## Phase 11: Timezone Asia/Jakarta ✅
- [x] Helper `lib/time/wib.ts` + test (wibStartOfDay/wibEndOfDayExclusive/wibDateKey/wibTodayStart/formatWIB)
- [x] docker-compose: `TZ: Asia/Jakarta` (+ PGTZ) di postgres, `TZ: Asia/Jakarta` di dashboard
- [x] UI eksplisit WIB via `formatWIB()` di 5 titik (CabinetTable, detail cabinet ×2, transactions, checkins)
- [x] Filter tanggal `/api/dashboard/transactions` + export diinterpretasikan WIB (endDate inclusive)
- [x] KPI dashboard `wibTodayStart()` + label weeklyTrend WIB
- [x] Recreate container postgres (timezone Asia/Jakarta) + re-seed; verifikasi (92 total test)

---

## Phase 13: Map View ✅
- [x] GET /api/dashboard/cabinets/map (data lat/lng/radiusM/status untuk peta)
- [x] components/ui/Cabinet/CabinetMap.tsx (Leaflet, marker per status, circle geofence, popup info)
- [x] Halaman /dashboard/map (auto-refresh 30s, dynamic import ssr:false)
- [x] Menu Sidebar "Peta" + Topbar title
- [x] Tests: CabinetMap (2) + route map (3)
- [x] Fix tile tidak ter-load (kotak abu-abu): import `leaflet/dist/leaflet.css` + `invalidateSize` (rAF & window resize) + `zoomAnimation:false`; map dibuat sekali (tidak recreate tiap refresh 30s)

---

## Phase 14: Battery Management ✅
- [x] Schema tabel `batteries` + enum `battery_status` (migration 0002)
- [x] Seed 1000 baterai (status, cycleCount, health, cabinet assignment)
- [x] GET /api/dashboard/batteries (filter status/search/health, sort, pagination) + GET /api/dashboard/batteries/[id]
- [x] Halaman /dashboard/batteries + detail [id]; link kode baterai di riwayat transaksi
- [x] Riwayat swap di detail baterai tampilkan lokasi: `{branch} ({cabinetCode})` (API sudah return branch)
- [x] Tests: route batteries + detail (8) + halaman (8)

---

## Phase 15: Demand Forecasting ✅
- [x] GET /api/dashboard/forecast (`branch?`, `days` 1-14, default 7) — profil per jam (dow+hour, window 60 hari), prediksi harian WIB, rata-rata per cabinet
- [x] Halaman /dashboard/forecast + ForecastChart (Recharts: bar aktual vs prediksi, line pola per jam, KPI cards, tabel per cabinet)
- [x] Menu Sidebar "Forecast" + Topbar title
- [x] Tests route forecast (4) + ForecastChart (4)
- [x] Verifikasi live terhadap Docker DB (200; totalActual 4942, totalPredicted 4375, peakHour 11:00)

---

## Phase 16: Alert & Notifications ✅
- [x] Schema tabel `alerts` + enum `alert_type`/`alert_severity` + index (migration 0003)
- [x] lib/alerts/scanAlerts.ts — deteksi 4 tipe (CABINET_OFFLINE, SLOT_FAULT, BATTERY_LOW, SWAP_ANOMALY) + dedupe alert unresolved
- [x] GET /api/dashboard/alerts (list, filter, unread count), POST /api/dashboard/alerts (scan), PATCH /api/dashboard/alerts (mark all read), PATCH /api/dashboard/alerts/[id] (mark satu read)
- [x] Halaman /dashboard/alerts (filter severity/type, daftar, tombol scan & tandai dibaca)
- [x] AlertBell di Topbar (badge unread + dropdown, poll 30s)
- [x] Menu Sidebar "Notifications" + Topbar title
- [x] Seed 30 alert dummy (clearData hapus alerts duluan)
- [x] Tests: scanAlerts (5), route alerts (8), route alerts/[id] (3), AlertList (7), AlertBell (4), DashboardLayout (1)

---

## Phase 17: Maintenance ✅
- [x] Schema tabel `work_orders` (13 kolom, FK alert_id → alerts.id SET NULL) + `maintenance_logs` (7 kolom) (migration 0004)
- [x] Seed work orders dari alert/status + maintenance log awal
- [x] API: GET/POST /api/dashboard/maintenance/work-orders, GET/PATCH /api/dashboard/maintenance/work-orders/[id] (assign, selesaikan, catat log), PATCH /api/dashboard/maintenance/cabinets/[id], PATCH /api/dashboard/maintenance/slots/[id], PATCH /api/dashboard/maintenance/batteries/[id], GET /api/dashboard/maintenance/logs, GET /api/dashboard/maintenance/summary
- [x] lib/maintenance: createWorkOrderFromAlert, resolveEntityForLog, addMaintenanceLog, mapAlertPriority
- [x] Halaman /dashboard/maintenance (tabs: summary, work-orders, cabinets, slots, batteries, logs) + komponen UI per domain + WorkOrderDialog
- [x] Menu Sidebar "Maintenance" + Topbar title
- [x] Tests: lib/maintenance (12), route maintenance (19), komponen Maintenance (26) — total 211 test
- [x] Coverage ≥ threshold: All files Stmts 96.27, Branch 76.24, Funcs 80.45, Lines 96.27

---

## Phase 12: Future / Real-time ⏳
- [ ] Ganti polling 30 detik → WebSocket agar data real time
  - Titik polling saat ini: `components/ui/Cabinet/CabinetTable.tsx` (daftar) & `app/dashboard/cabinets/[id]/page.tsx` (detail), keduanya `setInterval 30s`
  - Arsitektur: Next 15 App Router belum punya WebSocket native → server WS terpisah (socket.io/ws) atau `pg LISTEN/NOTIFY` + push ke client
  - Perhatian deploy: koneksi long-lived melewati Cloudflare Tunnel (proxy timeout) perlu penanganan

---

## Statistik
- **Total Tasks:** 115
- **Completed:** 115
- **In Progress:** 0
- **Pending:** 0