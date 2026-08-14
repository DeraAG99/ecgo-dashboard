# ECGO Battery Swap Dashboard

Dashboard internal untuk memantau status cabinet battery swap secara real-time.

## Setup

Ikuti langkah berikut untuk menyiapkan lingkungan pengembangan:

```bash
# 1. Jalankan PostgreSQL via Docker
docker-compose up -d postgres

# 2. Salin file environment
cp .env.example .env.local
# Edit .env.local untuk mengubah DATABASE_URL jika diperlukan

# 3. Install dependencies
npm install

# 4. Buat tabel database
npm run db:push

# 5. Seed data awal (50 cabinets, 600 slots, 20k transaksi)
npm run db:seed

# 6. Jalankan development server
npm run dev
# Buka http://localhost:3000
```

## Database Configuration

PostgreSQL berjalan lewat Docker Compose di port 5432:

| Parameter | Nilai |
|-----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | ecgo_dashboard |
| User | postgres |
| Password | postgres |

## API Endpoints

### GET /api/cabinets
Daftar semua cabinet dengan filter & pagination.

**Query Params:**
- `search` - Cari kode cabinet atau nama cabang
- `status` - Filter: ONLINE, OFFLINE, MAINTENANCE
- `page` - Nomor halaman (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - sort: swapCount24h, code, lastHeartbeat (default: swapCount24h)
- `sortOrder` - asc atau desc (default: desc)

**Response:**
```json
{
  "data": [
    {
      "id": "CB-001",
      "code": "CB-001",
      "branch": "Kemayoran",
      "status": "ONLINE",
      "filledSlots": 8,
      "totalSlots": 12,
      "swapCount24h": 42,
      "lastHeartbeat": "2026-08-14T10:30:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}
```

### GET /api/cabinets/:id
Detail cabinet dengan slot, transaksi, dan grafik.

## Asumsi

1. **Swap 24 jam terakhir**: Rolling 24 jam dari waktu request, bukan dari tengah malam
2. **filledSlots**: Slot dengan state `FULL` atau `CHARGING`
3. **Cabinet OFFLINE**: Tampilkan slot state terakhir dengan indikasi stale data
4. **Last Heartbeat null**: Diartikan sebagai status OFFLINE
5. **Pagination**: Menggunakan offset pagination (bukan cursor) karena dataset relatif kecil dan memungkinkan pencarian gratis

## Trade-off

**Mengapa Offset Pagination?**
- Simpler implementation
- Client dapat melakukan jump ke halaman manapun
- Dataset hanya 50 cabinets, overhead query tidak signifikan
- Untuk skala besar (ribuan-plus), cursor pagination lebih optimal

## Struktur Data

### Cabinets
- `id`: string (primary key, kode cabinet)
- `code`: string (unik)
- `branch`: string (nama lokasi)
- `status`: ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE')
- `totalSlots`: integer (default: 12)
- `lastHeartbeat`: timestamp

### Slots
- `id`: string (primary key)
- `cabinetId`: string (foreign key)
- `slotNumber`: integer (1-12)
- `state`: ENUM ('EMPTY', 'CHARGING', 'FULL', 'LOCKED', 'FAULT')
- `soc`: integer (0-100, null untuk EMPTY)
- `lastUpdated`: timestamp

### Transactions
- `id`: string (primary key)
- `cabinetId`: string (foreign key)
- `userId`: string
- `oldBatteryId`: string
- `newBatteryId`: string
- `swappedAt`: timestamp

## Development Commands

```bash
# Quality checks
npm run lint      # ESLint
npm run typecheck # TypeScript
npm run test      # Vitest unit tests

# Build & Deploy
npm run build     # Build untuk production
npm run start     # Run production server
```

## Yang Belum Selesai

- [ ] Unit testing lengkap
- [ ] E2E testing
- [ ] Dark mode
- [ ] Deploy ke Vercel
- [ ] CI/CD workflow untuk auto-deploy

## AI Tools

- ChatGPT: Beberapa bagian dokumentasi
- Claude: Ide UX design untuk komponen slot grid
- Copilot: Autocomplete selama development

## License

MIT