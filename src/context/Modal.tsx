/** @jsxImportSource @emotion/react */
import React, {
  useState,
  useContext,
  createContext,
  useEffect,
  useRef,
} from "react";
import { css } from "@emotion/react";

const ModalContext = createContext([() => {}, false, () => {}, () => {}] as [
  React.Dispatch<React.SetStateAction<any>>,
  boolean,
  (modalContents: JSX.Element, handler: () => void) => void,
  () => void
]);

const overlay = css`
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(100, 100, 100, 0.8);
  z-index: 2147483640;
`;
const modalMain = css`
  position: fixed;
  left: 10%;
  top: 20%;
  width: 80%;
  height: 60%;
  padding: 0 auto;
  background-color: papayawhip;
  z-index: 2147483646;
`;
export const ModalContextProvider: React.FC = ({ children }) => {
  const [hidden, setHidden] = useState(true);
  const [modal, setModal] = useState<JSX.Element | null>(null);
  const call = (modalContents: JSX.Element, handler: () => void) => {
    setHidden(false);
    setModal(modalContents);
    handler();
  };
  const exit = () => {
    setHidden(true);
    setModal(null);
  };
  const value: [
    React.Dispatch<React.SetStateAction<JSX.Element | null>>,
    boolean,
    (modalContents: JSX.Element, handler: () => void) => void,
    () => void
  ] = [setModal, hidden, call, exit];

  return (
    <ModalContext.Provider value={value}>
      <div
        onClick={exit}
        css={css`
          ${overlay}
          display: ${hidden ? "none" : "block"}
        `}
      >
        <div onClick={(e) => e.stopPropagation()} css={modalMain}>
          {modal}
        </div>
      </div>
      {children}
    </ModalContext.Provider>
  );
};

const useModal = (deps: unknown[], onCall?: () => void) => {
  const contents = useRef<JSX.Element | null>(null);
  const [setModal, hidden, innerCall, exit] = useContext(ModalContext);

  /** once setModal set, never change it and no need to add deps (React.useState) */
  useEffect(() => {
    setModal(contents.current);
    //eslint-disable-next-line
  }, [hidden, ...deps]);

  return [
    (jsx: JSX.Element) => {
      contents.current = jsx;
    },
    hidden,
    () =>
      innerCall(contents.current ?? <React.Fragment />, onCall ?? (() => {})),
    exit,
  ] as [(jsx: JSX.Element) => void, boolean, () => void, () => void];
};

export default useModal;
