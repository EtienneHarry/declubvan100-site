import Markdoc, { type Node, type RenderableTreeNode } from '@markdoc/markdoc';
import { Fragment, type ReactNode } from 'react';

import Bliksem from '../merk/Bliksem';

export interface RijkeInhoudProps {
  /** De tekst als markdoc-boom. In het CMS is dit een markdoc-veld. */
  inhoud: Node;
  /**
   * Waar een `##` uit de tekst op uitkomt. Wordt geklemd op 2 tot en met 4:
   * dieper heeft op deze pagina's geen betekenis meer, en h1 blijft van de
   * sectie die de pagina opent.
   */
  basisNiveau: number;
  /** De leesbreedteklasse van de sectie eromheen, uit `maatRegelKlasse`. */
  maat: string;
  /**
   * Zet de bliksemschicht als opsommingsteken. Alleen voor lijsten die over de
   * 100 of de selectie gaan — een lijst met openingstijden krijgt hem niet.
   */
  schichtLijst?: boolean;
  /**
   * De teller van de ploeg. Geef je hem mee, dan doet de bovenste laag van de
   * tekst mee in het ritme van de scrollonthulling. Laat je hem weg, dan
   * beweegt er niets apart — dat is wat een antwoord in een accordeon wil, want
   * dat staat dicht als de sectie in beeld komt.
   */
  volgende?: () => number;
}

/*
 * De kale markdoc-set: welke elementen er uit de tekst van een redacteur kunnen
 * ontstaan, en hoe ze eruitzien.
 *
 * Stond tot B8 binnen RijkeTekst. Het accordeon heeft dezelfde set nodig voor
 * zijn antwoorden, en dat is precies de reden om het één keer te hebben: dit is
 * de lijst die bepaalt wat er níet in de pagina komt. Twee kopieën van een
 * toelatingslijst lopen uit elkaar, en dan is de tweede stilletjes ruimer dan
 * de eerste.
 *
 * Er gaat geen ongecontroleerde HTML de pagina in. Alles wat markdoc verder
 * kent en hieronder niet staat, valt terug op enkel zijn tekst.
 */

/** De koppen die de redacteur kan zetten, en waar ze op uitkomen. */
const KOP_KLASSE: Record<2 | 3 | 4, string> = {
  2: 'mt-10 text-kop-m',
  3: 'mt-8 text-kop-s',
  4: 'mt-6 text-kop-s',
};

/**
 * Staat er iets in? Een aangemaakte maar nooit gevulde sectie komt uit een CMS
 * vaker voorbij dan je denkt: de redacteur voegt er een toe, wordt gestoord, en
 * slaat op.
 */
export function heeftInhoud(inhoud: Node): boolean {
  const boom = Markdoc.transform(inhoud);
  return Markdoc.Tag.isTag(boom) && Array.isArray(boom.children) && boom.children.length > 0;
}

