/** @jsxImportSource @emotion/react */
import React, { createContext, useContext, useMemo } from "react";
import { css, useTheme } from "@emotion/react";
import { Button, Snackbar, Slide } from "@mui/material";
import { CloseRounded } from "@mui/icons-material";
import { useSnack } from "../hooks/Snack";
import { Z_INDEXES } from "../utils/constant/util";

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

/**
 * params
 */
const autoHideDuration = 4000;
const anchorOriginVertical = "top";
const anchorOriginHorizon = "right";

interface SnackComponent {
  message: string;
  open: boolean;
  onClose?: () => void;
}

const SuccessSnack: React.FC<SnackComponent> = ({ message, open, onClose }) => {
  const theme = useTheme();

  return (
    <Snackbar
      anchorOrigin={{
        vertical: anchorOriginVertical,
        horizontal: anchorOriginHorizon,
      }}
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      message={message}
      action={
        <Button onClick={onClose}>
          <CloseRounded fontSize={"small"} />
        </Button>
      }
      css={css({
        "& .MuiSnackbarContent-root": {
          backgroundColor: theme.palette.success.main,
          zIndex: Z_INDEXES.snack,
        },
      })}
      TransitionComponent={Slide}
      /**TransitionProps={{
        direction: "left",
        timeout: { appear: 200, enter: 100, exit: 10 },
      }}*/
    />
  );
};

const ErrorSnack: React.FC<SnackComponent> = ({ message, open, onClose }) => {
  const theme = useTheme();

  return (
    <Snackbar
      anchorOrigin={{
        vertical: anchorOriginVertical,
        horizontal: anchorOriginHorizon,
      }}
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      message={message}
      action={
        <Button onClick={onClose}>
          <CloseRounded fontSize={"small"} />
        </Button>
      }
      css={css({
        "& .MuiSnackbarContent-root": {
          backgroundColor: theme.palette.error.main,
          zIndex: Z_INDEXES.snack,
        },
      })}
      TransitionComponent={Slide}
      /**TransitionProps={{
        direction: "left",
        timeout: { appear: 200, enter: 100, exit: 10 },
      }}*/
    />
  );
};

const WarningSnack: React.FC<SnackComponent> = ({ message, open, onClose }) => {
  const theme = useTheme();

  return (
    <Snackbar
      anchorOrigin={{
        vertical: anchorOriginVertical,
        horizontal: anchorOriginHorizon,
      }}
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      message={message}
      action={
        <Button onClick={onClose}>
          <CloseRounded fontSize={"small"} />
        </Button>
      }
      css={css({
        "& .MuiSnackbarContent-root": {
          backgroundColor: theme.palette.warning.main,
          zIndex: Z_INDEXES.snack,
        },
      })}
      TransitionComponent={Slide}
      /**TransitionProps={{
        direction: "left",
        timeout: { appear: 200, enter: 100, exit: 10 },
      }}*/
    />
  );
};
