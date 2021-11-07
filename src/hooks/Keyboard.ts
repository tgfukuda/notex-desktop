import React, { useRef, useState } from "react";

/**
 * this module provides key action handler.
 * if mouse action handler needed, it also implemented by this.
 */

/**
 * more specific typing is hopeful.
 */
export type KeyBoards = { [key: string]: boolean | undefined };

/**
 * keyboard is only one shared state for any component.
 * so it should be handled as global.
 */
var keyboard: KeyBoards = {};

type Caret = {
  line: number;
  pos: number;
};
const useKeyAction = (
  onKeyDown: (keyboard: KeyBoards, e: React.KeyboardEvent<unknown>) => void,
  onKeyUp?: (keybord: KeyBoards, e: React.KeyboardEvent<unknown>) => void,
  initCaret: Caret = {
    line: 0,
    pos: 0,
  },
) => {
  /**
   * pass the reference to the component to handle keyboard event.
   */
  const ref: React.RefObject<any> = useRef(null);
  
  /**
   * caret is for completely uncontrolled DOM (like contenteditable).
   * this is not necessary in a common use case.
   */
  const [caret, setCaret] = useState(initCaret);
  const updateCaret = (line: number, pos: number) => {
    setCaret({
      line: line,
      pos: pos,
    });
    if (ref.current) {
      const range = document.createRange();
      const  selection = window.getSelection();
      range.setStart(ref.current.childNodes[line], pos);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<unknown>) => {
    keyboard[e.key] = true;
    onKeyDown(
      {
        ...keyboard,
        [e.key]: true,
      },
      e
    );
  };
  const handleKeyUp = (e: React.KeyboardEvent<unknown>) => {
    keyboard[e.key] = false;
    if (onKeyUp)
      onKeyUp(
        {
          ...keyboard,
          [e.key]: false,
        },
        e
      );
  };

  return {
    ref,
    caret,
    handleKeyDown,
    handleKeyUp,
    updateCaret,
  };
};

/**
 * this component is targeting only window and document object (not react virtual dom).
 * so, caret is not implemented (more efficient object should controll it)
 */
export const useNativeKeyAction = (
  onKeyDown: (keyboard: KeyBoards, evt: KeyboardEvent) => void,
  onKeyUp?: (keybord: KeyBoards, evt: KeyboardEvent) => void,
) => {
  const handleKeyDown = (evt: KeyboardEvent) => {
    keyboard[evt.key] = true;
    onKeyDown(
      {
        ...keyboard,
        [evt.key]: true,
      },
      evt
    );
  };
  const handleKeyUp = (evt: KeyboardEvent) => {
    keyboard[evt.key] = false;
    if (onKeyUp)
      onKeyUp(
        {
          ...keyboard,
          [evt.key]: false,
        },
        evt
      );
  };

  return {
    handleKeyDown,
    handleKeyUp,
  };
};

export default useKeyAction;
