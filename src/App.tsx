import React from "react";
import "./App.css";
import { createTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";
import { SnackContextProvider } from "./context/SnackHandler";
import { ModalContextProvider } from "./context/Modal";
import store from "./redux/store";
import { Provider as ReduxProvider } from "react-redux";
import Top from "./pages/Top";

const customTheme = createTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: "#6EB7DB",
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
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
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: 3,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2,
  },
});

function App() {
  return (
    <React.StrictMode>
      <MuiThemeProvider theme={customTheme}>
        <CssBaseline />
        <ModalContextProvider>
          <SnackContextProvider>
            <ReduxProvider store={store}>
              <Top />
            </ReduxProvider>
          </SnackContextProvider>
        </ModalContextProvider>
      </MuiThemeProvider>
    </React.StrictMode>
  );
}

export default App;
