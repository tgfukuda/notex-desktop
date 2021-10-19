import React, {
  useState,
  useContext,
  createContext,
  useMemo,
  useEffect,
} from "react";
import { Close } from "@material-ui/icons";

const ModalContext = createContext([() => {}, false, () => {}, () => {}] as [
  React.Dispatch<React.SetStateAction<any>>,
  boolean,
  (modalContents: JSX.Element, handler: () => void) => void,
  () => void
]);

export const useModalInner = () => {
  const [hidden, setHidden] = useState(true);
  const [ref, set] = useState<JSX.Element | null>(null);
  const call = (modalContents: JSX.Element, handler: () => void) => {
    setHidden(false);
    set(modalContents);
    handler();
  };
  const exit = () => {
    setHidden(true);
    set(null);
  };

  return {
    hidden: hidden,
    contentsRef: ref,
    set: set,
    call: call,
    exit: exit,
  };
};

export const ModalContextProvider: React.FC = ({ children }) => {
  const { contentsRef, hidden, call, exit, set } = useModalInner();
  const value: [
    React.Dispatch<React.SetStateAction<JSX.Element | null>>,
    boolean,
    (modalContents: JSX.Element, handler: () => void) => void,
    () => void
  ] = useMemo(() => [set, hidden, call, exit], []);

  return (
    <ModalContext.Provider value={value}>
      <div className={"overlay" + (hidden ? " hidden" : "")}>
        <div className={"modal"}>
          <div className={"modal-controller"}>
            <button onClick={exit}>
              <Close />
            </button>
          </div>
          <div className={"modal-contents"}>{contentsRef}</div>
        </div>
      </div>
      {children}
    </ModalContext.Provider>
  );
};

const useModal = (
  modalContents: JSX.Element,
  deps: unknown[],
  onCall?: () => void
) => {
  const [set, hidden, innerCall, exit] = useContext(ModalContext);

  useEffect(() => {
    console.log(hidden, modalContents);
    if (hidden) set(modalContents);
    else set(null);
  }, [hidden, ...deps]);

  return [
    set,
    hidden,
    () => innerCall(modalContents, onCall ? onCall : () => {}),
    exit,
  ] as [
    React.Dispatch<React.SetStateAction<any>>,
    boolean,
    () => void,
    () => void
  ];
};

export default useModal;
