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
import Mailbaar from '../basis/Mailbaar';

export interface KopTekstProps {
  achtergrond: AchtergrondToken;
  ruimte: RuimteToken;
  breedte: BreedteToken;
  bovenkop?: string;
  kop: string;
  tekst?: string;
  /** Gezet door SectieLijst; 1 als deze sectie de pagina opent. */
  kopNiveau?: KopNiveau;
}

/**
 * Kop met optionele bovenkop en lopende tekst.
 *
 * Verdraagt een kop van elke lengte en laat lege delen weg in plaats van er
 * ruimte voor te reserveren.
 */
export default function KopTekst({
  achtergrond,
  ruimte,
  breedte,
  bovenkop,
  kop,
  tekst,
  kopNiveau = 2,
}: KopTekstProps) {
  /*
   * Niets erin, dus ook niets eruit — dezelfde regel als bij een lege rijke
   * tekst. Zonder dit schildert de sectie haar achtergrond en haar verticale
   * ruimte gewoon, en staat er een leeg vlak van een paar honderd pixels.
   *
   * Een aangemaakte maar nooit gevulde sectie komt uit een CMS vaker voorbij dan
   * je denkt: de redacteur voegt er een toe, wordt gestoord, en slaat op.
   */
  if (!kop.trim() && !tekst?.trim() && !bovenkop?.trim()) return null;

  const Kop = kopNiveau === 1 ? 'h1' : 'h2';

  // Bovenkop, kop, tekst — elk aanwezig onderdeel schuift 70ms op.
  const volgende = ploeg();

  return (
    <section
      className={`${achtergrondKlasse[achtergrond]} ${ruimteKlasse[ruimte]}`}
      data-thema={isLichteAchtergrond[achtergrond] ? 'licht' : undefined}
    >
      <div className={breedteKlasse[breedte]}>
        {bovenkop?.trim() ? <Bovenkop stap={volgende()}>{bovenkop}</Bovenkop> : null}
        {/* Een lege kop levert geen leeg kopelement op; zie SectionRenderer. */}
        {kop.trim() ? (
          <Kop
            data-onthul="kop"
            data-onthul-stap={volgende()}
            className="mt-4 text-display-l text-balance break-words first:mt-0"
          >
            <Koptekst tekst={kop} />
          </Kop>
        ) : null}
        {tekst?.trim() ? (
          <p
            data-onthul="blok"
            data-onthul-stap={volgende()}
            className={`mt-6 text-lopend-l text-tekst-zacht ${maatRegelKlasse[achtergrond]}`}
          >
            {/* Een mailadres in de tekst is aan te tikken; de rest blijft platte tekst. */}
            <Mailbaar tekst={tekst} />
          </p>
        ) : null}
      </div>
    </section>
  );
}
