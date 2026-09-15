import type { Order } from "@/types/dispatch";
import { fetchOrdersFromSheet } from "@/services/sheetsService";

const CACHE_TTL_MS = 12_000;
const RETRY_DELAYS_MS = [5_000, 10_000, 30_000];

type Entry = { promise: Promise<Order[]>; startedAt: number };
const inFlight = new Map<string, Entry>();
const cache = new Map<string, { orders: Order[]; storedAt: number }>();

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Sync cancelled", "AbortError"));
      },
      { once: true },
    );
  });

export async function fetchOrdersWithResilience(
  url: string,
  signal?: AbortSignal,
): Promise<Order[]> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) return cached.orders;

  const existing = inFlight.get(url);
  if (existing) return existing.promise;

  const promise = (async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        if (signal?.aborted) throw new DOMException("Sync cancelled", "AbortError");
        const orders = await fetchOrdersFromSheet(url, signal);
        cache.set(url, { orders, storedAt: Date.now() });
        return orders;
      } catch (error) {
        lastError = error;
        if (attempt < RETRY_DELAYS_MS.length) await wait(RETRY_DELAYS_MS[attempt], signal);
      }
    }
    throw lastError instanceof Error ? lastError : new Error("שגיאת סנכרון לא ידועה");
  })();

  inFlight.set(url, { promise, startedAt: Date.now() });
  try {
    return await promise;
  } finally {
    inFlight.delete(url);
  }
}

export function clearSheetSyncCache(url?: string) {
  if (url) cache.delete(url);
  else cache.clear();
}
