// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    std::panic::set_hook(Box::new(|panic_info| {
        let msg = format!("Xteon Panic: {:?}", panic_info);
        eprintln!("{}", msg);
        let log_path = std::env::temp_dir().join("xteon_crash.log");
        let _ = std::fs::write(log_path, msg);
    }));

    xteon_lib::run();
}
