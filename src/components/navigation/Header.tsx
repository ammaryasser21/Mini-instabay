import React from 'react';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <motion.header 
      className="bg-white shadow-sm z-10"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <motion.button
            type="button"
            className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Menu size={24} />
          </motion.button>
          <motion.div 
            className="ml-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <motion.h1 
              className="text-xl font-semibold text-blue-800"
              whileHover={{ scale: 1.03 }}
            >
              Mini InstaPay
            </motion.h1>
          </motion.div>
        </div>
            

        <div className="flex items-center space-x-4">
          <motion.button 
            className="text-gray-600 hover:text-gray-900 focus:outline-none relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell size={20} />
            <motion.span 
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 10, 
                delay: 1 
              }}
            ></motion.span>
          </motion.button>
          
          <div className="relative">
            <motion.button
              className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none"
              onClick={() => setShowDropdown(!showDropdown)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white overflow-hidden"
                whileHover={{ 
                  backgroundColor: "#2563eb",
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" 
                }}
              >
                <User size={18} />
              </motion.div>
              <motion.span 
                className="ml-2 hidden md:block font-medium"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {user?.name}
              </motion.span>
            </motion.button>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 overflow-hidden"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.a 
                    href="#" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    whileHover={{ x: 2, backgroundColor: "#f3f4f6" }}
                  >
                    <Settings size={16} className="mr-2" />
                    Profile
                  </motion.a>
                  <motion.button
                    onClick={logout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-400 hover:text-white"
                    whileHover={{ x: 2, backgroundColor: "#f87171" }}
                  >
                    <LogOut size={16} className="mr-2" />
                    Log out
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;