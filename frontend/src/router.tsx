import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppLayout } from '@/components/AppLayout';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminPasswordResetPage } from '@/pages/AdminPasswordResetPage';
import { CommonCodeAdminPage } from '@/pages/CommonCodeAdminPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { MenuContentPage } from '@/pages/MenuContentPage';
import { RootRedirect } from '@/pages/RootRedirect';

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/home',
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'basic/shipper-corp', element: <MenuContentPage title="화주(법인) 정보" /> },
          { path: 'basic/users', element: <MenuContentPage title="사용자 정보" /> },
          { path: 'admin/common-code', element: <CommonCodeAdminPage /> },
          { path: 'service/permissions', element: <MenuContentPage title="권한관리" /> },
          { path: 'service/settings', element: <MenuContentPage title="환경 설정" /> },
          { path: 'extra/mall-info', element: <MenuContentPage title="쇼핑몰 정보" /> },
          { path: 'logs/access', element: <MenuContentPage title="접속 로그" /> },
          { path: 'logs/auth-change', element: <MenuContentPage title="사용자 권한 변경 로그" /> },
          { path: 'logs/audit', element: <MenuContentPage title="감사이력 로그" /> },
          { path: 'admin/password-reset', element: <AdminPasswordResetPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
