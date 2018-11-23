export function useAutoMemo<T>(factory: () => T): T;
export function useAutoMemo<T>(factory: T): T;

export function useCallback<T extends (...args: any[]) => any>(callback: T): T;
