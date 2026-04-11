# Somus — Windows Setup Guide
## From zero to running app on your Android device

---

## What you need before starting

- Android Studio (latest — Hedgehog or newer)
- Node.js 18 or higher → https://nodejs.org
- A physical Android device (Android 12+, 3GB+ RAM)
- USB cable
- Internet connection for the one-time setup

---

## Step 1 — Install Node.js

1. Go to https://nodejs.org and download the LTS version
2. Run the installer, keep all defaults
3. Open a new Command Prompt and verify:
   ```
   node --version
   npm --version
   ```
   Both should print version numbers.

---

## Step 2 — Install React Native CLI

Open Command Prompt as Administrator:

```
npm install -g react-native-cli
```

---

## Step 3 — Install Android Studio

1. Download from https://developer.android.com/studio
2. During setup, make sure these are checked:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (not needed but harmless)
   - Performance (Intel HAXM) — only if prompted

3. After install, open Android Studio → More Actions → SDK Manager
4. Under **SDK Platforms**, check: Android 12 (API 31) and Android 14 (API 34)
5. Under **SDK Tools**, check:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools

6. Click Apply and wait for download

---

## Step 4 — Set environment variables

1. Open Start → search "Environment Variables" → "Edit the system environment variables"
2. Click "Environment Variables…"
3. Under System Variables, click New:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
     (replace YOUR_USERNAME with your actual Windows username)
4. Find the `Path` variable → Edit → New → add:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
5. Click OK on all dialogs
6. Open a NEW Command Prompt and verify:
   ```
   adb --version
   ```
   Should print a version number.

---

## Step 5 — Enable Developer Mode on your Android phone

1. Go to Settings → About phone
2. Tap "Build number" 7 times until you see "You are now a developer"
3. Go back to Settings → Developer options
4. Enable "USB debugging"
5. Connect phone to PC via USB
6. On your phone, tap "Allow" when asked to trust this computer
7. Verify connection:
   ```
   adb devices
   ```
   Should show your device listed as "device" (not "unauthorized")

---

## Step 6 — Set up the project

Copy the `somus` project folder to wherever you keep your projects, e.g. `C:\Projects\somus`

Open Command Prompt, navigate to the project:
```
cd C:\Projects\somus
```

Install JavaScript dependencies:
```
npm install
```

This will take 2-5 minutes and download ~500MB of packages.

---

## Step 7 — Copy the Gradle wrapper

React Native needs the Gradle wrapper files. These are not in the project yet.
Run this from inside the `somus` folder:

```
cd android
gradle wrapper --gradle-version 8.13
cd ..
```

If you don't have Gradle installed, download it from https://gradle.org/releases/
and add it to your PATH, OR let Android Studio handle it in Step 8.

---

## Step 8 — Open in Android Studio (first Gradle sync)

1. Open Android Studio
2. File → Open → navigate to `C:\Projects\somus\android` → click OK
3. Android Studio will ask to sync Gradle — click **Sync Now**
4. First sync downloads the LEAP SDK (~50MB) and React Native Android (~100MB)
5. Wait until "Gradle sync finished" appears at the bottom
6. If you see errors, paste them here and I'll fix them

---

## Step 9 — Run the Metro bundler (JS side)

Open a Command Prompt in the somus folder:
```
cd C:\Projects\somus
npx react-native start
```

Leave this window open. Metro is the JS bundler — it must stay running.

---

## Step 10 — Build and install on your device

Open a SECOND Command Prompt in the somus folder:
```
cd C:\Projects\somus
npx react-native run-android
```

This will:
1. Compile the Kotlin code (~2-3 minutes first time)
2. Bundle the JavaScript
3. Install the APK on your connected device
4. Launch the app automatically

---

## What you should see

The app opens on your device showing the Onboarding screen:
- "Get Started" welcome screen
- SMS permission request (tap Allow on both)
- Model download screen (tap Download, connect to Wi-Fi)
- The model downloads (~700MB) — this takes 5-15 min depending on your connection
- "You're all set" → tap Open Somus
- Dashboard appears — pull down to sync your SMS

---

## Common errors and fixes

**"SDK location not found"**
Create the file `somus\android\local.properties` with:
```
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

**"adb: device not found"**
- Make sure USB debugging is on
- Try a different USB cable (data cable, not charge-only)
- Try `adb kill-server` then `adb start-server`

**"JAVA_HOME is not set"**
Android Studio ships with a JDK. Set JAVA_HOME to:
`C:\Program Files\Android\Android Studio\jbr`

**Gradle sync fails with LEAP SDK 404**
The LEAP maven repo requires network access. Check that
`https://maven.liquid.ai` is reachable from your network.
Some corporate firewalls block it — use a hotspot if needed.

**"error: package ai.liquid.leap does not exist"**
Gradle sync hasn't completed or LEAP repo is unreachable.
In Android Studio: File → Invalidate Caches → Restart, then sync again.

**Metro bundler "Unable to resolve module"**
Run `npm install` again from the somus folder, then restart Metro.

**App crashes on launch**
Connect device, run:
```
adb logcat *:E
```
Paste the crash log here and I'll diagnose it.

---

## File structure reminder

```
somus/
├── android/                    ← Open THIS in Android Studio
│   ├── app/
│   │   ├── build.gradle.kts
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/somus/app/
│   │       │   ├── MainActivity.kt
│   │       │   ├── MainApplication.kt
│   │       │   ├── sms/            ← SMS native module
│   │       │   └── leap/           ← LEAP AI native module
│   │       └── res/
│   └── settings.gradle.kts
├── src/                        ← React Native JS/TS code
│   ├── App.tsx
│   ├── screens/
│   ├── modules/
│   ├── database/
│   ├── services/
│   └── store/
├── index.js
├── package.json
└── metro.config.js
```

---

## After first successful build

Send me any errors you hit. Common next steps:
1. Test SMS import (go to Settings → Import)
2. Verify LEAP model downloads correctly
3. Send a test transaction SMS to yourself and watch it auto-categorise

---

## Contact / Debug

When something goes wrong, the most useful thing to share is:
```
adb logcat -s ReactNativeJS LeapService SmsModule SmsForegroundService
```
Run that, reproduce the issue, and paste the output.
