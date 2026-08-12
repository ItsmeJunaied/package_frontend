import { useEffect, useState } from 'react';

/**
 * Trail a value by `delay` ms.
 *
 * Search boxes need this: firing a request per keystroke means "Hossain" is
 * seven requests, six of them already stale by the time they land, and the
 * last one to arrive wins rather than the last one sent. Waiting for a pause in
 * typing sends one.
 *
 * The immediate value still drives the input, so typing stays responsive —
 * only the query trails.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
