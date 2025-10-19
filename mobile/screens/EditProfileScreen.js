import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { useToast } from '../context/ToastContext';

const EditProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [avatarUri, setAvatarUri] = useState(user?.profile_image || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [avatarDeleted, setAvatarDeleted] = useState(false);

  // Request camera permission
  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  // Request media library permission
  const requestMediaLibraryPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is needed to choose photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        setAvatarChanged(true);
        setAvatarDeleted(false);
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.error('Failed to take photo');
    }
  };

  // Choose photo from gallery
  const handleChooseFromLibrary = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        setAvatarChanged(true);
        setAvatarDeleted(false);
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      toast.error('Failed to choose photo');
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAvatarUri(null);
            setAvatarDeleted(true);
            setAvatarChanged(false);
            setHasChanges(true);
          },
        },
      ]
    );
  };

  // Show avatar options
  const handleAvatarPress = () => {
    const options = avatarUri
      ? ['Take Photo', 'Choose from Library', 'Remove Photo', 'Cancel']
      : ['Take Photo', 'Choose from Library', 'Cancel'];

    Alert.alert('Profile Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handleChooseFromLibrary },
      ...(avatarUri
        ? [{ text: 'Remove Photo', onPress: handleRemoveAvatar, style: 'destructive' }]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Handle name changes
  const handleFirstNameChange = (text) => {
    setFirstName(text);
    setHasChanges(
      text !== (user?.first_name || '') ||
      lastName !== (user?.last_name || '') ||
      avatarChanged ||
      avatarDeleted
    );
  };

  const handleLastNameChange = (text) => {
    setLastName(text);
    setHasChanges(
      firstName !== (user?.first_name || '') ||
      text !== (user?.last_name || '') ||
      avatarChanged ||
      avatarDeleted
    );
  };

  // Save profile changes
  const handleSaveChanges = async () => {
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }

    setIsLoading(true);

    try {
      let updatedUser = { ...user };

      // 1. Handle avatar deletion first
      if (avatarDeleted && user?.profile_image) {
        const deleteResult = await authService.deleteAvatar();
        if (!deleteResult.success) {
          throw new Error(deleteResult.message || 'Failed to delete avatar');
        }
        updatedUser = deleteResult.user || updatedUser;
        updatedUser.profile_image = null;
        updatedUser.profile_image_public_id = null;
      }

      // 2. Handle avatar update (upload new avatar)
      if (avatarChanged && avatarUri) {
        const uploadResult = await authService.updateAvatar(avatarUri);
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'Failed to update avatar');
        }
        updatedUser = uploadResult.user || updatedUser;
      }

      // 3. Update profile information (first_name, last_name)
      const profileData = {};
      if (firstName !== user?.first_name) {
        profileData.first_name = firstName;
      }
      if (lastName !== user?.last_name) {
        profileData.last_name = lastName;
      }

      if (Object.keys(profileData).length > 0) {
        const profileResult = await authService.updateProfile(profileData);
        if (!profileResult.success) {
          throw new Error(profileResult.message || 'Failed to update profile');
        }
        updatedUser = profileResult.user || updatedUser;
      }

      // Update user context with all changes
      await updateUser(updatedUser);

      toast.success('Profile updated successfully');
      setHasChanges(false);
      setAvatarChanged(false);
      setAvatarDeleted(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to update profile');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            style={[styles.avatarContainer, { backgroundColor: colors.card, ...colors.shadow }]}
            activeOpacity={0.8}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarPlaceholderText, { color: colors.buttonText }]}>
                  {(firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                </Text>
              </View>
            )}
            <View
              style={[styles.cameraIconContainer, { backgroundColor: colors.primary }]}
            >
              <FontAwesome name="camera" size={16} color={colors.buttonText} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            Tap to change profile picture
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={firstName}
              onChangeText={handleFirstNameChange}
              placeholder="Enter first name"
              placeholderTextColor={colors.textSecondary}
              editable={!isLoading}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={lastName}
              onChangeText={handleLastNameChange}
              placeholder="Enter last name"
              placeholderTextColor={colors.textSecondary}
              editable={!isLoading}
            />
          </View>

          {/* Read-only fields */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View
              style={[
                styles.input,
                styles.disabledInput,
                { backgroundColor: colors.card + '80', borderColor: colors.border },
              ]}
            >
              <Text style={[styles.disabledInputText, { color: colors.textSecondary }]}>
                {user?.email || 'N/A'}
              </Text>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Email cannot be changed
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
            <View
              style={[
                styles.input,
                styles.disabledInput,
                { backgroundColor: colors.card + '80', borderColor: colors.border },
              ]}
            >
              <Text style={[styles.disabledInputText, { color: colors.textSecondary }]}>
                {user?.username || 'N/A'}
              </Text>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Username cannot be changed
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: hasChanges ? colors.primary : colors.border, ...colors.shadow },
          ]}
          onPress={handleSaveChanges}
          disabled={!hasChanges || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <>
              <FontAwesome name="check" size={18} color={colors.buttonText} />
              <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>
                Save Changes
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 12,
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
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  disabledInput: {
    justifyContent: 'center',
  },
  disabledInputText: {
    fontSize: 16,
  },
  hint: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
