import { Editor } from "@tiptap/react";

interface StatusBarProps {
  // editor instance passed down from App
  editor: Editor | null;
}

export default function StatusBar({ editor }: StatusBarProps) {
  // Safely read word and character counts from TipTap's CharacterCount extension storage
  const words = editor ? editor.storage.characterCount.words() : 0;
  const characters = editor ? editor.storage.characterCount.characters() : 0;

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
