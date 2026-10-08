/*
 * Bewaakt dat een build op Vercel het aanmeldformulier niet stil onbruikbaar
 * oplevert.
 *
 * Het formulier verstuurt via Resend, en `verstuur()` in src/lib/formulier.ts
 * leest daarvoor RESEND_API_KEY. Ontbreekt die, dan geeft hij 'geen-sleutel'
 * terug en toont de route een nette melding met het mailadres erin. De bezoeker
 * loopt dus niet vast — maar zijn bericht komt ook nergens aan, en dat merkt
 * niemand: er staat geen fout op de pagina, de deploy slaagt, en de mailbox
 * blijft gewoon leeg. Precies het soort stille fout waar dit project er meer van
 * heeft gehad.
 *
 * Dezelfde vorm en dezelfde reden als check-opslag: hij draait in `npm run
 * build`, want dat is wat Vercel uitvoert, en hij gaat alleen af als VERCEL
 * gezet is. Lokaal verandert er niets — daar hoort geen sleutel te staan en
 * wordt er niets verstuurd.
 *
 * WAT HIJ NIET CONTROLEERT: of de sleutel geldig is, of het domein bij Resend
 * geverifieerd is, en of het afzenderadres geaccepteerd wordt. Dat is alleen te
 * weten door er een bericht heen te sturen, en dat hoort niet in een build. Hij
 * vangt het geval dat je zonder meten kunt uitsluiten: dat er helemaal niets
 * staat.
 */

const opVercel = process.env.VERCEL !== undefined && process.env.VERCEL !== '';
const sleutel = process.env.RESEND_API_KEY;

if (opVercel && !sleutel) {
  console.error('check-resend: deze build draait op Vercel, maar RESEND_API_KEY ontbreekt.\n');
  console.error('  Zonder die sleutel verstuurt het aanmeldformulier niets. De bezoeker krijgt');
  console.error('  een melding met het mailadres erin en loopt niet vast, maar zijn bericht');
  console.error('  komt nergens aan — en dat is aan niets te zien.');
  console.error('');
  console.error('  Zet hem in Vercel onder Settings > Environment Variables, op elke omgeving');
  console.error('  waar het formulier bereikbaar is. Het afzenderdomein moet daarnaast bij');
  console.error('  Resend geverifieerd zijn; dat controleert deze stap niet.');
  console.error('');
  process.exit(1);
}

console.log(
  opVercel
    ? 'check-resend: build op Vercel, de sleutel voor het formulier staat er.'
    : 'check-resend: lokale build, hier wordt niets verstuurd.',
);
