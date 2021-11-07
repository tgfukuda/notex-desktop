import { useState, useCallback } from "react";

/**
 * IMPROVE -- list snack handler.
 */
export const useSnack = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  //it would have no change once created.
  //maybe erase useCallback
  const handleSnack = useCallback((msg: string) => {
    setMessage(msg);
    setOpen(true);
  }, [setMessage, setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  return {
    open,
    message,
    handleSnack,
    handleClose,
  };
};
