pluginManagement {
    includeBuild("../node_modules/@react-native/gradle-plugin")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins { id("com.facebook.react.settings") }

extensions.configure<com.facebook.react.ReactSettingsExtension> {
    autolinkLibrariesFromCommand()
}

// Root-level includeBuild allows com.facebook.react artifact substitution
// in library buildscript classpath declarations (e.g. react-native-quick-sqlite)
includeBuild("../node_modules/@react-native/gradle-plugin")

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()

        // LEAP SDK
        maven { url = uri("https://maven.liquid.ai/repository/maven-public/") }

        // React Native
        maven { url = uri("$rootDir/../node_modules/react-native/android") }
        maven { url = uri("$rootDir/../node_modules/jsc-android/dist") }
    }
}

rootProject.name = "Somus"
include(":app")
