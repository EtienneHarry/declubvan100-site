import { config, fields, singleton } from '@keystatic/core';
import type { GitHubConfig, LocalConfig } from '@keystatic/core';

import {
  ACHTERGROND_TOKENS,
  BREEDTE_TOKENS,
  RUIMTE_TOKENS,
  VERHOUDING_TOKENS,
  type AchtergrondToken,
  type BreedteToken,
  type RuimteToken,
  type VerhoudingToken,
} from './src/lib/tokens';

/*
 * Keystatic — het CMS achter de zes pagina's.
 *
 * Lichte variant: zes pagina's, één redacteur, een paar wijzigingen per jaar.
 * De inhoud is yaml en markdown in deze repo, geen database en geen dienst van
 * derden.
 *
 * OPSLAG. Lokaal local mode: de admin schrijft rechtstreeks naar de bestanden
 * op schijf. Op Vercel GitHub-modus, sinds B12 — check-opslag laat een build
 * daar omvallen als hij níet in GitHub-modus staat. De keuze hangt aan een
 * omgevingsvariabele en niet aan DEV of PROD, zodat omzetten een bewuste
 * handeling is en niet een bijwerking van waar de build toevallig draait.
 *
 * Let op de PUBLIC_-prefix. Dit bestand wordt niet alleen op de server gelezen
 * maar ook naar de browser gebundeld — de admin-UI draait erop. `process`
 * bestaat daar niet, dus dit moet via import.meta.env, en alleen variabelen met
 * PUBLIC_ ervoor halen de client. Zonder die prefix valt de admin om met
 * "process is not defined" en zie je een witte pagina.
 *
 * Voor GitHub-modus zijn nodig: een GitHub App, KEYSTATIC_GITHUB_CLIENT_ID,
 * KEYSTATIC_GITHUB_CLIENT_SECRET en KEYSTATIC_SECRET als omgevingsvariabelen op
 * de server, plus PUBLIC_KEYSTATIC_OPSLAG=github. Zolang die laatste er niet
 * staat, verandert er niets — lokaal blijft het dus local mode.
 *
 * BRANCHPREFIX. In GitHub-modus schrijft de admin niet naar main maar naar een
 * eigen branch, en daar bouwt Vercel een preview van. Pas na samenvoegen staat
 * het op de site. De prefix wordt letterlijk vóór de naam geplakt die de
 * redacteur intypt — in de bundel is dat `(branchPrefix ?? '') + branchName` —
 * dus de schuine streep hoort er zelf bij, anders plakt alles aaneen.
 *
 * 'redactie/' en niet 'cms/' of 'content/': de redacteur ziet deze naam in de
 * admin terug, en het onderscheidt haar werk van 'fase/', waar het bouwwerk op
 * staat. Wie de lijst met branches openslaat, ziet zo meteen wie wat gemaakt
 * heeft.
 *
 * Let op dat branchPrefix alleen op de github-tak staat. Local mode kent de
 * optie niet — LocalStorageConfig is `{ kind: 'local' }` en niets meer — dus in
 * de andere tak zou het een typefout zijn.
 *
 * DE ANNOTATIE OP opslag IS GEEN VERSIERING. Zonder haar wordt dit object
 * nergens tegen het type van het pakket gelegd. `as const` maakt er een
 * variabele van, en TypeScript controleert overtollige velden alleen op een
 * object-literal die je rechtstreeks doorgeeft — `config({ storage: opslag })`
 * is dat niet. Nagemeten: met een verzonnen veld erbij gaf `astro check`
 * gewoon 0 errors. Een typfout in branchPrefix was dan stil doorgeglipt, en
 * dat merk je pas als de redacteur op een branch zonder prefix schrijft.
 */

const opslag: GitHubConfig['storage'] | LocalConfig['storage'] =
  import.meta.env['PUBLIC_KEYSTATIC_OPSLAG'] === 'github'
    ? ({
        kind: 'github',
        repo: 'EtienneHarry/declubvan100-site',
        branchPrefix: 'redactie/',
      } as const)
    : ({ kind: 'local' } as const);

/* ---------------------------------------------------------------------------
   Tokens als keuzelijst

   De namen komen uit src/lib/tokens.ts en worden nergens hier herhaald. Een
   token toevoegen gebeurt daar: naam in de array, klasse erbij, en dan staat
   hij vanzelf in deze lijst.

   De omschrijving erachter is voor de redacteur. Staat een token er niet bij,
   dan valt hij terug op zijn eigen naam — een nieuw token verschijnt dus ook
   zonder dat iemand hier iets bijwerkt.
   --------------------------------------------------------------------------- */

