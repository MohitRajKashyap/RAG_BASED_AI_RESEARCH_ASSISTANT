"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, MessageSquare, Upload, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocuments } from "@/services/documents";
import { getChats } from "@/services/chat";
import { UploadModal } from "@/components/documents/upload-modal";
import { uploadDocuments } from "@/services/documents";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate, formatFileSize } from "@/lib/utils";

export default function DashboardPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: docs } = useQuery({ queryKey: ["documents"], queryFn: getDocuments });
  const { data: chats } = useQuery({ queryKey: ["chats"], queryFn: getChats });

  const handleUpload = async (files: File[]) => {
    await uploadDocuments(files);
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  const readyDocs = docs?.documents.filter((d) => d.status === "ready").length || 0;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Upload research papers and ask questions with AI-powered citations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardDescription>Documents</CardDescription>
              <CardTitle className="text-3xl">{docs?.total || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{readyDocs} ready for search</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardDescription>Conversations</CardDescription>
              <CardTitle className="text-3xl">{chats?.total || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Saved chat history</p>
            </CardContent>
          </Card>
          <Card className="glass border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI Ready
              </CardDescription>
              <CardTitle className="text-3xl">{readyDocs > 0 ? "Yes" : "No"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {readyDocs > 0 ? "Start chatting now" : "Upload documents first"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Quick Upload
              </CardTitle>
              <CardDescription>PDF, DOCX, or TXT files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setUploadOpen(true)} className="w-full">
                Upload Documents
              </Button>
              <Link href="/chat">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Chatting
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Chats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chats?.chats.length ? (
                <ul className="space-y-2">
                  {chats.chats.slice(0, 5).map((chat) => (
                    <li key={chat.id}>
                      <Link
                        href={`/chat?id=${chat.id}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <span className="truncate">{chat.title}</span>
                        <span className="text-xs text-muted-foreground">{chat.message_count} msgs</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            {docs?.documents.length ? (
              <ul className="divide-y">
                {docs.documents.slice(0, 5).map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{doc.original_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)} · {doc.chunk_count} chunks · {doc.status}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded</p>
            )}
            <Link href="/documents" className="mt-4 inline-block text-sm font-medium hover:underline">
              View all documents →
            </Link>
          </CardContent>
        </Card>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </div>
  );
}
