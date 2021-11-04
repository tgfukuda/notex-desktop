import React from "react";

type ElementList = {
  [idx: string]: HTMLElement;
};

var elements: ElementList = {};
const regex = /,|\\n|\s/g
const useScroll = (container?: HTMLElement) => {
  const addEl = (idx: string, ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      elements[idx.replace(regex, "-")] = ref.current;
    }
  };
  const pickEl = (idx: string) => {
    const target = container ?? window;
    const targetY = container
      ? window.scrollY - container.getBoundingClientRect().top
      : window.scrollY;

    console.log(idx, elements, target, targetY)
    target.scrollTo({
      top: elements[idx.replace(regex, "-")]?.getBoundingClientRect().top + targetY,
      left: 0,
      behavior: "smooth",
    });
  };
  const removeEl = (idx: string) => {
    delete elements[idx.replace(regex, "-")];
  };

  return {
    addEl,
    pickEl,
    removeEl,
  };
};

export default useScroll;
