import Link from "next/link"

export default function BatteryNotFound() {
  return (
    <div className="text-center py-20">
      <h2 className="font-display text-display text-on-surface">Baterai Tidak Ditemukan</h2>
      <p className="text-body-sm text-on-surface-variant mt-2">
        Kode baterai yang kamu cari tidak ada atau sudah dihapus.
      </p>
      <Link
        href="/dashboard/batteries"
        className="mt-6 inline-block px-5 py-2.5 bg-ecgo-green text-white rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity"
      >
        Kembali ke Daftar Baterai
      </Link>
    </div>
  )
}
