import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.tsx';
import { EmployeeLayout } from './components/layout/EmployeeLayout.tsx';
import { AdminLayout } from './components/layout/AdminLayout.tsx';

import { LoginPage } from './pages/auth/LoginPage.tsx';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard.tsx';
import { AddEntryPage } from './pages/employee/AddEntryPage.tsx';
import { MyEntriesPage } from './pages/employee/MyEntriesPage.tsx';
import { MyEarningsPage } from './pages/employee/MyEarningsPage.tsx';
import { EmployeeAlertsPage } from './pages/employee/EmployeeAlertsPage.tsx';

import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { EmployeesListPage } from './pages/admin/EmployeesListPage.tsx';
import { EmployeeDetailPage } from './pages/admin/EmployeeDetailPage.tsx';
import { SalesReportsPage } from './pages/admin/SalesReportsPage.tsx';
import { AdminWithdrawalsPage } from './pages/admin/AdminWithdrawalsPage.tsx';
import { TargetManagementPage } from './pages/admin/TargetManagementPage.tsx';
import { IncentiveManagementPage } from './pages/admin/IncentiveManagementPage.tsx';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage.tsx';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.tsx';
import { AdminProfilePage } from './pages/admin/AdminProfilePage.tsx';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Employee Routes */}
              <Route
                path="/employee/*"
                element={
                  <ProtectedRoute allowedRole="employee">
                    <EmployeeLayout>
                      <Routes>
                        <Route path="dashboard" element={<EmployeeDashboard />} />
                        <Route path="add-entry" element={<AddEntryPage />} />
                        <Route path="entries" element={<MyEntriesPage />} />
                        <Route path="earnings" element={<MyEarningsPage />} />
                        <Route path="alerts" element={<EmployeeAlertsPage />} />
                        <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
                      </Routes>
                    </EmployeeLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminLayout>
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="employees" element={<EmployeesListPage />} />
                        <Route path="employees/:id" element={<EmployeeDetailPage />} />
                        <Route path="sales-reports" element={<SalesReportsPage />} />
                        <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
                        <Route path="targets" element={<TargetManagementPage />} />
                        <Route path="incentives" element={<IncentiveManagementPage />} />
                        <Route path="notifications" element={<AdminNotificationsPage />} />
                        <Route path="settings" element={<AdminSettingsPage />} />
                        <Route path="profile" element={<AdminProfilePage />} />
                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                      </Routes>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
