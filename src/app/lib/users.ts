import type { Role } from "./types";

export const ROLE_META: Record<
  Role,
  { label: string; short: string; color: string; description: string }
> = {
  facturation: {
    label: "Facturation",
    short: "Compta",
    color: "#1C2340",
    description: "Factures, devis, bons de commande et reçus",
  },
  administration: {
    label: "Administration",
    short: "Admin",
    color: "#4A0E5C",
    description: "Courriers, PV, notes de service et rapports",
  },
  rh: {
    label: "Ressources humaines",
    short: "RH",
    color: "#2C5F2E",
    description: "Attestations, présence, planning et congés",
  },
  assistante: {
    label: "Assistante de direction",
    short: "Direction",
    color: "#0B3D91",
    description: "Agenda, convocations, suivis et comptes rendus",
  },
};
