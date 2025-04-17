import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import logoDark from "./logo-dark.svg";
import logoLight from "./logo-light.svg";

export function Welcome() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [whisperRecipient, setWhisperRecipient] = useState("");
  const [whisperMessage, setWhisperMessage] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [whisperError, setWhisperError] = useState<string | null>(null);

  const KeyCloak_HostAddress = "http://localhost:8080";
  const realm = "myrealm";
  const clientId = "myclient";
  const username = "testuser";
  const password = "password";

  const login = async () => {
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
            username: username,
            password: password,
          }).toString(),
        }
      );

      if (!response.ok) {
        console.error("Login failed:", response.status);
        return;
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      setIsLoggedIn(true);
      console.log("Logged in successfully");
    } catch (error) {
      console.error("Error during login:", error);
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

      connect.on("ReceiveMessage", (receivedMessage: string) => {
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
      });

      connect.on("ReceiveWhisper", (whisperedMessage: string) => {
        setMessages((prevMessages) => [...prevMessages, `Private: ${whisperedMessage}`]);
      });

      connect.on("WhisperError", (errorMessage: string) => {
        setWhisperError(errorMessage);
        setTimeout(() => setWhisperError(null), 3000);
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

  const sendMessage = async () => {
    if (connection && message.trim() && isLoggedIn) {
      try {
        await connection.invoke("SendMessage", message);
        setMessage("");
      } catch (err) {
        console.error("Error sending message:", err);
      }
    } else if (!isLoggedIn) {
      alert("Please log in to send messages.");
    }
  };

  const sendWhisper = async () => {
    if (connection && whisperMessage.trim() && whisperRecipient.trim() && isLoggedIn) {
      setWhisperError(null);
      try {
        await connection.invoke("SendWhisper", whisperRecipient, whisperMessage);
        setWhisperMessage("");
        setWhisperRecipient("");
      } catch (err) {
        console.error("Error sending private message:", err);
        setWhisperError("Failed to send whisper.");
      }
    } else if (!isLoggedIn) {
      alert("Please log in to send private messages.");
    } else if (!whisperRecipient.trim()) {
      alert("Please enter a recipient email.");
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="flex items-center justify-center pt-16 pb-4">
        <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
          <header className="flex flex-col items-center gap-9">
            <div className="w-[500px] max-w-[100vw] p-4">
              <img
                src={logoLight}
                alt="React Router"
                className="block w-full dark:hidden"
              />
              <img
                src={logoDark}
                alt="React Router"
                className="hidden w-full dark:block"
              />
            </div>
            <h1>Welcome to SignalR App</h1>
          </header>
          <div className="max-w-[300px] w-full space-y-6 px-4">
            <button
              onClick={login}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Log In to Use SignalR
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <div className="w-[500px] max-w-[100vw] p-4">
            <img
              src={logoLight}
              alt="React Router"
              className="block w-full dark:hidden"
            />
            <img
              src={logoDark}
              alt="React Router"
              className="hidden w-full dark:block"
            />
          </div>
          <h1>Welcome to SignalR App</h1>
        </header>
        <div className="max-w-[500px] w-full space-y-6 px-4">
          <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <h2>Messages</h2>
            <ul className="space-y-2">
              {messages.map((msg, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-200">
                  {msg}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
            {whisperError && <div className="text-red-500">{whisperError}</div>}
            <div className="flex items-center gap-4">
              <input
                type="email"
                value={whisperRecipient}
                onChange={(e) => setWhisperRecipient(e.target.value)}
                placeholder="Recipient Email"
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