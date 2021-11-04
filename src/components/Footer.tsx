/** @jsxImportSource @emotion/react */
import React from "react";
import {css} from "@emotion/react"
import { AppBar, Toolbar, Grid } from "@mui/material";
import github32px from "../img/GitHub-Mark-Light-32px.png";
import utilMsg, { VERSION } from "../utils/constant/util";
import { useSettings } from "../redux/hooks";

const Footer: React.FC = () => {
  const utilMsgs = utilMsg(useSettings().language);

  return (
    <AppBar
      position="static"
      component={"footer"}
      css={css({
        width: "100%",
        height: "10vh",
      })}
    >
      <Grid
        container
        component={Toolbar}
        direction={"row"}
        justifyContent={"space-evenly"}
        alignItems={"stretch"}
      >
        <Grid item>
          <a href={"https://github.com/FukudaTaiga"} target={"blank"}>
            <img
              src={github32px}
              alt={"GitHub"}
              width={32}
              height={32}
              css={css({
                position: "relative",
                  top: 0,
              })}
            />
          </a>
        </Grid>
        <Grid item>{utilMsgs.version + " " + VERSION}</Grid>
      </Grid>
    </AppBar>
  );
};

export default Footer;
