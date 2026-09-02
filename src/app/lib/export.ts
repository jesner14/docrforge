import type { DocTemplate, ExportFormat } from "./types";
import { asNumber, asRows, asString } from "./helpers";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function documentMarkup(bodyHtml: string) {
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title></title>
  ${styles}
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff !important;
      color: #1C2340;
    }
    body { padding: 14mm; }
    @media print {
      html, body { background: #fff !important; }
      body {
        padding: 14mm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function printAsPdf(_title: string, previewEl: HTMLElement | null) {
  const bodyHtml = previewEl?.innerHTML?.trim() || "<p>Aucun aperçu à exporter.</p>";
  const html = documentMarkup(bodyHtml);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", " ");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;background:#fff;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), "document.html");
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();
  doc.title = "";

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 400);
  };
  win.addEventListener("afterprint", cleanup);
  win.focus();
  win.print();
}

export function exportPreviewPdf(title: string, previewEl: HTMLElement | null) {
  printAsPdf(title, previewEl);
}

export function downloadPreviewDoc(title: string, previewEl: HTMLElement | null) {
  const safe = title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "document";
  const html = previewEl?.innerHTML ?? "";
  const doc = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word" lang="fr"><head><meta charset="utf-8">
    <title>${safe}</title>
    <style>body{font-family:Calibri,Arial,sans-serif;color:#1C2340}</style>
    </head><body>${html}</body></html>`;
  downloadBlob(new Blob(["\ufeff", doc], { type: "application/msword" }), `${safe}.doc`);
}

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportDocument(
  format: ExportFormat,
  title: string,
  previewEl: HTMLElement | null,
  template: DocTemplate,
  data: Record<string, unknown>
) {
  const safe = title.replace(/[\\/:*?"<>|]+/g, " ").trim() || template.name;

  if (format === "pdf") {
    printAsPdf(safe, previewEl);
    return;
  }

  if (format === "word") {
    const html = previewEl?.innerHTML ?? "";
    const doc = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word" lang="fr"><head><meta charset="utf-8">
      <title>${safe}</title>
      <style>body{font-family:Calibri,Arial,sans-serif;color:#1C2340}</style>
      </head><body>${html}</body></html>`;
    downloadBlob(new Blob(["\ufeff", doc], { type: "application/msword" }), `${safe}.doc`);
    return;
  }

  const tableField = template.fields.find((f) => f.type === "table");
  const rows = tableField ? asRows(data[tableField.key]) : [];
  const cols = tableField?.columns ?? [];
  const meta = template.fields
    .filter((f) => f.type !== "table")
    .map((f) => [f.label, asString(data[f.key])])
    .filter(([, v]) => v);

  let csv = meta.map((r) => r.map(csvEscape).join(";")).join("\n");
  if (cols.length) {
    csv += (csv ? "\n\n" : "") + cols.map((c) => csvEscape(c.label)).join(";") + "\n";
    csv += rows
      .map((row) =>
        cols
          .map((c) => {
            const v = row[c.key];
            return csvEscape(c.type === "number" ? asNumber(v) : v);
          })
          .join(";")
      )
      .join("\n");
  }
  downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), `${safe}.csv`);
}
