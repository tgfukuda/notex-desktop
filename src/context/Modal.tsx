import React, {
  useState,
  useContext,
  createContext,
  useEffect,
  useRef,
} from "react";

const ModalContext = createContext([() => {}, false, () => {}, () => {}] as [
  React.Dispatch<React.SetStateAction<any>>,
  boolean,
  (modalContents: JSX.Element, handler: () => void) => void,
  () => void
]);

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
      <div className={"overlay" + (hidden ? " hidden" : "")} onClick={exit}>
        <div className={"modal"} onClick={(e) => e.stopPropagation()}>
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