const ACHTERGROND_UITLEG: Partial<Record<AchtergrondToken, string>> = {
  bruin: 'Bruin — warm donker, de standaard',
  inkt: 'Inkt — zwart vlak op het bruin',
  roet: 'Roet — iets lichter bruin',
  papier: 'Papier — licht, voor een leespagina',
  mist: 'Mist — rustig grijs op papier',
};

const RUIMTE_UITLEG: Partial<Record<RuimteToken, string>> = {
  'sectie-s': 'Krap',
  'sectie-m': 'Normaal',
  'sectie-l': 'Ruim',
};

const BREEDTE_UITLEG: Partial<Record<BreedteToken, string>> = {
  smal: 'Smal — leest het prettigst bij lange tekst',
  basis: 'Normaal',
  breed: 'Breed — voor rasters en beeld',
};

const VERHOUDING_UITLEG: Partial<Record<VerhoudingToken, string>> = {
  breed: 'Liggend (16:9)',
  portret: 'Staand (4:5)',
  vierkant: 'Vierkant (1:1)',
};

function keuzeUit<T extends string>(
  namen: readonly T[],
  uitleg: Partial<Record<T, string>>,
): { label: string; value: T }[] {
  return namen.map((naam) => ({ label: uitleg[naam] ?? naam, value: naam }));
}

/**
 * Achtergrond, ruimte en breedte. Elke sectie heeft ze alle drie, dus ze staan
 * hier één keer en worden overal ingevoegd.
 *
 * Bewust een keuzelijst en geen kleurenkiezer of vrij veld: de waardes achter
 * deze namen staan in de tokenlaag en zijn doorgerekend op contrast. Een vrije
 * kleur zou daar buitenom gaan.
 */
const weergave = fields.object(
  {
    achtergrond: fields.select({
      label: 'Achtergrond',
      description:
        'De kleur van het vlak waarop deze sectie staat. Houd één donkere en één lichte kleur per pagina aan.',
      options: keuzeUit(ACHTERGROND_TOKENS, ACHTERGROND_UITLEG),
      defaultValue: 'bruin' satisfies AchtergrondToken,
    }),
    ruimte: fields.select({
      label: 'Ruimte boven en onder',
      description: 'Hoeveel lucht deze sectie krijgt ten opzichte van de secties eromheen.',
      options: keuzeUit(RUIMTE_TOKENS, RUIMTE_UITLEG),
      defaultValue: 'sectie-m' satisfies RuimteToken,
    }),
    breedte: fields.select({
      label: 'Breedte van de inhoud',
      description: 'Hoe ver de inhoud mag uitlopen binnen de sectie.',
      options: keuzeUit(BREEDTE_TOKENS, BREEDTE_UITLEG),
      defaultValue: 'basis' satisfies BreedteToken,
    }),
  },
  {
    label: 'Weergave',
    description:
      'Hoe deze sectie eruitziet op de pagina. Aan de tekst verandert hier niets; je verzet alleen kleur, ruimte en breedte.',
  },
);

/* ---------------------------------------------------------------------------
   Kleine bouwstenen
   --------------------------------------------------------------------------- */

/*
 * De haal in een kop. Staat achter elke sectiekop in het paneel, want de
 * redacteur ziet hem niet aan het veld zelf: het is één regel tekst en er is
 * geen knopje voor.
 *
 * Bewust kort en met een voorbeeld erin. De volledige uitleg — wat er gebeurt
 * bij een vergeten sluiting, en waarom er maar één van elk mag — staat in
 * overdracht.md, en dat is het document dat naast het scherm ligt.
 */
const HAAL_UITLEG =
  ' Wil je een ovaal om een paar woorden, zet er dan [vierkante haken] omheen;' +
  ' voor een streep eronder {accolades}, en voor een stuk in de typemachine' +
  ' *sterretjes*. Eén van elk per kop.';

function bovenkopVeld() {
  return fields.text({
    label: 'Bovenkop — mag je overslaan',
    description: 'Het labeltje in hoofdletters boven de kop. Houd het bij een paar woorden.',
  });
}

function tekstVeld(beschrijving: string) {
  return fields.text({
    label: 'Tekst — mag je overslaan',
    description: beschrijving,
    multiline: true,
  });
}

/*
 * Een kop die verplicht is, en dan ook echt iets bevat. `length: { min: 1 }`
 * liet een kop van alleen spaties door, en die leverde een leeg kopelement op —
 * of, bij de opening, een pagina zonder zichtbare <h1>.
 */
const VERPLICHTE_KOP = {
  length: { min: 1 },
  pattern: { regex: /\S/, message: 'Typ hier een kop. Alleen spaties telt niet.' },
};

