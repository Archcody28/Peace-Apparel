import { useEffect, useState } from 'react';

/**
 * Shared public storefront-settings data path (Phase 8).
 *
 * Single fetch of GET /api/settings/public shared by Footer, Contact,
 * MobileNav, CheckoutModal, etc. via a module-level promise cache so N
 * mounted consumers issue exactly one request.
 *
 * Rules:
 * - Plain fetch, never apiFetch: this endpoint is public, so no admin
 *   token (and no auth header) is ever attached.
 * - Failure => settings stays null. Callers render their existing static
 *   markup as the loading/unavailable state; NO fake store values are
 *   introduced as a "successful" fallback.
 * - Loading state is exposed so callers can avoid layout shift if needed.
 */

const ENDPOINT = `${import.meta.env.VITE_API_URL || ''}/api/settings/public`;

let cachedPromise = null;

function loadPublicSettings() {
  if (!cachedPromise) {
    cachedPromise = fetch(ENDPOINT)
      .then(async (res) => {
        if (!res.ok) return null;
        try {
          const body = await res.json();
          return body && typeof body === 'object' ? body : null;
        } catch {
          return null;
        }
      })
      .catch(() => null);
  }
  return cachedPromise;
}

export function resetPublicSettingsCache() {
  cachedPromise = null;
}

export function usePublicSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadPublicSettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}

/** Strip everything but digits and a leading + so tel:/wa.me links stay valid. */
export function digitsOf(value) {
  return String(value || '').replace(/\D/g, '');
}

export function telHref(phone) {
  const digits = digitsOf(phone);
  return digits ? `tel:+${digits}` : undefined;
}

export function mailtoHref(email) {
  return email ? `mailto:${email}` : undefined;
}

export function whatsappUrl(number, text) {
  const digits = digitsOf(number);
  if (!digits) return undefined;
  const suffix = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${suffix}`;
}
