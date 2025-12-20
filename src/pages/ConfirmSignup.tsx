import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validateRequired } from '@/utils/validation';
import { handleApiError, showSuccess } from '@/utils/errorHandling';

function getQueryEmail(searchParams: URLSearchParams): string {
  const email = searchParams.get('email');
  return email?.trim() || '';
}

/**
 * Confirm signup page component (Cognito email/SMS confirmation code)
 */
export function ConfirmSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmSignup, resendSignupCode } = useAuth();

  const initialEmail = useMemo(() => getQueryEmail(searchParams), [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ email?: string; code?: string }>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; code?: string } = {};

    if (!validateRequired(email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!validateRequired(code)) {
      newErrors.code = 'Confirmation code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsConfirming(true);
    try {
      await confirmSignup(email, code);
      showSuccess('Account confirmed. You can now sign in.');
      navigate(`/login?email=${encodeURIComponent(email)}`);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResend = async () => {
    const trimmedEmail = email.trim();
    const newErrors: { email?: string } = {};
    if (!validateRequired(trimmedEmail)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(trimmedEmail)) {
      newErrors.email = 'Invalid email format';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    setIsResending(true);
    try {
      await resendSignupCode(trimmedEmail);
      showSuccess('Confirmation code resent. Check your email.');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animated-bg">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            <span className="gradient-text">Confirm Account</span>
          </h1>
          <p className="text-slate-600 text-lg">
            Enter the confirmation code we sent to your email
          </p>
        </div>

        <div className="glass-effect rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleConfirm}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />

            <Input
              label="Confirmation Code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={errors.code}
              required
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isConfirming}
            >
              {isConfirming ? 'Confirming...' : 'Confirm Account'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? 'Resending...' : 'Resend code'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                Already confirmed?{' '}
                <Link to="/login" className="text-violet-600 hover:text-violet-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


