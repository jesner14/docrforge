import type { DocData, DocTemplate, Role, TemplateField, User } from "./types";
import type { CurrencyCode } from "./helpers";
import { uid } from "./helpers";
import { organismeHeaderFromUser } from "./organismeHeader";

function clientFields(label = "Destinataire"): TemplateField[] {
  return [
    { key: "clientName", label: "Nom / Société", type: "text", section: label },
    { key: "clientAddress", label: "Adresse", type: "text", section: label },
    { key: "clientEmail", label: "Email", type: "email", section: label },
  ];
}

const ITEM_COLS = [
  { key: "description", label: "Description", type: "text" as const },
  { key: "qty", label: "Qté", type: "number" as const },
  { key: "unitPrice", label: "Prix unit.", type: "number" as const },
];

function commercialFields(opts: {
  numberLabel: string;
  due?: boolean;
  tax?: boolean;
  siret?: boolean;
  object?: boolean;
  payment?: boolean;
}): TemplateField[] {
  const fields: TemplateField[] = [
    ...(opts.siret
      ? ([
          { key: "companySiret", label: "SIRET", type: "text", section: "Informations légales" },
          { key: "companyTva", label: "N° TVA", type: "text", section: "Informations légales" },
        ] as TemplateField[])
      : []),
    ...clientFields("Client"),
    { key: "docNumber", label: opts.numberLabel, type: "text", section: "Document" },
    { key: "date", label: "Date", type: "date", section: "Document" },
  ];
  if (opts.due) fields.push({ key: "dueDate", label: "Échéance", type: "date", section: "Document" });
  if (opts.object) fields.push({ key: "object", label: "Objet", type: "text", section: "Document" });
  if (opts.payment) {
    fields.push({
      key: "paymentMethod",
      label: "Mode de paiement",
      type: "select",
      options: ["Espèces", "Carte bancaire", "Virement", "Chèque"],
      section: "Document",
    });
  }
  fields.push({
    key: "currency",
    label: "Devise",
    type: "select",
    options: ["EUR", "USD", "FCFA"],
    section: "Document",
  });
  fields.push({
    key: "items",
    label: "Lignes",
    type: "table",
    columns: ITEM_COLS,
    section: "Lignes",
  });
  if (opts.tax) fields.push({ key: "taxRate", label: "TVA (%)", type: "number", section: "Lignes" });
  fields.push({ key: "notes", label: "Notes / mentions", type: "textarea", section: "Notes" });
  return fields;
}

const SAMPLE_ITEMS = [
  { id: "1", description: "Prestation de conseil stratégique", qty: 4, unitPrice: 850 },
  { id: "2", description: "Atelier de cadrage (demi-journée)", qty: 2, unitPrice: 450 },
];

function commercialDefaults(user: User | null, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    companyName: user?.company ?? "Horizon Conseil SAS",
    companyAddress: user?.companyAddress ?? "14 avenue de l'Opéra, 75001 Paris",
    companyEmail: user?.companyEmail ?? "contact@horizon-conseil.fr",
    companyPhone: user?.companyPhone ?? "+33 1 42 86 10 20",
    companySiret: "834 567 890 00014",
    companyTva: "FR32 834 567 890",
    clientName: "Société Dupont & Fils",
    clientAddress: "45 avenue Victor Hugo, 69006 Lyon",
    clientEmail: "contact@dupont-fils.fr",
    date: "2026-08-19",
    dueDate: "2026-09-18",
    items: SAMPLE_ITEMS.map((i) => ({ ...i })),
    taxRate: 20,
    currency: "EUR",
    notes: "Paiement par virement bancaire sous 30 jours.\nIBAN : FR76 3000 6000 0112 3456 7890 189",
    ...extra,
  };
}

