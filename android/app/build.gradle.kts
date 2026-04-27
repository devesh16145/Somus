import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.facebook.react")
}

// Load release signing config from android/keystore.properties (gitignored).
// If the file is absent we fall back to the debug keystore so dev builds still work.
val keystorePropsFile = rootProject.file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystorePropsFile.exists()) keystorePropsFile.inputStream().use { load(it) }
}
val hasReleaseKeystore = keystoreProps.getProperty("storeFile")?.let { rootProject.file(it).exists() } == true

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
        if (hasReleaseKeystore) {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("debug")
        }
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro")
            signingConfig = if (hasReleaseKeystore) {
                signingConfigs.getByName("release")
            } else {
                logger.warn("⚠️  android/keystore.properties not found — release build will be signed with the DEBUG keystore. NOT shippable to Play Store.")
                signingConfigs.getByName("debug")
            }
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
