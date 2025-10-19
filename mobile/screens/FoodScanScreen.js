import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { globalStyles } from '../styles/globalStyles';

const FoodScanScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const [scannedImage, setScannedImage] = useState(null);

  const handleTakePhoto = () => {
    // TODO: Implement camera functionality
    console.log('Take photo');
  };

  const handleChooseFromLibrary = () => {
    // TODO: Implement image picker functionality
    console.log('Choose from library');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome name="camera" size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Food Scanner</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Scan your food to track nutrition
          </Text>
        </View>

        {/* Camera Preview or Empty State */}
        <View style={[styles.previewContainer, { backgroundColor: colors.card, ...colors.shadow }]}>
          {scannedImage ? (
            <Image source={{ uri: scannedImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.emptyPreview}>
              <FontAwesome name="image" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No image selected
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary, ...colors.shadow }]}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
          >
            <FontAwesome name="camera" size={24} color={colors.buttonText} />
            <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
              Take Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.secondary, ...colors.shadow }]}
            onPress={handleChooseFromLibrary}
            activeOpacity={0.8}
          >
            <FontAwesome name="image" size={24} color={colors.buttonText} />
            <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
              Choose Image
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions Card */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.card, ...colors.shadow }]}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>
            How to get the best results:
          </Text>
          
          <View style={styles.instructionItem}>
            <FontAwesome name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Ensure good lighting
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <FontAwesome name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Capture the entire dish
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <FontAwesome name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Keep the camera steady
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <FontAwesome name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Avoid shadows and reflections
            </Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { 
          backgroundColor: isDarkMode ? 'rgba(46, 160, 67, 0.15)' : 'rgba(46, 160, 67, 0.1)', 
          borderColor: colors.primary 
        }]}>
          <FontAwesome name="info-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoBannerText, { color: colors.text }]}>
            Our AI will analyze your food and provide nutritional information
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    aspectRatio: 4 / 3,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default FoodScanScreen;
