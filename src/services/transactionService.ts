import axios from 'axios';

const USER_API_URL = 'http://service1.runasp.net/api/User';
const TRANSACTION_API_URL = 'http://service2.runasp.net/api/Transaction';

export interface Transaction {
  id: number;
  senedrId: string;
  receiverId: string;
  amount: number;
  createdAt: string;
  type: string;
}

export interface Balance {
  balance: number;
  pendingBalance: number;
}

export interface UserInfo {
  email: string;
  userName: string;
  phoneNumber: string;
  balance: number;
  createdAt: string;
}

export interface TransactionResponse {
  message: string;
  data: Transaction[];
}

export interface UpdateBalanceResponse {
  message: string;
  data: {
    email: string;
    userName: string;
    phoneNumber: string;
    newbalance: number;
  };
}

const getTransactionsImpl = async (userId: string): Promise<Transaction[]> => {
  try {
    const response = await axios.get<TransactionResponse>(`${TRANSACTION_API_URL}/${userId}`);
    console.log("getTransactionsImpl");
    console.log(response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

const getUserInfo = async (userId: string): Promise<UserInfo> => {
  try {
    const response = await axios.get(`${USER_API_URL}/${userId}`);
    console.log(response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};


const getBalanceImpl = async (userId: string): Promise<Balance> => {
  try {
    const response = await axios.get(`${USER_API_URL}/${userId}`);
    console.log(response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

const updateBalance = async (userId: string, newBalance: number): Promise<UpdateBalanceResponse> => {
  try {
    const response = await axios.put<UpdateBalanceResponse>(`${USER_API_URL}/${userId}`, {
      amount: newBalance
    });
    console.log("updateBalance");
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
};

const sendMoneyImpl = async (
  sender: string,
  receiverPhone: string,
  amount: number
): Promise<TransactionResponse> => {
 
  try {
     const formSendMoneyData = new FormData();
  console.log(sender, receiverPhone, amount);
  formSendMoneyData.append("sender", sender);
  formSendMoneyData.append("receiverPhone", receiverPhone);
  formSendMoneyData.append("amount", String(amount));
    const response = await axios.post(TRANSACTION_API_URL, formSendMoneyData);
    console.log("sendMoneyImpl");
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending money:', error);
    throw error;
  }
};

export { 
  getUserInfo, 
  getTransactionsImpl as getTransactions, 
  sendMoneyImpl as sendMoney, 
  getBalanceImpl as getBalance,
  updateBalance,
};