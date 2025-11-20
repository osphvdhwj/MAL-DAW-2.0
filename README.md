# MAL Down 2.0 - Android App

A native Android application for browsing and managing your MyAnimeList library.

## Features

- 🔍 **Search Anime** - Search through thousands of anime titles
- 🔥 **Top Rated** - Browse top-rated anime
- 📅 **Seasonal** - View current season's anime
- 🕒 **Schedule** - Check anime airing schedule
- 📚 **Library Management** - Track your anime watching progress
- 🎲 **Random Discovery** - Get random anime recommendations
- 📥 **Offline Support** - Save anime to your local database

## Technology Stack

- **Kotlin** - Modern Android development language
- **Jetpack Compose** - Modern UI toolkit
- **Room Database** - Local data persistence
- **Retrofit** - API communication with Jikan (MyAnimeList API)
- **Coil** - Image loading
- **Material 3** - Modern Material Design
- **Coroutines & Flow** - Async operations

## Building the App

### Prerequisites

- Android Studio Arctic Fox or later
- JDK 17
- Android SDK 34
- Minimum Android version: 7.0 (API 24)

### Local Build

1. Clone the repository:
```bash
git clone https://github.com/osphvdhwj/MAL-DAW-2.0.git
cd MAL-DAW-2.0
```

2. Open the project in Android Studio

3. Build the app:
```bash
./gradlew assembleDebug
```

4. The APK will be generated at:
```
app/build/outputs/apk/debug/app-debug.apk
```

### GitHub Actions Build

The repository includes GitHub Actions workflow that automatically builds APKs on every push to main branch.

**To get APKs from GitHub Actions:**

1. Go to the **Actions** tab in your repository
2. Click on the latest workflow run
3. Scroll down to **Artifacts** section
4. Download:
   - `app-debug` - Debug APK for testing
   - `app-release-signed` - Release APK (requires signing keys)

### Setting up Signing Keys (Optional)

For release builds with GitHub Actions:

1. Generate a keystore (if you don't have one):
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

2. Convert keystore to base64:
```bash
base64 my-release-key.jks > keystore-base64.txt
```

3. Add GitHub Secrets:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `SIGNING_KEY` - Content of keystore-base64.txt
     - `ALIAS` - Your key alias (e.g., my-key-alias)
     - `KEY_STORE_PASSWORD` - Your keystore password
     - `KEY_PASSWORD` - Your key password

## API

This app uses the [Jikan API](https://jikan.moe/) - an unofficial MyAnimeList API.

- Base URL: `https://api.jikan.moe/v4/`
- No API key required
- Rate limit: Respect the 3 requests per second limit

## Project Structure

```
app/src/main/java/com/example/maldown/
├── data/
│   ├── Models.kt          # Data models and entities
│   ├── Database.kt        # Room database setup
│   └── Network.kt         # Retrofit API service
├── ui/
│   ├── MainViewModel.kt   # ViewModel for business logic
│   └── theme/             # Material 3 theme
│       ├── Theme.kt
│       └── Type.kt
└── MainActivity.kt        # Main Compose UI
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Credits

- [Jikan API](https://jikan.moe/) - MyAnimeList API
- [MyAnimeList](https://myanimelist.net/) - Anime database

## Disclaimer

This is an unofficial app and is not affiliated with MyAnimeList.
