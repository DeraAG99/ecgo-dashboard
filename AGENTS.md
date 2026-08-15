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
│   ├── cabinets/
│   │   ├── route.ts               # GET list (filter, search, sort, pagination)
│   │   ├── [id]/route.ts          # GET detail (slots, 20 transaksi, chart 24h)
│   │   └── export/route.ts        # GET CSV export
│   ├── checkins/
│   │   └── route.ts               # POST check-in (evaluateCheckIn) + GET riwayat
│   ├── swaps/
│   │   └── route.ts               # POST swap (gate ketat oleh check-in VALID 15m)
│   ├── dashboard/route.ts         # GET KPI overview
│   └── transactions/
│       ├── route.ts               # GET list transaksi (filter, pagination)
│       └── export/route.ts        # GET CSV export
├── dashboard/
│   ├── page.tsx                   # Overview / KPI
│   ├── cabinets/
│   │   ├── page.tsx               # Daftar Cabinet (CabinetTable)
│   │   └── [id]/page.tsx          # Detail Cabinet (SlotGrid dari components/ui/SlotGrid, chart & TransactionList inline)
│   ├── checkins/page.tsx          # Demo check-in → swap (target cabinet, radius, riwayat)
│   └── transactions/page.tsx      # Riwayat transaksi
├── page.tsx                       # Redirect ke /dashboard
├── layout.tsx + globals.css
components/
├── layout/   (DashboardLayout, Sidebar, Topbar)
├── shared/   (LoadingSpinner, ErrorMessage, StatusBadge)
└── ui/       (per domain: Cabinet/, SlotGrid/ dst.)
lib/
├── checkin/  (evaluateCheckin.ts + test — Bagian C; export haversine & tipe Branch/CheckIn/Result)
├── db.ts     # Koneksi database (Drizzle)
├── schema.ts # Schema Drizzle
├── time.ts   # Helper WIB (Asia/Jakarta): dayStart, dayEndExclusive, dateKey, todayStart, formatJakarta
├── validation.ts  # Schema Zod terpusat
└── test-utils.ts  # Helper mock untuk test
drizzle/
├── migrations/
└── seed.ts   # Seed 50 cabinets (+lat/lng/radiusM), 600 slots, 20k transaksi, 20 check-ins
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

### Check-in Flow (Fitur tambahan)
- `cabinets` punya kolom `lat`, `lng`, `radiusM` (target geofence).
- Tabel `checkins`: riwayat hasil `evaluateCheckIn` (VALID/OUT_OF_RANGE/REJECTED).
- `POST /api/swaps` **hanya jalan** bila ada check-in VALID ≤ 15 menit utk user tsb **dan** cabang cabinet = cabang check-in; lalu INSERT transaksi (`tx-...`, battery `BATT-XXXXXXXX`) + update slot `FULL→EMPTY`, `EMPTY→CHARGING`.
- Note tipe: `lib/schema.ts` dan `lib/checkin/evaluateCheckin.ts` sama-sama mengekspor tipe `CheckIn` → alias saat import dua-duanya.

---

## 📡 API ENDPOINTS

### GET /api/cabinets
Query params: `search`, `status`, `page`, `limit`, `sortBy`, `sortOrder`
Response: `{ id, code, branch, status, filledSlots, totalSlots, swapCount24h, lastHeartbeat }[]` + pagination

### GET /api/cabinets/:id
Response: Cabinet detail with slots, 24h transactions, chart data

### POST /api/checkins
Body (Zod `checkInSchema`): `{ userId, lat, lng, accuracyM }` → panggil `evaluateCheckIn` → INSERT ke `checkins` → 201 `{ checkIn, result }`

### GET /api/checkins
Query params: `userId`, `result`, `page`, `limit` → riwayat paginated (LEFT JOIN cabinets utk info cabang)

### POST /api/swaps
Body (Zod `swapSchema`): `{ userId, cabinetId }`. Gate: check-in VALID ≤ 15m (`403`) → cabinet ada (`404`) → cabang cocok (`403`) → slot FULL≥1 & EMPTY≥1 (`409`) → sukses 201 `{ transaction, slotChanges }`

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

- **Zona tunggal:** WIB (UTC+7). Semua kolom waktu di DB memakai `timestamp` tanpa timezone; data disimpan sebagai wall time WIB.
- **docker-compose.yml** menyetel `TZ: Asia/Jakarta` (+ `PGTZ: Asia/Jakarta`) di service `postgres` dan `TZ: Asia/Jakarta` di service `dashboard`.
- **UI** merender semua waktu via `formatJakarta()` dari `lib/time.ts` (paksa `timeZone: "Asia/Jakarta"` eksplisit, bukan default browser). Dipakai di: `CabinetTable.tsx`, `cabinets/[id]/page.tsx` (×2), `transactions/page.tsx`, `checkins/page.tsx`.
- **Filter tanggal** `/api/transactions` + export diinterpretasikan sebagai **WIB** (via `jakartaDayStart`/`jakartaDayEndExclusive`; `endDate` inclusive).
- **KPI dashboard** "swap hari ini" pakai `jakartaTodayStart()` dan label `weeklyTrend` pakai `jakartaDateKey()` — tidak bergantung timezone host/server.
- ⚠️ **Ganti TZ → wajib re-seed** (data lama akan tergeser offset). Saat deploy ulang setelah ubah TZ, hapus/seed ulang DB.

---

## 🧪 TESTING

```bash
bun run test              # Run tests
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage report
```

---

## 📋 IMPLEMENTATION ORDER

1. Docker + PostgreSQL setup
2. Drizzle ORM + migrations
3. API routes (cabinets, transactions)
4. UI components
5. Seeding data
6. Testing & lint

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