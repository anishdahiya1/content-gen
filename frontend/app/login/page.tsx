'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ClapperboardIcon, RefreshCwIcon } from '../components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  const initGoogleSignIn = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      setGsiLoaded(true);
      try {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
        
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          context: 'signin',
          ux_mode: 'popup',
          auto_select: false,
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          }
        );
      } catch (err) {
        console.error('Error initializing Google GSI:', err);
        setStatus('Failed to load Google Sign-In buttons.');
      }
    }
  };

  useEffect(() => {
    // If user is already authenticated, redirect to workspace
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/workspace');
    }

    // Check if google accounts library is already available on load
    if (typeof window !== 'undefined' && (window as any).google) {
      initGoogleSignIn();
    }
  }, [router]);

  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    setStatus('Verifying authentication with backend...');
    
    try {
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(`Authentication failed: ${data.detail || res.statusText}`);
        setLoading(false);
        return;
      }

      // Store credentials
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setStatus('✓ Authenticated! Redirecting to workspace...');
      
      // Wait a brief moment and redirect
      setTimeout(() => {
        router.push('/workspace');
      }, 800);
    } catch (err) {
      setStatus(`Sign-in error: ${err}`);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      <Script 
        src="https://accounts.google.com/gsi/client" 
        onLoad={initGoogleSignIn}
        strategy="lazyOnload"
      />

      {/* Floating blurred ambient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-zinc-200/10 rounded-full blur-[120px] animate-pulse-glow z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-zinc-200/10 rounded-full blur-[140px] animate-pulse-glow z-0 pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 text-center space-y-8 animate-slide-up">
        {/* Logo Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-black/80 border border-[var(--border)]/40 flex items-center justify-center shadow-xl ">
            <ClapperboardIcon className="w-8 h-8 text-[var(--foreground)]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-white bg-clip-text text-transparent tracking-tight">
              CreatorPilot AI
            </h1>
            <p className="text-xs text-[var(--foreground)] font-mono tracking-widest uppercase mt-1">Creator OS Login</p>
          </div>
        </div>

        {/* Central Card */}
        <div className="card max-w-sm mx-auto p-8 border border-[var(--border)]/30 shadow-2xl relative bg-[var(--panel)]/60 backdrop-blur-md space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Welcome back</h2>
            <p className="text-[var(--foreground)] text-xs mt-1">Sign in with Google to access your vertical clips editor and copywriter RAG context</p>
          </div>

          {/* Google Sign-In Button Container */}
          <div className="flex flex-col items-center justify-center py-4 min-h-[50px] relative">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCwIcon className="w-8 h-8 animate-spin text-[var(--foreground)]" />
                <span className="text-[10px] text-zinc-300 font-mono tracking-wider animate-pulse">Authenticating session...</span>
              </div>
            ) : (
              <div id="google-signin-button" className="transition-opacity duration-300"></div>
            )}
          </div>

          {/* Status logs */}
          {status && (
            <div className="pt-2">
              {status.includes('Authenticated') || status.includes('✓') ? (
                <div className="badge-success text-center py-2 rounded-lg w-full block text-[10px]">{status}</div>
              ) : status.includes('Verifying') ? (
                <div className="badge-info text-center py-2 rounded-lg w-full block text-[10px] animate-pulse">{status}</div>
              ) : (
                <div className="badge-error text-center py-2 rounded-lg w-full block text-[10px] whitespace-pre-wrap">{status}</div>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-[var(--muted)] font-mono">
          * Uses secure Google OAuth2 login protocol.
        </div>
      </div>
    </main>
  );
}
