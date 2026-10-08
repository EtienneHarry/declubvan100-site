import {
  achtergrondKlasse,
  breedteKlasse,
  isLichteAchtergrond,
  ruimteKlasse,
  type AchtergrondToken,
  type BreedteToken,
  type RuimteToken,
} from '../../lib/tokens';
import type { KopNiveau } from '../../lib/SectionRenderer';
import { ploeg } from '../../lib/beweging';
import Bovenkop from '../basis/Bovenkop';
import Koptekst from '../basis/Koptekst';
import Kaart from '../basis/Kaart';
import Handschrift from '../merk/Handschrift';

export interface Kolom {
  nummer?: string;
  kop: string;
  tekst?: string;
  href?: string;
  /** Foto boven de kaart, altijd 4:5. Zie Kaart. */
  beeld?: { bron: string; alt: string };
  /** De taal van de kop, als die niet Nederlands is. Zie Kaart. */
  taal?: 'nl' | 'en';
}

export interface DrieKolommenProps {
  achtergrond: AchtergrondToken;
  ruimte: RuimteToken;
  breedte: BreedteToken;
  bovenkop?: string;
  kop?: string;
  items: Kolom[];
  /**
   * Eén handgeschreven regel onder het raster, altijd `aria-hidden`.
   *
   * Alleen invullen met een tekst die de kaarten erboven herhalen — zie
   * Handschrift. Eén per pagina, niet per sectie; dat is een redactionele regel
   * en geen instelling van dit component.
   */
  handschrift?: string;
  /** Gezet door SectieLijst; 1 als deze sectie de pagina opent. */
  kopNiveau?: KopNiveau;
}

/**
 * Raster van kaarten. Drie kolommen is het uitgangspunt, maar het raster groeit
 * mee: één, twee, acht of nul kaarten leveren allemaal iets nets op. Bij nul
 * blijft het raster helemaal weg, zodat een lege sectie geen gat trekt.
 */
export default function DrieKolommen({
  achtergrond,
  ruimte,
  breedte,
  bovenkop,
  kop,
  items,
  handschrift,
  kopNiveau = 2,
}: DrieKolommenProps) {
  const heeftKop = Boolean(kop?.trim());
  const heeftBovenkop = Boolean(bovenkop?.trim());

  /*
   * Niets erin, dus ook niets eruit — dezelfde regel als bij een lege rijke
   * tekst. Het raster bleef bij nul kaarten al weg, maar de sectie eromheen
   * niet: achtergrond en verticale ruimte werden gewoon geschilderd.
   *
   * Het handschrift telt níét mee. Dat is decoratie, het staat op aria-hidden,
   * en een sectie met alleen een versiering erin is precies het lege vlak dat
   * deze regel weghaalt.
   */
  if (!heeftKop && !heeftBovenkop && items.length === 0) return null;

  const Kop = kopNiveau === 1 ? 'h1' : 'h2';

  /*
   * De kaartkoppen zakken onder de sectiekop. Is er geen sectiekop, dan zijn de
   * kaarten zelf het bovenste niveau van deze sectie en blijven ze staan waar de
   * sectie staat — anders zou er een niveau overgeslagen worden.
   */
  const kaartNiveau: 2 | 3 = heeftKop ? (kopNiveau === 1 ? 2 : 3) : 2;

  /*
   * De ploeg loopt door de kaarten heen: bovenkop, kop, dan kaart na kaart in
   * hetzelfde ritme van 70ms. Vanaf de negende kaart deelt hij de laatste stap,
   * anders staat die te lang stil nadat hij in beeld is gekomen.
   */
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
            <Koptekst tekst={kop ?? ""} />
          </Kop>
        ) : null}
        {/*
          auto-rows-fr maakt elke rij even hoog als de hoogste, dus de kaarten
          zijn gelijk ongeacht hoeveel tekst erop staat — ook de kaart die op
          een tussenbreedte alleen op de tweede rij belandt. De kaart zelf vult
          zijn cel met grow; zie Kaart.
        */}
        {items.length > 0 ? (
          <ul
            className={`grid auto-rows-fr list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3 ${
              heeftKop || heeftBovenkop ? 'mt-10' : ''
            }`}
          >
            {items.map((item, index) => (
              <li
                key={`${item.kop}-${index}`}
                data-onthul="blok"
                data-onthul-stap={volgende()}
                className="flex"
              >
                <div className="flex w-full flex-col">
                  <Kaart
                    variant="kaal"
                    beeld={item.beeld}
                    nummer={item.nummer}
                    kop={item.kop}
                    tekst={item.tekst}
                    href={item.href}
                    kopNiveau={kaartNiveau}
                    taal={item.taal}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {/*
          De handgeschreven regel komt als laatste binnen, ná de kaarten. Hij
          herhaalt wat er net gestaan heeft, dus hij hoort ook pas te komen als
          dat er staat.
        */}
        {handschrift?.trim() ? (
          <div data-onthul="blok" data-onthul-stap={volgende()} className="mt-10">
            <Handschrift tekst={handschrift} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
