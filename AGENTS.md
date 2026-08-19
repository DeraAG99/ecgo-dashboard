# AGENTS.md — ECGO Battery Swap Dashboard

## 🎯 TUJUAN
Buat dashboard internal untuk tim operasional ECGO memantau cabinet battery swap.

**Stack Wajib:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL 16 (Docker)
- Drizzle ORM
- Zod (validasi API)
- Recharts / Chart.js (grafik)
- @faker-js/faker (seed data)

---

## 📁 STRUKTUR FOLDER

app/
├── api/
│   └── dashboard/
│       ├── route.ts               # GET KPI overview
│       ├── cabinets/
│       │   ├── route.ts           # GET list (filter, search, sort, pagination)
│       │   ├── [id]/route.ts      # GET detail (slots, 20 transaksi, chart 24h)
│       │   ├── map/route.ts       # GET data peta (lat/lng/radiusM/status)
│       │   └── export/route.ts    # GET CSV export
│       ├── batteries/
│       │   ├── route.ts           # GET list baterai (filter, search, sort, pagination)
│       │   └── [id]/route.ts      # GET detail baterai
│       ├── checkins/
│       │   └── route.ts           # POST check-in (evaluateCheckIn) + GET riwayat
│       ├── swaps/
│       │   └── route.ts           # POST swap (gate ketat oleh check-in VALID 15m)
│       ├── alerts/
│       │   ├── route.ts           # GET list (+unread) · POST scan · PATCH mark all read
│       │   └── [id]/route.ts      # PATCH mark satu read
│       ├── maintenance/
│       │   ├── work-orders/
│       │   │   ├── route.ts       # GET list (filter) · POST buat manual atau dari alert
│       │   │   └── [id]/route.ts  # PATCH assign / selesaikan → INSERT maintenance_logs
│       │   ├── cabinets/[id]/route.ts # PATCH SET_<STATUS> (ONLINE/OFFLINE/MAINTENANCE)
│       │   ├── slots/[id]/route.ts    # PATCH RESET → EMPTY
│       │   ├── batteries/[id]/route.ts# PATCH REACTIVATE → AVAILABLE · RETIRE → RETIRED
│       │   ├── logs/route.ts      # GET riwayat maintenance (paginated)
│       │   └── summary/route.ts   # GET KPI maintenance (openWO, inProgress, done7d, dsb)
│       ├── forecast/route.ts      # GET proyeksi swap (branch?, days 1-14)
│       └── transactions/
│           ├── route.ts           # GET list transaksi (filter, pagination)
│           └── export/route.ts    # GET CSV export
├── dashboard/
│   ├── page.tsx                   # Overview / KPI
│   ├── map/page.tsx + layout.tsx  # Peta cabinet (Leaflet; metadata di layout.tsx karena page client; CabinetMap import "leaflet/dist/leaflet.css" + invalidateSize)
│   ├── cabinets/
│   │   ├── page.tsx               # Daftar Cabinet (CabinetTable)
│   │   └── [id]/page.tsx          # Detail Cabinet (SlotGrid dari components/ui/SlotGrid, chart & TransactionList inline)
│   ├── batteries/
│   │   ├── page.tsx               # Daftar baterai (BatteryTable)
│   │   └── [id]/page.tsx          # Detail baterai (riwayat swap tampilkan {branch} ({cabinetCode}))
│   ├── alerts/page.tsx            # Notifikasi (AlertList)
│   ├── forecast/page.tsx          # Perkiraan permintaan (ForecastChart)
│   ├── checkins/page.tsx          # Demo check-in → swap (target cabinet, radius, riwayat)
│   ├── maintenance/page.tsx      # Halaman Maintenance (tabs: summary/work-orders/cabinets/slots/batteries/logs)
│   └── transactions/page.tsx      # Riwayat transaksi
├── page.tsx                       # Redirect ke /dashboard
├── layout.tsx + globals.css
components/
├── layout/   (DashboardLayout, Sidebar, Topbar + AlertBell di Topbar)
├── shared/   (LoadingSpinner, ErrorMessage, StatusBadge)
└── ui/       (per domain: Cabinet/, Battery/, Alert/, Forecast/, SlotGrid/, Maintenance/ dst.)
lib/
├── alerts/   (index.ts barrel, scanAlerts.ts + test — deteksi 4 tipe alert + dedupe unresolved)
├── checkin/  (index.ts barrel, evaluateCheckin.ts + test — Bagian C; export haversine & tipe Branch/CheckIn/Result)
├── maintenance/ (index.ts barrel, createFromAlert.ts, entities.ts, log.ts + test — buat WO dari alert, resolve label entitas, catat log, map prioritas)
├── db/
│   ├── index.ts    # Koneksi database (Drizzle)
│   └── schema.ts   # Schema Drizzle
├── time/
│   ├── index.ts    # Barrel re-export
│   ├── wib.ts      # Helper WIB (Asia/Jakarta): wibStartOfDay, wibEndOfDayExclusive, wibDateKey, wibTodayStart, formatWIB
│   ├── wib.sql.ts  # SQL helpers: wibDateKey (SQL), wibHour, wibDow, wibDayTrunc, wibNowDayStart
│   └── *.test.ts   # Tests
├── validation/
│   ├── index.ts    # Schema Zod terpusat
│   └── schemas.test.ts
├── schema.ts       # Backward-compat re-export (export * from './db/schema')
└── test-utils.ts   # Helper mock untuk test
drizzle/
├── migrations/
└── seed.ts   # Seed 50 cabinets (+lat/lng/radiusM), 600 slots, 1000 baterai, 20k transaksi, 20 check-ins, 30 alerts, work orders
types/index.ts
mockup/        # Design mockups (static HTML + screenshot)
docs/          # Soal, jawaban, tracker
.github/workflows/deploy.yml
.env.local
docker-compose.yml
Dockerfile
drizzle.config.ts
next.config.ts
tailwind.config.ts
vitest.config.ts
package.json
README.md
AGENTS.md
todo.md
phase.md

