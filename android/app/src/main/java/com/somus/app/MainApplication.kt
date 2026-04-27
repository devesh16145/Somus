package com.somus.app

import android.app.Application
import android.os.Build
import androidx.work.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.somus.app.leap.LeapPackage
import com.somus.app.sms.SmsPackage
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainApplication : Application(), ReactApplication, Configuration.Provider {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Register our custom native modules
                    add(SmsPackage())
                    add(LeapPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder().build()

    override fun onCreate() {
        super.onCreate()
        installNativeCrashHandler()
        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            load()
        }
    }

    /**
     * Catch uncaught JVM exceptions and write a crash log to
     * filesDir/crashes/ — the same directory RN's CrashLogger.ts reads.
     * No network, no auto-upload. The user shares manually if they want.
     */
    private fun installNativeCrashHandler() {
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            try {
                val dir = File(filesDir, "crashes")
                if (!dir.exists()) dir.mkdirs()
                val ts = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date())
                val file = File(dir, "crash-native-$ts-${System.currentTimeMillis() % 1000}.log")
                val sw = StringWriter()
                throwable.printStackTrace(PrintWriter(sw))
                file.writeText(buildString {
                    append("=== Somus crash log ===\n")
                    append("kind:    native\n")
                    append("fatal:   true\n")
                    append("version: 1.0.0\n")
                    append("os:      android ${Build.VERSION.SDK_INT}\n")
                    append("device:  ${Build.MANUFACTURER} ${Build.MODEL}\n")
                    append("thread:  ${thread.name}\n")
                    append("time:    ${Date()}\n\n")
                    append("message: ${throwable.message ?: "(no message)"}\n\n")
                    append("stack:\n")
                    append(sw.toString())
                })
            } catch (_: Throwable) { /* swallow — never block crash propagation */ }
            previous?.uncaughtException(thread, throwable)
        }
    }
}
