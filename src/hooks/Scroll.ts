import React from "react";

type ElementList = {
  [idx: number]: HTMLElement;
};

var elements: ElementList = {};

const useScroll = () => {
  const addEl = (idx: number, ref: React.RefObject<HTMLElement>) => {
    if (ref.current) elements[idx] = ref.current;
  };
  const pickEl = (idx: number) => {
    window.scrollTo({
      top: elements[idx]?.getBoundingClientRect().top + window.scrollY,
      left: 0,
      behavior: "smooth",
    });
  };
  const removeEl = (idx: number) => {
    delete elements[idx];
  };

  return {
    addEl,
    pickEl,
    removeEl,
  };
};

export default useScroll;