export const BUILTIN_TEMPLATES: DocTemplate[] = [
  {
    id: "facture-simple",
    name: "Facture simple",
    category: "facturation",
    description: "Facture claire, sans mentions complexes",
    icon: "🧾",
    color: "#1C2340",
    layout: "invoice-simple",
    builtin: true,
    fields: commercialFields({ numberLabel: "N° facture", due: true }),
    defaults: commercialDefaults(null, { docNumber: "2026-090", taxRate: 0, notes: "Merci pour votre confiance." }),
  },
  {
    id: "facture-commerciale",
    name: "Facture commerciale",
    category: "facturation",
    description: "Facture complète avec SIRET, TVA et conditions",
    icon: "💼",
    color: "#152038",
    layout: "invoice-commercial",
    builtin: true,
    fields: commercialFields({ numberLabel: "N° facture", due: true, tax: true, siret: true, object: true }),
    defaults: commercialDefaults(null, {
      docNumber: "FC-2026-0142",
      object: "Mission d'accompagnement Q3 2026",
    }),
  },
  {
    id: "facture-tva",
    name: "Facture avec TVA",
    category: "facturation",
    description: "Facture détaillée HT / TVA / TTC",
    icon: "💳",
    color: "#7A1515",
    layout: "invoice-vat",
    builtin: true,
    fields: commercialFields({ numberLabel: "N° facture", due: true, tax: true, siret: true }),
    defaults: commercialDefaults(null, { docNumber: "FT-2026-0088" }),
  },
  {
    id: "devis",
    name: "Devis",
    category: "facturation",
    description: "Proposition commerciale chiffrée",
    icon: "📋",
    color: "#2C5F2E",
    layout: "quote",
    builtin: true,
    fields: commercialFields({ numberLabel: "N° devis", due: true, tax: true, object: true }),
    defaults: commercialDefaults(null, {
      docNumber: "D-2026-034",
      object: "Refonte du reporting mensuel",
      dueDate: "2026-09-02",
      notes: "Devis valable 30 jours. Acompte de 30 % à la commande.",
    }),
  },
  {
    id: "bon-commande",
    name: "Bon de commande",
    category: "facturation",
    description: "Ordre d'achat fournisseur ou client",
    icon: "📦",
    color: "#7B4F00",
    layout: "purchase-order",
    builtin: true,
    fields: commercialFields({ numberLabel: "N° commande", object: true }),
    defaults: commercialDefaults(null, {
      docNumber: "BC-2026-019",
      object: "Fournitures et prestations associées",
      notes: "Livraison souhaitée sous 10 jours ouvrés.",
    }),
  },
  {
    id: "recu",
    name: "Reçu",
    category: "facturation",
    description: "Accusé de paiement",
    icon: "🎟️",
    color: "#0B3D91",
    layout: "receipt",
    builtin: true,
    fields: commercialFields({ numberLabel: "N° reçu", payment: true, tax: true }),
    defaults: commercialDefaults(null, {
      docNumber: "R-2026-051",
      paymentMethod: "Virement",
      notes: "Reçu établi en un exemplaire. Ne vaut pas facture.",
    }),
  },
  {
    id: "cr-reunion",
    name: "Compte rendu de réunion",
    category: "administration",
    description: "Synthèse, décisions et actions",
    icon: "📝",
    color: "#4A0E5C",
    layout: "minutes",
    builtin: true,
    fields: [
      { key: "title", label: "Titre de la réunion", type: "text", section: "Réunion" },
      { key: "date", label: "Date", type: "date", section: "Réunion" },
      { key: "time", label: "Horaire", type: "text", section: "Réunion" },
      { key: "location", label: "Lieu", type: "text", section: "Réunion" },
      { key: "author", label: "Rédacteur", type: "text", section: "Réunion" },
      { key: "participants", label: "Participants", type: "textarea", section: "Réunion" },
      { key: "agenda", label: "Ordre du jour", type: "textarea", section: "Contenu" },
      { key: "discussion", label: "Échanges", type: "textarea", section: "Contenu" },
      {
        key: "actions",
        label: "Actions",
        type: "table",
        section: "Actions",
        columns: [
          { key: "task", label: "Action" },
          { key: "owner", label: "Responsable" },
          { key: "due", label: "Échéance", type: "date" },
        ],
      },
      { key: "nextMeeting", label: "Prochaine réunion", type: "text", section: "Actions" },
    ],
    defaults: {
      title: "Comité de direction — suivi mensuel",
      date: "2026-08-12",
      time: "09h30 – 11h00",
      location: "Salle Board, siège Paris",
      author: "Paul Martin",
      participants: "Claire Bernard, Sophie Leroy, Marie Dupont, Paul Martin",
      agenda: "1. Point trésorerie\n2. Recrutements en cours\n3. Préparation rentrée commerciale",
      discussion:
        "La trésorerie est conforme au budget. Deux postes restent ouverts côté conseil. La campagne de rentrée est validée sous réserve du devis agence.",
      actions: [
        { id: "1", task: "Finaliser le devis agence", owner: "Marie Dupont", due: "2026-08-22" },
        { id: "2", task: "Publier l'offre consultant senior", owner: "Sophie Leroy", due: "2026-08-20" },
      ],
      nextMeeting: "Mercredi 9 septembre 2026, 9h30",
    },
  },
  {
    id: "proces-verbal",
    name: "Procès-verbal",
    category: "administration",
    description: "PV officiel d'assemblée ou de conseil",
    icon: "⚖️",
    color: "#3D0A4A",
    layout: "official-minutes",
    builtin: true,
    fields: [
      { key: "title", label: "Intitulé", type: "text", section: "Séance" },
      { key: "date", label: "Date", type: "date", section: "Séance" },
      { key: "time", label: "Heure", type: "text", section: "Séance" },
      { key: "location", label: "Lieu", type: "text", section: "Séance" },
      { key: "president", label: "Président de séance", type: "text", section: "Séance" },
      { key: "secretary", label: "Secrétaire", type: "text", section: "Séance" },
      { key: "attendees", label: "Présents", type: "textarea", section: "Séance" },
      { key: "absents", label: "Absents / représentés", type: "textarea", section: "Séance" },
      { key: "resolutions", label: "Résolutions", type: "textarea", section: "Délibérations" },
      { key: "notes", label: "Mentions", type: "textarea", section: "Délibérations" },
    ],
    defaults: {
      title: "Procès-verbal du conseil de gérance",
      date: "2026-08-08",
      time: "14h00",
      location: "Siège social — 14 avenue de l'Opéra, 75001 Paris",
      president: "Claire Bernard",
      secretary: "Paul Martin",
      attendees: "Claire Bernard, Paul Martin, Marie Dupont",
      absents: "Néant",
      resolutions:
        "Résolution 1 — Approbation des comptes intermédiaires au 30 juin 2026 : adoptée à l'unanimité.\nRésolution 2 — Ouverture d'une ligne de crédit de 80 000 € : adoptée à l'unanimité.",
      notes: "Le présent procès-verbal est établi en deux originaux.",
    },
  },
  {
    id: "courrier-admin",
    name: "Courrier administratif",
    category: "administration",
    description: "Lettre officielle à en-tête",
    icon: "✉️",
    color: "#1C2340",
    layout: "letter",
    builtin: true,
    fields: [
      ...clientFields(),
      { key: "city", label: "Ville d'émission", type: "text", section: "Courrier" },
      { key: "date", label: "Date", type: "date", section: "Courrier" },
      { key: "object", label: "Objet", type: "text", section: "Courrier" },
      { key: "reference", label: "Référence", type: "text", section: "Courrier" },
      { key: "body", label: "Corps du courrier", type: "textarea", section: "Courrier" },
      { key: "signatory", label: "Signataire", type: "text", section: "Signature" },
      { key: "signatoryTitle", label: "Fonction", type: "text", section: "Signature" },
    ],
    defaults: {
      clientName: "Madame la Directrice",
      clientAddress: "Préfecture de Paris\n4 rue de Lutèce, 75004 Paris",
      clientEmail: "",
      city: "Paris",
      date: "2026-08-19",
      object: "Demande de renseignements — dossier 2026-A-441",
      reference: "ADM/PM/2026-441",
      body: "Madame la Directrice,\n\nNous nous permettons de revenir vers vos services concernant le dossier cité en référence, resté sans réponse à ce jour.\n\nNous vous serions reconnaissants de bien vouloir nous indiquer l'état d'avancement du traitement et, le cas échéant, les pièces complémentaires à fournir.\n\nNous vous prions d'agréer, Madame la Directrice, l'expression de nos salutations distinguées.",
      signatory: "Paul Martin",
      signatoryTitle: "Responsable administratif",
    },
  },
  {
    id: "note-service",
    name: "Note de service",
    category: "administration",
    description: "Communication interne à diffusion",
    icon: "📢",
    color: "#7B4F00",
    layout: "memo",
    builtin: true,
    fields: [
      { key: "docNumber", label: "N° de note", type: "text", section: "Note" },
      { key: "date", label: "Date", type: "date", section: "Note" },
      { key: "from", label: "De", type: "text", section: "Note" },
      { key: "to", label: "À", type: "text", section: "Note" },
      { key: "object", label: "Objet", type: "text", section: "Note" },
      { key: "body", label: "Contenu", type: "textarea", section: "Note" },
      { key: "signatory", label: "Signataire", type: "text", section: "Note" },
    ],
    defaults: {
      docNumber: "NS-2026-017",
      date: "2026-08-18",
      from: "Direction générale",
      to: "L'ensemble des collaborateurs",
      object: "Fermeture exceptionnelle du vendredi 4 septembre",
      body: "La société sera exceptionnellement fermée le vendredi 4 septembre 2026, journée de séminaire interne.\n\nLes urgences pourront être signalées à claire.bernard@horizon-conseil.fr.\n\nMerci de votre compréhension.",
      signatory: "Paul Martin",
    },
  },
  {
    id: "rapport",
    name: "Rapport",
    category: "administration",
    description: "Rapport d'activité ou d'analyse",
    icon: "📊",
    color: "#7A1515",
    layout: "report",
    builtin: true,
    fields: [
      { key: "title", label: "Titre du rapport", type: "text", section: "Rapport" },
      { key: "subtitle", label: "Sous-titre", type: "text", section: "Rapport" },
      { key: "date", label: "Date", type: "date", section: "Rapport" },
      { key: "author", label: "Auteur", type: "text", section: "Rapport" },
      { key: "period", label: "Période", type: "text", section: "Rapport" },
      { key: "summary", label: "Synthèse", type: "textarea", section: "Contenu" },
      { key: "findings", label: "Constat / analyse", type: "textarea", section: "Contenu" },
      { key: "recommendations", label: "Recommandations", type: "textarea", section: "Contenu" },
    ],
    defaults: {
      title: "Rapport d'activité",
      subtitle: "Direction administrative — 1er semestre 2026",
      date: "2026-07-15",
      author: "Paul Martin",
      period: "Janvier – juin 2026",
      summary:
        "L'activité administrative a absorbé une hausse de 18 % des dossiers clients, sans dérive de délai de traitement (5,2 jours en moyenne).",
      findings:
        "Les goulets d'étranglement se situent sur la relance des pièces manquantes et l'archivage des contrats cadres. Deux outils (signature électronique, GED) restent sous-utilisés.",
      recommendations:
        "1. Généraliser la signature électronique avant fin septembre.\n2. Désigner un référent archivage par pôle.\n3. Former les nouveaux arrivants au processus « entrée client ».",
    },
  },
  {
    id: "attestation-travail",
    name: "Attestation de travail",
    category: "rh",
    description: "Certificat d'emploi au salarié",
    icon: "📄",
    color: "#2C5F2E",
    layout: "certificate",
    builtin: true,
    fields: [
      { key: "companySiret", label: "SIRET", type: "text", section: "Informations légales" },
      { key: "employeeName", label: "Nom du salarié", type: "text", section: "Salarié" },
      { key: "employeeBirth", label: "Date de naissance", type: "date", section: "Salarié" },
      { key: "employeePosition", label: "Poste", type: "text", section: "Salarié" },
      { key: "contractType", label: "Type de contrat", type: "select", options: ["CDI", "CDD", "Stage", "Alternance"], section: "Salarié" },
      { key: "startDate", label: "Date d'entrée", type: "date", section: "Salarié" },
      { key: "city", label: "Fait à", type: "text", section: "Attestation" },
      { key: "date", label: "Le", type: "date", section: "Attestation" },
      { key: "signatory", label: "Signataire", type: "text", section: "Attestation" },
      { key: "signatoryTitle", label: "Fonction", type: "text", section: "Attestation" },
      { key: "purpose", label: "Destinée à", type: "text", section: "Attestation" },
    ],
    defaults: {
      companySiret: "834 567 890 00014",
      employeeName: "Camille Rousseau",
      employeeBirth: "1992-03-14",
      employeePosition: "Consultante senior",
      contractType: "CDI",
      startDate: "2021-09-01",
      city: "Paris",
      date: "2026-08-19",
      signatory: "Sophie Leroy",
      signatoryTitle: "Responsable des ressources humaines",
      purpose: "toute administration qui en fera la demande",
    },
  },
  {
    id: "fiche-presence",
    name: "Fiche de présence",
    category: "rh",
    description: "Feuille d'émargement",
    icon: "✅",
    color: "#1D6F42",
    layout: "attendance",
    builtin: true,
    fields: [
      { key: "title", label: "Intitulé", type: "text", section: "Session" },
      { key: "date", label: "Date", type: "date", section: "Session" },
      { key: "time", label: "Horaire", type: "text", section: "Session" },
      { key: "location", label: "Lieu", type: "text", section: "Session" },
      { key: "trainer", label: "Responsable", type: "text", section: "Session" },
      {
        key: "attendees",
        label: "Présences",
        type: "table",
        section: "Émargement",
        columns: [
          { key: "name", label: "Nom" },
          { key: "service", label: "Service" },
          { key: "morning", label: "Matin" },
          { key: "afternoon", label: "Après-midi" },
        ],
      },
    ],
    defaults: {
      title: "Formation interne — Outils de reporting",
      date: "2026-08-21",
      time: "09h00 – 17h00",
      location: "Salle Formation, 2e étage",
      trainer: "Sophie Leroy",
      attendees: [
        { id: "1", name: "Camille Rousseau", service: "Conseil", morning: "Présent", afternoon: "Présent" },
        { id: "2", name: "Hugo Petit", service: "Conseil", morning: "Présent", afternoon: "" },
        { id: "3", name: "Léa Moreau", service: "Admin", morning: "Présent", afternoon: "Présent" },
      ],
    },
  },
  {
    id: "planning-rh",
    name: "Planning",
    category: "rh",
    description: "Planning d'équipe sur la période",
    icon: "📅",
    color: "#0B3D91",
    layout: "planning",
    builtin: true,
    fields: [
      { key: "title", label: "Titre", type: "text", section: "Planning" },
      { key: "period", label: "Période", type: "text", section: "Planning" },
      { key: "service", label: "Service", type: "text", section: "Planning" },
      {
        key: "slots",
        label: "Affectations",
        type: "table",
        section: "Planning",
        columns: [
          { key: "name", label: "Collaborateur" },
          { key: "mon", label: "Lun" },
          { key: "tue", label: "Mar" },
          { key: "wed", label: "Mer" },
          { key: "thu", label: "Jeu" },
          { key: "fri", label: "Ven" },
        ],
      },
      { key: "notes", label: "Notes", type: "textarea", section: "Planning" },
    ],
    defaults: {
      title: "Planning équipe Conseil",
      period: "Semaine 34 — 17 au 21 août 2026",
      service: "Pôle Conseil",
      slots: [
        { id: "1", name: "Camille Rousseau", mon: "Client A", tue: "Client A", wed: "Bureau", thu: "Client B", fri: "TT" },
        { id: "2", name: "Hugo Petit", mon: "Bureau", tue: "Formation", wed: "Client C", thu: "Client C", fri: "Bureau" },
        { id: "3", name: "Léa Moreau", mon: "Congé", tue: "Congé", wed: "Bureau", thu: "Bureau", fri: "TT" },
      ],
      notes: "TT = télétravail. Les astreintes du soir sont assurées par Camille.",
    },
  },
  {
    id: "conges",
    name: "Congés",
    category: "rh",
    description: "Demande et validation de congés",
    icon: "🏖️",
    color: "#7B4F00",
    layout: "leave",
    builtin: true,
    fields: [
      { key: "employeeName", label: "Salarié", type: "text", section: "Demande" },
      { key: "employeePosition", label: "Poste", type: "text", section: "Demande" },
      { key: "leaveType", label: "Type", type: "select", options: ["Congés payés", "RTT", "Sans solde", "Exceptionnel", "Maladie"], section: "Demande" },
      { key: "startDate", label: "Début", type: "date", section: "Demande" },
      { key: "endDate", label: "Fin", type: "date", section: "Demande" },
      { key: "days", label: "Nombre de jours", type: "number", section: "Demande" },
      { key: "reason", label: "Motif / commentaire", type: "textarea", section: "Demande" },
      { key: "manager", label: "Validé par", type: "text", section: "Validation" },
      { key: "status", label: "Décision", type: "select", options: ["En attente", "Approuvé", "Refusé"], section: "Validation" },
      { key: "date", label: "Date de la demande", type: "date", section: "Validation" },
    ],
    defaults: {
      employeeName: "Hugo Petit",
      employeePosition: "Consultant",
      leaveType: "Congés payés",
      startDate: "2026-08-24",
      endDate: "2026-08-28",
      days: 5,
      reason: "Congés d'été — relais assuré par Camille Rousseau.",
      manager: "Sophie Leroy",
      status: "Approuvé",
      date: "2026-08-10",
    },
  },
  {
    id: "agenda",
    name: "Agenda",
    category: "assistante",
    description: "Ordre du jour et créneaux",
    icon: "📌",
    color: "#0B3D91",
    layout: "agenda",
    builtin: true,
    fields: [
      { key: "title", label: "Titre", type: "text", section: "Agenda" },
      { key: "date", label: "Date", type: "date", section: "Agenda" },
      { key: "owner", label: "Pour", type: "text", section: "Agenda" },
      {
        key: "slots",
        label: "Créneaux",
        type: "table",
        section: "Agenda",
        columns: [
          { key: "time", label: "Heure" },
          { key: "item", label: "Sujet" },
          { key: "where", label: "Lieu / visio" },
        ],
      },
      { key: "notes", label: "Notes", type: "textarea", section: "Agenda" },
    ],
    defaults: {
      title: "",
      owner: "",
      slots: [],
      notes: "",
    },
  },
  {
    id: "planning-hebdo",
    name: "Planning hebdomadaire",
    category: "assistante",
    description: "Semaine type de la direction",
    icon: "🗓️",
    color: "#1C2340",
    layout: "weekly-planning",
    builtin: true,
    fields: [
      { key: "title", label: "Titre", type: "text", section: "Semaine" },
      { key: "period", label: "Semaine", type: "text", section: "Semaine" },
      { key: "owner", label: "Pour", type: "text", section: "Semaine" },
      {
        key: "slots",
        label: "Planning",
        type: "table",
        section: "Semaine",
        columns: [
          { key: "time", label: "Créneau" },
          { key: "mon", label: "Lundi" },
          { key: "tue", label: "Mardi" },
          { key: "wed", label: "Mercredi" },
          { key: "thu", label: "Jeudi" },
          { key: "fri", label: "Vendredi" },
        ],
      },
    ],
    defaults: {
      title: "Planning hebdomadaire — Direction",
      period: "Semaine 34 / 2026",
      owner: "Claire Bernard (coordination)",
      slots: [
        { id: "1", time: "Matin", mon: "CODIR", tue: "Clients", wed: "Bureau", thu: "Déplacements", fri: "Reporting" },
        { id: "2", time: "Après-midi", mon: "Revues RH", tue: "Clients", wed: "Partenaires", thu: "Déplacements", fri: "Veille" },
      ],
    },
  },
  {
    id: "tableau-suivi",
    name: "Tableau de suivi",
    category: "assistante",
    description: "Suivi de dossiers et d'actions",
    icon: "🗂️",
    color: "#7B4F00",
    layout: "tracking",
    builtin: true,
    fields: [
      { key: "title", label: "Titre", type: "text", section: "Suivi" },
      { key: "period", label: "Période", type: "text", section: "Suivi" },
      { key: "owner", label: "Pilote", type: "text", section: "Suivi" },
      {
        key: "rows",
        label: "Lignes de suivi",
        type: "table",
        section: "Suivi",
        columns: [
          { key: "item", label: "Dossier" },
          { key: "owner", label: "Responsable" },
          { key: "due", label: "Échéance", type: "date" },
          { key: "status", label: "Statut" },
          { key: "comment", label: "Commentaire" },
        ],
      },
    ],
    defaults: {
      title: "Tableau de suivi — rentrée 2026",
      period: "Août – septembre 2026",
      owner: "Claire Bernard",
      rows: [
        { id: "1", item: "Séminaire 4 sept.", owner: "Paul Martin", due: "2026-08-28", status: "En cours", comment: "Devis traiteur à signer" },
        { id: "2", item: "Onboarding 2 consultants", owner: "Sophie Leroy", due: "2026-09-01", status: "OK", comment: "Badges commandés" },
        { id: "3", item: "Relance facture Dupont", owner: "Marie Dupont", due: "2026-08-22", status: "Urgent", comment: "2e relance" },
      ],
    },
  },
  {
    id: "cr-assistante",
    name: "Compte rendu",
    category: "assistante",
    description: "CR opérationnel pour la direction",
    icon: "🗒️",
    color: "#4A0E5C",
    layout: "assistant-minutes",
    builtin: true,
    fields: [
      { key: "title", label: "Titre", type: "text", section: "Réunion" },
      { key: "date", label: "Date", type: "date", section: "Réunion" },
      { key: "location", label: "Lieu", type: "text", section: "Réunion" },
      { key: "author", label: "Rédigé par", type: "text", section: "Réunion" },
      { key: "participants", label: "Présents", type: "textarea", section: "Réunion" },
      { key: "discussion", label: "Points abordés", type: "textarea", section: "Contenu" },
      { key: "decisions", label: "Décisions", type: "textarea", section: "Contenu" },
      {
        key: "actions",
        label: "À faire",
        type: "table",
        section: "Suivi",
        columns: [
          { key: "task", label: "Action" },
          { key: "owner", label: "Qui" },
          { key: "due", label: "Pour le", type: "date" },
        ],
      },
    ],
    defaults: {
      title: "Point direction / assistante",
      date: "2026-08-18",
      location: "Bureau DG",
      author: "Claire Bernard",
      participants: "Direction, Claire Bernard",
      discussion: "Priorités de la semaine, déplacements, dossiers en souffrance, préparation du CODIR.",
      decisions: "Le CODIR du 20 août se tient en présentiel. Les dossiers banque passent avant le déjeuner partenaire.",
      actions: [
        { id: "1", task: "Constituer le dossier banque", owner: "Claire Bernard", due: "2026-08-20" },
        { id: "2", task: "Convocations CODIR", owner: "Claire Bernard", due: "2026-08-19" },
      ],
    },
  },
  {
    id: "convocation",
    name: "Convocation",
    category: "assistante",
    description: "Invitation officielle à une réunion",
    icon: "📨",
    color: "#7A1515",
    layout: "convocation",
    builtin: true,
    fields: [
      ...clientFields("Destinataire"),
      { key: "title", label: "Intitulé de la réunion", type: "text", section: "Convocation" },
      { key: "date", label: "Date", type: "date", section: "Convocation" },
      { key: "time", label: "Heure", type: "text", section: "Convocation" },
      { key: "location", label: "Lieu", type: "text", section: "Convocation" },
      { key: "object", label: "Objet", type: "text", section: "Convocation" },
      { key: "agenda", label: "Ordre du jour", type: "textarea", section: "Convocation" },
      { key: "signatory", label: "Signataire", type: "text", section: "Signature" },
      { key: "signatoryTitle", label: "Fonction", type: "text", section: "Signature" },
    ],
    defaults: {
      clientName: "Membres du comité de direction",
      clientAddress: "Horizon Conseil SAS",
      clientEmail: "",
      title: "Comité de direction",
      date: "2026-08-20",
      time: "10h00",
      location: "Salle Board — 14 avenue de l'Opéra, 75001 Paris",
      object: "Convocation au comité de direction du 20 août 2026",
      agenda: "1. Revue d'activité\n2. Trésorerie et relances\n3. Recrutements\n4. Questions diverses",
      signatory: "Claire Bernard",
      signatoryTitle: "Assistante de direction",
    },
  },
];

