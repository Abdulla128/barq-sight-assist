import { createFileRoute, Link } from "@tanstack/react-router";
import { BarqHeader } from "@/components/BarqHeader";
import { RoutingBadge } from "@/components/RoutingBadge";
import { useClaims } from "@/lib/claims-store";
import { formatRange, totalRange, type Status } from "@/lib/claims-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barq — Claims queue" },
      {
        name: "description",
        content:
          "Barq routes AI-drafted vehicle damage assessments to the right adjuster. Humans decide.",
      },
      { property: "og:title", content: "Barq — Claims queue" },
      {
        property: "og:description",
        content: "AI-assisted car insurance claims review. Routing basis.",
      },
    ],
  }),
  component: QueuePage,
});

const STATUS_LABEL: Record<Status, { label: string; classes: string }> = {
  pending: { label: "Pending review", classes: "text-muted-foreground" },
  approved: { label: "Approved", classes: "text-emerald-700" },
  "approved-with-changes": { label: "Approved · edited", classes: "text-emerald-700" },
  escalated: { label: "Escalated", classes: "text-rose-700" },
};

function QueuePage() {
  const claims = useClaims();

  return (
    <div className="min-h-screen bg-slate-50">
      <BarqHeader>
        <Link
          to="/intake"
          className="inline-flex items-center rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          New claim
        </Link>
      </BarqHeader>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Claims queue</h1>
            <p className="text-sm text-muted-foreground">
              {claims.length} claims · sorted by arrival
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <LegendDot classes="bg-emerald-500" label="Fast-track" />
            <LegendDot classes="bg-amber-500" label="Standard review" />
            <LegendDot classes="bg-rose-500" label="Escalated" />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Claim</th>
                <th className="px-4 py-3 font-medium">Policyholder</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Incident</th>
                <th className="px-4 py-3 font-medium">Estimate</th>
                <th className="px-4 py-3 font-medium">Routing basis</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {claims.map((c) => {
                const range = totalRange(c.panels);
                const status = STATUS_LABEL[c.status];
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 align-top">
                      <Link
                        to="/claims/$id"
                        params={{ id: c.id }}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {c.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-800">
                      <div>{c.policyholder}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {c.policyNumber}
                      </div>
                    </td>

                    <td className="px-4 py-4 align-top text-slate-800">{c.vehicle}</td>
                    <td className="px-4 py-4 align-top text-slate-700">{c.incident}</td>
                    <td className="px-4 py-4 align-top font-mono text-slate-900">
                      {formatRange(range)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-1.5">
                        <RoutingBadge routing={c.routing} />
                        <span className="text-xs text-muted-foreground">
                          {c.gate.rationale}
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-4 align-top text-xs font-medium ${status.classes}`}>
                      {status.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function LegendDot({ classes, label }: { classes: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${classes}`} />
      {label}
    </span>
  );
}
