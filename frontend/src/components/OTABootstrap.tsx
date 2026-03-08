'use client';

import { useEffect } from 'react';
import { checkForUpdate } from '@/lib/ota-update';

/**
 * OTABootstrap — mounts once in the root layout.
 * Kicks off the silent OTA update check on every app launch.
 * Only has an effect when running inside the native Capacitor APK;
 * in the browser it is completely inert.
 */
export default function OTABootstrap() {
    useEffect(() => {
        checkForUpdate().catch(() => {
            // Silently swallow — never crash the app over a failed update check
        });
    }, []);

    return null; // Renders nothing
}
