import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { BrainCircuit, User, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Log what's being submitted
  console.log("=== SUBMITTING REGISTRATION ===");
  console.log("Username:", username);
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Password length:", password.length);
  
  // Validation
  if (!username.trim()) {
    setError("Username is required");
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError("Please enter a valid email address");
    return;
  }
  
  if (password.length < 6) {
    setError("Password must be at least 6 characters long");
    return;
  }
  
  setError('');
  setLoading(true);

  try {
    const response = await authService.register(username, email, password);
    console.log("Registration success:", response);
    toast.success('Registered successfully!');
    
    // Method 1: Try navigate with replacement
    console.log("Attempting to navigate...");
    navigate('/login', { replace: true });
    
    // Method 2: If above doesn't work, uncomment this:
    // setTimeout(() => {
    //   navigate('/login');
    // }, 100);
    
  } catch (err) {
    console.log("Registration error:", err);
    console.log("Error response:", err.response);
    console.log("Error data:", err.response?.data);
    setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    toast.error('Registration failed');
  } finally {
    setLoading(false);
  }
};
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-30"></div>
      <div className="relative w-full max-w-md px-6">
        <div className='bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-10'>
          <div className='text-center mb-10'>
            <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-b from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/50 mb-4'>
              <BrainCircuit className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-medium text-slate-900 mb-2 tracking-tight">
              Create an account
            </h1>
            <p className="text-slate-500 text-sm">
              Start your AI-powered learning experience
            </p>
          </div>
          <div className='space-y-5'>
            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Username
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === 'username' ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                  <User className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors duration-200"
                  placeholder="johndoe"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Email
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === 'email' ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors duration-200"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Password
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === 'password' ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors duration-200"
                  placeholder="••••••"
                />
              </div>
            </div>

            {error && (
              <div className='rounded-lg bg-red-50 border border-red-200 p-3'>
                <p className='text-xs text-red-600 font-medium text-center'>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="group relative w-full h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-emerald-500/25 overflow-hidden"
            >
              <span className='relative z-10 flex items-center justify-center gap-2'>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account....
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" strokeWidth={2.5} />
                  </>
                )}
              </span>
              <div className='absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700'></div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200/60">
            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link to='/login' className="text-emerald-600 hover:text-emerald-700 transition-colors duration-200 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default RegisterPage;