// tauri::Manager is needed for app.get_webview_window() and app.emit()
use tauri::Manager;

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

/// Returns the raw process arguments.
/// args[0] = path to the executable.
/// args[1] = the .hr file path, when the user double-clicks a .hr file (cold start).
#[tauri::command]
fn get_startup_args() -> Vec<String> {
    std::env::args().collect()
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
            // Find the first .hr file in the new instance's arguments.
            // args[0] is the exe path, so we skip it.
            let hr_path = args
                .iter()
                .skip(1)
                .find(|a| a.to_lowercase().ends_with(".hr"))
                .cloned();

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
        .invoke_handler(tauri::generate_handler![greet, get_startup_args])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
