import { Fragment, type ReactNode } from 'react';

import Ovaal from '../merk/Ovaal';
import Streep from '../merk/Streep';
import Teller from './Teller';

export interface KoptekstProps {
  /** De kop zoals de redacteur hem heeft ingetypt, inclusief eventuele haakjes. */
  tekst: string;
  /**
   * Laat het eerste getal in de kop naar boven tellen. Alleen de openingssectie
   * doet dat; zie Teller.
   */
  teller?: boolean;
}

/*
 * De kop van een sectie, met de haal en de typemachine erin.
 *
 * DE CONVENTIE. De redacteur zet haakjes om het stuk dat anders moet:
 *
 *   [1 van de 100]   →  de ovaal eromheen
 *   {beter is.}      →  het onderstreepje eronder
 *   *maar niet …*    →  dat stuk in de typemachine
 *
 * De eerste twee zijn de uitkomst van de vraag die B8 sessie 1 openliet:
 * `Ovaal` en `Streep` bestonden wel, maar er was geen manier om ze vanuit het
 * CMS te plaatsen. Een sectiekop is daar één tekstveld, en een tweede veld
 * ernaast ("welk deel van de kop krijgt de ovaal") zou per sectietype terug
 * moeten komen en alleen werken zolang die woordgroep letterlijk in de kop
 * staat. Een markering ín de tekst blijft kloppen als de kop verandert, want
 * ze verhuist mee.
 *
 * De derde kwam er later bij, toen bleek dat de mockup twee letterrollen in
 * één kop zet: de eerste helft in de dragende letter, de tweede in de
 * typemachine, zoals in de mockup die de klant aanleverde.
 *
 * VIJF REGELS, EN ZE KOMEN ALLEMAAL OP HETZELFDE NEER: WAT NIET OMGEZET WORDT,
 * BLIJFT STAAN ZOALS JE HET TYPTE.
 *
 * 1. Een teken zonder sluiting is gewone tekst. `Kosten [vanaf 2026` levert
 *    precies die letters op, haakje incluis.
 * 2. Een leeg paar is gewone tekst. `[]` is geen ovaal om niets.
 * 3. Een tweede paar van dezelfde soort is gewone tekst. Het design system
 *    staat één ovaal en één streep per sectie toe, en een sectie heeft één kop;
 *    voor de typemachine is het "maximaal één uitgelichte regel per sectie".
 * 4. Wat er wél in mag, mag er allemaal in: één ovaal, één streep én één
 *    typemachinestuk in dezelfde kop is toegestaan.
 * 5. Een ovaal of een streep mag bínnen het typemachinestuk staan. Andersom
 *    niet: een typemachinestuk binnen een ovaal is geen vorm die de mockup
 *    kent, en een sterretje daarbinnen blijft dus een sterretje.
 *
 * Die derde regel is met opzet zichtbaar en niet stil. Een tweede ovaal die
 * gewoon verdwijnt, laat de redacteur denken dat het gelukt is; een tweede
 * ovaal die als `[woorden]` op de pagina staat, is meteen te zien en te
 * repareren. Het is bovendien dezelfde uitkomst als bij een vergeten sluiting,
 * dus er is maar één regel te onthouden.
 *
 * WAAR HIJ WEL EN NIET STAAT. Alleen op de kop van een sectie — hero, kop-tekst,
 * beeld-tekst, drie-kolommen, oproep, rijke-tekst en accordeon. Niet op de
 * koppen van de twee deuren in een splitscreen en niet op een kaartkop: die
 * komen per sectie meerdere keren voor, en dan zouden er twee ovalen in één
 * blikveld kunnen staan. De regel "maximaal één per sectie" volgt zo uit waar
 * dit component staat, en hoeft nergens geteld te worden.
 *
 * DE TELLER LOOPT ALLEEN OVER GEWONE TEKST OP HET BOVENSTE NIVEAU. Een getal
 * binnen een haal of binnen de typemachine telt niet mee — die woordgroep is
 * aangewezen, niet opgeteld, en twee effecten op dezelfde vier tekens vechten
 * om de aandacht. In de praktijk is dat geen beperking: de tellende kop is "De
 * Club van 100" en die heeft geen markering.
 */

type Vorm = 'ovaal' | 'streep' | 'machine';

/**
 * Het teken per rol.
 *
 * Vierkante haken zijn de ovaal — ze staan óm iets heen, net als de ovaal zelf.
 * Accolades zijn de streep. Sterretjes zijn de typemachine, want dat is het
 * teken dat overal nadruk betekent en de typemachine ís de nadruk in een kop.
 *
 * Alle drie komen ze in gewone Nederlandse koppen zo goed als nooit voor, en
 * dat is de reden dat het deze zijn en niet bijvoorbeeld ronde haakjes.
 *
 * Let op bij het handmatig bewerken van yaml: een waarde die met `*` begint is
 * daar een alias-verwijzing en moet dus tussen aanhalingstekens. Keystatic zet
 * die er zelf om; wie het bestand met de hand openmaakt, moet eraan denken.
 */
