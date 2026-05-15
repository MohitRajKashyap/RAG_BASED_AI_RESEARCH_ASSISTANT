"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocuments, deleteDocument, uploadDocuments } from "@/services/documents";
import { UploadModal } from "@/components/documents/upload-modal";
import { formatDate, formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["documents"], queryFn: getDocuments });

  const handleUpload = async (files: File[]) => {
    await uploadDocuments(files);
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document and remove it from the vector index?")) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Document Library</h1>
            <p className="text-muted-foreground">Manage your research documents</p>
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data?.documents.length ? (
          <div className="grid gap-4">
            {data.documents.map((doc) => (
              <Card key={doc.id} className="glass animate-fade-in">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{doc.original_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)} · {doc.chunk_count} chunks ·{" "}
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        doc.status === "ready" && "bg-green-500/10 text-green-600",
                        doc.status === "processing" && "bg-yellow-500/10 text-yellow-600",
                        doc.status === "failed" && "bg-red-500/10 text-red-600"
                      )}
                    >
                      {doc.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {doc.summary && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{doc.summary}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No documents yet. Upload your first research paper.</p>
            <Button className="mt-4" onClick={() => setUploadOpen(true)}>
              Upload Documents
            </Button>
          </Card>
        )}
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </div>
  );
}