/*
 * Waar een link heen mag. Een pad op deze site, een volledig https-adres, een
 * mailadres of een telefoonnummer — en leeg, want een knop of kaart zonder link
 * is toegestaan. Zonder dit patroon ging een tikfout als "contact" (zonder
 * schuine streep) of "www.iets.nl" (zonder https) ongemerkt live, als link
 * naar een pagina die niet bestaat. check-links bewaakt daarna de gebouwde
 * site: elk intern pad moet een pagina hebben.
 */
const LINK = {
  regex: /^$|^(?:\/\S*|https:\/\/\S+|mailto:\S+@\S+|tel:\+?[\d ]+)$/,
  message: 'Begin met / voor een pagina op deze site, zoals /contact, of met https://, mailto: of tel:.',
};

function knopVeld(label: string, beschrijving: string) {
  return fields.object(
    {
      label: fields.text({
        label: 'Wat er op de knop staat',
        description: 'Schrijf het als iets wat de bezoeker zelf zou zeggen, zoals "Ik zoek personeel".',
      }),
      href: fields.text({
        label: 'Waar de knop heen gaat',
        description: 'Een pad op deze site, zoals /contact, of een volledig adres dat met https:// begint.',
        validation: { pattern: LINK },
      }),
    },
    { label, description: beschrijving },
  );
}

/*
 * Beeld dat de redacteur zelf kiest.
 *
 * De foto's staan in public/beeld en worden als gewoon bestand geserveerd, niet
 * door Astro geoptimaliseerd. Dat is de prijs voor een kiesbare foto: Astro's
 * beeldpijplijn werkt op imports die tijdens het bouwen bekend moeten zijn, en
 * een pad uit een yaml-bestand is dat niet.
 *
 * De alt-tekst is verplicht. Zonder validatie is dat een belofte; met
 * validatie een regel.
 *
 * DE MAP KRIJGT DE PAGINANAAM, EN DAT IS GEEN ORDE MAAR EEN BOTSING DIE WE
 * GEHAD HEBBEN. Keystatic laat je de bestandsnaam van een upload niet kiezen:
 * buiten een markdoc-veld komt die uit de veldsleutel, dus een foto in de
 * zevende sectie heet altijd `secties/6/value/beeld/bron`. Dat pad is per
 * pagina identiek. Stond `directory` op één vaste map, dan schrijven twee
 * pagina's met een beeld-tekst op dezelfde plek en overschrijft de laatste
 * upload de eerste — zonder melding, en met een alt-tekst die dan bij de
 * verkeerde foto staat. Precies dat is gebeurd tussen Opdrachtgevers en Voor
 * wie is de club.
 *
 * `transformFilename` lost het niet op: dat werkt volgens de eigen typen van
 * het pakket alleen binnen markdoc- en mdx-velden en wordt hier niet
 * aangeroepen. `directory` is een vaste string en kan dus niet zelf variëren —
 * daarom geeft onze helper hem door, van pagina() naar beneden.
 */
function beeldVeld(map: string) {
  return fields.object(
    {
      bron: fields.image({
        label: 'Foto',
        description: 'Kies een foto uit de map, of sleep er een nieuwe naartoe.',
        directory: `public/beeld/${map}`,
        publicPath: `/beeld/${map}/`,
        validation: { isRequired: true },
      }),
      alt: fields.text({
        label: 'Wat staat er op de foto',
        description:
          'Eén zin voor wie de foto niet ziet. Beschrijf wat er gebeurt, niet dat het een foto is.',
        validation: { length: { min: 1 } },
      }),
    },
    {
      label: 'Beeld — mag je overslaan',
      description: 'Laat je dit leeg, dan loopt de tekst over de volle breedte door.',
    },
  );
}

/*
 * Beeld dat écht overgeslagen mag worden.
 *
 * beeldVeld() heeft validatie op allebei zijn velden: een foto is verplicht en
 * alt-tekst ook. Dat is met opzet — bij alt-tekst is validatie het verschil
 * tussen een afspraak en een regel — maar het maakt het hele object verplicht
 * zodra het in een blok staat. Op de openingssectie kan dat niet: vier van de
 * vijf hero's op deze site hebben geen foto.
 *
 * Een vinkje ervoor lost dat op zonder de alt-regel op te geven. Staat hij uit,
 * dan is er niets in te vullen en niets te valideren; staat hij aan, dan gelden
 * dezelfde twee eisen als overal. Het alternatief — de validatie weghalen zodat
 * het veld leeg mag blijven — zou precies de controle slopen die de
 * toegankelijkheid bewaakt.
 */
