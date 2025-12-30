import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Service to handle Haptic Feedback (Vibration)
 * Uses expo-haptics for rich feedback on supported devices.
 */
class HapticsService {

  /**
   * Light impact - good for UI selections (tabs, list items)
   */
  static light() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  /**
   * Medium impact - good for secondary actions
   */
  static medium() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  /**
   * Heavy impact - good for primary actions or significant UI changes
   */
  static heavy() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }

  /**
   * Success notification - distinct pattern for successful operations
   */
  static success() {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  /**
   * Warning notification - distinct pattern for warnings
   */
  static warning() {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }

  /**
   * Error notification - distinct pattern for errors
   */
  static error() {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  /**
   * Selection - very light, for scrolling/pickers
   */
  static selection() {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }
}

export default HapticsService;
