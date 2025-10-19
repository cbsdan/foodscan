import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';
import { useToast } from '../context/ToastContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const toast = useToast();

  // State
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.sendForgotPasswordOTP(email);

      if (result.success) {
        toast.success('OTP sent to your email');
        setStep(2);
      } else {
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    if (otp.length !== 5) {
      toast.error('OTP must be 5 digits');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.verifyForgotPasswordOTP(email, otp);

      if (result.success && result.reset_token) {
        toast.success('OTP verified successfully');
        setResetToken(result.reset_token);
        setStep(3);
      } else {
        toast.error(result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.resetPassword(email, resetToken, newPassword);

      if (result.success) {
        toast.success('Password reset successfully!');
        // Navigate to login after a short delay
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      } else {
        toast.error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const result = await authService.sendForgotPasswordOTP(email);
      if (result.success) {
        toast.success('New OTP sent to your email');
      } else {
        toast.error(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, ...colors.shadow }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Forgot Password</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressSteps}>
            <View style={[styles.stepIndicator, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumber, { color: colors.buttonText }]}>1</Text>
            </View>
            <View
              style={[
                styles.progressLine,
                { backgroundColor: step >= 2 ? colors.primary : colors.border },
              ]}
            />
            <View
              style={[
                styles.stepIndicator,
                { backgroundColor: step >= 2 ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.stepNumber, { color: colors.buttonText }]}>2</Text>
            </View>
            <View
              style={[
                styles.progressLine,
                { backgroundColor: step >= 3 ? colors.primary : colors.border },
              ]}
            />
            <View
              style={[
                styles.stepIndicator,
                { backgroundColor: step >= 3 ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.stepNumber, { color: colors.buttonText }]}>3</Text>
            </View>
          </View>
          <View style={styles.stepLabels}>
            <Text style={[styles.stepLabel, { color: colors.text }]}>Email</Text>
            <Text style={[styles.stepLabel, { color: colors.text }]}>Verify</Text>
            <Text style={[styles.stepLabel, { color: colors.text }]}>Reset</Text>
          </View>
        </View>

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <FontAwesome name="envelope" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Enter Your Email</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              We'll send you a verification code to reset your password
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: email ? colors.primary : colors.border, ...colors.shadow },
              ]}
              onPress={handleSendOTP}
              disabled={!email || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <>
                  <Text style={[styles.primaryButtonText, { color: colors.buttonText }]}>
                    Send OTP
                  </Text>
                  <FontAwesome name="arrow-right" size={16} color={colors.buttonText} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <FontAwesome name="shield" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Enter Verification Code</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              We sent a 5-digit code to {email}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>OTP Code</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.otpInput,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                value={otp}
                onChangeText={setOTP}
                placeholder="Enter 5-digit code"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={5}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: otp.length === 5 ? colors.primary : colors.border, ...colors.shadow },
              ]}
              onPress={handleVerifyOTP}
              disabled={otp.length !== 5 || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <>
                  <Text style={[styles.primaryButtonText, { color: colors.buttonText }]}>
                    Verify OTP
                  </Text>
                  <FontAwesome name="arrow-right" size={16} color={colors.buttonText} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOTP}
              disabled={isLoading}
            >
              <Text style={[styles.resendButtonText, { color: colors.primary }]}>
                Didn't receive the code? Resend
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <FontAwesome name="lock" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Create New Password</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Choose a strong password for your account
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showNewPassword}
                  editable={!isLoading}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <FontAwesome
                    name={showNewPassword ? 'eye' : 'eye-slash'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <FontAwesome
                    name={showConfirmPassword ? 'eye' : 'eye-slash'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View
              style={[
                styles.requirementsBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.requirement}>
                <FontAwesome
                  name={newPassword.length >= 8 ? 'check-circle' : 'circle-o'}
                  size={14}
                  color={newPassword.length >= 8 ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.requirement}>
                <FontAwesome
                  name={/(?=.*[a-z])/.test(newPassword) ? 'check-circle' : 'circle-o'}
                  size={14}
                  color={/(?=.*[a-z])/.test(newPassword) ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  One lowercase letter
                </Text>
              </View>
              <View style={styles.requirement}>
                <FontAwesome
                  name={/(?=.*[A-Z])/.test(newPassword) ? 'check-circle' : 'circle-o'}
                  size={14}
                  color={/(?=.*[A-Z])/.test(newPassword) ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  One uppercase letter
                </Text>
              </View>
              <View style={styles.requirement}>
                <FontAwesome
                  name={/(?=.*\d)/.test(newPassword) ? 'check-circle' : 'circle-o'}
                  size={14}
                  color={/(?=.*\d)/.test(newPassword) ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  One number
                </Text>
              </View>
              <View style={styles.requirement}>
                <FontAwesome
                  name={newPassword && newPassword === confirmPassword ? 'check-circle' : 'circle-o'}
                  size={14}
                  color={
                    newPassword && newPassword === confirmPassword
                      ? colors.success
                      : colors.textSecondary
                  }
                />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                  Passwords match
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    newPassword && confirmPassword && !isLoading ? colors.primary : colors.border,
                  ...colors.shadow,
                },
              ]}
              onPress={handleResetPassword}
              disabled={!newPassword || !confirmPassword || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <>
                  <FontAwesome name="check" size={18} color={colors.buttonText} />
                  <Text style={[styles.primaryButtonText, { color: colors.buttonText }]}>
                    Reset Password
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressLine: {
    width: 60,
    height: 3,
    marginHorizontal: 8,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 8,
    fontWeight: '600',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
  requirementsBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    width: '100%',
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 16,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;
