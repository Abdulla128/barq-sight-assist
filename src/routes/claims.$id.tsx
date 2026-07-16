import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarqHeader } from "@/components/BarqHeader";
import { RoutingBadge } from "@/components/RoutingBadge";
import { useClaim, claimsStore } from "@/lib/claims-store";
import {
  EDIT_REASON_CHIPS,
  ESCALATION_REASONS,
  formatRange,
  nowStamp,
  panelRange,
  totalRange,
  type Action,
  type PanelAssessment,
  type Photo,
} from "@/lib/claims-data";

export const Route = createFileRoute("/claims/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Barq` },
      { name: "description", content: "Barq claim detail — Evidence Gate and AI assessment." },
    ],
  }),
  component: ClaimDetail,
  notFoundComponent: () => (
    <div className="min-h-screen bg-slate-50">
      <BarqHeader />
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-lg font-semibold">Claim not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-slate-700 underline">
          Back to queue
        </Link>
      </div>
    </div>
  ),
});

function ClaimDetail() {
  const { id } = Route.useParams();
  const claim = useClaim(id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [showUnderHood, setShowUnderHood] = useState(false);
  const [banner, setBanner] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  if (!claim) throw notFound();

  const total = useMemo(() => totalRange(claim.panels), [claim.panels]);
  const hasDeltas = claim.panels.some(
    (p) =>
      p.original &&
      (p.original.severity !== p.severity ||
        p.original.action !== p.action ||
        p.original.damageType !== p.damageType)
  );

  function patchPanel(pid: string, patch: Partial<PanelAssessment>) {
    claimsStore.update(claim!.id, (c) => {
      c.panels = c.panels.map((p) => {
        if (p.id !== pid) return p;
        const original = p.original || {
          damageType: p.damageType,
          severity: p.severity,
          action: p.action,
        };
        return { ...p, ...patch, original };
      });
      return c;
    });
  }

  function toggleReason(r: string) {
    setSelectedReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  function approve() {
    const range = totalRange(claim!.panels);
    const withChanges = hasDeltas;
    claimsStore.update(claim!.id, (c) => {
      c.status = withChanges ? "approved-with-changes" : "approved";
      c.activity.push({
        timestamp: nowStamp(),
        action: withChanges ? "Approved with changes" : "Approved",
        detail: withChanges
          ? `Deltas logged${selectedReasons.length ? ` · ${selectedReasons.join(", ")}` : ""} · ${formatRange(range)}`
          : `${formatRange(range)} authorized`,
      });
      return c;
    });
    setEditing(false);
    setBanner({
      tone: "ok",
      text: withChanges
        ? `Approved with changes — deltas logged for evaluation · ${formatRange(range)} authorized`
        : `Estimate approved — ${formatRange(range)} authorized · decision logged`,
    });
  }

  function escalate(reason: string, note: string) {
    claimsStore.update(claim!.id, (c) => {
      c.status = "escalated";
      c.routing = "escalated";
      c.activity.push({
        timestamp: nowStamp(),
        action: "Escalated to senior adjuster",
        detail: `${reason}${note ? ` · ${note}` : ""}`,
      });
      return c;
    });
    setEscalateOpen(false);
    setBanner({
      tone: "warn",
      text: "Escalated to senior adjuster — full AI assessment and photos attached.",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BarqHeader />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4">
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Queue
          </button>
        </div>

        {banner && (
          <div
            className={`mb-6 rounded-md border px-4 py-3 text-sm ${
              banner.tone === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {banner.text}
          </div>
        )}

        {/* Header block */}
        <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-slate-900">{claim.id}</h1>
                <RoutingBadge routing={claim.routing} />
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {claim.policyholder} · {claim.vehicle}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{claim.incident}</p>
              {claim.note && (
                <p className="mt-2 text-xs text-rose-700">Note: {claim.note}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Total estimate
              </div>
              <div className="font-mono text-lg font-semibold text-slate-900">
                {formatRange(total)}
              </div>
            </div>
          </div>

          {/* Evidence Gate strip */}
          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Evidence Gate
            </div>
            <p className="mt-1 text-sm text-slate-800">{claim.gate.rationale}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Evaluation coverage: {claim.gate.evaluationCoverage}%</span>
              <div className="h-1.5 flex-1 max-w-[240px] rounded-full bg-slate-200">
                <div
                  className="h-1.5 rounded-full bg-slate-700"
                  style={{ width: `${claim.gate.evaluationCoverage}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Photos */}
        <section className="mt-6 rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Photos</h2>
          <div className="mt-3 flex flex-wrap gap-4">
            {claim.photos.map((p) => (
              <button
                key={p.filename}
                onClick={() => p.src && setActivePhoto(p)}
                disabled={!p.src}
                className="w-40 cursor-pointer text-left disabled:cursor-default"
              >
                {p.src ? (
                  <img
                    src={p.src}
                    alt={p.filename}
                    loading="lazy"
                    className={`h-24 w-full rounded-md border border-border object-cover ${
                      claim.id === "CLM-1043" ? "object-top" : "object-center"
                    }`}
                  />
                ) : (
                  <div
                    className="flex h-24 items-center justify-center rounded-md border border-border text-xs text-white/80"
                    style={{
                      background: `linear-gradient(135deg, hsl(${p.hue} 40% 55%), hsl(${p.hue} 30% 35%))`,
                    }}
                  >
                    photo
                  </div>
                )}
                <p className="mt-1 truncate text-xs text-muted-foreground">{p.filename}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Panel table */}
        <section className="mt-6 rounded-lg border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">AI assessment</h2>
            {editing && (
              <span className="text-xs text-amber-700">Editing — changes are highlighted</span>
            )}
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-2.5 font-medium">Panel</th>
                <th className="px-6 py-2.5 font-medium">Damage type</th>
                <th className="px-6 py-2.5 font-medium">Severity</th>
                <th className="px-6 py-2.5 font-medium">Action</th>
                <th className="px-6 py-2.5 text-right font-medium">Est. range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {claim.panels.map((p) => {
                const range = panelRange(p);
                const changed =
                  p.original &&
                  (p.original.severity !== p.severity ||
                    p.original.action !== p.action ||
                    p.original.damageType !== p.damageType);
                return (
                  <tr key={p.id} className={changed ? "bg-amber-50" : ""}>
                    <td className="px-6 py-3 font-medium text-slate-900">{p.panel}</td>
                    <td className="px-6 py-3 text-slate-800">
                      {editing ? (
                        <input
                          className="rounded border border-slate-300 px-2 py-1 text-sm"
                          value={p.damageType}
                          onChange={(e) =>
                            patchPanel(p.id, { damageType: e.target.value })
                          }
                        />
                      ) : (
                        <span>
                          {p.damageType}
                          {changed && p.original!.damageType !== p.damageType && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              was {p.original!.damageType}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-800">
                      {editing ? (
                        <select
                          className="rounded border border-slate-300 px-2 py-1 text-sm"
                          value={p.severity}
                          onChange={(e) =>
                            patchPanel(p.id, { severity: Number(e.target.value) })
                          }
                        >
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>
                          {p.severity}
                          {changed && p.original!.severity !== p.severity && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              was {p.original!.severity}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-800">
                      {editing ? (
                        <select
                          className="rounded border border-slate-300 px-2 py-1 text-sm"
                          value={p.action}
                          onChange={(e) =>
                            patchPanel(p.id, { action: e.target.value as Action })
                          }
                        >
                          <option>Repair</option>
                          <option>Replace</option>
                        </select>
                      ) : (
                        <span>
                          {p.action}
                          {changed && p.original!.action !== p.action && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              was {p.original!.action}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-900">
                      {formatRange(range)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-slate-50">
                <td colSpan={4} className="px-6 py-3 text-right text-xs uppercase tracking-wide text-muted-foreground">
                  Total estimate
                </td>
                <td className="px-6 py-3 text-right font-mono font-semibold text-slate-900">
                  {formatRange(total)}
                </td>
              </tr>
            </tfoot>
          </table>

          {editing && (
            <div className="border-t border-border px-6 py-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Reason for edit
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {EDIT_REASON_CHIPS.map((r) => {
                  const active = selectedReasons.includes(r);
                  return (
                    <button
                      key={r}
                      onClick={() => toggleReason(r)}
                      className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                        active
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Action bar */}
        {claim.status === "pending" || claim.status === "approved-with-changes" ? (
          <section className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
            <button
              onClick={approve}
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {hasDeltas ? "Approve with changes" : "Approve estimate"}
            </button>
            <button
              onClick={() => setEditing((v) => !v)}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {editing ? "Done editing" : "Edit assessment"}
            </button>
            <button
              onClick={() => setEscalateOpen(true)}
              className="inline-flex items-center rounded-md border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Escalate
            </button>
          </section>
        ) : (
          <section className="mt-6 rounded-lg border border-border bg-white p-4 text-sm text-muted-foreground shadow-sm">
            This claim is {claim.status.replace("-", " ")} — no further action available.
          </section>
        )}

        {/* Under the hood */}
        <section className="mt-6 rounded-lg border border-border bg-white shadow-sm">
          <button
            onClick={() => setShowUnderHood((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <span className="text-sm font-semibold text-slate-900">
              Under the hood — Evidence Gate inputs
            </span>
            <span className="text-xs text-muted-foreground">
              {showUnderHood ? "Hide" : "Show"}
            </span>
          </button>
          {showUnderHood && (
            <div className="grid gap-4 border-t border-border px-6 py-5 text-sm md:grid-cols-2">
              <GateRow label="Claim-type validation" value={claim.gate.claimTypeValidation} />
              <GateRow label="Evidence quality" value={claim.gate.evidenceQuality} />
              <GateRow label="Claim risk" value={claim.gate.claimRisk} />
              <GateRow
                label="Evaluation coverage"
                value={`${claim.gate.evaluationCoverage}%`}
              />
              <div className="md:col-span-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Per-panel cost citations
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-800">
                  {claim.gate.citations.map((c) => (
                    <li key={c.panel}>
                      <span className="font-medium">{c.panel}:</span>{" "}
                      <span className="text-slate-700">{c.source}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Activity log */}
        <section className="mt-6 rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Activity log</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {claim.activity.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-12 font-mono text-xs text-muted-foreground">
                  {a.timestamp}
                </span>
                <span className="text-slate-800">
                  {a.action}
                  {a.detail && (
                    <span className="text-muted-foreground"> · {a.detail}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {activePhoto && (
        <PhotoLightbox photo={activePhoto} onClose={() => setActivePhoto(null)} />
      )}

      {escalateOpen && (
        <EscalateModal onCancel={() => setEscalateOpen(false)} onConfirm={escalate} />
      )}
    </div>
  );
}

function GateRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-800">{value}</div>
    </div>
  );
}

function EscalateModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (reason: string, note: string) => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">Escalate claim</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Full AI assessment and photos will be attached to the escalation.
        </p>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reason (required)
          </label>
          <div className="space-y-1">
            {ESCALATION_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                {r}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Note (optional)
          </label>
          <textarea
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={!reason}
            onClick={() => onConfirm(reason, note)}
            className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Escalate
          </button>
        </div>
      </div>
    </div>
  );
}
