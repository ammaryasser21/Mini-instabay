import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Download, Calendar, TrendingUp, DollarSign, ArrowRightLeft, Users, AlertCircle, TrendingDown, PackageOpen,
  ArrowUp, ArrowDown, Clock, Search
} from 'lucide-react';
import {
  getHistory,
  getSummary,
  // Assuming HistoryEntry from service might need adjustment or we define a local one
  // For now, let's define a local type that matches the API response structure
  // HistoryEntry as ServiceHistoryEntry, // if we need to differentiate
  SummaryValues,
} from '../services/reportingService';
import { CardSkeleton, ChartSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Local interface matching the provided API transaction structure
interface Transaction {
  id: number;
  senedrId: string; // API uses senedrId
  receiverId: string;
  amount: number;
  createdAt: string; // API uses createdAt
  type: "Send" | "Receive"; // API uses type
}

// For the chart data
interface MonthlyAmountData {
  month: string;
  sent: number;
  received: number;
  dateObject: Date;
}

// For derived statistics for the selected period
interface PeriodStats {
  transactionCount: number;
  totalSent: number;
  totalReceived: number;
  netFlow: number;
  averageSent: number | null; // Can be null if no send transactions
  averageReceived: number | null; // Can be null if no receive transactions
  sendCount: number;
  receiveCount: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
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

const Reports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // historyData will store transactions as fetched from API
  const [historyData, setHistoryData] = useState<Transaction[]>([]);
  // overallSummary stores the summary from getSummary (overall totals)
  const [overallSummary, setOverallSummary] = useState<SummaryValues | undefined>(undefined);
  const [reportPeriod, setReportPeriod] = useState('3month');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!user?.id) {
        setLoading(false);
        setHistoryData([]);
        setOverallSummary(undefined);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [historyResponse, summaryResponse] = await Promise.all([
          getHistory(user.id), // Expects { message: string, data: Transaction[] }
          getSummary(user.id)   // Expects { message: string, data: SummaryValues }
        ]);

        // Assuming historyResponse.data is Transaction[] and summaryResponse.data is SummaryValues
        if (historyResponse?.data) {
        const transformedData: Transaction[] = historyResponse.data.map(entry => ({
          id: entry.id,
          senedrId: entry.senderId, // Map senderId to senedrId
          receiverId: entry.receiverId,
          amount: entry.amount,
          createdAt: entry.transactionDate, // Map transactionDate to createdAt
          type: entry.transactionType as "Send" | "Receive", // Map transactionType to type and assert
        }));
        setHistoryData(transformedData);
      } else {
        setHistoryData([]);
      }
        setOverallSummary(summaryResponse?.data);

      } catch (err) {
        console.error('Reports: Error fetching report data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report data.');
        setHistoryData([]);
        setOverallSummary(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [user?.id]);

  const filteredHistoryData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    const now = new Date();
    const startDate = new Date(now); // Create a new date object to modify

    switch (reportPeriod) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3month':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6month':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 3);
    }
    startDate.setHours(0, 0, 0, 0); // Start of the day for comparison

    return historyData.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= startDate && transactionDate <= now;
    });
  }, [historyData, reportPeriod]);

  const periodStats = useMemo((): PeriodStats => {
    let totalSent = 0;
    let totalReceived = 0;
    let sendCount = 0;
    let receiveCount = 0;

    filteredHistoryData.forEach(tx => {
      if (tx.type === "Send") {
        totalSent += tx.amount;
        sendCount++;
      } else if (tx.type === "Receive") {
        totalReceived += tx.amount;
        receiveCount++;
      }
    });

    return {
      transactionCount: filteredHistoryData.length,
      totalSent,
      totalReceived,
      netFlow: totalReceived - totalSent,
      averageSent: sendCount > 0 ? totalSent / sendCount : null,
      averageReceived: receiveCount > 0 ? totalReceived / receiveCount : null,
      sendCount,
      receiveCount,
    };
  }, [filteredHistoryData]);

  const monthlyChartData = useMemo((): MonthlyAmountData[] => {
    if (!filteredHistoryData || filteredHistoryData.length === 0) {
      return [];
    }
    const monthlyAggregates: { [key: string]: { sent: number; received: number; dateObject: Date; monthDisplay: string } } = {};

    filteredHistoryData.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed
      const monthKey = `${year}-${month}`;
      const monthDisplay = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      if (!monthlyAggregates[monthKey]) {
        monthlyAggregates[monthKey] = {
          sent: 0,
          received: 0,
          dateObject: new Date(year, month, 1), // For sorting
          monthDisplay: monthDisplay,
        };
      }

      if (transaction.type === "Send") {
        monthlyAggregates[monthKey].sent += transaction.amount;
      } else if (transaction.type === "Receive") {
        monthlyAggregates[monthKey].received += transaction.amount;
      }
    });

    return Object.values(monthlyAggregates)
      .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime())
      .map(item => ({
        month: item.monthDisplay,
        sent: item.sent,
        received: item.received,
        dateObject: item.dateObject, // Keep if needed for other purposes
      }));
  }, [filteredHistoryData]);

  if (loading) {
    return (
      <div className="max-w-5xl p-4 mx-auto space-y-8 md:p-6">
        <header className="animate-pulse">
          <div className="w-1/2 h-8 mb-2 bg-gray-200 rounded md:w-1/3"></div>
          <div className="w-3/4 h-4 bg-gray-200 rounded md:w-1/2"></div>
        </header>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="p-6 bg-white shadow-lg rounded-xl animate-pulse">
          <div className="w-1/3 h-6 mb-6 bg-gray-200 rounded"></div>
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <motion.div 
        className="max-w-5xl p-4 mx-auto space-y-8 text-center md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, 0] }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
            <Users size={64} className="mx-auto mb-6 text-gray-400" />
        </motion.div>
        <motion.h1 
          className="text-2xl font-bold text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Login Required
        </motion.h1>
        <motion.p 
          className="text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
                Please log in to view your financial reports and analytics.
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="max-w-5xl p-4 mx-auto space-y-8 text-center md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
        <AlertCircle size={64} className="mx-auto mb-6 text-red-500" />
        </motion.div>
        <motion.h1 
          className="text-2xl font-bold text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Error Loading Reports
        </motion.h1>
        <motion.p 
          className="text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          We encountered an issue while fetching your report data: <span className="font-medium">{error}</span>
        </motion.p>
        <motion.p 
          className="text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Please try again later.
        </motion.p>
      </motion.div>
    );
  }
  
  if (historyData.length === 0 && !error) {
     return (
      <motion.div 
        className="max-w-5xl p-4 mx-auto space-y-8 text-center md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.header 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
            <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-2 text-gray-600">View your transaction analytics and financial summary</p>
        </motion.header>
        
        <motion.div
          className="flex flex-col items-center justify-center p-16 bg-white rounded-xl shadow-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1, rotate: [0, 5, 0] }}
            transition={{ delay: 0.3, duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
          >
            <PackageOpen size={80} className="mb-6 text-blue-300" />
          </motion.div>
          <h2 className="mb-2 text-xl font-semibold text-gray-700">No Transaction Data Yet</h2>
          <p className="mb-6 text-gray-500">
            Start sending or receiving money to see your financial reports and analytics.
          </p>
          <motion.button
            onClick={() => navigate('/send')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Send Money
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="max-w-5xl p-4 mx-auto space-y-8 md:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={itemVariants}>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <p className="mt-2 text-gray-600">View your transaction analytics and financial summary</p>
      </motion.header>

      <motion.div className="flex items-center justify-between mb-6" variants={itemVariants}>
        <motion.div 
          className="flex p-1 border rounded-lg bg-gray-50"
          whileHover={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
        >
          {["1month", "3month", "6month", "1year"].map((period) => (
            <motion.button
              key={period}
              onClick={() => setReportPeriod(period)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                reportPeriod === period
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                backgroundColor: reportPeriod === period ? "#2563eb" : "transparent",
                color: reportPeriod === period ? "#ffffff" : "#4b5563"
              }}
            >
              {period === "1month"
                ? "1 Month"
                : period === "3month"
                ? "3 Months"
                : period === "6month"
                ? "6 Months"
                : "1 Year"}
            </motion.button>
          ))}
        </motion.div>

        <motion.button
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download size={16} className="mr-2" />
            Export
        </motion.button>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={itemVariants}
      >
        <SummaryCard
          title="Total Transactions"
          value={periodStats.transactionCount}
          icon={<ArrowRightLeft size={24} className="text-blue-500" />}
        />
        <SummaryCard
          title="Total Sent"
          prefix="$"
          value={periodStats.totalSent.toFixed(2)}
          icon={<TrendingUp size={24} className="text-red-500" />}
        />
        <SummaryCard
          title="Total Received"
          prefix="$"
          value={periodStats.totalReceived.toFixed(2)}
          icon={<TrendingDown size={24} className="text-green-500" />}
        />
      </motion.div>

      <motion.div 
        className="p-6 bg-white rounded-xl shadow-md"
        variants={itemVariants}
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
        layout
      >
        <motion.div 
          className="flex items-center justify-between mb-6"
          layout
        >
          <motion.h2 
            className="text-xl font-semibold text-gray-800"
            layout
          >
            Transaction History
          </motion.h2>
          <AnimatePresence mode="wait">
            <motion.div 
              key={reportPeriod}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
            >
              <Clock size={12} className="mr-1" />
              {reportPeriod === "1month"
                ? "Last Month"
                : reportPeriod === "3month"
                ? "Last 3 Months"
                : reportPeriod === "6month"
                ? "Last 6 Months"
                : "Last Year"}
            </motion.div>
          </AnimatePresence>
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={reportPeriod}
            className="h-80 w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            layout
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`} 
                />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, undefined]} 
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '10px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar 
                  dataKey="sent" 
                  name="Sent" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                  animationBegin={300}
                  isAnimationActive={true}
                />
                <Bar 
                  dataKey="received" 
                  name="Received" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                  animationBegin={600}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
        
        <motion.div 
          className="mt-8 overflow-hidden"
          layout
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="flex items-center justify-between mb-4"
            layout
          >
            <h3 className="text-base font-medium text-gray-700">Recent Transactions</h3>
            <div className="relative">
              <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-2 top-1/2" />
              <motion.input
                type="text"
                placeholder="Search transactions..."
                className="pl-8 pr-4 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                whileFocus={{ scale: 1.02, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
              />
            </div>
          </motion.div>
          
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Date</th>
                    <th scope="col" className="px-4 py-3">Type</th>
                    <th scope="col" className="px-4 py-3">Amount</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryData.slice(0, 5).map((transaction, index) => (
                    <motion.tr 
                      key={transaction.id}
                      className="bg-white border-b hover:bg-gray-50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ backgroundColor: "#f9fafb" }}
                    >
                      <td className="px-4 py-3">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <motion.div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                              transaction.type === "Send" ? "bg-red-100" : "bg-green-100"
                            }`}
                            whileHover={{ scale: 1.2 }}
                          >
                            {transaction.type === "Send" ? (
                              <ArrowUp size={12} className="text-red-600" />
                            ) : (
                              <ArrowDown size={12} className="text-green-600" />
                            )}
                          </motion.div>
                          {transaction.type}
                        </div>
                      </td>
                      <td className={`px-4 py-3 font-medium ${
                        transaction.type === "Send" ? "text-red-600" : "text-green-600"
                      }`}>
                        {transaction.type === "Send" ? "-" : "+"}${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Completed
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                  
                  {filteredHistoryData.length > 5 && (
                    <motion.tr 
                      className="bg-white text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <td colSpan={4} className="px-4 py-3">
                        <motion.button 
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          View All Transactions
                        </motion.button>
                      </td>
                    </motion.tr>
                  )}
                  
                  {filteredHistoryData.length === 0 && (
                    <motion.tr 
                      className="bg-white text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <td colSpan={4} className="px-4 py-8">
                        <motion.div 
                          className="flex flex-col items-center justify-center"
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <PackageOpen size={32} className="mb-2 text-gray-300" />
                          <p className="text-gray-500">No transactions found for this period</p>
                        </motion.div>
                      </td>
                    </motion.tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        variants={itemVariants}
      >
        <motion.div 
          className="p-6 bg-white rounded-xl shadow-md"
          whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        >
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Transaction Insights</h2>
          <div className="space-y-4">
            <InsightItem
              icon={<Calendar size={20} className="text-blue-500" />}
              label="Time Period"
              value={
                reportPeriod === "1month"
                  ? "Last Month"
                  : reportPeriod === "3month"
                  ? "Last 3 Months"
                  : reportPeriod === "6month"
                  ? "Last 6 Months"
                  : "Last Year"
              }
            />
            <InsightItem
              icon={<TrendingUp size={20} className="text-red-500" />}
              label="Average Sent"
              value={
                periodStats.averageSent !== null
                  ? `$${periodStats.averageSent.toFixed(2)}`
                  : "N/A"
              }
              description="Average amount per transaction"
            />
            <InsightItem
              icon={<TrendingDown size={20} className="text-green-500" />}
              label="Average Received"
              value={
                periodStats.averageReceived !== null
                  ? `$${periodStats.averageReceived.toFixed(2)}`
                  : "N/A"
              }
              description="Average amount per transaction"
            />
            <InsightItem
              icon={<DollarSign size={20} className="text-purple-500" />}
              label="Net Flow"
              value={`$${periodStats.netFlow.toFixed(2)}`}
              valueColor={
                periodStats.netFlow > 0
                  ? "text-green-600"
                  : periodStats.netFlow < 0
                  ? "text-red-600"
                  : "text-gray-900"
              }
              description="Total received minus total sent"
            />
          </div>
        </motion.div>

        <motion.div 
          className="p-6 bg-white rounded-xl shadow-md"
          whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        >
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Transaction Breakdown</h2>
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="inline-block w-3 h-3 mr-1 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-gray-700">Received ({periodStats.receiveCount})</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{Math.round((periodStats.receiveCount / (periodStats.transactionCount || 1)) * 100)}%</span>
            </div>
            <motion.div 
              className="flex h-4 mb-6 overflow-hidden text-xs rounded-full bg-gray-50"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div 
                className="flex flex-col justify-center text-center text-white bg-green-500"
                style={{ width: `${(periodStats.receiveCount / (periodStats.transactionCount || 1)) * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${(periodStats.receiveCount / (periodStats.transactionCount || 1)) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.5 }}
              ></motion.div>
            </motion.div>

            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="inline-block w-3 h-3 mr-1 bg-red-500 rounded-full"></span>
                <span className="text-sm font-medium text-gray-700">Sent ({periodStats.sendCount})</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{Math.round((periodStats.sendCount / (periodStats.transactionCount || 1)) * 100)}%</span>
            </div>
            <motion.div 
              className="flex h-4 overflow-hidden text-xs rounded-full bg-gray-50"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div 
                className="flex flex-col justify-center text-center text-white bg-red-500"
                style={{ width: `${(periodStats.sendCount / (periodStats.transactionCount || 1)) * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${(periodStats.sendCount / (periodStats.transactionCount || 1)) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.5 }}
              ></motion.div>
            </motion.div>

            <motion.div 
              className="mt-6 p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1.5 bg-blue-100 rounded-lg">
                  <DollarSign size={18} className="text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Total Money Movement</h3>
                  <p className="mt-1 text-sm text-gray-500">You've moved a total of <span className="font-semibold">${(periodStats.totalSent + periodStats.totalReceived).toFixed(2)}</span> in this period.</p>
      </div>
    </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

interface SummaryCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, prefix = '', icon }) => {
  return (
    <motion.div 
      className="p-6 bg-white rounded-xl shadow-md"
      whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <motion.div 
          className="p-2 bg-blue-50 rounded-lg"
          whileHover={{ rotate: 15 }}
        >
          {icon}
        </motion.div>
      </div>
      <motion.p 
        className="mt-4 text-2xl font-bold text-gray-900"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
      >
        {prefix}{value}
      </motion.p>
    </motion.div>
  );
};

interface InsightItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
  valueColor?: string;
}

const InsightItem: React.FC<InsightItemProps> = ({ icon, label, value, description, valueColor = "text-gray-900" }) => (
  <motion.div 
    className="flex items-start space-x-3"
    whileHover={{ x: 2 }}
  >
    <motion.div 
      className="p-1.5 bg-gray-100 rounded-lg"
      whileHover={{ rotate: 15 }}
    >
      {icon}
    </motion.div>
    <div>
      <div className="flex items-baseline space-x-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${valueColor}`}>{value}</span>
      </div>
      {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
    </div>
  </motion.div>
);

const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 8L12 3L7 8M12 21L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 16L12 21L7 16M12 3L12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default Reports;