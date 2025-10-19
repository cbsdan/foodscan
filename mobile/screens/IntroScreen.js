import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const IntroScreen = ({ onFinish }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [currentSlide]);

  const slides = [
    {
      icon: 'scan',
      title: 'Scan Your Food',
      description: 'Simply capture or upload a photo of your meal and let our AI-powered system identify it instantly.',
      color: colors.primary,
    },
    {
      icon: 'nutrition',
      title: 'Nutrient Analysis',
      description: 'Get detailed nutritional information including calories, protein, carbohydrates, and fat content for every meal.',
      color: colors.success,
    },
    {
      icon: 'trending-up',
      title: 'Monitor Your Diet',
      description: 'Track your daily food intake and monitor your nutritional goals with ease. Perfect for fitness and health management.',
      color: colors.info,
    },
    {
      icon: 'fitness',
      title: 'Powered by AI',
      description: 'Built with ResNet50 deep learning model using PyTorch for accurate food recognition and nutrient estimation.',
      color: colors.primary,
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true,
      });
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Theme Toggle Button */}
      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: colors.card }]}
        onPress={toggleTheme}
      >
        <Ionicons
          name={isDarkMode ? 'sunny' : 'moon'}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* Skip Button */}
      {currentSlide < slides.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: colors.secondary }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <Animated.View
            key={index}
            style={[
              styles.slide,
              { opacity: currentSlide === index ? fadeAnim : 1 }
            ]}
          >
            <View style={styles.content}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: `${slide.color}20`,
                    borderColor: slide.color,
                  },
                ]}
              >
                <Ionicons name={slide.icon} size={80} color={slide.color} />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>
                {slide.title}
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: colors.secondary }]}>
                {slide.description}
              </Text>

              {/* App Name Tag */}
              {index === 0 && (
                <View style={[styles.appTag, { backgroundColor: colors.surface }]}>
                  <Ionicons name="leaf" size={20} color={colors.primary} />
                  <Text style={[styles.appName, { color: colors.primary }]}>
                    FoodScan
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    currentSlide === index ? colors.primary : colors.border,
                  width: currentSlide === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.buttonBackground,
              borderColor: colors.borderCards,
            },
          ]}
          onPress={handleNext}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentSlide === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={20}
            color={colors.buttonText}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
    paddingBottom: 150,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  appTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 30,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: 200,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default IntroScreen;
