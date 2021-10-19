import React, { useEffect, useState } from "react";
import { ImageType, ImageData, Write } from "../redux/write";
import { useAppDispatch, useNotexData } from "../redux/hooks";
import useModal from "../context/Modal";

type ImageProps = { id: number; edit: boolean } & ImageType;
const Image: React.FC<ImageProps> = ({ id, type, uuid, name }) => {
  const notexData = useNotexData(uuid);
  const imageData =
    notexData?.type_ === "image" ? (notexData as ImageData) : undefined;
  const [uri, setUri] = useState(
    imageData && "uri" in imageData.data ? imageData.data.uri : ""
  );
  const dispatch = useAppDispatch();
  const emit = () => {
    const defaultData = imageData || {
      type_: "image",
      name: "",
    };
    dispatch(
      Write.emitNotexData({
        id: uuid,
        data: {
          ...defaultData,
          data: {
            uri: uri,
          },
        },
      })
    );
    exit();
  };
  const [, , callModal, exit] = useModal(
    <>
      <input value={uri} onChange={(e) => setUri(e.target.value)} />
      <button onClick={emit} className={"success"}>
        emit
      </button>
    </>,
    [uri]
  );

  useEffect(() => {
    if (!imageData) callModal();
  });

  return imageData ? (
    "uri" in imageData.data ? (
      <img
        src={imageData.data.uri}
        alt={"Source URI is not available now"}
        width={"100%"}
      />
    ) : (
      <div>Unsupported</div>
    )
  ) : (
    <></>
  );
};

export default Image;
