import React from "react";

type ElementList = {
  [idx: string]: HTMLElement;
};

/**
 * TODO --
 * elements may be hopeful to deal with useRef..., but how does it?
 * target scrollable elment and its caller is not always created within the same component.
 * so the global object needed.
 * however, this way cause a bug when there is the same named element. (cuz handled by object mapping.)
 * additionally, such priority is not recognized by caller element.
 * changing elements to array will result in the same trouble or,
 * pick element each calling may not work because the order of rendering of caller and callee is not decided.
 * (necessary to ensure the callee is rendered before caller is.)
 * for the above reasons, this architechture can be something wrong.
 * what is the best practice? this abstraction can't?
 */
var elements: ElementList = {};
const useScroll = (container?: HTMLElement) => {
  const addEl = (idx: string, ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      elements[idx] = ref.current;
    }
  };
  const pickEl = (idx: string) => {
    const target = container ?? window;
    const targetY =
      container?.getBoundingClientRect().top || window.scrollY * -1;

    target.scrollTo({
      top: elements[idx]?.getBoundingClientRect().top - targetY - 5,  //extra 5px
      left: 0,
      behavior: "smooth",
    });
  };
  const removeEl = (idx: string) => {
    delete elements[idx];
  };

  return {
    addEl,
    pickEl,
    removeEl,
  };
};

export default useScroll;
