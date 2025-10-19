import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ChangePasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { changePassword } = useAuth();
  const toast = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Handle password change
  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      toast.error('New password must be different from old password');
      return;
    }

    // Validate new password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(oldPassword, newPassword);

      if (result.success) {
        toast.success('Password changed successfully');
        // Clear fields
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('An error occurred while changing password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, ...colors.shadow }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.primary + '15' }]}>
          <FontAwesome name="info-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Your password must be at least 8 characters long and contain uppercase, lowercase, and numbers.
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Old Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showOldPassword}
                editable={!isLoading}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowOldPassword(!showOldPassword)}
              >
                <FontAwesome
                  name={showOldPassword ? 'eye' : 'eye-slash'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
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

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
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
          <View style={[styles.requirementsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
              Password Requirements:
            </Text>
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
                color={newPassword && newPassword === confirmPassword ? colors.success : colors.textSecondary}
              />
              <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                Passwords match
              </Text>
            </View>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[
            styles.changeButton,
            { 
              backgroundColor: oldPassword && newPassword && confirmPassword && !isLoading 
                ? colors.primary 
                : colors.border,
              ...colors.shadow 
            },
          ]}
          onPress={handleChangePassword}
          disabled={!oldPassword || !newPassword || !confirmPassword || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <>
              <FontAwesome name="lock" size={18} color={colors.buttonText} />
              <Text style={[styles.changeButtonText, { color: colors.buttonText }]}>
                Change Password
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
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
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
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
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;
