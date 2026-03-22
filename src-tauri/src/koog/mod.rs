#[cfg(target_os = "macos")]
pub fn start_jvm() {
    use jni::{InitArgsBuilder, JavaVM};

    let jar_path = std::env::var("KOOG_JAR_PATH").unwrap_or_else(|_| {
        let fallback_exe =
            std::env::current_exe().unwrap_or_else(|_| std::path::PathBuf::from("."));
        fallback_exe
            .parent()
            .unwrap_or(std::path::Path::new("."))
            .join("koog-agent.jar")
            .to_string_lossy()
            .to_string()
    });

    let jvm_args = InitArgsBuilder::new()
        .version(jni::sys::JNI_VERSION_1_8)
        .option(&format!("-Djava.class.path={jar_path}"))
        .build()
        .expect("Failed to build JVM args");

    let _ = JavaVM::new(jvm_args).expect("Failed to start JVM for Koog");
    log::info!("Koog JVM started on macOS, classpath: {}", jar_path);
}

#[cfg(not(target_os = "macos"))]
pub fn start_jvm() {}
