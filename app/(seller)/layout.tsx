import Navbar from '@/components/ui/Navbar'
import Sidebar from '@/components/ui/Sidebar'
import Footer from '@/components/ui/Footer'

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Navbar />
      <div className="flex flex-1 min-h-full">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}