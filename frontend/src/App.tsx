import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import GamesHub from './components/GamesHub';
import ManagerPage from './components/ManagerPage';
import About from './components/About';
import NotFound from './components/NotFound';
import AdminRoute from './components/AdminRoute';
import Footer from './components/Footer';

// --- Components ---

const Navbar = () => {
    const { user, logout } = useAuth();
    
    return (
        <nav style={{ padding: '1rem', background: '#eee', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/games">Games</Link>
            {/* You can optionally hide this link if !user, but the route is now secure regardless */}
            <Link to="/about">About</Link>
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
                {user ? (
                    <>
                        {user.is_admin && <Link to="/manager" style={{ fontWeight: 'bold', color: 'blue' }}>Manager Dashboard</Link>}
                        <span>Hello, {user.username}</span>
                        <button onClick={logout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// --- Main App ---

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* --- Protected Routes (Must be logged in) --- */}
                    <Route element={<ProtectedRoute />}>
                        {/* 1. About is now protected */}
                        <Route path="/about" element={<About />} />
                        
                        {/* 2. Games Routes updated for URL navigation */}
                        {/* This matches /games (Hub) AND /games/Snaky-Snake (Specific Game) */}
                        <Route path="/games" element={<GamesHub />} />
                        <Route path="/games/:gameName" element={<GamesHub />} />
                    </Route>

                    {/* --- Admin Protected Routes --- */}
                    <Route 
                        path="/manager" 
                        element={
                            <AdminRoute>
                                <ManagerPage />
                            </AdminRoute>
                        } 
                    />

                    {/* --- Redirects & 404 --- */}
                    <Route path="/" element={<Navigate to="/games" replace />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
                <Footer />
            </AuthProvider>
        </BrowserRouter>
    );
}