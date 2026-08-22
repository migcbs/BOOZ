import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import SEO from '../../components/SEO';
import './LegalPage.css';

export default function Privacidad() {
    return (
        <div className="legal-page">
            <SEO title="Aviso de Privacidad" description="Aviso de privacidad y manejo de datos personales de BOOZ Studio." />
            <Link to="/cliente/home" className="legal-back"><FaArrowLeft /> Volver</Link>
            <h1>Aviso de Privacidad</h1>
            <p className="legal-updated">Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h2>1. Datos que recopilamos</h2>
            <ul>
                <li><strong>Datos de cuenta:</strong> nombre, apellido, correo electrónico, teléfono.</li>
                <li><strong>Datos de salud (voluntarios):</strong> tipo de sangre, alergias, lesiones o condiciones médicas relevantes, contacto de emergencia — los proporcionas para tu seguridad durante las clases.</li>
                <li><strong>Datos de pago:</strong> procesados directamente por Stripe; BOOZ no almacena números completos de tarjeta.</li>
                <li><strong>Datos de uso:</strong> historial de reservas, clases tomadas, créditos y suscripciones.</li>
            </ul>

            <h2>2. Para qué usamos tus datos</h2>
            <ul>
                <li>Gestionar tu cuenta, reservas y pagos.</li>
                <li>Garantizar tu seguridad durante las clases (información médica relevante para el equipo de instructores).</li>
                <li>Enviarte confirmaciones, recordatorios de clase y comunicación relacionada con tu cuenta.</li>
                <li>Mejorar la plataforma y prevenir fraude o abuso.</li>
            </ul>

            <h2>3. Con quién compartimos tus datos</h2>
            <p>
                No vendemos tus datos personales. Compartimos información únicamente con proveedores necesarios para
                operar el servicio: <strong>Stripe</strong> (procesamiento de pagos) y <strong>Resend</strong>
                (envío de correos transaccionales como confirmación de cuenta y recordatorios de clase). Estos
                proveedores procesan datos bajo sus propias políticas de privacidad.
            </p>

            <h2>4. Cookies y almacenamiento local</h2>
            <p>
                Usamos almacenamiento local del navegador (localStorage) para mantener tu sesión iniciada y
                recordar tus preferencias, incluida tu elección sobre este aviso de cookies. No usamos cookies de
                publicidad ni de rastreo de terceros.
            </p>

            <h2>5. Tus derechos</h2>
            <p>
                Puedes solicitar acceso, corrección o eliminación de tus datos personales en cualquier momento
                desde tu perfil, o contactándonos directamente. La eliminación de la cuenta borra permanentemente
                tu información personal y tu historial de reservas.
            </p>

            <h2>6. Seguridad</h2>
            <p>
                Tus contraseñas se almacenan cifradas (nunca en texto plano). Empleamos medidas técnicas razonables
                para proteger tu información, aunque ningún sistema es 100% infalible.
            </p>

            <h2>7. Contacto</h2>
            <p>
                Para ejercer tus derechos sobre tus datos personales, contáctanos a través de los medios indicados
                en la sección de Ubicación de la plataforma.
            </p>
        </div>
    );
}
