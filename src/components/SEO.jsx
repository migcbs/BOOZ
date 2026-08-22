import React from 'react';
import { Helmet } from 'react-helmet-async';

// Título/meta por ruta. Nota: como esta app es CRA sin SSR, esto solo
// afecta lo que ve el navegador (pestaña, historial) y crawlers que
// ejecutan JS — un bot que no ejecuta JS seguirá viendo el shell
// estático de public/index.html.
export default function SEO({ title, description }) {
  const fullTitle = title ? `${title} | BOOZ Studio` : 'BOOZ | Studio';
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
    </Helmet>
  );
}
