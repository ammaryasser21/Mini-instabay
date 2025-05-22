import axios from 'axios';
// jwt-decode is a default import, so it should be:
// import jwtDecode from "jwt-decode"; 
// However, if your project setup supports it like this, it's fine.
// For max compatibility, I'll use the common default import style.
import { jwtDecode } from "jwt-decode";
import { API_ENDPOINTS } from '../config/api';

// Represents a single transaction entry from the history API
export interface HistoryEntry {
  id: number; // API example shows number
  senderId: string;
  receiverId: string;
  transactionType: string; // e.g., "Send", "Receive"
  amount: number;
  transactionDate: string; // ISO date string
}

// Represents the 'data' part of the summary API response
export interface SummaryValues {
  totalSent: number;    // API example shows number
  totalReceive: number; // API example shows number
}

// Represents the full API response structure for getHistory
export interface HistoryApiResponse {
  message: string;
  data: HistoryEntry[];
}

// Represents the full API response structure for getSummary
export interface SummaryApiResponse {
  message: string;
  data: SummaryValues;
}

// Type for the decoded JWT payload
type JwtPayload = {
  jti: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
  exp: number;
  iss: string;
  aud: string;
};

// Utility function to get userId from token (can be used elsewhere if needed)
// Consider error handling if token is missing or invalid.
const getUserIdFromToken = (): string | null => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage.');
      return null;
    }
    const decodedToken = jwtDecode<JwtPayload>(token);
    const userId = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    // console.log("User ID from token:", userId);
    return userId;
  } catch (error) {
    console.error('Error decoding token or token is invalid:', error);
    return null;
  }
};


// Service function to get transaction history
// Now accepts userId as a parameter
const getHistoryImpl = async (userId: string): Promise<HistoryApiResponse> => {
  if (!userId) {
    console.error('User ID is required for getHistory');
    // Or throw an error, or return a specific error structure
    return Promise.reject(new Error('User ID is required'));
  }
  try {
    // The response from axios.get will be directly of type HistoryApiResponse
    const response = await axios.get<HistoryApiResponse>(API_ENDPOINTS.report.history(userId));
    // console.log("getHistoryImpl response:", response.data);
    return response.data; // The whole object { message, data }
  } catch (error) {
    console.error('Error fetching reporting history data:', error);
    throw error;
  }
};

// Service function to get transaction summary
// Now accepts userId as a parameter
const getSummaryImpl = async (userId: string): Promise<SummaryApiResponse> => {
  if (!userId) {
    console.error('User ID is required for getSummary');
    return Promise.reject(new Error('User ID is required'));
  }
  try {
    // The response from axios.get will be directly of type SummaryApiResponse
    const response = await axios.get<SummaryApiResponse>(API_ENDPOINTS.report.summary(userId));
    // console.log("getSummaryImpl response:", response.data);
    return response.data; // The whole object { message, data }
  } catch (error) {
    console.error('Error fetching reporting summary data:', error);
    throw error;
  }
};

export {
  getHistoryImpl as getHistory,
  getSummaryImpl as getSummary,
  getUserIdFromToken // Export if needed elsewhere
};