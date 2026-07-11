import { Outlet } from 'react-router-dom'
import EmployeeHeader from '../components/employee/EmployeeHeader'
import EmployeeBottomNav from '../components/employee/EmployeeBottomNav'

// ─── Employee Layout ──────────────────────────────────────────

export default function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <EmployeeHeader />

      <main className="max-w-md mx-auto w-full px-4 py-6 pb-28 animate-fade-in">
        <Outlet />
      </main>

      <EmployeeBottomNav />
    </div>
  )
}