---

## 🗄️ DATABASE SCHEMA

### Status Enum
- ONLINE, OFFLINE, MAINTENANCE

### Slot State Enum
- EMPTY, CHARGING, FULL, LOCKED, FAULT

### Check-in Enums
- `check_in_result`: VALID, OUT_OF_RANGE, REJECTED
- `check_in_reason`: LOW_ACCURACY, INVALID_COORDINATE, NO_BRANCH_ASSIGNED

### Battery Enum
- `battery_status`: AVAILABLE, IN_USE, CHARGING, FAULT, RETIRED

### Alert Enums
- `alert_type`: CABINET_OFFLINE, SLOT_FAULT, BATTERY_LOW, SWAP_ANOMALY
- `alert_severity`: INFO, WARNING, CRITICAL

### Check-in Flow (Fitur tambahan)
- `cabinets` punya kolom `lat`, `lng`, `radiusM` (target geofence).
- Tabel `checkins`: riwayat hasil `evaluateCheckIn` (VALID/OUT_OF_RANGE/REJECTED).
- `POST /api/dashboard/swaps` **hanya jalan** bila ada check-in VALID ≤ 15 menit utk user tsb **dan** cabang cabinet = cabang check-in; lalu INSERT transaksi (`tx-...`, battery `BATT-XXXXXXXX`) + update slot `FULL→EMPTY`, `EMPTY→CHARGING`.
- Note tipe: `lib/db/schema.ts` dan `lib/checkin/evaluateCheckin.ts` sama-sama mengekspor tipe `CheckIn` → alias saat import dua-duanya.

### Alerts (Fitur tambahan)
- `lib/alerts/scanAlerts.ts` mendeteksi 4 tipe: CABINET_OFFLINE (status OFFLINE→CRITICAL / MAINTENANCE→WARNING), SLOT_FAULT (state FAULT/LOCKED), BATTERY_LOW (health < 20), SWAP_ANOMALY (swap 24h > 2.5× rata-rata harian).
- Dedupe: alert baru dibuat hanya jika **belum ada alert unresolved** untuk kombinasi `type + entityId` (scanAlerts pakai raw SQL `NOT EXISTS`).