export function templatesForRoles(roles: Role[], extras: DocTemplate[] = []) {
  const set = new Set(roles);
  return [
    ...BUILTIN_TEMPLATES.filter((t) => set.has(t.category)),
    ...extras.filter((t) => set.has(t.category)),
  ];
}

export function templatesForAllowedIds(allowedIds: string[], extras: DocTemplate[] = []) {
  const set = new Set(allowedIds);
  const categories = new Set(BUILTIN_TEMPLATES.filter((t) => set.has(t.id)).map((t) => t.category));
  return [
    ...BUILTIN_TEMPLATES.filter((t) => set.has(t.id)),
    ...extras.filter((t) => set.has(t.id) || (t.basedOn && set.has(t.basedOn)) || categories.has(t.category)),
  ];
}

export function templatesForRole(role: Role, extras: DocTemplate[] = []) {
  return templatesForRoles([role], extras);
}

export function findTemplate(id: string, extras: DocTemplate[] = []) {
  return extras.find((t) => t.id === id) ?? BUILTIN_TEMPLATES.find((t) => t.id === id);
}

export function hydrateDefaults(template: DocTemplate, user: User, currency: CurrencyCode = "EUR"): Record<string, unknown> {
  const data: Record<string, unknown> = {
    ...template.defaults,
    ...organismeHeaderFromUser(user),
    author: template.defaults.author ?? user.name,
    signatory: template.defaults.signatory ?? user.name,
    signatoryTitle: template.defaults.signatoryTitle ?? user.title,
  };
  data.currency = currency;
  template.fields?.forEach((f) => {
    if (f.type === "table") {
      const rows = Array.isArray(data[f.key]) ? (data[f.key] as unknown[]) : [];
      const startEmpty = template.layout === "agenda";
      if (!startEmpty && rows.length === 0) data[f.key] = [blankRow(f.columns || [])];
      else if (startEmpty && !Array.isArray(data[f.key])) data[f.key] = [];
    }
  });
  return data;
}

