import { useState, useRef, useEffect, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { open, save, message } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { serializeNote, parseNote } from "./fileFormat";

/**
 * Extracts the file basename from a full filesystem path (cross-platform Windows/POSIX).
 */
export function getBasename(path: string): string {
  return path.split(/[/\\]/).pop() || "Untitled.hr";
}

export interface NotificationState {
  type: "error" | "info";
  text: string;
}

export function useFileActions(editor: Editor | null) {
  // Current active file path on disk (null if unsaved/new document)
  const [filePath, setFilePath] = useState<string | null>(null);
  // Display name for the file (e.g. "Untitled" or "notes.hr")
  const [fileName, setFileName] = useState<string>("Untitled");
  // Dirty flag: true if document has modifications since last load/save
  const [isDirty, setIsDirty] = useState<boolean>(false);
  // Original ISO created date of the document
  const [createdDate, setCreatedDate] = useState<string>(() => new Date().toISOString());
  // Non-blocking banner notification for user errors and status updates
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Guard flag so loading content programmatically doesn't mark the document dirty
  const isProgrammaticUpdate = useRef<boolean>(false);

  // Mutable refs to prevent stale closure bugs in Tauri event listeners
  const filePathRef = useRef<string | null>(filePath);
  const fileNameRef = useRef<string>(fileName);
  const isDirtyRef = useRef<boolean>(isDirty);
  const createdDateRef = useRef<string>(createdDate);

  useEffect(() => {
    filePathRef.current = filePath;
    fileNameRef.current = fileName;
    isDirtyRef.current = isDirty;
    createdDateRef.current = createdDate;
  }, [filePath, fileName, isDirty, createdDate]);

  // Dismiss notification helper
  const showNotification = useCallback((type: "error" | "info", text: string, durationMs = 4000) => {
    setNotification({ type, text });
    window.setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, durationMs);
  }, []);

  // Update window title and document.title when fileName or isDirty changes
  useEffect(() => {
    const dirtyMarker = isDirty ? "● " : "";
    const title = `${dirtyMarker}${fileName} - HRNote`;
    document.title = title;

    try {
      getCurrentWindow().setTitle(title).catch(() => {});
    } catch (e) {
      // In web fallback or non-tauri context, document.title is sufficient
    }
  }, [fileName, isDirty]);

  // Hook into TipTap's onUpdate event to track changes made by the user
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (isProgrammaticUpdate.current) {
        isProgrammaticUpdate.current = false;
        return;
      }
      setIsDirty(true);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  /**
   * Prompts user with a 3-way native dialog if there are unsaved changes.
   * Returns: "save" | "dontsave" | "cancel"
   */
  const promptUnsavedChanges = useCallback(async (docName: string): Promise<"save" | "dontsave" | "cancel"> => {
    try {
      const response = await message(
        `Do you want to save changes to "${docName}"?`,
        {
          title: "HRNote",
          kind: "warning",
          buttons: {
            yes: "Save",
            no: "Don't Save",
            cancel: "Cancel",
          },
        }
      );

      if (response === "Save" || response === "Yes") {
        return "save";
      }
      if (response === "Don't Save" || response === "No") {
        return "dontsave";
      }
      return "cancel";
    } catch {
      return "cancel";
    }
  }, []);

  /**
   * Action: Save As
   * Displays native save dialog filtered to .hr and writes serialized note.
   */
  const handleSaveAs = useCallback(async (): Promise<boolean> => {
    if (!editor) return false;

    try {
      const defaultName = filePathRef.current ? getBasename(filePathRef.current) : `${fileNameRef.current}.hr`;

      const selectedPath = await save({
        title: "Save HRNote As",
        defaultPath: defaultName,
        filters: [{ name: "HRNote Document", extensions: ["hr"] }],
      });

      if (!selectedPath) {
        // User cancelled the file picker
        return false;
      }

      // Ensure path always has .hr extension
      const finalPath = selectedPath.toLowerCase().endsWith(".hr") ? selectedPath : `${selectedPath}.hr`;
      const base = getBasename(finalPath);
      const title = base.replace(/\.hr$/i, "");

      const serialized = serializeNote(editor.getJSON(), {
        title,
        created: createdDateRef.current,
        modified: new Date().toISOString(),
      });

      await writeTextFile(finalPath, serialized);

      setFilePath(finalPath);
      setFileName(base);
      setIsDirty(false);
      showNotification("info", `Saved as "${base}"`, 2500);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showNotification("error", `Failed to save file: ${errorMsg}`);
      return false;
    }
  }, [editor, showNotification]);

  /**
   * Action: Save
   * Overwrites current path if known, otherwise triggers Save As.
   */
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!editor) return false;

    if (!filePathRef.current) {
      return handleSaveAs();
    }

    try {
      const currentPath = filePathRef.current;
      const base = fileNameRef.current;
      const title = base.replace(/\.hr$/i, "");

      const serialized = serializeNote(editor.getJSON(), {
        title,
        created: createdDateRef.current,
        modified: new Date().toISOString(),
      });

      await writeTextFile(currentPath, serialized);

      setIsDirty(false);
      showNotification("info", `Saved "${base}"`, 2500);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showNotification("error", `Failed to save file: ${errorMsg}`);
      return false;
    }
  }, [editor, handleSaveAs, showNotification]);

  // Mutable ref so the window close listener can trigger handleSave
  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  /**
   * Action: Open
   * Prompts for unsaved changes, opens .hr file dialog, parses content, and updates editor.
   */
  const handleOpen = useCallback(async () => {
    if (!editor) return;

    if (isDirtyRef.current) {
      const choice = await promptUnsavedChanges(fileNameRef.current);
      if (choice === "cancel") return;
      if (choice === "save") {
        const success = await handleSave();
        if (!success) return; // User cancelled save or save failed
      }
    }

    try {
      const selected = await open({
        title: "Open HRNote",
        multiple: false,
        directory: false,
        filters: [{ name: "HRNote Document", extensions: ["hr"] }],
      });

      if (!selected || Array.isArray(selected)) {
        return; // User cancelled dialog
      }

      const fileContent = await readTextFile(selected);
      const note = parseNote(fileContent);

      // Load document into TipTap editor without marking dirty
      isProgrammaticUpdate.current = true;
      editor.commands.setContent(note.content);

      const base = getBasename(selected);
      setFilePath(selected);
      setFileName(base);
      setCreatedDate(note.created);
      setIsDirty(false);
      showNotification("info", `Opened "${base}"`, 2500);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showNotification("error", `Failed to open note: ${errorMsg}`);
    }
  }, [editor, handleSave, promptUnsavedChanges, showNotification]);

  /**
   * Action: New Note
   * Prompts for unsaved changes and resets editor to blank.
   */
  const handleNew = useCallback(async () => {
    if (!editor) return;

    if (isDirtyRef.current) {
      const choice = await promptUnsavedChanges(fileNameRef.current);
      if (choice === "cancel") return;
      if (choice === "save") {
        const success = await handleSave();
        if (!success) return;
      }
    }

    isProgrammaticUpdate.current = true;
    editor.commands.setContent("");

    setFilePath(null);
    setFileName("Untitled");
    setCreatedDate(new Date().toISOString());
    setIsDirty(false);
    showNotification("info", "New note created", 2000);
  }, [editor, handleSave, promptUnsavedChanges, showNotification]);

  /**
   * Global Keyboard Shortcuts (Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+Shift+S)
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (!isModifier) return;

      const key = e.key.toLowerCase();

      if (key === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      } else if (key === "o") {
        e.preventDefault();
        handleOpen();
      } else if (key === "n") {
        e.preventDefault();
        handleNew();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave, handleSaveAs, handleOpen, handleNew]);

  /**
   * Unsaved Changes Protection on Window Close Request (Alt+F4 / Window X)
   */
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function setupCloseListener() {
      try {
        const win = getCurrentWindow();
        unlisten = await win.onCloseRequested(async (event) => {
          if (isDirtyRef.current) {
            const decision = await promptUnsavedChanges(fileNameRef.current);

            if (decision === "cancel") {
              // User chose Cancel: abort window close
              event.preventDefault();
              return;
            }

            if (decision === "save") {
              const saved = await handleSaveRef.current();
              if (!saved) {
                // If save was aborted in the file dialog, prevent close
                event.preventDefault();
                return;
              }
            }

            // If decision === "dontsave" or save succeeded, allow window to close naturally!
          }
        });
      } catch (err) {
        console.error("Window close handler registration:", err);
      }
    }

    setupCloseListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [promptUnsavedChanges]);

  return {
    filePath,
    fileName,
    isDirty,
    notification,
    dismissNotification: () => setNotification(null),
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
  };
}
