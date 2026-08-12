import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/app-shell';
import { CourierView } from '@/pages/courier-view';
import { LoginPage } from '@/pages/login-page';
import { OrderDetailPage } from '@/pages/order-detail-page';
import { OrdersPage } from '@/pages/orders-page';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/orders" replace />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/courier" element={<CourierView />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Routes>
    </AppShell>
  );
}