export function blankRow(columns: { key: string }[]) {
  const row: Record<string, unknown> = { id: uid() };
  columns.forEach((c) => {
    row[c.key] = "";
  });
  return row;
}

export function recipientOf(data: Record<string, unknown>) {
  return String(
    data.clientName || data.employeeName || data.to || data.owner || data.title || data.companyName || "—"
  );
}

export function documentTitle(template: DocTemplate, data: Record<string, unknown>) {
  const num = data.docNumber ? ` #${data.docNumber}` : "";
  const title = data.title ? String(data.title) : template.name;
  return `${title}${num}`;
}

export function familyId(tpl: DocTemplate) {
  if (tpl.builtin) return tpl.id;
  return tpl.basedOn || tpl.id;
}

export function storedByUser(templates: DocTemplate[], user: User) {
  return templates.filter(
    (t) =>
      !t.builtin &&
      t.organismeId === user.organismeId &&
      (t.ownerId === user.id || (!t.ownerId && t.category === user.role))
  );
}

export function cloneAsStored(
  source: DocTemplate,
  user: User,
  name: string,
  defaults?: Record<string, unknown>
): DocTemplate {
  return {
    ...(JSON.parse(JSON.stringify(source)) as DocTemplate),
    id: `custom-${uid()}`,
    name: name.trim() || `${source.name} — copie`,
    builtin: false,
    basedOn: source.builtin ? source.id : source.basedOn || source.id,
    ownerId: user.id,
    organismeId: user.organismeId,
    savedAt: new Date().toISOString(),
    category: source.category,
    description: source.builtin ? `Copie enregistrée de ${source.name}` : source.description,
    defaults: defaults ? JSON.parse(JSON.stringify(defaults)) : JSON.parse(JSON.stringify(source.defaults || {})),
  };
}

export function selectableModels(current: DocTemplate, stored: DocTemplate[], user: User) {
  const fam = familyId(current);
  const standard = BUILTIN_TEMPLATES.find((t) => t.id === fam);
  const copies = storedByUser(stored, user).filter((t) => familyId(t) === fam || t.id === current.id);
  const list: DocTemplate[] = [];
  if (standard) list.push(standard);
  copies.forEach((c) => {
    if (!list.some((x) => x.id === c.id)) list.push(c);
  });
  if (!list.some((x) => x.id === current.id)) list.unshift(current);
  return list;
}

export function mergeTemplateData(next: DocTemplate, prev: DocData, user: User, currency: CurrencyCode = "EUR"): DocData {
  const base = hydrateDefaults(next, user, currency);
  const out: DocData = { ...base };
  next.fields?.forEach((f) => {
    if (f.key === "currency") return;
    if (prev[f.key] !== undefined) out[f.key] = prev[f.key];
  });
  Object.keys(prev).forEach((k) => {
    if (k === "currency") return;
    if (out[k] === undefined && prev[k] !== undefined) out[k] = prev[k];
  });
  out.currency = currency;
  return { ...out, ...organismeHeaderFromUser(user) };
}
