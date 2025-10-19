import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    FlatList
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { nutrientService } from '../services/api';
import { globalStyles } from '../styles/globalStyles';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIPS_WIDTH = SCREEN_WIDTH - 80; // Account for padding (20px * 2 + 20px * 2)

const HomeScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const toast = useToast();

    const [period, setPeriod] = useState('today'); // today, week, month
    const [summary, setSummary] = useState(null);
    const [recentMeals, setRecentMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const flatListRef = useRef(null);

  const nutritionTips = [
        {
            icon: 'tint',
            color: colors.info,
            title: 'Stay Hydrated',
            text: 'Drink at least 8 glasses of water daily. Proper hydration boosts metabolism and aids digestion.',
        },
        {
            icon: 'apple',
            color: colors.success,
            title: 'Eat the Rainbow',
            text: 'Include colorful fruits and vegetables in every meal for a variety of vitamins and antioxidants.',
        },
        {
            icon: 'clock-o',
            color: colors.warning,
            title: 'Meal Timing Matters',
            text: 'Try not to skip breakfast. Eating within an hour of waking jumpstarts your metabolism.',
        },
        {
            icon: 'heart',
            color: colors.error,
            title: 'Protein Power',
            text: 'Include lean protein in every meal to maintain muscle mass and keep you feeling full longer.',
        },
        {
            icon: 'moon-o',
            color: colors.primary,
            title: 'Mindful Eating',
            text: 'Eat slowly and without distractions. It takes 20 minutes for your brain to register fullness.',
        },
    ];

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [period])
    );

    const getDateRange = () => {
        const now = new Date();
        let startDate, endDate;

        if (period === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        } else if (period === 'week') {
            const dayOfWeek = now.getDay();
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
            endDate = now;
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = now;
        }

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const { startDate, endDate } = getDateRange();

            // Load nutrition summary
            const summaryResult = await nutrientService.getNutritionSummary(startDate, endDate);
            if (summaryResult.success) {
                setSummary(summaryResult);
            }

            // Load recent meals
            const mealsResult = await nutrientService.getMeals(5, 0, startDate, endDate);
            if (mealsResult.success) {
                setRecentMeals(mealsResult.meals || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load nutrition data');
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    }, [period]);

    const formatMealTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getPeriodLabel = () => {
        if (period === 'today') return "Today's";
        if (period === 'week') return "This Week's";
        return "This Month's";
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentTipIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderTipItem = ({ item }) => (
        <View style={[styles.tipSlide, { width: TIPS_WIDTH }]}>
            <FontAwesome name={item.icon} size={40} color={item.color} />
            <Text style={[styles.tipTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.tipsText, { color: colors.textSecondary }]}>{item.text}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.icon, { color: colors.text }]}>
                        👋
                    </Text>
                    <Text style={[styles.greeting, { color: colors.text }]}>
                        Hello, {user?.first_name || user?.username || 'User'}!
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Track your nutrition journey
                    </Text>
                </View>

                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    {['today', 'week', 'month'].map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[
                                styles.periodButton,
                                {
                                    backgroundColor: period === p ? colors.primary : colors.card,
                                    borderColor: colors.border,
                                    ...colors.shadow
                                }
                            ]}
                            onPress={() => setPeriod(p)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.periodButtonText,
                                { color: period === p ? colors.buttonText : colors.text }
                            ]}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Stats Card */}
                <View style={[styles.statsCard, { backgroundColor: colors.card, ...colors.shadow }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{getPeriodLabel()} Summary</Text>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : (
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <FontAwesome name="cutlery" size={18} color={colors.primary} />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {summary?.meal_count || 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Meals</Text>
                            </View>

                            <View style={styles.statItem}>
                                <FontAwesome name="fire" size={18} color={colors.error} />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {Math.round(summary?.total_nutrients?.calories || 0)}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories</Text>
                            </View>

                            <View style={styles.statItem}>
                                <FontAwesome name="leaf" size={18} color={colors.success} />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {Math.round(summary?.total_nutrients?.carbs || 0)}g
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Carbs</Text>
                            </View>

                            <View style={styles.statItem}>
                                <FontAwesome name="tint" size={18} color={colors.warning} />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {Math.round(summary?.total_nutrients?.fat || 0)}g
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fat</Text>
                            </View>

                            <View style={styles.statItem}>
                                <FontAwesome name="heart" size={18} color={colors.info} />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {Math.round(summary?.total_nutrients?.protein || 0)}g
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Protein</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary, ...colors.shadow }]}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('FoodScan')}
                    >
                        <FontAwesome name="camera" size={24} color={colors.buttonText} />
                        <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                            Scan Food
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.secondary, ...colors.shadow }]}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('MealHistory')}
                    >
                        <FontAwesome name="history" size={24} color={colors.buttonText} />
                        <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                            View History
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Meals Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Meals</Text>
                        {recentMeals.length > 0 && (
                            <TouchableOpacity onPress={() => navigation.navigate('MealHistory')}>
                                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : recentMeals.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colors.card, ...colors.shadow }]}>
                            <FontAwesome name="cutlery" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                                No meals recorded yet
                            </Text>
                            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                                Start by scanning your first meal!
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.mealsList}>
                            {recentMeals.map((meal) => (
                                <TouchableOpacity
                                    key={meal.id}
                                    style={[styles.mealItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => navigation.navigate('MealHistory')}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.mealHeader}>
                                        <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>
                                            {meal.meal_name || 'Unnamed Meal'}
                                        </Text>
                                        <Text style={[styles.mealTime, { color: colors.textSecondary }]}>
                                            {formatMealTime(meal.meal_datetime)}
                                        </Text>
                                    </View>
                                    <View style={styles.mealNutrients}>
                                        <Text style={[styles.mealNutrient, { color: colors.error }]}>
                                            {Math.round(meal.nutrients?.Calories || 0)} cal
                                        </Text>
                                        <Text style={[styles.mealNutrient, { color: colors.info }]}>
                                            {Math.round(meal.nutrients?.['Protein (g)'] || 0)}g protein
                                        </Text>
                                        <Text style={[styles.mealNutrient, { color: colors.success }]}>
                                            {Math.round(meal.nutrients?.['Carbs (g)'] || 0)}g carbs
                                        </Text>
                                        <Text style={[styles.mealNutrient, { color: colors.warning }]}>
                                            {Math.round(meal.nutrients?.['Fat (g)'] || 0)}g fat
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Nutrition Tips Slideshow */}
                <View style={[styles.tipsCard, { backgroundColor: colors.card, ...colors.shadow }]}>
                    <View style={styles.tipsHeader}>
                        <FontAwesome name="lightbulb-o" size={20} color={colors.warning} />
                        <Text style={[styles.tipsSectionTitle, { color: colors.text }]}>Nutrition Tips</Text>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={nutritionTips}
                        renderItem={renderTipItem}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        contentContainerStyle={styles.tipsListContainer}
                    />

                    {/* Pagination Dots */}
                    <View style={styles.paginationDots}>
                        {nutritionTips.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: index === currentTipIndex ? colors.primary : colors.border,
                                        width: index === currentTipIndex ? 24 : 8,
                                    },
                                ]}
                            />
                        ))}
                    </View>
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
        marginBottom: 24,
        marginTop: 40
    },
    icon: {
        alignSelf: 'center',
        fontSize: 45,
    },
    greeting: {
        fontSize: 35,
        fontWeight: 'bold',
        alignSelf: 'center',

        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        alignSelf: 'center',

    },
    periodSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
        minWidth: '18%',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        textAlign: 'center',
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
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        borderRadius: 16,
        gap: 12,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
    },
    emptyStateSubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    mealsList: {
        gap: 12,
    },
    mealItem: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    mealTime: {
        fontSize: 12,
    },
    mealNutrients: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    mealNutrient: {
        fontSize: 12,
        fontWeight: '500',
    },
  tipsCard: {
    borderRadius: 16,
    padding: 20,
    paddingBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  tipsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsListContainer: {
    paddingHorizontal: 20,
  },
  tipSlide: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});export default HomeScreen;
