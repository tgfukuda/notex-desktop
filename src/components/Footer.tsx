import React from "react";
import { AppBar, Toolbar, Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core";
import github32px from "../img/GitHub-Mark-Light-32px.png";
import utilMsg, { version } from "../utils/constant/util";
import { useSettings } from "../redux/hooks";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "10vh",
  },
  githubImg: {
    position: "relative",
    top: 0,
  },
}));

const Footer = () => {
  const classes = useStyles();
  const utilMsgs = utilMsg(useSettings().language);

  return (
    <footer className={classes.root}>
      <AppBar position="static">
        <Grid
          container
          component={Toolbar}
          direction={"row"}
          justify={"space-evenly"}
          alignItems={"stretch"}
        >
          <Grid item>
            <a href={"https://github.com/FukudaTaiga"} target={"blank"}>
              <img
                src={github32px}
                alt={"GitHub"}
                width={32}
                height={32}
                className={classes.githubImg}
              />
            </a>
          </Grid>
          <Grid item>{utilMsgs.version + " " + version}</Grid>
        </Grid>
      </AppBar>
    </footer>
  );
};

export default Footer;
