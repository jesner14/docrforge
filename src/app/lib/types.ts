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
  | "locations"
  | "settings"
  | "organismes";

export type ExportFormat = "pdf" | "excel" | "word";

export type FieldType = "text" | "textarea" | "date" | "number" | "email" | "select" | "table" | "checkbox";

export type LayoutKind =
  | "invoice"
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
  /** Afficher ce champ seulement si la case cochée (clé) est active. */
  showWhen?: string;
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
  organismeId: string;
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

export type RentalStatus = "non payé" | "partiellement payé" | "soldé";

export type ProlongementStatus = "Encaissé" | "Non encaissé" | "Partiellement encaissé";

export interface RentalLine {
  id: string;
  numero: string;
  date: string;
  client: string;
  vehicule: string;
  immatriculation: string;
  jours: number;
  montantAPayer: number;
  montantEncaisse: number;
  livreur: string;
  dateRemiseCaisse: string;
  /** @deprecated Ancien nom — lu en secours pour les données déjà enregistrées. */
  dateRemiseVehicule?: string;
  statut: RentalStatus | "";
  nbProlongements: number;
  statutProlongement: ProlongementStatus | "";
  montantProlongementEncaisse: number;
  modePaiement: string;
  observation: string;
  sealed?: boolean;
  sealedAt?: string;
}

export interface RentalMonth {
  id: string;
  year: number;
  month: number;
  sealed: boolean;
  sealedAt?: string;
  lines: RentalLine[];
  updatedAt: string;
  organismeId?: string;
}
