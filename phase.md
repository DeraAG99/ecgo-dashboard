# Development Phases - ECGO Battery Swap Dashboard

> **Status (updated 14 Aug 2026):** Fase 1-5 ✅ selesai. Fase 6 ⏳ pending (deploy VM).
> **Keputusan penting:** Dev memakai PostgreSQL lokal `localhost:5432` (`postgres/password`); postgres Docker (host 5433) dikhususkan untuk deploy VM. API anti-N+1 memakai single SQL query; skema validasi Zod terpusat di `lib/validation.ts`.

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
- [x] Buat route `GET /api/cabinets`
  - Implementasi filter: search, status
  - Implementasi sorting: swapCount24h
  - Implementasi pagination: page, limit
  - Hitung filledSlots & swapCount24h di database (single SQL query anti-N+1)
- [x] Buat route `GET /api/cabinets/[id]`
  - Detail cabinet
  - Daftar slots (ORDER BY slotNumber)
  - 20 transaksi terakhir
  - Chart data 24 jam (di-agregasi di database, GROUP BY jam)
- [x] Validasi input dengan Zod (skema terpusat di `lib/validation.ts`)
- [x] Error handling yang konsisten
- [ ] Rate limiting (opsional)

> Tambahan di luar spec: `GET /api/dashboard` (ringkasan overview) & `GET /api/transactions` (riwayat transaksi).

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

> Catatan: `SlotGrid`, `SwapChart`, dan `TransactionList` diintegrasikan inline di halaman detail `app/cabinets/[id]/page.tsx` (bukan file komponen terpisah). Layout memakai `DashboardLayout` + `Sidebar` + `Topbar`.

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
- [x] Tulis unit tests untuk utils (23 tests: `lib/validation.test.ts`, `lib/checkin/evaluateCheckin.test.ts`)
- [x] Tulis unit tests untuk API routes (validasi Zod via schema test)
- [x] Jalankan `npm run lint`
- [x] Jalankan `npm run typecheck`
- [x] Jalankan `npm run test`
- [x] Perbaiki semua error/warning
- [x] Optimasi performa (anti-N+1 single SQL query, agregasi chart di DB)

### Deliverables
- Semua linting passing
- Semua type checking passing
- Minimal 80% code coverage (belum diukur)

---

## Fase 6: Deploy (Hari 13-14)

### Tujuan
Deploy ke lingkungan production.

### Tasks
- [ ] Setup Docker production image (Dockerfile sudah ada, `docker-compose build` belum diverifikasi ulang)
- [ ] Update workflow deployment di GitHub Actions
- [ ] Deploy ke staging server
- [ ] Uji di staging
- [ ] Deploy ke production

### Deliverables
- Aplikasi running di production
- URL yang bisa diakses tim operasional

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