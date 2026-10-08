/*
 * Tokennaam naar Tailwind-klasse — De Club van 100.
 *
 * Dit is het koppelbestand: hier ligt vast welke tokennamen er bestaan en welke
 * klasse daarbij hoort. De waardes achter die klassen staan in
 * src/styles/tokens.css.
 *
 * Bewust geen rauwe waardes hier, alleen klassenamen. Een kleur of maat die
 * hier letterlijk zou staan, omzeilt de tokenlaag; scripts/check-tokens.mjs
 * laat de build daar dan ook op vallen.
 *
 * Elke groep heeft een union-type. Een tokennaam die hier niet in staat, geeft
 * een compileerfout in plaats van een stille lege klasse.
 */

/*
 * De tokennamen staan als array, niet als losse union. Dat is met opzet: het
 * CMS bouwt zijn keuzelijsten uit deze arrays, en een union bestaat alleen
 * tijdens het compileren. Zo is er één plek waar een tokennaam vandaan komt.
 *
 * Een naam toevoegen werkt in één richting: zet hem in de array, en TypeScript
 * eist meteen de bijbehorende klasse in de Record hieronder. Vergeet je die,
 * dan valt de build om. Staat de klasse er, dan verschijnt het token vanzelf in
 * de keuzelijst van de redacteur — daar is verder niets voor te doen.
 */

/**
 * De achtergronden uit het contrasthoofdstuk, en niet meer. Drie donkere en
 * twee lichte. Meer dan één lichte en één donkere achtergrond op dezelfde
 * pagina is volgens het design system een fout — de donkere familie telt er
 * sinds de restyle drie, maar een pagina kiest er nog steeds één.
 *
 * `bruin` staat vooraan omdat het de dominante achtergrond is; `inkt` is sinds
 * de restyle het zwarte vlak óp bruin en niet meer de standaard.
 */
export const ACHTERGROND_TOKENS = ['bruin', 'inkt', 'roet', 'papier', 'mist'] as const;
export type AchtergrondToken = (typeof ACHTERGROND_TOKENS)[number];

/**
 * De kleur van een gevulde knop, als kleurcode voor de doelgroep.
 *
 * `vuur` hoort bij inhuren en dus bij opdrachtgevers, `inkt` bij aanmelden en
 * dus bij de Clubleden. Dat is de code uit de mockup: niet twee tinten voor de
 * variatie, maar één kleur per publiek, zodat een bezoeker aan de knop ziet of
 * die voor hem bedoeld is.
 *
 * Alleen deze twee. `vol`, `lijn` en `kaal` bestaan wel als knopvariant maar
 * horen niet in deze lijst: dat zijn rangordes en geen doelgroepen, en die
 * keuze hoort niet bij de redacteur.
 *
 * Dat elke naam hier ook een bestaande knopvariant ís, wordt afgedwongen waar
 * de twee elkaar raken — `Oproep` geeft dit token rechtstreeks aan `Knop` door,
 * dus een naam die daar niet bestaat is een compileerfout. Geen extra
 * machinerie nodig.
 */

/** Het sectieritme: de verticale lucht boven en onder een sectie. */
export const RUIMTE_TOKENS = ['sectie-s', 'sectie-m', 'sectie-l'] as const;
export type RuimteToken = (typeof RUIMTE_TOKENS)[number];

/** Hoe ver de inhoud binnen een sectie mag uitlopen. */
export const BREEDTE_TOKENS = ['smal', 'basis', 'breed'] as const;
export type BreedteToken = (typeof BREEDTE_TOKENS)[number];

/**
 * De drie beeldverhoudingen uit de beeldrichtlijn, en niet meer. 16:9 voor
 * breed, 4:5 voor een portret in een kolom, 1:1 voor een raster.
 *
 * Stond eerst alleen in Beeldvlak. Hij hoort hier, want het is precies wat dit
 * bestand doet: een tokennaam naar een klasse. Elk component dat een foto in
 * een vlak zet, leest dezelfde drie.
 */
export const VERHOUDING_TOKENS = ['breed', 'portret', 'vierkant'] as const;
export type VerhoudingToken = (typeof VERHOUDING_TOKENS)[number];

/**
 * Achtergrond levert vlak- én tekstkleur. Die twee horen bij elkaar: op bruin,
 * inkt en roet haalt `krijt` 17,96:1, 19,68:1 en 15,93:1, op papier en mist
 * haalt `inkt` 18,83:1 en 15,45:1. Losgekoppeld is de kans op een verboden
 * combinatie te groot.
 *
 * Let op: dit levert alleen de klassen. Een sectie op `papier` of `mist` hoort
 * daarnaast `data-thema="licht"` te dragen, zodat de semantische aliassen
 * (`--tekst-zacht`, `--lijn`, `--focus-ring`) meekantelen voor alles wat
 * erbinnen staat.
 */
export const achtergrondKlasse: Record<AchtergrondToken, string> = {
  bruin: 'bg-bruin text-krijt',
  inkt: 'bg-inkt text-krijt',
  roet: 'bg-roet text-krijt',
  papier: 'bg-papier text-inkt',
  mist: 'bg-mist text-inkt',
};

/** Welke achtergronden licht zijn. Bepaalt of `data-thema="licht"` meegaat. */
export const isLichteAchtergrond: Record<AchtergrondToken, boolean> = {
  bruin: false,
  inkt: false,
  roet: false,
  papier: true,
  mist: true,
};

/**
 * Leesbreedte van lopende tekst. Het design system houdt die op zwart korter —
 * 60ch tegen 66ch — omdat licht op donker optisch zwaarder leest.
 */
export const maatRegelKlasse: Record<AchtergrondToken, string> = {
  bruin: 'max-w-[var(--maat-regel-donker)]',
  inkt: 'max-w-[var(--maat-regel-donker)]',
  roet: 'max-w-[var(--maat-regel-donker)]',
  papier: 'max-w-[var(--maat-regel)]',
  mist: 'max-w-[var(--maat-regel)]',
};

/**
 * Beeldverhouding naar Tailwind-klasse. Het vlak legt de verhouding vast en de
 * foto vult hem met `object-cover`, zodat een aangeleverd beeld van elke maat
 * er zonder vervorming in valt.
 */
export const verhoudingKlasse: Record<VerhoudingToken, string> = {
  breed: 'aspect-video',
  portret: 'aspect-4/5',
  vierkant: 'aspect-square',
};

/** Verticale ruimte van een sectie: padding boven en onder, vloeiend. */
export const ruimteKlasse: Record<RuimteToken, string> = {
  'sectie-s': 'py-sectie-s',
  'sectie-m': 'py-sectie-m',
  'sectie-l': 'py-sectie-l',
};

/**
 * Containerbreedte, inclusief de horizontale marge. Samen is dit de
 * `.container` uit het design system: gecentreerd, met `--marge` links en
 * rechts.
 */
export const breedteKlasse: Record<BreedteToken, string> = {
  smal: 'mx-auto px-marge max-w-smal',
  basis: 'mx-auto px-marge max-w-basis',
  breed: 'mx-auto px-marge max-w-breed',
};
