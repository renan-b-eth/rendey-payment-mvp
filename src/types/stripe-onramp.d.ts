// =============================================================================
// Stripe Crypto Onramp SDK — Global Type Declarations
//
// The official SDK is loaded at runtime from Stripe's CDN
// (https://js.stripe.com/v3/crypto-onramp.js) and exposes the global factory
// `window.StripeOnramp`. There is intentionally NO npm dependency, so builds
// never depend on registry availability for this SDK.
// =============================================================================

type StripeOnrampSessionStatus =
  | "initialized"
  | "rejected"
  | "requires_payment"
  | "fulfillment_processing"
  | "fulfillment_complete";

interface StripeOnrampSessionUpdatedEvent {
  payload: {
    session: {
      id: string;
      status: StripeOnrampSessionStatus;
      [key: string]: unknown;
    };
  };
}

interface StripeOnrampAppearance {
  theme?: "dark" | "light";
}

interface StripeOnrampSession {
  mount(element: HTMLElement | string): void;
  addEventListener(type: "onramp_ui_loaded", listener: () => void): void;
  addEventListener(
    type: "onramp_session_updated",
    listener: (event: StripeOnrampSessionUpdatedEvent) => void
  ): void;
  addEventListener(type: string, listener: (event: unknown) => void): void;
  removeEventListener(type: string, listener: (event: unknown) => void): void;
}

interface StripeOnrampClient {
  createSession(options: {
    clientSecret: string;
    appearance?: StripeOnrampAppearance;
  }): StripeOnrampSession;
}

type StripeOnrampFactory = (publishableKey: string) => StripeOnrampClient;

interface Window {
  StripeOnramp?: StripeOnrampFactory;
}
