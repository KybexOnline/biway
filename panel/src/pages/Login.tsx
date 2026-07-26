import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Label } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { TfaCodeInput } from '../components/settings/TfaInput';
import { constants } from '../utils/const';
type LoginPhase =
  | { status: 'credentials' }
  | { status: '2fa'; pendingToken: string };

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<LoginPhase>({ status: 'credentials' });
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | undefined>(undefined);
  const [isVerifying, setIsVerifying] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      username: '',
      password: ''
    }
  });

  // Check whether the system still needs initial setup before showing the login form
  useEffect(() => {
    let cancelled = false;

    const checkSystemStatus = async () => {
      try {
        const response = await fetch(`${constants.API_URL}/status`);
        if (response.ok) {
          const data = await response.json();
          if (!cancelled && data.needs_setup) {
            navigate('/setup', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('Failed to check system status:', error);
      } finally {
        if (!cancelled) setCheckingStatus(false);
      }
    };

    checkSystemStatus();
    return () => { cancelled = true; };
  }, [navigate]);

  const onSubmit = async (data: any) => {
    setLoginError(null);
    const result = await login(data.username, data.password);

    if (result.success) {
      navigate(result.redirectTo || '/');
      return;
    }

    if (result.twoFaRequired && result.pendingToken) {
      setPhase({ status: '2fa', pendingToken: result.pendingToken });
      return;
    }

    setLoginError(result.error || 'An unexpected error occurred');
  };

  const onVerifyOtp = async () => {
    if (phase.status !== '2fa') return;
    setOtpError(undefined);
    setIsVerifying(true);
    try {
      const result = await verifyTwoFactor(phase.pendingToken, otpCode);
      if (result.success) {
        navigate(result.redirectTo || '/');
      } else {
        setOtpError(result.error || 'Invalid or expired code');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const backToCredentials = () => {
    setPhase({ status: 'credentials' });
    setOtpCode('');
    setOtpError(undefined);
    setLoginError(null);
  };

  // Avoid flashing the login form while we're still checking setup status
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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
              {phase.status === '2fa'
                ? <ShieldCheck className="w-6 h-6" />
                : <img alt="biway-logo" src="/assets/images/logo.svg" />}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              {phase.status === '2fa' ? 'Two-step verification' : 'Welcome back'}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {phase.status === '2fa'
                ? 'Enter the 6-digit code from your authenticator app'
                : 'Sign in to your admin console'}
            </p>
          </div>

          {phase.status === 'credentials' && (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {loginError && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2 text-error">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{loginError}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-on-surface-variant block">Username</label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    placeholder="admin"
                    className={`w-full h-12 bg-surface-variant border ${errors.username ? 'border-error/50 focus:border-error focus:ring-error/20' : 'border-outline/30 focus:border-primary focus:ring-primary/20'} rounded-lg px-4 text-on-surface placeholder:text-on-secondary-container/50 focus:ring-2 outline-none transition-all duration-200`}
                    {...register("username", {
                      required: "Username is required",
                      pattern: {
                        value: /\S+/,
                        message: "Invalid username"
                      }
                    })}
                  />
                </div>
                {errors.username && <p className="text-error text-xs">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium text-on-surface-variant block">Password</label>
                  <Link to="#" className="text-xs font-medium text-primary hover:text-primary-fixed-dim transition-colors">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full h-12 bg-surface-variant border ${errors.password ? 'border-error/50 focus:border-error focus:ring-error/20' : 'border-outline/30 focus:border-primary focus:ring-primary/20'} rounded-lg px-4 pr-12 text-on-surface placeholder:text-on-secondary-container/50 focus:ring-2 outline-none transition-all duration-200`}
                    {...register("password", { required: "Password is required" })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-error text-xs">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-fixed-dim active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {phase.status === '2fa' && (
            <div className="space-y-6">
              <div className="space-y-3 flex flex-col items-center">
                <Label className="text-sm font-medium">Verification code</Label>
                <TfaCodeInput
                  errorMsg={otpError}
                  isInvalid={!!otpError}
                  onChange={setOtpCode}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={backToCredentials}
                  className="flex-1 h-12 rounded-lg border border-outline/30 text-on-surface-variant hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={otpCode.length !== 6 || isVerifying}
                  onClick={onVerifyOtp}
                  className="flex-1 h-12 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-fixed-dim active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}