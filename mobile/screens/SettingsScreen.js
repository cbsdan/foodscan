import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Image
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles/globalStyles';

const SettingsScreen = ({ navigation }) => {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
        <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card, ...colors.shadow }]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <FontAwesome name={icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
                    {subtitle && (
                        <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>
            {rightComponent || (
                onPress && <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
            )}
        </TouchableOpacity>
    );

    const SettingSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
            {children}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <FontAwesome name="gear" size={60} color={colors.primary} />
                    <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                </View>

                {/* Profile Header */}
                <View style={[styles.profileHeader, { backgroundColor: colors.card, ...colors.shadow }]}>
                    {user?.profile_image ? (
                        <Image
                            source={{ uri: user.profile_image }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.avatarText, { color: colors.buttonText }]}>
                                {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.text }]}>
                            {user?.first_name && user?.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user?.username || 'User'}
                        </Text>
                        <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                            {user?.email || 'email@example.com'}
                        </Text>
                    </View>
                </View>

                {/* Appearance Section */}
                <SettingSection title="APPEARANCE">
                    <SettingItem
                        icon="moon-o"
                        title="Dark Mode"
                        subtitle={isDarkMode ? "Enabled" : "Disabled"}
                        rightComponent={
                            <Switch
                                value={isDarkMode}
                                onValueChange={toggleTheme}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={colors.buttonText}
                            />
                        }
                    />
                </SettingSection>

                {/* Account Section */}
                <SettingSection title="ACCOUNT">
                    <SettingItem
                        icon="user"
                        title="Edit Profile"
                        subtitle="Update your personal information"
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                    <SettingItem
                        icon="lock"
                        title="Change Password"
                        subtitle="Update your password"
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                </SettingSection>

                {/* Nutrition Goals Section
                <SettingSection title="NUTRITION GOALS">
                    <SettingItem
                        icon="bullseye"
                        title="Daily Goals"
                        subtitle="Set your nutrition targets"
                        onPress={() => console.log('Daily Goals')}
                    />
                    <SettingItem
                        icon="line-chart"
                        title="Activity Level"
                        subtitle="Adjust based on your lifestyle"
                        onPress={() => console.log('Activity Level')}
                    />
                </SettingSection> */}

                {/* Support Section */}
                <SettingSection title="SUPPORT">
                    <SettingItem
                        icon="info-circle"
                        title="About"
                        subtitle="App version and information"
                        onPress={() => navigation.navigate('About')}
                    />
                </SettingSection>

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.error, ...colors.shadow }]}
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <FontAwesome name="sign-out" size={20} color={colors.buttonText} />
                    <Text style={[styles.logoutText, { color: colors.buttonText }]}>
                        Logout
                    </Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={[styles.versionText, { color: colors.textSecondary }]}>
                    Version 1.0.0
                </Text>
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
        marginTop: 50,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
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
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
    },
    editButton: {
        padding: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingText: {
        marginLeft: 12,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 24,
    },
});

export default SettingsScreen;
