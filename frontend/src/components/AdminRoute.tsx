import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path to where you saved context
import type { JSX } from 'react';

interface AdminRouteProps {
    children: JSX.Element;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
    const { user, isAuthenticated } = useAuth();

    // 1. Wait for auth check (optional, but good if you have a loading state)
    // if (isLoading) return <div>Loading...</div>;

    // 2. Check if logged in AND is admin
    if (!isAuthenticated || !user?.is_admin) {
        // Redirect to home if not authorized
        return <Navigate to="/" replace />;
    }

    // 3. Render the protected page
    return children;
};

export default AdminRoute;