import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Compass } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/auth` : '/auth';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    // We don't Auto-login on register in this flow, we will redirect them to login

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await axios.post(`${API_BASE}/register`, { name, email, password });
            navigate('/login', { state: { message: "Account created! Please log in." } });
        } catch (err) {
            const errorData = err.response?.data?.error;
            setError(typeof errorData === 'string' ? errorData : (errorData?.message || 'Failed to register. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md relative overflow-hidden">

                {/* Decorative elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand rounded-full blur-3xl opacity-20"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent rounded-full blur-3xl opacity-20"></div>

                <div className="relative z-10">
                    <div className="flex flex-col items-center mb-8">
                        <Compass className="w-12 h-12 text-brand mb-2" />
                        <h1 className="text-3xl font-heading font-bold text-center">Join PathFindR</h1>
                        <p className="text-text-secondary mt-2">Start your personalized learning journey</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-heading font-medium mb-1">Full Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-heading font-medium mb-1">Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-heading font-medium mb-1">Password</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn-primary mt-6" disabled={isLoading}>
                            {isLoading ? <div className="loader"></div> : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-text-secondary mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-brand hover:text-brand-hover font-medium">
                            Log in securely
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
