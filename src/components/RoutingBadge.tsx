import { ROUTING_META, type Routing } from "@/lib/claims-data";

export function RoutingBadge({ routing }: { routing: Routing }) {
  const meta = ROUTING_META[routing];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.classes}`}
    >
      {meta.label}
    </span>
  );
}
