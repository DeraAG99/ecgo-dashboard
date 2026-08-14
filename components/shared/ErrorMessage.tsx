"use client"

interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="bg-error-container text-on-error-container border border-error/30 px-4 py-3 rounded-lg max-w-lg">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}
