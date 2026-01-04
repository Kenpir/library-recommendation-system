/**
 * Error handling utilities
 */

import { emitToast } from '@/utils/toast';

/**
 * Handles API errors and displays user-friendly messages
 *
 * TODO: Integrate with a proper toast notification library
 * Recommended: react-hot-toast or react-toastify
 *
 * Installation: npm install react-hot-toast
 * Usage: import toast from 'react-hot-toast';
 *        toast.error(message);
 */
export function handleApiError(error: unknown): void {
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  emitToast({ variant: 'error', title: 'Error', message });
  console.error('API Error:', error);
}

/**
 * Shows a success message to the user
 *
 * TODO: Replace with toast.success(message)
 */
export function showSuccess(message: string): void {
  emitToast({ variant: 'success', title: 'Success', message });
  console.log('Success:', message);
}

/**
 * Shows a warning message to the user
 */
export function showWarning(message: string): void {
  emitToast({ variant: 'warning', title: 'Warning', message });
  console.warn('Warning:', message);
}
