import { useState, type ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Printer, Trash2, Search, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChipPicker } from "./chip-picker";
import {
  POWER_VALUES,
  AXIS_VALUES,
  ADD_VALUES,
  PD_VALUES,
  DIAGNOSIS_OPTIONS,
  LENS_ADVICE_OPTIONS,
  FRAME_ADVICE_OPTIONS,
} from "@/lib/optometry-values";
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
  listPrescriptions,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from "@/server-functions/prescriptions";
import type { Prescription } from "@/server-functions/types";
import { printPrescription } from "./print-prescription";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const emptySide = { sph: "", cyl: "", axis: "" };

function toList(value: string): string[] {
  return value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
}
function toCsv(list: string[]): string {
  return list.join(", ");
}

// Tap-only numeric picker for refraction values — a plain Select with a "—"
// (not set) option, since Radix disallows an empty-string item value.
function ValueSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger className="h-9">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        <SelectItem value="none">—</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type FormState = {
  patientName: string;
  phone: string;
  age: string;
  gender: string;
  right: typeof emptySide;
  left: typeof emptySide;
  addPower: string;
  pd: string;
  lensAdvice: string;
  frameAdvice: string;
  diagnosis: string;
  notes: string;
  followUpDate: string;
  fileName: string;
  fileType: string;
  fileDataBase64: string;
};

function toFormState(rx: Prescription | null): FormState {
  return {
    patientName: rx?.patientName ?? "",
    phone: rx?.phone ?? "",
    age: rx?.age ? String(rx.age) : "",
    gender: rx?.gender ?? "",
    right: rx?.right ?? emptySide,
    left: rx?.left ?? emptySide,
    addPower: rx?.addPower ?? "",
    pd: rx?.pd ?? "",
    lensAdvice: rx?.lensAdvice ?? "",
    frameAdvice: rx?.frameAdvice ?? "",
    diagnosis: rx?.diagnosis?.join(", ") ?? "",
    notes: rx?.notes ?? "",
    followUpDate: rx?.followUpDate ?? "",
    fileName: rx?.fileName ?? "",
    fileType: rx?.fileType ?? "",
    fileDataBase64: "",
  };
}

export function PrescriptionsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions", search],
    queryFn: () => listPrescriptions({ data: { q: search || undefined } }),
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(toFormState(null));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        patientName: form.patientName,
        phone: form.phone,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        right: form.right,
        left: form.left,
        addPower: form.addPower,
        pd: form.pd,
        lensAdvice: form.lensAdvice,
        frameAdvice: form.frameAdvice,
        diagnosis: form.diagnosis
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        notes: form.notes,
        followUpDate: form.followUpDate,
        fileName: form.fileName,
        fileType: form.fileType,
        fileDataBase64: form.fileDataBase64,
      };
      if (editingId) return updatePrescription({ data: { ...payload, id: editingId } });
      return createPrescription({ data: payload });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success(editingId ? "Prescription updated" : "Prescription saved");
      setOpen(false);
    },
    onError: () => toast.error("Couldn't save the prescription"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePrescription({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success("Prescription removed");
    },
  });

  function openFor(rx: Prescription | null) {
    setEditingId(rx?.id ?? null);
    setForm(toFormState(rx));
    setOpen(true);
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File must be under 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.split(",")[1] ?? "";
      setForm((f) => ({ ...f, fileName: file.name, fileType: file.type, fileDataBase64: base64 }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient or phone…"
            className="pl-9"
          />
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditingId(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openFor(null)}>
              <Plus className="size-4" /> New prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit prescription" : "New prescription"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient name</Label>
                  <Input
                    value={form.patientName}
                    onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Input
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/70 p-4">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Refraction — tap to pick, nothing to type
                </p>
                <div className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-2 text-sm">
                  <span />
                  <span className="text-center text-xs text-muted-foreground">SPH</span>
                  <span className="text-center text-xs text-muted-foreground">CYL</span>
                  <span className="text-center text-xs text-muted-foreground">AXIS</span>

                  <span className="text-xs text-muted-foreground">Right (OD)</span>
                  <ValueSelect
                    value={form.right.sph}
                    options={POWER_VALUES}
                    onChange={(v) => setForm((f) => ({ ...f, right: { ...f.right, sph: v } }))}
                  />
                  <ValueSelect
                    value={form.right.cyl}
                    options={POWER_VALUES}
                    onChange={(v) => setForm((f) => ({ ...f, right: { ...f.right, cyl: v } }))}
                  />
                  <ValueSelect
                    value={form.right.axis}
                    options={AXIS_VALUES}
                    onChange={(v) => setForm((f) => ({ ...f, right: { ...f.right, axis: v } }))}
                  />

                  <span className="text-xs text-muted-foreground">Left (OS)</span>
                  <ValueSelect
                    value={form.left.sph}
                    options={POWER_VALUES}
                    onChange={(v) => setForm((f) => ({ ...f, left: { ...f.left, sph: v } }))}
                  />
                  <ValueSelect
                    value={form.left.cyl}
                    options={POWER_VALUES}
                    onChange={(v) => setForm((f) => ({ ...f, left: { ...f.left, cyl: v } }))}
                  />
                  <ValueSelect
                    value={form.left.axis}
                    options={AXIS_VALUES}
                    onChange={(v) => setForm((f) => ({ ...f, left: { ...f.left, axis: v } }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Add power</Label>
                  <ValueSelect
                    value={form.addPower}
                    options={ADD_VALUES}
                    onChange={(v) => setForm((f) => ({ ...f, addPower: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PD (mm)</Label>
                  <ValueSelect
                    value={form.pd}
                    options={PD_VALUES}
                    onChange={(v) => setForm((f) => ({ ...f, pd: v }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lens advice</Label>
                <ChipPicker
                  options={LENS_ADVICE_OPTIONS}
                  value={toList(form.lensAdvice)}
                  onChange={(list) => setForm((f) => ({ ...f, lensAdvice: toCsv(list) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Frame advice</Label>
                <ChipPicker
                  options={FRAME_ADVICE_OPTIONS}
                  value={toList(form.frameAdvice)}
                  onChange={(list) => setForm((f) => ({ ...f, frameAdvice: toCsv(list) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <ChipPicker
                  options={DIAGNOSIS_OPTIONS}
                  value={toList(form.diagnosis)}
                  onChange={(list) => setForm((f) => ({ ...f, diagnosis: toCsv(list) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Follow-up date</Label>
                <Input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Attach a scan or photo (optional, up to 8MB)</Label>
                <Input type="file" accept="image/*,.pdf" onChange={handleFile} />
                {form.fileName && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Paperclip className="size-3.5" /> {form.fileName}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save prescription"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading prescriptions…</p>
      ) : !prescriptions?.length ? (
        <p className="mt-6 text-muted-foreground">No prescriptions yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5"
            >
              <div>
                <p className="font-medium">
                  {rx.patientName}
                  {rx.age ? ` · ${rx.age} yrs` : ""} {rx.gender && `· ${rx.gender}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {rx.phone} · {new Date(rx.createdAt).toLocaleDateString()}
                </p>
                {rx.diagnosis.length > 0 && (
                  <p className="mt-1 text-sm text-primary">{rx.diagnosis.join(", ")}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Print"
                  onClick={() => printPrescription(rx)}
                >
                  <Printer className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openFor(rx)}>
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this prescription?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(rx.id)}>
                        Delete
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
