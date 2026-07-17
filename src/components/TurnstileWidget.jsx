import { useEffect, useId, useRef } from 'react';
import { env } from '../config/env';

const SCRIPT_ID = 'cloudflare-turnstile-script';
let scriptPromise;

const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(window.turnstile), { once: true });
    script.addEventListener('error', () => reject(new Error('Turnstile indisponivel')), { once: true });
  });

  return scriptPromise;
};

export default function TurnstileWidget({ action, resetKey, onToken, onError }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const reactId = useId();

  useEffect(() => {
    let disposed = false;

    loadTurnstile()
      .then((turnstile) => {
        if (disposed || !containerRef.current) return;
        if (widgetRef.current !== null) turnstile.remove(widgetRef.current);
        widgetRef.current = turnstile.render(containerRef.current, {
          sitekey: env.turnstileSiteKey,
          theme: 'dark',
          action,
          callback: onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => {
            onToken('');
            onError?.();
          },
        });
      })
      .catch(() => onError?.());

    return () => {
      disposed = true;
      if (window.turnstile && widgetRef.current !== null) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [action, onError, onToken, reactId, resetKey]);

  if (!env.turnstileSiteKey) {
    return <p className="text-sm text-red-400">A verificação de segurança está indisponível.</p>;
  }

  return <div ref={containerRef} className="min-h-[65px]" />;
}
