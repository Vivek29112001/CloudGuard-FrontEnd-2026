"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  User,
  Send,
  Plus,
  MessageCircle,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingPanel, ErrorPanel } from "@/components/shared/state-panels";
import {
  useActiveScan,
  useChats,
  keys,
  useAuthStatus,
} from "@/lib/api/queries";
import { backend } from "@/lib/api/client";
import type { Chat, ChatQueryResult, ChatMessage } from "@/types/aws";
import { useWorkspace } from "@/components/layout/app-shell";

function AssistantMessage({ message }: { message: ChatMessage }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const assistant = message.role === "assistant";
  const source =
    message.evidence?.source || (message.result?.source as string | undefined);
  const evidencePayload = message.result ?? message.evidence;
  return (
    <div className={`message ${assistant ? "" : "user"}`}>
      <span className="msg-avatar">
        {assistant ? <Bot size={18} /> : <User size={17} />}
      </span>
      <div className="max-w-full">
        <div className="msg-bubble">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        {assistant && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="small-note">
              {source?.replaceAll("_", " ") || "Evidence source not provided"}
            </span>
            {message.response_time_ms !== undefined && (
              <span className="small-note">
                {(message.response_time_ms / 1000).toFixed(2)}s
              </span>
            )}
            {evidencePayload && (
              <button
                className="text-[11px] font-bold text-blue-600 flex items-center gap-1"
                onClick={() => setShowEvidence((v) => !v)}
              >
                {showEvidence ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
                AWS evidence
              </button>
            )}
          </div>
        )}
        {showEvidence && evidencePayload && (
          <pre className="code-box mt-3 max-w-[690px]">
            {JSON.stringify(evidencePayload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
export function AssistantPage({ initialChat }: { initialChat?: string }) {
  const { demo } = useWorkspace();
  const { data: scan, isPending: scanPending } = useActiveScan();
  const { data: chats = [], isPending: chatsPending, error } = useChats();
  const { data: auth } = useAuthStatus(scan?.aws_connection_id);
  const [activeId, setActiveId] = useState<number | null>(
    initialChat && /^\d+$/.test(initialChat) ? Number(initialChat) : null,
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const client = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    if (activeId == null && chats.length) {
      const matched = chats.find(
        (c) => String(c.scan_id) === String(scan?.scan_id),
      );
      if (matched) setActiveId(matched.id);
    }
  }, [chats, scan?.scan_id, activeId]);
  const { data: chat, isPending: chatPending } = useQuery({
    queryKey: ["chat", activeId],
    queryFn: () => backend<Chat>(`/chats/${activeId}`),
    enabled: activeId !== null,
    retry: false,
  });
  async function createChat() {
    if (!scan?.scan_id) return;
    setErrorMessage("");
    try {
      const created = await backend<Chat>("/chats", {
        method: "POST",
        body: { scan_id: scan.scan_id, title: "New AWS Chat", context: {} },
      });
      setActiveId(created.id);
      void client.invalidateQueries({ queryKey: keys.chats });
      router.replace(`/assistant?chat=${created.id}`);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Unable to create chat");
    }
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!activeId || !input.trim() || busy) return;
    const question = input.trim();
    setInput("");
    setBusy(true);
    setErrorMessage("");
    const optimistic: { id: number; role: "user"; content: string } = {
      id: Date.now(),
      role: "user",
      content: question,
    };
    client.setQueryData<Chat>(["chat", activeId], (old) =>
      old ? { ...old, messages: [...(old.messages || []), optimistic] } : old,
    );
    try {
      const result = await backend<ChatQueryResult>(
        `/chats/${activeId}/query`,
        { method: "POST", body: { question } },
      );
      if (result.status && result.status !== "SUCCESS")
        setErrorMessage(result.answer || `Query status: ${result.status}`);
      await client.invalidateQueries({ queryKey: ["chat", activeId] });
      await client.invalidateQueries({ queryKey: keys.chats });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Query failed");
      await client.invalidateQueries({ queryKey: ["chat", activeId] });
    } finally {
      setBusy(false);
    }
  }
  if (scanPending || chatsPending) return <LoadingPanel />;
  if (error) return <ErrorPanel message={error.message} />;
  return (
    <>
      <PageHeader
        title="AI Assistant"
        description="Ask questions using persisted snapshots and authenticated read-only AWS MCP evidence."
        actions={
          <Button
            variant="primary"
            disabled={demo || !scan?.scan_id || scan.status !== "COMPLETED"}
            onClick={() => void createChat()}
          >
            <Plus size={15} />
            New Chat
          </Button>
        }
      />
      <div className="chat-layout">
        <aside className="chat-list">
          <div className="card-heading mb-3">Recent conversations</div>
          {chats.length ? (
            chats.map((c) => (
              <button
                key={c.id}
                className={`chat-entry ${activeId === c.id ? "active" : ""}`}
                onClick={() => {
                  setActiveId(c.id);
                  router.replace(`/assistant?chat=${c.id}`);
                }}
              >
                <MessageCircle size={14} className="inline mr-2" />
                {c.title || `Chat #${c.id}`}
              </button>
            ))
          ) : (
            <p className="small-note">No saved chats yet.</p>
          )}
          <div className="small-note border-t border-slate-100 mt-5 pt-4">
            Chats are scoped to an immutable snapshot and the current client
            workspace.
          </div>
        </aside>
        <div className="chat-card">
          <div className="chat-header flex justify-between gap-3 items-center">
            <div>
              <div className="card-heading">
                {chat?.title || "AWS AI Assistant"}
              </div>
              <div className="card-description">
                {chat?.scan_id
                  ? `Snapshot: ${chat.scan_id.slice(0, 24)}`
                  : "Select or create a conversation"}
              </div>
            </div>
            <Badge tone={auth?.connected ? "success" : "warning"}>
              {auth?.connected
                ? "Live AWS authorized"
                : "Snapshot-only / disconnected"}
            </Badge>
          </div>
          {chat?.context?.context_type ? (
            <div className="alert mx-5 mt-4">
              <Info size={17} />
              Focused context: {String(chat.context.context_type)} ·{" "}
              {String(chat.context.label || "Selected item")}
            </div>
          ) : null}
          <div className="messages">
            {!chat ? (
              <EmptyState
                title="Start an infrastructure investigation"
                description="Select an existing chat or create a new chat after completing AWS discovery."
                icon={Bot}
              />
            ) : chatPending ? (
              <LoadingPanel />
            ) : chat.messages?.length ? (
              chat.messages.map((msg, index) => (
                <AssistantMessage key={msg.id ?? index} message={msg} />
              ))
            ) : (
              <div className="self-center my-auto text-center">
                <div className="empty-icon mx-auto mb-3">
                  <Bot size={25} />
                </div>
                <h3 className="font-bold mb-2">
                  How can I help with your AWS account?
                </h3>
                <p className="small-note">
                  Ask about discovered services, Regions, resource details or
                  access configuration.
                </p>
              </div>
            )}
            {busy && (
              <div className="message">
                <span className="msg-avatar">
                  <Bot size={17} />
                </span>
                <div className="msg-bubble">
                  Querying saved evidence and read-only AWS APIs…
                </div>
              </div>
            )}
          </div>
          {errorMessage && (
            <div className="alert danger mx-4 mb-3">
              <Info size={16} />
              {errorMessage}
            </div>
          )}
          <form className="chat-compose" onSubmit={(e) => void send(e)}>
            <Input
              aria-label="Ask AWS AI assistant"
              placeholder="Ask a question about your AWS environment…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={demo || !activeId || busy}
            />
            <Button
              aria-label="Send question"
              variant="primary"
              type="submit"
              disabled={demo || !activeId || !input.trim() || busy}
            >
              <Send size={17} />
            </Button>
          </form>
        </div>
      </div>
      {!auth?.connected && scan && (
        <div className="alert warning mt-4">
          <ShieldCheck size={17} />
          Saved inventory remains available, but live AWS evidence requests may
          require role reauthorization.{" "}
          <a className="font-bold underline" href="/connections">
            Reconnect AWS
          </a>
          .
        </div>
      )}
    </>
  );
}
