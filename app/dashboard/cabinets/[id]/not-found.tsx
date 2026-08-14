import Link from "next/link"

export default function CabinetNotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <span className="material-symbols-outlined text-[64px] text-outline mb-4">ev_station_off</span>
      <h1 className="font-headline-lg text-on-surface mb-2">Cabinet Tidak Ditemukan</h1>
      <p className="text-body-sm text-on-surface-variant mb-8 max-w-sm">
        Kode cabinet yang kamu cari tidak ada atau sudah tidak aktif.
      </p>
      <Link
        href="/dashboard/cabinets"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-ecgo-green text-white rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Daftar Cabinet
      </Link>
    </div>
  )
}
