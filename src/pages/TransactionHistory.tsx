import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Search, Calendar, Filter, History, ArrowDown, ChevronDown, Download, RefreshCcw } from 'lucide-react';
import { getTransactions, getUserInfo, Transaction } from '../services/transactionService';
import { TransactionSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface UserDisplayInfo {
  userName: string;
}

interface UserInfoDisplayProps {
  userId: string | undefined;
}

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

const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({ userId }) => {
  const [userData, setUserData] = useState<UserDisplayInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const fetchedUserInfo: UserDisplayInfo = await getUserInfo(userId);
        setUserData(fetchedUserInfo);
      } catch (error) {
        console.error(`Error fetching user info for ID ${userId}:`, error);
        setUserData({ userName: 'Unknown User' }); // Fallback display name
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]); // Re-fetch if userId changes

  if (isLoading) {
    return (
      <motion.span 
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        Loading name...
      </motion.span>
    );
  }

  return <span>{userData?.userName ?? 'N/A'}</span>; // Display name or N/A
};

const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // user can be User object, null (logged out), or undefined (auth loading)
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [timeFrame, setTimeFrame] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchUserTransactions = async () => {
      if (user === undefined) { // Auth status might still be loading
        setLoading(true); // Keep TransactionHistory in a loading state
        return;
      }

      if (user === null) { // User is definitively not logged in
        setLoading(false);
        setTransactions([]);
        return;
      }

      // User is authenticated, user.id should be available
      if (!user.id) {
        console.error('User object is present but user.id is missing.');
        setLoading(false);
        setTransactions([]);
        return;
      }
      
      try {
        setLoading(true); // Indicate loading before fetching
        const fetchedTransactions = await getTransactions(user.id);
        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]); // Clear transactions on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserTransactions();
  }, [user]); // Depend on the user object to react to auth state changes

  const handleRefresh = async () => {
    if (!user?.id || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const fetchedTransactions = await getTransactions(user.id);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const transactionTypeString = String(transaction.type || '').toLowerCase();
    const lowercasedSearchQuery = searchQuery.toLowerCase();
    const matchesSearch = transactionTypeString.includes(lowercasedSearchQuery);
    
    // Filter by transaction type
    let matchesType = true;
    if (user?.id) {
      if (filterType === 'sent') {
        matchesType = transaction.senedrId === user.id;
      } else if (filterType === 'received') {
        matchesType = transaction.senedrId !== user.id;
      }
    }
    
    // Filter by date/time frame
    let matchesTimeFrame = true;
    const transactionDate = new Date(transaction.createdAt);
    const today = new Date();
    
    if (timeFrame === 'today') {
      matchesTimeFrame = transactionDate.toDateString() === today.toDateString();
    } else if (timeFrame === 'thisWeek') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      matchesTimeFrame = transactionDate >= weekStart;
    } else if (timeFrame === 'thisMonth') {
      matchesTimeFrame = 
        transactionDate.getMonth() === today.getMonth() && 
        transactionDate.getFullYear() === today.getFullYear();
    } else if (timeFrame === 'custom' && selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      matchesTimeFrame = transactionDate.toDateString() === selectedDateObj.toDateString();
    }
    
    return matchesSearch && matchesType && matchesTimeFrame;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>
        <div className="p-6 bg-white shadow-md rounded-xl">
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <TransactionSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-6 p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-600">View all your transactions</p>
      </motion.header>

      <motion.div 
        className="p-6 bg-white shadow-md rounded-xl"
        variants={itemVariants}
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      >
        {/* Search and Filter */}
        <motion.div 
          className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-center"
          variants={itemVariants}
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <motion.input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              className="w-full px-4 py-2 pl-10 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative inline-block">
              <Filter size={18} className="absolute text-gray-500 -translate-y-1/2 left-3 top-1/2" />
              <motion.select
                aria-label="Filter transactions by type"
                value={filterType}
                onChange={event => setFilterType(event.target.value)}
                className="py-2 pl-10 pr-8 transition-colors border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                <option value="all">All</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
              </motion.select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
            
            <motion.div className="relative">
              <motion.button
                className="px-3 py-2 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                title="Filter by date"
                aria-label="Filter by date"
                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Calendar size={18} />
                <motion.div
                  animate={{ rotate: isDateFilterOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-1"
                >
                  <ChevronDown size={14} />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {isDateFilterOpen && (
                  <motion.div
                    className="absolute right-0 z-10 mt-2 w-56 rounded-md shadow-lg bg-white p-2 border border-gray-200"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="py-1">
                      <button
                        className={`block px-4 py-2 text-sm text-left rounded-md w-full ${timeFrame === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => { setTimeFrame('all'); setIsDateFilterOpen(false); }}
                      >
                        All Time
                      </button>
                      <button
                        className={`block px-4 py-2 text-sm text-left rounded-md w-full ${timeFrame === 'today' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => { setTimeFrame('today'); setIsDateFilterOpen(false); }}
                      >
                        Today
                      </button>
                      <button
                        className={`block px-4 py-2 text-sm text-left rounded-md w-full ${timeFrame === 'thisWeek' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => { setTimeFrame('thisWeek'); setIsDateFilterOpen(false); }}
                      >
                        This Week
                      </button>
                      <button
                        className={`block px-4 py-2 text-sm text-left rounded-md w-full ${timeFrame === 'thisMonth' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => { setTimeFrame('thisMonth'); setIsDateFilterOpen(false); }}
                      >
                        This Month
                      </button>
                      <div className="mt-2 px-4">
                        <p className="text-xs text-gray-500 mb-1">Custom Date:</p>
                        <input
                          type="date"
                          className="w-full p-1 text-sm border border-gray-300 rounded-md"
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setTimeFrame('custom');
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.button
              className="px-3 py-2 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              title="Refresh transactions"
              aria-label="Refresh transactions"
              onClick={handleRefresh}
              disabled={isRefreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : {}}
                transition={{ 
                  repeat: isRefreshing ? Infinity : 0,
                  duration: 1, 
                  ease: "linear" 
                }}
              >
                <RefreshCcw size={18} className={isRefreshing ? "text-blue-500" : "text-gray-500"} />
              </motion.div>
            </motion.button>
            
            <motion.button
              className="px-3 py-2 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              title="Download transactions"
              aria-label="Download transactions"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={18} className="text-gray-500" />
            </motion.button>
          </div>
        </motion.div>

        {/* Transactions List */}
        <AnimatePresence mode="wait">
          {filteredTransactions.length > 0 ? (
            <motion.div 
              className="divide-y divide-gray-100"
              key="transactions-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredTransactions.map((transaction, index) => {
                // Determine if the transaction was sent by the current logged-in user
                const isSentByCurrentUser = user ? transaction.senedrId === user.id : false;
                // Determine the ID of the other party involved in the transaction
                const otherPartyId = isSentByCurrentUser ? transaction.receiverId : transaction.senedrId;

                return (
                  <motion.div 
                    key={transaction.id} 
                    className="flex items-center justify-between py-4 transition-colors hover:bg-gray-50 px-2 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: index * 0.05 }
                    }}
                    whileHover={{ 
                      backgroundColor: "#f9fafb",
                      x: 2
                    }}
                    layout
                  >
                    <div className="flex items-center">
                      <motion.div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSentByCurrentUser ? 'bg-red-100' : 'bg-green-100'
                        }`}
                        whileHover={{ scale: 1.1 }}
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
                        <motion.p 
                          className="text-sm text-gray-500"
                          initial={{ opacity: 0.7 }}
                          whileHover={{ opacity: 1 }}
                        >
                          Transaction #{transaction.id}
                        </motion.p>
                      </div>
                    </div>
                    <motion.div 
                      className="text-right"
                      whileHover={{ scale: 1.05 }}
                    >
                      <p className={`font-semibold ${
                        isSentByCurrentUser ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isSentByCurrentUser ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                icon={History}
                title="No transactions found"
                description={
                  searchQuery || filterType !== 'all' || timeFrame !== 'all'
                    ? "No transactions match your filter criteria."
                    : "Start your journey by sending or receiving money."
                }
                action={
                  !searchQuery && transactions.length === 0 // Show action only if no search and no transactions overall
                    ? {
                        label: "Send Money",
                        onClick: () => navigate('/send')
                      }
                    : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {filteredTransactions.length > 0 && (
          <motion.div 
            className="mt-6 flex justify-between items-center text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p>Showing {filteredTransactions.length} of {transactions.length} transactions</p>
            <div className="flex space-x-1">
              <motion.button
                className="px-3 py-1 rounded-md hover:bg-gray-100"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowDown size={14} className="text-gray-500" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TransactionHistory;