### Maintenance (Fitur tambahan)
- Tabel `work_orders`: `id, alert_id (FK alerts SET NULL), entity_type (CABINET/SLOT/BATTERY), entity_id, entity_label, title, description, priority (LOW/MEDIUM/HIGH), status (OPEN/IN_PROGRESS/DONE), assigned_to, notes, created_at, updated_at, completed_at`.
- Tabel `maintenance_logs`: `id, entity_type, entity_id, entity_label, action, description, created_by, created_at`.
- Alur: `PATCH /api/dashboard/maintenance/work-orders/[id]` dengan `{ action: "ASSIGN", assignedTo }` / `{ action: "COMPLETE", notes }` → jika status jadi DONE, isi `completed_at`; setiap PATCH yang mengubah state → INSERT `maintenance_logs` via `lib/maintenance/log.ts`.
- `POST /api/dashboard/maintenance/work-orders` menerima `source: "manual"` (isi langsung) atau `source: "alert"` (dari `alertId` via `lib/maintenance/createFromAlert.ts`, tarik label via `entities.ts`).

---

## 📡 API ENDPOINTS

### GET /api/dashboard/cabinets
Query params: `search`, `status`, `page`, `limit`, `sortBy`, `sortOrder`
Response: `{ id, code, branch, status, filledSlots, totalSlots, swapCount24h, lastHeartbeat }[]` + pagination

### GET /api/dashboard/cabinets/:id
Response: Cabinet detail with slots, 24h transactions, chart data

### GET /api/dashboard/cabinets/map
Response: `{ id, code, branch, status, lat, lng, radiusM, filledSlots, totalSlots }[]` (untuk Leaflet)

### GET /api/dashboard/batteries
Query params: `search`, `status`, `minHealth`, `sortBy`, `sortOrder`, `page`, `limit`
Response: `{ id, batteryCode, status, cycleCount, health, cabinetId, cabinetCode, branch, lastSwapAt }[]` + pagination

### GET /api/dashboard/batteries/:id
Response: Battery detail

### GET /api/dashboard/forecast
Query params: `branch` (kode cabinet), `days` (1-14, default 7)
Response: `{ branch, days, totalActual, totalPredicted, avgPerDayActual, avgPerDayPredicted, peakHour, historicalDaily, forecastDaily, hourlyPattern, byCabinet }`. Prediksi = profil rata-rata `dow`+`hour` (window 60 hari) di-scale rata-rata harian aktual; tanggal prediksi mulai besok WIB.

### GET /api/dashboard/alerts
Query params: `type`, `severity`, `read`, `page`, `limit` → `{ data, total, totalPages, unread }`

### POST /api/dashboard/alerts
Jalankan scan (`lib/alerts/scanAlerts.ts`) → `{ scanned, created }`

### PATCH /api/dashboard/alerts
Mark **semua** read → `{ updated }`

### PATCH /api/dashboard/alerts/:id
Mark **satu** read

### POST /api/dashboard/checkins
Body (Zod `checkInSchema`): `{ userId, lat, lng, accuracyM }` → panggil `evaluateCheckIn` → INSERT ke `checkins` → 201 `{ checkIn, result }`

### GET /api/dashboard/checkins
Query params: `userId`, `result`, `page`, `limit` → riwayat paginated (LEFT JOIN cabinets utk info cabang)

### POST /api/dashboard/swaps
Body (Zod `swapSchema`): `{ userId, cabinetId }`. Gate: check-in VALID ≤ 15m (`403`) → cabinet ada (`404`) → cabang cocok (`403`) → slot FULL≥1 & EMPTY≥1 (`409`) → sukses 201 `{ transaction, slotChanges }`

### GET /api/dashboard/maintenance/work-orders
Query params: `status`, `page`, `limit` → `{ data, total, totalPages }` (urut updated_at desc)

