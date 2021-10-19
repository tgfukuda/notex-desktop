import React, { useState, createContext, useContext } from "react";

/**
 * this is only used by Edit.tsx
 */

const TargetContext = createContext({
  current: -1,
  update: (i: number) => {},
  next: () => {},
  pre: () => {},
});

export const TargetContextProvider: React.FC = ({ children }) => {
  const [current, setCurrent] = useState(-1);
  const update = (i: number) => setCurrent(i);
  const next = () => setCurrent(current + 1);
  const pre = () => setCurrent(current - 1);

  return (
    <TargetContext.Provider
      value={{
        current,
        update,
        next,
        pre,
      }}
    >
      {children}
    </TargetContext.Provider>
  );
};

export const useTarget = () => useContext(TargetContext);
