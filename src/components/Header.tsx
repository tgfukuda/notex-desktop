import React from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  useScrollTrigger,
  CssBaseline,
  Slide,
} from "@material-ui/core";
import SettingsIcon from "@material-ui/icons/Settings";
import { makeStyles } from "@material-ui/core/styles";
import utilMsg from "../utils/constant/util";
import { useSettings } from "../redux/hooks";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100vw",
    zIndex: 500,
    height: "15vh",
  },
  nonRootRoot: {
    width: "100vw",
    zIndex: 500,
    height: "8vh",
  },
  appBar: {
    padding: theme.spacing(2),
    height: "15vh",
  },
  nonRootAppBar: {
    padding: theme.spacing(0.5),
    height: "8vh",
  },
  title: {
    flexGrow: 1,
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "block",
    },
    textDecorationLine: "none",
  },
  searchBar: {
    width: "30%",
  },
  dummy: (props: { width: number }) => ({
    width: props.width || "100%",
    height: "3vh",
    padding: theme.spacing(1),
  }),
}));

type Props = {
  children: React.ReactElement;
};

type DummyProps = {
  width: number;
};

const HideOnScroll: React.FC<Props> = ({ children }) => {
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger} timeout={100}>
      {children}
    </Slide>
  );
};

HideOnScroll.propTypes = {
  children: PropTypes.element.isRequired,
};

export const DummyHeader: React.FC<DummyProps> = ({ width }) => {
  const classes = useStyles({ width: width });
  return (
    <>
      <CssBaseline />
      <HideOnScroll>
        <div className={classes.dummy} />
      </HideOnScroll>
    </>
  );
};

const Header = () => {
  const classes = useStyles({ width: 0 });
  const utilMsgs = utilMsg(useSettings().language);
  const path = useLocation().pathname;
  const isRoot = path === "/" || path.startsWith("/home");

  return (
    <header className={isRoot ? classes.root : classes.nonRootRoot}>
      <CssBaseline />
      <HideOnScroll>
        <AppBar className={isRoot ? classes.appBar : classes.nonRootAppBar}>
          <Toolbar>
            <Typography
              variant={isRoot ? "h1" : "h6"}
              component={Link}
              to={"/home"}
              color={"inherit"}
              noWrap
              className={classes.title}
            >
              NoTeX
            </Typography>
            <Button
              component={Link}
              to={{ pathname: "/write", search: "" }}
              color={"inherit"}
            >
              {utilMsgs.write}
            </Button>
            <Button component={Link} to={"/browse"} color={"inherit"}>
              {utilMsgs.browse}
            </Button>
            <Button component={Link} to={"/test"} color={"inherit"}>
              test
            </Button>
            <Button component={Link} to={"/settings"} color={"inherit"}>
              <SettingsIcon />
            </Button>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
    </header>
  );
};

export default Header;
