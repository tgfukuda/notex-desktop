import React, { useState } from "react";

/**
 * this module provides key action handler.
 * if mouse action handler needed, it also implemented by this.
 */

/**
 * each line indicates
 * 1    -(len)
 * 2    -(len - 1)
 * :      :
 * (len)  -1
 * analogously, each char indicates
 *    1        2     ... (len)
 * -(len) -(len - 1) ...  -1
 */
export type Caret = {
  idx: number; //current idx
  line: number; //
  pos: number; //
};
/**
 * caret is for completely uncontrolled DOM (like contenteditable).
 * this is not necessary in a common use case.
 * suppose,
 * 1. target dom nodes are indexed.
 * 2. each dom has a div for every line.
 * 3. each dom has a span for any character.
 * 4. any line has additional empty span. it also counts for the length.
 */
export const useCaretControl = () => {
  const [innerCaret, setInnerCaret] = useState<Caret>({
    idx: 0,
    line: 1,
    pos: 1,
  });

  const forceUpdateCaretGenerator =
    (lineMax: number, posMax: number) =>
    (idx: number, line: number, pos: number) => {
      setInnerCaret({ idx, line, pos });
    };

  const updateCaretGenerator = (lineMax: number, posMax: number) => {
    const updateCaret = (idx: number, lineDif: number, posDif: number) => {
      if (innerCaret) {
        const line = (innerCaret.line + lineDif) % (lineMax + 1);
        const pos = (innerCaret.pos + posDif) % (posMax + 1);
        if (line === 0) {
          if (0 < lineDif) {
            setInnerCaret({
              idx: idx + 1,
              line: 1,
              pos,
            });
          } else {
            setInnerCaret({
              idx: idx - 1,
              line: -1,
              pos,
            });
          }
        } else if (pos === 0) {
          if (0 < posDif) {
            setInnerCaret({
              idx,
              line: 1,
              pos: 1,
            });
          } else {
            setInnerCaret({
              idx,
              line: -1,
              pos: -1,
            });
          }
        } else {
          setInnerCaret({
            idx,
            line,
            pos,
          });
        }
      } else {
        setInnerCaret({ idx, line: lineDif, pos: posDif });
      }
    };

    return updateCaret;
  };

  const getCaret = (lineMax: number, posMax: number) => {
    return {
      idx: innerCaret.idx,
      line:
        0 < innerCaret.line
          ? Math.min(innerCaret.line, lineMax) % (lineMax + 1)
          : (Math.max(innerCaret.line, -1 * lineMax) % (lineMax + 1)) + lineMax,
      pos:
        0 < innerCaret.pos
          ? Math.min(innerCaret.pos, posMax) % (posMax + 1)
          : (Math.max(innerCaret.pos, -1 * posMax) % (posMax + 1)) + posMax,
    } as Caret;
  };

  return {
    innerCaret,
    getCaret,
    updateCaretGenerator,
    forceUpdateCaretGenerator,
  };
};

/**
 * more specific typing is hopeful.
 */
export type KeyBoard = { [key: string]: boolean | undefined };
const useKeyAction = (
  onKeyDown: (keyboard: KeyBoard, e: React.KeyboardEvent<unknown>) => void,
  onKeyUp?: (keybord: KeyBoard, e: React.KeyboardEvent<unknown>) => void
) => {
  const [keyboard, setKeyboard] = useState<KeyBoard>({});

  const handleKeyDown = (e: React.KeyboardEvent<unknown>) => {
    const next = {
      ...keyboard,
      [e.key]: true,
    };
    setKeyboard(next);
    onKeyDown(next, e);
  };
  const handleKeyUp = (e: React.KeyboardEvent<unknown>) => {
    const next = {
      ...keyboard,
      [e.key]: false,
    };
    setKeyboard(next);
    if (onKeyUp) onKeyUp(next, e);
  };

  const resetKeyBoard = () => setKeyboard({});

  return {
    handleKeyDown,
    handleKeyUp,
    resetKeyBoard,
  };
};

/**
 * this component is targeting only window and document object (not react virtual dom).
 * so, caret is not implemented (more efficient object should controll it)
 */
export const useNativeKeyAction = (
  onKeyDown: (keyboard: KeyBoard, evt: KeyboardEvent) => void,
  onKeyUp?: (keybord: KeyBoard, evt: KeyboardEvent) => void
) => {
  var keyboard: KeyBoard = {};
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