function optioneelBeeldVeld(map: string, label: string, beschrijving: string) {
  return fields.conditional(
    fields.checkbox({
      label,
      description: beschrijving,
      defaultValue: false,
    }),
    {
      false: fields.empty(),
      true: beeldVeld(map),
    },
  );
}

/* ---------------------------------------------------------------------------
   De secties

   Elk type dat in src/lib/SectionRenderer.tsx staat, krijgt hier precies één
   blok met dezelfde naam. Zit een type daar niet in, dan zit het hier niet:
   het CMS kan niets aanbieden wat de site niet kan renderen.

   Een functie en geen constante, en dat is alleen om `map` naar de beeldvelden
   te krijgen. Zie beeldVeld() voor waarom dat moet.
   --------------------------------------------------------------------------- */

function sectieBlokken(map: string) {
  return fields.blocks(
    {
      hero: {
        label: 'Openingssectie',
        itemLabel: (props) => `Opening — ${props.fields.kop.value || 'zonder kop'}`,
        schema: fields.object(
          {
            weergave,
            bovenkop: bovenkopVeld(),
            kop: fields.text({
              label: 'Kop',
              description:
                'De grootste kop van de pagina. Er hoort er één per pagina te zijn, dus gebruik deze sectie ook één keer. Op een telefoon past een woord van elf letters of meer er soms niet in; dan breekt het midden in het woord. Kies een korter woord, of vraag de bouwer om een afbreekpunt.' + HAAL_UITLEG,
              validation: VERPLICHTE_KOP,
            }),
            tekst: tekstVeld('Een korte zin onder de kop. Zeg het in de helft van de woorden.'),
            knop: knopVeld('Knop — mag je overslaan', 'De belangrijkste actie op deze pagina.'),
            tweedeKnop: knopVeld(
              'Tweede knop — mag je overslaan',
              'Een tweede actie, minder opvallend dan de eerste.',
            ),
            beeld: optioneelBeeldVeld(
              map,
              'Foto op de achtergrond',
              'Met een foto komt de tekst op het beeld te staan, met een donkere laag ertussen. Zonder foto staat de sectie op een egaal vlak.',
            ),
            schicht: fields.checkbox({
              label: 'Bliksemschicht op de achtergrond',
              description:
                'De grote schicht achter de tekst. Zet hem op één sectie per pagina, niet op meer.',
              defaultValue: false,
            }),
            vullend: fields.checkbox({
              label: 'Foto vult het eerste scherm',
              description:
                'De landingsopening: het beeld loopt van rand tot rand en vult het scherm. Werkt alleen met een foto, en alleen op de openingssectie bovenaan de pagina.',
              defaultValue: false,
            }),
            dubbellaags: fields.checkbox({
              label: 'Kop met een donkere laag eronder',
              description:
                'De dubbellaagse kop uit het ontwerp. Werkt alleen op de openingssectie die bovenaan de pagina staat, en alleen op een donkere achtergrond.',
              defaultValue: false,
            }),
          },
          { label: 'Openingssectie' },
        ),
      },

      splitscreen: {
        label: 'Twee deuren',
        itemLabel: (props) => `Twee deuren — ${props.fields.deuren.elements.length} stuks`,
        schema: fields.object(
          {
            weergave,
            deuren: fields.array(
              fields.object({
                bovenkop: bovenkopVeld(),
                kop: fields.text({
                  label: 'Kop',
                  description: 'Waar deze deur over gaat. Vier of vijf woorden is genoeg.',
                  validation: VERPLICHTE_KOP,
                }),
                tekst: tekstVeld('Eén of twee zinnen die uitleggen waar deze deur heen gaat.'),
                knop: knopVeld('Knop — mag je overslaan', 'Waar deze deur op uitkomt.'),
              }),
              {
                label: 'Deuren',
                description:
                  'Twee is het maximum: een deur voor opdrachtgevers en een voor professionals. De foto\'s liggen in de code vast, en er zijn er twee. Zet dit blok niet bovenaan een pagina: de opening hoort een eigen kop te hebben.',
                itemLabel: (props) => props.fields.kop.value || 'Deur zonder kop',
                validation: { length: { max: 2 } },
              },
            ),
          },
          { label: 'Twee deuren' },
        ),
      },

      'kop-tekst': {
        label: 'Kop met tekst',
        itemLabel: (props) => `Kop met tekst — ${props.fields.kop.value || 'zonder kop'}`,
        schema: fields.object(
          {
            weergave,
            bovenkop: bovenkopVeld(),
            kop: fields.text({
              label: 'Kop',
              description: 'De kop van deze sectie. Hij staat groot op de pagina.' + HAAL_UITLEG,
              validation: VERPLICHTE_KOP,
            }),
            tekst: tekstVeld('De lopende tekst onder de kop.'),
          },
          { label: 'Kop met tekst' },
        ),
      },

      'beeld-tekst': {
        label: 'Beeld naast tekst',
        itemLabel: (props) => `Beeld naast tekst — ${props.fields.kop.value || 'zonder kop'}`,
        schema: fields.object(
          {
            weergave,
            bovenkop: bovenkopVeld(),
            kop: fields.text({
              label: 'Kop',
              description: 'De kop die naast het beeld komt te staan.' + HAAL_UITLEG,
              validation: VERPLICHTE_KOP,
            }),
            tekst: tekstVeld('De tekst die naast het beeld komt te staan.'),
            beeld: beeldVeld(map),
            verhouding: fields.select({
              label: 'Vorm van het beeldvlak',
              description:
                'Kies wat bij de foto past. Een staande foto in een liggend vlak verliest de boven- en onderkant.',
              options: keuzeUit(VERHOUDING_TOKENS, VERHOUDING_UITLEG),
              defaultValue: 'breed' satisfies VerhoudingToken,
            }),
            beeldPositie: fields.select({
              label: 'Waar het beeld staat',
              description: 'Op een telefoon staat het beeld altijd boven de tekst.',
              options: [
                { label: 'Links van de tekst', value: 'links' },
                { label: 'Rechts van de tekst', value: 'rechts' },
              ],
              defaultValue: 'links',
            }),
          },
          { label: 'Beeld naast tekst' },
        ),
      },

      'drie-kolommen': {
        label: 'Kaarten naast elkaar',
        itemLabel: (props) => `Kaarten — ${props.fields.items.elements.length} stuks`,
        schema: fields.object(
          {
            weergave,
            bovenkop: bovenkopVeld(),
            kop: fields.text({
              label: 'Kop — mag je overslaan',
              description: 'De kop boven de kaarten.' + HAAL_UITLEG,
            }),
            items: fields.array(
              fields.object({
                nummer: fields.text({
                  label: 'Nummer — mag je overslaan',
                  description: 'Een volgnummer boven de kop, bijvoorbeeld 01.',
                }),
                kop: fields.text({
                  label: 'Kop',
                  description: 'Waar deze kaart over gaat. Kort houden; ze staan naast elkaar.',
                  validation: VERPLICHTE_KOP,
                }),
                taal: fields.select({
                  label: 'Taal van de kop',
                  description:
                    'Staat de kop in het Engels, kies dan Engels. Een schermlezer leest hem dan met een Engelse stem voor in plaats van een Nederlandse.',
                  options: [
                    { label: 'Nederlands', value: 'nl' },
                    { label: 'Engels', value: 'en' },
                  ],
                  defaultValue: 'nl',
                }),
                tekst: tekstVeld('De tekst op de kaart.'),
                beeld: optioneelBeeldVeld(
                  map,
                  'Foto boven de kaart',
                  'De foto staat boven de tekst, altijd staand op 4:5. De kaarten naast elkaar houden zo dezelfde vorm.',
                ),
                href: fields.text({
                  label: 'Waar de kaart heen gaat — mag je overslaan',
                  description: 'Vul je dit in, dan wordt de hele kaart klikbaar. Een pad op deze site, zoals /contact, of een adres dat met https:// begint.',
                  validation: { pattern: LINK },
                }),
              }),
              {
                label: 'Kaarten',
                description: 'Drie is het uitgangspunt, maar het raster groeit mee met wat je erin zet.',
                itemLabel: (props) => props.fields.kop.value || 'Kaart zonder kop',
              },
            ),
            handschrift: fields.text({
              label: 'Handgeschreven regel eronder — mag je overslaan',
              description:
                'Eén regel in het handschrift, onder de kaarten. Vul hier alleen iets in wat de kaarten hierboven al zeggen: de regel is versiering en wordt niet voorgelezen. Eén per pagina, niet één per sectie.',
            }),
          },
          { label: 'Kaarten naast elkaar' },
        ),
      },

      citaten: {
        label: 'Citaten',
        itemLabel: (props) => `Citaten — ${props.fields.items.elements.length} stuks`,
        schema: fields.object(
          {
            weergave,
            bovenkop: bovenkopVeld(),
            items: fields.array(
              fields.object({
                citaat: fields.text({
                  label: 'Het citaat',
                  description: 'Neem het over zoals het gezegd is. Niet mooier maken.',
                  multiline: true,
                  validation: { length: { min: 1 } },
                }),
                naam: fields.text({
                  label: 'Van wie — mag je overslaan',
                  description: 'De naam van het bedrijf. Geen persoonsnamen.',
                }),
                rol: fields.text({
                  label: 'Wat ze doen — mag je overslaan',
                  description: 'Bijvoorbeeld: festivalorganisatie.',
                }),
              }),
              {
                label: 'Citaten',
                itemLabel: (props) => props.fields.naam.value || 'Citaat zonder naam',
              },
            ),
          },
          { label: 'Citaten' },
        ),
      },

      oproep: {
        label: 'Oproep',
        itemLabel: (props) => `Oproep — ${props.fields.kop.value || 'zonder kop'}`,
        schema: fields.object(
          {
            weergave,
            bovenkop: bovenkopVeld(),
            kop: fields.text({
              label: 'Kop',
              description: 'De kop van het afsluitende blok. Hij staat groot op de pagina.' + HAAL_UITLEG,
              validation: VERPLICHTE_KOP,
            }),
            tekst: tekstVeld('Eén zin die zegt wat je van de bezoeker wilt.'),
            knop: knopVeld('Knop — mag je overslaan', 'De actie waar het om gaat.'),
            tweedeKnop: knopVeld(
              'Tweede knop — mag je overslaan',
              'Een tweede actie, minder opvallend dan de eerste.',
            ),
            pijl: fields.checkbox({
              label: 'Handgetekende pijl naar de eerste knop',
              description:
                'Een met de hand getekend pijltje dat naar de knop wijst. Er staat er maximaal één op een pagina: vink je hem bij twee oproepen aan, dan krijgt de bovenste hem.',
              defaultValue: false,
            }),
          },
          { label: 'Oproep' },
        ),
      },

      formulier: {
        label: 'Formulier',
        itemLabel: (props) =>
          `Formulier (${props.fields.variant.value === 'inhuren' ? 'inhuren' : 'aanmelden'}) — ${props.fields.kop.value || 'zonder kop'}`,
        schema: fields.object(
          {
            weergave,
            variant: fields.select({
              label: 'Waarvoor is dit formulier?',
              description:
                'Aanmelden vraagt naar horeca-ervaring en waar je enthousiast van wordt. Inhuren vraagt naar de zaak of het bedrijf. De rest van de velden is hetzelfde.',
              options: [
                { label: 'Aanmelden bij de club', value: 'aanmelden' },
                { label: 'Personeel inhuren', value: 'inhuren' },
              ],
              defaultValue: 'aanmelden',
            }),
            bovenkop: bovenkopVeld(),
            kop: fields.text({
              label: 'Kop',
              description:
                'De kop boven het formulier.' + HAAL_UITLEG,
              validation: VERPLICHTE_KOP,
            }),
            tekst: tekstVeld('Eén of twee zinnen boven het formulier, bijvoorbeeld wat je terugkrijgt.'),
          },
          {
            label: 'Formulier',
            description:
              'Aanmelden bij de club, of personeel aanvragen. De velden liggen vast omdat de privacyverklaring ze met zoveel woorden noemt: naam, e-mailadres, telefoonnummer en bericht, plus horeca-ervaring en waar je enthousiast van wordt bij aanmelden, en de zaak bij inhuren. Wil je er een veld bij of af, vraag het de bouwer — de privacyverklaring gaat dan mee.',
          },
        ),
      },

      'rijke-tekst': {
        label: 'Lopende tekst',
        itemLabel: (props) => `Lopende tekst — ${props.fields.kop.value || 'zonder kop'}`,
        schema: fields.object(
          {
            weergave,
            kop: fields.text({
              label: 'Kop — mag je overslaan',
              description:
                'Laat je dit leeg, dan worden de koppen in de tekst zelf het bovenste niveau.' + HAAL_UITLEG,
            }),
            /*
             * Alles staat hier expliciet, ook wat uit staat. Keystatic vult
             * ontbrekende opties zelf in, en dan sluipt er stilletjes een
             * doorhaling of een tabel in de werkbalk.
             *
             * Geen H1: die hoort bij de openingssectie en er is er één per
             * pagina. Geen kleuren — die bestaan hier niet als optie, en het merk
             * heeft geen accentkleur om uit te kiezen.
             */
            inhoud: fields.markdoc.inline({
              label: 'Tekst',
              description:
                'Koppen, vet, cursief, links en lijsten. Meer is er niet, en meer is er ook niet nodig.',
              options: {
                heading: [2, 3],
                bold: true,
                italic: true,
                link: true,
                orderedList: true,
                unorderedList: true,
                strikethrough: false,
                code: false,
                codeBlock: false,
                blockquote: false,
                table: false,
                image: false,
                divider: false,
              },
            }),
            schichtLijst: fields.checkbox({
              label: 'Bliksemschicht als opsommingsteken',
              description:
                'Alleen voor lijsten die over de honderd of over de selectie gaan. Een lijst met artikelen krijgt hem niet.',
              defaultValue: false,
            }),
          },
          { label: 'Lopende tekst' },
        ),
      },

      accordeon: {
        label: 'Vragen en antwoorden',
        itemLabel: (props) =>
          `Vragen — ${props.fields.items.elements.length} stuks`,
        schema: fields.object(
          {
            weergave,
            bovenkop: bovenkopVeld(),
            kop: fields.text({
              label: 'Kop — mag je overslaan',
              description: 'De kop boven de vragen.' + HAAL_UITLEG,
            }),
            items: fields.array(
              fields.object({
                vraag: fields.text({
                  label: 'De vraag',
                  description:
                    'Schrijf hem zoals iemand hem zelf zou stellen, dus "Wat kost het?" en niet "Tarieven".',
                  validation: { length: { min: 1 } },
                }),
                /*
                 * Dezelfde kale set als de lopende tekst, en met opzet dezelfde:
                 * een antwoord is lopende tekst die toevallig ingeklapt staat.
                 * Koppen staan hier wél aan omdat een lang antwoord ze kan
                 * gebruiken; ze zakken onder de vraag mee.
                 */
                antwoord: fields.markdoc.inline({
                  label: 'Het antwoord',
                  description:
                    'Koppen, vet, cursief, links en lijsten. Houd het bij wat de vraag echt beantwoordt.',
                  options: {
                    heading: [2, 3],
                    bold: true,
                    italic: true,
                    link: true,
                    orderedList: true,
                    unorderedList: true,
                    strikethrough: false,
                    code: false,
                    codeBlock: false,
                    blockquote: false,
                    table: false,
                    image: false,
                    divider: false,
                  },
                }),
              }),
              {
                label: 'Vragen',
                description:
                  'Ze staan op de pagina in deze volgorde. Zet de vraag die het vaakst gesteld wordt bovenaan.',
                itemLabel: (props) => props.fields.vraag.value || 'Vraag zonder tekst',
              },
            ),
          },
          {
            label: 'Vragen en antwoorden',
            description:
              'Elk antwoord klapt open als de bezoeker op de vraag klikt. Zonder JavaScript staan ze gewoon allemaal open.',
          },
        ),
      },
    },
    {
      label: 'Secties',
      description:
        'De pagina van boven naar beneden. Sleep om de volgorde te veranderen; wat hier bovenaan staat, staat op de pagina bovenaan.',
    },
  );
}

