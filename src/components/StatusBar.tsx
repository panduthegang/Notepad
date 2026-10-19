import { Editor, useEditorState } from "@tiptap/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { FileText, Hash, ExternalLink } from "lucide-react";

interface StatusBarProps {
  editor: Editor | null;
}

export default function StatusBar({ editor }: StatusBarProps) {
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
    <footer className="status-bar flex-none flex items-center justify-between px-4 py-1.5 bg-statusbar border-t border-border select-none">
      {/* Left: word & character counts */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <FileText size={12} strokeWidth={2} className="text-muted/70 shrink-0" />
          <span className="font-semibold text-text tabular-nums">{words}</span>
          <span>{words === 1 ? "word" : "words"}</span>
        </div>
        <div className="w-px h-3.5 bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Hash size={12} strokeWidth={2} className="text-muted/70 shrink-0" />
          <span className="font-semibold text-text tabular-nums">{characters}</span>
          <span>{characters === 1 ? "character" : "characters"}</span>
        </div>
      </div>

      {/* Right: portfolio credit */}
      <div className="flex items-center gap-1 text-[11px] text-muted">
        <span>Designed &amp; developed by</span>
        <button
          type="button"
          onClick={handlePortfolioClick}
          className="inline-flex items-center gap-0.5 font-semibold text-text/70 hover:text-text transition-colors duration-150 cursor-pointer group outline-none"
          title="Visit Harsh Rathod's portfolio"
          aria-label="Open Harsh Rathod's portfolio"
        >
          Harsh Rathod
          <ExternalLink
            size={10}
            strokeWidth={2}
            className="opacity-0 group-hover:opacity-70 transition-opacity duration-150 shrink-0"
          />
        </button>
      </div>
    </footer>
  );
}
