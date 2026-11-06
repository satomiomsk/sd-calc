# Android APK

The Android app is packaged from the same static website that is deployed to Cloudflare Pages.

## Build an APK

1. Open the repository on GitHub.
2. Select **Actions**.
3. Open **Build Android APK**.
4. Select **Run workflow** (or open a completed run triggered by a push to `reduce-supabase-traffic`).
5. Download the artifact named `sd-calculator-android-apk`.
6. Extract the ZIP archive. It contains `app-debug.apk`, which can be installed on an Android device.

The APK contains the exported website files inside the application package. The calculator interface and calculations therefore work without a connection after installation, provided all required assets are bundled locally.

This workflow creates a debug-signed APK for testing and direct installation. A Play Store release should use a separately configured release signing key; never commit the keystore or passwords to this repository.
