plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.facebook.react")
}

react {
    autolinkLibrariesWithApp()
    // Bundle JS into debug APK so it works without Metro
    debuggableVariants.set(emptyList())
}

android {
    namespace = "com.somus.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.somus.app"
        minSdk = 31
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("debug")
        }
        getByName("release") {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf("-Xskip-metadata-version-check")
    }

    // Required for LEAP SDK native libs
    packaging {
        resources {
            pickFirsts += setOf("**/libllama.so", "**/libc++_shared.so")
        }
    }
}

dependencies {
    // React Native
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")

    // LEAP SDK
    implementation("ai.liquid.leap:leap-sdk:0.9.7")
    implementation("ai.liquid.leap:leap-model-downloader:0.9.7")

    // Kotlin coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Kotlinx serialization (required for LEAP GeneratableFactory API)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // WorkManager (used by LeapModelDownloader internally)
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Core
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
}
