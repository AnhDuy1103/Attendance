import { Bell } from 'lucide-react'

// ─── Employee Header ──────────────────────────────────────────

export default function EmployeeHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-[#c4c5d5]/20">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
        <img
          src="/quanghoaaa.png"
          alt="Quang Hoa Logo"
          className="h-12 sm:h-14 w-auto object-contain scale-110 origin-left"
          onError={(e) => {
            // Fallback
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.parentElement) {
              const span = document.createElement('span')
              span.innerText = 'Logo'
              span.className = 'text-[#00288e] font-bold text-xl'
              e.currentTarget.parentElement.appendChild(span)
            }
          }}
        />

        <div className="flex items-center gap-4">
          <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eff4ff] transition-colors">
            <Bell className="w-5 h-5 text-[#444653]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="w-10 h-10 rounded-full bg-[#00288e] text-white flex items-center justify-center font-bold border-2 border-[#d3e4fe]">
            NA
          </div>
        </div>
      </div>
    </header>
  )
}
