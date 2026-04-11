# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * { void set*(***); *** get*(); }
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# LEAP SDK
-keep class ai.liquid.** { *; }
-keep class ai.liquid.leap.** { *; }
-keep class ai.liquid.inference_engine.** { *; }

# Somus native modules
-keep class com.somus.app.sms.** { *; }
-keep class com.somus.app.leap.** { *; }

# Kotlin serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keep,includedescriptorclasses class com.somus.app.leap.**$$serializer { *; }
-keepclassmembers class com.somus.app.leap.** { *** Companion; }

# OkHttp / Okio (used by LEAP downloader)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
