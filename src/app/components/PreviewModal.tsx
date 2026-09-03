import { useRef, type ReactNode } from "react";
import { Download, File, X } from "lucide-react";
import { downloadPreviewDoc, exportPreviewPdf } from "../lib/export";

export function PreviewModal({
  title,
  subtitle,
  onClose,
  children,
  exportName,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  exportName: string;
}) {
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: "rgba(28,35,64,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border flex-shrink-0">
          <div className="min-w-0">
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1C2340", fontSize: "0.95rem" }}>
              {title}
            </div>
            {subtitle ? (
              <div className="text-[10px] truncate" style={{ color: "#999" }}>
                {subtitle}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <IconAction label="PDF" color="#C0392B" onClick={() => void exportPreviewPdf(exportName, previewRef.current)}>
              <File size={16} strokeWidth={1.75} />
            </IconAction>
            <IconAction label="Télécharger" color="#1C2340" onClick={() => downloadPreviewDoc(exportName, previewRef.current)}>
              <Download size={16} strokeWidth={1.75} />
            </IconAction>
            <button onClick={onClose} className="ml-1 p-1 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Fermer">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-4" style={{ background: "#EDEBE6" }}>
          <div ref={previewRef} className="max-w-[210mm] mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconAction({
  label,
  color,
  onClick,
  children,
}: {
  label: string;
  color: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-0.5 min-w-[44px] group">
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 group-active:scale-95"
        style={{ background: color }}
      >
        {children}
      </span>
      <span className="text-[9px] font-semibold" style={{ color: "#1C2340" }}>
        {label}
      </span>
    </button>
  );
}
