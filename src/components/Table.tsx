import React, { useEffect } from "react";
import { useAppDispatch, useNotexData } from "../redux/hooks";
import { TableD3 } from "./D3";
import { TableType, TableData, Write } from "../redux/write";
import useModal from "../context/Modal";

type TableProps = {id: number; edit: boolean} & TableType
const Table: React.FC<TableProps> = ({ id, type, uuid, name }) => {
  const notexData = useNotexData(uuid);
  const tableData =
    notexData?.type_ === "table" ? (notexData as TableData) : undefined;
  const dispatch = useAppDispatch();
  const handleCell = tableData
    ? (i: number, j: number, arg: string) => {
        const cells = tableData.data.cells;
        dispatch(
          Write.emitNotexData({
            id: uuid,
            data: {
              ...tableData,
              data: {
                ...tableData.data,
                cells: [
                  ...cells.slice(0, i),
                  [...cells[i].slice(0, j), arg, ...cells[i].slice(j + 1)],
                  ...cells.slice(i + 1),
                ],
              },
            },
          })
        );
      }
    : (i: number, j: number, arg: string) => {};

  return tableData ? (
    <TableD3
      row_num={tableData.data.row_num}
      column_num={tableData.data.column_num}
      headers={tableData.data.headers}
      cells={tableData.data.cells}
      mode={"edit"}
      handleCell={handleCell}
    />
  ) : (
    <></>
  );
};

export default Table;
