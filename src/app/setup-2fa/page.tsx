"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/services/admin.services";
import { Button } from "@/components/ui/button";

export default function Setup2FAPage() {
    const router = useRouter();

    const [qrCode, setQrCode] = useState("");
    const [manualCode, setManualCode] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 🔹 Step 1: Fetch QR
    useEffect(() => {
        const fetchQR = async () => {
            try {
                const res = await axiosInstance.post("/2fa/setup");
                console.log("QR Data:", res.data.data.qrCode, res.data.data.manualCode);
                setQrCode(res.data.data.qrCode);
                setManualCode(res.data.data.manualCode);
            } catch (err: any) {
                setError("Failed to load QR. Please login again.");
            }
        };

        fetchQR();
    }, []);

    // 🔹 Step 2: Confirm OTP
    const handleConfirm = async () => {
        if (otp.length !== 6) {
            setError("Enter a valid 6-digit code");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await axiosInstance.post("/2fa/confirm", {
                token: otp,
            });

            // ✅ Done → go to dashboard
            router.push("/dashboard");

        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 w-full max-w-md space-y-6">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Setup Two-Factor Authentication
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Scan the QR code using Google Authenticator
                    </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                    {qrCode ? (
                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                    ) : (
                        <p className="text-sm text-gray-400">Loading QR...</p>
                    )}
                </div>

                {/* Manual Code */}
                {manualCode && (
                    <div className="text-center text-xs text-gray-500">
                        Can’t scan? Use code:
                        <div className="font-mono text-gray-700 mt-1 break-all">
                            {manualCode}
                        </div>
                    </div>
                )}

                {/* OTP Input */}
                <div>
                    <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full text-black border border-gray-300 rounded-xl px-4 py-2 text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Error */}
                {error && (
                    <p className="text-xs text-red-500 text-center">⚠ {error}</p>
                )}

                {/* Button */}
                <Button
                    onClick={handleConfirm}
                    loading={loading}
                    className="w-full"
                >
                    Confirm & Continue
                </Button>
            </div>
        </div>
    );
}