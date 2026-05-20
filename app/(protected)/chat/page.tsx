import { ChatPanel } from "@/components/ChatPanel";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gold">Chat</h1>
        <p className="text-sm text-muted">
          Ask questions about your uploaded bills and FedEx documents.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
