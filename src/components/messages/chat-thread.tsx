"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { formatTime } from "@/lib/format-date";
import { fetchMessages, sendMessage, markAsRead, uploadAttachment, isImageAttachment } from "@/app/dashboard/messages/actions";
import { findImageFile } from "@/lib/find-image-file";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Paperclip, X, FileText } from "lucide-react";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
  readAt: Date | null;
  attachmentUrl:  string | null;
  attachmentName: string | null;
};

interface ChatThreadProps {
  currentProfileId: string;
  otherId: string;
  compact?: boolean;
}

export function ChatThread({ currentProfileId, otherId, compact }: ChatThreadProps) {
  const [messages, setMessages]             = useState<Msg[]>([]);
  const [input, setInput]                   = useState("");
  const [pendingFile, setPendingFile]       = useState<File | null>(null);
  const [uploading, setUploading]           = useState(false);
  const [isPending, start]                  = useTransition();
  const bottomRef                           = useRef<HTMLDivElement>(null);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  const load = async () => {
    const msgs = await fetchMessages(otherId);
    setMessages(msgs as Msg[]);
  };

  useEffect(() => {
    setMessages([]);
    load();
    markAsRead(otherId);
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const body = input.trim();
    if (!body && !pendingFile) return;
    setInput("");

    if (pendingFile) {
      const file = pendingFile;
      setPendingFile(null);
      setUploading(true);
      start(async () => {
        try {
          const fd = new FormData();
          fd.append("file", file);
          const { url, name } = await uploadAttachment(fd);
          await sendMessage(otherId, body, url, name);
        } finally {
          setUploading(false);
        }
        await load();
      });
    } else {
      start(async () => {
        await sendMessage(otherId, body);
        await load();
      });
    }
  };

  const busy = isPending || uploading;

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 overflow-y-auto p-3 flex flex-col gap-2 ${compact ? "text-sm" : ""}`}>
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center text-xs pt-8">
            No messages yet — say hello!
          </p>
        )}
        {messages.map((msg) => {
          const fromMe = msg.senderId === currentProfileId;
          const isImg  = msg.attachmentName ? isImageAttachment(msg.attachmentName) : false;
          return (
            <div key={msg.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                  fromMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}
              >
                {msg.attachmentUrl && isImg && (
                  <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                    <img
                      src={msg.attachmentUrl}
                      alt={msg.attachmentName ?? "attachment"}
                      className="max-w-full rounded-lg mb-1 max-h-48 object-contain"
                    />
                  </a>
                )}
                {msg.attachmentUrl && !isImg && (
                  <a
                    href={msg.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-1.5 mb-1 underline underline-offset-2 ${
                      fromMe ? "text-primary-foreground/90" : "text-foreground"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-45 text-xs">{msg.attachmentName}</span>
                  </a>
                )}
                {msg.body && <p>{msg.body}</p>}
                <p className={`text-[10px] mt-0.5 opacity-60 ${fromMe ? "text-right" : ""}`}>
                  {formatTime(msg.createdAt)}
                  {fromMe && (
                    <span className="ml-1">
                      {msg.readAt ? " · Read" : " · Sent"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Pending file preview */}
      {pendingFile && (
        <div className="px-3 pb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{pendingFile.name}</span>
          <button onClick={() => setPendingFile(null)} className="ml-auto shrink-0 hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="border-t p-2 flex gap-2 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPendingFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onPaste={(e) => {
            const file = findImageFile(e.clipboardData.files);
            if (file) {
              e.preventDefault();
              setPendingFile(file);
            }
          }}
          placeholder="Type a message…"
          disabled={busy}
          className="flex-1 text-sm bg-background border rounded-md px-3 py-1.5 outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button
          size="icon"
          className="shrink-0"
          onClick={handleSend}
          disabled={busy || (!input.trim() && !pendingFile)}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
