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
- [x] Database schema (cabinets, slots, transactions) - lib/schema.ts
- [x] Database connection - lib/db.ts
- [x] Initial migration (db:push ke Postgres lokal 5432)
- [x] Seeding data (50 cabinets, 600 slots, 20k transaksi)

## Phase 3: API Routes ✅
- [x] GET /api/cabinets (list with filter, search, sort, pagination)
- [x] GET /api/cabinets/[id] (detail with slots, transactions, chart)
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
- [x] Unit tests untuk schema & utils (82 tests: lib/validation.test.ts + lib/checkin/evaluateCheckin.test.ts + API routes + components)
- [x] Component tests (StatusBadge, CabinetTable, Sidebar, Topbar)
- [x] API route tests (cabinets, detail, export, transactions, dashboard — mock @/lib/db)
- [x] Code coverage ≥ 80% (All files: 96.9% statements, 86.11% branches, 92% functions)
- [x] Lint passing (bun run lint)
- [x] Type checking passing (bun run typecheck)
- [x] Build successful (bun run build)

## Phase 7: Deployment ⏳
- [x] Dockerize Next.js app (Dockerfile pakai oven/bun, COPY bun.lock, CMD bun run start)
- [x] Workflow CI/CD deploy.yml (lint, typecheck, test mock DB, build, validate compose)
- [x] Deploy ke VM via Cloudflare Tunnel: .env.prod manual di VM → up postgres → build → migrate → seed (hanya saat DB kosong) → up dashboard → health check
- [x] Verifikasi `docker compose build` lokal (image oven/bun sukses dengan flag streaming-install workaround)
- [ ] Deploy ke server staging
- [ ] Deploy ke server production

## Phase 8: Refactor & Cleanup ✅
- [x] Konsistensi package manager Bun (scripts bunx/bun, README, AGENTS, phase)
- [x] Dockerfile pindah ke base image oven/bun:1-alpine (build pakai bun.lock)
- [x] eslint.config.js tambah ignores (.next, coverage, drizzle, mockup, dll)
- [x] Alias script `seed` → `npm run seed` sesuai spek take-home
- [x] Postgres host mapping docker-compose 5432 (docker postgres dikhususkan untuk deploy VM; docs diselaraskan)
- [x] Restructure `components/ui/` per domain (Cabinet/, SlotGrid/ — tiap folder + test)
- [x] Extract SlotGrid dari page detail → `components/ui/SlotGrid` + test (66 total test)
- [x] Stale indicator cabinet OFFLINE (Asumsi #3: grid redup + banner saat OFFLINE)

> Catatan: Docker postgres (host 5432) dikhususkan untuk deploy VM; dev memakai Postgres lokal 5432.

---

## Phase 9: Transactions Filter ✅
- [x] Filter rentang tanggal (startDate/endDate) di API GET /api/transactions + export + validation (inclusive endDate)
- [x] Dropdown cabinet/cabang (param cabinetId) di halaman transactions — API sudah support, tinggal UI
- [x] Select status diperluas (Semua/Sukses/Gagal) — placeholder jaga-jaga (tabel belum punya kolom status)
- [x] Reset halaman ke 1 saat filter berubah
- [x] Tests: route date filter (valid + invalid 400) + page test baru (87 total test)

---

## Phase 10: Check-in & Swap Flow ✅
- [x] Schema: cabinets + `lat`/`lng`/`radiusM`, tabel `checkins` + enum `check_in_result`/`check_in_reason` (migration 0001)
- [x] Seed: 50 cabinets + koordinat/radius, 20 riwayat check-in dummy (campuran VALID/OUT_OF_RANGE/REJECTED)
- [x] POST /api/checkins (evaluateCheckIn → INSERT checkins) + GET /api/checkins (riwayat paginated)
- [x] POST /api/swaps (gate ketat: check-in VALID ≤ 15m, cabang cocok, slot FULL/EMPTY → INSERT tx + update slot)
- [x] Halaman /dashboard/checkins (demo: pilih cabinet target → prefill lat/lng → jarak real-time haversine → check-in → swap)
- [x] Menu Sidebar "Check-in"
- [x] Tests: routes checkins/swaps (6 skenario gate) + page (82 total test)
- [x] E2E nyata ke DB docker: VALID→swap 201, OUT_OF_RANGE, 403 tanpa check-in, REJECTED low accuracy
- [x] Docs (README, AGENTS) + verifikasi lint/typecheck/build

---

## Phase 11: Timezone Asia/Jakarta ✅
- [x] Helper `lib/time.ts` + test (jakartaDayStart/jakartaDayEndExclusive/jakartaDateKey/jakartaTodayStart/formatJakarta)
- [x] docker-compose: `TZ: Asia/Jakarta` (+ PGTZ) di postgres, `TZ: Asia/Jakarta` di dashboard
- [x] UI eksplisit WIB via `formatJakarta()` di 5 titik (CabinetTable, detail cabinet ×2, transactions, checkins)
- [x] Filter tanggal `/api/transactions` + export diinterpretasikan WIB (endDate inclusive)
- [x] KPI dashboard `jakartaTodayStart()` + label weeklyTrend WIB
- [x] Recreate container postgres (timezone Asia/Jakarta) + re-seed; verifikasi (92 total test)

---

## Phase 12: Future / Real-time ⏳
- [ ] Ganti polling 30 detik → WebSocket agar data real time
  - Titik polling saat ini: `components/ui/Cabinet/CabinetTable.tsx` (daftar) & `app/dashboard/cabinets/[id]/page.tsx` (detail), keduanya `setInterval 30s`
  - Arsitektur: Next 15 App Router belum punya WebSocket native → server WS terpisah (socket.io/ws) atau `pg LISTEN/NOTIFY` + push ke client
  - Perhatian deploy: koneksi long-lived melewati Cloudflare Tunnel (proxy timeout) perlu penanganan

---

## Statistik
- **Total Tasks:** 70
- **Completed:** 67
- **In Progress:** 0
- **Pending:** 3