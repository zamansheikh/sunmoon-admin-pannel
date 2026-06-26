'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.id as string;
    const [status, setStatus] = useState('Redirecting to Audio Room...');

    useEffect(() => {
        if (roomId) {
            window.location.href = `https://zigoliveapp.xyz/room/${roomId}`;

            const timer = setTimeout(() => {
                setStatus('App not installed? Redirecting to store...');
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [roomId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-gray-700">
                <div className="w-16 h-16 bg-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2 text-cyan-400">Join Audio Room</h1>
                <p className="text-gray-300 mb-6">
                    Room ID: <span className="font-mono">{roomId}</span>
                </p>
                <p className="text-sm text-gray-500 mb-8">{status}</p>

                <a
                    href={`https://play.google.com/store/apps/details?id=com.adda.adda`}
                    className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-full transition duration-200 shadow-lg transform hover:scale-105"
                >
                    Download App to Join
                </a>
            </div>
        </div>
    );
}
