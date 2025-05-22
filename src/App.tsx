import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import SendMoney from './pages/SendMoney';
import TransactionHistory from './pages/TransactionHistory';
import Reports from './pages/Reports';
import Loading from './components/common/Loading';

// Layout components
import MainLayout from './components/layouts/MainLayout';

const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Public routes for test dashboard ui without regestration */}
      {/* <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <Login />
          ) : (
            <Login/>
          )
        }
      />
      <Route
        path="/register"
        element={
          !isAuthenticated ? (
            <Register />
          ) : (
            <Register/>
          )
        }
      /> */}
      {/* Public routes for real */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />

      {/* Protected routes  for test dashboard ui without regestration  */}
      <Route
        path="/"
        element={isAuthenticated ? <MainLayout /> :<Navigate to="/login" />}
      >
        {/* Protected routes for real */}
        <Route
        path="/"
        element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}
      />
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="send" element={<SendMoney />} />
        <Route path="history" element={<TransactionHistory />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Fallback route */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />}
      />
    </Routes>
  );
};

export default App;
