/*
 * De breekpunten als getal, gelezen uit de tokenlaag.
 *
 * Nodig voor het `sizes`-attribuut van een responsieve `<img>`. Dat is een
 * lijst mediaqueries, en daar kan geen `var(--breakpoint-md)` in: de browser
 * moet `sizes` al kunnen lezen voordat er css geladen is, want anders weet hij
 * niet welke variant hij moet ophalen.
 *
 * Een letterlijke `768px` in dit bestand mag niet — en dat is niet alleen de
 * regel, het is ook nuttig gebleken: `--breakpoint-sm` is hier 600px en niet de
 * 640 van Tailwind, en dat verschil had ik zonder de tokencontrole overgenomen.
 *
 * Dezelfde constructie als `theme-color` in `Basis.astro`: het bestand wordt
 * rauw geïmporteerd en er wordt uit gelezen, zodat een token dat verdwijnt of
 * hernoemd wordt de build hard laat afbreken in plaats van stil een verkeerde
 * maat op te leveren.
 */

import tokensCss from '../styles/tokens.css?raw';

export type Breekpunt = 'sm' | 'md' | 'nav' | 'lg' | 'xl' | '2xl';

function lees(naam: Breekpunt): number {
  /*
   * Geen regex. Een eerdere versie las dit met `new RegExp` en een
   * template-literal, en daar verdween onderweg een backslash: `\s` werd `s`,
   * het patroon matchte nooit meer en de build zou zijn afgebroken op een token
   * dat er gewoon stond. Regel voor regel lezen kan die fout niet maken.
   */
  const sleutel = `--breakpoint-${naam}:`;

  for (const regel of tokensCss.split('\n')) {
    const kaal = regel.trim();
    if (!kaal.startsWith(sleutel)) continue;

    const waarde = kaal.slice(sleutel.length).split(';')[0].trim();
    const getal = Number.parseInt(waarde, 10);
    if (waarde.endsWith('px') && Number.isFinite(getal)) return getal;
  }

  throw new Error(
    `Token --breakpoint-${naam} niet gevonden als px-waarde in src/styles/tokens.css; het sizes-attribuut kan niet worden afgeleid.`,
  );
}

export const BREEKPUNT: Record<Breekpunt, number> = {
  sm: lees('sm'),
  md: lees('md'),
  nav: lees('nav'),
  lg: lees('lg'),
  xl: lees('xl'),
  '2xl': lees('2xl'),
};

/**
 * Bouwt een `sizes`-attribuut uit paren van een breekpunt en de breedte die het
 * beeld daarboven inneemt, plus de breedte daaronder.
 *
 * De paren worden van breed naar smal gesorteerd, want `sizes` neemt de eerste
 * query die past. Staat `md` vóór `lg`, dan komt `lg` nooit aan de beurt.
 *
 * @example sizes([['lg', '33vw'], ['sm', '50vw']], '100vw')
 *          → '(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw'
 */
export function sizes(vanaf: [Breekpunt, string][], onder: string): string {
  const gesorteerd = [...vanaf].sort((a, b) => BREEKPUNT[b[0]] - BREEKPUNT[a[0]]);
  return [...gesorteerd.map(([punt, breedte]) => `(min-width: ${BREEKPUNT[punt]}px) ${breedte}`), onder].join(', ');
}
