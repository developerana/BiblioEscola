import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const hapticPatterns: Record<HapticType, number[]> = {
  light: [10],
  medium: [25],
  heavy: [50],
  selection: [5],
  success: [10, 50, 10],
  warning: [30, 50, 30],
  error: [50, 100, 50],
};

export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    // Check if vibration API is supported
    if ('vibrate' in navigator) {
      const pattern = hapticPatterns[type];
      navigator.vibrate(pattern);
    }
  }, []);

  const hapticClick = useCallback(() => {
    triggerHaptic('light');
  }, [triggerHaptic]);

  const hapticSelection = useCallback(() => {
    triggerHaptic('selection');
  }, [triggerHaptic]);

  const hapticSuccess = useCallback(() => {
    triggerHaptic('success');
  }, [triggerHaptic]);

  const hapticWarning = useCallback(() => {
    triggerHaptic('warning');
  }, [triggerHaptic]);

  const hapticError = useCallback(() => {
    triggerHaptic('error');
  }, [triggerHaptic]);

  return {
    triggerHaptic,
    hapticClick,
    hapticSelection,
    hapticSuccess,
    hapticWarning,
    hapticError,
  };
}
