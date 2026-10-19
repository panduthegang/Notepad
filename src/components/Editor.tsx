import { EditorContent, Editor } from "@tiptap/react";

interface EditorProps {
  // editor instance passed down from App
  editor: Editor | null;
}

export default function EditorComponent({ editor }: EditorProps) {
  return (
    <div
      className="editor-scroll-area flex-1 overflow-y-auto px-8 py-6 flex justify-center bg-background cursor-text"
      // Clicking empty area around or below text focuses the editor
      onClick={() => {
        if (editor && !editor.isFocused) {
          editor.commands.focus("end");
        }
      }}
    >
      <div className="editor-paper w-full max-w-[860px] min-h-full bg-surface px-10 py-8 rounded-lg shadow-xs border border-border">
        {/* EditorContent mounts TipTap's ProseMirror DOM node */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
