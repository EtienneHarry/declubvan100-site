import type { ReactNode } from 'react';

export interface StreepProps {
  /** De woordgroep waar de streep onder komt. Meestal het slot van een kop. */
  children: ReactNode;
}

/*
 * Het onderstreepje: een losse haal onder een kop.
 *
 * Het derde grafische motief uit de mockup — "NODIG HEBT.", "BETER IS." — en de
 * kleine broer van de ovaal. Zelfde familie, zelfde tekenlogica, zelfde curve,
 * alleen korter: 350ms tegen 450.
 *
 * ÉÉN PAD DAT HEEN EN TERUG GAAT, GEEN TWEE LOSSE LIJNEN. De pen loopt naar
 * rechts langs de onderkant en komt terug langs de bovenkant, dus de twee
 * uiteinden rechts komen vanzelf samen — zoals in de mockup. Twee losse lijnen
 * zouden rechts elk hun eigen kant op eindigen, en dan is het arcering in
 * plaats van een haal. Links blijft er lucht tussen begin en eind: daar zie je
 * dat de pen is opgetild.
 *
 * MAG VAKER DAN DE OVAAL, MAAR NOG STEEDS MAXIMAAL ÉÉN PER SECTIE. Een ovaal
 * wijst iets aan en verdient daarom schaarste over de hele pagina; een streep
 * bevestigt een slotzin en mag dus in meer secties staan. Twee in dezelfde
 * sectie is in allebei de gevallen te veel.
 *
 * DE STREEP HANGT ONDER DE REGEL EN LIGT ACHTER DE TEKST. De svg staat buiten
 * het regelvak (bottom -0.42em, gemeten in B8: daarbinnen loopt hij door de
 * staarten van een p en een g) én op z-index 0 met de tekst-span op 1 — mocht
 * een staart hem alsnog raken, dan wordt de líjn onderbroken en niet de
 * letter. Dezelfde twee verdedigingslinies als de ovaal.
 *
 * Alles wat hij met de ovaal deelt — de pasvorm, de kleur, de dikte, het
 * tekenen — staat in src/styles/haal.css. Wat hier staat is het pad en waar
 * het hangt. Zie Ovaal.tsx voor waarom preserveAspectRatio="none" en
 * vector-effect="non-scaling-stroke" er staan, waarom er juist géén pathLength
 * staat, en waarom breedte én hoogte allebei uitgeschreven zijn.
 */

/*
 * Heen langs de onderkant, om bij 390 rechts te keren, terug langs de
 * bovenkant. De heenweg klimt licht (28 naar 17), de terugweg zakt weer
 * (25 naar 32): de twee lijnen lopen niet evenwijdig en het tussenvlak is
 * links breder dan rechts — een haal, geen gelijkteken.
 */
const PAD = 'M10,28 C104,15 258,8 390,17 C300,25 138,30 26,32';

export default function Streep({ children }: StreepProps) {
  return (
    <span data-haal="streep" data-onthul="haal" className="relative inline-block">
      {/*
        Zelfde als bij de ovaal: de tekst blijft inline (dat is wat HaalScript
        meet — breekt hij over twee regels, dan hoort de streep er niet te
        staan) en ligt met z-index 1 boven de lijn.
      */}
      <span data-haal-tekst="" className="relative z-[1]">
        {children}
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-[0.42em] -left-[2%] z-0 h-[0.42em] w-[104%] max-w-none"
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
