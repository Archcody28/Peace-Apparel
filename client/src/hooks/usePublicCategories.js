import { useEffect, useState } from 'react';

/**
 * Shared public catalog-categories data path (Phase 9).
 *
 * Single fetch of GET /api/categories (public route) shared by Products chips,
 * Home category navigation, Footer shop links, etc. via a module-level promise
 * cache so N mounted consumers issue exactly one request — same pattern as
 * usePublicSettings.
 *
 * Rules:
 * - Plain fetch, never apiFetch: this endpoint is public, so no admin token
 *   (and no auth header) is ever attached.
 * - categories === null  => still loading, OR the request failed (unavailable).
 *   `loading` distinguishes the two so callers never fake catalog data.
 * - categories === []    => the request SUCCEEDED and the table is genuinely
 *   empty. Callers must render an honest empty state, never hard-coded
 *   stand-ins, after this successful-empty response.
 * - A non-empty array    => render the live categories.
 */

const ENDPOINT = `${import.meta.env.VITE_API_URL || ''}/api/categories`;

let cachedPromise = null;

function loadPublicCategories() {
  if (!cachedPromise) {
    cachedPromise = fetch(ENDPOINT)
      .then(async (res) => {
        if (!res.ok) return null; // HTTP failure -> unavailable
        try {
          const body = await res.json();
          // A successful empty response ([]) is honored as [], not null.
          return Array.isArray(body) ? body : null;
        } catch {
          return null; // unreadable body -> unavailable
        }
      })
      .catch(() => null); // network failure -> unavailable
  }
  return cachedPromise;
}

/** Drop the cached result so the next consumer refetches (used after admin edits). */
export function resetPublicCategoriesCache() {
  cachedPromise = null;
}

export function usePublicCategories() {
  const [categories, setCategories] = useState(null); // null = loading/unavailable; [] = genuinely empty
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadPublicCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}
