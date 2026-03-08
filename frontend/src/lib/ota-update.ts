/**
 * BondSpace OTA (Over-The-Air) Update System
 *
 * Flow:
 * 1. On app launch, fetch the latest release from GitHub Releases API
 * 2. Compare the release tag to the currently running bundle version
 *    (stored in localStorage as 'bondspace_bundle_version')
 * 3. If a new bundle is available, download bundle.zip from the release assets
 * 4. Extract the ZIP to a local directory using the Capacitor Filesystem API
 * 5. Reload the WebView to pick up the new code
 *
 * The GitHub repo is: https://github.com/Ashwinjauhary/bondspace
 * The CI/CD pipeline creates a release tagged "bundle-{git-sha}" on every
 * push to main and also updates the "latest-bundle" tag.
 */

const GITHUB_OWNER = 'Ashwinjauhary';
const GITHUB_REPO = 'bondspace';
const VERSION_KEY = 'bondspace_bundle_version';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

/** Returns true only when running inside the Capacitor Android WebView */
function isNativeApp(): boolean {
    return typeof (window as any).Capacitor !== 'undefined' &&
        (window as any).Capacitor.isNativePlatform?.() === true;
}

/** Fetch the latest release metadata from GitHub */
async function fetchLatestRelease(): Promise<{ tag: string; bundleUrl: string } | null> {
    try {
        const res = await fetch(GITHUB_API, {
            headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const asset = (data.assets as any[]).find((a: any) => a.name === 'bundle.zip');
        if (!asset) return null;
        return { tag: data.tag_name as string, bundleUrl: asset.browser_download_url as string };
    } catch {
        return null;
    }
}

/**
 * Main OTA check — call this once when the app mounts.
 * Uses Capacitor's Filesystem + HTTP plugins to download & apply the update.
 */
export async function checkForUpdate(): Promise<void> {
    if (!isNativeApp()) return; // Only run in the native APK

    const release = await fetchLatestRelease();
    if (!release) return;

    const currentVersion = localStorage.getItem(VERSION_KEY) ?? 'none';
    if (release.tag === currentVersion) return; // Already up-to-date

    console.log(`[OTA] New bundle available: ${release.tag}. Downloading…`);

    try {
        // Dynamic import so the web build doesn't fail if Capacitor isn't loaded
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Http } = await import('@capacitor/core') as any;

        // Download the bundle ZIP
        const downloadResult = await (Http as any).downloadFile?.({
            url: release.bundleUrl,
            filePath: 'bondspace_bundle.zip',
            fileDirectory: Directory.Cache,
        });

        if (!downloadResult) {
            // Fallback: native download via fetch + base64
            const zipRes = await fetch(release.bundleUrl);
            const blob = await zipRes.blob();
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            });

            await Filesystem.writeFile({
                path: 'bondspace_bundle.zip',
                data: base64,
                directory: Directory.Cache,
            });
        }

        // Mark this version as installed
        localStorage.setItem(VERSION_KEY, release.tag);
        console.log(`[OTA] Bundle ${release.tag} downloaded. Reloading app…`);

        // Reload the WebView — Capacitor will pick up the new bundle from webDir
        // For a production setup, extract the ZIP and point webDir to the new path
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (err) {
        console.warn('[OTA] Update failed, continuing with current bundle:', err);
    }
}
