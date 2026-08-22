import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import SEO from '../../components/SEO';
import './LegalPage.css';

export default function Terminos() {
    return (
        <div className="legal-page">
            <SEO title="Términos y Condiciones" description="Términos y condiciones de uso de BOOZ Studio." />
            <Link to="/cliente/home" className="legal-back"><FaArrowLeft /> Volver</Link>
            <h1>Términos y Condiciones</h1>
            <p className="legal-updated">Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h2>1. Aceptación de los términos</h2>
            <p>
                Al crear una cuenta y usar la plataforma de BOOZ Studio ("BOOZ", "nosotros") para reservar clases,
                comprar créditos o suscripciones, aceptas estos Términos y Condiciones y nuestro
                {' '}<Link to="/privacidad">Aviso de Privacidad</Link>.
            </p>

            <h2>2. Reservas y cancelaciones</h2>
            <ul>
                <li>Las reservas están sujetas a disponibilidad de cupo.</li>
                <li>Puedes cancelar una reserva hasta 24 horas antes del horario de la clase para recibir el reembolso correspondiente en créditos.</li>
                <li>Cancelaciones con menos de 24 horas de anticipación no son reembolsables.</li>
                <li>El no presentarte a una clase reservada ("no-show") se considera como una clase tomada.</li>
            </ul>

            <h2>3. Pagos y créditos</h2>
            <p>
                Los pagos se procesan a través de Stripe, un proveedor externo de procesamiento de pagos. BOOZ no
                almacena los datos completos de tu tarjeta. Los créditos y suscripciones adquiridos son personales,
                intransferibles y no reembolsables salvo que la ley aplicable indique lo contrario.
            </p>

            <h2>4. Responsiva de participación</h2>
            <p>
                Al participar en clases de BOOZ Studio declaras estar en condiciones físicas adecuadas para realizar
                actividad física. Es tu responsabilidad informar a nuestro equipo sobre lesiones, condiciones médicas
                o restricciones relevantes antes de cada clase.
            </p>

            <h2>5. Conducta</h2>
            <p>
                Nos reservamos el derecho de suspender o cancelar cuentas que hagan uso indebido de la plataforma,
                incluyendo intentos de fraude, abuso del sistema de reservas o comportamiento inapropiado hacia el
                personal u otras alumnas.
            </p>

            <h2>6. Modificaciones</h2>
            <p>
                Podemos actualizar estos términos ocasionalmente. Te notificaremos los cambios relevantes a través
                de la plataforma o por correo electrónico.
            </p>

            <h2>7. Contacto</h2>
            <p>
                Si tienes dudas sobre estos términos, contáctanos a través de los medios indicados en la sección de
                Ubicación de la plataforma.
            </p>
        </div>
    );
}
