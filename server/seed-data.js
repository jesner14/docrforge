export const ORG_SYSTEM = "org-system";

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
  "settings",
  "organismes",
  "library",
  "designer",
  "documents",
  "profiles",
  "users",
];

export const SEED_PROFILES = [
  { id: "p-superadmin", label: "Super administrateur", screenIds: SUPERADMIN_SCREENS },
  { id: "p-facturation", label: "Facturation", screenIds: ["dashboard", "facturation", "depenses", "settings", "library", "designer", "documents"] },
  { id: "p-administration", label: "Administration", screenIds: ["dashboard", "administration", "settings", "library", "designer", "documents"] },
  { id: "p-rh", label: "RH", screenIds: ["dashboard", "rh", "settings", "library", "designer", "documents"] },
  { id: "p-assistante", label: "Assistante de direction", screenIds: ["dashboard", "assistante", "settings", "library", "designer", "documents"] },
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
