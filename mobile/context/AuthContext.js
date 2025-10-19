import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

// Create the auth context
export const AuthContext = createContext();

// Custom hook for easy auth access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Load stored user data and verify token
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        // Verify token with backend
        const result = await authService.verifyToken();
        
        if (result.success) {
          setToken(storedToken);
          setUser(result.user);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear data
          await clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  // Clear authentication data
  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  // Helper: Update auth state after successful auth
  const updateAuthState = async (token, user) => {
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
  };

  // Helper: Update user state
  const updateUserState = async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  // Send OTP for registration
  const sendOTP = async (email) => {
    return await authService.sendOTP(email);
  };

  // Register new user
  const register = async (email, username, password, firstName, lastName, otp) => {
    const result = await authService.register(email, username, password, firstName, lastName, otp);
    
    if (result.success && result.token && result.user) {
      await updateAuthState(result.token, result.user);
    }
    
    return result;
  };

  // Login user
  const login = async (emailOrUsername, password) => {
    const result = await authService.login(emailOrUsername, password);
    
    if (result.success && result.token && result.user) {
      await updateAuthState(result.token, result.user);
    }
    
    return result;
  };

  // Logout user
  const logout = async () => {
    await authService.logout();
    await clearAuthData();
    return { success: true, message: 'Logged out successfully' };
  };

  // Get current user profile
  const getProfile = async () => {
    const result = await authService.getProfile();
    
    if (result.success && result.user) {
      await updateUserState(result.user);
    }
    
    return result;
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    const result = await authService.updateProfile(profileData);
    
    if (result.success && result.user) {
      await updateUserState(result.user);
    }
    
    return result;
  };

  // Change password
  const changePassword = async (oldPassword, newPassword) => {
    return await authService.changePassword(oldPassword, newPassword);
  };

  // Update avatar
  const updateAvatar = async (imageUri) => {
    const result = await authService.updateAvatar(imageUri);
    
    if (result.success && result.user) {
      await updateUserState(result.user);
    }
    
    return result;
  };

  // Delete avatar
  const deleteAvatar = async () => {
    const result = await authService.deleteAvatar();
    
    if (result.success && result.user) {
      await updateUserState(result.user);
    }
    
    return result;
  };

  // Refresh user data
  const refreshUser = async () => {
    return await getProfile();
  };

  // Update user directly (without API call)
  const updateUser = async (updatedUser) => {
    await updateUserState(updatedUser);
  };

  // Auth context values
  const authContextValue = {
    // State
    user,
    token,
    isLoading,
    isAuthenticated,
    
    // Methods
    sendOTP,
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    updateAvatar,
    deleteAvatar,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
