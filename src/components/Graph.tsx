import React, { useEffect, useState } from "react";
import { GraphType, GraphData, Write } from "../redux/write";
import { useNotexData, useAppDispatch } from "../redux/hooks";
import { useSnackHandler } from "../context/SnackHandler";
import { FunctionD3 } from "./D3";
import useModal from "../context/Modal";

type GraphProps = {id: number; edit: boolean} & GraphType
const Graph: React.FC<GraphProps> = ({ id, type, uuid, name }) => {
  const notexData = useNotexData(uuid);
  const graphData =
    notexData?.type_ === "graph" ? (notexData as GraphData) : undefined;
  const dispatch = useAppDispatch();
  const { handleErr } = useSnackHandler();
  const [func, setFunc] = useState(
    graphData && "func" in graphData.data ? graphData.data.func : ""
  );
  const [domainIn, setDomainIn] = useState(
    graphData && "func" in graphData.data
      ? {
        min: String(graphData.data.domain.min),
        max: String(graphData.data.domain.max),
        division: String(graphData.data.domain.division)
      }
      : { min: "0", max: "1", division: "100" }
  );
  const emit = () => {
    const defaultData = graphData || {
      type_: "graph",
      name: "",
    };
    if (!Number.isNaN(parseFloat(domainIn.min)) && !Number.isNaN(parseFloat(domainIn.max)) && !Number.isNaN(parseInt(domainIn.division))) {
      dispatch(
        Write.emitNotexData({
          id: uuid,
          data: {
            ...defaultData,
            data: {
              func: func,
              domain: {
                min: parseInt(domainIn.min),
                max: parseFloat(domainIn.max),
                division: parseInt(domainIn.division)
              },
            },
          },
        })
      );
      exit();
    }
    else {
      console.error("min, max, division must be vaild")
    }
  };
  const [, , callModal, exit] = useModal(
    <>
      <input
        value={func}
        onChange={(e) => {
          setFunc(e.target.value);
        }}
      />
      <input
        value={domainIn.min}
        onChange={(e) => {
          setDomainIn({
            ...domainIn,
            min: e.target.value,
          });
        }}
      />
      <input
        value={domainIn.max}
        onChange={(e) => {
          setDomainIn({
            ...domainIn,
            max: e.target.value,
          });
        }}
      />
      <input
        value={domainIn.division}
        onChange={(e) => {
          setDomainIn({
            ...domainIn,
            division: e.target.value,
          });
        }}
      />
      <button onClick={emit} className={"success"}>
        emit
      </button>
    </>,
    [func, domainIn]
  );

  useEffect(() => {
    if (!graphData) callModal();
  }, []);

  return graphData ? (
    "func" in graphData.data ? (
      <FunctionD3
        func={graphData.data.func}
        domain={graphData.data.domain}
        handleErr={handleErr}
      />
    ) : (
      <div>Unsupported</div>
    )
  ) : (
    <></>
  );
};

export default Graph;
