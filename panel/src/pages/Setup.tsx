import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { constants } from '../utils/const';

interface SetupFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

function calculateStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  return Math.min(100, score);
}

function strengthLabel(score: number) {
  if (score > 70) return { label: 'Strong password', className: 'bg-primary' };
  if (score > 40) return { label: 'Medium strength', className: 'bg-tertiary' };
  return { label: 'Weak password', className: 'bg-error' };
}

export default function Setup() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SetupFormData>({
    defaultValues: { username: '', password: '', confirmPassword: '' }
  });

  const password = watch('password') || '';
  const strength = calculateStrength(password);
  const { label, className } = strengthLabel(strength);

  const onSubmit = async (data: SetupFormData) => {
    setFormError(null);

    if (data.password !== data.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${constants.API_URL}/admin/initial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          password: data.password
        })
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => navigate('/login', { replace: true }), 1600);
        return;
      }

      if (response.status === 409) {
        // Already initialized elsewhere, just send them to login
        navigate('/login', { replace: true });
        return;
      }

      setFormError(result.error || 'Initialization failed. Please try again.');
    } catch (error) {
      setFormError('Network error. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(161, 161, 170, 0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] flex flex-col items-center relative z-10">
        <div className="w-full bg-surface-container border border-outline-variant/50 rounded-xl glow-effect p-8 md:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 mb-4 text-primary bg-primary-container/20 rounded-lg flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Initialize your panel
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Create the master account that will control this instance
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
              <p className="text-on-surface font-medium">System initialized successfully</p>
              <p className="text-on-surface-variant text-sm">Redirecting you to sign in…</p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {formError && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2 text-error">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{formError}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-on-surface-variant block">
                  Admin username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    id="username"
                    type="text"
                    placeholder="admin"
                    className={`w-full h-12 bg-surface-variant border ${errors.username ? 'border-error/50 focus:border-error focus:ring-error/20' : 'border-outline/30 focus:border-primary focus:ring-primary/20'} rounded-lg pl-11 pr-4 text-on-surface placeholder:text-on-secondary-container/50 focus:ring-2 outline-none transition-all duration-200`}
                    {...register('username', {
                      required: 'Username is required',
                      minLength: { value: 4, message: 'Minimum 4 characters' }
                    })}
                  />
                </div>
                {errors.username && <p className="text-error text-xs">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-on-surface-variant block">
                  Master password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••••"
                    className={`w-full h-12 bg-surface-variant border ${errors.password ? 'border-error/50 focus:border-error focus:ring-error/20' : 'border-outline/30 focus:border-primary focus:ring-primary/20'} rounded-lg pl-11 pr-4 text-on-surface placeholder:text-on-secondary-container/50 focus:ring-2 outline-none transition-all duration-200`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' }
                    })}
                  />
                </div>
                {errors.password && <p className="text-error text-xs">{errors.password.message}</p>}

                {password.length > 0 && (
                  <div className="pt-1">
                    <div className="w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${className}`}
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">{label}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-on-surface-variant block">
                  Confirm password
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••••"
                    className={`w-full h-12 bg-surface-variant border ${errors.confirmPassword ? 'border-error/50 focus:border-error focus:ring-error/20' : 'border-outline/30 focus:border-primary focus:ring-primary/20'} rounded-lg pl-11 pr-4 text-on-surface placeholder:text-on-secondary-container/50 focus:ring-2 outline-none transition-all duration-200`}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match'
                    })}
                  />
                </div>
                {errors.confirmPassword && <p className="text-error text-xs">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-fixed-dim active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Initializing...' : 'Initialize System'}
              </button>

              <p className="text-center text-xs text-on-surface-variant pt-1">
                One-time setup • Keep these credentials secure
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}