export default function RijkeInhoud({
  inhoud,
  basisNiveau,
  maat,
  schichtLijst = false,
  volgende,
}: RijkeInhoudProps) {
  const boom = Markdoc.transform(inhoud);

  function render(knoop: RenderableTreeNode, sleutel: string, bovenlaag = false): ReactNode {
    if (knoop === null || knoop === undefined || typeof knoop === 'boolean') return null;
    if (typeof knoop === 'string' || typeof knoop === 'number') return knoop;

    if (Array.isArray(knoop)) {
      return knoop.map((kind, index) => render(kind, `${sleutel}-${index}`, bovenlaag));
    }

    // isTag is de enige betrouwbare test. Een gewoon object met een `name` kan
    // ook een attributenbundel zijn, en dan bestaat `children` niet.
    if (!Markdoc.Tag.isTag(knoop)) return null;

    const naam = String(knoop.name);
    const attributen = (knoop.attributes ?? {}) as Record<string, unknown>;
    // De kinderen van de wortel zijn de bovenste laag van de tekst; die doen
    // mee in het ritme. Alles daaronder niet.
    const kinderen = (knoop.children ?? []).map((kind, index) =>
      render(kind, `${sleutel}-${index}`, naam === 'article'),
    );

    // Alleen de bovenste laag doet mee, en alleen als er een teller meegegeven
    // is. Zonder teller beweegt er hier niets apart.
    const stap = bovenlaag && volgende ? volgende() : undefined;
    const onthul = stap === undefined ? undefined : true;

    /*
     * De wortel van elke markdoc-boom heet `article`. Die hoort geen element op
     * te leveren: de sectie zet er zelf al een <div> omheen, en een tweede
     * omhulsel zou de koppen en lijsten een niveau dieper zetten dan bedoeld.
     */
    if (naam === 'article') return <Fragment key={sleutel}>{kinderen}</Fragment>;

    /*
     * Koppen. Het schema laat alleen ## en ### toe, dus een h1 kan hier niet
     * uit de tekst komen; die hoort bij de sectie die de pagina opent.
     */
    const kopTreffer = /^h([1-6])$/.exec(naam);
    if (kopTreffer) {
      const stapInTekst = Number(kopTreffer[1]) - 2;
      const niveau = Math.min(Math.max(basisNiveau + stapInTekst, 2), 4) as 2 | 3 | 4;
      const Tag = `h${niveau}` as 'h2' | 'h3' | 'h4';

      return (
        <Tag
          key={sleutel}
          data-onthul={onthul ? 'kop' : undefined}
          data-onthul-stap={stap}
          className={`${KOP_KLASSE[niveau]} text-balance break-words ${maat}`}
        >
          {kinderen}
        </Tag>
      );
    }

    if (naam === 'p') {
      return (
        <p
          key={sleutel}
          data-onthul={onthul ? 'blok' : undefined}
          data-onthul-stap={stap}
          className={`mt-4 text-lopend-m text-tekst-zacht ${maat}`}
        >
          {kinderen}
        </p>
      );
    }

    if (naam === 'ul' || naam === 'ol') {
      const Tag = naam;
      return (
        <Tag
          key={sleutel}
          data-onthul={onthul ? 'blok' : undefined}
          data-onthul-stap={stap}
          className={`mt-4 flex list-none flex-col gap-3 p-0 ${maat}`}
        >
          {kinderen}
        </Tag>
      );
    }

    if (naam === 'li') {
      return (
        <li key={sleutel} className="flex items-start gap-3">
          {schichtLijst ? (
            <span className="mt-1 flex text-tekst-zacht">
              <Bliksem rol="opsomming" />
            </span>
          ) : (
            <span aria-hidden="true" className="mt-2 block size-1 shrink-0 bg-tekst-stil" />
          )}
          <span className="text-lopend-m text-tekst-zacht">{kinderen}</span>
        </li>
      );
    }

    if (naam === 'strong') return <strong key={sleutel}>{kinderen}</strong>;
    if (naam === 'em') return <em key={sleutel}>{kinderen}</em>;

    // Een harde regelafbreking binnen een alinea. Nodig voor blokjes die op
    // aparte regels horen maar één alinea zijn, zoals een adres.
    if (naam === 'br') return <br key={sleutel} />;

    if (naam === 'a') {
      const href = typeof attributen['href'] === 'string' ? attributen['href'] : undefined;
      return (
        <a key={sleutel} href={href}>
          {kinderen}
        </a>
      );
    }

    /*
     * Alles wat we niet kennen levert alleen zijn tekst op, zonder omhulsel.
     *
     * Dit stond op <span> en dat was fout: de wortel viel er ook in, dus alle
     * koppen en lijsten zaten in een span. Een span mag geen blokelementen
     * bevatten — de pagina rendert wel, maar de HTML is ongeldig en je ziet het
     * nergens aan. Een fragment kan die fout niet maken.
     */
    return <Fragment key={sleutel}>{kinderen}</Fragment>;
  }

  return <>{render(boom, 'r')}</>;
}
