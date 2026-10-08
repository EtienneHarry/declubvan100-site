/*
 * Bewaakt dat een build op Vercel de admin niet stilletjes in local mode zet.
 *
 * keystatic.config.ts kiest zijn opslag op één variabele:
 *
 *   PUBLIC_KEYSTATIC_OPSLAG === 'github'  ->  github mode
 *   al het andere                         ->  local mode
 *
 * Die terugval is met opzet zo gebouwd — lokaal wil je local mode, en omzetten
 * hoort een bewuste handeling te zijn, niet een bijwerking van waar de build
 * toevallig draait. Maar precies die eigenschap maakt hem gevaarlijk zodra de
 * build op Vercel staat: vergeet iemand de variabele in het dashboard, of zet
 * hij hem op de verkeerde omgeving (Preview naast Production is een makkelijke
 * misser), dan valt de admin terug naar local mode. En local mode schrijft naar
 * het bestandssysteem van een serverless functie.
 *
 * Dat is de ergste soort fout die dit project kent. Er komt geen foutmelding.
 * De admin laadt, de pagina's staan er, de redacteur typt haar tekst en klikt
 * Save — en de melding zegt dat het gelukt is. Er verschijnt alleen nooit een
 * branch, nooit een commit, en bij de volgende deploy is haar werk weg. Niemand
 * merkt het op het moment dat het misgaat.
 *
 * Deze controle draait daarom in `npm run build`, en niet alleen in de poort:
 * `npm run build` is wat Vercel uitvoert. De poort roept hem ook aan, zodat een
 * kapotte controle hier lokaal opvalt in plaats van pas op de deploy.
 *
 * De voorwaarde is bewust smal. Alleen als VERCEL gezet is — dat doet het
 * platform zelf, op elke build — én de opslag niet op github staat, gaat hij
 * af. Lokaal is VERCEL leeg en verandert er dus niets; daar hoort local mode.
 */

const opVercel = process.env.VERCEL !== undefined && process.env.VERCEL !== '';
const opslag = process.env.PUBLIC_KEYSTATIC_OPSLAG;

if (opVercel && opslag !== 'github') {
  console.error('check-opslag: deze build draait op Vercel, maar de admin staat niet in github mode.\n');
  console.error(
    `  PUBLIC_KEYSTATIC_OPSLAG is ${opslag === undefined ? 'niet gezet' : `'${opslag}'`}, en moet 'github' zijn.`,
  );
  console.error('');
  console.error('  Zonder die variabele valt keystatic.config.ts terug op local mode, en dan');
  console.error('  schrijft de admin naar het bestandssysteem van een serverless functie. De');
  console.error('  redacteur krijgt een geslaagde melding te zien en verliest haar werk zonder');
  console.error('  dat iemand het merkt.');
  console.error('');
  console.error('  Zet hem in Vercel onder Settings > Environment Variables, op elke omgeving');
  console.error('  waar de admin bereikbaar is. De vier andere staan in .env.example.');
  console.error('');
  process.exit(1);
}

/*
 * EN DE VIER GEHEIMEN VAN DE GITHUB APP, sinds B16.
 *
 * @keystatic/astro leest ze met import.meta.env, en dat betekent: ze worden bij
 * de build in de serverbundel gezet. Een geheim dat tijdens de build ontbreekt —
 * alleen op Production gezet terwijl een preview bouwt, of net toegevoegd zonder
 * nieuwe deploy — staat er dus niet in, en dan loopt het inloggen in de admin
 * stuk terwijl de controle hierboven groen stond. De redacteur ziet dan een
 * foutpagina van GitHub of van Keystatic, niet waarom.
 *
 * Alleen op Vercel in github mode; lokaal en in local mode zijn ze niet nodig.
 *
 * Drie zijn hard nodig om in te loggen. De vierde, de naam van de App, gebruikt
 * Keystatic alleen voor een "installeer de App"-link als hij de repo niet kan
 * vinden; zonder werkt inloggen gewoon. Die krijgt dus een waarschuwing en geen
 * gevallen build — een build die omvalt over iets wat niet stuk is, is erger
 * dan het probleem.
 */
const GEHEIMEN = ['KEYSTATIC_GITHUB_CLIENT_ID', 'KEYSTATIC_GITHUB_CLIENT_SECRET', 'KEYSTATIC_SECRET'];
const AANBEVOLEN = ['PUBLIC_KEYSTATIC_GITHUB_APP_SLUG'];

if (opVercel) {
  for (const naam of AANBEVOLEN.filter((n) => !process.env[n]?.trim())) {
    console.warn(`check-opslag: let op — ${naam} ontbreekt. Inloggen werkt, maar de admin kan geen link tonen om de GitHub App te installeren.`);
  }

  const ontbrekend = GEHEIMEN.filter((naam) => !process.env[naam]?.trim());

  if (ontbrekend.length > 0) {
    console.error('check-opslag: de admin staat in github mode, maar de GitHub App is niet compleet.\n');
    for (const naam of ontbrekend) console.error(`  ${naam} ontbreekt in deze build.`);
    console.error('');
    console.error('  Keystatic zet deze waardes bij het bouwen in de serverbundel. Ontbreekt er');
    console.error('  een, dan laadt de admin wel, maar loopt inloggen met GitHub stuk.');
    console.error('');
    console.error('  Zet ze in Vercel onder Settings > Environment Variables, op dezelfde');
    console.error('  omgevingen als PUBLIC_KEYSTATIC_OPSLAG, en deploy opnieuw.');
    console.error('');
    process.exit(1);
  }
}

console.log(
  opVercel
    ? 'check-opslag: build op Vercel, admin in github mode, en de drie geheimen van de GitHub App zijn er.'
    : 'check-opslag: lokale build, local mode is hier de bedoeling.',
);
