/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';


interface DecodedToken {
    user_id: number;
    username: string;
    is_staff: boolean;
    exp: number;
}

export interface User {
    username: string;
    id?: number;
    is_admin: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));

    const processToken = (accessToken: string) => {
        try {
            const decoded: DecodedToken = jwtDecode(accessToken);
            setUser({
                username: decoded.username,
                id: decoded.user_id,
                is_admin: decoded.is_staff 
            });
        } catch (error) {
            console.error("Invalid token", error);
            logout();
        }
    };

    useEffect(() => {
        if (token) {
            processToken(token);
        }
        setLoading(false);
    }, [token]);

    const login = (accessToken: string) => {
        localStorage.setItem('access_token', accessToken);
        setToken(accessToken);
        processToken(accessToken); 
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
        navigate('/');
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading application...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};