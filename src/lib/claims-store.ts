import { useSyncExternalStore } from "react";
import { INITIAL_CLAIMS, type Claim } from "./claims-data";

// Simple in-memory store shared across routes.
let claims: Claim[] = INITIAL_CLAIMS.map((c) => structuredClone(c));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const claimsStore = {
  getAll(): Claim[] {
    return claims;
  },
  get(id: string): Claim | undefined {
    return claims.find((c) => c.id === id);
  },
  update(id: string, updater: (c: Claim) => Claim) {
    claims = claims.map((c) => (c.id === id ? updater(structuredClone(c)) : c));
    emit();
  },
  reset() {
    claims = INITIAL_CLAIMS.map((c) => structuredClone(c));
    emit();
  },
  add(claim: Claim) {
    claims = [claim, ...claims];
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useClaims(): Claim[] {
  return useSyncExternalStore(
    (l) => claimsStore.subscribe(l),
    () => claimsStore.getAll(),
    () => claimsStore.getAll()
  );
}

export function useClaim(id: string): Claim | undefined {
  return useSyncExternalStore(
    (l) => claimsStore.subscribe(l),
    () => claimsStore.get(id),
    () => claimsStore.get(id)
  );
}
