export function useAutoMemo<T>(factory: () => T): T;
export function useAutoMemo<T>(factory: T): T;

export function useAutoCallback<T extends (...args: any[]) => any>(
  callback: T,
): T;

type EffectCallback = () => void | (() => void);

export function useAutoEffect(effect: EffectCallback): void;
export function useAutoLayoutEffect(effect: EffectCallback): void;
