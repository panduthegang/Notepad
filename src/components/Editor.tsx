import { EditorContent, Editor } from "@tiptap/react";

interface EditorProps {
  // editor instance passed down from App
  editor: Editor | null;
}

export default function EditorComponent({ editor }: EditorProps) {
  return (
    <div
      className="editor-scroll-area"
      // Clicking empty area around or below text focuses the editor
      onClick={() => {
        if (editor && !editor.isFocused) {
          editor.commands.focus("end");
        }
      }}
    >
      <div className="editor-paper">
        {/* EditorContent mounts TipTap's ProseMirror DOM node */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
