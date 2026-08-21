"use client";

// =============================================================================
// ErrorBoundary — Valence Payment Platform
//
// Production-grade UI containment: a crash inside a payment module (onramp
// iframe, Solana Pay drawer, NFC POS) must never take down the whole console.
// =============================================================================

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[Valence] ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6 text-center">
          <p className="text-sm font-semibold text-red-300">
            {this.props.fallbackTitle ?? "Something went wrong."}
          </p>
          {this.state.message && (
            <p className="mt-1 text-xs text-red-400/70">{this.state.message}</p>
          )}
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: null })}
            className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
