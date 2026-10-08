import {
  HONINGPOT,
  MELDING,
  VELDEN,
  onderwerp,
  type Variant,
} from './formulier-velden';

/*
 * De afhandeling van het formulier: controleren, en bij goedkeuring versturen.
 *
 * Dit staat los van de route zodat de route dun blijft en deze regels te lezen
 * zijn zonder door Astro-plumbing heen te kijken.
 *
 * ALLES WORDT HIER OPNIEUW GECONTROLEERD. Het formulier heeft `required` en
 * `type="email"` in de HTML staan en het script doet er nog een ronde overheen,
 * maar dat zijn allebei hulpmiddelen voor de bezoeker en geen grendel: een POST
 * kan overal vandaan komen en die attributen zijn dan nooit langsgekomen. Wat
 * hier staat is de enige controle die telt.
 */

/*
 * De ondergrens op de invultijd, in milliseconden.
 *
 * Drie seconden is kort voor een mens die een formulier invult en lang voor een
 * script dat er een ziet en meteen post. Hoger zetten vangt meer bots maar
 * begint echte bezoekers te raken — wie het formulier al openhad en nu alleen op
 * verzenden drukt, is zo klaar.
 */
const MINIMALE_INVULTIJD = 3000;

/*
 * En een bovengrens, want een tijdstempel is niet te vertrouwen: hij komt uit de
 * browser en iedereen kan hem verzetten. Een waarde van meer dan een paar uur
 * geleden zegt niets meer, en die behandelen we als ontbrekend — precies zoals
 * bij een bezoeker zonder JavaScript. Vervalsen levert dus niets op, en dat is
 * de bedoeling: het is een horde, geen slot.
 */
const MAXIMALE_OUDERDOM = 4 * 60 * 60 * 1000;

/*
 * EN EEN MARGE DE ANDERE KANT OP, want de twee klokken zijn niet dezelfde.
 *
 * De tijdstempel komt uit de browser en het verschil wordt hier op de server
 * uitgerekend. Die twee lopen vrijwel nooit gelijk: een paar seconden verschil
 * is normaal en een paar minuten komt voor. Loopt de klok van de bezoeker vóór,
 * dan is het verschil negatief.
 *
 * Dat is precies waar deze controle op stuk ging. Elke negatieve waarde gold als
 * "uit de toekomst" en dus als onbruikbaar, en dan werd de drempel overgeslagen.
 * Nagemeten op de deploy: een tijdstempel die 1446 ms voorliep, en de inzending
 * ging er ongehinderd doorheen. De drempel stond daarmee bij een groot deel van
 * de bezoekers uit — zonder dat er iets aan te zien was.
 *
 * Een klein negatief verschil betekent nu wat het werkelijk betekent: net
 * geladen, dus te snel. Pas bij meer dan twee minuten verschil geven we het op
 * en laten we de inzending door. Dat is de goede kant om op te falen: liever een
 * bot die erdoorheen glipt dan een bezoeker met een scheve klok die zich niet
 * kan melden.
 */
const KLOKMARGE = 2 * 60 * 1000;

export interface Uitkomst {
  /** Per veldnaam wat eraan mankeert; `algemeen` hoort bij geen enkel veld. */
  fouten: Record<string, string>;
  waardes: Record<string, string>;
  /** Alleen gevuld als er niets op aan te merken was. */
  goedgekeurd?: Record<string, string>;
  /**
   * Afgewezen als bot, door de honeypot of de tijdsdrempel.
   *
   * De route doet dan precies wat hij bij een geslaagde inzending doet — dezelfde
   * doorverwijzing naar dezelfde bedankpagina — maar verstuurt niets. Dat is met
   * opzet: een bot die een foutmelding krijgt, weet dat hij ergens tegenaan
   * liep en past zich aan. Een bot die "gelukt" leest, heeft geen reden om iets
   * te veranderen.
   *
   * Het kost wel iets, en dat hoort erbij: raakt een mens per ongeluk in deze
   * tak, dan denkt hij dat zijn bericht is aangekomen terwijl dat niet zo is.
   * De honeypot staat daarom op `hidden` én op aria-hidden én buiten de
   * tab-volgorde, en de tijdsdrempel laat een ontbrekende tijdstempel altijd
   * door. Alleen wie het veld ziet noch kan bereiken, en toch invult, komt hier.
   */
  stilAfgewezen?: boolean;
  /** Waarom, voor de log. Nooit iets van de inhoud. */
  reden?: 'honingpot' | 'te-snel';
}

