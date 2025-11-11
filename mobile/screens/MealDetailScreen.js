import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { nutrientService } from '../services/api';

const MealDetailScreen = ({ route, navigation }) => {
  const { mealId } = route.params;
  const { colors } = useTheme();
  const toast = useToast();

  const [meal, setMeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editedMealName, setEditedMealName] = useState('');
  const [editedFoodType, setEditedFoodType] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [editedNutrients, setEditedNutrients] = useState({
    Calories: '',
    'Protein (g)': '',
    'Carbs (g)': '',
    'Fat (g)': '',
  });

  const foodTypes = ['breakfast', 'lunch', 'dinner', 'snacks', 'drinks', 'dessert', 'other'];

  useEffect(() => {
    loadMealDetails();
  }, [mealId]);

  const loadMealDetails = async () => {
    setIsLoading(true);
    try {
      console.log('Loading meal details for ID:', mealId);
      const result = await nutrientService.getMealById(mealId);
      console.log('API Response:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        // Backend returns meal inside 'meal' property
        const mealData = result.meal || result.data || result;
        console.log('Meal data:', mealData);
        
        if (!mealData) {
          console.error('No meal data in response');
          toast.error('Meal data not found');
          navigation.goBack();
          return;
        }
        
        setMeal(mealData);
        // Initialize edit form with current values
        setEditedMealName(mealData.meal_name || '');
        setEditedFoodType(mealData.food_type || 'other');
        setEditedNotes(mealData.notes || '');
        setEditedNutrients({
          Calories: String(mealData.nutrients?.Calories || ''),
          'Protein (g)': String(mealData.nutrients?.['Protein (g)'] || ''),
          'Carbs (g)': String(mealData.nutrients?.['Carbs (g)'] || ''),
          'Fat (g)': String(mealData.nutrients?.['Fat (g)'] || ''),
        });
      } else {
        console.error('API returned error:', result.error || result.message);
        toast.error(result.message || result.error || 'Failed to load meal details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading meal details:', error);
      toast.error('An error occurred while loading meal details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setEditedMealName(meal.meal_name || '');
    setEditedFoodType(meal.food_type || 'other');
    setEditedNotes(meal.notes || '');
    setEditedNutrients({
      Calories: String(meal.nutrients?.Calories || ''),
      'Protein (g)': String(meal.nutrients?.['Protein (g)'] || ''),
      'Carbs (g)': String(meal.nutrients?.['Carbs (g)'] || ''),
      'Fat (g)': String(meal.nutrients?.['Fat (g)'] || ''),
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editedMealName.trim()) {
      toast.error('Please enter a meal name');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        meal_name: editedMealName.trim(),
        food_type: editedFoodType,
        notes: editedNotes.trim(),
        nutrients: {
          Calories: parseFloat(editedNutrients.Calories) || 0,
          'Protein (g)': parseFloat(editedNutrients['Protein (g)']) || 0,
          'Carbs (g)': parseFloat(editedNutrients['Carbs (g)']) || 0,
          'Fat (g)': parseFloat(editedNutrients['Fat (g)']) || 0,
        },
      };

      const result = await nutrientService.updateMeal(mealId, updateData);
      if (result.success) {
        toast.success('Meal updated successfully');
        setIsEditing(false);
        await loadMealDetails(); // Reload to get updated data
      } else {
        toast.error(result.message || 'Failed to update meal');
      }
    } catch (error) {
      console.error('Error updating meal:', error);
      toast.error('An error occurred while updating meal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      const result = await nutrientService.deleteMeal(mealId);
      if (result.success) {
        toast.success('Meal deleted successfully');
        navigation.goBack();
      } else {
        toast.error(result.message || 'Failed to delete meal');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('An error occurred while deleting meal');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    // Add 'Z' to indicate UTC if not present
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    // Add 'Z' to indicate UTC if not present
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getFoodTypeIcon = (foodType) => {
    const icons = {
      breakfast: 'coffee',
      lunch: 'cutlery',
      dinner: 'cutlery',
      snacks: 'apple',
      drinks: 'glass',
      dessert: 'birthday-cake',
      other: 'cutlery',
    };
    return icons[foodType?.toLowerCase()] || 'cutlery';
  };

  const getFoodTypeColor = (foodType) => {
    const colorMap = {
      breakfast: '#FF9500',
      lunch: '#FF3B30',
      dinner: '#5856D6',
      snacks: '#4CD964',
      drinks: '#007AFF',
      dessert: '#FF2D55',
      other: colors.textSecondary,
    };
    return colorMap[foodType] || colors.textSecondary;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading meal details...
        </Text>
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <FontAwesome name="exclamation-circle" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>Meal not found</Text>
      </View>
    );
  }

  const foodTypeColor = getFoodTypeColor(meal.food_type);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meal Image */}
        {meal.image_url ? (
          <Image source={{ uri: meal.image_url }} style={styles.mealImage} resizeMode="cover" />
        ) : (
          <View style={[styles.mealImagePlaceholder, { backgroundColor: colors.card }]}>
            <FontAwesome name="image" size={80} color={colors.textSecondary} />
          </View>
        )}

        {/* Action Buttons */}
        {!isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleEdit}
              disabled={isDeleting}
            >
              <FontAwesome name="edit" size={20} color={colors.buttonText} />
              <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.error }]}
              onPress={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.buttonText} />
              ) : (
                <>
                  <FontAwesome name="trash" size={20} color={colors.buttonText} />
                  <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Meal Details */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, ...colors.shadow }]}>
          {/* Meal Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Meal Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editedMealName}
                onChangeText={setEditedMealName}
                placeholder="Enter meal name"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{meal.meal_name}</Text>
            )}
          </View>

          {/* Food Type */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Food Type</Text>
            {isEditing ? (
              <View style={styles.foodTypeGrid}>
                {foodTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.foodTypeChip,
                      {
                        backgroundColor: editedFoodType === type ? colors.primary : colors.background,
                        borderColor: editedFoodType === type ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setEditedFoodType(type)}
                  >
                    <FontAwesome
                      name={getFoodTypeIcon(type)}
                      size={15}
                      color={editedFoodType === type ? colors.buttonText : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.foodTypeChipText,
                        {
                          color: editedFoodType === type ? colors.buttonText : colors.text,
                        },
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.foodTypeBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <FontAwesome name={getFoodTypeIcon(meal.food_type)} size={18} color={getFoodTypeColor(meal.food_type)} />
                <Text style={[styles.foodTypeBadgeText, { color: colors.text }]}>
                  {meal.food_type ? meal.food_type.charAt(0).toUpperCase() + meal.food_type.slice(1) : 'Other'}
                </Text>
              </View>
            )}
          </View>

          {/* Date and Time */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeRow}>
                <FontAwesome name="calendar" size={18} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {formatDate(meal.meal_datetime)}
                </Text>
              </View>
              <View style={styles.dateTimeRow}>
                <FontAwesome name="clock-o" size={18} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {formatTime(meal.meal_datetime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Nutrients */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Nutritional Information</Text>
            <View style={styles.nutrientsGrid}>
              {/* Calories */}
              <View style={[styles.nutrientCard, { backgroundColor: colors.background }]}>
                <FontAwesome name="fire" size={24} color={colors.error} />
                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Calories</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.nutrientInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={editedNutrients.Calories}
                    onChangeText={(text) => setEditedNutrients({ ...editedNutrients, Calories: text })}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.nutrientValue, { color: colors.error }]}>
                    {Math.round(meal.nutrients?.Calories || 0)}
                  </Text>
                )}
              </View>

              {/* Protein */}
              <View style={[styles.nutrientCard, { backgroundColor: colors.background }]}>
                <FontAwesome name="circle" size={24} color={colors.info} />
                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Protein</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.nutrientInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={editedNutrients['Protein (g)']}
                    onChangeText={(text) => setEditedNutrients({ ...editedNutrients, 'Protein (g)': text })}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.nutrientValue, { color: colors.info }]}>
                    {Math.round(meal.nutrients?.['Protein (g)'] || 0)}g
                  </Text>
                )}
              </View>

              {/* Carbs */}
              <View style={[styles.nutrientCard, { backgroundColor: colors.background }]}>
                <FontAwesome name="leaf" size={24} color={colors.success} />
                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Carbs</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.nutrientInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={editedNutrients['Carbs (g)']}
                    onChangeText={(text) => setEditedNutrients({ ...editedNutrients, 'Carbs (g)': text })}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.nutrientValue, { color: colors.success }]}>
                    {Math.round(meal.nutrients?.['Carbs (g)'] || 0)}g
                  </Text>
                )}
              </View>

              {/* Fat */}
              <View style={[styles.nutrientCard, { backgroundColor: colors.background }]}>
                <FontAwesome name="tint" size={24} color={colors.warning} />
                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>Fat</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.nutrientInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={editedNutrients['Fat (g)']}
                    onChangeText={(text) => setEditedNutrients({ ...editedNutrients, 'Fat (g)': text })}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={[styles.nutrientValue, { color: colors.warning }]}>
                    {Math.round(meal.nutrients?.['Fat (g)'] || 0)}g
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
            {isEditing ? (
              <TextInput
                style={[styles.notesInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editedNotes}
                onChangeText={setEditedNotes}
                placeholder="Add notes (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : meal.notes ? (
              <Text style={[styles.notesText, { color: colors.text }]}>{meal.notes}</Text>
            ) : (
              <Text style={[styles.noNotes, { color: colors.textSecondary }]}>No notes</Text>
            )}
          </View>
        </View>

        {/* Save/Cancel Buttons for Edit Mode */}
        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.editActionButton, styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleCancelEdit}
              disabled={isSaving}
            >
              <Text style={[styles.editActionButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.editActionButton, styles.saveButton, { backgroundColor: colors.success }]}
              onPress={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.buttonText} />
              ) : (
                <Text style={[styles.editActionButtonText, { color: colors.buttonText }]}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent
        visible={showDeleteConfirm}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <Pressable
            style={[styles.confirmDialog, { backgroundColor: colors.card, ...colors.shadow }]}
            onPress={(e) => e.stopPropagation()}
          >
            <FontAwesome name="exclamation-triangle" size={48} color={colors.warning} />
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Delete Meal?</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              This action cannot be undone. Are you sure you want to delete this meal?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmDeleteButton, { backgroundColor: colors.error }]}
                onPress={handleDelete}
              >
                <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  mealImage: {
    width: '100%',
    height: 280,
  },
  mealImagePlaceholder: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  deleteButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailsCard: {
    marginVertical: 15,
    marginHorizontal: 12,
    padding: 24,
    borderRadius: 20,
    gap: 32,
  },
  section: {
    gap: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  input: {
    fontSize: 18,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  foodTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignSelf: 'flex-start',
  },
  foodTypeBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  foodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  foodTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
  },
  foodTypeChipText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dateTimeContainer: {
    gap: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  nutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  nutrientCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 10,
  },
  nutrientLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.7,
  },
  nutrientValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  nutrientInput: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 90,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  notesInput: {
    fontSize: 16,
    lineHeight: 26,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 120,
  },
  noNotes: {
    fontSize: 16,
    fontStyle: 'italic',
    opacity: 0.5,
  },
  editActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 8,
  },
  editActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  saveButton: {
    flex: 1,
  },
  editActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 20,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  confirmMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  confirmActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  confirmDeleteButton: {
    borderWidth: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default MealDetailScreen;
