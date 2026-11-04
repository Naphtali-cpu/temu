import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function FullPageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

/** Requires a signed-in user; clients are sent to the portal, admins continue. */
export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <FullPageLoader />;
  if (status !== 'authenticated') {
    return <Navigate to="/portal" replace state={{ from: location.pathname }} />;
  }
  return children;
}

/** Requires an administrator; everyone else is redirected to the client portal. */
export function RequireAdmin({ children }) {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <FullPageLoader />;
  if (status !== 'authenticated') {
    return <Navigate to="/portal" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin) return <Navigate to="/portal" replace />;
  return children;
}
