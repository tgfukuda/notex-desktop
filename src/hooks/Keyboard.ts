import React, { useRef, useState } from "react";

export type KeyBoards = { [key: string]: boolean | undefined };

let keyboard: KeyBoards = {};

type Caret = {
  line: number; // 
  pos: number;
};
const useKeyAction = (
  initCaret: Caret,
  onKeyDown: (keyboard: KeyBoards, e: React.KeyboardEvent<unknown>) => void,
  onKeyUp?: (keybord: KeyBoards, e: React.KeyboardEvent<unknown>) => void
) => {
  const ref: React.RefObject<any> = useRef(null);

  /**
   * caret is for completely uncontrolled DOM (like contenteditable)
   * this is not necessary in a common use case
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
    console.log({
      ...keyboard,
      [e.key]: true,
    })
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
    console.log({
      ...keyboard,
      [e.key]: false,
    })
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

export default useKeyAction;
