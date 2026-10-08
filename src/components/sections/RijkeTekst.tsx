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
import Koptekst from '../basis/Koptekst';
import RijkeInhoud, { heeftInhoud } from '../basis/RijkeInhoud';

export interface RijkeTekstProps {
  achtergrond: AchtergrondToken;
  ruimte: RuimteToken;
  breedte: BreedteToken;
  kop?: string;
  /** De tekst als markdoc-boom. In het CMS is dit een markdoc.inline-veld. */
  inhoud: Node;
  /**
   * Zet de bliksemschicht als opsommingsteken. Alleen voor lijsten die over de
   * 100 of de selectie gaan — een lijst met openingstijden krijgt hem niet.
   */
  schichtLijst?: boolean;
  /** Gezet door SectieLijst; 1 als deze sectie de pagina opent. */
  kopNiveau?: KopNiveau;
}

/*
 * Lopende tekst met koppen en lijsten, voor de voorwaardenpagina.
 *
 * De inhoud komt als markdoc binnen en blijft daarmee leesbare markdown in de
 * repo, ook als je het CMS nooit opent. Welke elementen daaruit kunnen ontstaan
 * staat in RijkeInhoud, en dat is sinds B8 gedeeld met het accordeon: die
 * toelatingslijst hoort maar op één plek te staan, want twee kopieën lopen uit
 * elkaar en dan is de tweede stilletjes ruimer dan de eerste.
 *
 * Het kopniveau hangt af van de sectiekop erboven. Heeft de sectie een eigen
 * kop, dan is dat de <h2> en zakken de koppen in de tekst een niveau. Heeft ze
 * er geen, dan zijn de koppen in de tekst zelf het bovenste niveau — anders
 * springt de pagina van de <h1> van de hero rechtstreeks naar <h3>.
 */
export default function RijkeTekst({
  achtergrond,
  ruimte,
  breedte,
  kop,
  inhoud,
  schichtLijst = false,
  kopNiveau = 2,
}: RijkeTekstProps) {
  const maat = maatRegelKlasse[achtergrond];
  const heeftSectieKop = Boolean(kop?.trim());
  const SectieKop = kopNiveau === 1 ? 'h1' : 'h2';

  /*
   * Waar de koppen in de tekst beginnen. Onder een sectiekop een niveau lager;
   * zonder sectiekop zijn ze zelf het bovenste niveau van deze sectie.
   *
   * Een ## in de tekst komt dus uit op dit niveau, een ### een stap daaronder.
   */
  const basisNiveau = heeftSectieKop ? kopNiveau + 1 : kopNiveau;

  /*
   * Niets erin, dus ook niets eruit — zelfde regel als bij een ontbrekend
   * beeld. De sectie rendert dan helemaal niet, en er blijft geen vlak van een
   * paar honderd pixels leegte achter.
   *
   * Een aangemaakte maar nooit gevulde sectie komt uit een CMS vaker voorbij
   * dan je denkt: de redacteur voegt er een toe, wordt gestoord, en slaat op.
   */
  if (!heeftSectieKop && !heeftInhoud(inhoud)) return null;

  /*
   * De ploeg: de sectiekop, dan blok voor blok wat de redacteur geschreven
   * heeft. Alleen de bovenste laag van de tekst doet mee — een alinea komt
   * binnen, niet de woorden erin en niet de punten van een lijst apart.
   */
  const volgende = ploeg();

  return (
    <section
      className={`${achtergrondKlasse[achtergrond]} ${ruimteKlasse[ruimte]}`}
      data-thema={isLichteAchtergrond[achtergrond] ? 'licht' : undefined}
    >
      <div className={breedteKlasse[breedte]}>
        {heeftSectieKop ? (
          <SectieKop
            data-onthul="kop"
            data-onthul-stap={volgende()}
            className="text-kop-l text-balance break-words"
          >
            <Koptekst tekst={kop ?? ''} />
          </SectieKop>
        ) : null}
        <RijkeInhoud
          inhoud={inhoud}
          basisNiveau={basisNiveau}
          maat={maat}
          schichtLijst={schichtLijst}
          volgende={volgende}
        />
      </div>
    </section>
  );
}
