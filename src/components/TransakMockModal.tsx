"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Clock, CheckCircle2, Loader2, Copy, ArrowRight } from "lucide-react";

// =============================================================================
// TransakMockModal — High-Fidelity PIX Onramp Simulation
//
// Steps:
//   1. User enters BRL amount → shows estimated USDC output
//   2. Render simulated PIX QR Code + "Copia e Cola" key with countdown timer
//   3. "Simulate PIX Payment" → loading → success
//   4. Pass transaction back to parent to update dashboard balance
// =============================================================================

const BRL_TO_USDC_RATE = 5.72; // Simulated exchange rate (BRL → USDC)
const PIX_TIMER_SECONDS = 300; // 5-minute countdown

interface TransakMockModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called on successful mock payment with the USDC amount credited */
  onSuccess: (usdcAmount: number) => void;
  /** The Solana wallet address to "receive" the funds */
  walletAddress: string;
}

type ModalStep = "amount" | "pix" | "processing" | "success";

export default function TransakMockModal({
  isOpen,
  onClose,
  onSuccess,
  walletAddress,
}: TransakMockModalProps) {
  const [step, setStep] = useState<ModalStep>("amount");
  const [brlAmount, setBrlAmount] = useState<string>("100");
  const [pixTimer, setPixTimer] = useState(PIX_TIMER_SECONDS);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated PIX "Copia e Cola" key
  const pixCopyPasteKey =
    "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef12345678905204000053039865405100.005802BR5925RENDEY PAGAMENTOS LTDA6009SAO PAULO62070503***6304";

  const parsedBrl = parseFloat(brlAmount) || 0;
  const estimatedUsdc = parsedBrl / BRL_TO_USDC_RATE;

  // ---- Timer countdown -----------------------------------------------------
  useEffect(() => {
    if (step === "pix") {
      setPixTimer(PIX_TIMER_SECONDS);
      timerRef.current = setInterval(() => {
        setPixTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  // ---- Reset on close ------------------------------------------------------
  useEffect(() => {
    if (!isOpen) {
      setStep("amount");
      setBrlAmount("100");
      setCopied(false);
    }
  }, [isOpen]);

  // ---- Copy PIX key --------------------------------------------------------
  const handleCopyPix = useCallback(() => {
    navigator.clipboard.writeText(pixCopyPasteKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // ---- Proceed to PIX QR ---------------------------------------------------
  const handleProceedToPix = useCallback(() => {
    if (parsedBrl <= 0) {
      alert("Please enter a valid BRL amount.");
      return;
    }
    setStep("pix");
  }, [parsedBrl]);

  // ---- Simulate PIX payment ------------------------------------------------
  const handleSimulatePayment = useCallback(() => {
    setStep("processing");
    // Simulate network delay (2-3 seconds)
    setTimeout(() => {
      setStep("success");
      // Notify parent after a brief pause so user sees the success state
      setTimeout(() => {
        onSuccess(estimatedUsdc);
      }, 1500);
    }, 2500);
  }, [estimatedUsdc, onSuccess]);

  // ---- Format timer --------------------------------------------------------
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 text-sm font-bold">T</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Transak</h3>
              <p className="text-[10px] text-gray-500">BRL → USDC via PIX</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* ---- Step 1: Amount Input ---- */}
          {step === "amount" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Enter amount in BRL
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    value={brlAmount}
                    onChange={(e) => setBrlAmount(e.target.value)}
                    min="10"
                    step="10"
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Estimated output */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-xs text-emerald-400 mb-1">
                  Estimated USDC you'll receive
                </p>
                <p className="text-2xl font-bold text-emerald-300">
                  {estimatedUsdc > 0 ? `≈ $${estimatedUsdc.toFixed(2)}` : "—"}
                  <span className="text-sm font-normal text-emerald-400/60 ml-1">
                    USDC
                  </span>
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Rate: 1 USD = R$ {BRL_TO_USDC_RATE.toFixed(2)} · Fees included
                </p>
              </div>

              <button
                onClick={handleProceedToPix}
                disabled={parsedBrl <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ---- Step 2: PIX QR Code + Timer ---- */}
          {step === "pix" && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-gray-300 mb-1">
                  Pay <span className="text-white font-semibold">R$ {parsedBrl.toFixed(2)}</span> via PIX
                </p>
                <div className="flex items-center justify-center gap-1 text-gray-500">
                  <Clock size={12} />
                  <span className="text-xs font-mono">
                    Expires in {formatTimer(pixTimer)}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white rounded-xl p-3">
                  <QRCodeSVG
                    value={`pix:${pixCopyPasteKey}?amount=${parsedBrl}`}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                </div>
              </div>

              {/* Copia e Cola */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1">
                  Or copy the PIX key below:
                </p>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-3">
                  <code className="text-[10px] text-gray-400 break-all flex-1 font-mono leading-relaxed">
                    {pixCopyPasteKey.slice(0, 40)}...
                  </code>
                  <button
                    onClick={handleCopyPix}
                    className="text-gray-400 hover:text-white transition-colors shrink-0"
                    title="Copy PIX key"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {copied && (
                  <p className="text-[10px] text-emerald-400 mt-1">
                    ✓ Copied to clipboard!
                  </p>
                )}
              </div>

              {/* Simulate button */}
              <button
                onClick={handleSimulatePayment}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Simulate PIX Payment
              </button>
            </div>
          )}

          {/* ---- Step 3: Processing ---- */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="animate-spin text-blue-400" size={48} />
              <p className="text-lg font-semibold text-white">
                Processing PIX...
              </p>
              <p className="text-sm text-gray-400">
                Waiting for blockchain confirmation
              </p>
            </div>
          )}

          {/* ---- Step 4: Success ---- */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <CheckCircle2 className="text-emerald-400" size={48} />
              <p className="text-lg font-semibold text-white">
                Crypto sent to your Solana Wallet!
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
                <p className="text-sm text-emerald-300">
                  +{estimatedUsdc.toFixed(2)} USDC
                </p>
              </div>
              <p className="text-xs text-gray-500 text-center font-mono break-all max-w-[250px]">
                → {walletAddress}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