/* ---------------------------------------------------------------------------
   De zes pagina's

   Eén singleton per pagina, want er is er precies één van elk. Geen collectie:
   de redacteur hoort geen zevende pagina te kunnen aanmaken die nergens in de
   navigatie staat.
   --------------------------------------------------------------------------- */

function pagina(label: string, map: string) {
  return singleton({
    label,
    path: `src/content/paginas/${map}`,
    format: { data: 'yaml' },
    schema: {
      titel: fields.text({
        label: 'Titel van de pagina',
        description:
          'Wat er in het tabblad van de browser staat en wat zoekmachines tonen. Noem waar het om gaat, en zet de naam van de club erachter.',
        validation: { length: { min: 1 } },
      }),
      beschrijving: fields.text({
        label: 'Omschrijving voor zoekmachines',
        description:
          'Eén of twee zinnen, tussen de 50 en 160 tekens. Dit staat onder de titel in Google. Zeg wat de bezoeker op deze pagina kan doen.',
        multiline: true,
        validation: { length: { min: 1 } },
      }),
      secties: sectieBlokken(map),
    },
  });
}

/* ---------------------------------------------------------------------------
   Site-instellingen

   Alles wat op élke pagina staat: de kop- en voetregel, en de gegevens waarmee
   je bereikbaar bent. Dit is het eerste wat de klant bij de overdracht zelf
   invult, dus de labels leggen uit wat er op de site gebeurt en gaan er niet
   van uit dat je weet hoe het gebouwd is.
   --------------------------------------------------------------------------- */

