/*
 * Responsieve varianten voor een foto die uit het CMS komt.
 *
 * Astro's beeldpijplijn kan hier niet bij: die werkt op imports die tijdens het
 * bouwen bekend moeten zijn, en een pad dat uit een yaml-bestand komt is dat
 * niet. Zonder iets zou iedereen het origineel krijgen — een telefoon van 375
 * punten haalt dan een bestand van 1333 bij 2000 op.
 *
 * `scripts/maak-beeldvarianten.mjs` maakt daarom vóór de build webp-varianten
 * naast elk origineel en schrijft `beeldvarianten.json`. Dit bestand leest dat
 * manifest en zet er een `srcset` uit samen. Zie het script voor waarom dit bij
 * het bouwen gebeurt en niet via de beeldoptimalisatie van Vercel.
 *
 * **De grootste kandidaat is een webp op de volle breedte van het origineel**,
 * sinds B16. Daarvoor stond het origineel zelf in de srcset, en dat koos elk
 * breed of retinascherm — voor de herofoto een JPEG van 476 kB. `src` blijft
 * het origineel, als terugval voor wie geen srcset kent.
 *
 * Een manifest van vóór B16 heeft die volle variant nog niet. Dan staat het
 * origineel er als grootste kandidaat in, zoals eerst; anders zou een breed
 * scherm het op 1024 moeten doen.
 */

import manifest from './beeldvarianten.json';

interface Variant {
  origineel: number;
  varianten: number[];
}

const VARIANTEN: Record<string, Variant> = manifest;

/**
 * Het pad van één variant. Moet letterlijk gelijk zijn aan variantPad() in
 * `scripts/maak-beeldvarianten.mjs`.
 *
 * De extensie blijft erin staan: `Burgers flippen.jpg` en
 * `Burgers flippen.jpeg` zijn twee foto's, en met de extensie eraf leveren ze
 * dezelfde variantnaam op.
 */
export function variantPad(bron: string, breedte: number): string {
  return `${bron}-${breedte}.webp`;
}

/**
 * De `srcset` voor een foto, of `undefined` als er geen varianten van zijn.
 *
 * Undefined is hier geen fout maar de normale uitkomst voor een foto die net
 * geüpload is en nog niet door het script langs is geweest. De `<img>` valt dan
 * terug op zijn gewone `src` en werkt gewoon — alleen zonder de kleinere
 * varianten.
 */
export function beeldSrcset(bron: string | undefined): string | undefined {
  const kaal = bron?.trim();
  if (!kaal) return undefined;

  const gegevens = VARIANTEN[kaal];
  if (!gegevens || gegevens.varianten.length === 0) return undefined;

  /*
   * De paden worden gecodeerd, en dat is geen netheid maar noodzaak. Een
   * `srcset` is een lijst gescheiden door komma's, en binnen een kandidaat
   * scheidt witruimte de URL van zijn breedte. Een bestandsnaam met een spatie
   * — `/beeld/home/Jor Sep achter.jpg` staat zo in de yaml — zou de browser
   * dus lezen als de URL `/beeld/home/Jor` met de breedte `Sep`.
   *
   * `encodeURI` laat de schuine strepen staan en maakt van een spatie `%20`.
   * Het `src`-attribuut blijft ongecodeerd: daar is de hele waarde de URL, dus
   * daar kan een spatie geen kwaad.
   */
  const kandidaten = gegevens.varianten.map((b) => `${encodeURI(variantPad(kaal, b))} ${b}w`);
  if (!gegevens.varianten.includes(gegevens.origineel)) {
    kandidaten.push(`${encodeURI(kaal)} ${gegevens.origineel}w`);
  }
  return kandidaten.join(', ');
}
