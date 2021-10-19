import React, { createContext, useContext, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Button, Snackbar, Slide } from "@material-ui/core";
import { CloseRounded } from "@material-ui/icons";
import { useSnack } from "../hooks/Snack";

const SnackContext = createContext({
  handleSuc: (msg: string) => alert(msg),
  handleWarn: (msg: string) => alert(msg),
  handleErr: (msg: string) => alert(msg),
});
export const SnackContextProvider: React.FC = ({ children }) => {
  const {
    open: sucOpen,
    message: sucMsg,
    handleSnack: handleSuc,
    handleClose: closeSuc,
  } = useSnack();
  const {
    open: warnOpen,
    message: warnMsg,
    handleSnack: handleWarn,
    handleClose: closeWarn,
  } = useSnack();
  const {
    open: errOpen,
    message: errMsg,
    handleSnack: handleErr,
    handleClose: closeErr,
  } = useSnack();
  const value = useMemo(
    () => ({
      handleSuc: handleSuc,
      handleWarn: handleWarn,
      handleErr: handleErr,
    }),
    [handleSuc, handleWarn, handleErr]
  );

  return (
    <SnackContext.Provider value={value}>
      {children}
      <SuccessSnack message={sucMsg} open={sucOpen} onClose={closeSuc} />
      <WarningSnack message={warnMsg} open={warnOpen} onClose={closeWarn} />
      <ErrorSnack message={errMsg} open={errOpen} onClose={closeErr} />
    </SnackContext.Provider>
  );
};
export const useSnackHandler = () => useContext(SnackContext);

interface SnackComponent {
  message: string;
  open: boolean;
  onClose?: () => void;
}

const useStyles = makeStyles((theme) => ({
  successSnack: {
    backgroundColor: theme.palette.success.main,
    zIndex: 2147483647,
  },
  errorSnack: {
    backgroundColor: theme.palette.error.main,
    zIndex: 2147483647,
  },
  warningSnack: {
    backgroundColor: theme.palette.warning.main,
    zIndex: 2147483647,
  },
}));

const SuccessSnack: React.FC<SnackComponent> = ({ message, open, onClose }) => {
  const classes = useStyles()

  return (
    <Snackbar
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      message={message}
      action={
        <Button onClick={onClose}>
          <CloseRounded fontSize={"small"} />
        </Button>
      }
      ContentProps={{
        className: classes.successSnack,
      }}
      TransitionComponent={Slide}
      /**TransitionProps={{
        direction: "left",
        timeout: { appear: 200, enter: 100, exit: 10 },
      }}*/
    />
  );
};

const ErrorSnack: React.FC<SnackComponent> = ({ message, open, onClose }) => {
  const classes = useStyles()

  return (
    <Snackbar
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      message={message}
      action={
        <Button onClick={onClose}>
          <CloseRounded fontSize={"small"} />
        </Button>
      }
      ContentProps={{
        className: classes.errorSnack,
      }}
      TransitionComponent={Slide}
      /**TransitionProps={{
        direction: "left",
        timeout: { appear: 200, enter: 100, exit: 10 },
      }}*/
    />
  );
};

const WarningSnack: React.FC<SnackComponent> = ({ message, open, onClose }) => {
  const classes = useStyles();

  return (
    <Snackbar
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      message={message}
      action={
        <Button onClick={onClose}>
          <CloseRounded fontSize={"small"} />
        </Button>
      }
      ContentProps={{
        className: classes.warningSnack,
      }}
      TransitionComponent={Slide}
      /**TransitionProps={{
        direction: "left",
        timeout: { appear: 200, enter: 100, exit: 10 },
      }}*/
    />
  );
};