const instellingen = singleton({
  label: 'Site-instellingen',
  path: 'src/content/instellingen',
  format: { data: 'yaml' },
  schema: {
    naam: fields.text({
      label: 'Naam van de site',
      description:
        'Staat in het tabblad van de browser en boven het zoekresultaat in Google. Meestal gewoon de bedrijfsnaam.',
      validation: { length: { min: 1 } },
    }),
    beschrijving: fields.text({
      label: 'Waar de site over gaat',
      description:
        'Eén of twee zinnen. Dit is de tekst die Google onder de naam laat zien, en die verschijnt als iemand een link naar de site deelt. Pagina\'s met een eigen omschrijving gebruiken die van zichzelf.',
      multiline: true,
      validation: { length: { min: 1 } },
    }),

    contact: fields.object(
      {
        email: fields.text({
          label: 'E-mailadres',
          description:
            'Dit adres staat onderaan elke pagina, en bezoekers kunnen erop klikken om een mail te beginnen. Waar het formulier zijn berichten heen stuurt, ligt vast in de code: wijzig je hier het adres, vraag de bouwer dan om dat mee te nemen.',
          validation: { length: { min: 1 } },
        }),
        telefoon: fields.text({
          label: 'Telefoonnummer — mag je overslaan',
          description:
            'Laat je dit leeg, dan noemt de site nergens een nummer. Er blijft dan geen lege regel of streepje achter.',
        }),
        adres: fields.text({
          label: 'Adres — mag je overslaan',
          description: 'Straat, postcode en plaats. Komt onderaan elke pagina te staan.',
          multiline: true,
        }),
        kvk: fields.text({
          label: 'KvK-nummer — mag je overslaan',
          description: 'Alleen het nummer. De site zet er zelf "KvK" voor.',
        }),
        btw: fields.text({
          label: 'Btw-nummer — mag je overslaan',
          description: 'Alleen het nummer. De site zet er zelf "Btw" voor.',
        }),
        instagram: fields.text({
          label: 'Instagram — mag je overslaan',
          description:
            'De gebruikersnaam, met of zonder apenstaartje. De site maakt er zelf een link van.',
        }),
      },
      {
        label: 'Contactgegevens',
        description:
          'Wat je hier invult, verschijnt onderaan elke pagina. Wat je leeg laat, blijft weg — er komt geen lege plek voor in de plaats.',
      },
    ),

    navigatie: fields.array(
      fields.object({
        label: fields.text({
          label: 'Wat er in het menu staat',
          description: 'Houd het bij één of twee woorden; het menu staat op één regel.',
          validation: { length: { min: 1 } },
        }),
        href: fields.text({
          label: 'Naar welke pagina',
          description: 'Bijvoorbeeld /contact. Begin altijd met een schuine streep.',
          validation: { length: { min: 1 }, pattern: LINK },
        }),
      }),
      {
        label: 'Menu bovenaan',
        description:
          'De links in de balk bovenaan elke pagina, in deze volgorde. Op een telefoon klappen ze samen tot een menuknop. Vier of vijf is comfortabel; daarboven wordt de balk vol.',
        itemLabel: (props) => props.fields.label.value || 'Zonder naam',
      },
    ),

    voettekst: fields.array(
      fields.object({
        kop: fields.text({
          label: 'Kopje boven de kolom',
          description: 'Eén woord werkt het best, bijvoorbeeld Site of Zakelijk.',
          validation: VERPLICHTE_KOP,
        }),
        items: fields.array(
          fields.object({
            label: fields.text({
              label: 'Wat er staat',
              description: 'De tekst van de link, bijvoorbeeld Voorwaarden.',
              validation: { length: { min: 1 } },
            }),
            href: fields.text({
              label: 'Naar welke pagina',
              description: 'Bijvoorbeeld /voorwaarden.',
              validation: { length: { min: 1 }, pattern: LINK },
            }),
          }),
          {
            label: 'Links in deze kolom',
            itemLabel: (props) => props.fields.label.value || 'Zonder naam',
          },
        ),
      }),
      {
        label: 'Kolommen onderaan',
        description:
          'Onderaan elke pagina staan het logo en je contactgegevens, met daarnaast deze kolommen met links. Twee kolommen passen het prettigst naast elkaar.',
        itemLabel: (props) => props.fields.kop.value || 'Kolom zonder kopje',
      },
    ),
  },
});

export default config({
  // De omhulling van de admin — knoppen als Add, de lege staat, Unsaved — komt
  // uit Keystatic zelf en staat standaard op Engels. nl-NL zet die op
  // Nederlands, zodat het niet half om half wordt met onze eigen labels.
  locale: 'nl-NL',
  storage: opslag,
  ui: {
    brand: { name: 'De Club van 100' },
    navigation: {
      "Pagina's": ['home', 'opdrachtgevers', 'de100', 'contact', 'voorwaarden', 'privacy'],
      'Hele site': ['instellingen'],
    },
  },
  collections: {},
  singletons: {
    instellingen,
    home: pagina('Home', 'home'),
    opdrachtgevers: pagina('Opdrachtgevers', 'opdrachtgevers'),
    de100: pagina('De 100', 'de-100'),
    contact: pagina('Contact', 'contact'),
    voorwaarden: pagina('Voorwaarden', 'voorwaarden'),
    privacy: pagina('Privacyverklaring', 'privacy'),
  },
});
