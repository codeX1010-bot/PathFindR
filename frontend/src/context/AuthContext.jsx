import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for token on load
        const token = localStorage.getItem('pathfindr_token');
        const storedUser = localStorage.getItem('pathfindr_user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            // Setup default axios auth header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('pathfindr_token', token);
        localStorage.setItem('pathfindr_user', JSON.stringify(userData));
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        localStorage.removeItem('pathfindr_token');
        localStorage.removeItem('pathfindr_user');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
