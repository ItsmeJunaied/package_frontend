import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { CourierView } from '@/pages/courier-view';
import { DashboardPage } from '@/pages/dashboard-page';
import { LoginPage } from '@/pages/login-page';
import { OrderDetailPage } from '@/pages/order-detail-page';
import { OrdersPage } from '@/pages/orders-page';

/**
 * `/login` is the only route outside the gate, and it renders without the app
 * shell — a header with navigation you cannot use is just noise on a sign-in
 * screen. Everything else sits inside one layout route, so the guard is stated
 * once instead of being repeated (and eventually forgotten) per page.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell>
              <Outlet />
            </AppShell>
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/courier" element={<CourierView />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
