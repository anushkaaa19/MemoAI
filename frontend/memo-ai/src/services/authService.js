// src/services/authService.js
import axiosInstance, { setAccessToken, clearAccessToken } from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const login = async (email, password) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, { email, password });
    // Server sets httpOnly refresh cookie automatically
    // We only handle the access token
    const { accessToken, user } = response.data.data;
    setAccessToken(accessToken);
    return { user };
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

const register = async (username, email, password) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
      username,
      email,
      password,
    });
    const { accessToken, user } = response.data.data;
    setAccessToken(accessToken);
    return { user };
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

const logout = async () => {
  try {
    // Clears the httpOnly cookie on the server
    await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
  } catch (error) {
    // Even if request fails, clear client-side token
    console.error('Logout request failed:', error);
  } finally {
    // Always clear memory token regardless of server response
    clearAccessToken();
  }
};

const getProfile = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

const updateProfile = async (userData) => {
  try {
    const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

const changePassword = async (passwords) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, passwords);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

// add this to authService.js
const refresh = async () => {
  // No Authorization header needed — cookie is sent automatically
  const response = await axiosInstance.post(API_PATHS.AUTH.REFRESH);
  return response.data;
};

const authService = {
  login,
  register,
  logout,
  refresh,       // ← add this
  getProfile,
  updateProfile,
  changePassword,
};

export default authService;