### POST /api/dashboard/maintenance/work-orders
Body (Zod `workOrderSchema`): `{ source: "manual" | "alert", title, description?, entityType?, entityId?, priority? }` atau `{ source: "alert", alertId }` → 201 `{ workOrder }`

### PATCH /api/dashboard/maintenance/work-orders/:id
Body: `{ action: "ASSIGN", assignedTo }` / `{ action: "COMPLETE", notes }` → update WO (DONE → isi `completed_at`) + INSERT `maintenance_logs`

### PATCH /api/dashboard/maintenance/cabinets/:id
Body: `{ action: "SET_ONLINE" | "SET_OFFLINE" | "SET_MAINTENANCE", reason? }` → update status + log

### PATCH /api/dashboard/maintenance/slots/:id
Body: `{ action: "RESET", reason? }` → slot `→ EMPTY` + log

### PATCH /api/dashboard/maintenance/batteries/:id
Body: `{ action: "REACTIVATE" | "RETIRE", reason? }` → status → AVAILABLE/RETIRED + log

### GET /api/dashboard/maintenance/logs
Query params: `page`, `limit` → `{ data, total, totalPages }`

### GET /api/dashboard/maintenance/summary
→ `{ openWO, inProgress, done7d, lowBattery, workOrderByPriority, recentLogs }`

---

## 🚀 DEVELOPMENT COMMANDS

```bash
# Setup (dev: Postgres Windows lokal port 5432, bukan Docker)
bun install
# PowerShell: set DATABASE_URL inline karena drizzle-kit tidak membaca .env.local
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/ecgo_dashboard"; bun run db:migrate
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/ecgo_dashboard"; bun run db:seed   # atau: npm run seed

# Development
bun run dev            # http://localhost:3000

# Quality checks
bun run lint
bun run typecheck
bun run test           # vitest (watch); gunakan "bunx vitest run" untuk sekali jalan / CI

# Build & Start
bun run build
bun run start
```

> ⚠️ **docker-compose.yml membaca credential hanya dari file `.env.prod`** (gitignored, tidak di-commit). File ini disiapkan **manual sekali di VM** (`cp .env.example .env.prod` lalu isi). Workflow `deploy.yml` tinggal memakainya: `up postgres` → `db:migrate` → `db:seed` (hanya saat DB kosong) → `up dashboard`. Untuk testing lokal, `cp .env.example .env.prod` lalu isi nilai secara manual.

---

## 🔑 KONFINAN DATABASE

- **Dev:** PostgreSQL Windows lokal `localhost:5432` (bukan Docker) — user/password `postgres/password`
- **VM/Docker:** container `postgres:5432` (internal), di-mapping ke host `5432` — credential dari `.env.prod`

| Mode | Host | Port | Database | User | Password |
|------|------|------|----------|------|----------|
| Dev | localhost | 5432 | ecgo_dashboard | postgres | password |
| VM (Docker) | localhost (host mapping) | 5432 | ecgo_dashboard | postgres | dari `.env.prod` |

---

## 🕐 TIMEZONE (Asia/Jakarta)

- **Zona tunggal:** WIB (UTC+7). Semua kolom waktu di DB memakai `timestamptz`; data disimpan sebagai UTC, dikonversi ke WIB saat query/display.
- **docker-compose.yml** menyetel `TZ: Asia/Jakarta` (+ `PGTZ: Asia/Jakarta`) di service `postgres` dan `TZ: Asia/Jakarta` di service `dashboard`.
- **UI** merender semua waktu via `formatWIB()` dari `lib/time/wib.ts` (paksa `timeZone: "Asia/Jakarta"` eksplisit, bukan default browser). Dipakai di: `CabinetTable.tsx`, `cabinets/[id]/page.tsx` (×2), `transactions/page.tsx`, `checkins/page.tsx`, `AlertList.tsx`, `AlertBell.tsx`.
- **Filter tanggal** `/api/dashboard/transactions` + export diinterpretasikan sebagai **WIB** (via `wibStartOfDay`/`wibEndOfDayExclusive`; `endDate` inclusive).
- **SQL helpers** (`lib/time/wib.sql.ts`): `wibDateKey`, `wibHour`, `wibDow`, `wibDayTrunc`, `wibNowDayStart` — pakai `AT TIME ZONE 'Asia/Jakarta'` untuk konversi di level PostgreSQL.
- **KPI dashboard** "swap hari ini" pakai `wibTodayStart()` dan label `weeklyTrend` pakai `wibDateKey()` — tidak bergantung timezone host/server.
- ⚠️ **Ganti TZ → wajib re-seed** (data lama akan tergeser offset). Saat deploy ulang setelah ubah TZ, hapus/seed ulang DB.

