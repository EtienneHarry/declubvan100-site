import type { Node } from '@markdoc/markdoc';

import {
  achtergrondKlasse,
  breedteKlasse,
  isLichteAchtergrond,
  maatRegelKlasse,
  ruimteKlasse,
  type AchtergrondToken,
  type BreedteToken,
  type RuimteToken,
} from '../../lib/tokens';
import type { KopNiveau } from '../../lib/SectionRenderer';
import { ploeg } from '../../lib/beweging';
import Bovenkop from '../basis/Bovenkop';
import Koptekst from '../basis/Koptekst';
import RijkeInhoud from '../basis/RijkeInhoud';

export interface Vraag {
  vraag: string;
  /** Het antwoord als markdoc-boom, met dezelfde kale set als de rijke tekst. */
  antwoord: Node;
}

export interface AccordeonProps {
  achtergrond: AchtergrondToken;
  ruimte: RuimteToken;
  breedte: BreedteToken;
  bovenkop?: string;
  kop?: string;
  items: Vraag[];
  /** Gezet door SectieLijst; 1 als deze sectie de pagina opent. */
  kopNiveau?: KopNiveau;
}

/*
 * Vragen en antwoorden, elk antwoord open te klappen.
 *
 * OPEN IS DE BEGINTOESTAND, EN DAT IS GEEN SLORDIGHEID. In de HTML staat elk
 * antwoord uitgeklapt: `aria-expanded="true"` en een paneel op volle hoogte.
 * AccordeonScript klapt ze bij het laden dicht. Zonder JavaScript blijft de
 * sectie dus een gewone lijst met vragen en antwoorden onder elkaar — leesbaar,
 * compleet, alleen niet inklapbaar.
 *
 * Andersom zou het een lijst met twaalf vragen zijn waarvan geen enkele
 * opengaat, en dat is precies het soort stille fout dat deze repo elders ook
 * vermijdt: de scrollonthulling hangt om dezelfde reden aan een vlagje dat het
 * script zet, zodat een uitgevallen script geen lege pagina oplevert.
 *
 * GEEN aria-controls. De richtlijn kent hem, maar hij vraagt een id dat over de
 * hele pagina uniek is, en dat is uit de inhoud niet te maken: twee accordeons
 * op één pagina kunnen dezelfde vraag op dezelfde plek hebben. Voor een
 * disclosure is `aria-expanded` op de knop het dragende deel, en het paneel
 * staat er direct achter in de DOM. Zie het toegankelijkheidshoofdstuk van
 * design-system.md.
 *
 * GEEN PIJLTOETSEN. Dat is de tab-lijst-richtlijn, niet de disclosure-richtlijn:
 * elke vraag is een losse knop en die bereik je met tab, in leesvolgorde. Een
 * accordeon die pijltoetsen kaapt, breekt het scrollen met de toetsen.
 *
 * DE VRAAG IS EEN KOP. Hij zakt onder de sectiekop mee, net als een kaartkop,
 * zodat een schermlezer de lijst via de koppen kan doorlopen en
 * `check-koppen` erover kan oordelen. De knop zit ín de kop en niet andersom:
 * een kop in een knop maakt van de kop een stuk knoptekst.
 */
