import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Send, History, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTransactions, getBalance, Transaction, updateBalance, getUserInfo } from '../services/transactionService';
import { CardSkeleton, TransactionSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import { motion } from 'framer-motion';

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300 } }
};

interface UserDisplayInfo {
  userName: string; 
}

// Props for the UserInfoDisplay component
interface UserInfoDisplayProps {
  userId: string | undefined; // userId can be undefined if not available or applicable
}

// Component to fetch and display user's name based on userId
// This component is similar to the one in your TransactionHistory example
const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({ userId }) => {
  const [userData, setUserData] = useState<UserDisplayInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with loading false

  useEffect(() => {
    if (!userId) {
      setUserData(null); // No user ID, so no data to fetch or display
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Assumes getUserInfo is an async function in transactionService that returns UserDisplayInfo
        const fetchedUserInfo: UserDisplayInfo = await getUserInfo(userId);
        setUserData(fetchedUserInfo);
      } catch (error) {
        console.error(`Error fetching user info for ID ${userId}:`, error);
        // Fallback user data in case of an error
        setUserData({ userName: 'Unknown User' }); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]); // Effect dependencies: re-run if userId changes

  if (isLoading) {
    // Display a loading state while fetching data
    return <span className="text-xs italic text-gray-500">loading...</span>;
  }

  // Display the user's name; fallback to 'N/A' if name is not available for any reason
  return <span className="font-semibold">{userData?.userName ?? 'N/A'}</span>;
};


const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [newBalance, setNewBalance] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      setLoading(true); // Ensure loading is true at the start of fetch
      try {
        const [ transactionsData, balanceData] = await Promise.all([
          getTransactions(user.id),
          getBalance(user.id),
        ]);
        
        setBalance(balanceData.balance);
        setRecentTransactions(transactionsData.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showAlert('error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id, showAlert]);
  

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !newBalance || updating) return;

    const amount = parseFloat(newBalance);
    if (isNaN(amount) || amount <= 0) {
      showAlert('error', 'Please enter a valid amount');
      return;
    }

    setUpdating(true); // Set updating to true before the async call
    try {
      const response = await updateBalance(user.id, amount);
      setBalance(response.data.newbalance); // Assuming newbalance is the correct field
      showAlert('success', 'Balance updated successfully');
      setNewBalance('');

    } catch (error) {
      console.error('Failed to update balance:', error);
      showAlert('error', 'Failed to update balance');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !recentTransactions.length) { // Improved loading condition to prevent UI flicker if data is already partially loaded
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="p-6 bg-white shadow-md rounded-xl">
          <div className="space-y-4">
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
          </div>
        </div>
      </div>
    );
  }


  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}</p>
      </motion.header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <motion.div 
          className="p-6 text-white shadow-md bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl overflow-hidden relative"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <motion.div 
            className="absolute inset-0 bg-blue-500 opacity-10"
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ 
              duration: 15, 
              ease: "linear", 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            style={{ 
              backgroundSize: '200% 200%', 
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0) 70%)' 
            }}
          />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-blue-100">Available Balance</p>
              <motion.h2 
                className="mt-2 text-3xl font-bold"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >${balance.toFixed(2)}</motion.h2>
            </div>
            <motion.div 
              className="p-3 bg-blue-500 rounded-full"
              whileHover={{ rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <DollarSign className="w-6 h-6 text-white" />
            </motion.div>
          </div>      
          <form onSubmit={handleUpdateBalance} className="flex gap-2 mt-4">
            <motion.input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              placeholder="Enter amount to add" 
              className="flex-1 px-3 py-2 text-white placeholder-blue-300 bg-blue-700 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              step="0.01"
              min="0.01"
              disabled={updating}
              whileFocus={{ scale: 1.02 }}
            />
            <motion.button
              type="submit"
              disabled={updating || !newBalance || parseFloat(newBalance) <= 0}
              className="px-4 py-2 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {updating ? 'Updating...' : 'Add Funds'} 
            </motion.button>
          </form>
        </motion.div>

        <motion.div 
          className="p-6 bg-white shadow-md rounded-xl"
          variants={itemVariants}
          whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        >
          <h3 className="font-semibold text-gray-700">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <motion.button 
              onClick={() => navigate('/send')}
              className="flex flex-col items-center justify-center p-4 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100 group"
              whileHover={{ scale: 1.05, backgroundColor: "#dbeafe" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div 
                className="flex items-center justify-center w-10 h-10 mb-2 transition-colors bg-blue-100 rounded-full group-hover:bg-blue-200"
                whileHover={{ rotate: 5 }}
              >
                <Send size={20} className="text-blue-600" />
              </motion.div>
              <span className="text-sm font-medium text-gray-700">Send Money</span>
            </motion.button>
            
            <motion.button 
              onClick={() => navigate('/history')}
              className="flex flex-col items-center justify-center p-4 transition-colors rounded-lg bg-green-50 hover:bg-green-100 group"
              whileHover={{ scale: 1.05, backgroundColor: "#dcfce7" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div 
                className="flex items-center justify-center w-10 h-10 mb-2 transition-colors bg-green-100 rounded-full group-hover:bg-green-200"
                whileHover={{ rotate: 5 }}
              >
                <History size={20} className="text-green-600" />
              </motion.div>
              <span className="text-sm font-medium text-gray-700">View History</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="p-6 bg-white shadow-md rounded-xl"
        variants={itemVariants}
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Recent Transactions</h3>
          <motion.button 
            onClick={() => navigate('/history')}
            className="text-sm text-blue-600 hover:text-blue-800"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All
          </motion.button>
        </div>
        
        {recentTransactions.length > 0 ? (
          <motion.div 
            className="divide-y divide-gray-100"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {recentTransactions.map((transaction) => {
              const isSentByCurrentUser = transaction.senedrId === user?.id;
              const otherPartyId = isSentByCurrentUser ? transaction.receiverId : transaction.senedrId;

              return (
                <motion.div 
                  key={transaction.id} 
                  className="flex items-center justify-between py-4"
                  variants={itemVariants}
                  whileHover={{ backgroundColor: "#f9fafb", x: 2 }}
                >
                  <div className="flex items-center">
                    <motion.div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSentByCurrentUser ? 'bg-red-100' : 'bg-green-100'
                      }`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isSentByCurrentUser ? (
                        <ArrowUpRight size={18} className="text-red-600" />
                      ) : (
                        <ArrowDownLeft size={18} className="text-green-600" />
                      )}
                    </motion.div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">
                        {isSentByCurrentUser ? 'Sent to ' : 'Received from '}
                        {/* Use the UserInfoDisplay component to show the other party's name */}
                        <UserInfoDisplay userId={otherPartyId} />
                      </p>
                      <p className="text-sm text-gray-500">Transaction #{transaction.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.p 
                      className={`font-semibold ${
                        isSentByCurrentUser ? 'text-red-600' : 'text-green-600'
                      }`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.3, delay: 0.1 * parseInt(transaction.id) }}
                    >
                      {isSentByCurrentUser ? '-' : '+'}${transaction.amount.toFixed(2)}
                    </motion.p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <EmptyState
            icon={<History className="w-12 h-12 text-gray-400" />}
            title="No Transactions Yet"
            description="You don't have any transactions yet. Send money to someone to get started."
            actionText="Send Money"
            onAction={() => navigate('/send')}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;