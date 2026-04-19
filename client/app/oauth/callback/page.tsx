'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function OAuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error === 'email_private') {
            router.replace('/?oauth_error=email_private');
            return;
        }

        if (token) {
            localStorage.setItem('accessToken', token);
        }

        router.replace('/');
    }, [router, searchParams]);

    return <p className="text-sm">로그인 처리 중…</p>;
}

export default function OAuthCallbackPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-bg text-slate-300">
            <Suspense fallback={<p className="text-sm">로그인 처리 중…</p>}>
                <OAuthCallback />
            </Suspense>
        </div>
    );
}
