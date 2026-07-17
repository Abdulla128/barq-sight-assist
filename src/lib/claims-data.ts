// Barq mock data — single source of truth. Easy to edit.

export type Routing = "fast-track" | "standard" | "escalated";
export type Action = "Repair" | "Replace";
export type Status = "pending" | "approved" | "approved-with-changes" | "escalated";

export interface CostRange {
  low: number;
  high: number;
}

// Cost model, uniform for all panels.
export const COST_MODEL: Record<number, CostRange> = {
  1: { low: 180, high: 240 },
  2: { low: 400, high: 520 },
  3: { low: 850, high: 1050 },
  4: { low: 1400, high: 1750 },
  5: { low: 2400, high: 3000 },
};

export function costForSeverity(sev: number): CostRange {
  return COST_MODEL[sev] ?? { low: 0, high: 0 };
}

export interface PanelAssessment {
  id: string;
  panel: string;
  damageType: string;
  severity: number; // 0-5
  action: Action;
  // Original AI values, retained for diffing after edits
  original?: {
    damageType: string;
    severity: number;
    action: Action;
  };
}

export interface EvidenceGate {
  rationale: string; // one-liner for queue + strip
  claimTypeValidation: string;
  evidenceQuality: string;
  claimRisk: string;
  evaluationCoverage: number; // %
  citations: { panel: string; source: string }[];
}

export interface ActivityEntry {
  timestamp: string;
  action: string;
  detail?: string;
}

export interface Photo {
  filename: string;
  // simple color hint for the mock thumbnail (fallback)
  hue: number;
  // optional real image URL; falls back to gradient placeholder when absent
  src?: string;
}

import claimAImg from "@/assets/claim-a.jpg";
import claimA2Img from "@/assets/claim-a-2.jpg";
import claimB1Img from "@/assets/claim-b-1.jpg";
import claimB2Img from "@/assets/claim-b-trunk.jpg";
import claimBRear2Img from "@/assets/claim-b-rear-2.jpg";
import claimC2Img from "@/assets/claim-c-2.jpg";
import claimCFrontImg from "@/assets/claim-c-front.jpg";

export interface Claim {
  id: string;
  policyholder: string;
  policyNumber: string;
  vehicle: string;
  incident: string;
  routing: Routing;
  status: Status;
  panels: PanelAssessment[];

  gate: EvidenceGate;
  photos: Photo[];
  activity: ActivityEntry[];
  note?: string;
}

export function panelRange(p: PanelAssessment): CostRange {
  return costForSeverity(p.severity);
}

export function totalRange(panels: PanelAssessment[]): CostRange {
  return panels.reduce(
    (acc, p) => {
      const r = panelRange(p);
      return { low: acc.low + r.low, high: acc.high + r.high };
    },
    { low: 0, high: 0 }
  );
}

export function formatRange(r: CostRange): string {
  return `$${r.low.toLocaleString()}–$${r.high.toLocaleString()}`;
}

