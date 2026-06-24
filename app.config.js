// Dynamic Expo config — injects the AdMob App ID from .env (EXPO_PUBLIC_ADMOB_APP_ID)
// into the react-native-google-mobile-ads native config at build time.
// Falls back to Google's official TEST App ID so a build never crashes if the var is missing.

const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

module.exports = ({ config }) => {
  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_APP_ID || TEST_ANDROID_APP_ID;

  // google-services.json is git-ignored (public repo). On EAS it comes from the
  // GOOGLE_SERVICES_JSON file env var (a path); locally it falls back to the file on disk.
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || './google-services.json';

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile,
    },
    plugins: [
      ...(config.plugins || []),
      [
        'react-native-google-mobile-ads',
        {
          androidAppId,
        },
      ],
    ],
  };
};