---

## 🧪 TESTING

```bash
bun run test              # Run tests
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage report
```

- **219 test** (vitest + happy-dom + @testing-library). Coverage saat ini 96.27% lines/statements, 76.24% branches, 80.45% functions (threshold: 80/70/80/80).
- Test API route memakai mock `@/lib/db` (tidak butuh Postgres). Verifikasi live: Docker Postgres port 5432 + `bun run dev`/`bun run build && bun run start`.
- ⚠️ **Mock query chain maintenance:** test route PATCH `[id]` yang memakai `dbMock` + mock lib (mis. `addMaintenanceLog`) **wajib** `beforeEach(() => { vi.resetAllMocks(); <libMock>.mockResolvedValue(undefined); ... })` — `vi.clearAllMocks()` **tidak** menghapus antrian `mockReturnValueOnce`, sehingga nilai once dari test sebelumnya bocor ke test berikutnya. `resetAllMocks` juga menghapus implementasi mock lib, jadi defaultnya harus di-set ulang di beforeEach.

> ⚠️ **Next.js 15:** page yang `"use client"` **tidak boleh** `export const metadata` — pindahkan ke `layout.tsx` segment tsb (contoh: `app/dashboard/map/page.tsx` client → metadata ada di `app/dashboard/map/layout.tsx`).

---

## 📋 IMPLEMENTATION ORDER

1. Docker + PostgreSQL setup
2. Drizzle ORM + migrations
3. API routes (cabinets, transactions)
4. UI components
5. Seeding data
6. Testing & lint
7. Fitur tambahan: Map → Batteries → Forecast → Alerts → Maintenance (semua ✅)

---

## ⚠️ PENTING DARI SOAL

- **Sorting di Halaman 1:** Sorting berdasarkan swapCount24h (default desc)
- **filledSlots:** Slot dengan state FULL atau CHARGING
- **swap 24h:** Rolling 24 jam dari waktu request
- **Last Heartbeat:** null = OFFLINE
- **Offset Pagination:** Backend, alasan di README.md

---

## 📦 DEPENDENCIES

Daftar dependency selalu lihat `package.json` (jangan hardcode versi di sini agar tidak drift). Inti: Next.js 15, React 18, drizzle-orm + pg, zod, recharts, @faker-js/faker, tailwindcss; dev: vitest + happy-dom + @testing-library, drizzle-kit, typescript, eslint, bun sebagai package manager (file lock: `bun.lock`).

> ⚠️ **Workaround:** Dockerfile & job CI `deploy.yml` set `BUN_FEATURE_FLAG_DISABLE_STREAMING_INSTALL=1`. Ini workaround untuk bug streaming tarball extraction bun ≥ 1.3.13 (error `Fail extracting tarball for next`) yang tidak stabil di Docker. **Hapus** flag + komentar ini begitu bun rilis "streaming install stability fix" (cek release notes; perkiraan ≥ 1.3.15).

---

## 🚀 CI/CD

`.github/workflows/deploy.yml` sudah selesai: CI (lint, typecheck, test dengan mock DB, build) + deploy ke VM via Cloudflare Tunnel dengan urutan `up postgres` → `build` → `db:migrate` → `db:seed` (hanya saat DB kosong) → `up dashboard`. Pastikan secrets di GitHub repository secrets (Environment: production): `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PRIVATE_KEY_FILENAME`, `SSH_PORT`, `POSTGRES_PASSWORD`, dan repo var `APP_DIR`.