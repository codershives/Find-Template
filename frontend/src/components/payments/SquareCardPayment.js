'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const squareScriptUrls = {
  sandbox: 'https://sandbox.web.squarecdn.com/v1/square.js',
  production: 'https://web.squarecdn.com/v1/square.js',
};

const loadSquareScript = (environment = 'sandbox') => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') return reject(new Error('Square payments can only run in the browser.'));
  if (window.Square) return resolve(window.Square);

  const scriptUrl = squareScriptUrls[environment] || squareScriptUrls.sandbox;
  const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);

  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.Square), { once: true });
    existingScript.addEventListener('error', () => reject(new Error('Unable to load Square payment script.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = scriptUrl;
  script.async = true;
  script.onload = () => resolve(window.Square);
  script.onerror = () => reject(new Error('Unable to load Square payment script.'));
  document.body.appendChild(script);
});

const SquareCardPayment = forwardRef(function SquareCardPayment({ active = true }, ref) {
  const cardRef = useRef(null);
  const cardContainerRef = useRef(null);
  const [status, setStatus] = useState('Loading secure Square card fields...');
  const [error, setError] = useState('');

  useImperativeHandle(ref, () => ({
    async tokenize() {
      if (!cardRef.current) {
        throw new Error(error || 'Square card is not ready yet.');
      }

      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK') {
        const message = result.errors?.[0]?.message || 'Card verification failed. Please check your card details.';
        throw new Error(message);
      }

      return result.token;
    },
  }), [error]);

  useEffect(() => {
    if (!active || !cardContainerRef.current) return undefined;

    let mounted = true;
    let cardInstance = null;

    const setupSquareCard = async () => {
      try {
        setError('');
        setStatus('Loading secure Square card fields...');

        const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
        const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox';

        if (!applicationId || !locationId) {
          throw new Error('Square payment settings are missing. Please configure application ID and location ID.');
        }

        const Square = await loadSquareScript(environment);
        if (!mounted) return;

        const payments = Square.payments(applicationId, locationId);
        cardInstance = await payments.card();
        if (!mounted) return;

        cardContainerRef.current.innerHTML = '';
        await cardInstance.attach(cardContainerRef.current);
        if (!mounted) return;

        cardRef.current = cardInstance;
        setStatus('');
      } catch (setupError) {
        if (!mounted) return;
        cardRef.current = null;
        setStatus('');
        setError(setupError.message || 'Unable to initialize Square card fields.');
      }
    };

    setupSquareCard();

    return () => {
      mounted = false;
      cardRef.current = null;
      if (cardInstance?.destroy) {
        cardInstance.destroy();
      }
    };
  }, [active]);

  return (
    <div className="square-card-shell">
      <div ref={cardContainerRef} className="square-card-container" />
      {status && <p className="square-card-helper">{status}</p>}
      {error && <p className="square-card-error">{error}</p>}
    </div>
  );
});

export default SquareCardPayment;
