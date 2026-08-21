// =============================================================================
// Stripe Crypto Onramp SDK — Type Declarations
//
// The official SDK is loaded at runtime from Stripe's CDN
// (https://js.stripe.com/v3/crypto-onramp.js) and exposes the global factory
// `window.StripeOnramp`. There is intentionally NO npm dependency, so builds
// never depend on registry availability for this SDK.
//
// This file is a MODULE (it has exports) so the TypeScript compiler always
// picks it up regardless of tsconfig `include` patterns. The `Window`
// augmentation is applied via `declare global`.
// =============================================================================

export type StripeOnrampSessionStatus =
  | "initialized"
  | "rejected"
  | "requires_payment"
  | "fulfillment_processing"
  | "fulfillment_complete";

export interface StripeOnrampSessionUpdatedEvent {
  payload: {
    session: {
      id: string;
      status: StripeOnrampSessionStatus;
      [key: string]: unknown;
    };
  };
}

export interface StripeOnrampAppearance {
  theme?: "dark" | "light";
}

export interface StripeOnrampSession {
  mount(element: HTMLElement | string): void;
  addEventListener(type: "onramp_ui_loaded", listener: () => void): void;
  addEventListener(
    type: "onramp_session_updated",
    listener: (event: StripeOnrampSessionUpdatedEvent) => void
  ): void;
  addEventListener(type: string, listener: (event: unknown) => void): void;
  removeEventListener(type: string, listener: (event: unknown) => void): void;
}

export interface StripeOnrampClient {
  createSession(options: {
    clientSecret: string;
    appearance?: StripeOnrampAppearance;
  }): StripeOnrampSession;
}

export type StripeOnrampFactory = (publishableKey: string) => StripeOnrampClient;

declare global {
  interface Window {
    StripeOnramp?: StripeOnrampFactory;
  }
}
