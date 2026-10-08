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
import { ploeg } from '../../lib/beweging';
import Bovenkop from '../basis/Bovenkop';

export interface Citaat {
  citaat: string;
  naam?: string;
  rol?: string;
}

export interface CitatenProps {
  achtergrond: AchtergrondToken;
  ruimte: RuimteToken;
  breedte: BreedteToken;
  bovenkop?: string;
  items: Citaat[];
}

/**
 * Klantquotes. Eén citaat krijgt de volle breedte, meerdere komen naast elkaar
 * te staan. Bij nul citaten rendert de sectie niets binnen haar vlak.
 *
 * Naam en rol zijn allebei optioneel; ontbreken ze, dan blijft er geen lege
 * bronregel achter.
 */
export default function Citaten({
  achtergrond,
  ruimte,
  breedte,
  bovenkop,
  items,
}: CitatenProps) {
  /*
   * Niets erin, dus ook niets eruit — dezelfde regel als bij een lege rijke
   * tekst. Citaten heeft geen sectiekop, dus zonder citaten en zonder bovenkop
   * blijft er letterlijk niets over om te tonen.
   */
  if (items.length === 0 && !bovenkop?.trim()) return null;

  const raster = items.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2';

  // Bovenkop, dan citaat na citaat — hetzelfde ritme als de kaarten.
  const volgende = ploeg();

  return (
    <section
      className={`${achtergrondKlasse[achtergrond]} ${ruimteKlasse[ruimte]}`}
      data-thema={isLichteAchtergrond[achtergrond] ? 'licht' : undefined}
    >
      <div className={breedteKlasse[breedte]}>
        {bovenkop?.trim() ? <Bovenkop stap={volgende()}>{bovenkop}</Bovenkop> : null}
        {items.length > 0 ? (
          <ul className={`mt-10 grid list-none gap-10 p-0 first:mt-0 ${raster}`}>
            {items.map((item, index) => (
              <li
                key={`${item.naam ?? 'citaat'}-${index}`}
                data-onthul="blok"
                data-onthul-stap={volgende()}
              >
                <figure className="border-l border-lijn-sterk pl-6">
                  {/*
                    De leesmaat hoort ook op een citaat. Bij meerdere citaten
                    houdt de kolom de regel vanzelf kort, maar één citaat krijgt
                    de volle breedte: gemeten liep dat op 1440 uit tot 73 tekens
                    op zwart, waar het token 60 aanhoudt.
                  */}
                  <blockquote
                    className={`text-kop-m text-balance break-words ${maatRegelKlasse[achtergrond]}`}
                  >
                    {item.citaat}
                  </blockquote>
                  {item.naam?.trim() || item.rol?.trim() ? (
                    <figcaption className="mt-4 text-lopend-s text-tekst-stil">
                      {[item.naam, item.rol].filter((deel) => deel?.trim()).join(' — ')}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
