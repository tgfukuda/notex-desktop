/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import { Link, Route, useRouteMatch } from "react-router-dom";
import { css, useTheme, SerializedStyles } from "@emotion/react";
import { Button, Grid, Typography, Collapse } from "@mui/material";
import { ArrowRightRounded, ArrowDropDownRounded } from "@mui/icons-material";

const full = css({
  "& .MuiButton-root": {
    width: "99.5%",
    textAlign: "start",
    verticalAlign: "middle",
    display: "block",
  },
});

type Props = {
  surface?: JSX.Element;
  timeout?:
    | number
    | {
        appear?: number;
        enter?: number;
        exit?: number;
      };
  orientation?: "vertical" | "horizontal";
  openIcon?: JSX.Element;
  closeIcon?: JSX.Element;
  buttonCss?: SerializedStyles;
  bodyCss?: SerializedStyles;
};

const CollapsedController: React.FC<Props> = ({
  surface,
  children,
  orientation = "vertical",
  openIcon = <ArrowRightRounded />,
  closeIcon = <ArrowDropDownRounded />,
  buttonCss,
  bodyCss,
}) => {
  const [display, setDisplay] = useState(false);
  const handleDisplay = () => setDisplay(!display);

  return (
    <>
      <Button onClick={handleDisplay} css={buttonCss ?? {}}>
        {display ? closeIcon : openIcon}
        {surface}
      </Button>
      <Collapse
        orientation={orientation}
        in={display}
        timeout={"auto"}
        css={bodyCss}
      >
        {children}
      </Collapse>
    </>
  );
};

const WelcomeToNoTeX: React.FC = () => {
  const theme = useTheme();
  const warning = css({
    color: "red",
    fontSize: theme.typography.fontSize / 2,
  });

  return (
    <div>
      <Typography variant={"h2"}>Welcome To NoTeX</Typography>
      <Typography variant={"body1"} gutterBottom>
        Welcome to NoTeX. This App aims to create document interactivelly.
        <br />
        NoTeX enables you to write document with markdown and additional
        extention. you can enjoy NoTeX without any instructions, but
        recommending read it a little for effetive use.
      </Typography>
      <Typography variant={"h3"}>What is NoTeX?</Typography>
      <Typography variant={"body1"} gutterBottom>
        I always write document with thinking that structure and sometimes
        creating a pdf by LaTeX.
        <br />
        It takes me time and bothering me.
        <br />
        That is the reason why I develop NoTeX. You are now free of such pain.
      </Typography>
      <Typography variant={"h3"}>What can we do?</Typography>
      <Typography variant={"body1"} component={"div"} gutterBottom>
        NoTeX enables you interactivelly to
        <ul>
          <li>
            write{" "}
            <a
              href={"https://commonmark.org/help/"}
              target={"_blank"}
              rel={"noreferrer"}
            >
              markdown
            </a>{" "}
            powered by
            <a
              href={"https://github.com/remarkjs/react-markdown"}
              target={"_blank"}
              rel={"noreferrer"}
            >
              react-markdown
            </a>
          </li>
          <li>
            write LaTeX powered by{" "}
            <a
              href={"https://katex.org/docs/supported.html"}
              target={"_blank"}
              rel={"noreferrer"}
            >
              KaTeX
            </a>{" "}
          </li>
          <li>
            write graph powered by{" "}
            <a href={"https://d3js.org/"} target={"_blank"} rel={"noreferrer"}>
              d3
            </a>
          </li>
          <li>
            write diagrams and visualizations powered by{" "}
            <a
              href={"https://mermaid-js.github.io/mermaid/#/"}
              target={"_blank"}
              rel={"noreferrer"}
            >
              mermaid
            </a>
          </li>
        </ul>
      </Typography>
      <Typography variant={"subtitle2"} css={warning}>
        Note!:
      </Typography>
      <Typography variant={"body2"} css={warning}>
        This App still being developped. above instructions can change in the
        future.
      </Typography>
    </div>
  );
};

const UsageOfWrite: React.FC = () => {
  return (
    <div>
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
    </div>
  );
};

const UsageOfBrowse: React.FC = () => {
  return (
    <div>
      <Typography variant={"h2"}>Usage: Browse</Typography>
      <Typography variant={"body1"} gutterBottom>
        You can see the list of documents you have created with Notex. touch a
        file name, and select an operation among "view", "edit", "delete".
        <br />
        If your documents are too many and bother you, filter them by tags.
      </Typography>
    </div>
  );
};

const UsageOfView: React.FC = () => {
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

const Home: React.FC = () => {
  const theme = useTheme();
  let { url } = useRouteMatch();

  return (
    <Grid container direction={"row"}>
      <Grid
        item
        css={css({
          width: "15%",
          margin: theme.spacing(0.5),
          padding: theme.spacing(0),
          backgroundColor: "rgba(48, 48, 48, 0.05)",
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <Button component={Link} to={`${url}`}>
          <ArrowRightRounded /> Welcome
        </Button>
        <CollapsedController surface={<>Usage</>}>
          <Button component={Link} to={`${url}/write`} css={full}>
            <ArrowRightRounded /> Write Down
          </Button>
          <Button component={Link} to={`${url}/browse`} css={full}>
            <ArrowRightRounded /> Browse
          </Button>
          <Button component={Link} to={`${url}/view`} css={full}>
            <ArrowRightRounded /> View
          </Button>
        </CollapsedController>
      </Grid>
      <Grid
        item
        css={css({
          width: "80%",
          margin: theme.spacing(0.5),
          padding: theme.spacing(0.5),
        })}
      >
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
