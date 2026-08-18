# Development Phases - ECGO Battery Swap Dashboard

> **Status (updated 16 Aug 2026):** Fase 1-5 ✅ selesai. Fase 6 ⏳ pending (deploy VM: staging + production). Fitur tambahan (Map, Battery, Forecast, Alert) ✅ selesai & terverifikasi.
> **Keputusan penting:** Dev memakai PostgreSQL lokal `localhost:5432` (`postgres/password`); postgres Docker (host 5432) dikhususkan untuk deploy VM dan juga dipakai untuk verifikasi live (saat Postgres lokal di-stop). API anti-N+1 memakai single SQL query; skema validasi Zod terpusat di `lib/validation.ts`. Package manager: **Bun** (`bun.lock`); DB migration-driven via `drizzle/migrations` + `db:migrate`.

## Fase 1: Foundation (Hari 1-2)

### Tujuan
Setup infrastruktur dasar project Next.js dengan konfigurasi yang benar.

### Tasks
- [x] Buat repositori baru
- [x] Initialize git
- [x] Setup Next.js 15 App Router dengan TypeScript
- [x] Konfigurasi Tailwind CSS
- [x] Setup ESLint & Prettier
- [x] Buat struktur folder yang diperlukan
- [x] Konfigurasi Docker untuk PostgreSQL

### Deliverables
- `package.json` dengan semua dependencies
- `tailwind.config.ts`
- `tsconfig.json` (strict mode)
- `docker-compose.yml`
- Struktur folder `app/`, `components/`, `lib/`, `drizzle/`

---

## Fase 2: Database Layer (Hari 3-4)

### Tujuan
Buat schema database, migrasi, dan seeding data.

### Tasks
- [x] Hubungkan database di `lib/db.ts`
- [x] Definisikan schema di `lib/schema.ts`
  - `cabinets` table
  - `slots` table
  - `transactions` table
- [x] Buat enum `status` dan `slot_state`
- [x] Jalankan `drizzle push` untuk migrasi
- [x] Buat script seeding di `drizzle/seed.ts`
- [x] Seed 50 cabinets dengan faker
- [x] Seed 600 slots (12 per cabinet)
- [x] Seed 20.000 transaksi

### Deliverables
- Schema database yang terhubung ke Drizzle
- 50 cabinets dengan data acak
- 600 slots dengan state acak (FULL, CHARGING, EMPTY, LOCKED, FAULT)
- 20.000 transaksi swap dalam 30 hari terakhir

---

## Fase 3: API Endpoints (Hari 5-7)

### Tujuan
Buat REST API untuk frontend consumenya.

### Tasks
- [x] Buat route `GET /api/dashboard/cabinets`
  - Implementasi filter: search, status
  - Implementasi sorting: swapCount24h
  - Implementasi pagination: page, limit
  - Hitung filledSlots & swapCount24h di database (single SQL query anti-N+1)
- [x] Buat route `GET /api/dashboard/cabinets/[id]`
  - Detail cabinet
  - Daftar slots (ORDER BY slotNumber)
  - 20 transaksi terakhir
  - Chart data 24 jam (di-agregasi di database, GROUP BY jam)
- [x] Validasi input dengan Zod (skema terpusat di `lib/validation.ts`)
- [x] Error handling yang konsisten
- [ ] Rate limiting (opsional)

> Tambahan di luar spec: `GET /api/dashboard/dashboard` (ringkasan overview) & `GET /api/dashboard/transactions` (riwayat transaksi).

### Deliverables
- API yang dapat dipanggil langsung lewat browser/postman
- Response format yang sudah ditentukan di spec
- Semua validasi input dijalankan

---

## Fase 4: UI Components (Hari 8-10)

### Tujuan
Bangun antarmuka pengguna sesuai mockup.

### Tasks
- [x] Buat `CabinetTable` di halaman utama
  - Header kolom: Code, Branch, Status, Filled/Total, Swap 24h, Last Heartbeat
  - Search input dengan debounce 300ms
  - Dropdown filter status
  - Pagination (Previous/Next)
  - State: loading, empty, error
- [x] Buat `SlotGrid` pada halaman detail
  - Grid 4x3 atau 6x2
  - Warna per state: EMPTY(gray), CHARGING(blue), FULL(green), LOCKED(red), FAULT(orange)
  - Tampilkan SOC di tiap slot
- [x] Buat `SwapChart`
  - Batang horisontal 24 jam
  - Data swap per jam
- [x] Buat `TransactionList`
  - Tabel 20 transaksi terakhir
  - Kolom: User ID, Old Battery, New Battery, Swapped At

> Catatan: `SlotGrid`, `SwapChart`, dan `TransactionList` diintegrasikan inline di halaman detail `app/dashboard/cabinets/[id]/page.tsx` (bukan file komponen terpisah). Layout memakai `DashboardLayout` + `Sidebar` + `Topbar`. Semua halaman berada di bawah prefix `/dashboard` (`/dashboard`, `/dashboard/cabinets`, `/dashboard/cabinets/:id`, `/dashboard/transactions`); `/` me-redirect ke `/dashboard`.

### Deliverables
- UI yang responsive
- Semua komponen sudah functional
- State management yang benar

---

## Fase 5: Testing & Polish (Hari 11-12)

### Tujuan
Pastikan semua komponen dan API berfungsi dengan baik.

