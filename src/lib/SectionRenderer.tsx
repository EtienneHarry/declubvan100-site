import { Fragment } from 'react';

import Accordeon, { type AccordeonProps } from '../components/sections/Accordeon';
import BeeldTekst, { type BeeldTekstProps } from '../components/sections/BeeldTekst';
import Citaten, { type CitatenProps } from '../components/sections/Citaten';
import DrieKolommen, { type DrieKolommenProps } from '../components/sections/DrieKolommen';
import Hero, { type HeroProps } from '../components/sections/Hero';
import KopTekst, { type KopTekstProps } from '../components/sections/KopTekst';
import Formulier, { type FormulierProps } from '../components/sections/Formulier';
import Oproep, { type OproepProps } from '../components/sections/Oproep';
import RijkeTekst, { type RijkeTekstProps } from '../components/sections/RijkeTekst';
import Splitscreen, { type SplitscreenProps } from '../components/sections/Splitscreen';

/*
 * Sectietype naar component.
 *
 * Dit is samen met tokens.ts het enige koppelbestand, en de enige plek waar een
 * sectietype aan een component vastzit. Een nieuwe sectie landt hier in de
 * union én in de switch; vergeet je de switch, dan valt de
 * exhaustiviteitscontrole in de default-tak om en krijg je een compileerfout.
 */

export type Sectie =
  | ({ type: 'hero' } & HeroProps)
  | ({ type: 'splitscreen' } & SplitscreenProps)
  | ({ type: 'kop-tekst' } & KopTekstProps)
  | ({ type: 'beeld-tekst' } & BeeldTekstProps)
  | ({ type: 'drie-kolommen' } & DrieKolommenProps)
  | ({ type: 'citaten' } & CitatenProps)
  | ({ type: 'oproep' } & OproepProps)
  | ({ type: 'rijke-tekst' } & RijkeTekstProps)
  | ({ type: 'accordeon' } & AccordeonProps)
  | ({ type: 'formulier' } & FormulierProps);

export type SectieType = Sectie['type'];

/**
 * Op welk niveau een sectie haar kop zet. 1 voor de kop die de pagina opent, 2
 * voor alle andere. Wat een sectie binnenin heeft — kaartkoppen, koppen in
 * lopende tekst — zakt daaronder mee.
 */
export type KopNiveau = 1 | 2;

/**
 * Kan deze sectie de kop van de pagina dragen?
 *
 * Alleen een sectie met één kop erboven kan dat. Een splitscreen heeft er twee
 * die naast elkaar staan en geen van beide is de kop van de pagina; citaten
 * hebben er geen. Die twee slaan hun beurt over, en de eerstvolgende sectie die
 * het wel kan, opent de pagina.
 *
 * EEN LEGE KOP DRAAGT NIETS. kop-tekst, beeld-tekst en oproep stonden hier
 * onvoorwaardelijk op true, want hun kop is in het CMS verplicht. Sinds die drie
 * net als een lege rijke tekst niets renderen als er niets in staat, klopt dat
 * niet meer: een sectie die niet op de pagina komt, zou de <h1> opeisen en de
 * pagina zonder kop achterlaten. Nu vragen ze alle zes hetzelfde — is er een
 * kop? — en schuift de beurt door naar de eerstvolgende sectie die er wél een
 * heeft.
 *
 * Hero staat er bewust nog wel onvoorwaardelijk in: die rendert altijd, ook
 * zonder kop, en is geen van de zes types die deze ronde een nultak kregen.
 */
function draagtPaginakop(sectie: Sectie): boolean {
  switch (sectie.type) {
    /*
     * Ook de opening alleen mét kop. Een hero zonder kop kreeg eerst toch de
     * <h1>-rol, en die werd dan een leeg kopelement. Nu schuift de rol door
     * naar de volgende sectie met een kop — en is die er niet, dan valt
     * check-koppen over een pagina zonder <h1>, wat hier ook terecht is.
     */
    case 'hero':
    case 'kop-tekst':
    case 'beeld-tekst':
    case 'oproep':
    case 'drie-kolommen':
    case 'rijke-tekst':
    case 'accordeon':
      return Boolean(sectie.kop?.trim());
    /*
     * Het formulier draagt een kop als het er een heeft, net als de rest. Het
     * staat apart genoemd omdat het niet in de nultak-groep hoort: een
     * formulier zonder kop is nog steeds een formulier en blijft renderen.
     */
    case 'formulier':
      return Boolean(sectie.kop?.trim());
    case 'splitscreen':
    case 'citaten':
      return false;
  }
}

/**
 * Een sectietype dat we niet kennen. Tijdens ontwikkeling zichtbaar in beeld,
 * met het type erbij zodat je meteen weet wat er misging. In productie niets:
 * een bezoeker heeft niets aan een foutmelding en een halve pagina is beter
 * dan een kapotte.
 */
function OnbekendType({ type }: { type: string }) {
  if (!import.meta.env.DEV) return null;

  return (
    <div
      role="alert"
      className="mx-auto my-6 max-w-basis border-2 border-dashed border-lijn-sterk bg-vlak-verhoogd px-marge py-sectie-s text-lopend-m text-tekst"
    >
      Onbekend sectietype: <code className="text-tekst-zacht">{type}</code>. Voeg het toe aan de
      union en de switch in src/lib/SectionRenderer.tsx.
    </div>
  );
}

