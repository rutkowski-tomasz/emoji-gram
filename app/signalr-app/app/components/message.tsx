// app/components/Message.tsx

import type { JSX } from "react";
import { MessageType, type IMessage } from "~/models/message";

interface MessageProps {
  msg: IMessage;
  loginUsername: string;
  onUsernameClick: (username: string) => void;
}

export default function Message({ msg, loginUsername, onUsernameClick }: MessageProps) {

  const buildUserLink = (username: string) =>(
    <span
      onClick={() => onUsernameClick(username)}
      className="cursor-pointer font-semibold hover:underline"
    >
      {username}
    </span>
  );

  const buildMessage = (content: JSX.Element, isSystemMessage: boolean) => {
    if (isSystemMessage) {
      return (<li key={msg.id} className="text-gray-400 dark:text-gray-500 italic text-sm">
        {content}
      </li>);
    }
    return <li key={msg.id} className="text-gray-700 dark:text-gray-200">{content}</li>;
  };

  if (msg.type === MessageType.Connected) {
    return buildMessage(<>{buildUserLink(msg.senderUsername!)} connected</>, true);
  }
  if (msg.type === MessageType.Disconnected) {
    return buildMessage(<>{buildUserLink(msg.senderUsername!)} disconnected</>, true);
  }
  if (msg.type === MessageType.Message) {
    return buildMessage(<>{buildUserLink(msg.senderUsername!)}: {msg.content}</>, false);
  }
  if (msg.type === MessageType.Whisper && msg.receiverUsername === loginUsername) {
    return buildMessage(<>{buildUserLink(msg.senderUsername!)} whispered to you: {msg.content}</>, false);
  }
  if (msg.type === MessageType.Whisper) {
    return buildMessage(<>you whispered to {buildUserLink(msg.senderUsername!)}: {msg.content}</>, false);
  }
  return <></>;
}