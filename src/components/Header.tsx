/** @jsxImportSource @emotion/react */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { css, useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  useScrollTrigger,
  CssBaseline,
  Slide,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import utilMsg from "../utils/constant/util";
import { useSettings } from "../redux/hooks";

const HideOnScroll: React.FC<{children: React.ReactElement}> = ({ children }) => {
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

type DummyProps = {
  width: number;
};
export const DummyHeader: React.FC<DummyProps> = ({ width }) => {
  const theme = useTheme();
  return (
    <>
      <CssBaseline />
      <HideOnScroll>
        <div
          css={css({
            width: width || "100%",
            height: "3vh",
            padding: theme.spacing(1),
          })}
        />
      </HideOnScroll>
    </>
  );
};

const Header: React.FC<{ online?: boolean }> = ({ online = false }) => {
  const theme = useTheme();
  const utilMsgs = utilMsg(useSettings().language);
  const path = useLocation().pathname;
  const isRoot = path === "/" || path.startsWith("/home");

  return online ? (
    <header
      css={css({
        width: "100%",
        zIndex: 500,
        height: isRoot ? "15vh" : "10vh",
      })}
    >
      <CssBaseline />
      <HideOnScroll>
        <AppBar
          component={"nav"}
          css={css({
            padding: theme.spacing(2),
            height: isRoot ? "15vh" : "10vh",
          })}
        >
          <Toolbar>
            <Typography
              variant={isRoot ? "h1" : "h6"}
              component={Link}
              to={"/home"}
              color={"inherit"}
              noWrap
              css={css({
                flexGrow: 1,
                textDecorationLine: "none",
              })}
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
            <Button component={Link} to={"/setting"} color={"inherit"}>
              <SettingsIcon />
            </Button>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
    </header>
  ) : (
    <React.Fragment />
  );
};

export default Header;