### Tasks
- [x] Setup Vitest
- [x] Tulis unit tests untuk utils (62 tests: `lib/validation.test.ts`, `lib/checkin/evaluateCheckin.test.ts`)
- [x] Tulis unit tests untuk API routes (mock `@/lib/db`)
- [x] Tulis component tests (StatusBadge, CabinetTable, Sidebar, Topbar)
- [x] Jalankan `bun run lint`
- [x] Jalankan `bun run typecheck`
- [x] Jalankan `bun run test`
- [x] Perbaiki semua error/warning
- [x] Optimasi performa (anti-N+1 single SQL query, agregasi chart di DB, index `cabinets_status`, `slots_cabinet_id`, `transactions_cabinet_swapped`)
- [x] Code coverage ≥ 80% (All files: 96.9% statements, 86.11% branches, 92% functions)

### Deliverables
- Semua linting passing
- Semua type checking passing
- Minimal 80% code coverage tercapai (96.9% statements / 92% functions)

---

## Fase 6: Deploy (Hari 13-14)

### Tujuan
Deploy ke lingkungan production.

### Tasks
- [x] Setup Docker production image (Dockerfile ada, `docker compose build` berhasil)
- [x] Update workflow deployment di GitHub Actions
- [ ] Deploy ke staging server
- [ ] Uji di staging
- [ ] Deploy ke production

### Deliverables
- Aplikasi running di production
- URL yang bisa diakses tim operasional

---

## Fase 7: Fitur Tambahan — Map, Battery, Forecast, Alert ✅

### Map View (Leaflet)
- [x] `GET /api/dashboard/cabinets/map` — data lat/lng/radiusM/status untuk peta
- [x] `components/ui/Cabinet/CabinetMap.tsx` — marker per status + circle geofence + popup
- [x] `/dashboard/map` — dynamic import `ssr:false` (metadata dipindah ke `layout.tsx` karena page client component), auto-refresh 30s
- [x] Fix tile abu-abu: `import "leaflet/dist/leaflet.css"` (sebelumnya hilang → tile tak terposisi) + `invalidateSize` (whenReady + rAF + window resize) + `zoomAnimation:false` (mencegah crash `_leaflet_pos` di `_onZoomTransitionEnd`); map dibuat sekali, marker di-update via `cluster.clearLayers()`

### Battery Management
- [x] Tabel `batteries` + enum `battery_status` (migration 0002), seed 1000 baterai
- [x] `GET /api/dashboard/batteries` + `GET /api/dashboard/batteries/:id`
- [x] `/dashboard/batteries` + `/dashboard/batteries/:id`; link kode baterai di riwayat transaksi
- [x] Riwayat swap di detail baterai tampilkan lokasi `{branch} ({cabinetCode})` (API sudah return `branch` per transaksi)

### Demand Forecasting
- [x] `GET /api/dashboard/forecast` (`branch?`, `days` 1-14) — profil rata-rata per `dow`+`hour` (window 60 hari), prediksi harian WIB (mulai besok), rata-rata per cabinet
- [x] `/dashboard/forecast` + `ForecastChart` (Recharts — warna hex `#1A2B4C`/`#00A651`, bukan CSS var)
- [x] Verifikasi live terhadap Docker DB: `totalActual 4942`, `totalPredicted 4375`, `peakHour 11:00`

### Alert & Notifications
- [x] Tabel `alerts` + enum `alert_type`/`alert_severity` + index (migration 0003)
- [x] `lib/alerts/scanAlerts.ts` — CABINET_OFFLINE / SLOT_FAULT / BATTERY_LOW (health<20) / SWAP_ANOMALY (swap24h > 2.5× dailyAvg); dedupe per `type+entityId` pada alert unresolved
- [x] `GET /api/dashboard/alerts` (+ `unread` count), `POST /api/dashboard/alerts` (scan), `PATCH /api/dashboard/alerts` (mark all), `PATCH /api/dashboard/alerts/:id` (mark one)
- [x] `/dashboard/alerts` + `AlertBell` di Topbar (badge unread, poll 30s)
- [x] Seed 30 alert dummy
- [x] Tests: scanAlerts (5), alerts route (8), alerts [id] (3), AlertList (7), AlertBell (4), ForecastChart (4), DashboardLayout (1) — **total suite 153 test, coverage 97.88% lines / 90.36% functions**

### Catatan Teknis
- Client component page tidak boleh `export const metadata` (Next 15) → pindah ke `app/dashboard/map/layout.tsx`.
- Test tidak butuh Postgres (mock `@/lib/db`); verifikasi live memakai Docker Postgres (port 5432, `POSTGRES_PASSWORD=postgres`, `.env.prod`).

---

## Estimasi Waktu

| Fase | Hari | total |
|------|------|-------|
| Fase 1 | 2 | 2 |
| Fase 2 | 2 | 4 |
| Fase 3 | 3 | 7 |
| Fase 4 | 3 | 10 |
| Fase 5 | 2 | 12 |
| Fase 6 | 2 | 14 |

**Total Estimasi: 14 hari kerja**

---

## Milestone Checkpoints

- [x] **Milestone 1 (Hari 4):** Database & Schema READY
- [x] **Milestone 2 (Hari 7):** API Endpoints READY
- [x] **Milestone 3 (Hari 10):** UI Components READY
- [x] **Milestone 4 (Hari 12):** Testing READY
- [ ] **Milestone 5 (Hari 14):** Deployment LIVE