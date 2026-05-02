import axios from 'axios';
import Constants from 'expo-constants';

// Automatically detect the dev server IP for mobile devices
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || 'localhost';

// Use environment variable for production, fallback to localhost for development
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  `http://${localhost}:4000`;

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

export default client;
