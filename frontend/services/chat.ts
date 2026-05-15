import type { Citation, Chat, ChatListItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function getChats(): Promise<{ chats: ChatListItem[]; total: number }> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getChat(id: number): Promise<Chat> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/history/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteChat(id: number): Promise<void> {
  const token = localStorage.getItem("token");
  await fetch(`${API_URL}/history/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onCitations: (citations: Citation[]) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function streamChat(
  message: string,
  chatId: number | null,
  documentIds: number[] | null,
  callbacks: StreamCallbacks
): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      chat_id: chatId,
      document_ids: documentIds,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    callbacks.onError(err.detail || "Chat request failed");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const payload = JSON.parse(line.slice(6));
          if (payload.type === "token") callbacks.onToken(payload.content);
          else if (payload.type === "citations") callbacks.onCitations(payload.citations);
          else if (payload.type === "done") callbacks.onDone();
          else if (payload.type === "error") callbacks.onError(payload.content);
        } catch {
          /* skip malformed */
        }
      }
    }
  }
  callbacks.onDone();
}
