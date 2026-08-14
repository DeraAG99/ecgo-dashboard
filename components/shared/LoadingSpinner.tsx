"use client"

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent border-full rounded-full animate-spin"></div>
    </div>
  )
}