buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.9.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.21")
        classpath("org.jetbrains.kotlin:kotlin-serialization:2.0.21")
        // Provides com.facebook.react plugin to legacy library build scripts
        // (substituted by the includeBuild in settings.gradle.kts)
        classpath("com.facebook.react:react-native-gradle-plugin:0.76.5")
    }
}

// Shared ext properties consumed by autolinked library build.gradle files
// via rootProject.ext.get("ndkVersion") / getExtOrDefault() etc.
extra["ndkVersion"]        = "27.1.12297006"
extra["compileSdkVersion"] = 36
extra["targetSdkVersion"]  = 35
extra["minSdkVersion"]     = 31
extra["kotlinVersion"]     = "2.0.21"
