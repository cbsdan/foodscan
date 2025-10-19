// Font configuration
export const FONTS = {
  sizes: {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24,
  },
  weights: {
    light: "300",
    regular: "400",
    medium: "500",
    bold: "700",
  },
};

export const lightTheme = {
  background: "#c7cec5", // Soft sage green (background)
  text: "#222222", // Dark gray for text
  textSecondary: "#666666", // Secondary text color
  primary: "#2ea043", // Vibrant green (leaf/accent)
  secondary: "#3a3a3a", // Deep charcoal (phone screen)
  accent: "#ffffff", // White (highlights, card)
  surface: "#f5f5f5", // Light surface for cards
  card: "#ffffff", // Card background
  border: "#b0b8ae", // Muted sage border
  borderCards: "#2ea043", // Green accent border for cards
  buttonBackground: "#2ea043", // Green button
  buttonText: "#ffffff", // White button text
  statusBar: "dark", // Status bar for light mode
  success: "#4caf50", // Standard green for success
  error: "#e53935", // Standard red for error
  warning: "#ffb300", // Standard yellow for warning
  info: "#0288d1", // Standard blue for info
  // Toast specific colors
  toast: {
    success: "#4caf50",
    error: "#e53935",
    warning: "#ffb300",
    info: "#0288d1",
    text: "#FFFFFF",
  },
  // Navigation specific
  tabBarBackground: "#ffffff",
  tabBarActive: "#2ea043",
  tabBarInactive: "#757575",
  tabBarBorder: "#b0b8ae",
  headerBackground: "#ffffff",
  headerText: "#222222",
  // Input fields
  inputBackground: "#f9f9f9",
  inputText: "#222222",
  inputBorder: "#b0b8ae",
  inputPlaceholder: "#999999",
  // Card shadows
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Add fonts to theme to prevent undefined errors
  fonts: FONTS,
};

export const darkTheme = {
  background: "#1a1f1e", // Deep green-gray (background)
  text: "#ffffff", // White text
  textSecondary: "#b0b8ae", // Secondary text color (muted sage)
  primary: "#2ea043", // Vibrant green (leaf/accent)
  secondary: "#b0b8ae", // Muted sage (secondary text/icons)
  accent: "#2ea043", // Green accent
  surface: "#2c2c2c", // Card/surface
  card: "#2a2f2e", // Card background (slightly lighter than background)
  border: "#3a3a3a", // Charcoal border
  borderCards: "#2ea043", // Green accent border for cards
  buttonBackground: "#2ea043", // Green button
  buttonText: "#ffffff", // White button text
  statusBar: "light", // Status bar for dark mode
  success: "#4caf50", // Standard green for success
  error: "#ef5350", // Lighter red for error (better visibility in dark)
  warning: "#ffa726", // Lighter orange for warning
  info: "#29b6f6", // Lighter blue for info
  // Toast specific colors
  toast: {
    success: "#4caf50",
    error: "#e53935",
    warning: "#ffb300",
    info: "#0288d1",
    text: "#FFFFFF",
  },
  // Navigation specific
  tabBarBackground: "#232826",
  tabBarActive: "#2ea043",
  tabBarInactive: "#9e9e9e",
  tabBarBorder: "#3a3a3a",
  headerBackground: "#232826",
  headerText: "#ffffff",
  // Input fields
  inputBackground: "#2c2c2c",
  inputText: "#ffffff",
  inputBorder: "#3a3a3a",
  inputPlaceholder: "#777777",
  // Card shadows
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // Add fonts to theme to prevent undefined errors
  fonts: FONTS,
};

// Helper function to get theme based on mode
export const getThemeColors = (isDarkMode) => {
  return isDarkMode ? darkTheme : lightTheme;
};
