"use client";

import { FileText } from "lucide-react";
import type { Citation } from "@/types";

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export function CitationCard({ citation, index }: CitationCardProps) {
  return (
    <div className="rounded-lg border bg-muted/50 p-3 text-xs animate-slide-up">
      <div className="mb-1 flex items-center gap-2 font-medium">
        <FileText className="h-3 w-3" />
        [{index}] {citation.document_name}
        {citation.page && <span className="text-muted-foreground">· p.{citation.page}</span>}
        <span className="ml-auto text-muted-foreground">score: {citation.score}</span>
      </div>
      <p className="line-clamp-3 text-muted-foreground">{citation.content}</p>
    </div>
  );
}
