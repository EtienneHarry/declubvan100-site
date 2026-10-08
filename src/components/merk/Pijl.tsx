import type { ReactNode } from 'react';

export interface PijlProps {
  /** De knop waar de pijl naar wijst. */
  children: ReactNode;
}

/*
 * De pijl: een korte haal met een punt, naast de belangrijkste knop.
 *
 * Het vierde motief van de haal-familie, na de ovaal en de streep. Zelfde
 * curve, zelfde kleur, zelfde aria-hidden. Wat hij toevoegt is een punt, en
 * daarmee een richting: de ovaal omcirkelt, de streep bevestigt, de pijl wijst.
 *
 * WAT ER MIS WAS. De eerste versie was één doorlopend pad dat na de punt
 * teruggíng en er weer doorheen zwiepte, als weerhaak. Nagemeten op de deploy:
 * het pad eindigde op (92,88) van een viewBox van 100 — dus voorbij de punt, 15
 * pixels ónder het midden van de knop en 11 pixels ervóór. De laatste dertig
 * procent van de lijn liep wég van de knop, onder 53 graden naar beneden. Wat
 * bedoeld was als weerhaak was in feite het eindstuk geworden, en dat leest als
 * een komma: een haak die naar beneden uitloopt in plaats van een punt die
 * ergens naar wijst.
 *
 * TWEE PADEN, EN DAT KAN NU. De oude versie moest één pen zijn omdat HaalScript
 * de schermlengte mat door het pad in zestig stukjes te bemonsteren: een moveto
 * is een sprong zonder lijn, maar tussen twee monsters telt hij als afstand, en
 * dan wordt de dash te lang. Met pathLength is er niets meer te meten — de
 * browser rekent de dash in eenheden van het attribuut, dus dasharray 1 is
 * precies het hele pad, hoe lang het werkelijk ook is. Elk pad kan zo zijn eigen
 * tekening krijgen: eerst de schacht, dan de punt.
 *
 * GEEN non-scaling-stroke, en dat is een keuze met een reden. De ovaal en de
 * streep rekken in de breedte mee met hun tekst, dus daar houdt hij de lijn
 * overal even dik. Deze svg is vierkant en vast; er valt niets te compenseren.
 * En het scheelt een twijfelgeval: er is gemeten dat Chromium 152 pathLength
 * ook naast non-scaling-stroke honoreert, maar de viewBox loopt hier één op één
 * met de pixelmaat, dus de vraag hoeft niet eens gesteld te worden.
 *
 * DE VIEWBOX IS 40 BIJ 40 EN DE SVG IS 40 BIJ 40 PIXELS. Eén eenheid is één
 * pixel. Daardoor is stroke-width in de CSS meteen de dikte op het scherm, en
 * staat de pijl even dik als de streep zonder omrekening.
 *
 * HIJ STAAT NAAST DE KNOP EN NIET EROVERHEEN. De ovaal en de streep liggen
 * absoluut gepositioneerd achter hun tekst; deze niet. De svg is een gewoon
 * flex-item vóór de knop, dus hij neemt zijn eigen ruimte in. Dat kost breedte
 * en levert twee dingen op die absoluut positioneren niet kan geven: hij kan
 * nooit buiten zijn sectie steken, en op een smal scherm breekt hij mee in
 * plaats van over de knop heen te schuiven.
 *
 * De knop zit in [data-haal-tekst] omdat HaalScript dat verlangt: zonder zo'n
 * kind zegt pastOpEenRegel() nee en zet haal.css de svg op display none.
 *
 * MAAR DIE PASVORMCONTROLE DOET HIER NIETS, EN DAT IS GOED. Voor de ovaal is
 * hij de vraag "breekt de tekst over twee regels", want een ellips om een
 * woordgroep die breekt is een uitgerekte ellips over twee regels heen. Voor
 * de pijl bestaat die fout niet: hij ligt niet óver de knop maar ernaast, dus
 * een label dat afbreekt maakt de knop hoger en de pijl blijft er gewoon naast
 * staan.
 *
 * Technisch komt het doordat [data-haal-tekst] om een inline-flex anker sluit,
 * en dat is een atomair element: getClientRects() levert er altijd precies één
 * op, ook als de tekst erbinnen over drie regels loopt.
 *
 * MAXIMAAL ÉÉN PER PAGINA, en dat wordt afgedwongen in SectieLijst en niet
 * hier afgesproken. Een pijl die twee dingen tegelijk aanwijst, wijst niets
 * aan. Zie SectionRenderer.tsx.
 *
 * De kleur staat in src/styles/haal.css: papier en niet vuur, want hij wijst
 * naar een knop die zelf vuur is.
 */

/*
 * De schacht. Van linksboven (4,8) in een doorhangende boog naar (38,20), het
 * verticale midden van de svg en daarmee van de knop ernaast.
 *
 * Het laatste stuurpunt ligt op (27,19), vlak boven het eindpunt op gelijke
 * hoogte: daardoor loopt de boog horizontaal uit. Dat is wat de punt nodig
 * heeft — die wijst in de richting waarin de schacht eindigt, en die richting
 * moet de knop zijn en niet de vloer.
 *
 * De boog hangt door omdat de stuurpunten onder de rechte lijn liggen: de haal
 * loopt eerst vlak en duikt pas laat omlaag. Dat is de beweging van een pols,
 * niet de schuine streep van een liniaal.
 */
const SCHACHT = 'M4,8 C15,6 27,19 38,20';

/*
 * De punt: een open V, van boven door de tip naar onder. Geen gesloten driehoek
 * en geen weerhaak die eromheen loopt — twee streken die elkaar raken, zoals je
 * een pijl met de hand zet.
 *
 * De poten staan 41 graden van de as af en zijn niet precies even lang (10,6 en
 * 9,2 eenheden). Die kleine asymmetrie is er met opzet: symmetrisch tot op de
 * eenheid leest als een pictogram, en dit motief hoort met de hand getrokken te
 * lijken.
 *
 * De tip valt samen met het eindpunt van de schacht. Dat is het verschil met de
 * oude versie, waar de lijn er nog dertig procent van zijn lengte voorbij liep.
 */
const PUNT = 'M30,13 L38,20 L31,26';

export default function Pijl({ children }: PijlProps) {
  return (
    <span data-haal="pijl" data-onthul="haal" className="inline-flex items-center gap-1">
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="pointer-events-none h-10 w-10 shrink-0"
      >
        {/*
          pathLength op allebei, zodat de dash in haal.css een eenheid heeft die
          niets met de werkelijke lengte te maken heeft: dasharray 1 is het hele
          pad. Zonder dat zou elk pad gemeten moeten worden, en zouden de
          schacht en de punt elk een eigen gemeten waarde nodig hebben.
        */}
        <path
          data-haal-lijn="schacht"
          d={SCHACHT}
          pathLength="1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          data-haal-lijn="punt"
          d={PUNT}
          pathLength="1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/*
        De knop blijft inline-flex, zodat [data-haal-tekst] precies om de knop
        sluit en getClientRects() er één oplevert zolang het label niet breekt.
      */}
      <span data-haal-tekst="" className="inline-flex">
        {children}
      </span>
    </span>
  );
}
