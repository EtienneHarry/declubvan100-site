import type { ReactNode } from 'react';

export interface OvaalProps {
  /** De woordgroep waar de ovaal omheen komt. Kort houden: één of twee woorden. */
  children: ReactNode;
}

/*
 * De ovaal: een met de hand getrokken ellips om een woordgroep heen.
 *
 * Het tweede grafische motief uit de mockup, naast de bliksemschicht — "1 van
 * de 100", "hele agenda". Hij hoort bij dezelfde familie: één beweging, geen
 * constructie. De haal is niet symmetrisch, kruist zichzelf over de bovenkant
 * en eindigt met een staart voorbij het beginpunt — dat is precies wat hem
 * handgetekend maakt, dus rond hem niet af.
 *
 * MAXIMAAL ÉÉN PER SECTIE. Dat is dezelfde soort regel als bij de schicht en
 * hij is net zomin af te dwingen in code: twee ovalen in één blikveld maken er
 * een stijlmiddel van in plaats van een aanwijzing. Zet er een tweede neer en
 * hij wijst nergens meer naar.
 *
 * VIER DINGEN DIE HIER MET OPZET STAAN ZOALS ZE STAAN:
 *
 * 1. DE LIJN LIGT ACHTER DE TEKST. De svg staat op z-index 0 en de tekst-span
 *    op position relative met z-index 1: de letters blijven overal scherp, en
 *    waar de haal een letter raakt wordt de líjn onderbroken en niet de
 *    letter. Dat maakt een toevallige aanraking onschuldig in plaats van
 *    onleesbaar.
 *
 * 2. DE RUIMTE OM DE TEKST IS BEWUST GROOT. De svg steekt 19% links uit, 56%
 *    boven, en is 138% breed en 212% hoog: hoe verder de lijn van de letters
 *    staat, hoe kleiner de kans dat hij een stok of schreef van de
 *    typemachineletter raakt. Breedte én hoogte staan er allebei
 *    uitgeschreven, want een svg is een vervangen element met een eigen
 *    verhouding en die wint van een insetpaar zodra de andere maat op auto
 *    staat — gemeten in B8: met alleen insets werd het vlak om een kop van
 *    467×73 pixels 531×319. En max-w-none, want de reset in tokens.css zet
 *    max-width: 100% op elke svg en deze is met opzet breder dan zijn ouder.
 *
 * 3. `preserveAspectRatio="none"` plus `vector-effect="non-scaling-stroke"`.
 *    De ovaal moet zich om een woordgroep van elke lengte spannen, dus hij
 *    rekt in de breedte mee. Zonder het tweede attribuut rekt de lijn dan mee:
 *    dikke zijkanten, dunne boven- en onderkant. Met non-scaling-stroke blijft
 *    de dikte overal gelijk en is alleen de vórm uitgerekt — wat een hand doet
 *    die een lang woord omcirkelt.
 *
 * 4. GEEN `pathLength` en geen vaste `stroke-dasharray`. Chrome negeert
 *    pathLength zodra non-scaling-stroke op het pad staat en rekent de dash in
 *    schérmruimte. HaalScript meet daarom de echte schermlengte en zet die als
 *    presentatie-attribuut; zie src/styles/haal.css.
 *
 * De pasvorm, de kleur, de dikte en het tekenen staan in src/styles/haal.css,
 * samen met de streep. Wat hier staat is het pad.
 */

/*
 * Eén doorlopende haal. Hij vertrekt links op halve hoogte, loopt met de klok
 * mee over de bovenkant naar rechts, komt langs de onderkant terug, en trekt
 * dan door: over zijn eigen beginpunt heen, de bovenrand nog een keer
 * kruisend, tot de staart halverwege de bovenkant eindigt. De kruising en de
 * staart zijn de handtekening van de hand — een nette ellips is een figuur,
 * dit is een gebaar.
 */
const PAD =
  'M52,46 C56,22 132,9 208,12 C292,15 356,29 359,52 C362,73 297,90 206,92 ' +
  'C114,94 41,79 40,57 C39,42 63,30 98,23 C134,16 168,14 199,15';

export default function Ovaal({ children }: OvaalProps) {
  return (
    <span data-haal="ovaal" data-onthul="haal" className="relative inline-block">
      {/*
        De tekst blijft inline én komt met z-index 1 boven de lijn te liggen.
        Inline, want dat is wat HaalScript meet: een inline element breekt in
        twee rechthoeken zodra het over twee regels loopt, en dan hoort de
        ovaal er niet te staan. Boven de lijn, zodat de letters scherp blijven
        waar de haal ze raakt.
      */}
      <span data-haal-tekst="" className="relative z-[1]">
        {children}
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 400 110"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -top-[56%] -left-[19%] z-0 h-[212%] w-[138%] max-w-none"
      >
        <path
          data-haal-lijn=""
          d={PAD}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
