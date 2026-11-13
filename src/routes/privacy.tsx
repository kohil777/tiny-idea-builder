import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, MapPin, Utensils, Car, FileText, Lock, Trash2, Bell } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { eco, useEco, type Settings } from "@/lib/eco-store";
import { PageHeader, Panel } from "@/components/eco/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Your Data, Your Choice — EcoTrack Privacy" },
      { name: "description", content: "GPS is optional, you control what you share, and your data is used only for carbon insights." },
      { property: "og:title", content: "Your Data, Your Choice — EcoTrack" },
      { property: "og:description", content: "Control GPS and sharing in EcoTrack." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function Row({ icon, title, text, k, settings }: { icon: ReactNode; title: string; text: string; k: keyof Settings; settings: Settings }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-primary">{icon}</span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
      <Switch checked={Boolean(settings[k])} onCheckedChange={(v) => eco.updateSettings({ [k]: v } as Partial<Settings>)} aria-label={title} />
    </div>
  );
}

function PrivacyPage() {
  const { settings } = useEco();
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <PageHeader title="Your Data, Your Choice" description="GPS tracking is optional, you decide what to share, and your data stays on this device — used only for carbon insights." />
      <div className="space-y-5">
        <Panel title="Profile">
          <Label htmlFor="name" className="text-sm font-semibold">Display name in the community</Label>
          <Input id="name" defaultValue={settings.displayName} maxLength={30} onBlur={(e) => eco.updateSettings({ displayName: e.target.value.trim() || "You" })} className="mt-2 h-11 rounded-xl" />
        </Panel>
        <Panel title="Permissions & sharing" icon={<ShieldCheck className="size-5 text-primary" />}>
          <div className="divide-y divide-border">
            <Row settings={settings} k="gpsEnabled" icon={<MapPin className="size-5" />} title="GPS tracking" text="Track trips automatically. You can disable it anytime." />
            <Row settings={settings} k="pickupAlerts" icon={<Bell className="size-5" />} title="Pickup alerts" text="Notify me when the garbage collector is near." />
            <Row settings={settings} k="shareMeals" icon={<Utensils className="size-5" />} title="Share meals" text="Allow meal milestones in the community feed." />
            <Row settings={settings} k="shareTrips" icon={<Car className="size-5" />} title="Share trips" text="Allow travel milestones in the community feed." />
            <Row settings={settings} k="shareBills" icon={<FileText className="size-5" />} title="Share bills" text="Allow bill-based insights in the community feed." />
          </div>
        </Panel>
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="size-4" /> Photos are analysed once and never stored.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="rounded-full"><Trash2 /> Delete my data</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all your EcoTrack data?</AlertDialogTitle>
                  <AlertDialogDescription>This removes your logged meals, trips, waste, bills, listings and posts from this device. It can't be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { eco.clearMyData(); toast.success("Your data was deleted"); }}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Panel>
      </div>
    </div>
  );
}
