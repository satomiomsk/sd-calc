# Android APK

The Android app is packaged from the same static website as the Cloudflare Pages site.

## Build an installable APK

1. Open the repository on GitHub.
2. Select **Actions**.
3. Open **Build Android APK**.
4. Download the artifact named `sd-calculator-android-release-apk`.
5. Extract the ZIP archive. It contains `app-release.apk`.

The release build enables code shrinking and resource shrinking. It is currently signed with the Android debug key for installation and testing.

## RuStore publishing

Before the first RuStore upload, configure a permanent release keystore and its passwords as GitHub Actions secrets. Do not commit the keystore or passwords to this repository. Keep secure backups: all future updates must use the same signing identity.

The separate `Build standalone offline APK` workflow is retained for now because it uses a different offline packaging path. Do not remove it until that build path is confirmed unnecessary.
