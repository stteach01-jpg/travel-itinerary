# Android App Skeleton

This folder contains a native Android WebView shell for the travel itinerary planner.

## How it works

- Android Studio opens `android-app/` as the project root.
- The Gradle task `copyWebAssets` copies the root web files into `app/src/main/assets/www` before build:
  - `../index.html`
  - `../styles.css`
  - `../script.js`
- `MainActivity` loads `file:///android_asset/www/index.html`.

## Build

1. Open `android-app/` in Android Studio.
2. Let Android Studio sync Gradle.
3. Run the `app` configuration on an Android device or emulator.
4. Build APK/AAB from Android Studio when needed.

## Notes

- Google Maps links open outside the WebView.
- Image upload uses Android's file chooser.
- Export downloads from WebView may need a dedicated Android bridge in a later version; the hosted web version remains the safest export path.
