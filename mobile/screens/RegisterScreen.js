import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { sendOTP, register } = useAuth();
  const toast = useToast();

  // Step state
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Form

  // Form state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!email.trim()) {
      toast.warning('Please enter your email');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendOTP(email.trim());

      if (result.success) {
        toast.success('OTP sent to your email! 📧');
        setStep(2);
      } else {
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP (just moves to next step)
  const handleVerifyOTP = () => {
    if (!otp.trim()) {
      toast.warning('Please enter the OTP code');
      return;
    }

    if (otp.length !== 5) {
      toast.warning('OTP must be 5 digits');
      return;
    }

    setStep(3);
  };

  // Step 3: Complete Registration
  const handleRegister = async () => {
    // Validation
    if (!username.trim()) {
      toast.warning('Please enter a username');
      return;
    }

    if (username.length < 3) {
      toast.warning('Username must be at least 3 characters');
      return;
    }

    if (!firstName.trim()) {
      toast.warning('Please enter your first name');
      return;
    }

    if (!password) {
      toast.warning('Please enter a password');
      return;
    }

    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.warning('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(
        email.trim(),
        username.trim(),
        password.trim(),
        firstName.trim(),
        lastName.trim(),
        otp.trim()
      );

      if (result.success) {
        toast.success('Account created successfully! 🎉');
        // Navigation will be handled by App.js based on auth state
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render Step 1: Email Input
  const renderEmailStep = () => (
    <>
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="mail-outline" size={50} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          Enter your email to get started
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="your.email@example.com"
              placeholderTextColor={colors.inputPlaceholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.buttonBackground, borderColor: colors.borderCards },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSendOTP}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                Send OTP
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.buttonText} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // Render Step 2: OTP Verification
  const renderOTPStep = () => (
    <>
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: `${colors.success}20` }]}>
          <Ionicons name="shield-checkmark" size={50} color={colors.success} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Verify Email</Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          Enter the 5-digit code sent to {'\n'}
          <Text style={{ fontWeight: 'bold' }}>{email}</Text>
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>OTP Code</Text>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Ionicons
              name="key-outline"
              size={20}
              color={colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.inputText, textAlign: 'center', fontSize: 20, letterSpacing: 8 }]}
              placeholder="00000"
              placeholderTextColor={colors.inputPlaceholder}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.buttonBackground, borderColor: colors.borderCards },
          ]}
          onPress={handleVerifyOTP}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            Verify OTP
          </Text>
          <Ionicons name="checkmark" size={20} color={colors.buttonText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleSendOTP}
        >
          <Text style={[styles.resendText, { color: colors.primary }]}>
            Resend OTP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(1)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.secondary} />
          <Text style={[styles.backText, { color: colors.secondary }]}>
            Change Email
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Render Step 3: Registration Form
  const renderFormStep = () => (
    <>
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="person-add" size={50} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Complete Profile</Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          Fill in your details to finish registration
        </Text>
      </View>

      <View style={styles.form}>
        {/* Username */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Username *</Text>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Ionicons
              name="at"
              size={20}
              color={colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="Choose a username"
              placeholderTextColor={colors.inputPlaceholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* First Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>First Name *</Text>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="Enter first name"
              placeholderTextColor={colors.inputPlaceholder}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Last Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="Enter last name (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Password *</Text>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="Create a password"
              placeholderTextColor={colors.inputPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Confirm Password *</Text>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="Confirm your password"
              placeholderTextColor={colors.inputPlaceholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.buttonBackground, borderColor: colors.borderCards },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                Create Account
              </Text>
              <Ionicons name="checkmark-circle" size={20} color={colors.buttonText} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(2)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.secondary} />
          <Text style={[styles.backText, { color: colors.secondary }]}>
            Back to OTP
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Theme Toggle Button */}
      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: colors.card }]}
        onPress={toggleTheme}
      >
        <Ionicons
          name={isDarkMode ? 'sunny' : 'moon'}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderEmailStep()}
        {step === 2 && renderOTPStep()}
        {step === 3 && renderFormStep()}

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.secondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 60,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  backText: {
    fontSize: 14,
    marginLeft: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
