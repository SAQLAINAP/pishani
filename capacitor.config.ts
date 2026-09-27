import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The web build in dist/ is the whole app — the APK is just a WebView around
 * it, so there is no server origin or CORS to think about.
 */
const config: CapacitorConfig = {
  appId: 'com.saqlainap.pishani',
  appName: 'Pishani',
  webDir: 'dist',
  android: {
    // Matches --paper so there is no dark flash before the first paint.
    backgroundColor: '#efece6',
  },
}

export default config
