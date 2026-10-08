/*
 * Het ritme van de scrollonthulling — De Club van 100.
 *
 * Eén sectie deelt zijn onderdelen in een ploeg in: bovenkop, kop, tekst, dan
 * de items. Elk aanwezig onderdeel schuift 70ms op. Ontbreekt de bovenkop, dan
 * begint de kop gewoon op nul en valt er geen gat aan het begin — vandaar een
 * teller en geen vaste nummers per onderdeel.
 *
 * Hier staat alleen het nummer. Wat dat nummer doet staat in
 * src/styles/beweging.css, en de waarde van een stap in src/styles/tokens.css.
 */

/**
 * De hoogste stap die een vertraging krijgt. Alles daarboven deelt de laatste.
 *
 * beweging.css heeft voor elke stap een eigen regel en klemt dus op hetzelfde
 * getal. Verander je het hier, verander het daar mee — anders krijgt stap 9
 * stilletjes geen vertraging meer.
 *
 * Acht is de bovengrens omdat het daarboven gaat tegenwerken: de negende kaart
 * van een raster zou meer dan een halve seconde stilstaan nadat hij in beeld is
 * gekomen, en dan wacht de bezoeker op de site in plaats van andersom.
 */
const MAX_STAP = 8;

/**
 * Een teller voor één sectie. Elke aanroep levert de volgende plek in de ploeg.
 *
 * Bedoeld om in de JSX zelf aan te roepen, in de volgorde waarin de onderdelen
 * in het ritme horen — die hoeft niet dezelfde te zijn als de volgorde in de
 * DOM. Bij `beeld-tekst` staat het beeld soms vooraan en telt
 * het toch als laatste mee, want het is daar het item.
 */
export function ploeg(): () => number {
  let volgende = 0;

  return () => Math.min(volgende++, MAX_STAP);
}
