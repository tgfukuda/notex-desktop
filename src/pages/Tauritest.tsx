import React, { useCallback, useEffect, useRef, useState } from "react";
import { TableD3, FunctionD3 } from "../components/D3";
import { makeStyles } from "@material-ui/core";
import useModal from "../context/Modal";

const useStyles = makeStyles({
  full: {
    width: "100%",
    minHeight: "50vh",
    backgroundColor: "red",
    color: "#000000",
  },
});

const Tauritest: React.FC = () => {
  const classes = useStyles();
  const [els, setEls] = useState([] as unknown[]);
  useEffect(() => {
    console.log(els);
  });
  const addEls = (add: unknown) => {
    console.log("add", [...els, add]);
    setEls([...els, add]);
  };
  const deleteEls = () => {
    console.log("delete", els.slice(0, -1));
    setEls(els.slice(0, -1));
  };

  return (
    <div>
      {els}
      <code>jjijjkjokk kokokokkokok kokokokokok</code>
    </div>
  );
};

export default Tauritest;
