buildscript {
    ext {
        buildToolsVersion = "35.0.0"
        minSdkVersion = 31
        compileSdkVersion = 35
        targetSdkVersion = 35
        ndkVersion = "27.1.12297006"
        kotlinVersion = "2.3.10"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.13.2")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.10")
    }
}

apply plugin: "com.facebook.react.rootproject"