/*
 * Bijgesneden, en met regeleindes als LF.
 *
 * Een browser verstuurt de regeleindes van een textarea als CRLF, maar
 * `maxLength` en FormulierScript tellen ze als één teken. Zonder deze
 * omzetting keurde de server een bericht af dat de browser goed vond: elke
 * witregel telde hier dubbel.
 */
function schoon(waarde: FormDataEntryValue | null): string {
  return typeof waarde === 'string' ? waarde.replace(/\r\n?/g, '\n').trim() : '';
}

/*
 * Een e-mailadres controleren we bewust ruim: iets vóór de apenstaart, iets
 * erna, en een punt in dat laatste stuk. Strenger is een bekende manier om
 * geldige adressen te weigeren — de echte regel uit RFC 5322 laat meer toe dan
 * de meeste patronen aannemen, en het enige wat werkelijk bewijst dat een adres
 * bestaat, is er een bericht heen sturen.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Leest de inzending, controleert hem, en zegt wat eraan mankeert.
 *
 * De meldingen zeggen wat er nú moet gebeuren en niet dat een veld verplicht is;
 * zo staat het in het microcopy-hoofdstuk van design-system.md.
 */
export function controleer(data: FormData, variant: Variant): Uitkomst {
  const velden = VELDEN[variant];
  const waardes: Record<string, string> = {};
  const fouten: Record<string, string> = {};

  for (const veld of velden) waardes[veld.naam] = schoon(data.get(veld.naam));

  /*
   * De honeypot. Een mens ziet dit veld niet en vult het dus nooit in. Staat er
   * iets in, dan houdt het hier op — maar zonder dat te laten merken. Zie
   * `stilAfgewezen` hierboven.
   */
  if (schoon(data.get(HONINGPOT)) !== '') {
    return { fouten: {}, waardes, stilAfgewezen: true, reden: 'honingpot' };
  }

  /*
   * De tijdsdrempel. Leeg betekent: het script draaide niet, en dat is geen
   * reden om iemand te weigeren. Zie FormulierScript.astro.
   */
  const geladen = Number(schoon(data.get('geladen')));
  if (Number.isFinite(geladen) && geladen > 0) {
    const verstreken = Date.now() - geladen;
    const bruikbaar = verstreken > -KLOKMARGE && verstreken < MAXIMALE_OUDERDOM;

    if (bruikbaar && verstreken < MINIMALE_INVULTIJD) {
      return { fouten: {}, waardes, stilAfgewezen: true, reden: 'te-snel' };
    }
  }

  for (const veld of velden) {
    const waarde = waardes[veld.naam] ?? '';

    if (waarde === '') {
      if (!veld.optioneel && veld.leegFout) fouten[veld.naam] = veld.leegFout;
      continue;
    }

    if (waarde.length > veld.max) {
      fouten[veld.naam] = MELDING.teLang;
      continue;
    }

    if (veld.soort === 'email' && !EMAIL.test(waarde)) {
      fouten[veld.naam] = MELDING.emailOngeldig;
    }
  }

  if (Object.keys(fouten).length > 0) return { fouten, waardes };

  return { fouten: {}, waardes, goedgekeurd: waardes };
}

/*
 * Het adres waar de inzending heen gaat. Eén adres, overal — zie CLAUDE.md.
 */
const NAAR = 'contact@declubvan.nl';

/*
 * En het adres waarvandaan. Dit moet een domein zijn dat bij Resend geverifieerd
 * is; een willekeurig afzenderadres weigert de dienst, en terecht. Het is
 * bewust niet hetzelfde adres als de ontvanger: dan is in de mailbox meteen te
 * zien dat een bericht van het formulier komt en niet van een mens.
 */
const VAN = 'Formulier <formulier@declubvan.nl>';

export type Verzendfout = 'geen-sleutel' | 'geweigerd';

