import { EditorContent, Editor } from "@tiptap/react";

interface EditorProps {
  // editor instance passed down from App
  editor: Editor | null;
}

export default function EditorComponent({ editor }: EditorProps) {
  return (
    <div
      className="editor-scroll-area flex-1 overflow-y-auto px-4 py-3 bg-surface cursor-text"
      // Clicking empty area anywhere below text focuses the editor
      onClick={() => {
        if (editor && !editor.isFocused) {
          editor.commands.focus("end");
        }
      }}
    >
      {/* EditorContent mounts TipTap's ProseMirror DOM node directly across the full width */}
      <EditorContent editor={editor} className="w-full min-h-full" />
    </div>
  );
}
