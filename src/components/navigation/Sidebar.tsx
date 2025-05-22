import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Send, History, BarChart2, X, DollarSign, ChevronLeft, 
  UserPlus, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      type: "spring",
      stiffness: 300
    }
  })
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, toggleSidebar]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 z-20 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={toggleSidebar}
        className="fixed z-30 bottom-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        animate={{ 
          left: isOpen ? 'calc(16rem + 1rem)' : '1rem',
          rotate: isOpen ? 0 : 180
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <ChevronLeft size={24} />
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        className="fixed inset-y-0 left-0 z-30 w-64 bg-blue-900"
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -256,
          boxShadow: isOpen ? "10px 0 30px rgba(0, 0, 0, 0.2)" : "none" 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        <motion.div 
          className="flex items-center justify-between p-4 border-b border-blue-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-2">
            <motion.div 
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 5 }}
            >
              <DollarSign size={24} className="text-blue-300" />
            </motion.div>
            <span className="text-xl font-bold text-white">Mini InstaPay</span>
          </div>
          <motion.button
            onClick={toggleSidebar}
            className="text-white hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-lg p-1"
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </motion.button>
        </motion.div>

        <nav className="mt-6">
          <motion.ul className="space-y-1">
            <NavItem to="/dashboard" icon={<Home size={20} />} label="Dashboard" index={0} />
            <NavItem to="/send" icon={<Send size={20} />} label="Send Money" index={1} />
            <NavItem to="/history" icon={<History size={20} />} label="Transaction History" index={2} />
            <NavItem to="/reports" icon={<BarChart2 size={20} />} label="Reports" index={3} />
            
            <div className="border-t border-blue-800 my-4"></div>
            
            <NavItem to="/register" icon={<UserPlus size={20} />} label="Register" index={4} />
            <NavItem to="/login" icon={<LogIn size={20} />} label="Login" index={5} />
          </motion.ul>
        </nav>
      </motion.aside>
    </>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  index: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, index }) => (
  <motion.li
    variants={navItemVariants}
    initial="hidden"
    animate="visible"
    custom={index}
  >
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-white hover:bg-blue-800 transition-colors ${
          isActive ? 'bg-blue-800 border-l-4 border-blue-300' : ''
        }`
      }
    >
      {({ isActive }) => (
        <motion.div 
          className="flex items-center w-full"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span 
            className="mr-3"
            animate={{ scale: isActive ? 1.1 : 1, color: isActive ? '#93c5fd' : '#ffffff' }}
          >
            {icon}
          </motion.span>
          <span>{label}</span>
          {isActive && (
            <motion.div
              className="ml-auto h-2 w-2 rounded-full bg-blue-300"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
      )}
    </NavLink>
  </motion.li>
);

export default Sidebar;