/*
 * De hele pagina in één keer.
 *
 * Alleen hier is te zien wat er vóór een sectie staat, en dat is precies wat
 * het kopniveau bepaalt. Een sectie los renderen kan dat niet weten, dus die
 * weg loopt altijd op meerdere <h1> of op geen enkele uit.
 *
 * Drie regels die het design system stelt en die hier worden afgedwongen:
 *
 *   - één <h1> per pagina, van de eerste sectie die er een kan dragen
 *   - een tweede openingssectie levert géén tweede <h1>, en ook geen tweede
 *     display-xl: die zakt naar een gewone sectiekop
 *   - koppen gaan nooit omhoog halverwege de pagina, want alles na de eerste
 *     staat op niveau 2
 *
 * Staat er geen enkele sectie die een kop kan dragen, dan heeft de pagina geen
 * <h1>. Dat wordt hier niet stilletjes gerepareerd — er valt niets te kiezen —
 * maar scripts/check-koppen.mjs laat de build erop vallen.
 */
export function SectieLijst({ secties }: { secties: Sectie[] }) {
  let kopGebruikt = false;

  /*
   * De pijl mag één keer per pagina, en dat wordt hier beslist en niet in de
   * sectie. Om dezelfde reden als het kopniveau: een sectie kan niet zien wat
   * er vóór haar staat, dus twee oproepen die er allebei om vragen zouden er
   * allebei een krijgen. Een pijl die twee dingen tegelijk aanwijst, wijst
   * niets aan.
   *
   * De eerste die erom vraagt, krijgt hem. Dat is dezelfde regel als bij de
   * paginakop, en hij is net zo goed te lezen in de bron: wie de pijl lager op
   * de pagina wil, vinkt hem bij de bovenste sectie uit.
   *
   * EN ALLEEN EEN OPROEP MET EEN KNOP VERBRUIKT DE BEURT. Een pijl wijst naar
   * een knop; is er geen, dan is er niets om naar te wijzen en toont Oproep hem
   * niet. Telde zo'n sectie tóch mee, dan raakte de pijl van de pagina af
   * zonder dat er ergens een pijl kwam te staan — een lege oproep bovenaan zou
   * de pijl van de echte oproep eronder opeten, zonder melding.
   *
   * Dat is geen bedacht geval: het geval "pijl · zonder knop" op /secties liet
   * het meteen zien. Eén pijl op een pagina waar er twee hoorden te staan, en
   * dat verschil zie je alleen als je telt.
   */
  let pijlGebruikt = false;

  return (
    <>
      {secties.map((sectie, index) => {
        const opentPagina = !kopGebruikt && draagtPaginakop(sectie);
        if (opentPagina) kopGebruikt = true;

        const krijgtPijl =
          !pijlGebruikt &&
          sectie.type === 'oproep' &&
          Boolean(sectie.pijl) &&
          Boolean(sectie.knop?.label.trim());
        if (krijgtPijl) pijlGebruikt = true;

        return (
          <Fragment key={`${sectie.type}-${index}`}>
            <SectionRenderer
              sectie={sectie}
              kopNiveau={opentPagina ? 1 : 2}
              pijl={krijgtPijl}
            />
          </Fragment>
        );
      })}
    </>
  );
}

export default function SectionRenderer({
  sectie,
  kopNiveau = 2,
  pijl = false,
}: {
  sectie: Sectie;
  kopNiveau?: KopNiveau;
  /**
   * Toegekend door SectieLijst, want alleen daar is te zien of er al een pijl
   * op deze pagina staat. Een sectie die los gerenderd wordt, krijgt er geen.
   */
  pijl?: boolean;
}) {
  switch (sectie.type) {
    case 'hero': {
      const { type: _type, ...props } = sectie;
      return <Hero {...props} kopNiveau={kopNiveau} />;
    }
    case 'splitscreen': {
      const { type: _type, ...props } = sectie;
      return <Splitscreen {...props} />;
    }
    case 'kop-tekst': {
      const { type: _type, ...props } = sectie;
      return <KopTekst {...props} kopNiveau={kopNiveau} />;
    }
    case 'beeld-tekst': {
      const { type: _type, ...props } = sectie;
      return <BeeldTekst {...props} kopNiveau={kopNiveau} />;
    }
    case 'drie-kolommen': {
      const { type: _type, ...props } = sectie;
      return <DrieKolommen {...props} kopNiveau={kopNiveau} />;
    }
    case 'citaten': {
      const { type: _type, ...props } = sectie;
      return <Citaten {...props} />;
    }
    case 'oproep': {
      const { type: _type, pijl: _gevraagd, ...props } = sectie;
      return <Oproep {...props} kopNiveau={kopNiveau} pijl={pijl} />;
    }
    case 'formulier': {
      const { type: _type, ...props } = sectie;
      return <Formulier {...props} kopNiveau={kopNiveau} />;
    }
    case 'rijke-tekst': {
      const { type: _type, ...props } = sectie;
      return <RijkeTekst {...props} kopNiveau={kopNiveau} />;
    }
    case 'accordeon': {
      const { type: _type, ...props } = sectie;
      return <Accordeon {...props} kopNiveau={kopNiveau} />;
    }
    default: {
      // Compileerfout zodra de union een type kent dat hierboven geen case
      // heeft. De cast erna is voor data die pas tijdens runtime binnenkomt.
      const uitputtend: never = sectie;
      return <OnbekendType type={String((uitputtend as { type: unknown }).type)} />;
    }
  }
}
