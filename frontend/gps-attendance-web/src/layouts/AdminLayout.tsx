import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminHeader from '../components/admin/AdminHeader'

// ─── Admin Layout ─────────────────────────────────────────────

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Header */}
      <AdminHeader adminName="Admin Quang Hoa" />

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-content animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
