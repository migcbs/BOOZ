import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

const STORAGE_KEY = 'booz_cookie_consent';

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) setVisible(true);
    }, []);

    const respond = (value) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, date: new Date().toISOString() }));
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="cookie-banner animate-cookie-in" role="dialog" aria-live="polite">
            <p>
                Usamos almacenamiento local esencial para mantener tu sesión iniciada y recordar tus preferencias.
                No usamos cookies de publicidad ni rastreo de terceros. Más info en nuestro{' '}
                <Link to="/privacidad">Aviso de Privacidad</Link>.
            </p>
            <div className="cookie-actions">
                <button className="cookie-btn-decline" onClick={() => respond('rejected')}>Rechazar</button>
                <button className="cookie-btn-accept" onClick={() => respond('accepted')}>Aceptar</button>
            </div>
        </div>
    );
}
