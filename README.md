# Barq — AI-Assisted Claims Review (Prototype)

Barq is a prototype claims-review dashboard for car insurance claims agents.

AI assesses vehicle damage photos and drafts panel-level repair estimates;

the agent approves, edits, or escalates. Barq routes; humans decide.

Built for the Scale AI PM take-home. All AI responses are simulated with

mock data (see src/data) — the PRD describes the production pipeline this

stands in for. The claim-intake screen is a demonstration harness; in

production, claims arrive through the carrier's existing intake systems.

## Run locally

Requires Node.js 18+.

    npm install

    npm run dev

Then open the local URL shown in the terminal (typically http://localhost:8080).

## Demo path

1. Queue → three claims routed by the Evidence Gate (fast-track / standard / escalated)

2. Claim A → one-click approve

3. Claim B → Edit: change a severity, estimate recalculates from carrier cost data

4. Claim C → open "Under the hood," then escalate with a reason

5. "New claim" → intake harness: upload a photo, see the simulated assessment

Built with Lovable (React + Vite + Tailwind).
