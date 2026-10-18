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
    <footer className="status-bar">
      <div className="status-item">
        <span>{words}</span> {words === 1 ? "word" : "words"}
      </div>
      <div className="status-divider" />
      <div className="status-item">
        <span>{characters}</span> {characters === 1 ? "character" : "characters"}
      </div>
    </footer>
  );
}
