import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";

interface Message {
  id: string;
  content: string;
  senderUserId?: string | null;
  senderUsername?: string | null;
  receiverUserId?: string | null;
  receiverUsername?: string | null;
  sentAtUtc: string;
}

export function Welcome() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [whisperRecipient, setWhisperRecipient] = useState("");
  const [whisperMessage, setWhisperMessage] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const messageInputRef = useRef<HTMLInputElement>(null);

  const KeyCloak_HostAddress = "http://localhost:8080";
  const realm = "myrealm";
  const clientId = "myclient";

  const login = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      alert("Please enter username and password.");
      return;
    }
    try {
      const response = await fetch(
        `${KeyCloak_HostAddress}/realms/${realm}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "password",
            client_id: clientId,
            username: loginUsername,
            password: loginPassword,
          }).toString(),
        }
      );

      if (!response.ok) {
        console.error("Login failed:", response.status);
        setReceiveError(`Login failed: ${response.statusText}`);
        setTimeout(() => setReceiveError(null), 3000);
        return;
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      setIsLoggedIn(true);
      console.log("Logged in successfully");
    } catch (error) {
      console.error("Error during login:", error);
      setReceiveError(`Error during login: ${error}`);
      setTimeout(() => setReceiveError(null), 3000);
    }
  };

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      const connect = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:8001/hub", {
          accessTokenFactory: () => accessToken,
        })
        .withAutomaticReconnect()
        .build();

      connect.on("ReceiveMessage", (receivedMessage: Message) => {
        setMessages((prevMessages) => {
          if (!prevMessages.some((msg) => msg.id === receivedMessage.id)) {
            return [...prevMessages, receivedMessage];
          }
          return prevMessages;
        });
      });

      connect.on("ReceiveError", (errorMessage: string) => {
        setReceiveError(errorMessage);
        setTimeout(() => setReceiveError(null), 3000);
      });

      connect
        .start()
        .then(() => {
          console.log("Connected to SignalR hub");
          setConnection(connect);
        })
        .catch((err) =>
          console.error("Error connecting to SignalR hub:", err)
        );

      return () => {
        connect.stop();
      };
    }
  }, [isLoggedIn, accessToken]);

  useEffect(() => {
    if (connection && accessToken) {
      const fetchHistory = async () => {
        try {
          const response = await fetch("http://localhost:8001/history", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            console.error("Failed to fetch history:", response.status);
            return;
          }

          const historyMessages = (await response.json()) as Message[];
          setMessages((prevMessages) => {
            const combined = [...prevMessages, ...historyMessages];
            const uniqueMessages = Array.from(new Map(combined.map(message => [message.id, message])).values());
            return uniqueMessages.sort((a, b) => new Date(a.sentAtUtc).getTime() - new Date(b.sentAtUtc).getTime());
          });
        } catch (error) {
          console.error("Error fetching history:", error);
        }
      };

      fetchHistory();
    }
  }, [connection, accessToken]);

  const sendMessage = async () => {
    if (connection && message.trim() && isLoggedIn) {
      try {
        await connection.invoke("SendMessage", message);
        setMessage("");
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      } catch (err) {
        console.error("Error sending message:", err);
      }
    } else if (!isLoggedIn) {
      alert("Please log in to send messages.");
    }
  };

  const handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const sendWhisper = async () => {
    if (connection && whisperMessage.trim() && whisperRecipient.trim() && isLoggedIn) {
      setReceiveError(null);
      try {
        await connection.invoke("SendWhisper", whisperRecipient, whisperMessage);
        setWhisperMessage("");
        setWhisperRecipient("");
      } catch (err) {
        console.error("Error sending private message:", err);
        setReceiveError("Failed to send whisper.");
      }
    } else if (!isLoggedIn) {
      alert("Please log in to send private messages.");
    } else if (!whisperRecipient.trim()) {
      alert("Please enter a recipient username.");
    }
  };

  const formatMessage = (msg: Message): string => {
    if (msg.senderUsername && !msg.receiverUsername) {
      return `${msg.senderUsername}: ${msg.content}`;
    } else if (msg.senderUsername && msg.receiverUsername && !msg.receiverUserId) {
      return `${msg.senderUsername} ${msg.content.replace(msg.senderUsername, '').trim()}`;
    } else if (msg.senderUsername && msg.receiverUsername) {
      const isToMe = msg.receiverUsername === whisperRecipient;
      return isToMe ? `whispered to ${msg.receiverUsername}: ${msg.content}` : `${msg.senderUsername} whispered: ${msg.content}`;
    }
    return msg.content;
  };

  if (!isLoggedIn) {
    return (
      <main className="flex items-center justify-center pt-16 pb-4">
        <div className="flex-1 flex flex-col items-center gap-8 min-h-0">
          <header className="flex flex-col items-center gap-4">
            <h1>EmojiGram</h1>
          </header>
          <div className="max-w-[300px] w-full space-y-4 px-4">
            {receiveError && <div className="text-red-500">{receiveError}</div>}
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Username"
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-gray-200"
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:text-gray-200"
            />
            <button
              onClick={login}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Log In
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-12 min-h-0">
        <header className="flex flex-col items-center gap-6">
          <h1>EmojiGram</h1>
        </header>
        <div className="max-w-[500px] w-full space-y-6 px-4">
          {receiveError && <div className="text-red-500">{receiveError}</div>}
          <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <h2>Messages</h2>
            <ul className="space-y-2 overflow-y-auto h-[300px]">
              {messages.map((msg) => (
                <li key={msg.id} className="text-gray-700 dark:text-gray-200">
                  {formatMessage(msg)}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              ref={messageInputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleEnterPress}
              placeholder="Enter your message"
              className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-gray-200"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Send
            </button>
          </div>
          <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <h2>Whisper</h2>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={whisperRecipient}
                onChange={(e) => setWhisperRecipient(e.target.value)}
                placeholder="Recipient Username"
                className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={whisperMessage}
                onChange={(e) => setWhisperMessage(e.target.value)}
                placeholder="Your private message"
                className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-gray-200"
              />
              <button
                onClick={sendWhisper}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Whisper
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}