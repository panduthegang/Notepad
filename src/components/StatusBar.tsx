import { Editor, useEditorState } from "@tiptap/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { FileText, Hash, ExternalLink } from "lucide-react";

interface StatusBarProps {
  editor: Editor | null;
  /** Display name of the currently open file (e.g. "Untitled" or "notes.hr") */
  fileName?: string;
  /** Whether there are unsaved changes; shows a ● indicator when true */
  isDirty?: boolean;
}

export default function StatusBar({ editor, fileName = "Untitled", isDirty = false }: StatusBarProps) {
  // Subscribe to characterCount updates using TipTap's useEditorState selector.
  // This ensures only StatusBar re-renders when words/characters change,
  // without needing whole-editor re-rendering on transactions.
  const counts = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return { words: 0, characters: 0 };
      }
      return {
        words: ctx.editor.storage.characterCount.words(),
        characters: ctx.editor.storage.characterCount.characters(),
      };
    },
  });

  const words = counts?.words ?? 0;
  const characters = counts?.characters ?? 0;

  const handlePortfolioClick = async () => {
    try {
      await openUrl("https://harshrathod-portfolio.vercel.app");
    } catch (e) {
      console.error("Failed to open URL:", e);
    }
  };

  return (
    <footer className="status-bar flex-none flex items-center justify-between px-4 py-1.5 bg-surface border-t border-border select-none transition-colors duration-150">
      {/* Left: word & character counts + current file name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <FileText size={12} strokeWidth={2.2} className="text-text/70 shrink-0" />
          <span className="font-mono font-semibold text-text tabular-nums">{words}</span>
          <span>{words === 1 ? "word" : "words"}</span>
        </div>
        {/* Subtle Inner Divider */}
        <div className="w-px h-3.5 bg-border-subtle" />
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Hash size={12} strokeWidth={2.2} className="text-text/70 shrink-0" />
          <span className="font-mono font-semibold text-text tabular-nums">{characters}</span>
          <span>{characters === 1 ? "character" : "characters"}</span>
        </div>

        {/* Subtle Inner Divider */}
        <div className="w-px h-3.5 bg-border-subtle" />

        {/* Current file name + unsaved-changes indicator (● dot) */}
        <div className="flex items-center gap-1 text-xs text-muted">
          {/* The ● dot appears when there are unsaved edits */}
          {isDirty && (
            <span
              className="text-text font-bold leading-none"
              title="Unsaved changes"
              aria-label="Unsaved changes"
            >
              ●
            </span>
          )}
          <span className="font-mono text-text/80">{fileName}</span>
        </div>
      </div>

      {/* Right: portfolio credit with high-contrast keyboard focus */}
      <div className="flex items-center gap-1 text-[11px] text-muted">
        <span>Designed &amp; developed by</span>
        <button
          type="button"
          onClick={handlePortfolioClick}
          className="inline-flex items-center gap-0.5 font-semibold text-text hover:underline transition-colors duration-100 cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-1 focus-visible:ring-offset-surface rounded-none"
          title="Visit Harsh Rathod's portfolio"
          aria-label="Open Harsh Rathod's portfolio"
        >
          Harsh Rathod
          <ExternalLink
            size={10}
            strokeWidth={2.2}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-100 shrink-0 ml-0.5"
          />
        </button>
      </div>
    </footer>
  );
}
