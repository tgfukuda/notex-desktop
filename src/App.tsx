/** @jsxImportSource @emotion/react */
import React from "react";
import "./App.css";
import { ThemeProvider as EmotionProvider } from "@emotion/react";
import { SnackContextProvider } from "./context/SnackHandler";
import { ModalContextProvider } from "./context/Modal";
import store from "./redux/store";
import { Provider as ReduxProvider } from "react-redux";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material";
import Top from "./pages/Top";

const themeBase = createTheme({
  palette: {
    primary: {
      main: "#6EB7DB",
    },
    secondary: {
      main: "#A4A9CF",
    },
    text: {
      primary: "#303030",
    },
    background: {
      default: "#DCE9F5",
    },
    success: {
      main: "#22e4da",
    },
    error: {
      main: "rgba(255, 0, 0, .7)",
    },
    warning: {
      main: "#FDF7AA",
    },
    info: {
      main: "rgb(113, 145, 235)",
    },
    divider: "rgba(0, 0, 0, 0.12)",
    common: {
      black: "rgba(0, 0, 0, 0.1)",
      white: "white",
    },
  },
  typography: {
    fontSize: 14,
  },
});

const theme = createTheme(themeBase, {
  components: {
    MuiButton: {
      styleOverrides: {
        text: {
          color: themeBase.palette.text.primary
        }
      }
    }
  }
})

const ThemeProvider: React.FC<{ theme: typeof theme }> = ({
  theme,
  children,
}) => {
  return (
    <MuiThemeProvider theme={theme}>
      <EmotionProvider theme={theme}>{children}</EmotionProvider>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <ReduxProvider store={store}>
          <ModalContextProvider>
            <SnackContextProvider>
              <Top />
            </SnackContextProvider>
          </ModalContextProvider>
        </ReduxProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
