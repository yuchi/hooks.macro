export function useAutoMemo<T>(factory: () => T): T;
export function useAutoMemo<T>(factory: T): T;

export function useCallback<T extends (...args: any[]) => any>(callback: T): T;

type EffectCallback = () => void | (() => void);

export function useEffect(effect: EffectCallback): void;
export function useLayoutEffect(effect: EffectCallback): void;
