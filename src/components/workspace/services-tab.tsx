import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  listServices,
  createService,
  updateService,
  deleteService,
} from "@/server-functions/services";
import type { Service } from "@/server-functions/types";

export function ServicesTab() {
  const queryClient = useQueryClient();
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => listServices(),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (input: Omit<Service, "id" | "sortOrder" | "createdAt">) => {
      if (editing) return updateService({ data: { ...input, id: editing.id } });
      return createService({ data: input });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(editing ? "Service updated" : "Service added");
      setOpen(false);
      setEditing(null);
    },
    onError: () => toast.error("Couldn't save the service"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service removed");
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    saveMutation.mutate({
      name: String(form.get("name") ?? ""),
      tagline: String(form.get("tagline") ?? ""),
      description: String(form.get("description") ?? ""),
      duration: String(form.get("duration") ?? ""),
      price: String(form.get("price") ?? ""),
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="size-4" /> Add service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit service" : "Add a service"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editing?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" name="tagline" defaultValue={editing?.tagline} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editing?.description}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    name="duration"
                    defaultValue={editing?.duration}
                    placeholder="30 min"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" defaultValue={editing?.price} placeholder="₹300" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading services…</p>
      ) : !services?.length ? (
        <p className="mt-6 text-muted-foreground">No services yet — add the first one.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5"
            >
              <div>
                <p className="font-medium">
                  {s.name} <span className="text-muted-foreground">· {s.price}</span>
                </p>
                <p className="text-sm text-muted-foreground">{s.tagline}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit service"
                  onClick={() => {
                    setEditing(s);
                    setOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Delete service">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove "{s.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes it from the public Eye Checkups page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
