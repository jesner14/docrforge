import type { DocTemplate, ExportFormat } from "./types";
import { asNumber, asRows, asString } from "./helpers";

/** Largeur A4 à 96 dpi — correspond à 210 mm. */
const A4_WIDTH_PX = 794;

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

function safeFilename(title: string) {
  return title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "document";
}

function copyComputedStyle(source: HTMLElement, target: HTMLElement) {
  const computed = window.getComputedStyle(source);
  for (const key of computed) {
    target.style.setProperty(key, computed.getPropertyValue(key), computed.getPropertyPriority(key));
  }
}

/** Copie les styles calculés (RGB) depuis le DOM visible — html2canvas ne gère pas oklab/oklch de Tailwind v4. */
function syncInlineStyles(source: Element, target: Element) {
  if (source instanceof HTMLElement && target instanceof HTMLElement) {
    copyComputedStyle(source, target);
  }
  const sourceChildren = [...source.children];
  const targetChildren = [...target.children];
  for (let i = 0; i < sourceChildren.length; i++) {
    if (targetChildren[i]) syncInlineStyles(sourceChildren[i], targetChildren[i]);
  }
}

async function waitForImages(root: HTMLElement) {
  const imgs = [...root.querySelectorAll("img")];
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

function resolvePreviewPage(previewEl: HTMLElement | null): HTMLElement | null {
  if (!previewEl) return null;
  return (previewEl.querySelector(".doc-preview-page") as HTMLElement | null) ?? previewEl;
}

async function buildExportNode(previewEl: HTMLElement | null): Promise<{ node: HTMLElement; height: number } | null> {
  const source = resolvePreviewPage(previewEl);
  if (!source) return null;

  await document.fonts.ready;

  const clone = source.cloneNode(true) as HTMLElement;
  syncInlineStyles(source, clone);

  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.style.minHeight = "auto";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.margin = "0";
  clone.style.transform = "none";

  const sourceWidth = Math.max(source.getBoundingClientRect().width, 1);
  const scale = A4_WIDTH_PX / sourceWidth;
  if (Math.abs(scale - 1) > 0.02) {
    clone.style.width = `${sourceWidth}px`;
    clone.style.maxWidth = `${sourceWidth}px`;
    clone.style.transform = `scale(${scale})`;
    clone.style.transformOrigin = "top left";
  }

  const host = document.createElement("div");
  host.className = "doc-export-host";
  host.setAttribute("aria-hidden", "true");
  const scaledHeight = source.getBoundingClientRect().height * scale;
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${A4_WIDTH_PX}px`,
    `height:${Math.ceil(scaledHeight)}px`,
    "background:#fff",
    "opacity:0",
    "pointer-events:none",
    "z-index:2147483646",
    "overflow:visible",
  ].join(";");

  host.appendChild(clone);
  document.body.appendChild(host);

  await waitForImages(clone);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  return { node: clone, height: Math.ceil(scaledHeight) };
}

function removeExportHost(node: HTMLElement) {
  node.parentElement?.remove();
}

export async function exportPreviewPdf(title: string, previewEl: HTMLElement | null) {
  const safe = safeFilename(title);
  const built = await buildExportNode(previewEl);
  if (!built) {
    downloadBlob(new Blob(["Aucun aperçu à exporter."], { type: "text/plain" }), `${safe}.txt`);
    return;
  }

  const { node, height } = built;

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: `${safe}.pdf`,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: A4_WIDTH_PX,
          windowWidth: A4_WIDTH_PX,
          height,
          windowHeight: height,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(node)
      .save();
  } finally {
    removeExportHost(node);
  }
}

export function downloadPreviewDoc(title: string, previewEl: HTMLElement | null) {
  const safe = safeFilename(title);
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

export async function exportDocument(
  format: ExportFormat,
  title: string,
  previewEl: HTMLElement | null,
  template: DocTemplate,
  data: Record<string, unknown>
) {
  const safe = safeFilename(title);

  if (format === "pdf") {
    await exportPreviewPdf(safe, previewEl);
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
    .filter((f) => f.type !== "table" && f.type !== "checkbox")
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
