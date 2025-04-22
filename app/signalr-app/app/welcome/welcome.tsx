import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { z } from "zod";
import Message from '@/components/Message';
import SignIn from '@/components/SignIn';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast, Toaster } from "sonner";

const emojiOnlySchema = z.string().emoji();

export function Welcome() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [message, setMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const handleSignIn = (token: string) => {
    setAccessToken(token);
    setIsLoggedIn(true);
    sessionStorage.setItem('accessToken', token);
    console.log("Logged in from Welcome!");
  };

  const logout = () => {
    setAccessToken(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('accessToken');
    setMessages([]);
    setConnection(null);
    console.log("Logged out");
  };

  useEffect(() => {
    const storedToken = sessionStorage.getItem('accessToken');
    if (storedToken) {
      setAccessToken(storedToken);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !accessToken) {
      return;
    }

    const connect = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:8001/hub", {
        accessTokenFactory: () => accessToken,
      })
      .withAutomaticReconnect()
      .build();

    connect.on("ReceiveMessage", (receivedMessage: IMessage) => {
      setMessages((prevMessages) => {
        if (!prevMessages.some((msg) => msg.id === receivedMessage.id)) {
          return [...prevMessages, receivedMessage];
        }
        return prevMessages;
      });
    });

    connect.on("ReceiveError", (errorMessage: string) => {
      toast({ title: "Error", description: errorMessage });
    });

    connect
      .start()
      .then(() => {
        console.log("Connected to SignalR hub");
        setConnection(connect);
      })
      .catch((err) => console.error("Error connecting to SignalR hub:", err));

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [isLoggedIn, accessToken]);

  useEffect(() => {
    if (!connection || !accessToken) {
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch("http://localhost:8001/history", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch history:", response.status);
          toast({ title: "Error", description: "Failed to fetch message history." });
          return;
        }

        const historyMessages = (await response.json()) as IMessage[];
        setMessages((prevMessages) => {
          const combined = [...prevMessages, ...historyMessages];
          const uniqueMessages = Array.from(new Map(combined.map(message => [message.id, message])).values());
          return uniqueMessages.sort((a, b) => new Date(a.sentAtUtc).getTime() - new Date(b.sentAtUtc).getTime());
        });
      } catch (error) {
        console.error("Error fetching history:", error);
        toast({ title: "Error", description: "Error fetching message history." });
      }
    };

    fetchHistory();
  }, [connection, accessToken]);

  const sendMessage = async () => {
    if (!isLoggedIn) {
      toast({ title: "Error", description: "Please log in to send messages." });
      return;
    }

    if (!connection) {
      toast({ title: "Error", description: "Not connected to the chat hub." });
      return;
    }

    if (!message.trim()) {
      return;
    }

    const validationResult = emojiOnlySchema.safeParse(message);
    if (!validationResult.success) {
      toast({ title: "Error", description: "Message must consist of only emojis and whitespace." });
      return;
    }

    try {
      if (selectedRecipient) {
        await connection.invoke("SendWhisper", selectedRecipient, message);
      } else {
        await connection.invoke("SendMessage", message);
      }
      setMessage("");
      setSelectedRecipient(null);
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast({ title: "Error", description: "Error sending message." });
    }
  };

  const handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && event.currentTarget === messageInputRef.current) {
      sendMessage();
    }
  };

  const handleUsernameClick = (username: string) => {
    setSelectedRecipient(username);
  };

  const clearSelectedRecipient = () => {
    setSelectedRecipient(null);
  };

  if (!isLoggedIn) {
    return (
      <main className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <SignIn onLogin={handleSignIn} />
        <Toaster />
      </main>
    );
  }

  return (
    <main className="fixed top-0 left-0 w-full h-full flex flex-col justify-between items-center bg-gray-100 dark:bg-gray-900 p-4">
      <header className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">EmojiGram</h1>
      </header>
      <div className="flex-1 max-w-[500px] w-full">
        <Card className="h-full flex flex-col justify-between rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto h-[calc(100vh - 200px)]">
            <ScrollArea className="h-full">
              <ul className="space-y-2">
                {messages.map((msg) => <Message key={msg.id} msg={msg} loginUsername={accessToken?.split('.')[0]} onUsernameClick={handleUsernameClick} />)}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="max-w-[500px] w-full space-y-2">
        {selectedRecipient && (
          <div className="flex items-center">
            <span>Whispering to: {selectedRecipient}</span>
            <Button variant="secondary" size="sm" onClick={clearSelectedRecipient} className="ml-2">
              x
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            ref={messageInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleEnterPress}
            placeholder={selectedRecipient ? `Whisper to ${selectedRecipient}` : "Enter your message"}
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
      {isLoggedIn && (
        <Button
          onClick={logout}
          className="absolute top-4 right-4"
          variant="destructive"
          size="sm"
        >
          Sign Out
        </Button>
      )}
      <Toaster />
    </main>
  );
}