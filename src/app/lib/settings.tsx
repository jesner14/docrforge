import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { asCurrency, type CurrencyCode } from "./helpers";
import type { Organisme, User } from "./types";
import { findOrganisme, SEED_ORGANISMES } from "./access";

const FALLBACK_ORG = SEED_ORGANISMES[0];

export type OrganismesUpdater = Organisme[] | ((prev: Organisme[]) => Organisme[]);

const Ctx = createContext<{
  organisme: Organisme;
  currency: CurrencyCode;
  updateOrganisme: (patch: Partial<Organisme>) => void;
} | null>(null);

export function OrganismeProvider({
  user,
  organismes,
  onOrganismesChange,
  children,
}: {
  user: User;
  organismes: Organisme[];
  onOrganismesChange: (next: OrganismesUpdater) => void | Promise<void>;
  children: ReactNode;
}) {
  const organisme = useMemo(
    () => findOrganisme(organismes, user.organismeId) ?? organismes[0] ?? FALLBACK_ORG,
    [organismes, user.organismeId]
  );

  const currency = asCurrency(organisme.currency);

  const updateOrganisme = useCallback(
    (patch: Partial<Organisme>) => {
      const orgId = user.organismeId;
      onOrganismesChange((prev) =>
        prev.map((o) => {
          if (o.id !== orgId) return o;
          const next = { ...o, ...patch };
          if (patch.currency !== undefined) next.currency = asCurrency(patch.currency);
          return next;
        })
      );
    },
    [user.organismeId, onOrganismesChange]
  );

  const value = useMemo(
    () => ({ organisme: { ...organisme, currency }, currency, updateOrganisme }),
    [organisme, currency, updateOrganisme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrganisme() {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  return {
    organisme: { ...FALLBACK_ORG, currency: asCurrency(FALLBACK_ORG.currency) },
    currency: asCurrency(FALLBACK_ORG.currency),
    updateOrganisme: () => {},
  };
}

/** @deprecated alias — préférez useOrganisme() */
export function useSettings() {
  const { currency, organisme, updateOrganisme } = useOrganisme();
  return { settings: { currency }, currency, organisme, updateOrganisme };
}
