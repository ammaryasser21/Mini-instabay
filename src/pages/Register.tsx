import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DollarSign, AlertCircle, Phone, Check, X, User, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation rules
  const passwordRules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    setIsLoading(true);

    interface ApiError {
      response?: {
        data?: {
          data?: {
            Error?: string | string[];
          };
        };
      };
      message?: string;
    }

    try {
      await register(name, email, password, phoneNumber);
      navigate('/login');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in apiErr &&
        typeof apiErr.response === 'object' &&
        apiErr.response?.data?.data?.Error
      ) {
        // Handle structured validation errors from the API
        const errorMessages = apiErr.response.data.data.Error;
        setError(Array.isArray(errorMessages) ? errorMessages.join('\n') : errorMessages);
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <motion.div 
      className="flex items-center space-x-2"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {met ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          <Check size={16} className="text-green-500" />
        </motion.div>
      ) : (
        <X size={16} className="text-gray-400" />
      )}
      <motion.span 
        className={met ? 'text-green-500' : 'text-gray-500'}
        animate={{ fontWeight: met ? 500 : 400 }}
      >
        {text}
      </motion.span>
    </motion.div>
  );

  const formItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      <motion.div 
        className="absolute inset-0 z-0 opacity-30"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{ 
          duration: 20, 
          ease: "linear", 
          repeat: Infinity, 
          repeatType: "reverse" 
        }}
        style={{ 
          backgroundSize: '200% 200%', 
          backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(255,255,255,0) 70%)' 
        }}
      />
      
      <motion.div 
        className="w-full max-w-md p-8 bg-white shadow-lg rounded-xl z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.div 
          className="mb-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <DollarSign size={36} className="text-blue-600" />
          </motion.div>
          <motion.h1 
            className="mt-4 text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Create an Account
          </motion.h1>
          <motion.p 
            className="mt-2 text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Join Mini InstaPay today
          </motion.p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="p-4 mb-4 text-red-700 rounded-lg bg-red-50"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center mb-2">
                <AlertCircle size={18} className="flex-shrink-0 mr-2" />
                <span className="font-medium">Registration failed</span>
              </div>
              <div className="ml-6 text-sm whitespace-pre-line">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="relative">
              <User size={18} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <motion.input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
              />
            </div>
          </motion.div>

          <motion.div
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <motion.input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
              />
            </div>
          </motion.div>

          <motion.div
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <label htmlFor="phoneNumber" className="block mb-1 text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={18} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <motion.input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (123) 456-7890"
                required
                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
              />
            </div>
          </motion.div>

          <motion.div
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <motion.input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                className={`w-full px-4 py-2 pl-10 border rounded-lg transition-colors ${
                  password && (isPasswordValid ? 'border-green-500' : 'border-red-300')
                } focus:ring-blue-500 focus:border-blue-500`}
                required
                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
              />
            </div>
            <AnimatePresence>
              {showPasswordRequirements && (
                <motion.div 
                  className="p-3 mt-2 space-y-2 text-sm rounded-lg bg-gray-50"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ValidationItem met={passwordRules.minLength} text="At least 8 characters" />
                  <ValidationItem met={passwordRules.hasUppercase} text="At least one uppercase letter" />
                  <ValidationItem met={passwordRules.hasLowercase} text="At least one lowercase letter" />
                  <ValidationItem met={passwordRules.hasNumber} text="At least one number" />
                  <ValidationItem met={passwordRules.hasSpecialChar} text="At least one special character" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <motion.input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 pl-10 border rounded-lg transition-colors ${
                  confirmPassword && (password === confirmPassword ? 'border-green-500' : 'border-red-300')
                } focus:ring-blue-500 focus:border-blue-500`}
                required
                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
              />
            </div>
            <AnimatePresence>
              {confirmPassword && password !== confirmPassword && (
                <motion.p 
                  className="mt-1 text-sm text-red-600"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  Passwords do not match
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div 
            className="pt-2"
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <motion.button
              type="submit"
              disabled={isLoading || !isPasswordValid || password !== confirmPassword}
              className="w-full py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              whileHover={{ scale: 1.02, backgroundColor: "#2563eb" }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                "Create Account"
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-600">
            Already have an account?{' '}
            <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-800">
                Sign in
              </Link>
            </motion.span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;