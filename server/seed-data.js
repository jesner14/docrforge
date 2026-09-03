export const ORG_SYSTEM = "org-system";

/** Modèles de profils créés automatiquement pour chaque organisme. */
export const DEFAULT_PROFILE_TEMPLATES = [
  { slug: "facturation", label: "Facturation", screenIds: ["dashboard", "facturation", "depenses", "settings", "library", "designer", "documents"] },
  { slug: "administration", label: "Administration", screenIds: ["dashboard", "administration", "settings", "library", "designer", "documents"] },
  { slug: "rh", label: "RH", screenIds: ["dashboard", "rh", "settings", "library", "designer", "documents"] },
  { slug: "assistante", label: "Assistante de direction", screenIds: ["dashboard", "assistante", "locations", "settings", "library", "designer", "documents"] },
];

export function profileIdForOrg(orgId, slug) {
  if (orgId === ORG_SYSTEM) return `p-${slug}`;
  return `${orgId}--${slug}`;
}

/** Organisme technique — rattachement du superadmin uniquement. */
export const SEED_ORGANISMES = [
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

const SUPERADMIN_SCREENS = [
  "dashboard",
  "facturation",
  "administration",
  "rh",
  "assistante",
  "depenses",
  "locations",
  "settings",
  "organismes",
  "library",
  "designer",
  "documents",
  "profiles",
  "users",
];

export const SEED_PROFILES = [
  { id: "p-superadmin", label: "Super administrateur", screenIds: SUPERADMIN_SCREENS, organismeId: ORG_SYSTEM },
  ...DEFAULT_PROFILE_TEMPLATES.map((t) => ({
    id: profileIdForOrg(ORG_SYSTEM, t.slug),
    label: t.label,
    screenIds: t.screenIds,
    organismeId: ORG_SYSTEM,
  })),
];

export const SEED_USERS = [
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
