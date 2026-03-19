import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/auth` : '/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const successMessage = location.state?.message;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_BASE}/login`, { email, password });

            // Save to context which saves to LocalStorage
            login(response.data.token, response.data.user);

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            const errorData = err.response?.data?.error;
            setError(typeof errorData === 'string' ? errorData : (errorData?.message || 'Invalid credentials. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand opacity-10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent opacity-10 rounded-full blur-[100px] pointer-events-none" />

            <div className="glass-card w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-accent flex items-center justify-center mb-4 shadow-lg shadow-brand/30">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-center">Welcome Back</h1>
                    <p className="text-text-secondary mt-2">Log in to view your learning paths</p>
                </div>

                {successMessage && (
                    <div className="bg-success/10 border border-success/30 text-success p-3 rounded-lg mb-6 text-sm text-center">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-heading font-medium mb-1.5 focus:text-brand transition-colors">
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="input-field shadow-inner"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-heading font-medium mb-1.5 focus:text-brand transition-colors">
                            Password
                        </label>
                        <input
                            type="password"
                            className="input-field shadow-inner"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary mt-8 shadow-brand/20" disabled={isLoading}>
                        {isLoading ? <div className="loader"></div> : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-text-secondary mt-8 text-sm">
                    New to PathFindR?{' '}
                    <Link to="/register" className="text-brand hover:text-brand-hover hover:underline transition-all font-medium">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}
