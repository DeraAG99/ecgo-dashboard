# JAWABAN C1 & C2 — CODE REVIEW & SECURITY

**Nama:** Dera Abdul Gani  
**Tanggal:** 13 Agustus 2026  

---

## C1. FRONTEND CODE REVIEW

---

### 1. `useEffect` Dependency Kosong (`[]`)
- **Salah:** `useEffect` hanya berjalan sekali saat mount. Perubahan `query` dan `page` tidak memicu fetch ulang.
- **Dampak:** Search dan pagination tidak berfungsi. User mengubah keyword atau klik Next tapi data tetap sama.
- **Severity:** 🔴 **High**
- **Perbaikan:** Tambahkan `branchId`, `query`, dan `page` ke dependency array.

```tsx
useEffect(() => {
  fetch(`/api/orders?branch=${branchId}&q=${query}&page=${page}`)
}, [branchId, query, page]);
```

---

### 2. `key={Math.random()}`
- **Salah:** Menggunakan `Math.random()` sebagai key menyebabkan key berubah setiap render, bukan berdasarkan identitas unik data.
- **Dampak:** React melakukan re-render semua item pada setiap perubahan state, menurunkan performa.
- **Severity:** 🟡 Medium
- **Perbaikan:** Gunakan `order.id` sebagai key.

```tsx
{orders.map(o => (
  <div key={o.id}>...</div>
))}
```

---

### 3. `dangerouslySetInnerHTML` (XSS)
- **Salah:** Menampilkan `customerNote` tanpa sanitasi menggunakan `dangerouslySetInnerHTML`.
- **Dampak:** Rentan terhadap XSS. Attacker bisa menyisipkan script jahat melalui `customerNote`, mencuri data atau session user.
- **Severity:** 🔴 High
- **Perbaikan:** Hapus `dangerouslySetInnerHTML`, gunakan langsung `{o.customerNote}`.

```tsx
<span>{o.customerNote}</span>
```

---

### 4. Tidak Ada Loading State
- **Salah:** Tidak ada indikator saat proses fetch data berlangsung.
- **Dampak:** User tidak tahu apakah data sedang dimuat atau aplikasi error.
- **Severity:** 🟡 Medium
- **Perbaikan:** Tambahkan state `isLoading` dan tampilkan spinner atau skeleton.

```tsx
const [isLoading, setIsLoading] = useState(false);
if (isLoading) return <div>Loading...</div>;
```

---

### 5. Tidak Ada Error Handling
- **Salah:** Fetch gagal tidak ditangani dengan `.catch()` atau try-catch.
- **Dampak:** User tidak mendapat notifikasi jika terjadi error jaringan atau server.
- **Severity:** 🟡 Medium
- **Perbaikan:** Tambahkan try-catch dan state error.

```tsx
try {
  const res = await fetch(...);
  if (!res.ok) throw new Error('Gagal mengambil data');
} catch (err) {
  setError(err.message);
}
```

---

### 6. Tidak Ada Debounce pada Search
- **Salah:** Setiap perubahan `query` langsung memicu fetch tanpa jeda.
- **Dampak:** Server menerima banyak request dalam waktu singkat (spam), boros resource.
- **Severity:** 🟡 Medium
- **Perbaikan:** Gunakan `useDebounce` dengan jeda 300-500ms.

```tsx
const debouncedQuery = useDebounce(query, 300);
useEffect(() => {
  fetch(`/api/orders?q=${debouncedQuery}`)
}, [debouncedQuery]);
```

---

### 7. `branchId` Tidak Divalidasi
- **Salah:** Jika `branchId` bernilai `undefined` atau `null`, URL menjadi `?branch=undefined`.
- **Dampak:** Request gagal dan data tidak muncul.
- **Severity:** 🟡 Medium
- **Perbaikan:** Tambahkan guard di awal fetch.

```tsx
if (!branchId) return;
```

---

### 8. Total Dihitung di Client (`reduce`)
- **Salah:** `total` dihitung menggunakan `reduce` di client.
- **Dampak:** Jika data besar, performa browser menurun. Seharusnya agregasi dilakukan di server.
- **Severity:** 🟢 Low
- **Perbaikan:** Minta server mengembalikan `total` dalam response API.

---

### 9. Format Rupiah Tidak Pakai Formatter
- **Salah:** `Rp {o.amount}` menampilkan angka tanpa pemisah ribuan (misal: `Rp 1000000`).
- **Dampak:** Sulit dibaca dan rawan salah interpretasi.
- **Severity:** 🟢 Low
- **Perbaikan:** Gunakan `Intl.NumberFormat`.

```tsx
new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(o.amount)
```

---

### 10. Tidak Ada Tipe TypeScript (`any`)
- **Salah:** `orders` menggunakan `useState([])` → bertipe `any`.
- **Dampak:** Hilangnya type safety, autocomplete tidak berfungsi, bug baru mudah muncul.
- **Severity:** 🟡 Medium
- **Perbaikan:** Definisikan tipe `Order` dan gunakan `useState<Order[]>([])`.

