export type Role = "facturation" | "administration" | "rh" | "assistante";

export type View =
  | "dashboard"
  | "templates"
  | "editor"
  | "documents"
  | "designer"
  | "library"
  | "profiles"
  | "users"
  | "depenses"
  | "settings"
  | "organismes";

export type ExportFormat = "pdf" | "excel" | "word";

export type FieldType = "text" | "textarea" | "date" | "number" | "email" | "select" | "table";

export type LayoutKind =
  | "invoice-simple"
  | "invoice-commercial"
  | "invoice-vat"
  | "quote"
  | "purchase-order"
  | "receipt"
  | "minutes"
  | "official-minutes"
  | "letter"
  | "memo"
  | "report"
  | "certificate"
  | "attendance"
  | "planning"
  | "leave"
  | "agenda"
  | "weekly-planning"
  | "tracking"
  | "assistant-minutes"
  | "convocation"
  | "custom";

export interface TableColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
}

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  columns?: TableColumn[];
  section?: string;
}

export type BlockType =
  | "heading"
  | "paragraph"
  | "field-row"
  | "table"
  | "divider"
  | "spacer"
  | "signature"
  | "header-band";

export interface DesignerBlock {
  id: string;
  type: BlockType;
  content?: string;
  level?: 1 | 2 | 3;
  align?: "left" | "center" | "right";
  tableField?: string;
  keys?: string[];
  subtitle?: string;
}

export interface DocTemplate {
  id: string;
  name: string;
  category: Role;
  description: string;
  icon: string;
  color: string;
  layout: LayoutKind;
  fields: TemplateField[];
  defaults: Record<string, unknown>;
  blocks?: DesignerBlock[];
  builtin?: boolean;
  basedOn?: string;
  ownerId?: string;
  organismeId?: string;
  savedAt?: string;
}

export interface AppScreen {
  id: string;
  label: string;
  role: string;
  kind: "module" | "tool" | "admin" | "document";
  module?: Role;
  templateId?: string;
}

export interface Organisme {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  logo: string;
  currency: "EUR" | "USD" | "FCFA";
}

export interface Profile {
  id: string;
  label: string;
  screenIds: string[];
}

export interface User {
  id: string;
  login: string;
  password: string;
  name: string;
  profileId: string;
  organismeId: string;
  title: string;
  company: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyLogo?: string;
  initials: string;
  /** Premier pôle métier du profil, pour la rétrocompatibilité. */
  role: Role;
}

export interface SavedDocument {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  category: Role;
  recipient: string;
  date: string;
  status: "Brouillon" | "Finalisé" | "Envoyé";
  data: Record<string, unknown>;
  authorId: string;
  organismeId?: string;
  docYear?: number;
  docMonth?: number;
  updatedAt?: string;
}

export type DocData = Record<string, unknown>;

export interface ExpenseLine {
  id: string;
  item: string;
  libelle: string;
  codeRecu: string;
  date: string;
  entree: number;
  montant: number;
  observation: string;
}

export interface ExpenseMonth {
  id: string;
  year: number;
  month: number;
  sealed: boolean;
  sealedAt?: string;
  lines: ExpenseLine[];
  updatedAt: string;
  organismeId?: string;
}