const TEKENPAREN: Record<string, { sluit: string; vorm: Vorm }> = {
  '[': { sluit: ']', vorm: 'ovaal' },
  '{': { sluit: '}', vorm: 'streep' },
  '*': { sluit: '*', vorm: 'machine' },
};

type Deel =
  | { vorm: 'tekst'; tekst: string }
  | { vorm: 'ovaal' | 'streep'; tekst: string }
  | { vorm: 'machine'; delen: Deel[] };

/**
 * Knipt de kop in stukken. Losse functie zodat de regels hierboven op één plek
 * staan en niet verspreid over de JSX.
 *
 * Loopt één keer van links naar rechts. Bij een openingsteken wordt gekeken of
 * er verderop een sluitteken staat; zo niet, of is die rol al gebruikt, dan is
 * het teken gewoon een teken en gaat de lus verder.
 *
 * `gebruikt` gaat mee naar binnen bij een typemachinestuk. Zo geldt "één van
 * elk" over de hele kop en niet per niveau: een ovaal buiten het sterretje en
 * nog een erbinnen zijn er samen twee.
 */
export function knipKop(tekst: string, gebruikt = new Set<Vorm>()): Deel[] {
  const delen: Deel[] = [];
  let buffer = '';
  let i = 0;

  const legBufferWeg = () => {
    if (buffer) delen.push({ vorm: 'tekst', tekst: buffer });
    buffer = '';
  };

  while (i < tekst.length) {
    const teken = tekst[i] as string;
    const paar = TEKENPAREN[teken];

    if (paar && !gebruikt.has(paar.vorm)) {
      const eind = tekst.indexOf(paar.sluit, i + 1);
      const inhoud = eind === -1 ? '' : tekst.slice(i + 1, eind);

      if (eind !== -1 && inhoud.trim()) {
        legBufferWeg();
        gebruikt.add(paar.vorm);

        if (paar.vorm === 'machine') {
          // Het typemachinestuk is het enige dat iets in zich kan hebben. De
          // ovaal en de streep zijn eindpunten: daar staat tekst in en verder
          // niets.
          delen.push({ vorm: 'machine', delen: knipKop(inhoud, gebruikt) });
        } else {
          delen.push({ vorm: paar.vorm, tekst: inhoud });
        }

        i = eind + 1;
        continue;
      }
    }

    buffer += teken;
    i += 1;
  }

  legBufferWeg();

  return delen;
}

/**
 * Zet de stukken om in elementen.
 *
 * De teller hangt aan een doorgeefdoosje en niet aan een teller in deze
 * functie: hij mag maar één keer vallen, en de functie roept zichzelf aan voor
 * wat er in een typemachinestuk staat.
 */
function toon(delen: Deel[], teller: { aan: boolean; gezet: boolean }): ReactNode {
  return delen.map((deel, index): ReactNode => {
    const sleutel = `${deel.vorm}-${index}`;

    if (deel.vorm === 'ovaal') return <Ovaal key={sleutel}>{deel.tekst}</Ovaal>;
    if (deel.vorm === 'streep') return <Streep key={sleutel}>{deel.tekst}</Streep>;

    if (deel.vorm === 'machine') {
      /*
       * Hoofdletters via `uppercase` en niet via de tekst zelf. Dat is
       * text-transform, dus de letters in de HTML blijven staan zoals de
       * redacteur ze typte: een schermlezer leest een gewone zin voor, de
       * ovaal binnenin meet zijn eigen regelbreedte over de echte tekst, en
       * wie de kop later wil aanpassen ziet geen blokletters in het CMS.
       */
      return (
        <span key={sleutel} className="font-machine tracking-machine uppercase">
          {toon(deel.delen, teller)}
        </span>
      );
    }

    if (teller.aan && !teller.gezet && /\d/.test(deel.tekst)) {
      teller.gezet = true;
      return <Teller key={sleutel} tekst={deel.tekst} />;
    }

    return <Fragment key={sleutel}>{deel.tekst}</Fragment>;
  });
}

export default function Koptekst({ tekst, teller = false }: KoptekstProps) {
  const delen = knipKop(tekst);

  /*
   * Geen enkele markering en geen teller: dan is dit letterlijk de string die
   * binnenkwam. Geen extra element, geen fragment per deel — een kop zonder
   * markering hoort in de HTML niet te zien te zijn aan de uitvoer.
   */
  if (!teller && delen.length === 1 && delen[0]?.vorm === 'tekst') return <>{tekst}</>;

  return <>{toon(delen, { aan: teller, gezet: false })}</>;
}
