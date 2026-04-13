"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, twoFASchema, type LoginSchema, type TwoFASchema } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Shield, Star, Eye, EyeOff } from "lucide-react";
import axiosInstance from "@/services/admin.services";
import Image from "next/image";

// Mock admin credentials
const MOCK_ADMIN = {
  id: "admin-1",
  email: "admin@vediccosmos.com",
  password: "Admin@1234",
  name: "Cosmic Admin",
  role: "admin" as const,
  twoFactorEnabled: true,
  createdAt: new Date().toISOString(),
};
const MOCK_2FA_CODE = "123456";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginSchema>({ resolver: zodResolver(loginSchema) });

  // const onCredentials = async (data: LoginSchema) => {
  //   try {
  //     const res = await axiosInstance.post("/login", data);
  //     const response = res.data;

  //     if (response.data?.requiresTwoFactor) {
  //       setTempToken(response.data.tempToken);
  //       setStep("2fa");
  //     } else {
  //       login(response.data.admin);
  //       router.push("/dashboard");
  //     }

  //   } catch (err: any) {
  //     setOtp(["", "", "", "", "", ""]);
  //     setError("email", {
  //       message: err.response?.data?.message || "Login failed",
  //     });
  //   }
  // };


  const onCredentials = async (data: LoginSchema) => {
    try {
      const res = await axiosInstance.post("/login", data);
      const response = res.data;

      console.log("Login response:", response);

      // 🆕 NEW ADMIN → setup 2FA
      if (response.data?.requiresTwoFactorSetup) {
        router.push("/setup-2fa");
        return;
      }

      // 🔐 EXISTING ADMIN → verify 2FA
      if (response.data?.requiresTwoFactor) {

        console.log("2FA required. Temp token:", response.data);
        // setTempToken(response.data.tempToken);
        setStep("2fa");
        return;
      }

      // ✅ Normal login (rare case)
      login(response.data.admin);
      // router.push("/dashboard");

    } catch (err: any) {
      setError("email", {
        message: err.response?.data?.message || "Login failed",
      });
    }
  };


  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setOtpError("");
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify2FA = async () => {
    const code = otp.join("");

    if (code.length < 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    try {
      setOtpLoading(true);

      const res = await axiosInstance.post("/2fa/verify", {
        tempToken, // ✅ use state
        token: code,
      });

      login(res.data.data.admin);
      router.push("/dashboard");

    } catch (err: any) {
      setOtp(["", "", "", "", "", ""]);
      setOtpError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setOtp(["", "", "", "", "", ""]);
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen starfield-bg flex items-center justify-center p-4 relative overflow-hidden">
    <Image
      src="/assets/compress2.png"
      alt="logo"
      className="bg-login-top"
      width={170}
      height={60}
    />
    <Image
      src="/assets/compress2.png"
      alt="logo"
      className="bg-login-bottom"
      width={170}
      height={60}
    />
      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Glow behind card */}
        <div className="absolute inset-0 blur-3xl" />
        <div className="login-card p-8">

          {/* Brand header */}
          <div className="text-center mb-8">

            <div className="logo-section flex items-center justify-center mb-4">
              <Image
                src="/assets/astro-logo-1.png"
                alt="logo"
                className="logo-navbar"
                width={170}
                height={60}
              />
            </div>
            {/* <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cosmos-500 via-cosmos-600 to-gold-500 flex items-center justify-center mx-auto mb-4 shadow-cosmos">
              <Star size={28} className="text-white" fill="white" />
            </div> */}
            {/* <h1 className="text-3xl font-display font-bold text-white">Vedic Remedies</h1> */}
            <p className="text-sm text-black/40 font-body mt-1 tracking-wide">Admin Portal</p>
          </div>

          {/* ── STEP 1: Credentials ── */}
          {step === "credentials" && (
            <form onSubmit={handleSubmit(onCredentials)} className="">
              <div className="text-center mb-6">
                <h2 className="text-xl font-display font-semibold text-black">Sign In</h2>
                {/* <p className="text-xs text-black/40 mt-1">Use admin@vediccosmos.com / Admin@1234</p> */}
              </div>
              {/* <label className="block text-sm font-medium text-black">Email Address</label> */}
              <input
                // label="Email Address"
                type="email"
                className="login-input"
                placeholder="admin@vediccosmos.com"
                // icon={<Mail size={15} />}
                // error={errors.email?.message}
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-ember-400">⚠ {errors.email.message}</p>}

              <div className="space-y-1.5">
                {/* <label className="block text-sm font-medium text-black">Password</label> */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmos-400">
                    {/* <Lock size={15} /> */}
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="login-input"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black/70 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-ember-400">⚠ {errors.password.message}</p>}
              </div>

              <Button type="submit" loading={isSubmitting} className="w-full mt-5 admin-btn admin-btn--google" size="lg">
                Continue to 2FA
              </Button>
            </form>
          )}

          {/* ── STEP 2: 2FA ── */}
          {step === "2fa" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-display font-semibold text-black/90">Two-Factor Auth</h2>
                <p className="text-sm text-black/40 mt-1">
                  Enter the 6-digit code from your authenticator
                </p>
                {/* <p className="text-xs text-[#E97E11]/70 mt-1">Demo code: <span className="font-mono font-bold text-[#E97E11]">123456</span></p> */}
              </div>

              {/* OTP inputs */}
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="otp-input"
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-xs text-ember-400 text-center">⚠ {otpError}</p>
              )}

              <Button
                onClick={handleVerify2FA}
                loading={otpLoading}
                className="w-full mt-6 admin-btn admin-btn--google"
                size="lg"
              >
                <Shield size={15} />
                Verify & Enter
              </Button>

              <button
                onClick={() => { setStep("credentials"); setOtp(["", "", "", "", "", ""]); }}
                className="w-full text-sm text-black/40 hover:text-black/70 transition-colors"
              >
                ← Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
