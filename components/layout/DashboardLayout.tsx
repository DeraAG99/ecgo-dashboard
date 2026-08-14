import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-sidebar-width min-h-screen flex flex-col relative">
        <Topbar />
        <div className="flex-1 mt-16 p-4 md:p-margin-page max-w-container-max mx-auto w-full flex flex-col gap-6">
          {children}
        </div>
      </main>
    </div>
  )
}
