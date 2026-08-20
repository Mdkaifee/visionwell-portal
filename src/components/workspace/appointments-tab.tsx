import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listAppointments,
  updateAppointment,
  deleteAppointment,
} from "@/server-functions/appointments";
import type { Appointment } from "@/server-functions/types";

const statusVariant: Record<
  Appointment["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export function AppointmentsTab() {
  const queryClient = useQueryClient();
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => listAppointments(),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: string }) => updateAppointment({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Couldn't update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAppointment({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment removed");
    },
    onError: () => toast.error("Couldn't remove appointment"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading appointments…</p>;
  if (!appointments?.length) {
    return <p className="text-muted-foreground">No appointment requests yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Preferred</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.patientName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {a.phone}
                {a.email && <div>{a.email}</div>}
              </TableCell>
              <TableCell className="text-sm">{a.service || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {a.preferredDate || "—"} {a.preferredTime}
              </TableCell>
              <TableCell>
                <Select
                  value={a.status}
                  onValueChange={(status) => statusMutation.mutate({ id: a.id, status })}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue>
                      <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(a.id)}
                  aria-label="Delete appointment"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
