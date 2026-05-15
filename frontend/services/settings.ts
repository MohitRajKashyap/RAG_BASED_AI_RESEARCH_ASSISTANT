import api from "./api";
import type { Settings } from "@/types";

export async function getSettings(): Promise<Settings> {
  const { data } = await api.get("/settings");
  return data;
}

export async function updateSettings(openaiApiKey?: string): Promise<Settings> {
  const { data } = await api.put("/settings", { openai_api_key: openaiApiKey });
  return data;
}

export async function clearVectorStore(): Promise<void> {
  await api.delete("/settings/vector-store");
}
