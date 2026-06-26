'use client';
import { PROJECT_NAME, ANDROID_PACKAGE, APP_STORE_URL } from "@/lib/constants";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Android applicationId — the same value the Flutter app ships with
// (`android/app/build.gradle.kts`). Used to build the Play Store URL +
// the Play Install Referrer attribution payload.

// App Store fallback. Once the app is listed publicly, replace with the
// numeric `id1234567890` URL — until then a search link still routes
// iOS users to the right app.

function buildPlayStoreUrl(inviterUserId: string): string {
    // `referrer=invitedBy=<id>` survives install via Google Play's
    // Install Referrer API — the mobile app reads it once on first
    // launch and uses it as the inviterUserId on Google sign-up. See
    // `docs/invite_friends_backend.md` (Section 1) in the {PROJECT_NAME}
    // mobile repo.
    const referrer = encodeURIComponent(`invitedBy=${inviterUserId}`);
    return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&referrer=${referrer}`;
}

type Platform = 'android' | 'ios' | 'desktop';

function detectPlatform(): Platform {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    // Modern iPads identify as Mac with touch — treat as iOS for the
    // App Store redirect.
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
    return 'desktop';
}

export default function InvitePage() {
    const params = useParams();
    const inviterUserId = params.id as string;
    const [platform, setPlatform] = useState<Platform>('desktop');
    const [redirected, setRedirected] = useState(false);

    useEffect(() => {
        if (!inviterUserId) return;

        // Stash the inviter id in localStorage as a soft backup. If the
        // visitor installs the app and opens this URL again later (or
        // pastes it inside the app), the app could read this — handy
        // for iOS where there's no Play Install Referrer equivalent.
        try {
            window.localStorage.setItem('pending_inviter_user_id', inviterUserId);
        } catch {
            // Private mode or storage disabled — ignore.
        }

        const p = detectPlatform();
        setPlatform(p);

        if (p === 'android') {
            // Reaching this page on Android means Android App Links did
            // NOT resolve to the app (= app not installed). Send the
            // visitor to the Play Store with the referrer so install
            // attribution survives the install.
            window.location.replace(buildPlayStoreUrl(inviterUserId));
            setRedirected(true);
        } else if (p === 'ios') {
            window.location.replace(APP_STORE_URL);
            setRedirected(true);
        }
        // Desktop: stay on the page and show the install options.
    }, [inviterUserId]);

    if (!inviterUserId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-700">Invalid invite link.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-orange-200">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white text-3xl font-extrabold">
                    A
                </div>
                <h1 className="text-2xl font-bold mb-2 text-orange-700">
                    You&apos;re invited to {PROJECT_NAME}
                </h1>
                <p className="text-gray-600 mb-6">
                    Invited by user{' '}
                    <span className="font-mono font-bold text-orange-600">
                        ID:{inviterUserId}
                    </span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    {redirected
                        ? 'Redirecting you to the store…'
                        : platform === 'desktop'
                            ? 'Open this link on your phone, or install the app from a store below.'
                            : 'If nothing happens, tap a store button below.'}
                </p>

                <div className="flex flex-col gap-3">
                    <a
                        href={buildPlayStoreUrl(inviterUserId)}
                        className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-6 rounded-full transition duration-200 shadow-md"
                    >
                        Install on Google Play
                    </a>
                    <a
                        href={APP_STORE_URL}
                        className="inline-block bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-full transition duration-200 shadow-md"
                    >
                        Install on App Store
                    </a>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Already have {PROJECT_NAME}? Just open the app — your invite is
                    already linked.
                </p>
            </div>
        </div>
    );
}
