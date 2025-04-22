interface IMessage {
  id: string;
  content: string;
  senderUserId?: string | null;
  senderUsername?: string | null;
  receiverUserId?: string | null;
  receiverUsername?: string | null;
  sentAtUtc: string;
}
