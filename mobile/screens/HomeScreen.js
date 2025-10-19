import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles/globalStyles';

const HomeScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hello, {user?.first_name || user?.username || 'User'}! 👋
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your nutrition journey
          </Text>
        </View>

        {/* Quick Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, ...colors.shadow }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Summary</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <FontAwesome name="cutlery" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Meals</Text>
            </View>
            
            <View style={styles.statItem}>
              <FontAwesome name="fire" size={18} color={colors.error} />
              <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories</Text>
            </View>
            
            <View style={styles.statItem}>
              <FontAwesome name="leaf" size={18} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>0g</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Carbs</Text>
            </View>
            
            <View style={styles.statItem}>
              <FontAwesome name="tint" size={18} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.text }]}>0g</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fat</Text>
            </View>
            
            <View style={styles.statItem}>
              <FontAwesome name="heart" size={18} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.text }]}>0g</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Protein</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary, ...colors.shadow }]}
            activeOpacity={0.8}
          >
            <FontAwesome name="camera" size={24} color={colors.buttonText} />
            <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
              Scan Food
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.secondary, ...colors.shadow }]}
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={24} color={colors.buttonText} />
            <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
              Add Meal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Meals Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Meals</Text>
          
          <View style={[styles.emptyState, { backgroundColor: colors.card, ...colors.shadow }]}>
            <FontAwesome name="cutlery" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No meals recorded yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              Start by scanning your first meal!
            </Text>
          </View>
        </View>

        {/* Nutrition Tips Card */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, ...colors.shadow }]}>
          <View style={styles.tipsHeader}>
            <FontAwesome name="lightbulb-o" size={20} color={colors.warning} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Tip of the Day</Text>
          </View>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            Stay hydrated! Aim to drink at least 8 glasses of water daily for optimal health.
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
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
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
  tipsCard: {
    borderRadius: 16,
    padding: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default HomeScreen;
