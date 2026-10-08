/*
 * Welke velden het formulier heeft, hoe ze heten, en wat er staat als ze leeg
 * zijn.
 *
 * ÉÉN BRON VOOR DRIE GEBRUIKERS. Formulier.tsx rendert deze lijst,
 * src/lib/formulier.ts valideert hem op de server, en FormulierScript doet
 * hetzelfde in de browser. Stonden die drie los van elkaar, dan lopen ze uit
 * elkaar zodra er een veld bij komt — en dat merk je pas als de server iets
 * afkeurt wat de browser goedvond, of andersom.
 *
 * DE TEKSTEN ZIJN GOEDGEKEURD door de klant: de aanvulling op de
 * privacyverklaring, de labels, meldingen en knopteksten. Wijzigt de klant een
 * zin, dan is dit het enige bestand dat mee hoeft.
 *
 * DE VELDEN HANGEN AAN DE PRIVACYVERKLARING en niet aan een ontwerp. Die noemt
 * ze met zoveel woorden: naam, e-mailadres, telefoonnummer en bericht, plus
 * horeca-ervaring en enthousiasme bij aanmelden en de zaak bij inhuren. Een
 * veld erbij is dus een wijziging aan die tekst, niet aan dit bestand alleen.
 */

/**
 * Staat het formulier open?
 *
 * ZONDER DEZE VARIABELE DOET HET FORMULIER NIETS. De sectie toont dan een korte
 * melding in plaats van de velden, en het endpoint weigert de inzending zonder
 * iets te versturen. Dat is met opzet een schakelaar en geen half werkende
 * toestand: moet het formulier ooit even dicht, dan is dat een instelling en
 * geen code.
 *
 * UIT IS EEN GELDIGE TOESTAND, en geen enkele poortstap dwingt hem af. Dat is
 * het verschil met check-resend en check-opslag: die vangen een vergissing —
 * een build op Vercel waar een noodzakelijke variabele ontbreekt. Deze niet.
 * Het akkoord is er; aanzetten gebeurt bij de livegang, zie stap 5 van
 * livegang.md.
 *
 * Hij wordt op twee momenten gelezen en dat is geen slordigheid: de sectie is
 * vooraf gerenderd, dus die leest hem tijdens de build; de route draait op
 * verzoek en leest hem per aanvraag. Op Vercel zijn dat dezelfde waarden, maar
 * een wijziging werkt pas zichtbaar na een nieuwe build — de route weigert
 * meteen, de melding op de pagina verschijnt na de deploy.
 */
export function formulierActief(): boolean {
  return process.env['FORMULIER_ACTIEF'] === 'ja';
}

export type Variant = 'aanmelden' | 'inhuren';
export type VeldSoort = 'tekst' | 'email' | 'telefoon' | 'bericht';

export interface VeldDefinitie {
  /** Wordt de `name` in de inzending en de `id` van het veld. */
  naam: string;
  label: string;
  soort: VeldSoort;
  /** Optionele velden krijgen "— mag je overslaan"; verplichte geen sterretje. */
  optioneel?: boolean;
  autoComplete?: string;
  /** Wat er staat als een verplicht veld leeg is. */
  leegFout?: string;
  /** Hoeveel tekens er in mogen. Ruim voor een mens, krap voor een bot. */
  max: number;
}

/*
 * De vier velden die beide varianten delen. Ze staan bovenaan in allebei, zodat
 * iemand die het formulier twee keer tegenkomt dezelfde volgorde ziet.
 */
const NAAM: VeldDefinitie = {
  naam: 'naam',
  label: 'Je naam',
  soort: 'tekst',
  autoComplete: 'name',
  leegFout: 'We hebben je naam nodig, anders weten we niet wie je bent',
  max: 120,
};

const EMAIL: VeldDefinitie = {
  naam: 'email',
  label: 'Je e-mailadres',
  soort: 'email',
  autoComplete: 'email',
  leegFout: 'We hebben je mailadres nodig om je te kunnen antwoorden',
  max: 200,
};

const TELEFOON: VeldDefinitie = {
  naam: 'telefoon',
  label: 'Je telefoonnummer',
  soort: 'telefoon',
  optioneel: true,
  autoComplete: 'tel',
  max: 40,
};