export default function Accordeon({
  achtergrond,
  ruimte,
  breedte,
  bovenkop,
  kop,
  items,
  kopNiveau = 2,
}: AccordeonProps) {
  const heeftKop = Boolean(kop?.trim());
  const heeftBovenkop = Boolean(bovenkop?.trim());

  /*
   * Niets erin, dus ook niets eruit — dezelfde regel als bij een lege rijke
   * tekst. Een accordeon zonder vragen is geen accordeon; zonder kop en
   * bovenkop erbij blijft er een leeg vlak over.
   */
  if (!heeftKop && !heeftBovenkop && items.length === 0) return null;

  const maat = maatRegelKlasse[achtergrond];

  const Kop = kopNiveau === 1 ? 'h1' : 'h2';

  /*
   * De vragen zakken onder de sectiekop. Is er geen sectiekop, dan zijn ze zelf
   * het bovenste niveau van deze sectie — anders wordt er een niveau
   * overgeslagen. Zelfde rekensom als bij de kaarten in DrieKolommen.
   */
  const vraagNiveau: 2 | 3 = heeftKop ? (kopNiveau === 1 ? 2 : 3) : 2;
  const Vraagkop = `h${vraagNiveau}` as 'h2' | 'h3';

  // Bovenkop, kop, dan vraag na vraag in hetzelfde ritme van 70ms.
  const volgende = ploeg();

  return (
    <section
      className={`${achtergrondKlasse[achtergrond]} ${ruimteKlasse[ruimte]}`}
      data-thema={isLichteAchtergrond[achtergrond] ? 'licht' : undefined}
    >
      <div className={breedteKlasse[breedte]}>
        {heeftBovenkop ? <Bovenkop stap={volgende()}>{bovenkop}</Bovenkop> : null}
        {heeftKop ? (
          <Kop
            data-onthul="kop"
            data-onthul-stap={volgende()}
            className="mt-4 text-kop-l text-balance break-words first:mt-0"
          >
            <Koptekst tekst={kop ?? ''} />
          </Kop>
        ) : null}
        {items.length > 0 ? (
          <ul
            className={`flex list-none flex-col p-0 ${heeftKop || heeftBovenkop ? 'mt-10' : ''} ${maat}`}
          >
            {items.map((item, index) => (
              <li
                key={`${item.vraag}-${index}`}
                data-accordeon-item
                data-onthul="blok"
                data-onthul-stap={volgende()}
                className="border-t border-lijn last:border-b"
              >
                <Vraagkop className="text-kop-s">
                  {/*
                    De knop vult de rij, zodat de hele regel klikbaar is en de
                    hitzone van 44px vanzelf gehaald wordt. Hij staat op
                    aria-expanded="true" omdat het paneel eronder open begint;
                    AccordeonScript zet dat om.
                  */}
                  <button
                    type="button"
                    data-accordeon-knop
                    aria-expanded="true"
                    className="flex w-full min-h-11 cursor-pointer items-center justify-between gap-6 border-0 bg-transparent py-5 text-left text-kop-s text-tekst [transition:color_var(--duur-1)_var(--soepel-uit)] hover:text-tekst-zacht"
                  >
                    <span className="text-balance break-words">{item.vraag}</span>
                    {/*
                      Het plusteken. Twee streepjes over elkaar: de staande
                      draait weg als het paneel opengaat, en dan blijft er een
                      min over. Op currentColor, dus hij volgt de knop.

                      aria-hidden, want de toestand staat al in aria-expanded.
                      Een schermlezer die er "plus" bij voorleest, zegt hetzelfde
                      twee keer.

                      In geforceerde kleuren (Windows hoog contrast) zet de
                      browser elke achtergrondkleur om naar die van het vlak, en
                      dan verdwenen de twee streepjes. Daar tekenen ze in
                      CanvasText, de systeemkleur voor tekst, en mag de browser
                      ze niet omzetten.
                    */}
                    <span
                      aria-hidden="true"
                      className="relative block size-4 shrink-0 [&>span]:absolute [&>span]:top-1/2 [&>span]:left-0 [&>span]:block [&>span]:h-[var(--lijn-dikte-sterk)] [&>span]:w-full [&>span]:-translate-y-1/2 [&>span]:bg-current forced-colors:[&>span]:[forced-color-adjust:none] forced-colors:[&>span]:bg-[CanvasText]"
                    >
                      <span />
                      <span className="rotate-90 [transition:rotate_var(--duur-2)_var(--soepel-uit)] [[data-accordeon-item][data-accordeon-dicht]_&]:rotate-0 [[data-accordeon-stil]_&]:[transition:none]" />
                    </span>
                  </button>
                </Vraagkop>
                {/*
                  Het paneel klapt open en dicht via grid-template-rows van 0fr
                  naar 1fr. Dat is de enige manier om naar de eigen hoogte van de
                  inhoud te animeren zonder die hoogte te kennen — en die kunnen
                  we niet kennen, want een hoogte in het style-attribuut wordt
                  door de CSP geblokkeerd.

                  --duur-3 is het token dat het design system aan "paneel,
                  accordeon, dialoog" hangt. Bij gereduceerde beweging zet de
                  globale regel in tokens.css elke transitie op 1ms, dus dan
                  klapt hij zonder tussenstap open.
                */}
                <div
                  data-accordeon-paneel
                  className="grid grid-rows-[1fr] [transition:grid-template-rows_var(--duur-3)_var(--soepel-uit)] [[data-accordeon-item][data-accordeon-dicht]>&]:grid-rows-[0fr] [[data-accordeon-stil]_&]:[transition:none]"
                >
                  <div className="overflow-hidden">
                    <div className="pb-6">
                      <RijkeInhoud
                        inhoud={item.antwoord}
                        basisNiveau={vraagNiveau + 1}
                        maat={maat}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
