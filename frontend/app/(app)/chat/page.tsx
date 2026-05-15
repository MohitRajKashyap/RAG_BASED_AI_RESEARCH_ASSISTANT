"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { getChat, getChats, streamChat } from "@/services/chat";
import type { Citation, Message } from "@/types";
import { Sparkles } from "lucide-react";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const chatIdParam = searchParams.get("id");
  const chatId = chatIdParam ? parseInt(chatIdParam, 10) : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [streamCitations, setStreamCitations] = useState<Citation[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const citationsRef = useRef<Citation[]>([]);

  const { data: chatData, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => getChat(chatId!),
    enabled: !!chatId,
  });

  useEffect(() => {
    if (chatData?.messages) {
      setMessages(chatData.messages);
    } else if (!chatId) {
      setMessages([]);
    }
  }, [chatData, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setStreaming(true);
      setStreamContent("");
      setStreamCitations([]);
      citationsRef.current = [];

      let fullContent = "";
      const isNewChat = !chatId;

      await streamChat(text, chatId, null, {
        onCitations: (citations) => {
          citationsRef.current = citations;
          setStreamCitations(citations);
        },
        onToken: (token) => {
          fullContent += token;
          setStreamContent(fullContent);
        },
        onDone: async () => {
          const assistantMsg: Message = {
            id: Date.now() + 1,
            role: "assistant",
            content: fullContent,
            citations: citationsRef.current.length ? citationsRef.current : undefined,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamContent("");
          setStreamCitations([]);
          setStreaming(false);
          await queryClient.invalidateQueries({ queryKey: ["chats"] });
          if (isNewChat) {
            const data = await getChats();
            if (data.chats[0]) {
              router.replace(`/chat?id=${data.chats[0].id}`);
            }
          } else {
            queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
          }
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content: `Error: ${err}`,
              created_at: new Date().toISOString(),
            },
          ]);
          setStreaming(false);
          setStreamContent("");
        },
      });
    },
    [chatId, queryClient, router]
  );

  const displayMessages = [...messages];
  if (streaming && streamContent) {
    displayMessages.push({
      id: -1,
      role: "assistant",
      content: streamContent,
      citations: streamCitations,
      created_at: new Date().toISOString(),
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {isLoading && chatId ? (
            <p className="text-center text-muted-foreground">Loading chat...</p>
          ) : displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold">Research Assistant</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Ask questions about your uploaded documents. Answers include citations from your sources.
              </p>
            </div>
          ) : (
            displayMessages.map((msg, i) => (
              <MessageBubble
                key={msg.id ?? i}
                message={msg}
                isStreaming={streaming && msg.id === -1}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}
