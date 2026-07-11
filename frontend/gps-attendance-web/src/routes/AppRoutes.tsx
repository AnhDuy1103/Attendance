import { Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import AdminLayout from '../layouts/AdminLayout'
import EmployeeLayout from '../layouts/EmployeeLayout'

// Protected Route Guard
import ProtectedRoute from './ProtectedRoute'

// Auth Pages
import LoginPage from '../pages/auth/LoginPage'

// Admin Pages
import DashboardPage from '../pages/admin/DashboardPage'
import EmployeeManagementPage from '../pages/admin/EmployeeManagementPage'
import AttendanceHistoryPage from '../pages/admin/AttendanceHistoryPage'
import ReportPage from '../pages/admin/ReportPage'
import SettingsPage from '../pages/admin/SettingsPage'
import AdminAccountPage from '../pages/admin/AdminAccountPage'

// Employee Pages
import EmployeeHomePage from '../pages/employee/EmployeeHomePage'
import CheckAttendancePage from '../pages/employee/CheckAttendancePage'
import EmployeeHistoryPage from '../pages/employee/EmployeeHistoryPage'
import EmployeeAccountPage from '../pages/employee/EmployeeAccountPage'

// ─── App Routes ────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Default redirect ── */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Auth ── */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── Admin Routes (protected) ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"          element={<DashboardPage />} />
        <Route path="employees"          element={<EmployeeManagementPage />} />
        <Route path="attendance-history" element={<AttendanceHistoryPage />} />
        <Route path="reports"            element={<ReportPage />} />
        <Route path="settings"           element={<SettingsPage />} />
        <Route path="account"            element={<AdminAccountPage />} />
        {/* Default admin redirect */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* ── Employee Routes (protected) ── */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home"             element={<EmployeeHomePage />} />
        <Route path="check-attendance" element={<CheckAttendancePage />} />
        <Route path="history"          element={<EmployeeHistoryPage />} />
        <Route path="account"          element={<EmployeeAccountPage />} />
        {/* Default employee redirect */}
        <Route index element={<Navigate to="/employee/home" replace />} />
      </Route>

      {/* ── 404 Fallback ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
