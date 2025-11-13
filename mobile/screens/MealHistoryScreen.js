import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { nutrientService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const MealHistoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const toast = useToast();
  
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingMealId, setDeletingMealId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState(null);
  
  // Filter states
  const [period, setPeriod] = useState('today'); // 'today', 'week', 'month', 'all'
  const [selectedFoodType, setSelectedFoodType] = useState('all'); // 'all' or specific food type
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const foodTypes = ['all', 'breakfast', 'lunch', 'dinner', 'snacks', 'drinks', 'dessert', 'other'];

  useEffect(() => {
    loadMeals();
  }, []);

  // Reload meals when screen comes into focus or filters change
  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [period, selectedFoodType])
  );

  const getDateRange = () => {
    const now = new Date();
    let startDate = null;
    const endDate = now.toISOString();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString();
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString();
        break;
      case 'all':
        startDate = null;
        break;
    }

    return { startDate, endDate };
  };

  const loadMeals = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      let result;

      // If specific food type is selected, use food type filter
      if (selectedFoodType !== 'all') {
        result = await nutrientService.getMealsByFoodType(
          selectedFoodType,
          100, // limit
          0, // offset
          startDate,
          period !== 'all' ? endDate : null
        );
      } else {
        // Otherwise, get all meals for the date range
        result = await nutrientService.getMeals(
          100, // limit
          0, // offset
          startDate,
          period !== 'all' ? endDate : null
        );
      }

      if (result.success) {
        // The backend returns meals in the "data" property
        const meals = result.data || [];
        console.log('MealHistory - Meals array:', meals, 'Length:', meals.length);
        
        setMeals(Array.isArray(meals) ? meals : []);
      } else {
        toast.error(result.message || 'Failed to load meals');
      }
    } catch (error) {
      console.error('Error loading meals:', error);
      toast.error('An error occurred while loading meals');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMeals();
    setIsRefreshing(false);
  }, []);

  const handleDeleteConfirm = (mealId) => {
    setSelectedMealId(mealId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!selectedMealId) return;
    
    setShowDeleteConfirm(false);
    setDeletingMealId(selectedMealId);
    
    try {
      const result = await nutrientService.deleteMeal(selectedMealId);
      if (result.success) {
        toast.success('Meal deleted successfully');
        // Remove meal from state
        setMeals(meals.filter(meal => meal.id !== selectedMealId));
      } else {
        toast.error(result.message || 'Failed to delete meal');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('An error occurred while deleting meal');
    } finally {
      setDeletingMealId(null);
      setSelectedMealId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    // Add 'Z' to indicate UTC if not present
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
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
      other: 'cutlery'
    };
    return icons[foodType?.toLowerCase()] || 'cutlery';
  };

  const getFoodTypeColor = (foodType) => {
    const colorMap = {
      all: colors.primary,
      breakfast: '#FF9500',
      lunch: '#FF3B30',
      dinner: '#5856D6',
      snacks: '#4CD964',
      drinks: '#007AFF',
      dessert: '#FF2D55',
      other: colors.textSecondary
    };
    return colorMap[foodType] || colors.textSecondary;
  };

  const handleSearch = () => {
    loadMeals();
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return "Today's Meals";
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'all':
        return 'All Meals';
      default:
        return 'Meals';
    }
  };

  const getFilteredMealsBySearch = () => {
    // Defensive check: ensure meals is always an array
    const mealsArray = Array.isArray(meals) ? meals : [];
    
    if (!searchQuery.trim()) return mealsArray;
    
    const query = searchQuery.toLowerCase();
    return mealsArray.filter(meal => {
      // Handle corrupted meal_name (when it's an object instead of string)
      const mealName = typeof meal.meal_name === 'string' 
        ? meal.meal_name 
        : (typeof meal.meal_name === 'object' && meal.meal_name?.meal_name 
          ? meal.meal_name.meal_name 
          : '');
      
      return (mealName && mealName.toLowerCase().includes(query)) ||
        (meal.notes && meal.notes.toLowerCase().includes(query)) ||
        (meal.food_type && meal.food_type.toLowerCase().includes(query));
    });
  };

  const renderMealCard = (meal) => {
    const nutrients = meal.nutrients || {};
    const foodTypeColor = getFoodTypeColor(meal.food_type);
    const isDeleting = deletingMealId === meal.id;

    console.log(meal.id)
    return (
      <View
        key={meal.id}
        style={[styles.mealCard, { backgroundColor: colors.card, ...colors.shadow }]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            console.log('Navigating to MealDetail with ID:', meal.id);
            navigation.navigate('MealDetail', { mealId: meal.id });
          }}
          disabled={isDeleting}
        >
          {/* Meal Image and Info */}
          <View style={styles.mealHeader}>
            {meal.image_url ? (
              <Image 
                source={{ uri: meal.image_url }} 
                style={styles.mealImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.mealImagePlaceholder, { backgroundColor: colors.background }]}>
                <FontAwesome name="image" size={32} color={colors.textSecondary} />
              </View>
            )}
            
            <View style={styles.mealInfo}>
              <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>
                {typeof meal.meal_name === 'string' 
                  ? meal.meal_name 
                  : (typeof meal.meal_name === 'object' && meal.meal_name?.meal_name 
                    ? meal.meal_name.meal_name 
                    : 'Unnamed Meal')}
              </Text>
              
              <View style={styles.mealMeta}>
                <FontAwesome name={getFoodTypeIcon(meal.food_type)} size={14} color={foodTypeColor} />
                <Text style={[styles.mealType, { color: foodTypeColor }]}>
                  {meal.food_type ? meal.food_type.charAt(0).toUpperCase() + meal.food_type.slice(1) : 'Other'}
                </Text>
              </View>
              
              <View style={styles.mealMeta}>
                <FontAwesome name="clock-o" size={14} color={colors.textSecondary} />
                <Text style={[styles.mealDate, { color: colors.textSecondary }]}>
                  {formatDate(meal.meal_datetime)} at {formatTime(meal.meal_datetime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Nutrients Summary */}
          <View style={styles.nutrientsSummary}>
            <View style={styles.nutrientItem}>
              <Text style={[styles.nutrientValue, { color: colors.error }]}>
                {Math.round(nutrients.Calories || 0)}
              </Text>
              <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>cal</Text>
            </View>
            
            <View style={styles.nutrientDivider} />
            
            <View style={styles.nutrientItem}>
              <Text style={[styles.nutrientValue, { color: colors.info }]}>
                {Math.round(nutrients['Protein (g)'] || 0)}g
              </Text>
              <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>protein</Text>
            </View>
            
            <View style={styles.nutrientDivider} />
            
            <View style={styles.nutrientItem}>
              <Text style={[styles.nutrientValue, { color: colors.success }]}>
                {Math.round(nutrients['Carbs (g)'] || 0)}g
              </Text>
              <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>carbs</Text>
            </View>
            
            <View style={styles.nutrientDivider} />
            
            <View style={styles.nutrientItem}>
              <Text style={[styles.nutrientValue, { color: colors.warning }]}>
                {Math.round(nutrients['Fat (g)'] || 0)}g
              </Text>
              <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>fat</Text>
            </View>
          </View>

          {/* Notes Preview */}
          {meal.notes && (
            <Text style={[styles.mealNotes, { color: colors.textSecondary }]} numberOfLines={2}>
              {meal.notes}
            </Text>
          )}
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error }]}
          onPress={() => handleDeleteConfirm(meal.id)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <FontAwesome name="trash" size={18} color={colors.buttonText} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const filteredMeals = getFilteredMealsBySearch();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Search and Filter Toggle */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{getPeriodLabel()}</Text>
          <TouchableOpacity
            style={[styles.filterToggle, { backgroundColor: showFilters ? colors.primary : colors.background }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <FontAwesome 
              name="filter" 
              size={18} 
              color={showFilters ? colors.buttonText : colors.text} 
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <FontAwesome name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search meals"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            {/* Period Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Time Period</Text>
              <View style={styles.filterChips}>
                {['today', 'week', 'month', 'all'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: period === p ? colors.primary : colors.background,
                        borderColor: period === p ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: period === p ? colors.buttonText : colors.text },
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Results Count */}
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {filteredMeals.length} {filteredMeals.length === 1 ? 'meal' : 'meals'} found
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading meals...
            </Text>
          </View>
        ) : filteredMeals.length === 0 ? (
          /* Empty State */
          <View style={[styles.emptyState, { backgroundColor: colors.card, ...colors.shadow }]}>
            <FontAwesome 
              name={searchQuery || selectedFoodType !== 'all' || period !== 'all' ? 'search' : 'cutlery'} 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              {searchQuery || selectedFoodType !== 'all' || period !== 'all' 
                ? 'No meals found' 
                : 'No meals recorded yet'}
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              {searchQuery || selectedFoodType !== 'all' || period !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Start by scanning your first meal!'}
            </Text>
            {!searchQuery && selectedFoodType === 'all' && period === 'all' && (
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('FoodScan')}
              >
                <FontAwesome name="camera" size={20} color={colors.buttonText} />
                <Text style={[styles.emptyStateButtonText, { color: colors.buttonText }]}>
                  Scan Food
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Meal List */
          <View style={styles.mealsList}>
            {filteredMeals.map((meal) => renderMealCard(meal))}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  filtersContainer: {
    marginTop: 16,
    gap: 16,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  foodTypeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  foodTypeFilterText: {
    fontSize: 13,
  },
  resultsCount: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealsList: {
    gap: 16,
  },
  mealCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    position: 'relative',
  },
  mealHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  mealImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
    gap: 6,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    paddingRight: 40,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  mealDate: {
    fontSize: 12,
  },
  nutrientsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  nutrientItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nutrientLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  nutrientDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  mealNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  confirmMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmDeleteButton: {
    borderWidth: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MealHistoryScreen;
