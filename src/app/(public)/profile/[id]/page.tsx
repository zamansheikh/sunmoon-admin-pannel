'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const [status, setStatus] = useState('Redirecting...');

    useEffect(() => {
        if (userId) {
            window.location.href = `https://zigoliveapp.xyz/profile/${userId}`;

            const timer = setTimeout(() => {
                setStatus('App not installed? Redirecting to store...');
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [userId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h1 className="text-2xl font-bold mb-4 text-blue-600">Adda App</h1>
                <p className="text-gray-700 mb-6">
                    Opening profile for user ID: <span className="font-mono font-bold">{userId}</span>
                </p>
                <p className="text-sm text-gray-500">{status}</p>

                <div className="mt-8">
                    <a
                        href={`https://play.google.com/store/apps/details?id=com.adda.adda`}
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
                    >
                        Download Adda App
                    </a>
                </div>
            </div>
        </div>
    );
}
