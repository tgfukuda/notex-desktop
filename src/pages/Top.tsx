import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
  useParams,
} from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Header from "../components/Header";
import Footer from "../components/Footer";
// import EditFile from "./EditFile";
// import Browse from "./Browse";
// import View from "./View";
// import Preview from "../components/Preview";
import Home from "./Home";
import Edit from "./Write";
import LiveEdit from "./Edit";
// import Settings from "./Settings";
// import Test from "./test";
// import { getRequest } from "../api/get";
// import { NoTeXSettings } from "../redux/reducers/settings";
import Tauritest from "./Tauritest";
import useCommand from "../api/command";

const useStyles = makeStyles((theme) => ({
  main: {
    minHeight: "70vh",
  },
}));

const Main = () => {
  const classes = useStyles();
  const { route } = useParams<Record<string, string | undefined>>();

  return (
    <main className={classes.main}>
      {(() => {
        switch (route) {
          case "home":
            return <Home />;
          case "write":
            return <Edit />;
          // case "edit":
          //   return <EditFile />;
          // case "browse":
          //   return <Browse />;
          // case "view":
          //   return <View />;
          // case "settings":
          //   return <Settings />;
          case "test":
            return <Tauritest />;
          default:
            return <>404 Not Found</>;
        }
      })()}
    </main>
  );
};

const Top = () => {
  const { getSetting } = useCommand();

  useEffect(() => {
    (async () => {
      await getSetting();
    })()
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
