import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BarqHeader } from "@/components/BarqHeader";
import { buildIntakeClaim } from "@/lib/claims-data";
import { claimsStore } from "@/lib/claims-store";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "New claim — Barq" },
      {
        name: "description",
        content:
          "Intake harness: submit a claim and see Barq draft an AI damage assessment.",
      },
    ],
  }),
  component: IntakePage,
});

function IntakePage() {
  const navigate = useNavigate();
  const [policyholder, setPolicyholder] = useState("Layla H.");
  const [policyNumber, setPolicyNumber] = useState("POL-6104-08");
  const [make, setMake] = useState("Kia");
  const [model, setModel] = useState("Sportage");
  const [year, setYear] = useState("2020");
  const [incident, setIncident] = useState(
    "Backed into a bollard at low speed; rear bumper impact."
  );

  const [photoName, setPhotoName] = useState<string | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoName(f.name);
    const reader = new FileReader();
    reader.onload = () => setThumb(String(reader.result));
    reader.readAsDataURL(f);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAnalyzing(true);
    setTimeout(() => {
      const claim = buildIntakeClaim({
        policyholder,
        policyNumber,
        vehicle: `${year} ${make} ${model}`,
        incident,
        photoName: photoName || undefined,
      });

      claimsStore.add(claim);
      navigate({ to: "/claims/$id", params: { id: claim.id } });
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BarqHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">New claim</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            In production, claims arrive automatically from carrier intake systems. This
            harness is for demonstration.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-lg border border-border bg-white p-6 shadow-sm"
        >
          <Field label="Policyholder">
            <input
              className={inputCls}
              value={policyholder}
              onChange={(e) => setPolicyholder(e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Make">
              <input
                className={inputCls}
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
              />
            </Field>
            <Field label="Model">
              <input
                className={inputCls}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </Field>
            <Field label="Year">
              <input
                className={inputCls}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="Incident description">
            <textarea
              className={`${inputCls} min-h-[90px]`}
              value={incident}
              onChange={(e) => setIncident(e.target.value)}
              required
            />
          </Field>
          <Field label="Damage photo">
            <div className="flex items-center gap-4">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Choose file
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile}
                />
              </label>
              {thumb ? (
                <div className="flex items-center gap-3">
                  <img
                    src={thumb}
                    alt={photoName || ""}
                    className="h-16 w-24 rounded border border-border object-cover"
                  />
                  <span className="text-xs text-muted-foreground">{photoName}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Optional — a placeholder photo will be attached.
                </span>
              )}
            </div>
          </Field>

          <div className="flex items-center justify-between border-t border-border pt-5">
            <p className="text-xs text-muted-foreground">
              Barq will draft an AI assessment on submit.
            </p>
            <button
              type="submit"
              disabled={analyzing}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {analyzing && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {analyzing ? "Barq is analyzing damage…" : "Submit claim"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

const inputCls =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
