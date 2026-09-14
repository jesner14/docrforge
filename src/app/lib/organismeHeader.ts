import type { Organisme, User } from "./types";
import type { DocData } from "./types";

export const ORGANISME_HEADER_KEYS = [
  "companyName",
  "companyAddress",
  "companyEmail",
  "companyPhone",
  "companyLogo",
  "companyNinea",
  "companyRc",
  "companyRib",
  "companyWebsite",
  "companySlogan",
  "companyHeaderColor",
  "companyFooterColor",
  "companyLogoInHeader",
  "companyLogoAsBackground",
  "companyHeaderNameAlign",
  "companyLogoAlign",
  "companyLogoScale",
  "companyShowHeaderDocRef",
] as const;

export function isOrganismeHeaderField(key: string) {
  return (ORGANISME_HEADER_KEYS as readonly string[]).includes(key);
}

export function organismeHeaderFromUser(user: User): Partial<DocData> {
  return {
    companyName: user.company,
    companyAddress: user.companyAddress,
    companyEmail: (user.companyEmail || "").endsWith(".local") ? "" : user.companyEmail || "",
    companyPhone: user.companyPhone,
    companyLogo: user.companyLogo || "",
    companyNinea: user.companyNinea || "",
    companyRc: user.companyRc || "",
    companyRib: user.companyRib || "",
    companyWebsite: user.companyWebsite || "",
    companySlogan: user.companySlogan || "",
    companyHeaderColor: user.companyHeaderColor || "#1C2340",
    companyFooterColor: user.companyFooterColor || "#2F4F9A",
    companyLogoInHeader: user.companyLogoInHeader !== false,
    companyLogoAsBackground: !!user.companyLogoAsBackground,
    companyHeaderNameAlign: user.companyHeaderNameAlign === "right" ? "right" : "left",
    companyLogoAlign: user.companyLogoAlign === "right" ? "right" : "left",
    companyLogoScale:
      user.companyLogoScale === 2 || user.companyLogoScale === 3 || user.companyLogoScale === 4
        ? user.companyLogoScale
        : 1,
    companyShowHeaderDocRef: user.companyShowHeaderDocRef !== false,
  };
}

export function organismeHeaderFromOrganisme(org: Organisme): Partial<DocData> {
  return {
    companyName: org.name,
    companyAddress: org.address,
    companyEmail: org.email,
    companyPhone: org.phone,
    companyLogo: org.logo || "",
    companyNinea: org.ninea || "",
    companyRc: org.rc || "",
    companyRib: org.rib || "",
    companyWebsite: org.website || "",
    companySlogan: org.slogan || "",
    companyHeaderColor: org.headerColor || "#1C2340",
    companyFooterColor: org.footerColor || "#2F4F9A",
    companyLogoInHeader: org.logoInHeader !== false,
    companyLogoAsBackground: !!org.logoAsBackground,
    companyHeaderNameAlign: org.headerNameAlign === "right" ? "right" : "left",
    companyLogoAlign: org.logoAlign === "right" ? "right" : "left",
    companyLogoScale: org.logoScale === 2 || org.logoScale === 3 || org.logoScale === 4 ? org.logoScale : 1,
    companyShowHeaderDocRef: org.showHeaderDocRef !== false,
  };
}

/** Applique l'en-tête organisme — écrase toute valeur saisie dans le document. */
export function withOrganismeHeader(data: DocData, user: User): DocData {
  return { ...data, ...organismeHeaderFromUser(user) };
}

export function withOrganismeFromOrg(data: DocData, org: Organisme): DocData {
  return { ...data, ...organismeHeaderFromOrganisme(org) };
}

export function visibleFormFields<T extends { key: string; section?: string }>(fields: T[]): T[] {
  return fields.filter((f) => !isOrganismeHeaderField(f.key));
}
