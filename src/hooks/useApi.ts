import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export interface ApiState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  /** Load again, e.g. after a change. */
  reload: () => void;
}

/**
 * Loads data when a screen opens (and again when `deps` change).
 *
 *   const { data, loading, error, reload } = useApi(() => listMembers({ search }), [search]);
 */
export function useApi<T>(load: () => Promise<T>, deps: DependencyList = []): ApiState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    loadRef
      .current()
      .then((d) => !cancelled && setData(d))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

export type ActionResult<R> = { ok: true; value: R } | { ok: false };

/**
 * Wraps a change (save, invite, delete…) with a busy flag and error message.
 *
 *   const save = useAction(updateOrganization);
 *   const result = await save.run(patch);
 *   if (result.ok) { ...result.value }   // otherwise save.error holds the message
 */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const run = useCallback(
    async (...args: A): Promise<ActionResult<R>> => {
      setBusy(true);
      setError(undefined);
      try {
        return { ok: true, value: await fn(...args) };
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        return { ok: false };
      } finally {
        setBusy(false);
      }
    },
    [fn],
  );

  return { run, busy, error, clearError: () => setError(undefined) };
}
