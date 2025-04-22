// app/chat/chat.tsx
'use client';

import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { z } from "zod";
import Message from '@/components/Message';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAuth } from "~/context/AuthContext";

interface IMessage {
  id: string;
  content: string;
  sender: string;
  recipient?: string;
  sentAtUtc: string;
}

const emojiOnlySchema = z.string().emoji();

export function Chat() {
  const { getToken, logout } = useAuth();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [message, setMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const accessToken = getToken();

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Effect to scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!accessToken) {
      setConnection(null);
      setMessages([]);
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
      toast.error(errorMessage);
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
  }, [accessToken]);

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
          toast.error("Failed to fetch message history.");
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
        toast.error("Error fetching message history.");
      }
    };

    fetchHistory();
  }, [connection, accessToken]);

  const sendMessage = async () => {
    if (!accessToken) {
      toast.error("Please log in to send messages.");
      return;
    }

    if (!connection) {
      toast.error("Not connected to the chat hub.");
      return;
    }

    if (!message.trim()) {
      return;
    }

    const validationResult = emojiOnlySchema.safeParse(message);
    if (!validationResult.success) {
      toast.error("Message must consist of only emojis and whitespace.");
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
      toast.error("Error sending message.");
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

  return (
    <main className="fixed top-0 left-0 w-full h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {accessToken && (
        <>
          <div className="relative w-full flex-1 overflow-hidden">
            <Button
              onClick={logout}
              className="absolute top-4 right-4 z-10"
              variant="outline"
              size="sm"
            >
              Sign Out
            </Button>
            <ScrollArea className="w-full h-full p-4" ref={scrollAreaRef}>
              <ul className="space-y-2">
                {messages.map((msg) => (
                  <Message
                    key={msg.id}
                    msg={msg}
                    loginUsername={accessToken?.split('.')[0]}
                    onUsernameClick={handleUsernameClick}
                  />
                ))}
                <div ref={messagesEndRef} /> {/* Empty div at the end to scroll to */}
              </ul>
            </ScrollArea>
          </div>
          <div className="w-full max-w-full py-4 px-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-[500px] mx-auto space-y-2">
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
          </div>
        </>
      )}
    </main>
  );
}