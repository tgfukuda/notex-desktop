/** @jsxImportSource @emotion/react */
import React, { useRef, useEffect, useState } from "react";
import { css } from "@emotion/react";
import Markdown from "../components/Markdown";
import { Meta } from "../redux/write";
import { Event as TauriEvent } from "@tauri-apps/api/event";
import { getCurrent } from "@tauri-apps/api/window";

type PayloadPDF = {
  meta: Meta;
  body: string;
};

/**
 * this component only used by hidden webview
 */
const Listner: React.FC = () => {
  const container = useRef(null);
  const [state, setState] = useState<PayloadPDF | undefined>(undefined);
  const hiddenWindow = getCurrent();
  hiddenWindow
    .once("print", (e: TauriEvent<PayloadPDF>) => {
      setState(e.payload);
    })
    .then(() => {})
    .catch((err) =>
      hiddenWindow
        .emit("ready", "error: " + String(err))
        .then(() => {})
        .catch(() => {})
    );

  useEffect(() => {
    if (state)
        hiddenWindow
          .emit("ready", "success")
          .then(() => {})
          .catch(() => {});
  })

  return state === undefined ? (
    <div
      css={css`
        width: 100vw;
        font-size: 24px;
      `}
    >
      No Source Provided
    </div>
  ) : (
    <div
      css={css`
        width: 100vw;
      `}
      ref={container}
    >
      <Markdown md={state.body} container={container} />
    </div>
  );
};

export default Listner;
