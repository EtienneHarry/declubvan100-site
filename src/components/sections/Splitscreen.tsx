import {
  achtergrondKlasse,
  breedteKlasse,
  isLichteAchtergrond,
  ruimteKlasse,
  type AchtergrondToken,
  type BreedteToken,
  type RuimteToken,
} from '../../lib/tokens';
import { sizes } from '../../lib/breekpunten';
import { ploeg } from '../../lib/beweging';
import Bovenkop from '../basis/Bovenkop';
import Knop from '../basis/Knop';
import Beeldvlak from '../beeld/Beeldvlak';

export interface Deur {
  bovenkop?: string;
  kop: string;
  tekst?: string;
  knop?: { label: string; href: string };
  beeld?: { bron: string; alt: string };
}

export interface SplitscreenProps {
  achtergrond: AchtergrondToken;
  ruimte: RuimteToken;
  breedte: BreedteToken;
  deuren: Deur[];
}

/*
 * Twee deuren: opdrachtgevers links, professionals rechts. De referentie die de
 * klant zelf noemt — jongensvandebar.nl — is precies dit.
 *
 * Een deur mét beeld gaat door Beeldvlak, want daar staat tekst op de foto en
 * dan is de sluier verplicht. Een deur zónder beeld wordt een vlak met een
 * lijn: geen leeg beeldkader, geen gebroken afbeelding, en de deur blijft even
 * hoog als zijn buur.
 *
 * Het raster gaat uit van twee, maar verdraagt één of meer.
 */
export default function Splitscreen({
  achtergrond,
  ruimte,
  breedte,
  deuren,
}: SplitscreenProps) {
  /*
   * De deur is hier het element in het ritme, niet zijn onderdelen. Een
   * splitscreen heeft geen sectiekop en geen sectietekst; wat de bezoeker ziet
   * zijn twee vlakken, en die horen na elkaar binnen te komen en niet ieder in
   * acht stukjes. De bovenkop binnenin krijgt daarom geen eigen stap.
   */
  const volgende = ploeg();

  /*
   * Geen deuren, dan ook geen sectie — dezelfde nultak als de andere secties.
   * Zonder dit schilderde een leeg blok zijn achtergrond en zijn verticale
   * ruimte gewoon, als een gat van een paar honderd pixels.
   */
  if (deuren.length === 0) return null;

  return (
    <section
      className={`${achtergrondKlasse[achtergrond]} ${ruimteKlasse[ruimte]}`}
      data-thema={isLichteAchtergrond[achtergrond] ? 'licht' : undefined}
    >
      <div className={breedteKlasse[breedte]}>
        {deuren.length > 0 ? (
          <ul className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2">
            {deuren.map((deur, index) => {
              const inhoud = (
                <>
                  {deur.bovenkop?.trim() ? <Bovenkop>{deur.bovenkop}</Bovenkop> : null}
                  <h2 className="mt-3 text-kop-l text-balance break-words first:mt-0">
                    {deur.kop}
                  </h2>
                  {deur.tekst?.trim() ? (
                    <p className="mt-3 text-lopend-m">{deur.tekst}</p>
                  ) : null}
                  {deur.knop ? (
                    <p className="mt-6">
                      <Knop variant="lijn" href={deur.knop.href}>
                        {deur.knop.label}
                      </Knop>
                    </p>
                  ) : null}
                </>
              );

              return (
                <li
                  key={`${deur.kop}-${index}`}
                  data-onthul="blok"
                  data-onthul-stap={volgende()}
                  className="flex"
                >
                  {deur.beeld?.bron.trim() ? (
                    <div className="w-full">
                      {/*
                        Vlakke sluier, niet 'onder'. Een deur is smal, en zodra
                        de kop meer dan één regel wordt vult de tekst het hele
                        vlak — dan staat de bovenste helft op het doorzichtige
                        deel van het verloop, oftewel op onbehandelde foto. De
                        vlakke sluier van 62% dekt overal.
                      */}
                      {/*
                        De zoom alleen als de deur ergens heen gaat. Zonder knop
                        is het een vlak met tekst en verwijst het nergens naar;
                        dan hoort er ook niets te bewegen onder de muis.
                      */}
                      {/*
                        sizes: twee deuren naast elkaar vanaf md, daaronder
                        vult er een het hele scherm.
                      */}
                      <Beeldvlak
                        bron={deur.beeld.bron}
                        alt={deur.beeld.alt}
                        sluier="vlak"
                        verhouding="breed"
                        sizes={sizes([['md', '50vw']], '100vw')}
                        zoom={Boolean(deur.knop)}
                      >
                        {inhoud}
                      </Beeldvlak>
                    </div>
                  ) : (
                    <div className="flex w-full flex-col justify-end border border-lijn bg-vlak-verhoogd p-8">
                      {inhoud}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
