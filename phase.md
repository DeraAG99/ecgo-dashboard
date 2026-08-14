# Development Phases - ECGO Battery Swap Dashboard

## Fase 1: Foundation (Hari 1-2)

### Tujuan
Setup infrastruktur dasar project Next.js dengan konfigurasi yang benar.

### Tasks
- [ ] Buat repositori baru
- [ ] Initialize git
- [ ] Setup Next.js 15 App Router dengan TypeScript
- [ ] Konfigurasi Tailwind CSS
- [ ] Setup ESLint & Prettier
- [ ] Buat struktur folder yang diperlukan
- [ ] Konfigurasi Docker untuk PostgreSQL

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
- [ ] Hubungkan database di `lib/db.ts`
- [ ] Definisikan schema di `lib/schema.ts`
  - `cabinets` table
  - `slots` table
  - `transactions` table
- [ ] Buat enum `status` dan `slot_state`
- [ ] Jalankan `drizzle push` untuk migrasi
- [ ] Buat script seeding di `drizzle/seed.ts`
- [ ] Seed 50 cabinets dengan faker
- [ ] Seed 600 slots (12 per cabinet)
- [ ] Seed 20.000 transaksi

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
- [ ] Buat route `GET /api/cabinets`
  - Implementasi filter: search, status
  - Implementasi sorting: swapCount24h
  - Implementasi pagination: page, limit
  - Hitung filledSlots & swapCount24h di database
- [ ] Buat route `GET /api/cabinets/[id]`
  - Detail cabinet
  - Daftar slots (ORDER BY slotNumber)
  - 20 transaksi terakhir
  - Chart data 24 jam
- [ ] Validasi input dengan Zod
- [ ] Error handling yang konsisten
- [ ] Rate limiting (opsional)

### Deliverables
- API yang dapat dipanggil langsung lewat browser/postman
- Response format yang sudah ditentukan di spec
- Semua validasi input dijalankan

---

## Fase 4: UI Components (Hari 8-10)

### Tujuan
Bangun antarmuka pengguna sesuai mockup.

### Tasks
- [ ] Buat `CabinetTable` di halaman utama
  - Header kolom: Code, Branch, Status, Filled/Total, Swap 24h, Last Heartbeat
  - Search input dengan debounce 300ms
  - Dropdown filter status
  - Pagination (Previous/Next)
  - State: loading, empty, error
- [ ] Buat `SlotGrid` pada halaman detail
  - Grid 4x3 atau 6x2
  - Warna per state: EMPTY(gray), CHARGING(blue), FULL(green), LOCKED(red), FAULT(orange)
  - Tampilkan SOC di tiap slot
- [ ] Buat `SwapChart`
  - Batang horisontal 24 jam
  - Data swap per jam
- [ ] Buat `TransactionList`
  - Tabel 20 transaksi terakhir
  - Kolom: User ID, Old Battery, New Battery, Swapped At

### Deliverables
- UI yang responsive
- Semua komponen sudah functional
- State management yang benar

---

## Fase 5: Testing & Polish (Hari 11-12)

### Tujuan
Pastikan semua komponen dan API berfungsi dengan baik.

### Tasks
- [ ] Setup Vitest
- [ ] Tulis unit tests untuk utils
- [ ] Tulis unit tests untuk API routes
- [ ] Jalankan `npm run lint`
- [ ] Jalankan `npm run typecheck`
- [ ] Jalankan `npm run test`
- [ ] Perbaiki semua error/warning
- [ ] Optimasi performa

### Deliverables
- Semua linting passing
- Semua type checking passing
- Minimal 80% code coverage

---

## Fase 6: Deploy (Hari 13-14)

### Tujuan
Deploy ke lingkungan production.

### Tasks
- [ ] Setup Docker production image
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

- [ ] **Milestone 1 (Hari 4):** Database & Schema READY
- [ ] **Milestone 2 (Hari 7):** API Endpoints READY
- [ ] **Milestone 3 (Hari 10):** UI Components READY
- [ ] **Milestone 4 (Hari 12):** Testing READY
- [ ] **Milestone 5 (Hari 14):** Deployment LIVE