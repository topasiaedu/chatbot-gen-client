import React from "react";

interface MessageComponentProps {
  message: string;
  direction: string;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  direction,
}: MessageComponentProps) => {
  const isInbound = direction === "inbound";

  return (
    <div
      className={`flex items-start gap-2.5 ${
        isInbound ? "" : "flex-row-reverse"
      } max-w-full break-all`}>
      <div
        className={`flex flex-col gap-1 w-full max-w-[320px] ${
          isInbound ? "" : "items-end"
        }`}>
        <div
          className={`flex flex-col leading-1.5 p-2 border-gray-200 rounded-bl-xl rounded-br-xl max-w-full ${
            isInbound
              ? "bg-gray-100 dark:bg-gray-700 rounded-tr-xl"
              : "bg-green-100 dark:bg-green-700 rounded-tl-xl"
          }`}
          style={{ width: "fit-content" }}>
          {message && (
            <span
              className="text-sm font-normal text-gray-900 dark:text-white"
              style={{ whiteSpace: "pre-wrap" }}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;
