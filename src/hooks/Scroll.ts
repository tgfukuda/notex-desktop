import React from "react";

type ScrollTargets = {
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
var scrollTargets: ScrollTargets = {};
const useScroll = (container?: HTMLElement) => {
  const addEl = (idx: string, ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      scrollTargets[idx] = ref.current;
    }
  };
  const pickEl = (idx: string) => {
    const target = container ?? window;
    const targetY =
      container?.getBoundingClientRect().top || window.scrollY * -1;

    target.scrollTo(
      0,
      scrollTargets[idx]?.getBoundingClientRect().top - targetY - 5
    );
  };
  const removeEl = (idx: string) => {
    delete scrollTargets[idx];
  };

  return {
    addEl,
    pickEl,
    removeEl,
  };
};

export default useScroll;
