"use client"

interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Error</p>
        <p>{message}</p>
      </div>
    </div>
  )
}