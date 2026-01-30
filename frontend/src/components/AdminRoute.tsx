import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { JSX } from 'react';

interface AdminRouteProps {
    children: JSX.Element;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
    const { user, isAuthenticated } = useAuth();



    if (!isAuthenticated || !user?.is_admin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;