export const VELDEN: Record<Variant, VeldDefinitie[]> = {
  aanmelden: [
    NAAM,
    EMAIL,
    TELEFOON,
    {
      naam: 'ervaring',
      label: 'Wat voor horeca-ervaring heb je?',
      soort: 'bericht',
      /*
       * Optioneel, en dat komt uit de brief: horeca-ervaring is mooi
       * meegenomen, maar de houding telt minstens zo zwaar. Verplicht maken zou
       * precies de mensen wegjagen die de club zegt te zoeken.
       */
      optioneel: true,
      max: 2000,
    },
    {
      naam: 'enthousiasme',
      label: 'Waar word je enthousiast van?',
      soort: 'bericht',
      leegFout: 'Vertel het in een paar woorden, daar zijn we benieuwd naar',
      max: 2000,
    },
    {
      naam: 'bericht',
      label: 'Wat wil je ons laten weten?',
      soort: 'bericht',
      leegFout: 'Schrijf even waar het over gaat, dan weten we wat je zoekt',
      max: 5000,
    },
  ],
  inhuren: [
    NAAM,
    EMAIL,
    TELEFOON,
    {
      naam: 'zaak',
      label: 'Je zaak of bedrijf',
      soort: 'tekst',
      autoComplete: 'organization',
      leegFout: 'We willen graag weten voor welke zaak het is',
      max: 160,
    },
    {
      naam: 'bericht',
      label: 'Wat heb je nodig, en wanneer?',
      soort: 'bericht',
      leegFout: 'Schrijf even waar het over gaat, dan weten we wat je zoekt',
      max: 5000,
    },
  ],
};

/*
 * De naam van de honeypot. Betekenisloos met opzet.
 *
 * Hij heette `bedrijfsnaam`, en dat is precies het soort naam waar de autofill
 * van een browser of een wachtwoordbeheerder op afgaat — terwijl de
 * inhuren-variant er een echt bedrijfsveld naast heeft. Een mens van wie dit
 * verborgen veld behulpzaam gevuld wordt, krijgt de bedankpagina te zien en
 * zijn bericht komt nooit aan. Deze naam herkent geen enkele heuristiek.
 */
export const HONINGPOT = 'c100-kenmerk';

/** Meldingen die niet bij één veld horen. */
export const MELDING = {
  emailOngeldig: 'Dit adres klopt niet helemaal — kijk je even mee?',
  teLang: 'Dit is wat lang — korter mag ook',
  /*
   * Het versturen mislukte. De bezoeker kan daar niets aan doen, dus hij leest
   * niet dat hij iets fout deed — hij krijgt het adres, zodat hij alsnog
   * terechtkan. Deze zin komt uit de microcopy-tabel van het design system.
   */
  verzendfout:
    'Er ging iets mis bij ons. Probeer het zo nog een keer, of bel gewoon even — of mail naar contact@declubvan.nl.',
  bezig: 'Even versturen…',
  /*
   * Wat er staat als het formulier nog uit staat. Verwijzen naar de mail mag
   * volgens het microcopy-hoofdstuk — "het is een club, je kunt ze bellen" —
   * en het is hier het enige eerlijke alternatief: de bezoeker moet ergens
   * terechtkunnen.
   */
  nogNietActief:
    'Het formulier staat er bijna. Mail ons zolang op contact@declubvan.nl, dan hoor je van ons.',
} as const;

/*
 * Haalt alles weg wat in een mailheader niet thuishoort.
 *
 * Het onderwerp bevat een naam of een zaaknaam, en die komt rechtstreeks van de
 * bezoeker. Een regeleinde daarin is het klassieke recept voor header-injectie:
 * wat na de CR of LF komt, kan door een mailserver als een nieuwe header gelezen
 * worden — een extra Bcc bijvoorbeeld. Of Resend dat afvangt weten we niet, en
 * dat is precies de reden om er niet op te wachten: de server vertrouwt niets
 * van de client.
 *
 * Alle controletekens gaan eruit en niet alleen CR en LF. Een verdwaalde tab of
 * een nulbyte hoort daar evenmin, en een witregel meer of minder in een
 * onderwerp is niets waard tegenover de zekerheid dat er niets doorheen glipt.
 * Wat overblijft wordt ingekort, want een onderwerp van vijfduizend tekens is
 * geen onderwerp.
 *
 * Op Unicode-categorie en niet op codepunt onder de 32. Dat laatste liet de
 * C1-stuurtekens door, de leesrichtingswissels (U+202E draait de rest van het
 * onderwerp om), tekens zonder breedte en de regel- en alinea-scheiders
 * U+2028/2029. Geen header-injectie, maar wel een onderwerp dat in de mailbox
 * iets anders laat zien dan er staat — en het onderwerp is waar de twee
 * bewaartermijnen aan hangen.
 */
const NIET_IN_EEN_HEADER = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;

function veiligVoorHeader(waarde: string): string {
  let uit = '';

  for (const teken of waarde) {
    if (NIET_IN_EEN_HEADER.test(teken)) continue;
    uit += teken;
  }

  return uit.trim().slice(0, 120);
}

/** Het onderwerp van de mail. Zegt welke soort het is, want de twee soorten
 * hebben verschillende bewaartermijnen: twaalf maanden voor een aanmelding,
 * zes voor een aanvraag. Zonder dat verschil in het onderwerp zijn die termijnen
 * in de mailbox niet toe te passen. */
export function onderwerp(variant: Variant, velden: Record<string, string>): string {
  return variant === 'inhuren'
    ? `Personeelsaanvraag — ${veiligVoorHeader(velden['zaak'] ?? '') || 'onbekende zaak'}`
    : `Aanmelding — ${veiligVoorHeader(velden['naam'] ?? '') || 'zonder naam'}`;
}
