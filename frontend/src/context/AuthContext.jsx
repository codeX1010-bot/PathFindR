import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Axios interceptor to always attach token from localStorage
        const requestInterceptor = axios.interceptors.request.use(config => {
            const token = localStorage.getItem('pathfindr_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Check local storage for token on load
        const token = localStorage.getItem('pathfindr_token');
        const storedUser = localStorage.getItem('pathfindr_user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);

        return () => {
             axios.interceptors.request.eject(requestInterceptor);
        };
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('pathfindr_token', token);
        localStorage.setItem('pathfindr_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('pathfindr_token');
        localStorage.removeItem('pathfindr_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
