import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const AboutScreen = ({ navigation }) => {
    const { colors } = useTheme();

    const InfoSection = ({ title, children }) => (
        <View style={[styles.section, { backgroundColor: colors.card, ...colors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
            {children}
        </View>
    );

    const InfoItem = ({ icon, label, value, color }) => (
        <View style={styles.infoItem}>
            <FontAwesome name={icon} size={18} color={color || colors.primary} style={styles.infoIcon} />
            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
            </View>
        </View>
    );

    const FeatureItem = ({ icon, title, description, color }) => (
        <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: color + '20' }]}>
                <FontAwesome name={icon} size={24} color={color} />
            </View>
            <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    {description}
                </Text>
            </View>
        </View>
    );

    const TechItem = ({ component, technology }) => (
        <View style={styles.techItem}>
            <Text style={[styles.techComponent, { color: colors.text }]}>{component}</Text>
            <Text style={[styles.techTechnology, { color: colors.primary }]}>{technology}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* App Logo & Name */}
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
                        <FontAwesome name="cutlery" size={48} color={colors.buttonText} />
                    </View>
                    <Text style={[styles.appName, { color: colors.text }]}>FoodScan</Text>
                    <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                        Deep Learning for Healthier Living
                    </Text>
                    <Text style={[styles.version, { color: colors.textSecondary }]}>
                        Version 1.0.0
                    </Text>
                </View>

                {/* Overview */}
                <InfoSection title="Overview">
                    <Text style={[styles.description, { color: colors.text }]}>
                        FoodScan is a mobile application built with React Native and powered by a Python-based 
                        backend using PyTorch for machine learning inference. It enables users to scan food images 
                        and automatically estimate their nutritional content including calories, protein, 
                        carbohydrates, and fat through a ResNet50 deep learning model.
                    </Text>
                </InfoSection>

                {/* Developers */}
                <InfoSection title="Developed By">
                    <InfoItem
                        icon="user"
                        label="Developer"
                        value="Balla, Justine Juliana G."
                    />
                    <InfoItem
                        icon="user"
                        label="Developer"
                        value="Cabasa, Daniel O."
                    />
                </InfoSection>

                {/* Key Features */}
                <InfoSection title="Key Features">
                    <FeatureItem
                        icon="search"
                        title="Food Identification"
                        description="Recognizes a wide range of food items through a ResNet50 CNN"
                        color={colors.info}
                    />
                    <FeatureItem
                        icon="calculator"
                        title="Nutrient Estimation"
                        description="Predicts calorie, protein, carbohydrate, and fat content per serving"
                        color={colors.success}
                    />
                    <FeatureItem
                        icon="heartbeat"
                        title="Dietary Management"
                        description="Useful for managing conditions such as diabetes and obesity"
                        color={colors.error}
                    />
                    <FeatureItem
                        icon="line-chart"
                        title="Fitness Integration"
                        description="Enables tracking for athletes and fitness enthusiasts"
                        color={colors.warning}
                    />
                </InfoSection>

                {/* Tech Stack */}
                <InfoSection title="Tech Stack">
                    <TechItem component="Frontend" technology="React Native" />
                    <TechItem component="Backend" technology="Python (Flask)" />
                    <TechItem component="Machine Learning" technology="PyTorch" />
                    <TechItem component="Model Architecture" technology="ResNet50 CNN" />
                    <TechItem component="API Communication" technology="REST" />
                    <TechItem component="Platform" technology="Android / iOS" />
                </InfoSection>

                {/* How It Works */}
                <InfoSection title="How It Works">
                    <View style={styles.stepsList}>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.stepNumberText, { color: colors.buttonText }]}>1</Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text }]}>
                                Capture or upload a food image from the app
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.stepNumberText, { color: colors.buttonText }]}>2</Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text }]}>
                                Image is sent to the Python backend API
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.stepNumberText, { color: colors.buttonText }]}>3</Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text }]}>
                                PyTorch model (ResNet50) processes the image and extracts features
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.stepNumberText, { color: colors.buttonText }]}>4</Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text }]}>
                                Model predicts macronutrient values
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.stepNumberText, { color: colors.buttonText }]}>5</Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text }]}>
                                App displays results in an intuitive interface
                            </Text>
                        </View>
                    </View>
                </InfoSection>

                {/* License */}
                <InfoSection title="License">
                    <Text style={[styles.licenseText, { color: colors.text }]}>
                        This project is for academic and research purposes only. Unauthorized commercial 
                        use is prohibited.
                    </Text>
                </InfoSection>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        © 2025 FoodScan. All rights reserved.
                    </Text>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Made with ❤️ for healthier living
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
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    version: {
        fontSize: 14,
        marginTop: 4,
    },
    section: {
        marginHorizontal: 15,
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'justify',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'start',
        marginBottom: 16,
    },
    infoIcon: {
        marginTop: 4,
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    featureItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    featureContent: {
        flex: 1,
        justifyContent: 'center',
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    techItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128, 128, 128, 0.1)',
    },
    techComponent: {
        fontSize: 15,
        fontWeight: '600',
    },
    techTechnology: {
        fontSize: 15,
        fontWeight: '500',
    },
    stepsList: {
        gap: 16,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        paddingTop: 4,
    },
    enhancementsList: {
        gap: 12,
    },
    enhancementItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingLeft: 4,
    },
    enhancementText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    licenseText: {
        fontSize: 15,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    referenceItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12,
    },
    referenceText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    footerText: {
        fontSize: 13,
    },
});

export default AboutScreen;
