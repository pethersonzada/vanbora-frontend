export default {
  expo: {
    name: "VanBora",
    slug: "van-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo-app-teste.png",
    scheme: "vanapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.vanbora.app",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/logo-app-teste.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false,
      usesCleartextTraffic: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo-app-teste.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "@react-native-community/datetimepicker",
      "expo-secure-store",
      "expo-splash-screen",
      "expo-status-bar",
      "expo-web-browser",
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsImpl: "mapbox"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  }
};