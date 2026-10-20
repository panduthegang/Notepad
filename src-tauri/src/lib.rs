use std::path::PathBuf;
// tauri::Manager is needed for app.get_webview_window()
// tauri::Emitter is needed for app.emit()
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_fs::FsExt;

// Payload sent to the JS frontend when a second instance tries to open a file
#[derive(Clone, serde::Serialize)]
struct OpenFilePayload {
    path: String,
}

// Unused but kept as a minimal example for learning purposes
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Helper function to validate and allow a `.hr` file at runtime.
///
/// 1. Strips any surrounding quotes (Windows can pass `"C:\path\file.hr"` when path has spaces).
/// 2. Validates that the file ends with `.hr` (case-insensitive).
/// 3. Dynamically adds that exact file to Tauri's filesystem runtime scope (`app.fs_scope().allow_file()`).
///    This grants the frontend permission to read (readTextFile) and write/save (writeTextFile)
///    back to this specific file, without exposing the rest of the disk.
fn allow_and_clean_hr_path(app: &AppHandle, raw_path: &str) -> Option<String> {
    let trimmed = raw_path.trim().trim_matches('"').trim();
    if trimmed.is_empty() {
        return None;
    }

    let path = PathBuf::from(trimmed);

    // Validate that the file extension is .hr (case-insensitive)
    let is_hr = path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("hr"))
        .unwrap_or(false);

    if !is_hr {
        return None;
    }

    // Add this exact file to the runtime fs scope so readTextFile and writeTextFile succeed
    if let Err(err) = app.fs_scope().allow_file(&path) {
        eprintln!("HRNote: Failed to allow file in fs_scope: {err}");
    }

    Some(trimmed.to_string())
}

/// Explicit command to ensure a .hr file is granted runtime fs scope.
#[tauri::command]
fn grant_file_access(app: AppHandle, path: String) -> Result<String, String> {
    allow_and_clean_hr_path(&app, &path)
        .ok_or_else(|| "Invalid file: path must end with .hr".to_string())
}

/// Returns the process arguments, with any .hr file argument cleaned and added
/// to the fs runtime scope.
/// args[0] = path to the executable.
/// args[1] = the .hr file path, when the user double-clicks a .hr file (cold start).
#[tauri::command]
fn get_startup_args(app: AppHandle) -> Vec<String> {
    let raw_args: Vec<String> = std::env::args().collect();
    let mut cleaned_args: Vec<String> = Vec::new();

    for (i, arg) in raw_args.into_iter().enumerate() {
        if i == 0 {
            cleaned_args.push(arg);
        } else if let Some(cleaned) = allow_and_clean_hr_path(&app, &arg) {
            cleaned_args.push(cleaned);
        } else {
            cleaned_args.push(arg);
        }
    }

    cleaned_args
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // ── Single-instance guard ──────────────────────────────────────────
        // If the user double-clicks a .hr file while HRNote is already open,
        // Windows would normally launch a second process. This plugin prevents
        // that: the second process is killed immediately, and this closure runs
        // in the FIRST (existing) process instead.
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // Find the first .hr file in the new instance's arguments,
            // clean it, and allow it in the fs scope.
            let hr_path = args
                .iter()
                .skip(1)
                .find_map(|a| allow_and_clean_hr_path(app, a));

            // Bring the existing window to the front so the user can see it.
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.unminimize();
                let _ = win.set_focus();
            }

            // Tell the JS frontend to open the file (if any was requested).
            // The frontend listens for this event in useFileActions.ts.
            if let Some(path) = hr_path {
                let _ = app.emit("open-file", OpenFilePayload { path });
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, get_startup_args, grant_file_access])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
