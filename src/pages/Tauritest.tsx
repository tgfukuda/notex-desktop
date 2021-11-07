import React, { useCallback, useEffect, useRef, useState } from "react";
import useModal from "../context/Modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

const Modal = ({
  input,
  setModal,
  setInput,
}: {
  input: string;
  setModal: any;
  setInput: any;
}) => {
  return (
    <div>
      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setModal(
            <Modal
              input={e.target.value}
              setInput={setInput}
              setModal={setModal}
            />
          );
        }}
      />{" "}
      hello
    </div>
  );
};

const Tauritest: React.FC = () => {
  const [input, setInput] = useState("");
  const [setModal, hidden, call, exit] = useModal([input]);
  useEffect(() => {
    setModal(<Modal input={input} setModal={setModal} setInput={setInput} />);
    call();
  }, []);

  return <div></div>;
};

export default Tauritest;
