import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send as SendIcon, Phone, DollarSign, ArrowRight } from 'lucide-react';
import { sendMoney, getUserInfo, UserInfo } from '../services/transactionService';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const SendMoney: React.FC = () => {
  const [receiverPhone, setReceiverPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user?.id) {
        try {
          const info = await getUserInfo(user.id);
          setUserInfo(info);
        } catch (error) {
          console.error('Failed to fetch user information:', error);
          showAlert('error', 'Failed to fetch user information');
        }
      }
    };

    fetchUserInfo();
  }, [user?.id, showAlert]);

  const validatePhone = (phone: string) => {
    // E.164 format regex: starts with +, followed by 1-3 digits for country code,
    // then 4-14 digits for the rest of the number. Total length after + is up to 15 digits.
    // Example: +1234567890, +201092451993
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    const maxAmount = userInfo?.balance ?? 0;
    return !isNaN(numValue) && numValue >= 0.01 && numValue <= maxAmount;
  };

  const isPhoneValid = validatePhone(receiverPhone);
  const isAmountValid = validateAmount(amount);
  const showPhoneError = phoneTouched && !isPhoneValid && receiverPhone !== '';
  const showAmountError = amountTouched && !isAmountValid && amount !== '';

  const getPhoneErrorMessage = () => {
    if (!receiverPhone) return 'Phone number is required';
    if (!isPhoneValid) return 'Please enter a valid international phone number (e.g., +1234567890)';
    return '';
  };

  const getAmountErrorMessage = () => {
    if (!amount) return 'Amount is required';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'Please enter a valid number';
    if (numAmount < 0.01) return 'Amount must be at least $0.01';
    if (numAmount > (userInfo?.balance ?? 0)) return 'Insufficient balance';
    return '';
  };

  const validateForm = () => {
    if (!receiverPhone || !isPhoneValid) {
      showAlert('error', getPhoneErrorMessage());
      return false;
    }

    if (!amount || !isAmountValid) {
      showAlert('error', getAmountErrorMessage());
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Touch fields to show errors if they were not touched before submit
    setPhoneTouched(true);
    setAmountTouched(true);

    if (!validateForm() || !user?.id) return;

    setLoading(true);

    try {
      console.log(`Sending ${amount} to ${receiverPhone} from user ${user.id}`);
      await sendMoney(user.id, receiverPhone, parseFloat(amount));
      showAlert('success', 'Money sent successfully!');
      
      setReceiverPhone('');
      setAmount('');
      setPhoneTouched(false);
      setAmountTouched(false);
      
      // Fetch updated user info to reflect new balance
      if (user?.id) {
        const info = await getUserInfo(user.id);
        setUserInfo(info);
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      showAlert('error', err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or numbers with up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300,
        damping: 24
      } 
    }
  };

  return (
    <motion.div 
      className="max-w-lg min-h-screen py-8 mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={itemVariants}>
        <h1 className="text-3xl font-bold text-center text-gray-900">Send Money</h1>
        <p className="mt-2 text-center text-gray-600">Transfer funds to another user securely.</p>
      </motion.header>

      {userInfo && (
        <motion.div 
          className="p-4 text-center rounded-lg bg-blue-50"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm text-gray-600">Available Balance</p>
          <motion.p 
            className="text-2xl font-semibold text-blue-700"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            ${userInfo.balance.toFixed(2)}
          </motion.p>
        </motion.div>
      )}

      <motion.div 
        className="p-6 bg-white shadow-xl rounded-xl sm:p-8"
        variants={itemVariants}
        whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div variants={itemVariants}>
            <label htmlFor="receiverPhone" className="block mb-1.5 text-sm font-medium text-gray-700">
              Recipient's Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={18} />
              {(() => {
                let phoneInputClass =
                  'w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors text-sm ';
                if (showPhoneError) {
                  phoneInputClass += 'border-red-500 focus:ring-red-500 focus:border-red-500 placeholder-red-400';
                } else if (phoneTouched && isPhoneValid && receiverPhone !== '') {
                  phoneInputClass += 'border-green-500 focus:ring-green-500 focus:border-green-500';
                } else {
                  phoneInputClass += 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400';
                }
                return (
                  <motion.input
                    id="receiverPhone"
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    onBlur={() => setPhoneTouched(true)}
                    className={phoneInputClass}
                    placeholder="e.g., +1234567890"
                    disabled={loading}
                    aria-describedby="phone-error"
                    aria-invalid={showPhoneError}
                    whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
                  />
                );
              })()}
              <AnimatePresence>
                {showPhoneError && (
                  <motion.p 
                    id="phone-error" 
                    className="mt-1.5 text-xs text-red-600"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {getPhoneErrorMessage()}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label htmlFor="amount" className="block mb-1.5 text-sm font-medium text-gray-700">
              Amount ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={18} />
              {(() => {
                let amountInputClass =
                  'w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors text-sm ';
                if (showAmountError) {
                  amountInputClass += 'border-red-500 focus:ring-red-500 focus:border-red-500 placeholder-red-400';
                } else if (amountTouched && isAmountValid && amount !== '') {
                  amountInputClass += 'border-green-500 focus:ring-green-500 focus:border-green-500';
                } else {
                  amountInputClass += 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400';
                }
                return (
                  <motion.input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    onBlur={() => setAmountTouched(true)}
                    className={amountInputClass}
                    placeholder="0.00"
                    disabled={loading}
                    aria-describedby="amount-error"
                    aria-invalid={showAmountError}
                    whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
                  />
                );
              })()}
              <AnimatePresence>
                {showAmountError && (
                  <motion.p 
                    id="amount-error" 
                    className="mt-1.5 text-xs text-red-600"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {getAmountErrorMessage()}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2 }}
            whileTap={{ y: 1 }}
          >
            <motion.button
              type="submit"
              disabled={loading || (!isPhoneValid && phoneTouched) || (!isAmountValid && amountTouched)}
              className="flex items-center justify-center w-full py-3 font-semibold text-white transition-colors duration-150 bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02, backgroundColor: "#2563eb" }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <motion.div 
                  className="flex items-center"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.svg 
                    className="w-5 h-5 mr-2 text-white" 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </motion.svg>
                  Processing...
                </motion.div>
              ) : (
                <motion.div 
                  className="flex items-center"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <SendIcon size={18} className="mr-2" />
                  Send Money
                  <motion.div 
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight size={16} />
                  </motion.div>
                </motion.div>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SendMoney;