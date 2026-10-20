import { JSONContent } from "@tiptap/react";

/**
 * Metadata for an HRNote document
 */
export interface HRNoteMeta {
  title?: string;
  created?: string;
  modified?: string;
}

/**
 * HRNote file format specification (Version 1)
 */
export interface HRNoteV1 {
  format: "hr-note";
  version: 1;
  title: string;
  created: string; // ISO 8601 date string
  modified: string; // ISO 8601 date string
  content: JSONContent;
}

export type HRNote = HRNoteV1;

/**
 * Serializes TipTap JSON content and document metadata into a formatted .hr JSON string.
 */
export function serializeNote(
  editorJson: JSONContent,
  meta?: HRNoteMeta
): string {
  const now = new Date().toISOString();

  const note: HRNoteV1 = {
    format: "hr-note",
    version: 1,
    title: meta?.title || "Untitled",
    created: meta?.created || now,
    modified: meta?.modified || now,
    content: editorJson,
  };

  return JSON.stringify(note, null, 2);
}

/**
 * Parses and validates raw .hr file content into a typed HRNote.
 * Throws a clear, user-friendly error if the file format is invalid.
 */
export function parseNote(text: string): HRNote {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This is not a valid HRNote file (corrupted or non-JSON data).");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("This is not a valid HRNote file.");
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.format !== "hr-note") {
    throw new Error("This is not a valid HRNote file (unrecognized file format).");
  }

  if (typeof obj.version !== "number") {
    throw new Error("This is not a valid HRNote file (missing or invalid format version).");
  }

  if (!obj.content || typeof obj.content !== "object") {
    throw new Error("This is not a valid HRNote file (missing document content).");
  }

  // Version dispatcher for migrations
  switch (obj.version) {
    case 1:
      return {
        format: "hr-note",
        version: 1,
        title: typeof obj.title === "string" ? obj.title : "Untitled",
        created: typeof obj.created === "string" ? obj.created : new Date().toISOString(),
        modified: typeof obj.modified === "string" ? obj.modified : new Date().toISOString(),
        content: obj.content as JSONContent,
      };

    default:
      throw new Error(
        `This HRNote file was created with a newer or unsupported version (${obj.version}). Please update HRNote to open it.`
      );
  }
}
