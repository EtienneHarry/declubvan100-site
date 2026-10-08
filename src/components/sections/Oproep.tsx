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
import Knop from '../basis/Knop';
import Pijl from '../merk/Pijl';

export interface OproepProps {
  achtergrond: AchtergrondToken;
  ruimte: RuimteToken;
  breedte: BreedteToken;
  bovenkop?: string;
  kop: string;
  tekst?: string;
  knop?: { label: string; href: string };
  tweedeKnop?: { label: string; href: string };
  /**
   * Een handgetekende pijl naast de eerste knop. Vraag hem hier aan; of hij er
   * ook komt, beslist SectieLijst — er mag er maar één per pagina staan.
   */
  pijl?: boolean;
  /** Gezet door SectieLijst; 1 als deze sectie de pagina opent. */
  kopNiveau?: KopNiveau;
}

/**
 * Afsluitend blok met een actie.
 *
 * Eén gevulde knop per blikveld, dus een tweede actie komt er als lijnknop bij.
 * Ontbreekt de knop, dan blijft het een kop met tekst — de sectie valt niet om.
 */
export default function Oproep({
  achtergrond,
  ruimte,
  breedte,
  bovenkop,
  kop,
  tekst,
  knop,
  tweedeKnop,
  pijl = false,
  kopNiveau = 2,
}: OproepProps) {
  /*
   * Niets erin, dus ook niets eruit — dezelfde regel als bij een lege rijke
   * tekst. De knoppen tellen mee als inhoud: een blok met alleen een actie is
   * mager maar niet leeg. Een knop zonder tekst telt niet, want die rendert als
   * een leeg vlakje.
   */
  if (
    !kop.trim() &&
    !tekst?.trim() &&
    !bovenkop?.trim() &&
    !knop?.label.trim() &&
    !tweedeKnop?.label.trim()
  ) {
    return null;
  }

  const Kop = kopNiveau === 1 ? 'h1' : 'h2';

  // Bovenkop, kop, tekst, dan de knoppen: de actie komt als laatste binnen.
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
            {tekst}
          </p>
        ) : null}
        {knop || tweedeKnop ? (
          <div
            data-onthul="blok"
            data-onthul-stap={volgende()}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            {/*
              De primaire actie staat sinds de restyle op vuur. Dat is de knop uit de
              mockup, en het is de enige plek waar die kleur op de site terechtkomt: als
              vlak, met witte tekst, nooit als woord op bruin.

              Er zat een tijdlang een keuze op — knopKleur, vuur of inkt, als
              doelgroepcode uit de mockup. Die is vervallen: elke call to action krijgt
              vuur. Een keuze in het CMS die maar één goed antwoord heeft, is geen
              keuze maar een manier om de regel per ongeluk te breken.

              De tweede actie blijft de lijnknop, en die is nu het open paar van vuur:
              dezelfde kleur als rand, doorzichtige vulling, cream tekst. Eén gevulde
              knop per blikveld, en de rangorde zit in vol tegenover open.

              De pijl komt alleen om de eerste knop, en alleen als SectieLijst hem
              heeft toegekend — er mag er één per pagina staan. Zonder knop is er
              niets om naar te wijzen, dus dan vervalt hij vanzelf.
            */}
            {knop ? (
              pijl ? (
                <Pijl>
                  <Knop variant="vuur" maat="l" href={knop.href}>
                    {knop.label}
                  </Knop>
                </Pijl>
              ) : (
                <Knop variant="vuur" maat="l" href={knop.href}>
                  {knop.label}
                </Knop>
              )
            ) : null}
            {tweedeKnop ? (
              <Knop variant="lijn" maat="l" href={tweedeKnop.href}>
                {tweedeKnop.label}
              </Knop>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
