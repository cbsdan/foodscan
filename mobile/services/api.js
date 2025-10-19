import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from './baseUrl';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear invalid token
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      
      console.log('Session expired. Please login again.');
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.'
      });
    }
    
    return Promise.reject(error);
  }
);

// Helper: Standardize API response
const handleResponse = (response) => {
  if (response.data.success) {
    return {
      success: true,
      message: response.data.message,
      ...response.data.data // Spread user, token, etc.
    };
  }
  return {
    success: false,
    message: response.data.message || 'Operation failed'
  };
};

// Helper: Standardize API errors
const handleError = (error, defaultMessage) => {
  return {
    success: false,
    message: error.response?.data?.message || error.message || defaultMessage
  };
};

// Auth Service - Direct API calls only (no state management)
export const authService = {
  // Send OTP for registration
  sendOTP: async (email) => {
    try {
      const response = await api.post('/auth/send-otp', { email });
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Failed to send OTP');
    }
  },

  // Register new user
  register: async (email, username, password, firstName, lastName, otp) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        otp
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Registration failed');
    }
  },

  // Login user
  login: async (emailOrUsername, password) => {
    try {
      const response = await api.post('/auth/login', {
        email: emailOrUsername,
        username: emailOrUsername,
        password
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Login failed');
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return handleResponse(response);
    } catch (error) {
      // Return success even on error (clear local data anyway)
      return { success: true, message: 'Logged out successfully' };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Failed to get profile');
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Failed to update profile');
    }
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Failed to change password');
    }
  },

  // Update avatar
  updateAvatar: async (imageUri) => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type
      });
      
      const response = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Failed to update avatar');
    }
  },

  // Delete avatar
  deleteAvatar: async () => {
    try {
      const response = await api.delete('/auth/avatar');
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Failed to delete avatar');
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return handleResponse(response);
    } catch (error) {
      return { success: false, message: 'Token verification failed' };
    }
  },

  // Send OTP for forgot password
  sendForgotPasswordOTP: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password/send-otp', { email });
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Failed to send OTP');
    }
  },

  // Verify OTP for forgot password
  verifyForgotPasswordOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/forgot-password/verify-otp', { email, otp });
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Failed to verify OTP');
    }
  },

  // Reset password with token
  resetPassword: async (email, resetToken, newPassword) => {
    try {
      const response = await api.post('/auth/forgot-password/reset', {
        email,
        reset_token: resetToken,
        new_password: newPassword
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error, 'Failed to reset password');
    }
  },
};

// Export the axios instance for custom requests
export default api;
