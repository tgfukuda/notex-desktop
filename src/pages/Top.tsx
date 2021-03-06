/** @jsxImportSource @emotion/react */
import React, { useEffect } from "react";
import { css } from "@emotion/react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
  useHistory,
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
  const history = useHistory();
  const { handleSuc, handleErr } = useSnackHandler();

  useEffect(() => {
    const unlisten: UnlistenFn[] = [];

    listen("routing", (e: TauriEvent<string>) => {
      history.push({
        pathname: e.payload,
      });
    })
      .then((ulf) => {
        unlisten.push(ulf);
      })
      .catch((err) => handleErr(err.message));

    listen("success", (e: TauriEvent<Response>) => {
      handleSuc(e.payload.message);
    })
      .then((ulf) => {
        unlisten.push(ulf);
      })
      .catch((err) => handleErr(err.message));

    listen("fail", (e: TauriEvent<Response>) => {
      handleErr(e.payload.message);
    })
      .then((ulf) => {
        unlisten.push(ulf);
      })
      .catch(() => {});

    return () => {
      for (const ulf of unlisten) ulf();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <main
      css={css({
        width: "90%",
        height: "100%",
        margin: 0,
        padding: 0,
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
        <Route exact path={"/setting"}>
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
  const { handleErr } = useSnackHandler();

  useEffect(() => {
    (async () => {
      const setting = await getSetting().catch((err) => {
        handleErr((err as Response).message);
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
