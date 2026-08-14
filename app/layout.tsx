import "./globals.css"
import { Inter, JetBrains_Mono } from "next/font/google"
import DashboardLayout from "@/components/layout/DashboardLayout"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains-mono",
})

export const metadata = {
  title: "ECGO Swap - Operational Dashboard",
  description: "Dashboard internal untuk memantau cabinet battery swap",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-surface text-on-surface antialiased`}
      >
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  )
}
