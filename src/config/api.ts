// API Configuration
// Using relative URLs to work with the Netlify proxy

// Base API paths
export const BASE_USER_API = '/api/User';
export const BASE_TRANSACTION_API = '/api/Transaction';  
export const BASE_REPORT_API = '/api';

// Service endpoints organized by domain
export const API_ENDPOINTS = {
  // User service endpoints (originally service1)
  user: {
    login: `${BASE_USER_API}/Login`,
    register: `${BASE_USER_API}/Register`,
    getUser: (userId: string) => `${BASE_USER_API}/${userId}`,
    updateBalance: (userId: string) => `${BASE_USER_API}/${userId}`
  },
  
  // Transaction service endpoints (originally service2)
  transaction: {
    create: BASE_TRANSACTION_API,
    getAll: (userId: string) => `${BASE_TRANSACTION_API}/${userId}`
  },
  
  // Reporting service endpoints (originally service3)
  report: {
    history: (userId: string) => `${BASE_REPORT_API}/Report/${userId}`,
    summary: (userId: string) => `${BASE_REPORT_API}/Report/Summary/${userId}`
  }
}; 