```tsx
type Order = {
  id: string;
  amount: number;
  customerNote: string;
};
const [orders, setOrders] = useState<Order[]>([]);
```

---

### 11. Tombol Next Tidak Ada Disable
- **Salah:** Tombol Next bisa diklik terus menerus tanpa batas.
- **Dampak:** User bisa request halaman kosong, membuang resource server.
- **Severity:** 🟢 Low
- **Perbaikan:** Disable tombol jika `!hasMore` atau sudah halaman terakhir.

```tsx
<button disabled={!hasMore}>Next</button>
```

---

### 12. Tidak Ada Empty State
- **Salah:** Jika `orders` kosong, hanya tampil `Total: Rp 0` tanpa informasi tambahan.
- **Dampak:** User bingung apakah tidak ada data atau terjadi error.
- **Severity:** 🟢 Low
- **Perbaikan:** Tampilkan pesan "Tidak ada data" jika `orders.length === 0`.

```tsx
if (orders.length === 0) return <div>Tidak ada data</div>;
```

---

## C2. BACKEND CODE REVIEW

---

### 1. SQL Injection
- **Salah:** Menggunakan string literal langsung (`'${branch}'`) tanpa parameterized query.
- **Dampak:** Attacker bisa menyisipkan perintah SQL, menghapus tabel, atau mencuri data.
- **Severity:** 🔴 High
- **Perbaikan:** Gunakan parameterized query (`$1`, `$2`, dst).

---

### 2. Tidak Ada Validasi Input
- **Salah:** Parameter `branch`, `q`, dan `page` tidak divalidasi sama sekali.
- **Dampak:** Request dengan payload berbahaya bisa masuk dan menyebabkan error atau eksploitasi.
- **Severity:** 🔴 High
- **Perbaikan:** Gunakan Zod untuk validasi input.

---

### 3. Tidak Ada Autentikasi & Otorisasi
- **Salah:** Endpoint dapat diakses oleh siapa saja tanpa login.
- **Dampak:** Data orders bisa diakses oleh pihak yang tidak berwenang.
- **Severity:** 🔴 High
- **Perbaikan:** Tambahkan session/JWT check sebelum memproses request.

---

### 4. Tidak Ada Pagination (LIMIT/OFFSET)
- **Salah:** `SELECT *` tanpa `LIMIT` mengambil semua data sekaligus.
- **Dampak:** Jika data besar (misal 500.000 baris), response menjadi lambat dan server berat.
- **Severity:** 🟡 Medium
- **Perbaikan:** Tambahkan `LIMIT` dan `OFFSET` atau cursor pagination.

---

### 5. Tidak Ada Error Handling
- **Salah:** Jika query gagal, server tidak menangani error dengan baik.
- **Dampak:** User mendapatkan error 500 tanpa informasi yang jelas.
- **Severity:** 🟡 Medium
- **Perbaikan:** Gunakan try-catch dan kirim response error yang konsisten.

---

### 6. `page` Tidak Dipakai
- **Salah:** Parameter `page` diambil dari query string tetapi tidak digunakan dalam query SQL.
- **Dampak:** Pagination tidak berfungsi, user selalu mendapat halaman pertama.
- **Severity:** 🟢 Low
- **Perbaikan:** Hitung `OFFSET` dari `(page - 1) * limit`.

---

### 7. Tidak Ada Rate Limiting / Security Headers
- **Salah:** Tidak ada proteksi dari brute force atau abuse.
- **Dampak:** Server rentan terhadap serangan DDoS atau scraping massal.
- **Severity:** 🟢 Low
- **Perbaikan:** Tambahkan rate limiting (misal pake Upstash/Redis) dan security headers.

---

## ✅ KODE PERBAIKAN (LENGKAP)

```ts
// app/api/orders/route.ts
import { db } from "@/lib/db";
import { z } from "zod";
import { auth } from "@/lib/auth";

const querySchema = z.object({
  branch: z.string().uuid(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    // 1. Autentikasi
    const session = await auth();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const params = querySchema.parse(Object.fromEntries(url.searchParams));
    const { branch, q, page, limit } = params;
    const offset = (page - 1) * limit;

    // 2. Query dengan parameterized SQL
    const rows = await db.query(
      `SELECT * FROM orders
       WHERE branch_id = $1
       AND ($2::text IS NULL OR customer_name ILIKE '%' || $2 || '%')
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [branch, q, limit, offset]
    );

    // 3. Total data untuk pagination
    const total = await db.query(
      `SELECT COUNT(*) FROM orders WHERE branch_id = $1`,
      [branch]
    );

    return Response.json({
      data: rows,
      total: total.rows[0].count,
      page,
      totalPages: Math.ceil(total.rows[0].count / limit),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```