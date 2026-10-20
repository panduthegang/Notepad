import { useState, useRef, useEffect, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { open, save, message } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";   // for single-instance event
import { invoke } from "@tauri-apps/api/core";     // for get_startup_args command
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
  // Ensures we only process startup args once (when the editor first becomes ready)
  const startupHandledRef = useRef<boolean>(false);

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

  // Auto-dismiss notification helper
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
    } catch {
      // In web fallback or non-Tauri context, document.title is sufficient
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
    return () => { editor.off("update", handleUpdate); };
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
      if (response === "Save" || response === "Yes") return "save";
      if (response === "Don't Save" || response === "No") return "dontsave";
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
      const defaultName = filePathRef.current
        ? getBasename(filePathRef.current)
        : `${fileNameRef.current}.hr`;

      const selectedPath = await save({
        title: "Save HRNote As",
        defaultPath: defaultName,
        filters: [{ name: "HRNote Document", extensions: ["hr"] }],
      });

      if (!selectedPath) return false; // user cancelled

      // Ensure path always has .hr extension
      const finalPath = selectedPath.toLowerCase().endsWith(".hr")
        ? selectedPath
        : `${selectedPath}.hr`;
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
    if (!filePathRef.current) return handleSaveAs();

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

  // Mutable ref so async listeners (close, single-instance) always call the latest save
  const handleSaveRef = useRef(handleSave);
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  // ─────────────────────────────────────────────────────────────────────────
  // Core file loading logic — shared between handleOpen, startup args, and
  // the single-instance event. Does NOT check for unsaved changes; callers
  // must do that before calling this.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Reads a .hr file from disk and loads it into the editor.
   * Shows a friendly error notification if the file is invalid or unreadable.
   * Returns true on success, false on failure.
   */
  const loadFileContent = useCallback(async (targetPath: string): Promise<boolean> => {
    if (!editor) return false;
    try {
      const fileContent = await readTextFile(targetPath);
      const note = parseNote(fileContent); // throws friendly errors on bad format

      // Prevent the 'update' listener from falsely marking the document dirty
      isProgrammaticUpdate.current = true;
      editor.commands.setContent(note.content);

      const base = getBasename(targetPath);
      setFilePath(targetPath);
      setFileName(base);
      setCreatedDate(note.created);
      setIsDirty(false);
      showNotification("info", `Opened "${base}"`, 2500);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showNotification("error", `Failed to open note: ${errorMsg}`);
      return false;
    }
  }, [editor, showNotification]);

  /**
   * Opens a file at a given path, checking for unsaved changes first.
   * Used by:
   *  - startup-args handler (app cold-started by double-clicking a .hr file)
   *  - single-instance handler (second launch while app is already open)
   */
  const openPath = useCallback(async (targetPath: string): Promise<void> => {
    if (!editor) return;

    if (isDirtyRef.current) {
      const choice = await promptUnsavedChanges(fileNameRef.current);
      if (choice === "cancel") return;
      if (choice === "save") {
        const success = await handleSaveRef.current();
        if (!success) return; // save was cancelled or failed
      }
      // dontsave → fall through and open the file
    }

    await loadFileContent(targetPath);
  }, [editor, loadFileContent, promptUnsavedChanges]);

  // Keep a stable ref so the single-instance event listener never captures
  // a stale version of openPath
  const openPathRef = useRef(openPath);
  useEffect(() => { openPathRef.current = openPath; }, [openPath]);

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Action: Open
   * Prompts for unsaved changes, shows file dialog, parses content, loads it.
   */
  const handleOpen = useCallback(async () => {
    if (!editor) return;

    if (isDirtyRef.current) {
      const choice = await promptUnsavedChanges(fileNameRef.current);
      if (choice === "cancel") return;
      if (choice === "save") {
        const success = await handleSave();
        if (!success) return;
      }
    }

    try {
      const selected = await open({
        title: "Open HRNote",
        multiple: false,
        directory: false,
        filters: [{ name: "HRNote Document", extensions: ["hr"] }],
      });

      if (!selected || Array.isArray(selected)) return; // user cancelled

      await loadFileContent(selected);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showNotification("error", `Failed to open note: ${errorMsg}`);
    }
  }, [editor, handleSave, promptUnsavedChanges, loadFileContent, showNotification]);

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
        if (e.shiftKey) handleSaveAs();
        else handleSave();
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
   * Unsaved Changes Protection on Window Close Request (Alt+F4 / X button).
   *
   * How it works: onCloseRequested() listens for the native close event.
   * After our handler returns, Tauri checks whether event.preventDefault()
   * was called. If NOT called, it calls window.destroy() internally.
   * That requires "core:window:allow-destroy" in capabilities/default.json.
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
              event.preventDefault(); // Stay open
              return;
            }

            if (decision === "save") {
              const saved = await handleSaveRef.current();
              if (!saved) {
                event.preventDefault(); // Save cancelled or failed → stay open
                return;
              }
            }

            // decision === "dontsave" OR save succeeded:
            // do NOT call preventDefault → Tauri calls destroy() → window closes.
          }
          // No unsaved changes: do NOT call preventDefault → destroy() fires.
        });
      } catch (err) {
        console.error("Window close handler registration:", err);
      }
    }

    setupCloseListener();
    return () => { if (unlisten) unlisten(); };
  }, [promptUnsavedChanges]);

  /**
   * Startup file detection (cold start).
   *
   * When the user double-clicks a .hr file in Explorer, Windows launches
   * HRNote with the file path as argv[1]. We call our Rust command
   * get_startup_args() to read the raw process arguments and open the file.
   *
   * Runs exactly once — as soon as the TipTap editor instance is first ready.
   */
  useEffect(() => {
    if (!editor || startupHandledRef.current) return;
    startupHandledRef.current = true; // never run this again

    async function handleStartupFile() {
      try {
        // invoke() calls our Rust get_startup_args() command.
        // args[0] = executable path; args[1] = file (when double-clicked)
        const args = await invoke<string[]>("get_startup_args");
        const hrFile = args.slice(1).find((a) => a.toLowerCase().endsWith(".hr"));
        if (hrFile) {
          // Editor is always fresh/empty on cold start — no dirty check needed
          await loadFileContent(hrFile);
        }
      } catch {
        // Not a Tauri context (e.g. browser preview), or command unavailable.
        // Fail silently — the app still works fine without this.
      }
    }

    handleStartupFile();
  }, [editor, loadFileContent]);

  /**
   * Single-instance event listener.
   *
   * When tauri-plugin-single-instance blocks a second HRNote launch, the
   * Rust backend emits "open-file" with { path: string } to the existing
   * window. We listen here and open the file (after checking for unsaved
   * changes, exactly like the Open button does).
   */
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function setupSingleInstanceListener() {
      try {
        unlisten = await listen<{ path: string }>("open-file", (event) => {
          // Use openPathRef so this closure always calls the latest openPath,
          // even though this effect runs only once (empty deps).
          openPathRef.current(event.payload.path);
        });
      } catch {
        // Not a Tauri context — ignore silently
      }
    }

    setupSingleInstanceListener();
    return () => { if (unlisten) unlisten(); };
  }, []); // Empty deps: set up once on mount, never re-run

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
