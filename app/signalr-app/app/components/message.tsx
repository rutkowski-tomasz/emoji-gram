// app/components/Message.tsx

interface MessageProps {
  msg: IMessage;
  loginUsername: string;
  onUsernameClick: (username: string) => void;
}

export default function Message({ msg, loginUsername, onUsernameClick }: MessageProps) {

  const formatMessage = (msg: IMessage): string => {
    if (msg.senderUsername && !msg.receiverUsername) {
      return `${msg.senderUsername}: ${msg.content}`;
    } else if (msg.senderUsername && msg.receiverUsername && !msg.receiverUserId) {
      return `${msg.senderUsername} ${msg.content.replace(msg.senderUsername, '').trim()}`;
    } else if (msg.senderUsername && msg.receiverUsername) {
      const isToMe = msg.receiverUsername === loginUsername;
      return isToMe ? `whispered to you: ${msg.content}` : `${msg.senderUsername} whispered: ${msg.content}`;
    }
    return msg.content;
  };

  return (
    <li key={msg.id} className="text-gray-700 dark:text-gray-200">
      {msg.senderUsername && (
        <span
          onClick={() => onUsernameClick(msg.senderUsername as string)}
          className="cursor-pointer font-semibold hover:underline"
        >
          {msg.senderUsername}
        </span>
      )}
      {formatMessage(msg)}
    </li>
  );
}