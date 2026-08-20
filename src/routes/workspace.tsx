import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentsTab } from "@/components/workspace/appointments-tab";
import { PrescriptionsTab } from "@/components/workspace/prescriptions-tab";
import { ServicesTab } from "@/components/workspace/services-tab";
import { FramesTab } from "@/components/workspace/frames-tab";
import { MessagesTab } from "@/components/workspace/messages-tab";
import { logoutDoctor } from "@/server-functions/auth";

export const Route = createFileRoute("/workspace")({
  beforeLoad: ({ context }) => {
    if (!context.doctor) throw redirect({ to: "/auth" });
  },
  component: WorkspacePage,
});

function WorkspacePage() {
  const { doctor } = Route.useRouteContext();
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutDoctor();
    toast.success("Signed out");
    await navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Doctor workspace</p>
          <h1 className="mt-2 font-display text-3xl font-light md:text-4xl">
            Welcome, {doctor?.name ?? "Doctor"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{doctor?.email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>

      <Tabs defaultValue="appointments" className="mt-8">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-secondary/60 p-1.5">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="services">Eye checkups</TabsTrigger>
          <TabsTrigger value="frames">Optical</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-6">
          <AppointmentsTab />
        </TabsContent>
        <TabsContent value="prescriptions" className="mt-6">
          <PrescriptionsTab />
        </TabsContent>
        <TabsContent value="services" className="mt-6">
          <ServicesTab />
        </TabsContent>
        <TabsContent value="frames" className="mt-6">
          <FramesTab />
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          <MessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
