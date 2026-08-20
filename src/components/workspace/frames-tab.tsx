import { useState, type ChangeEvent, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Glasses, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { FrameArt } from "@/components/frame-art";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { listFrames, createFrame, updateFrame, deleteFrame } from "@/server-functions/frames";
import type { Frame } from "@/server-functions/types";

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

export function FramesTab() {
  const queryClient = useQueryClient();
  const { data: frames, isLoading } = useQuery({
    queryKey: ["frames"],
    queryFn: () => listFrames(),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Frame | null>(null);
  const [inStock, setInStock] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  const saveMutation = useMutation({
    mutationFn: async (input: Omit<Frame, "id" | "sortOrder" | "createdAt">) => {
      if (editing) return updateFrame({ data: { ...input, id: editing.id } });
      return createFrame({ data: input });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["frames"] });
      toast.success(editing ? "Frame updated" : "Frame added");
      setOpen(false);
      setEditing(null);
    },
    onError: () => toast.error("Couldn't save the frame"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFrame({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["frames"] });
      toast.success("Frame removed");
    },
  });

  function openFor(frame: Frame | null) {
    setEditing(frame);
    setInStock(frame?.inStock ?? true);
    setImageUrl(frame?.imageUrl ?? "");
    setOpen(true);
  }

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Photo must be under 1.5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    saveMutation.mutate({
      name: String(form.get("name") ?? ""),
      brand: String(form.get("brand") ?? ""),
      material: String(form.get("material") ?? ""),
      shape: String(form.get("shape") ?? ""),
      colour: String(form.get("colour") ?? ""),
      price: Number(form.get("price") ?? 0),
      imageUrl,
      inStock,
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
            <Button onClick={() => openFor(null)}>
              <Plus className="size-4" /> Add frame
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit frame" : "Add a frame"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={editing?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" defaultValue={editing?.brand} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input id="material" name="material" defaultValue={editing?.material} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shape">Shape</Label>
                  <Input
                    id="shape"
                    name="shape"
                    defaultValue={editing?.shape}
                    placeholder="Round, Cat-eye…"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="colour">Colour</Label>
                  <Input id="colour" name="colour" defaultValue={editing?.colour} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min={0}
                    defaultValue={editing?.price}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Photo (optional)</Label>
                <div className="flex items-center gap-3">
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/70 bg-secondary/60">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Glasses className="size-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <Upload className="size-3.5" /> Upload from phone
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhoto}
                      />
                    </label>
                    <Input
                      value={imageUrl.startsWith("data:") ? "" : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="or paste an image URL"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 px-4 py-3">
                <Label htmlFor="inStock" className="cursor-pointer">
                  In stock
                </Label>
                <Switch id="inStock" checked={inStock} onCheckedChange={setInStock} />
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
        <p className="mt-6 text-muted-foreground">Loading frames…</p>
      ) : !frames?.length ? (
        <p className="mt-6 text-muted-foreground">No frames yet — add the first one.</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {frames.map((f) => (
            <div
              key={f.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/70 bg-secondary/60">
                  {f.imageUrl ? (
                    <img src={f.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FrameArt shape={f.shape} colour={f.colour} className="h-full w-full p-1" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {f.name}{" "}
                    <span className="text-muted-foreground">
                      · ₹{f.price.toLocaleString("en-IN")}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {f.brand} · {f.material} · {f.shape}
                  </p>
                  {!f.inStock && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-destructive">
                      Out of stock
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit frame"
                  onClick={() => openFor(f)}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Delete frame">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove "{f.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes it from the public Optical page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(f.id)}>
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
