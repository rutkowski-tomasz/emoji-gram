export interface IMessage {
  id: string;
  content: string;
  senderUserId: string;
  senderUsername: string;
  receiverUserId: string | null;
  receiverUsername: string | null;
  sentAtUtc: string;
  type: MessageType;
}

export enum MessageType {
  Connected,
  Disconnected,
  Message,
  Whisper,
}
