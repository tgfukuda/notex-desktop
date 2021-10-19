export type Internal<T> = ((() => Internal<T>) & Function) | T
/**
 * argument f must be the type of (...args) => () => T
 * this function wraps such function and enables it to avoid stack over flow
 */
export const trampoline =
  <T extends unknown>(f: (...args: any[]) => Internal<T>) =>
  (...args: any[]) => {
    let res = f(...args);
    while (typeof res === "function") {
      res = (res as () => Internal<T>)();
    }

    return res;
  };
