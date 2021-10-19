import React from "react";
import { Link, Route, useRouteMatch } from "react-router-dom";
import { Button, Grid, Typography } from "@material-ui/core";
import { ArrowRightRounded } from "@material-ui/icons";
import { makeStyles, alpha } from "@material-ui/core/styles";
import CollapsedController from "../components/CollapsedController";

const useStyles = makeStyles((theme) => ({
  controller: {
    width: "15vw",
    margin: theme.spacing(0.5),
    padding: theme.spacing(0),
    backgroundColor: alpha(theme.palette.common.black, 0.05),
    borderRadius: theme.shape.borderRadius,
  },
  collapsed: {
    margin: theme.spacing(0, 1, 0, 1.5),
  },
  main: {
    width: "80vw",
    margin: theme.spacing(0.5),
    padding: theme.spacing(0.5),
  },
  full: {
    width: "99.5%",
    textAlign: "start",
    verticalAlign: "middle",
    display: "block",
  },
  sticky: {
    position: "sticky",
    top: 20,
    maxHeight: "80vh",
    marginRight: theme.spacing(1.5),
  },
  warning: {
    color: "red",
    fontSize: theme.typography.fontSize / 2,
  },
  red: {
    color: "red",
  },
}));

const WelcomeToNoTeX = () => {
  const classes = useStyles();

  return (
    <div>
      <Typography variant={"h2"}>Welcome To NoTeX</Typography>
      <Typography variant={"body1"} gutterBottom>
        Welcome to NoTeX. This App aims to create document interactivelly.
        <br />
        NoTeX means "EXtended Note" and "Not only TeX". you can enjoy NoTeX
        without instructions, but recommending read it a little for effetive
        use.
        <br />
        That is because it's not a best option to everyone.
      </Typography>
      <Typography variant={"h3"}>What is NoTeX?</Typography>
      <Typography variant={"body1"} gutterBottom>
        I always write document with thinking that structure and sometimes
        creating a pdf by LaTeX.
        <br />
        It takes me some time and bothering me.
        <br />
        That is the reason why I develop NoTeX. You are now free of such pain.
      </Typography>
      <Typography variant={"h3"}>What can we do?</Typography>
      <Typography variant={"body1"} component={"div"} gutterBottom>
        NoTeX enables you interactivelly to
        <ul>
          <li>separate section and enumerate them</li>
          <li>arrange word, such as coloring, bolding, ...etc</li>
          <li>create a graph, list, table and arrange them</li>
          <li>
            search your documents (created via NoTeX) by tags and update them
          </li>
        </ul>
      </Typography>
      <Typography variant={"subtitle2"} className={classes.warning}>
        Note!:
      </Typography>
      <Typography variant={"body2"} className={classes.warning}>
        This App still being developped. above instructions can change in the
        future and there are still some function not supported.
      </Typography>
    </div>
  );
};

const UsageOfWrite = () => {
  const classes = useStyles();

  return (
    <div>
      <Typography variant={"h2"}>Usage: Write</Typography>
      <Typography variant={"h3"}>File Attribute</Typography>
      <Typography variant={"body1"} gutterBottom>
        write something
      </Typography>
      <Typography variant={"h3"}>Section</Typography>
      <Typography variant={"body1"} gutterBottom>
        If you write down a new file, there will be a section which display
        "title".
        <span className={classes.red}>Section</span> is a important concept. It
        means normally "section", and can have sections, paragraphs, lists,
        tables, graphs as children. Click the "Controller" being put on the left
        side. you will see such orders. Additionally, you can see the "delete"
        button. That executes a literally operation.
      </Typography>
      <Typography variant={"h3"}>Pragraph</Typography>
      <Typography variant={"body1"} gutterBottom>
        "Paragraph" is also significant. It can have one title (that can be
        empty, but no more than two). If you want to write a word, you should
        click "edit". Then, you will be able to edit that contents.
        <br />
        You can arrange words with separating them by "|", and click the your
        aim.
        <br />
        You can write LaTeX statement with covering them by "\m (statement) \m".
        "\m" means 'inline' Math mode and "\md" means 'display' Math mode.
        <br />
        Additionally, you can add link with markdown "\link[text](link)".
        "\link" means link, [text] means displayed text, and (link) is actuall
        link.
        <br />
        If you write "\link[bitcoin](https://bitcoin.org/bitcoin.pdf)", then it
        will be compiled to{" "}
        <a
          href={"https://bitcoin.org/bitcoin.pdf"}
          target={"_blank"}
          rel={"noreferrer"}
        >
          bitcoin
        </a>
        .
      </Typography>
      <Typography variant={"h3"}>Graph</Typography>
      <Typography variant={"body1"} component={"div"} gutterBottom>
        Graph is a optional component. If you write some mathematical article,
        it will help your writing. you can use csv or deciding function as a way
        of create it. The following funnctions are supported.
        <ul>
          <li>sin/cos/tan</li>
          <li>asin(arcsin)/acos(arccos)/atan(arctan)</li>
          <li>sinh/cosh/tanh(hyperbolics)</li>
          <li>log</li>
          <li>sqrt(square root)</li>
          <li>floor/ceil</li>
          <li>abs(absolute value of number)</li>
          <li>random (note: literally random value by any previewing)</li>
          <li>and +, -, *, /, %, ^</li>
        </ul>
      </Typography>
      <Typography variant={"h3"}>List, Table</Typography>
      <Typography variant={"body1"} gutterBottom>
        They are very simple to use, take it.
      </Typography>
    </div>
  );
};

const UsageOfBrowse = () => {
  return (
    <div>
      <Typography variant={"h2"}>Usage: Browse</Typography>
      <Typography variant={"body1"} gutterBottom>
        You can see the list of documents you have created with NoTeX. touch a
        file name, and select an operation among "view", "edit", "delete".
        <br />
        If your documents are too many and bother you, filter them by tags.
      </Typography>
    </div>
  );
};

const UsageOfView = () => {
  return (
    <div>
      <Typography variant={"h2"}>Usage: View</Typography>
      <Typography variant={"body1"} gutterBottom>
        You can see the contents of document. Check it and export as PDF if
        necessary.
      </Typography>
    </div>
  );
};

const Home = () => {
  const classes = useStyles();
  let { url } = useRouteMatch();

  return (
    <Grid container direction={"row"}>
      <Grid item className={classes.controller}>
        <Button component={Link} to={`${url}`}>
          <ArrowRightRounded /> Welcome
        </Button>
        <CollapsedController surface={<>Usage</>}>
          <Button
            component={Link}
            to={`${url}/write`}
            classes={{ root: classes.full }}
          >
            <ArrowRightRounded /> Write Down
          </Button>
          <Button
            component={Link}
            to={`${url}/browse`}
            classes={{ root: classes.full }}
          >
            <ArrowRightRounded /> Browse
          </Button>
          <Button
            component={Link}
            to={`${url}/view`}
            classes={{ root: classes.full }}
          >
            <ArrowRightRounded /> View
          </Button>
        </CollapsedController>
      </Grid>
      <Grid item className={classes.main}>
        <Route exact path={`${url}`}>
          <WelcomeToNoTeX />
        </Route>
        <Route path={`${url}/write`}>
          <UsageOfWrite />
        </Route>
        <Route path={`${url}/browse`}>
          <UsageOfBrowse />
        </Route>
        <Route path={`${url}/view`}>
          <UsageOfView />
        </Route>
      </Grid>
    </Grid>
  );
};

export default Home;
