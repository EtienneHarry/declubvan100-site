// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';

/*
 * Paden die niet in de sitemap horen, zonder sluitende schuine streep.
 * Elk van deze pagina's zet zelf ook `noindex`; scripts/check-sitemap.mjs
 * controleert dat die twee lijsten elkaar dekken.
 */
const GEEN_SITEMAP = ['/secties', '/contact/bedankt', '/contact/verzenden', '/404'];

// https://astro.build/config
export default defineConfig({
  // Nodig voor absolute URL's: canonical, og:url en og:image. Dit is het
  // productiedomein; een preview-deploy zet hier dus ook naar.
  site: 'https://declubvan.nl',
  // Alles wordt standaard vooraf gerenderd. Een losse route kan on demand
  // draaien door `export const prerender = false;` te zetten.
  output: 'static',
  /*
   * includeFiles is geen sierlijkheid maar een vereiste sinds er een route op
   * verzoek draait.
   *
   * De layout en src/lib/pagina.ts lezen hun inhoud met Keystatics reader, en
   * die leest het bestandssysteem: createReader(process.cwd(), …). Tijdens de
   * build staat src/content/ er gewoon, dus elke vooraf gerenderde pagina komt
   * er prima uit. In de Vercel-functie staat het er niet, en dan geeft read()
   * null en gooit de layout.
   *
   * Dat mislukt bovendien op de vervelendst mogelijke manier: Astro streamt de
   * HTML, dus de headers zijn al verstuurd als het renderen omvalt. De bezoeker
   * krijgt een 200 met een afgebroken stream — nul bytes, geen foutmelding, geen
   * 500. Gemeten op /contact/verzenden vóór deze regel: status 200,
   * transfer-encoding chunked, body 0 bytes, terwijl dezelfde bundel lokaal
   * 108 kB opleverde.
   *
   * keystatic.config.ts staat erbij omdat de reader hem naast de content nodig
   * heeft om de velden te kunnen lezen.
   */
  adapter: vercel({
    /*
     * Geen glob: deze adapter doet realpath() op elke opgegeven string, dus een
     * patroon met sterren levert een ENOENT op en breekt de build af. Het moeten
     * bestaande paden zijn.
     *
     * De lijst wordt bewaakt door scripts/check-meegebundeld.mjs, want een
     * contentbestand dat hier ontbreekt valt nergens op: de vooraf gerenderde
     * pagina's blijven gewoon werken en alleen een route op verzoek loopt stuk.
     */
    includeFiles: [
      'keystatic.config.ts',
      'src/content/instellingen.yaml',
      'src/content/paginas/home.yaml',
      'src/content/paginas/opdrachtgevers.yaml',
      'src/content/paginas/de-100.yaml',
      'src/content/paginas/contact.yaml',
      'src/content/paginas/voorwaarden.yaml',
      'src/content/paginas/privacy.yaml',
    ],
  }),
  // security.csp staat bewust uit, en de reden is gemeten in plaats van
  // beredeneerd. Met de vlag aan zet Astro een <meta> met automatisch berekende
  // hashes op de statische pagina's — maar niet op /keystatic. Die route draait
  // op verzoek en kreeg byte-identieke HTML, met en zonder de vlag. Precies waar
  // we hashes nodig hebben doet hij dus niets.
  //
  // Daar komt bij dat een meta naast de header uit vercel.json twee beleiden
  // oplevert, en dan handhaaft de browser de doorsnede. Het beleid staat daarom
  // per pad in vercel.json, met scripts/check-csp.mjs als bewaker. Zie CLAUDE.md.
  markdown: {
    // Shiki bakt inline stijlen in. Die zouden nu op de header-CSP stuklopen
    // in plaats van op de meta, dus dit blijft uit.
    syntaxHighlight: false,
  },
  // Keystatic injecteert zelf twee routes: /keystatic voor de admin en
  // /api/keystatic voor het lezen en schrijven. Allebei met prerender false,
  // dus die draaien op verzoek. De vijf pagina's blijven vooraf gerenderd.
  /*
   * De sitemap loopt over de vooraf gerenderde routes en schrijft
   * sitemap-index.xml plus sitemap-0.xml naar de uitvoer.
   *
   * De filter houdt eruit wat een `noindex` in zijn HTML heeft. Die twee
   * afspraken moeten wél bij elkaar blijven: een pagina die in de sitemap staat
   * en zichzelf op noindex zet, is een tegenstrijdig signaal aan een
   * zoekmachine. `check-sitemap` bewaakt dat na de build.
   *
   * /contact/verzenden staat er ook in de lijst, en dat is gemeten en niet
   * afgeleid: de integratie neemt een route op verzoek gewoon mee. Zonder die
   * regel stond het POST-eindpunt in de sitemap.
   */
  integrations: [
    react(),
    keystatic(),
    sitemap({
      filter: (pagina) => !GEEN_SITEMAP.some((pad) => new URL(pagina).pathname.replace(/\/$/, '') === pad),
      /*
       * Zonder slotslash, net als de canonical en elke link op de site. Astro
       * schrijft de voorgerenderde routes met slash; de home blijft "/".
       */
      serialize: (item) => {
        const url = new URL(item.url);
        if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, '');
        return { ...item, url: url.href };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Niets inline zetten. Astro bakt een gebundeld script standaard in de
      // HTML zodra het onder deze grens blijft — het navigatiescript is 891
      // bytes en verdween er zo in. Onder `script-src 'self'` wordt zo'n inline
      // script geblokkeerd, en de fout zie je alleen op de deploy.
      //
      // Dit geldt ook voor kleine stylesheets en voor assets als data-URI, en
      // dat is precies de bedoeling: alles komt uit een bestand, dus 'self'
      // dekt alles. scripts/check-csp.mjs bewaakt het.
      assetsInlineLimit: 0,
    },
  },
});
