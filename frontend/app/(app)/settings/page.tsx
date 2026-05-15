"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Key, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings, updateSettings, clearVectorStore } from "@/services/settings";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const updateMutation = useMutation({
    mutationFn: () => updateSettings(apiKey || undefined),
    onSuccess: () => {
      setMessage("Settings saved successfully");
      setApiKey("");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => setMessage("Failed to save settings"),
  });

  const clearMutation = useMutation({
    mutationFn: clearVectorStore,
    onSuccess: () => setMessage("Vector store cleared"),
    onError: () => setMessage("Failed to clear vector store"),
  });

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage API keys and data</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              OpenAI API Key
            </CardTitle>
            <CardDescription>
              Override the server key with your own. Status:{" "}
              {isLoading ? "..." : settings?.openai_api_key_set ? "Configured" : "Not set"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Model: {settings?.model} · Embeddings: {settings?.embedding_model}
            </p>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save API Key
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Clear all embeddings from FAISS. Documents remain but need re-processing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Clear entire vector database? This cannot be undone.")) {
                  clearMutation.mutate();
                }
              }}
              disabled={clearMutation.isPending}
            >
              {clearMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Clear Vector Store
            </Button>
          </CardContent>
        </Card>

        {message && (
          <p className="text-sm text-muted-foreground animate-fade-in">{message}</p>
        )}
      </div>
    </div>
  );
}
