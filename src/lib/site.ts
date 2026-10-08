/*
 * Welke basis-URL hoort bij deze build?
 *
 * canonical, og:url en og:image moeten absoluut zijn. Op productie is dat het
 * echte domein, maar een preview-deploy staat op een eigen wegwerp-URL. Zou die
 * naar productie verwijzen, dan stuurt hij zoekmachines en deelvoorbeelden naar
 * een andere versie dan wat je bekijkt — precies het verschil dat je in een
 * preview wilt zien.
 *
 * Vercel zet VERCEL_ENV op 'production', 'preview' of 'development' en
 * VERCEL_URL op de hostnaam van deze deploy, zonder protocol. Lokaal bestaat
 * geen van beide; dan valt dit terug op `site` uit astro.config.mjs.
 */

/**
 * @param site   `Astro.site`, oftewel de waarde van `site` in astro.config.mjs.
 * @param herkomst `Astro.url.origin`, als laatste terugval wanneer `site`
 *                 helemaal niet gezet is.
 */
export function basisUrl(site: URL | undefined, herkomst: string): URL {
  const omgeving = process.env['VERCEL_ENV'];
  const deployHost = process.env['VERCEL_URL'];

  if (omgeving === 'preview' && deployHost) {
    return new URL(`https://${deployHost}`);
  }

  if (site) {
    return site;
  }

  return new URL(herkomst);
}
