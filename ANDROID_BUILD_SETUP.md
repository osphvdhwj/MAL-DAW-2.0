# Android Build Setup Guide

## 🚨 Important: Gradle Wrapper JAR

GitHub doesn't allow uploading binary `.jar` files directly through the API. You need to add the Gradle wrapper JAR file manually:

### Option 1: Using Git Command Line

```bash
# Clone the repository
git clone https://github.com/osphvdhwj/MAL-DAW-2.0.git
cd MAL-DAW-2.0

# Download and setup gradle wrapper
./gradlew wrapper --gradle-version 8.2

# Or manually download and add the JAR
mkdir -p gradle/wrapper
cd gradle/wrapper
wget https://raw.githubusercontent.com/gradle/gradle/v8.2.0/gradle/wrapper/gradle-wrapper.jar

# Commit and push
cd ../..
git add gradle/wrapper/gradle-wrapper.jar
git commit -m "Add gradle wrapper jar"
git push
```

### Option 2: Using Android Studio

1. Open the project in Android Studio
2. Android Studio will automatically detect missing Gradle wrapper
3. Click "OK" when prompted to add Gradle wrapper
4. Commit the generated `gradle/wrapper/gradle-wrapper.jar` file

### Option 3: Manual Download

1. Download the Gradle wrapper JAR from: [https://github.com/gradle/gradle/raw/v8.2.0/gradle/wrapper/gradle-wrapper.jar](https://github.com/gradle/gradle/raw/v8.2.0/gradle/wrapper/gradle-wrapper.jar)
2. Create directory: `gradle/wrapper/`
3. Place the JAR file in `gradle/wrapper/gradle-wrapper.jar`
4. Commit and push

## 🛠️ Building Without PC

Since you don't have a PC, here's how to get the Gradle wrapper JAR using GitHub Actions:

### Automated Setup Workflow

Create this file: `.github/workflows/setup-gradle.yml`

```yaml
name: Setup Gradle Wrapper

on:
  workflow_dispatch:

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Setup Gradle Wrapper
        run: |
          gradle wrapper --gradle-version 8.2
      
      - name: Commit Gradle Wrapper
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add gradle/wrapper/gradle-wrapper.jar
          git add gradlew
          git add gradlew.bat
          git commit -m "Add Gradle wrapper files"
          git push
```

Then:
1. Go to **Actions** tab
2. Select "Setup Gradle Wrapper" workflow
3. Click "Run workflow"
4. Wait for completion

## ✅ Verify Setup

After adding the Gradle wrapper JAR, verify the build:

1. Go to **Actions** tab
2. The "Android CI Build" workflow should start automatically
3. Wait for green checkmark ✓
4. Download APK from Artifacts section

## 📱 Installing the APK

### On Android Device:

1. Download the APK from GitHub Actions Artifacts or Releases
2. Go to **Settings** → **Security** → Enable "Unknown Sources"
3. Open the downloaded APK file
4. Tap "Install"

### Using ADB (if available):

```bash
adb install app-debug.apk
```

## 🔑 Release Signing (Optional)

To generate a signed release APK:

### Step 1: Generate Keystore

You previously generated a keystore using GitHub Actions. If you need to generate a new one:

```yaml
# .github/workflows/generate-keystore.yml
name: Generate Keystore

on:
  workflow_dispatch:
    inputs:
      keystore_password:
        description: 'Keystore Password'
        required: true
      key_password:
        description: 'Key Password'
        required: true
      alias:
        description: 'Key Alias'
        required: true
        default: 'my-key-alias'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Keystore
        run: |
          keytool -genkey -v -keystore my-release-key.jks \
            -keyalg RSA -keysize 2048 -validity 10000 \
            -alias ${{ github.event.inputs.alias }} \
            -storepass ${{ github.event.inputs.keystore_password }} \
            -keypass ${{ github.event.inputs.key_password }} \
            -dname "CN=MAL Down, OU=Mobile, O=Dev, L=City, S=State, C=US"
          
          base64 my-release-key.jks > keystore-base64.txt
      
      - name: Upload Keystore
        uses: actions/upload-artifact@v4
        with:
          name: signing-key
          path: |
            my-release-key.jks
            keystore-base64.txt
```

### Step 2: Add Secrets

1. Download the keystore-base64.txt from workflow artifacts
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `SIGNING_KEY`: Content of keystore-base64.txt
   - `ALIAS`: Your key alias
   - `KEY_STORE_PASSWORD`: Your keystore password
   - `KEY_PASSWORD`: Your key password

### Step 3: Build Signed APK

Once secrets are set, every push to main will create a signed release APK.

## 🐛 Troubleshooting

### Build Fails: "Could not find gradle-wrapper.jar"

**Solution:** Add the Gradle wrapper JAR file as described above.

### Build Fails: Permission Denied on gradlew

**Solution:** The workflow already includes `chmod +x gradlew`, but if building locally:

```bash
chmod +x gradlew
./gradlew assembleDebug
```

### Build Fails: Missing Android SDK

**Solution:** GitHub Actions automatically sets up Android SDK. For local builds, install Android Studio.

### App Crashes on Launch

**Solution:** Check these:
1. Minimum Android version is 7.0 (API 24)
2. Internet permission is granted
3. Check LogCat for error messages

## 📊 Build Status

Check the build status badge:

```markdown
![Android CI](https://github.com/osphvdhwj/MAL-DAW-2.0/workflows/Android%20CI%20Build/badge.svg)
```

## 📦 Project Files Checklist

- [x] `app/src/main/AndroidManifest.xml`
- [x] `app/src/main/java/com/example/maldown/MainActivity.kt`
- [x] `app/src/main/java/com/example/maldown/data/Models.kt`
- [x] `app/src/main/java/com/example/maldown/data/Network.kt`
- [x] `app/src/main/java/com/example/maldown/data/Database.kt`
- [x] `app/src/main/java/com/example/maldown/ui/MainViewModel.kt`
- [x] `app/src/main/java/com/example/maldown/ui/theme/Theme.kt`
- [x] `app/src/main/java/com/example/maldown/ui/theme/Type.kt`
- [x] `app/build.gradle.kts`
- [x] `build.gradle.kts`
- [x] `settings.gradle.kts`
- [x] `gradle.properties`
- [x] `gradle/wrapper/gradle-wrapper.properties`
- [x] `gradlew` (shell script)
- [x] `gradlew.bat` (Windows script)
- [ ] `gradle/wrapper/gradle-wrapper.jar` (**NEEDS TO BE ADDED**)
- [x] `.github/workflows/android-build.yml`
- [x] Resource files (strings, colors, themes)

## ✅ Next Steps

1. **Add Gradle Wrapper JAR** (most important)
2. Push a commit to trigger the build
3. Check Actions tab for build status
4. Download APK from Artifacts
5. Install on Android device
6. Test the app

## 📞 Support

If you encounter issues:
1. Check the Actions logs for detailed error messages
2. Verify all files are committed
3. Ensure secrets are set correctly (for release builds)

Happy Building! 🚀
