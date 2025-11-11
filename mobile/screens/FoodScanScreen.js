import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Modal,
    Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { predictionService } from '../services/api';

const FoodScanScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const toast = useToast();

    const [scannedImage, setScannedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [predictions, setPredictions] = useState(null); // Stores both Gemini and ML predictions
    const [selectedPrediction, setSelectedPrediction] = useState(null); // 'gemini' or 'ml'
    const [showPredictionModal, setShowPredictionModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [tempImageData, setTempImageData] = useState(null); // Store temp image info

    // Editable meal data
    const [mealName, setMealName] = useState('');
    const [foodType, setFoodType] = useState('other');
    const [notes, setNotes] = useState('');
    const [servingSize, setServingSize] = useState('');
    const [nutrients, setNutrients] = useState({
        Calories: 0,
        'Protein (g)': 0,
        'Carbs (g)': 0,
        'Fat (g)': 0,
    });

    const foodTypes = [
        { label: 'Breakfast', value: 'breakfast' },
        { label: 'Lunch', value: 'lunch' },
        { label: 'Dinner', value: 'dinner' },
        { label: 'Snacks', value: 'snacks' },
        { label: 'Drinks', value: 'drinks' },
        { label: 'Dessert', value: 'dessert' },
        { label: 'Other', value: 'other' },
    ];

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toast.error('Camera permission is required to take photos');
            return false;
        }
        return true;
    };

    const requestMediaLibraryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast.error('Media library permission is required to choose photos');
            return false;
        }
        return true;
    };

    const handleTakePhoto = async () => {
        try {
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) return;

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            toast.error('Failed to take photo');
        }
    };

    const handleChooseFromLibrary = async () => {
        try {
            const hasPermission = await requestMediaLibraryPermission();
            if (!hasPermission) return;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error choosing photo:', error);
            toast.error('Failed to choose photo');
        }
    };

    const processImage = async (imageUri) => {
        setScannedImage(imageUri);
        setIsLoading(true);
        setPredictions(null);
        setSelectedPrediction(null);

        try {
            // Call unified prediction API (both Gemini and ML)
            const result = await predictionService.predictFood(imageUri, 5);

            if (result.success) {
                setPredictions(result.predictions);
                setTempImageData({
                    temp_image_url: result.temp_image_url,
                    temp_image_public_id: result.temp_image_public_id,
                    filename: result.filename
                });
                
                // Show prediction selection modal
                setShowPredictionModal(true);
                toast.success('Food analyzed successfully!');
            } else {
                toast.error(result.message || 'Failed to analyze food image');
                setScannedImage(null);
            }
        } catch (error) {
            console.error('Error analyzing food:', error);
            toast.error('An error occurred during analysis');
            setScannedImage(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPrediction = (type) => {
        // type is 'gemini' or 'ml'
        setSelectedPrediction(type);
        
        let predictionData;
        if (type === 'gemini' && predictions?.gemini) {
            predictionData = predictions.gemini;
            setMealName(predictionData.meal_name || '');
            setServingSize(predictionData.serving_size || '');
            setNutrients(predictionData.nutrients || {
                Calories: 0,
                'Protein (g)': 0,
                'Carbs (g)': 0,
                'Fat (g)': 0,
            });
        } else if (type === 'ml' && predictions?.ml) {
            predictionData = predictions.ml;
            // Use ML's top prediction class as meal name
            const topPrediction = predictionData.classification?.predictions?.[0];
            setMealName(topPrediction?.class_name?.replace(/_/g, ' ') || '');
            setServingSize('1 serving');
            setNutrients(predictionData.nutrients || {
                Calories: 0,
                'Protein (g)': 0,
                'Carbs (g)': 0,
                'Fat (g)': 0,
            });
        }
        
        setShowPredictionModal(false);
        setShowEditModal(true);
    };

    const handleSaveMeal = async () => {
        if (!mealName.trim()) {
            toast.error('Please enter a meal name');
            return;
        }

        if (!selectedPrediction) {
            toast.error('Please select a prediction source');
            return;
        }

        setIsLoading(true);

        try {
            const mealData = {
                selected_prediction: selectedPrediction,
                meal_name: mealName,
                nutrients,
                food_type: foodType,
                notes: notes.trim(),
                serving_size: servingSize,
                temp_image_public_id: tempImageData?.temp_image_public_id,
                user_edited: false, // Can be enhanced to track actual edits
            };

            // Add ML-specific data if ML was selected
            if (selectedPrediction === 'ml' && predictions?.ml?.classification?.predictions?.[0]) {
                mealData.ml_food_class = predictions.ml.classification.predictions[0].class_name;
                mealData.confidence_rate = predictions.ml.classification.predictions[0].confidence * 100;
            } else if (selectedPrediction === 'gemini' && predictions?.gemini) {
                mealData.confidence_rate = predictions.gemini.confidence_percentage;
            }

            console.log('=== SAVE MEAL DEBUG ===');
            console.log('tempImageData:', tempImageData);
            console.log('temp_image_public_id:', tempImageData?.temp_image_public_id);
            console.log('Meal data to save:', JSON.stringify(mealData, null, 2));
            console.log('======================');

            const result = await predictionService.saveMeal(mealData);
            console.log('Save meal result:', result);

            if (result.success) {
                toast.success('Meal saved successfully!');
                handleCancelScan();
                navigation.navigate('Home');
            } else {
                toast.error(result.message || 'Failed to save meal');
            }
        } catch (error) {
            console.error('Error saving meal:', error);
            toast.error('An error occurred while saving meal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelScan = () => {
        setScannedImage(null);
        setPredictions(null);
        setSelectedPrediction(null);
        setTempImageData(null);
        setShowPredictionModal(false);
        setShowEditModal(false);
        setMealName('');
        setFoodType('other');
        setNotes('');
        setServingSize('');
        setNutrients({
            Calories: 0,
            'Protein (g)': 0,
            'Carbs (g)': 0,
            'Fat (g)': 0,
        });
    };

    const updateNutrient = (key, value) => {
        const numValue = parseFloat(value) || 0;
        setNutrients(prev => ({ ...prev, [key]: numValue }));
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <FontAwesome name="camera" size={50} color={colors.primary} />
                    <Text style={[styles.title, { color: colors.text }]}>Food Scanner</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Scan your food to track nutrition
                    </Text>
                </View>

                {/* Camera Preview or Empty State */}
                <View style={[styles.previewContainer, { backgroundColor: colors.card, ...colors.shadow }]}>
                    {isLoading ? (
                        <View style={styles.loadingPreview}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.text }]}>
                                Analyzing food...
                            </Text>
                        </View>
                    ) : scannedImage ? (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: scannedImage }} style={styles.previewImage} />
                            <TouchableOpacity
                                style={[styles.removeButton, { backgroundColor: colors.error }]}
                                onPress={handleCancelScan}
                            >
                                <FontAwesome name="times" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
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
                {!scannedImage && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary, ...colors.shadow }]}
                            onPress={handleTakePhoto}
                            activeOpacity={0.8}
                            disabled={isLoading}
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
                            disabled={isLoading}
                        >
                            <FontAwesome name="image" size={24} color={colors.buttonText} />
                            <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                                Choose Image
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

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

            {/* Prediction Selection Modal */}
            <Modal
                visible={showPredictionModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPredictionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Choose Your Prediction
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }]}>
                                Select which AI prediction you prefer
                            </Text>

                            {/* Gemini AI Prediction */}
                            {predictions?.gemini ? (
                                <TouchableOpacity
                                    style={[styles.predictionCard, { 
                                        backgroundColor: colors.background,
                                        borderColor: colors.primary,
                                        borderWidth: 2,
                                        ...colors.shadow
                                    }]}
                                    onPress={() => handleSelectPrediction('gemini')}
                                >
                                    <View style={styles.predictionHeader}>
                                        <FontAwesome name="google" size={24} color={colors.primary} />
                                        <Text style={[styles.predictionSource, { color: colors.primary }]}>
                                            Gemini AI
                                        </Text>
                                        <View style={[styles.confidenceBadge, { backgroundColor: colors.primary }]}>
                                            <Text style={styles.confidenceText}>
                                                {predictions.gemini.confidence_percentage?.toFixed(0)}%
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <Text style={[styles.predictionMealName, { color: colors.text }]}>
                                        {predictions.gemini.meal_name}
                                    </Text>
                                    
                                    {predictions.gemini.serving_size && (
                                        <Text style={[styles.predictionServing, { color: colors.textSecondary }]}>
                                            Serving: {predictions.gemini.serving_size}
                                        </Text>
                                    )}
                                    
                                    <View style={styles.nutrientsSummary}>
                                        <View style={styles.nutrientItem}>
                                            <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                                {predictions.gemini.nutrients?.Calories?.toFixed(0) || 0}
                                            </Text>
                                            <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                                                Calories
                                            </Text>
                                        </View>
                                        <View style={styles.nutrientItem}>
                                            <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                                {predictions.gemini.nutrients?.['Protein (g)']?.toFixed(1) || 0}g
                                            </Text>
                                            <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                                                Protein
                                            </Text>
                                        </View>
                                        <View style={styles.nutrientItem}>
                                            <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                                {predictions.gemini.nutrients?.['Carbs (g)']?.toFixed(1) || 0}g
                                            </Text>
                                            <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                                                Carbs
                                            </Text>
                                        </View>
                                        <View style={styles.nutrientItem}>
                                            <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                                {predictions.gemini.nutrients?.['Fat (g)']?.toFixed(1) || 0}g
                                            </Text>
                                            <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                                                Fat
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.predictionCard, { 
                                    backgroundColor: colors.background,
                                    borderColor: colors.error || '#ef4444',
                                    borderWidth: 1.5,
                                }]}>
                                    <View style={styles.predictionHeader}>
                                        <FontAwesome name="google" size={24} color={colors.error || '#ef4444'} />
                                        <Text style={[styles.predictionSource, { color: colors.error || '#ef4444' }]}>
                                            Gemini AI
                                        </Text>
                                    </View>
                                    <Text style={[styles.predictionError, { color: colors.textSecondary }]}>
                                        ❌ Could not detect food in the image
                                    </Text>
                                    <Text style={[styles.predictionErrorHint, { color: colors.textSecondary }]}>
                                        Please ensure the image clearly shows food items
                                    </Text>
                                </View>
                            )}

                            {/* ML Model Prediction */}
                            {predictions?.ml?.classification && predictions?.ml?.nutrients ? (
                                <TouchableOpacity
                                    style={[styles.predictionCard, { 
                                        backgroundColor: colors.background,
                                        borderColor: colors.secondary || colors.primary,
                                        borderWidth: 2,
                                        marginTop: 16,
                                        ...colors.shadow
                                    }]}
                                    onPress={() => handleSelectPrediction('ml')}
                                >
                                    <View style={styles.predictionHeader}>
                                        <FontAwesome name="microchip" size={24} color={colors.secondary || colors.primary} />
                                        <Text style={[styles.predictionSource, { color: colors.secondary || colors.primary }]}>
                                            ML Model
                                        </Text>
                                        <View style={[styles.confidenceBadge, { backgroundColor: colors.secondary || colors.primary }]}>
                                            <Text style={styles.confidenceText}>
                                                {(predictions.ml.classification.predictions[0]?.confidence * 100)?.toFixed(0)}%
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <Text style={[styles.predictionMealName, { color: colors.text }]}>
                                        {predictions.ml.classification.predictions[0]?.class_name?.replace(/_/g, ' ')}
                                    </Text>
                                    
                                    <Text style={[styles.predictionServing, { color: colors.textSecondary }]}>
                                        Food Detected: {predictions.ml.classification.is_food ? 'Yes' : 'No'}
                                    </Text>
                                    
                                    <View style={styles.nutrientsSummary}>
                                        <View style={styles.nutrientItem}>
                                            <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                                {predictions.ml.nutrients?.Calories?.toFixed(0) || 0}
                                            </Text>
                                            <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                                                Calories
                                            </Text>
                                        </View>
                                        <View style={styles.nutrientItem}>
                                            <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                                {predictions.ml.nutrients?.['Protein (g)']?.toFixed(1) || 0}g
                                            </Text>
                                            <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                                                Protein
                                            </Text>
                                        </View>
                                        <View style={styles.nutrientItem}>
                                            <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                                {predictions.ml.nutrients?.['Carbs (g)']?.toFixed(1) || 0}g
                                            </Text>
                                            <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                                                Carbs
                                            </Text>
                                        </View>
                                        <View style={styles.nutrientItem}>
                                            <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                                {predictions.ml.nutrients?.['Fat (g)']?.toFixed(1) || 0}g
                                            </Text>
                                            <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                                                Fat
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {/* Show top 3 predictions */}
                                    {predictions.ml.classification.predictions.length > 1 && (
                                        <View style={styles.alternatePredictions}>
                                            <Text style={[styles.alternateLabel, { color: colors.textSecondary }]}>
                                                Other possibilities:
                                            </Text>
                                            {predictions.ml.classification.predictions.slice(1, 3).map((pred, index) => (
                                                <Text key={index} style={[styles.alternateItem, { color: colors.textSecondary }]}>
                                                    • {pred.class_name.replace(/_/g, ' ')} ({(pred.confidence * 100).toFixed(0)}%)
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.predictionCard, { 
                                    backgroundColor: colors.background,
                                    borderColor: colors.error || '#ef4444',
                                    borderWidth: 1.5,
                                    marginTop: 16,
                                }]}>
                                    <View style={styles.predictionHeader}>
                                        <FontAwesome name="microchip" size={24} color={colors.error || '#ef4444'} />
                                        <Text style={[styles.predictionSource, { color: colors.error || '#ef4444' }]}>
                                            ML Model
                                        </Text>
                                    </View>
                                    <Text style={[styles.predictionError, { color: colors.textSecondary }]}>
                                        ❌ Could not classify the image
                                    </Text>
                                    <Text style={[styles.predictionErrorHint, { color: colors.textSecondary }]}>
                                        The ML model could not identify food in this image
                                    </Text>
                                </View>
                            )}

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={[styles.modalButton, { 
                                    backgroundColor: colors.border,
                                    marginTop: 24
                                }]}
                                onPress={() => {
                                    setShowPredictionModal(false);
                                    handleCancelScan();
                                }}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Edit Meal Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Edit Meal Details
                            </Text>

                            {/* Prediction Source Indicator */}
                            {selectedPrediction && (
                                <View style={[styles.predictionSourceBadge, { 
                                    backgroundColor: selectedPrediction === 'gemini' ? colors.primary : (colors.secondary || colors.primary)
                                }]}>
                                    <FontAwesome 
                                        name={selectedPrediction === 'gemini' ? 'google' : 'microchip'} 
                                        size={16} 
                                        color="#fff" 
                                    />
                                    <Text style={styles.predictionSourceText}>
                                        Using {selectedPrediction === 'gemini' ? 'Gemini AI' : 'ML Model'} prediction
                                    </Text>
                                </View>
                            )}

                            {/* Meal Name */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Meal Name *</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                placeholder="e.g., Chicken Salad"
                                placeholderTextColor={colors.textSecondary}
                                value={mealName}
                                onChangeText={setMealName}
                            />

                            {/* Serving Size */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Serving Size</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                placeholder="e.g., 1 bowl (300g)"
                                placeholderTextColor={colors.textSecondary}
                                value={servingSize}
                                onChangeText={setServingSize}
                            />

                            {/* Food Type */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Food Type</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodTypeScroll}>
                                {foodTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={[
                                            styles.foodTypeChip,
                                            {
                                                backgroundColor: foodType === type.value ? colors.primary : colors.background,
                                                borderColor: colors.border
                                            }
                                        ]}
                                        onPress={() => setFoodType(type.value)}
                                    >
                                        <Text style={[
                                            styles.foodTypeText,
                                            { color: foodType === type.value ? colors.buttonText : colors.text }
                                        ]}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Nutrients */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Nutrients</Text>

                            <View style={styles.nutrientRow}>
                                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Calories</Text>
                                <TextInput
                                    style={[styles.nutrientInput, {
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        borderColor: colors.border
                                    }]}
                                    keyboardType="numeric"
                                    value={nutrients.Calories.toString()}
                                    onChangeText={(val) => updateNutrient('Calories', val)}
                                />
                            </View>

                            <View style={styles.nutrientRow}>
                                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Protein (g)</Text>
                                <TextInput
                                    style={[styles.nutrientInput, {
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        borderColor: colors.border
                                    }]}
                                    keyboardType="numeric"
                                    value={nutrients['Protein (g)'].toString()}
                                    onChangeText={(val) => updateNutrient('Protein (g)', val)}
                                />
                            </View>

                            <View style={styles.nutrientRow}>
                                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Carbs (g)</Text>
                                <TextInput
                                    style={[styles.nutrientInput, {
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        borderColor: colors.border
                                    }]}
                                    keyboardType="numeric"
                                    value={nutrients['Carbs (g)'].toString()}
                                    onChangeText={(val) => updateNutrient('Carbs (g)', val)}
                                />
                            </View>

                            <View style={styles.nutrientRow}>
                                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Fat (g)</Text>
                                <TextInput
                                    style={[styles.nutrientInput, {
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        borderColor: colors.border
                                    }]}
                                    keyboardType="numeric"
                                    value={nutrients['Fat (g)'].toString()}
                                    onChangeText={(val) => updateNutrient('Fat (g)', val)}
                                />
                            </View>

                            {/* Notes */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
                            <TextInput
                                style={[styles.textArea, {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                placeholder="Add any notes about this meal..."
                                placeholderTextColor={colors.textSecondary}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                            />

                            {/* Action Buttons */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, {
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        borderWidth: 1
                                    }]}
                                    onPress={() => {
                                        setShowEditModal(false);
                                        handleCancelScan();
                                    }}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveMeal}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={colors.buttonText} />
                                    ) : (
                                        <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>
                                            Save Meal
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        marginTop: 50,
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
        height: 300,
        flex: 1,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
    },
    removeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingPreview: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
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
        fontSize: 12,
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    foodTypeScroll: {
        marginBottom: 8,
    },
    foodTypeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    foodTypeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    nutrientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    nutrientLabel: {
        fontSize: 16,
        flex: 1,
    },
    nutrientInput: {
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        width: 100,
        textAlign: 'center',
        borderWidth: 1,
    },
    textArea: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    predictionCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        gap: 12,
    },
    predictionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    predictionSource: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    confidenceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    confidenceText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    predictionMealName: {
        fontSize: 22,
        fontWeight: 'bold',
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    predictionServing: {
        fontSize: 14,
        marginBottom: 12,
    },
    nutrientsSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128, 128, 128, 0.2)',
    },
    nutrientItem: {
        alignItems: 'center',
        gap: 4,
    },
    nutrientValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    nutrientLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
    },
    alternatePredictions: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128, 128, 128, 0.2)',
    },
    alternateLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    alternateItem: {
        fontSize: 12,
        marginLeft: 8,
        marginBottom: 4,
    },
    predictionError: {
        fontSize: 16,
        textAlign: 'center',
        padding: 20,
        paddingBottom: 8,
    },
    predictionErrorHint: {
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        fontStyle: 'italic',
        opacity: 0.8,
    },
    predictionSourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    predictionSourceText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default FoodScanScreen;
