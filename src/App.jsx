import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { SiteLayout } from './components/SiteLayout.jsx';
import { RequireAdmin } from './components/RouteGuards.jsx';
import Home from './pages/Home.jsx';
import Commercial from './pages/Commercial.jsx';
import PropertyDetail from './pages/PropertyDetail.jsx';
import VIPPortal from './pages/VIPPortal.jsx';
import Contact from './pages/Contact.jsx';
import MapPage from './pages/MapPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminListings from './pages/admin/AdminListings.jsx';
import ListingEditor from './pages/admin/ListingEditor.jsx';
import AdminInquiries from './pages/admin/AdminInquiries.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'commercial', element: <Commercial /> },
      { path: 'property/:id', element: <PropertyDetail /> },
      { path: 'portal', element: <VIPPortal /> },
      { path: 'contact', element: <Contact /> },
      { path: 'map', element: <MapPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'listings', element: <AdminListings /> },
      { path: 'listings/new', element: <ListingEditor /> },
      { path: 'listings/:id', element: <ListingEditor /> },
      { path: 'inquiries', element: <AdminInquiries /> },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
