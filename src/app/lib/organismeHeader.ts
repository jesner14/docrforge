import type { Organisme, User } from "./types";
import type { DocData } from "./types";

export const ORGANISME_HEADER_KEYS = ["companyName", "companyAddress", "companyEmail", "companyPhone", "companyLogo"] as const;

export function isOrganismeHeaderField(key: string) {
  return (ORGANISME_HEADER_KEYS as readonly string[]).includes(key);
}

export function organismeHeaderFromUser(user: User): Partial<DocData> {
  return {
    companyName: user.company,
    companyAddress: user.companyAddress,
    companyEmail: user.companyEmail,
    companyPhone: user.companyPhone,
    companyLogo: user.companyLogo || "",
  };
}

export function organismeHeaderFromOrganisme(org: Organisme): Partial<DocData> {
  return {
    companyName: org.name,
    companyAddress: org.address,
    companyEmail: org.email,
    companyPhone: org.phone,
    companyLogo: org.logo || "",
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
