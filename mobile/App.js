import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import IntroScreen from './screens/IntroScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Stack = createStackNavigator();

// Auth Navigator - for unauthenticated users
function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main Navigator - for authenticated users (temporary placeholder)
function MainNavigator() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text, fontSize: 18, marginBottom: 10 }}>
        Welcome to FoodScan!
      </Text>
      
      <Text style={{ color: colors.text, fontSize: 16, marginBottom: 20 }}>
        Logged in as: {user?.username || user?.email}
      </Text>
      
      <TouchableOpacity
        style={[styles.themeButton, {
          backgroundColor: colors.error,
          borderColor: colors.error,
        }]}
        onPress={logout}
      >
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Main content component that uses theme and auth
function AppContent() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showIntro, setShowIntro] = useState(null);

  // Check if intro has been shown before
  useEffect(() => {
    checkIntroStatus();
  }, []);

  const checkIntroStatus = async () => {
    try {
      const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');
      setShowIntro(hasSeenIntro === null);
    } catch (error) {
      console.error('Error checking intro status:', error);
      setShowIntro(false);
    }
  };

  const handleIntroFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenIntro', 'true');
      setShowIntro(false);
    } catch (error) {
      console.error('Error saving intro status:', error);
      setShowIntro(false);
    }
  };

  // Show loading while checking intro status or auth
  if (showIntro === null || isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }

  // Show intro screen if user hasn't seen it
  if (showIntro) {
    return <IntroScreen onFinish={handleIntroFinish} />;
  }

  // Main app content with navigation
  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  themeButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
