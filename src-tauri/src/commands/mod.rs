use tauri::AppHandle;

#[tauri::command]
pub async fn load_model(app: AppHandle, model: String) -> Result<String, String> {
    crate::providers::load_model(&app, model).await
}

#[tauri::command]
pub async fn download_model(app: AppHandle, model: String) -> Result<String, String> {
    crate::providers::download_model(&app, model).await
}

#[tauri::command]
pub async fn create_conversation(
    app: AppHandle,
    model_id: String,
    system_prompt: Option<String>,
) -> Result<String, String> {
    crate::providers::create_conversation(&app, model_id, system_prompt).await
}

#[tauri::command]
pub async fn generate_text(
    app: AppHandle,
    conversation_id: String,
    message: String,
) -> Result<String, String> {
    crate::providers::generate(&app, conversation_id, message).await
}

#[tauri::command]
pub async fn stop_generation(app: AppHandle, generation_id: String) -> Result<(), String> {
    crate::providers::stop_generation(&app, generation_id).await
}

#[tauri::command]
pub async fn unload_model(app: AppHandle, model_id: String) -> Result<(), String> {
    crate::providers::unload_model(&app, model_id).await
}
