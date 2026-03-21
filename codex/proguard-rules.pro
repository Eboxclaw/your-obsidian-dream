# proguard-rules.pro — ViBo Android ProGuard / R8 rules
# Keep Koog agent classes (reflection-heavy)
-keep class ai.koog.** { *; }
# Keep ONNX Runtime
-keep class ai.onnxruntime.** { *; }
# Keep Tauri plugin annotation processor output
-keep class app.tauri.** { *; }
# Keep ViBo app classes
-keep class com.vibo.app.** { *; }
# Kotlin serialization
-keepattributes *Annotation*
-keep class kotlinx.serialization.** { *; }
