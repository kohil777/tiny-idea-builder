import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, FileText, Plus, Calculator, Database } from "lucide-react";
import { toast } from "sonner";
import { analyzeBill, type BillAnalysis } from "@/lib/ai.functions";
import { fileToDataUrl } from "@/lib/image";
import { eco, useEco } from "@/lib/eco-store";
import { BILL_FACTORS, billEmission, round2, type BillKind } from "@/lib/emissions";
import { PageHeader, Panel } from "@/components/eco/PageHeader";
import { ImagePicker } from "@/components/eco/ImagePicker";
import { EntryList } from "@/components/eco/EntryList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/bills")({
  head: () => ({
    meta: [
      { title: "Upload Bills & Invoices (Know Your Impact) — EcoTrack" },
      { name: "description", content: "Upload electricity, water, fuel or shopping bills. AI reads them and estimates the carbon footprint using EPA, DEFRA and India GHG factors." },
      { property: "og:title", content: "Bills & Invoices — EcoTrack" },
      { property: "og:description", content: "AI-read bills turned into carbon estimates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BillsPage,
});

function BillsPage() {
  const { entries } = useEco();
  const analyze = useServerFn(analyzeBill);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BillAnalysis | null>(null);
  const [kind, setKind] = useState<BillKind>("electricity");
  const [qty, setQty] = useState("150");
  const [covers, setCovers] = useState("30");

  async function onFile(file: File) {
    setResult(null);
    setLoading(true);
    try {
      const url = await fileToDataUrl(file, 1600, 0.85);
      setPreview(url);
      const res = await analyze({ data: { imageDataUrl: url } });
      if (!res.ok) toast.error(res.error);
      else if (!res.data.isBill) toast.warning("That doesn't look like a bill. Try a clearer photo.");
      else setResult(res.data);
    } catch {
      toast.error("Couldn't read that image. Try a JPG or PNG.");
    } finally {
      setLoading(false);
    }
  }

  const quantity = Math.max(0, parseFloat(qty) || 0);
  const f = BILL_FACTORS[kind];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader category="bills" title="Upload Bills & Invoices" tagline="Know Your Impact" description="Upload utility or purchase bills — electricity, water, fuel, shopping. AI reads them and estimates the footprint using emission-factor databases (EPA, DEFRA, India GHG Platform). Each bill is spread across the days it covers." />
      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Scan a bill" className="lg:col-span-3">
          <div className="grid gap-5 md:grid-cols-2">
            <ImagePicker preview={preview} onFile={onFile} disabled={loading} label="Upload a bill or invoice photo" icon={<FileText className="size-8" />} />
            <div className="flex flex-col">
              {loading && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-bills-soft p-6 text-center text-bills">
                  <Loader2 className="size-8 animate-spin" />
                  <p className="font-semibold">Reading your bill…</p>
                </div>
              )}
              {!loading && !result && (
                <div className="flex flex-1 flex-col justify-center gap-3 text-sm text-muted-foreground">
                  <p className="flex gap-2"><FileText className="size-4 shrink-0 text-bills" /> Works with electricity, water, fuel, gas and shopping bills</p>
                  <p className="flex gap-2"><Database className="size-4 shrink-0 text-bills" /> Factors from EPA, DEFRA and India GHG Platform</p>
                </div>
              )}
              {result && !loading && (
                <div className="flex flex-1 flex-col animate-rise">
                  <span className="self-start rounded-full bg-bills-soft px-2.5 py-0.5 text-xs font-semibold capitalize text-bills">{result.billType}</span>
                  <h3 className="mt-2 text-lg font-bold text-forest">{result.vendor || "Bill"}</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Period</dt><dd className="text-right">{result.period || "—"}</dd>
                    <dt className="text-muted-foreground">Usage</dt><dd className="text-right">{result.quantity} {result.unit}</dd>
                    <dt className="text-muted-foreground">Amount</dt><dd className="text-right">{result.currency} {result.amount}</dd>
                    <dt className="text-muted-foreground">Spread over</dt><dd className="text-right">{Math.max(1, Math.round(result.periodDays || 1))} days</dd>
                    <dt className="text-muted-foreground">Factor</dt><dd className="text-right">{result.factorUsed}</dd>
                  </dl>
                  <div className="mt-3 rounded-2xl bg-bills-soft p-3">
                    <p className="text-xs text-muted-foreground">Estimated footprint · {result.factorSource}</p>
                    <p className="font-display text-2xl font-bold text-bills">{result.kgCO2e.toFixed(1)} kg CO₂e</p>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{result.summary}</p>
                  <Button
                    variant="hero"
                    className="mt-4"
                    onClick={() => {
                      eco.addEntry({ category: "bills", title: `${result.vendor || "Bill"} (${result.billType})`, kg: round2(result.kgCO2e), note: result.period || undefined, spreadDays: Math.min(366, Math.max(1, Math.round(result.periodDays || 1))) });
                      toast.success("Bill added to your footprint");
                      setResult(null);
                      setPreview(null);
                    }}
                  >
                    <Plus /> Add to footprint
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Manual calculator" icon={<Calculator className="size-5 text-bills" />} className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Bill type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as BillKind)}>
                <SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(BILL_FACTORS) as BillKind[]).map((k) => <SelectItem key={k} value={k}>{BILL_FACTORS[k].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="q" className="text-sm font-semibold">Usage ({f.unit})</Label>
              <Input id="q" type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-2 h-11 rounded-xl" />
              <p className="mt-1 text-xs text-muted-foreground">{f.factor} kg CO₂e per {f.unit} · {f.source}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold">This bill covers</Label>
              <Select value={covers} onValueChange={setCovers}>
                <SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">One day / one-off</SelectItem>
                  <SelectItem value="7">A week</SelectItem>
                  <SelectItem value="30">A month</SelectItem>
                  <SelectItem value="60">Two months</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Spread evenly so one bill doesn't spike a single day.</p>
            </div>
            <Button
              variant="hero"
              className="w-full"
              onClick={() => {
                if (!quantity) { toast.error("Enter your usage first."); return; }
                eco.addEntry({ category: "bills", title: `${f.label} · ${quantity} ${f.unit}`, kg: billEmission(kind, quantity), spreadDays: Number(covers) });
                toast.success("Bill logged");
              }}
            >
              <Plus /> Log {billEmission(kind, quantity).toFixed(1)} kg CO₂e
            </Button>
          </div>
        </Panel>

        <Panel title="Your bills" className="lg:col-span-5">
          <EntryList entries={entries.filter((e) => e.category === "bills")} empty="No bills logged yet." />
        </Panel>
      </div>
    </div>
  );
}
