import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.bondspace.app',
    appName: 'BondSpace',
    webDir: 'out',
    bundledWebRuntime: false,
    server: {
        // For development with hot reload, uncomment below and set your LAN IP:
        // url: 'http://192.168.x.x:3000',
        // cleartext: true,
        androidScheme: 'https',
    },
    android: {
        backgroundColor: '#0d0d1a',
        allowMixedContent: true,
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#0d0d1a',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
    },
};

export default config;
