import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';

class BiometricService {
  /**
   * Check if hardware supports biometrics
   */
  static async isCompatible() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Biometrics check failed:', error);
      return false;
    }
  }

  /**
   * Get supported biometric types (FaceID, TouchID, etc)
   */
  static async getBiometricTypes() {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }

  /**
   * Authenticate user
   */
  static async authenticate() {
    try {
      // First check compatibility
      const isCompatible = await BiometricService.isCompatible();

      if (!isCompatible) {
        // If not compatible/enrolled, we technically can't use biometrics.
        // For this app, we might return true to bypass (if it's optional) 
        // or false to force password... but for now let's assume valid for dev envs or fallbacks.
        console.warn('Biometrics not available or not enrolled.');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o InvistaAPP',
        fallbackLabel: 'Usar Senha',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }
}

export default BiometricService;
