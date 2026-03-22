use tauri::AppHandle;
use tauri_plugin_leap_ai::{
    CreateConversationFromHistoryRequest, CreateConversationRequest, DownloadModelRequest,
    GenerateRequest, LeapAiExt, LoadModelRequest, StopGenerationRequest, UnloadModelRequest,
};

pub async fn load_model(app: &AppHandle, model: String) -> Result<String, String> {
    let response = app
        .leap_ai()
        .load_model(LoadModelRequest {
            model,
            quantization: None,
            source_path: None,
        })
        .map_err(|e| e.to_string())?;
    Ok(response.model_id)
}

pub async fn download_model(app: &AppHandle, model: String) -> Result<String, String> {
    let response = app
        .leap_ai()
        .download_model(DownloadModelRequest {
            model,
            quantization: None,
            url: None,
        })
        .await
        .map_err(|e| e.to_string())?;
    Ok(response.model_id)
}

pub async fn create_conversation(
    app: &AppHandle,
    model_id: String,
    system_prompt: Option<String>,
) -> Result<String, String> {
    let response = app
        .leap_ai()
        .create_conversation(CreateConversationRequest {
            model_id,
            system_prompt,
        })
        .map_err(|e| e.to_string())?;
    Ok(response.conversation_id)
}

pub async fn create_conversation_from_history(
    app: &AppHandle,
    model_id: String,
    history: Vec<tauri_plugin_leap_ai::ChatMessage>,
) -> Result<String, String> {
    let response = app
        .leap_ai()
        .create_conversation_from_history(CreateConversationFromHistoryRequest { model_id, history })
        .map_err(|e| e.to_string())?;
    Ok(response.conversation_id)
}

pub async fn generate(
    app: &AppHandle,
    conversation_id: String,
    prompt: String,
) -> Result<String, String> {
    let response = app
        .leap_ai()
        .generate(GenerateRequest {
            conversation_id,
            prompt,
        })
        .map_err(|e| e.to_string())?;
    Ok(response.generation_id)
}

pub async fn stop_generation(app: &AppHandle, generation_id: String) -> Result<(), String> {
    app.leap_ai()
        .stop_generation(StopGenerationRequest { generation_id })
        .map_err(|e| e.to_string())
}

pub async fn unload_model(app: &AppHandle, model_id: String) -> Result<(), String> {
    app.leap_ai()
        .unload_model(UnloadModelRequest { model_id })
        .map_err(|e| e.to_string())
}
