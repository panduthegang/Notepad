import { Editor, useEditorState } from "@tiptap/react";

interface StatusBarProps {
  // editor instance passed down from App
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

  return (
    <footer className="status-bar flex-none flex items-center px-4 py-1.5 text-xs text-muted bg-statusbar border-t border-border select-none">
      <div className="status-item flex items-center gap-1">
        <span className="font-semibold text-text">{words}</span> {words === 1 ? "word" : "words"}
      </div>
      <div className="status-divider w-px h-3.5 bg-border mx-3" />
      <div className="status-item flex items-center gap-1">
        <span className="font-semibold text-text">{characters}</span> {characters === 1 ? "character" : "characters"}
      </div>
    </footer>
  );
}
