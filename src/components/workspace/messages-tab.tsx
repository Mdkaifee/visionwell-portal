import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listMessages, markMessageRead, deleteMessage } from "@/server-functions/messages";

export function MessagesTab() {
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => listMessages(),
  });

  const readMutation = useMutation({
    mutationFn: (input: { id: string; read: boolean }) => markMessageRead({ data: input }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["messages"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast.success("Message removed");
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading messages…</p>;
  if (!messages?.length) return <p className="text-muted-foreground">No messages yet.</p>;

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div
          key={m.id}
          className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{m.name}</p>
              {!m.read && <Badge>New</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {[m.phone, m.email].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{m.message}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={m.read ? "Mark unread" : "Mark read"}
              onClick={() => readMutation.mutate({ id: m.id, read: !m.read })}
            >
              {m.read ? <MailOpen className="size-4" /> : <Mail className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete message"
              onClick={() => deleteMutation.mutate(m.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
