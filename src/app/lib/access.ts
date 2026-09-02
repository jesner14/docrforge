import type { AppScreen, Organisme, Profile, Role, User } from "./types";
import { uid } from "./helpers";
import { BUILTIN_TEMPLATES } from "./templates";

export const MODULE_ORDER: Role[] = ["facturation", "administration", "rh", "assistante"];

export function docScreenId(templateId: string) {
  return `doc:${templateId}`;
}

export const DOCUMENT_SCREENS: AppScreen[] = BUILTIN_TEMPLATES.map((t) => ({
  id: docScreenId(t.id),
  label: t.name,
  role: `ROLE_${t.id.replace(/-/g, "_").toUpperCase()}`,
  kind: "document",
  module: t.category,
  templateId: t.id,
}));

export const SCREENS: AppScreen[] = [
  { id: "dashboard", label: "Tableau de bord", role: "ROLE_DASHBOARD", kind: "tool" },
  { id: "facturation", label: "Facturation (tout le pôle)", role: "ROLE_FACTURATION", kind: "module", module: "facturation" },
  { id: "administration", label: "Administration (tout le pôle)", role: "ROLE_ADMINISTRATION", kind: "module", module: "administration" },
  { id: "rh", label: "RH (tout le pôle)", role: "ROLE_RH", kind: "module", module: "rh" },
  { id: "assistante", label: "Assistante de direction (tout le pôle)", role: "ROLE_ASSISTANTE", kind: "module", module: "assistante" },
  ...DOCUMENT_SCREENS,
  { id: "depenses", label: "Suivi des dépenses", role: "ROLE_DEPENSES", kind: "tool" },
  { id: "settings", label: "Paramétrage", role: "ROLE_SETTINGS", kind: "tool" },
  { id: "organismes", label: "Organismes", role: "ROLE_ORGANISMES", kind: "admin" },
  { id: "library", label: "Bibliothèque", role: "ROLE_LIBRARY", kind: "tool" },
  { id: "designer", label: "Créer un modèle", role: "ROLE_DESIGNER", kind: "tool" },
  { id: "documents", label: "Mes documents", role: "ROLE_DOCUMENTS", kind: "tool" },
  { id: "profiles", label: "Profils", role: "ROLE_PROFILES", kind: "admin" },
  { id: "users", label: "Utilisateurs", role: "ROLE_USERS", kind: "admin" },
];

export const ORG_SYSTEM = "org-system";

/** Organisme technique — rattachement du superadmin uniquement. */
export const SEED_ORGANISMES: Organisme[] = [
  {
    id: ORG_SYSTEM,
    name: "Administration système",
    address: "",
    email: "",
    phone: "",
    logo: "",
    currency: "EUR",
  },
];

const ALL_SCREEN_IDS = SCREENS.map((s) => s.id);

export const SEED_PROFILES: Profile[] = [
  { id: "p-superadmin", label: "Super administrateur", screenIds: [...ALL_SCREEN_IDS] },
  { id: "p-facturation", label: "Facturation", screenIds: ["dashboard", "facturation", "depenses", "settings", "library", "designer", "documents"] },
  { id: "p-administration", label: "Administration", screenIds: ["dashboard", "administration", "settings", "library", "designer", "documents"] },
  { id: "p-rh", label: "RH", screenIds: ["dashboard", "rh", "settings", "library", "designer", "documents"] },
  { id: "p-assistante", label: "Assistante de direction", screenIds: ["dashboard", "assistante", "settings", "library", "designer", "documents"] },
];

export const SEED_USERS: User[] = [
  {
    id: "u-superadmin",
    login: "jesner.landa",
    password: "14Mars1996++",
    name: "Jesner Landa",
    profileId: "p-superadmin",
    organismeId: ORG_SYSTEM,
    title: "Super administrateur",
    companyEmail: "",
    company: "Administration système",
    companyAddress: "",
    companyPhone: "",
    initials: "JL",
    role: "facturation",
  },
];

