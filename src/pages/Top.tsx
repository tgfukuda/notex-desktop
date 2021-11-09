/** @jsxImportSource @emotion/react */
import React, { useEffect, useRef } from "react";
import { css } from "@emotion/react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import { useAppDispatch } from "../redux/hooks";
import { NoTeXSettings } from "../redux/settings";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Browse from "./Browse";
import View from "./View";
import Home from "./Home";
import Edit from "./Write";
import Listner from "./Listener";
import Settings from "./Setting";
import useCommand, { Response } from "../api/command";
import { useSnackHandler } from "../context/SnackHandler";
import { listen, Event as TauriEvent, UnlistenFn } from "@tauri-apps/api/event";

const Main: React.FC = () => {
  const unlisten = useRef<UnlistenFn[]>([]);
  const { handleSuc, handleErr } = useSnackHandler();

  useEffect(() => {
    listen("success", (e: TauriEvent<Response>) => {
      handleSuc(e.payload.message);
    })
      .then((ulf) => {
        unlisten.current.push(ulf);
      })
      .catch((err) => handleErr(err));

    listen("fail", (e: TauriEvent<Response>) => {
      handleSuc(e.payload.message);
    })
      .then((ulf) => {
        unlisten.current.push(ulf);
      })
      .catch(() => {});

    return () => {
      for (const ulf of unlisten.current) ulf();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <main
      css={css({
        minHeight: "70vh",
      })}
    >
      <Switch>
        <Route exact path={"/home"}>
          <Home />
        </Route>
        <Route exact path={"/write"}>
          <Edit />
        </Route>
        <Route exact path={"/browse"}>
          <Browse />
        </Route>
        <Route exact path={"/view"}>
          <View />
        </Route>
        <Route exact path={"/settings"}>
          <Settings />
        </Route>
        <Redirect exact from={"/"} to={"/home"} />
        <Route>404 Not Found</Route>
      </Switch>
    </main>
  );
};

/**
 * for desktop app, I think header and footer is not needed like VSCode.
 * remove them and add Side nav or handle them with Menu Icon of the window.
 */
const Top: React.FC = () => {
  const { getSetting } = useCommand();
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      const setting = await getSetting().catch((err) => {
        let { code, message } = err as Response;
        console.error(code, message);
        return undefined;
      });
      if (setting) {
        dispatch(NoTeXSettings.setSettings(setting));
      }
    })();
    // eslint-disable-next-line
  }, []);

  return (
    <Router>
      <Switch>
        <Route exact path={"/listen"}>
          <Listner />
        </Route>
        <Route path={"/"}>
          <Header />
          <Main />
          <Footer />
        </Route>
      </Switch>
    </Router>
  );
};

export default Top;
