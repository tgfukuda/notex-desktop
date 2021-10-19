import React, { useState } from "react";
import { Button, Collapse } from "@material-ui/core";
import { ArrowRightRounded, ArrowDropDownRounded } from "@material-ui/icons";

type Props = {
  surface: JSX.Element;
  timeout?:
    | number
    | {
        appear?: number;
        enter?: number;
        exit?: number;
      };
  openIcon?: JSX.Element;
  closeIcon?: JSX.Element;
};

const CollapsedController: React.FC<Props> = ({
  surface,
  children,
  timeout = 100,
  openIcon = <ArrowRightRounded />,
  closeIcon = <ArrowDropDownRounded />,
}) => {
  const [display, setDisplay] = useState(false);
  const handleDisplay = () => setDisplay(!display);

  return (
    <>
      <Button onClick={handleDisplay}>
        {display ? closeIcon : openIcon}
        {surface}
      </Button>
      <Collapse in={display} timeout={timeout}>
        {children}
      </Collapse>
    </>
  );
};

export default CollapsedController;
