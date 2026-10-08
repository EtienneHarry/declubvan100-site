import {
  achtergrondKlasse,
  breedteKlasse,
  isLichteAchtergrond,
  maatRegelKlasse,
  ruimteKlasse,
  verhoudingKlasse,
  type AchtergrondToken,
  type BreedteToken,
  type RuimteToken,
  type VerhoudingToken,
} from '../../lib/tokens';
import type { KopNiveau } from '../../lib/SectionRenderer';
import { ploeg } from '../../lib/beweging';
import { beeldSrcset } from '../../lib/beeld';
import { sizes } from '../../lib/breekpunten';
import Bovenkop from '../basis/Bovenkop';
import Koptekst from '../basis/Koptekst';

export interface BeeldTekstProps {
  achtergrond: AchtergrondToken;
  ruimte: RuimteToken;
  breedte: BreedteToken;
  bovenkop?: string;
  kop: string;
  tekst?: string;
  beeld?: { bron: string; alt: string };
  beeldPositie?: 'links' | 'rechts';
  /** De drie uit de beeldrichtlijn. Standaard 16:9, zoals het hiervoor vastlag. */
  verhouding?: VerhoudingToken;
  /** Gezet door SectieLijst; 1 als deze sectie de pagina opent. */
  kopNiveau?: KopNiveau;
}

/*
 * Beeld naast tekst.
 *
 * Hier staat de tekst náást het beeld, niet erop, dus dit gaat bewust niet via
 * Beeldvlak: dat component bestaat om de sluier onder tekst-op-beeld af te
 * dwingen en zou de foto hier zonder reden verduisteren.
 *
 * Ontbreekt het beeld, dan valt de beeldkolom helemaal weg en loopt de tekst
 * over de volle breedte door — geen leeg vlak en geen gebroken afbeelding.
 *
 * De verhouding stond hier eerst hard op 16:9. Dat was de uitzondering: de
 * beeldrichtlijn kent er drie en Beeldvlak bood ze al aan. Nu leest dit
 * component dezelfde tabel uit tokens.ts. Dat is geen overbodige keuze — het
 * merendeel van de aangeleverde fotografie is staand, en 16:9 sneed daar
 * gemeten 63% van de hoogte af.
 */
export default function BeeldTekst({
  achtergrond,
  ruimte,
  breedte,
  bovenkop,
  kop,
  tekst,
  beeld,
  beeldPositie = 'links',
  verhouding = 'breed',
  kopNiveau = 2,
}: BeeldTekstProps) {
  const heeftBeeld = Boolean(beeld?.bron.trim());

  /*
   * Niets erin, dus ook niets eruit — dezelfde regel als bij een lege rijke
   * tekst. Het beeld telt mee: een sectie met alleen een foto is een
   * beeldsectie en geen leeg vlak.
   */
  if (!kop.trim() && !tekst?.trim() && !bovenkop?.trim() && !heeftBeeld) return null;

  const Kop = kopNiveau === 1 ? 'h1' : 'h2';
  const beeldOrde = beeldPositie === 'rechts' ? 'md:order-2' : 'md:order-1';
  const tekstOrde = beeldPositie === 'rechts' ? 'md:order-1' : 'md:order-2';

  /*
   * Bovenkop, kop, tekst, dan het beeld. Het tekstblok wordt hier opgebouwd en
   * niet verderop in de JSX, want het beeld staat in de DOM vaak vóór de tekst
   * en zou dan de eerste stap opeisen. In het ritme is het beeld het item, en
   * items komen als laatste.
   */
  const volgende = ploeg();

  const tekstblok = (
    <>
      {bovenkop?.trim() ? <Bovenkop stap={volgende()}>{bovenkop}</Bovenkop> : null}
      {/* Een lege kop levert geen leeg kopelement op; zie SectionRenderer. */}
      {kop.trim() ? (
        <Kop
          data-onthul="kop"
          data-onthul-stap={volgende()}
          className="mt-4 text-kop-l text-balance break-words first:mt-0"
        >
          <Koptekst tekst={kop} />
        </Kop>
      ) : null}
      {tekst?.trim() ? (
        <p
          data-onthul="blok"
          data-onthul-stap={volgende()}
          className={`mt-4 text-lopend-m text-tekst-zacht ${maatRegelKlasse[achtergrond]}`}
        >
          {tekst}
        </p>
      ) : null}
    </>
  );

  return (
    <section
      className={`${achtergrondKlasse[achtergrond]} ${ruimteKlasse[ruimte]}`}
      data-thema={isLichteAchtergrond[achtergrond] ? 'licht' : undefined}
    >
      <div className={breedteKlasse[breedte]}>
        <div
          className={`grid grid-cols-1 items-center gap-8 ${heeftBeeld ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}
        >
          {beeld && heeftBeeld ? (
            <div data-onthul="blok" data-onthul-stap={volgende()} className={beeldOrde}>
              {/*
                Met de varianten, net als Kaart en Beeldvlak. Hier stond alleen
                het origineel, en dan haalt elke telefoon de volle foto op — bij
                staff-wanted-web.jpg 605 kB in plaats van 88. Er staat nu geen
                beeld-tekst op een echte pagina, maar de redacteur kan er morgen
                een toevoegen. Op md staan beeld en tekst naast elkaar.
              */}
              <img
                src={beeld.bron}
                srcSet={beeldSrcset(beeld.bron)}
                sizes={sizes([['md', '50vw']], '100vw')}
                alt={beeld.alt}
                loading="lazy"
                decoding="async"
                className={`${verhoudingKlasse[verhouding]} w-full rounded-none object-cover`}
              />
            </div>
          ) : null}
          <div className={heeftBeeld ? tekstOrde : undefined}>{tekstblok}</div>
        </div>
      </div>
    </section>
  );
}
