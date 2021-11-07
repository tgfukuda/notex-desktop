/** @jsxImportSource @emotion/react */
import React, { useEffect } from "react";
import { css } from "@emotion/react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
  useParams,
} from "react-router-dom";
import { useAppDispatch } from "../redux/hooks";
import { NoTeXSettings } from "../redux/settings";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Browse from "./Browse";
import View from "./View";
import Home from "./Home";
import Edit from "./Write";
import Settings from "./Setting";
import Tauritest from "./Tauritest";
import useCommand, { Response } from "../api/command";

const Main: React.FC = () => {
  const { route } = useParams<Record<string, string | undefined>>();

  return (
    <main
      css={css({
        minHeight: "70vh",
      })}
    >
      {(() => {
        switch (route) {
          case "home":
            return <Home />;
          case "write":
            return <Edit />;
          // case "edit":
          //   return <EditFile />;
          case "browse":
            return <Browse />;
          case "view":
            return <View />;
          case "settings":
            return <Settings />;
          case "test":
            return <Tauritest />;
          default:
            return <>404 Not Found</>;
        }
      })()}
    </main>
  );
};

const Top: React.FC = () => {
  const { getSetting } = useCommand();
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      const setting = await getSetting().catch((err) => {
        let { code, message } = err as Response;
        console.error(code, message);
      });
      if (setting) {
        dispatch(NoTeXSettings.setSettings(setting));
      }
    })();
  }, []);

  return (
    <Router>
      <Switch>
        <Redirect exact from={"/"} to={"/home"} />
        <Route path={"/:route"}>
          <Header />
          <Main />
          <Footer />
        </Route>
        <Route>404 Not Found</Route>
      </Switch>
    </Router>
  );
};

export default Top;