export const ROUTING_META: Record<Routing, { label: string; classes: string }> = {
  "fast-track": {
    label: "Fast-track",
    classes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  standard: {
    label: "Standard review",
    classes: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  },
  escalated: {
    label: "Escalated",
    classes: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  },
};

export const ESCALATION_REASONS = [
  "Suspected structural",
  "Possible total loss",
  "Photos insufficient",
  "Beyond my authority",
  "Policy question",
] as const;

export const EDIT_REASON_CHIPS = [
  "Photo quality",
  "Wrong panel",
  "Severity call",
  "Cost outlier",
] as const;

// Preloaded claims
export const INITIAL_CLAIMS: Claim[] = [
  {
    id: "CLM-1041",
    policyholder: "Sara M.",
    policyNumber: "POL-8842-01",

    vehicle: "2021 Toyota Corolla",
    incident: "Scratched pillar in parking garage.",
    routing: "fast-track",
    status: "pending",
    panels: [
      {
        id: "p1",
        panel: "Front door L",
        damageType: "Scratch",
        severity: 1,
        action: "Repair",
      },
    ],
    gate: {
      rationale:
        "Door scratches sev ≤2: validated, 96% coverage, low value → fast-track.",
      claimTypeValidation: "Validated — door scratch cohort (n=4,120)",
      evidenceQuality: "High — 2 photos, well-lit, panel clearly framed",
      claimRisk: "Low — under $500 authority threshold",
      evaluationCoverage: 96,
      citations: [
        { panel: "Front door L", source: "Carrier cost table v2.3 · paint + light labor" },
      ],
    },
    photos: [
      { filename: "front_door_L_01.jpg", hue: 210, src: claimAImg },
      { filename: "front_door_L_02.jpg", hue: 200, src: claimA2Img },
    ],
    activity: [
      { timestamp: "09:14", action: "Claim received from carrier intake" },
      { timestamp: "09:14", action: "Barq assessment drafted" },
      { timestamp: "09:14", action: "Routed to fast-track" },
    ],
  },
  {
    id: "CLM-1042",
    policyholder: "Omar K.",
    vehicle: "2019 Honda Accord",
    incident: "Rear-ended at traffic light.",
    routing: "standard",
    status: "pending",
    panels: [
      { id: "p1", panel: "Rear bumper", damageType: "Dent", severity: 3, action: "Repair" },
      { id: "p2", panel: "Trunk lid", damageType: "Scratch", severity: 2, action: "Repair" },
      {
        id: "p3",
        panel: "Rear quarter L",
        damageType: "Paint",
        severity: 1,
        action: "Repair",
      },
    ],
    gate: {
      rationale: "Rear-panel dents sev 3: 82% coverage → standard review.",
      claimTypeValidation: "Validated — rear-impact cohort (n=1,880)",
      evidenceQuality: "Medium — 3 photos, one angle partially obstructed",
      claimRisk: "Medium — mid-range value, single-vehicle contact",
      evaluationCoverage: 82,
      citations: [
        { panel: "Rear bumper", source: "Carrier cost table v2.3 · parts + labor" },
        { panel: "Trunk lid", source: "Carrier cost table v2.3 · refinish schedule" },
        { panel: "Rear quarter L", source: "Carrier cost table v2.3 · paint blend" },
      ],
    },
    photos: [
      { filename: "rear_bumper_01.jpg", hue: 220, src: claimB1Img },
      { filename: "rear_bumper_02.jpg", hue: 215, src: claimBRear2Img },
      { filename: "trunk_lid.jpg", hue: 230, src: claimB2Img },
    ],
    activity: [
      { timestamp: "10:02", action: "Claim received from carrier intake" },
      { timestamp: "10:02", action: "Barq assessment drafted" },
      { timestamp: "10:02", action: "Routed to standard review" },
    ],
  },
  {
    id: "CLM-1043",
    policyholder: "Fatima A.",
    vehicle: "2022 Nissan Patrol",
    incident: "Multi-vehicle highway collision, airbags deployed.",
    routing: "escalated",
    status: "pending",
    note: "Possible structural damage — photo evidence insufficient.",
    panels: [
      {
        id: "p1",
        panel: "Front bumper",
        damageType: "Crush",
        severity: 5,
        action: "Replace",
      },
      { id: "p2", panel: "Hood", damageType: "Dent", severity: 4, action: "Replace" },
    ],
    gate: {
      rationale: "Sev 5 + suspected structural: outside validated coverage → escalated.",
      claimTypeValidation:
        "Partial — high-severity multi-panel cohort under-represented (n=210)",
      evidenceQuality: "Low — airbag deployment obscures front cabin angles",
      claimRisk: "High — potential total loss, injury context",
      evaluationCoverage: 41,
      citations: [
        { panel: "Front bumper", source: "Carrier cost table v2.3 · OEM replacement" },
        { panel: "Hood", source: "Carrier cost table v2.3 · OEM replacement + refinish" },
      ],
    },
    photos: [
      { filename: "front_collision_01.jpg", hue: 10, src: claimCFrontImg },
      { filename: "front_collision_02.jpg", hue: 20, src: claimC2Img },
    ],
    activity: [
      { timestamp: "08:47", action: "Claim received from carrier intake" },
      { timestamp: "08:47", action: "Barq assessment drafted" },
      { timestamp: "08:47", action: "Routed to escalated — coverage 41%" },
    ],
  },
];

// Claim D — revealed via intake demo.
export function buildIntakeClaim(input: {
  policyholder: string;
  vehicle: string;
  incident: string;
  photoName?: string;
}): Claim {
  const id = `CLM-${1044 + Math.floor(Math.random() * 900)}`;
  return {
    id,
    policyholder: input.policyholder,
    vehicle: input.vehicle,
    incident: input.incident,
    routing: "standard",
    status: "pending",
    panels: [
      {
        id: "p1",
        panel: "Rear bumper",
        damageType: "Dent",
        severity: 2,
        action: "Repair",
      },
    ],
    gate: {
      rationale: "Within validated coverage → standard review.",
      claimTypeValidation: "Validated — rear-bumper dent cohort (n=2,410)",
      evidenceQuality: "Medium — intake photos accepted",
      claimRisk: "Low-medium — single panel, mid value",
      evaluationCoverage: 88,
      citations: [
        { panel: "Rear bumper", source: "Carrier cost table v2.3 · parts + labor" },
      ],
    },
    photos: [
      { filename: input.photoName || "intake_photo_01.jpg", hue: 200 },
    ],
    activity: [
      { timestamp: nowStamp(), action: "Claim submitted via intake harness" },
      { timestamp: nowStamp(), action: "Barq assessment drafted" },
      { timestamp: nowStamp(), action: "Routed to standard review" },
    ],
  };
}

export function nowStamp(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
