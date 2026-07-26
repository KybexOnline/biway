import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import QRCode from "react-qr-code";
import * as z from "zod";
import { CheckCircle2, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { Alert, Button, Input, Label, TextField } from "@heroui/react";
import { createDataProvider } from "../api/dataProvider";
import { TfaCodeInput } from "../components/settings/TfaInput";

// ---------- Password form ----------

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

// ---------- 2FA state ----------

interface TfaEnrollInfo {
  secret: string;
  url: string;
}

// A single source of truth for where the user is in the 2FA flow,
// instead of juggling several booleans that could disagree with each other.
type TwoFaPhase =
  | { status: "checking" }
  | { status: "disabled" }
  | { status: "setting-up"; info: TfaEnrollInfo }
  | { status: "enabled" };

const adminProvider = createDataProvider("admin");

export default function SecurityPage() {
  // ----- Password change -----
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "danger" | null;
    message: string;
  }>({ type: null, message: "" });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPasswordForm,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmitPassword = async (data: PasswordFormValues) => {
    setPasswordStatus({ type: null, message: "" });
    try {
      const resp = await adminProvider.customPost("change-password", {
        current_password: data.currentPassword,
        password: data.newPassword,
      });
      if (resp.success) {
        setPasswordStatus({ type: "success", message: "Password successfully updated." });
        resetPasswordForm();
      } else {
        setPasswordStatus({
          type: "danger",
          message: "Failed to update password. Please check your current password.",
        });
      }
    } catch {
      setPasswordStatus({
        type: "danger",
        message: "Failed to update password. Please check your current password.",
      });
    }
  };

  // ----- Two-factor authentication -----
  const [twoFaPhase, setTwoFaPhase] = useState<TwoFaPhase>({ status: "checking" });
  const [twoFactorStatus, setTwoFactorStatus] = useState<{
    type: "success" | "danger" | null;
    message: string;
  }>({ type: null, message: "" });

  // Enrollment-only state: only relevant while status === "setting-up"
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>(undefined);
  const [isStartingSetup, setIsStartingSetup] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check2faStatus = async () => {
      try {
        const resp = await adminProvider.customGet("2fa/status");
        if (!cancelled) {
          setTwoFaPhase({ status: resp?.data?.tfa ? "enabled" : "disabled" });
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setTwoFaPhase({ status: "disabled" });
      }
    };
    check2faStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const startEnabling2FA = async () => {
    setTwoFactorStatus({ type: null, message: "" });
    setIsStartingSetup(true);
    try {
      const resp = await adminProvider.customGet("2fa/enable");
      setTwoFaPhase({ status: "setting-up", info: resp.data });
      setOtpCode("");
      setOtpError(undefined);
    } catch {
      setTwoFactorStatus({
        type: "danger",
        message: "Couldn't start 2FA setup. Please try again.",
      });
    } finally {
      setIsStartingSetup(false);
    }
  };

  const cancelEnabling2FA = () => {
    setTwoFaPhase({ status: "disabled" });
    setTwoFactorStatus({ type: null, message: "" });
    setOtpCode("");
    setOtpError(undefined);
  };

  const verifyEnabling2FA = async () => {
    setOtpError(undefined);
    setIsVerifying(true);
    try {
      const resp = await adminProvider.customPost("2fa/verify", { code: otpCode });
      if (resp.success) {
        setTwoFaPhase({ status: "enabled" });
        setTwoFactorStatus({
          type: "success",
          message: "Two-factor authentication enabled successfully.",
        });
        setOtpCode("");
      } else {
        setOtpError(resp.errorMessage || "Invalid verification code. Please try again.");
      }
    } catch {
      setOtpError("Failed to verify code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    setTwoFactorStatus({ type: null, message: "" });
    setIsDisabling(true);
    try {
      const resp = await adminProvider.customPost("2fa/disable", {});
      if (resp.success) {
        setTwoFaPhase({ status: "disabled" });
        setTwoFactorStatus({
          type: "success",
          message: "Two-factor authentication has been disabled.",
        });
      } else {
        setTwoFactorStatus({ type: "danger", message: "Failed to disable 2FA." });
      }
    } catch {
      setTwoFactorStatus({ type: "danger", message: "Failed to disable 2FA." });
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-8 min-h-screen text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          Security Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Manage your password and secure your account with two-factor authentication.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Change Password Card */}
        <div className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>

          {passwordStatus.type && (
            <Alert status={passwordStatus.type} className="mb-6">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{passwordStatus.message}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-5">
            <TextField isInvalid={!!passwordErrors.currentPassword}>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                {...registerPassword("currentPassword")}
              />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-red-500">{passwordErrors.currentPassword.message}</p>
              )}
            </TextField>

            <TextField isInvalid={!!passwordErrors.newPassword}>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                {...registerPassword("newPassword")}
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Must be at least 8 characters long, containing uppercase, lowercase, and numbers.
              </p>
            </TextField>

            <TextField isInvalid={!!passwordErrors.confirmPassword}>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                {...registerPassword("confirmPassword")}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
              )}
            </TextField>

            <Button type="submit" variant="primary" className="w-full mt-4" isPending={isSubmittingPassword}>
              Update Password
            </Button>
          </form>
        </div>

        {/* Two-Factor Authentication Card */}
        <div className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold">Two-Step Verification</h2>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                twoFaPhase.status === "enabled"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {twoFaPhase.status === "checking"
                ? "Checking…"
                : twoFaPhase.status === "enabled"
                ? "Enabled"
                : "Disabled"}
            </div>
          </div>

          {twoFactorStatus.type && (
            <Alert status={twoFactorStatus.type} className="mb-6">
              {twoFactorStatus.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <Alert.Indicator />
              )}
              <span>{twoFactorStatus.message}</span>
            </Alert>
          )}

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Add an extra layer of security to your account. When enabled, you'll be prompted to
            enter a code from your authenticator app every time you log in.
          </p>

          {twoFaPhase.status === "checking" && (
            <div className="h-10 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
          )}

          {twoFaPhase.status === "disabled" && (
            <Button variant="primary" className="w-full" isPending={isStartingSetup} onClick={startEnabling2FA}>
              Set up Authenticator App
            </Button>
          )}

          {twoFaPhase.status === "setting-up" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
                <p className="text-sm font-medium">1. Scan this QR Code with your app</p>
                <div className="w-40 h-40 bg-white p-2 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <QRCode value={twoFaPhase.info.url || ""} size={256} bgColor="#ffffff" fgColor="#000000" level="H" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 break-all px-4">
                  Or enter code manually:
                  <br />
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {twoFaPhase.info.secret}
                  </span>
                </p>
              </div>

              <div className="space-y-3 flex flex-col items-center">
                <Label className="text-sm font-medium">2. Enter the 6-digit code from your app</Label>
                <TfaCodeInput errorMsg={otpError} isInvalid={!!otpError} onChange={setOtpCode} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" className="flex-1" onClick={cancelEnabling2FA}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  isPending={isVerifying}
                  isDisabled={otpCode.length !== 6}
                  onClick={verifyEnabling2FA}
                >
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}

          {twoFaPhase.status === "enabled" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                    Your account is highly secure
                  </h3>
                  <p className="text-xs text-green-700/80 dark:text-green-500/80 mt-1">
                    Two-factor authentication is currently enforcing an extra step during sign-in.
                  </p>
                </div>
              </div>

              <Button variant="danger" className="w-full" isPending={isDisabling} onClick={handleDisable2FA}>
                Disable 2FA
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}