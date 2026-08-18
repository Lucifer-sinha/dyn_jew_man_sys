// src/pages/Login.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("staff");
  
  // UI states
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed. Please check your credentials.');
      }

      const data = await response.json();
      if (onLoginSuccess) {
        onLoginSuccess(data.role);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!username || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Registration failed. Username or email may already exist.');
      }

      const data = await response.json();
      setSuccessMsg("Account created successfully!");
      
      // Log in automatically after successful registration
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(data.role || role);
        }
      }, 1000);
    } catch (err) {
      console.error("SignUp error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (signUpState) => {
    setIsSignUp(signUpState);
    setError("");
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen bg-[#0a0a2f] text-white flex flex-col items-center justify-center font-[Cinzel] px-4 py-8 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[url('/images/luxury-pattern.png')] opacity-5 z-0 bg-repeat"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#ff00ff]/10 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#00ffff]/10 to-transparent pointer-events-none"></div>

      <motion.div 
        className="bg-[#11112a]/95 backdrop-blur-xl border border-[#2a2a5a]/60 p-6 md:p-8 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] w-full max-w-md relative z-10 my-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Title Header */}
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h2 className="text-[clamp(1.2rem,2.5vw,1.6rem)] font-bold text-[#f3ba19] tracking-wide mb-1">
            Jewelry Management
          </h2>
          <p className="text-gray-400 text-xs md:text-sm font-sans">
            {isSignUp ? "Create your workspace account" : "Sign in to access your portal"}
          </p>
        </motion.div>

        {/* Tab Toggle (Sign In / Sign Up) */}
        <div className="flex bg-[#1a1a3a] p-1 rounded-xl mb-6 border border-[#2a2a4a]">
          <button
            type="button"
            onClick={() => toggleMode(false)}
            className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 ${
              !isSignUp 
                ? "bg-gradient-to-r from-[#f3ba19] to-[#e09600] text-[#000014] shadow-md" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => toggleMode(true)}
            className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 ${
              isSignUp 
                ? "bg-gradient-to-r from-[#f3ba19] to-[#e09600] text-[#000014] shadow-md" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Alert Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="err"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 text-xs md:text-sm rounded-lg font-sans flex items-center gap-2"
            >
              <span>⚠️</span> {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              key="succ"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-300 text-xs md:text-sm rounded-lg font-sans flex items-center gap-2"
            >
              <span>✨</span> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Form Area */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4 font-sans">
          <div>
            <label className="block text-gray-300 text-xs md:text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              required
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1a1a3a] text-white rounded-lg border border-[#2a2a4a] focus:border-[#f3ba19] focus:ring-1 focus:ring-[#f3ba19] focus:outline-none text-sm transition-all !px-2 !py-2"
            />
          </div>

          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                key="signup-email"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-gray-300 text-xs md:text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1a1a3a] text-white rounded-lg border border-[#2a2a4a] focus:border-[#f3ba19] focus:ring-1 focus:ring-[#f3ba19] focus:outline-none text-sm transition-all !px-2 !py-2"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-gray-300 text-xs md:text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1a1a3a] text-white rounded-lg border border-[#2a2a4a] focus:border-[#f3ba19] focus:ring-1 focus:ring-[#f3ba19] focus:outline-none text-sm transition-all !px-2 !py-2"
            />
          </div>

          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                key="signup-extra"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-gray-300 text-xs md:text-sm font-medium mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1a1a3a] text-white rounded-lg border border-[#2a2a4a] focus:border-[#f3ba19] focus:ring-1 focus:ring-[#f3ba19] focus:outline-none text-sm transition-all !px-2 !py-2"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-xs md:text-sm font-medium mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1a1a3a] text-white rounded-lg border border-[#2a2a4a] focus:border-[#f3ba19] focus:ring-1 focus:ring-[#f3ba19] focus:outline-none text-sm transition-all !px-2 !py-2"
                  >
                    <option value="staff">Staff / Store Manager</option>
                    <option value="user">Sales Representative</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-[#f3ba19] to-[#e09600] text-[#000014] rounded-lg font-bold hover:shadow-lg hover:shadow-[#f3ba19]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </motion.button>
        </form>

        {/* Footer Toggle Text */}
        <div className="mt-6 text-center text-xs md:text-sm text-gray-400 font-sans border-t border-[#2a2a4a]/40 pt-4">
          {isSignUp ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => toggleMode(false)}
                className="text-[#f3ba19] hover:underline font-semibold ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => toggleMode(true)}
                className="text-[#f3ba19] hover:underline font-semibold ml-1 cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Login;