/**
 * Verstuurt de inzending via Resend.
 *
 * Geeft null terug als het gelukt is, en anders wat eraan schortte. De route
 * vertaalt dat naar een melding; hier staat geen tekst voor de bezoeker, want
 * die hoort bij de presentatie en niet bij het versturen.
 *
 * GEEN BEVESTIGINGSMAIL NAAR DE INZENDER, en dat is geen vergeten beleefdheid.
 * Een formulier dat post stuurt naar een adres dat de afzender zelf invult, is
 * een open doorgeefluik: iemand vult het adres van een ander in, schrijft wat
 * hij wil, en de mail komt van ons domein. De bevestiging staat daarom op het
 * scherm en niet in de mailbox.
 */
export async function verstuur(
  variant: Variant,
  waardes: Record<string, string>,
): Promise<Verzendfout | null> {
  /*
   * process.env en niet import.meta.env, en dat is geen smaak.
   *
   * Vite vult import.meta.env met de PUBLIC_-variabelen plus een handvol
   * systeemwaarden, en bakt die als object-literal in de bundel. Een
   * servergeheim hoort daar niet in: het zou letterlijk in het gebundelde
   * bestand komen te staan, en het zou alleen werken als de variabele al bij de
   * build bestond. Nagemeten: met RESEND_API_KEY gezet tijdens de build stond de
   * sleutel er onversleuteld in, en zonder die variabele was de waarde
   * onvindbaar — dan verstuurt het formulier niets terwijl de sleutel in Vercel
   * gewoon ingevuld staat.
   *
   * process.env wordt op het moment van de aanvraag gelezen. De sleutel komt
   * dus nooit in de bundel, en een wijziging in Vercel werkt zodra de functie
   * opnieuw start.
   */
  const sleutel = process.env['RESEND_API_KEY'];
  if (!sleutel) {
    console.error(`formulier: geen RESEND_API_KEY, inzending (${variant}) niet verstuurd`);
    return 'geen-sleutel';
  }

  const regels = VELDEN[variant]
    .map((veld) => `${veld.label}\n${waardes[veld.naam] || '—'}`)
    .join('\n\n');

  /*
   * EEN MISLUKTE VERZENDING KOMT IN DE LOG, en alleen dat.
   *
   * Tot B16 werd de status van Resend weggegooid. Een niet-geverifieerd domein,
   * een ingetrokken sleutel of een vol dagquotum leverde de bezoeker een
   * foutmelding op en de Vercel-log een geslaagde 200 — niemand bij de club zag
   * dat er aanmeldingen wegvielen. Nu staat er een regel die met `formulier:`
   * begint: de status, de foutnaam uit de JSON van Resend (zoals
   * `validation_error`), en de variant. Nooit een naam, een adres of een
   * bericht; die horen niet in een log die anderen dan de club kunnen lezen.
   *
   * De time-out van tien seconden is er omdat een hangende API anders de hele
   * functie laat wachten tot Vercel hem afbreekt — en dan krijgt de bezoeker
   * Vercels eigen foutpagina en is zijn ingevulde tekst kwijt. Nu landt het in
   * de gewone foutmelding, met zijn tekst er nog in.
   */
  try {
    const antwoord = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        authorization: `Bearer ${sleutel}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: VAN,
        to: [NAAR],
        /*
         * Antwoorden gaat rechtstreeks naar de afzender. Zonder dit zou een
         * reply naar het formulieradres gaan en daar blijven liggen.
         */
        reply_to: waardes['email'],
        subject: onderwerp(variant, waardes),
        text: regels,
      }),
    });

    if (antwoord.ok) return null;

    let foutnaam = '';
    try {
      const body: unknown = await antwoord.json();
      if (body && typeof body === 'object' && 'name' in body && typeof body.name === 'string') {
        foutnaam = body.name;
      }
    } catch {
      // Geen JSON terug; de status zegt dan genoeg.
    }
    console.error(
      `formulier: Resend weigerde de inzending (${variant}): status ${antwoord.status}${foutnaam ? `, ${foutnaam}` : ''}`,
    );
    return 'geweigerd';
  } catch (fout) {
    const soort = fout instanceof Error ? fout.name : 'onbekend';
    console.error(`formulier: versturen mislukt (${variant}): ${soort}`);
    return 'geweigerd';
  }
}
