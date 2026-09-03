import type { DocTemplate, ExpenseMonth, Organisme, Profile, RentalMonth, SavedDocument, User } from "./types";
import { api } from "./api";

export async function loginUser(login: string, password: string) {
  const { user } = await api.login(login, password);
  return user;
}

export async function logoutUser() {
  await api.logout();
}

export async function fetchBootstrap() {
  return api.bootstrap();
}

export async function tryRestoreSession() {
  try {
    const { user } = await api.me();
    return user;
  } catch {
    return null;
  }
}

export async function saveProfiles(organismeId: string, profiles: Profile[]) {
  const { profiles: saved } = await api.saveProfiles(organismeId, profiles);
  return saved;
}

export async function saveAppUsers(users: User[]) {
  const { users: saved } = await api.saveUsers(users);
  return saved;
}

export async function saveOrganismes(organismes: Organisme[]) {
  const { organismes: saved, profiles } = await api.saveOrganismes(organismes);
  return { organismes: saved, profiles };
}

export async function saveDocuments(documents: SavedDocument[]) {
  const { documents: saved } = await api.saveDocuments(documents);
  return saved;
}

export async function saveCustomTemplates(templates: DocTemplate[]) {
  const { templates: saved } = await api.saveTemplates(templates);
  return saved;
}

export async function saveExpenseMonths(months: ExpenseMonth[]) {
  const { expenseMonths: saved } = await api.saveExpenseMonths(months);
  return saved;
}

export async function saveRentalMonths(months: RentalMonth[]) {
  const { rentalMonths: saved } = await api.saveRentalMonths(months);
  return saved;
}
