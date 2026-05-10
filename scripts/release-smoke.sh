#!/usr/bin/env bash
# Build, sign-verify, and install the release APK on a connected device.
# Usage: scripts/release-smoke.sh [--no-clean] [--no-install] [--logcat] [--bundle]
#   --bundle  also build a signed AAB (Play Store upload format) at app/build/outputs/bundle/release/

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APK="$REPO_ROOT/android/app/build/outputs/apk/release/app-release.apk"
AAB="$REPO_ROOT/android/app/build/outputs/bundle/release/app-release.aab"
MAPPING="$REPO_ROOT/android/app/build/outputs/mapping/release/mapping.txt"
PKG="com.somus.app"

CLEAN=1
INSTALL=1
LOGCAT=0
BUNDLE=0
for arg in "$@"; do
  case "$arg" in
    --no-clean)   CLEAN=0 ;;
    --no-install) INSTALL=0 ;;
    --logcat)     LOGCAT=1 ;;
    --bundle)     BUNDLE=1 ;;
    -h|--help)
      sed -n '2,5p' "$0"; exit 0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }

# --- Locate Android build-tools (apksigner, aapt) -----------------------------
# Prefer ANDROID_HOME / ANDROID_SDK_ROOT; fall back to local.properties; finally a default.
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [[ -z "$SDK" && -f "$REPO_ROOT/android/local.properties" ]]; then
  # local.properties uses Java-escapes: backslashes are doubled, colons may be \:
  raw="$(grep -E '^sdk\.dir=' "$REPO_ROOT/android/local.properties" | head -n1 | cut -d= -f2-)"
  # collapse \\ -> \, \: -> :
  SDK="$(printf '%s' "$raw" | sed -e 's/\\\\/\\/g' -e 's/\\:/:/g')"
fi
SDK="${SDK:-$HOME/AppData/Local/Android/Sdk}"
# Convert C:\foo or C:/foo → /c/foo for bash filesystem ops on Windows.
case "$SDK" in
  [A-Za-z]:[/\\]*) drive="${SDK:0:1}"; rest="${SDK:2}"; SDK="/${drive,,}/${rest//\\//}" ;;
esac
[[ -d "$SDK/build-tools" ]] || fail "Android SDK build-tools not found at $SDK/build-tools (set ANDROID_HOME)"
BT_DIR="$(ls -1d "$SDK"/build-tools/*/ 2>/dev/null | sort -V | tail -n1)"
BT_DIR="${BT_DIR%/}"
[[ -n "$BT_DIR" ]] || fail "no build-tools versions installed under $SDK/build-tools"

# Pick the right binary name for the host. Windows uses .bat/.exe.
pick() { for f in "$@"; do [[ -f "$f" ]] && { echo "$f"; return; }; done; }
APKSIGNER="$(pick "$BT_DIR/apksigner.bat" "$BT_DIR/apksigner")"
AAPT="$(pick "$BT_DIR/aapt.exe" "$BT_DIR/aapt")"
[[ -n "$APKSIGNER" ]] || fail "apksigner not found in $BT_DIR"
[[ -n "$AAPT" ]]      || fail "aapt not found in $BT_DIR"

# --- Build --------------------------------------------------------------------
cd "$REPO_ROOT/android"
TASKS=("assembleRelease")
[[ "$BUNDLE" == "1" ]] && TASKS+=("bundleRelease")
if [[ "$CLEAN" == "1" ]]; then
  step "gradlew clean ${TASKS[*]}"
  ./gradlew clean "${TASKS[@]}"
else
  step "gradlew ${TASKS[*]} (no clean)"
  ./gradlew "${TASKS[@]}"
fi
[[ -f "$APK" ]] || fail "APK not produced at $APK"
ok "built $(du -h "$APK" | cut -f1) — $APK"
if [[ "$BUNDLE" == "1" ]]; then
  [[ -f "$AAB" ]] || fail "AAB not produced at $AAB"
  ok "built $(du -h "$AAB" | cut -f1) — $AAB"
  if [[ -f "$MAPPING" ]]; then
    ok "R8 mapping at $MAPPING (upload to Play Console for crash de-obfuscation)"
  fi
fi

# --- Verify signature ---------------------------------------------------------
step "verifying signature"
SIG_OUT="$("$APKSIGNER" verify --print-certs "$APK" 2>&1)"
echo "$SIG_OUT" | grep -E "Subject|Signer #1 certificate DN" || true
if echo "$SIG_OUT" | grep -qi "Android Debug"; then
  fail "APK is signed with the DEBUG key — fix android/keystore.properties before shipping"
fi
ok "signed with a non-debug key"

# --- Print package metadata ---------------------------------------------------
step "package metadata"
"$AAPT" dump badging "$APK" | grep -E "^(package|application-label|sdkVersion|targetSdkVersion):"

# --- Install ------------------------------------------------------------------
if [[ "$INSTALL" == "1" ]]; then
  command -v adb >/dev/null || fail "adb not on PATH"
  DEVICES="$(adb devices | awk 'NR>1 && $2=="device"{print $1}')"
  [[ -n "$DEVICES" ]] || fail "no device connected (adb devices shows none authorized)"

  step "uninstalling prior $PKG (if present) — keeps signature mismatch from blocking install"
  adb uninstall "$PKG" >/dev/null 2>&1 || true

  step "installing release APK"
  adb install -r "$APK"
  ok "installed on $(echo "$DEVICES" | tr '\n' ' ')"

  step "launching app"
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
fi

# --- Optional logcat tail -----------------------------------------------------
if [[ "$LOGCAT" == "1" ]]; then
  step "tailing logcat (Ctrl-C to stop)"
  adb logcat -c
  adb logcat -s ReactNativeJS:* AndroidRuntime:E LeapModule:* SmsModule:* SmsOrchestrator:*
fi

ok "release smoke build complete"
