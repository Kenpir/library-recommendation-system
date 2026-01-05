/**
 * Error handling utilities
 */

import { emitToast } from '@/utils/toast';

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

export function showSuccess(message: string): void {
  emitToast({ variant: 'success', title: 'Success', message });
  console.log('Success:', message);
}

export function showWarning(message: string): void {
  emitToast({ variant: 'warning', title: 'Warning', message });
  console.warn('Warning:', message);
}
