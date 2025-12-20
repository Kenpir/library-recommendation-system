/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  confirmSignUp,
  resendSignUpCode,
} from 'aws-amplify/auth';
import { User } from '@/types';

/**
 * Authentication context type definition
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  confirmSignup: (email: string, confirmationCode: string) => Promise<void>;
  resendSignupCode: (email: string) => Promise<void>;
}

/**
 * Authentication context
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * ============================================================================
 * AUTHENTICATION CONTEXT - AWS COGNITO INTEGRATION
 * ============================================================================
 *
 * ⚠️ IMPORTANT: This file currently uses MOCK authentication with localStorage.
 *
 * TO IMPLEMENT AWS COGNITO:
 * Follow Week 3 in IMPLEMENTATION_GUIDE.md
 *
 * ============================================================================
 * IMPLEMENTATION CHECKLIST:
 * ============================================================================
 *
 * [ ] Week 3, Day 1-2: Create Cognito User Pool in AWS Console
 * [ ] Week 3, Day 1-2: Note User Pool ID and App Client ID
 * [ ] Week 3, Day 1-2: Update .env file with Cognito credentials
 * [ ] Week 3, Day 3-4: Install AWS Amplify: npm install aws-amplify
 * [ ] Week 3, Day 3-4: Configure Amplify in src/main.tsx (see below)
 * [ ] Week 3, Day 3-4: Import Cognito functions at top of this file
 * [ ] Week 3, Day 3-4: Replace login() function with Cognito signIn
 * [ ] Week 3, Day 3-4: Replace logout() function with Cognito signOut
 * [ ] Week 3, Day 3-4: Replace signup() function with Cognito signUp
 * [ ] Week 3, Day 3-4: Update useEffect to check Cognito session
 * [ ] Week 3, Day 3-4: Remove localStorage mock code
 * [ ] Week 3, Day 3-4: Test registration and login flow
 *
 * ============================================================================
 * STEP 1: Configure Amplify in src/main.tsx
 * ============================================================================
 *
 * Add this code BEFORE ReactDOM.createRoot():
 *
 * import { Amplify } from 'aws-amplify';
 *
 * Amplify.configure({
 *   Auth: {
 *     Cognito: {
 *       userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
 *       userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
 *     }
 *   }
 * });
 *
 * ============================================================================
 * STEP 2: Import Cognito functions at top of this file
 * ============================================================================
 *
 * import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';
 *
 * ============================================================================
 * STEP 3: Replace mock functions below with Cognito implementations
 * ============================================================================
 *
 * See detailed code in IMPLEMENTATION_GUIDE.md - Week 3, Day 3-4
 *
 * Documentation: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/
 *
 * ============================================================================
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Initialize user state from localStorage using function initializer (runs once on mount)
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with Cognito session check in Week 3, Day 3-4
    //
    // Implementation:
    // const checkAuth = async () => {
    //   try {
    //     const user = await getCurrentUser();
    //     setUser({
    //       id: user.userId,
    //       email: user.signInDetails?.loginId || '',
    //       name: user.username,
    //       role: 'user',
    //       createdAt: new Date().toISOString()
    //     });
    //   } catch {
    //     setUser(null);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // checkAuth();

    // MOCK: For development, user is already initialized from localStorage above
    // Defer setIsLoading to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        const user = await getCurrentUser();
        setUser({
          id: user.userId,
          email: email,
          name: user.username,
          role: 'user',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
        },
      });
      const needsConfirmation = result.nextStep.signUpStep === 'CONFIRM_SIGN_UP';
      return { needsConfirmation };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const confirmSignup = async (email: string, confirmationCode: string) => {
    try {
      await confirmSignUp({ username: email, confirmationCode });
    } catch (error) {
      console.error('Confirm signup error:', error);
      throw error;
    }
  };

  const resendSignupCode = async (email: string) => {
    try {
      await resendSignUpCode({ username: email });
    } catch (error) {
      console.error('Resend signup code error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    confirmSignup,
    resendSignupCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
