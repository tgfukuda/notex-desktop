import { useState, useCallback } from "react";

export const useSnack = (id: number = 0) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  //it would have no change once created.
  const handleSnack = useCallback((msg: string) => {
    setMessage(msg);
    setOpen(true);
  }, []);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  return {
    open,
    message,
    handleSnack,
    handleClose,
  };
};
