/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getAdminEmailAllowlist = (): Set<string> => {
    const raw = (import.meta.env.VITE_ADMIN_EMAILS || '').trim();
    if (!raw) return new Set();
    return new Set(
      raw
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
        .filter(Boolean)
    );
  };

  const getRole = async (email?: string): Promise<User['role']> => {
    // 1) Prefer Cognito group claims (recommended for real deployments)
    try {
      const session = await fetchAuthSession();
      const accessPayload = session.tokens?.accessToken?.payload as unknown as
        | Record<string, unknown>
        | undefined;
      const idPayload = session.tokens?.idToken?.payload as unknown as
        | Record<string, unknown>
        | undefined;

      const groupsRaw = (accessPayload?.['cognito:groups'] ??
        idPayload?.['cognito:groups']) as unknown;
      const groups = Array.isArray(groupsRaw)
        ? groupsRaw
        : typeof groupsRaw === 'string'
          ? [groupsRaw]
          : [];

      if (groups.includes('admin')) return 'admin';
    } catch {
      // If session isn't available yet, fall through to allowlist/user.
    }

    // 2) Dev fallback: allowlist specific emails via Vite env var
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (normalizedEmail) {
      const allowlist = getAdminEmailAllowlist();
      if (allowlist.has(normalizedEmail)) return 'admin';
    }

    return 'user';
  };

  const getUserProfile = async (
    fallbackUsername?: string,
    fallbackEmail?: string
  ): Promise<{ name: string; email: string }> => {
    try {
      const attrs = await fetchUserAttributes();
      const email = (attrs.email || fallbackEmail || '').trim();
      const name = (attrs.name || '').trim();
      if (name) return { name, email };

      // Optional if enabled in the user pool, but harmless to try.
      const given = (attrs.given_name || '').trim();
      const family = (attrs.family_name || '').trim();
      const fullFromParts = [given, family].filter(Boolean).join(' ').trim();
      return { name: fullFromParts || (fallbackUsername || '').trim(), email };
    } catch {
      return {
        name: (fallbackUsername || '').trim(),
        email: (fallbackEmail || '').trim(),
      };
    }
  };

  useEffect(() => {
    // Ensure we only trust the real Cognito session (not stale localStorage mocks).
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const cognitoUser = await getCurrentUser();
        if (cancelled) return;
        const fallbackEmail = cognitoUser.signInDetails?.loginId || '';
        const profile = await getUserProfile(cognitoUser.username, fallbackEmail);
        const role = await getRole(profile.email);
        setUser({
          id: cognitoUser.userId,
          email: profile.email,
          name: profile.name,
          role,
          createdAt: new Date().toISOString(),
        });
        console.log('Cognito user:', JSON.stringify(cognitoUser, null, 2));
      } catch {
        if (cancelled) return;
        setUser(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
    // Intentionally run once on mount; role/email resolution happens during auth check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        const cognitoUser = await getCurrentUser();
        const profile = await getUserProfile(cognitoUser.username, email);
        const role = await getRole(profile.email);
        setUser({
          id: cognitoUser.userId,
          email: profile.email || email,
          name: profile.name,
          role,
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
      localStorage.removeItem('user');
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
