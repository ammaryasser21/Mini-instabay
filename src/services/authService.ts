import axios from 'axios';
import { jwtDecode } from "jwt-decode";

const API_URL = 'http://service1.runasp.net/api/User';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}


type JwtPayload = {
  jti: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
  exp: number;
  iss: string;
  aud: string;
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
const formLoginData = new FormData();
formLoginData.append("Email", email);
formLoginData.append("Password", password);

  try {
    const response = await axios.post(`${API_URL}/Login`, formLoginData);
    console.log(response.data);
    const token = response.data.data.token;
    const decodedToken = jwtDecode<JwtPayload>(token);
    // Transform the API response to match our app's expected format
    return {
      token: token,
      user: {
        id: decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
        name: decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
        email: email
      }
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message ?? 'Login failed');
    }
    throw new Error('Network error, please try again later');
  }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  phoneNumber: string = ''
): Promise<LoginResponse> => {
  try {
    const formRegisterData = new FormData();
    formRegisterData.append("User_Name", name);
    formRegisterData.append("Email", email);
    formRegisterData.append("Password", password);
    formRegisterData.append("Phone_Number", phoneNumber);

console.log(formRegisterData);
    const response = await axios.post(`${API_URL}/Register`, formRegisterData);
    const token = response.data.data.token;
    const decodedToken = jwtDecode<JwtPayload>(token);

    // Transform the API response to match our app's expected format
    return {
      token: response.data.data.token,
      user: {
        id: decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
        name: decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
        email: email
      }
    };
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message ?? 'Registration failed');
    }
    throw new Error('Network error, please try again later');
  }
};