export function isSuperAdmin(profile: Profile | null) {
  return profile?.id === "p-superadmin";
}

export function isAdminProfile(profile: Profile | null) {
  return profile?.id === "p-superadmin" || profile?.id === "p-admin";
}

export function findScreen(id: string) {
  return SCREENS.find((s) => s.id === id);
}

export function profileOf(user: User, profiles: Profile[]) {
  return profiles.find((p) => p.id === user.profileId) ?? null;
}

export function hasScreen(profile: Profile | null, screenId: string) {
  return !!profile?.screenIds.includes(screenId);
}

export function isScreenAssigned(profile: Profile | null, screenId: string) {
  if (!profile) return false;
  if (profile.screenIds.includes(screenId)) return true;
  const s = findScreen(screenId);
  if (s?.kind === "document" && s.module && profile.screenIds.includes(s.module)) return true;
  return false;
}

export function allowedTemplateIds(profile: Profile | null): string[] {
  if (!profile) return [];
  const ids = new Set<string>();
  for (const sid of profile.screenIds) {
    const s = findScreen(sid);
    if (!s) continue;
    if (s.kind === "document" && s.templateId) ids.add(s.templateId);
    if (s.kind === "module" && s.module) {
      for (const t of BUILTIN_TEMPLATES) {
        if (t.category === s.module) ids.add(t.id);
      }
    }
  }
  return [...ids];
}

export function modulesOf(profile: Profile | null): Role[] {
  if (!profile) return [];
  const roles = new Set<Role>();
  for (const sid of profile.screenIds) {
    const s = findScreen(sid);
    if (s?.module) roles.add(s.module);
  }
  return MODULE_ORDER.filter((r) => roles.has(r));
}

export function profileChipIds(profile: Profile) {
  return profile.screenIds.filter((id) => {
    const s = findScreen(id);
    if (!s) return true;
    if (s.kind === "document" && s.module && profile.screenIds.includes(s.module)) return false;
    return true;
  });
}

export function chipLabel(id: string) {
  const s = findScreen(id);
  if (!s) return id;
  if (s.kind === "module") return s.label.replace(" (tout le pôle)", "");
  return s.label;
}

export function syncUserRole(user: User, profiles: Profile[]): User {
  const mods = modulesOf(profileOf(user, profiles));
  return { ...user, role: mods[0] || user.role || "facturation" };
}

export function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function newProfile(): Profile {
  return { id: `p-${uid()}`, label: "", screenIds: ["dashboard"] };
}

export function newUser(profileId: string, organismeId: string, org?: Organisme): User {
  return {
    id: `u-${uid()}`,
    login: "",
    password: "",
    name: "",
    profileId,
    organismeId,
    title: "",
    company: org?.name || "",
    companyAddress: org?.address || "",
    companyEmail: "",
    companyPhone: org?.phone || "",
    initials: "",
    role: "facturation",
  };
}

export function applyOrganisme(user: User, org: Organisme | null): User {
  if (!org) return user;
  return {
    ...user,
    organismeId: org.id,
    company: org.name,
    companyAddress: org.address,
    companyEmail: org.email || user.companyEmail,
    companyPhone: org.phone || user.companyPhone,
    companyLogo: org.logo || undefined,
  };
}

export function newOrganisme(): Organisme {
  return {
    id: `org-${uid()}`,
    name: "",
    address: "",
    email: "",
    phone: "",
    logo: "",
    currency: "EUR",
  };
}

export function findOrganisme(organismes: Organisme[], id: string) {
  return organismes.find((o) => o.id === id) ?? null;
}

export function belongsToOrganisme<T extends { organismeId?: string }>(item: T, organismeId: string) {
  return !item.organismeId || item.organismeId === organismeId;
}

export function authenticate(users: User[], login: string, password: string) {
  const l = login.trim().toLowerCase();
  return users.find((u) => u.login.toLowerCase() === l && u.password === password) ?? null;
}
