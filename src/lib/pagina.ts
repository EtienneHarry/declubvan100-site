import { createReader } from '@keystatic/core/reader';
import { formulierActief } from './formulier-velden';

import keystaticConfig from '../../keystatic.config';
import type { Sectie } from './SectionRenderer';

/*
 * Van CMS-data naar sectieprops.
 *
 * Het CMS en de secties zijn het over bijna alles eens — de blokken heten
 * hetzelfde als de sectietypes en de velden ook. Er zijn drie plekken waar ze
 * uit elkaar lopen, en die worden hier rechtgetrokken:
 *
 *   1. Achtergrond, ruimte en breedte staan in het CMS gegroepeerd onder
 *      "Weergave", want dat leest beter voor de redacteur. De secties nemen ze
 *      als losse props.
 *   2. Een leeg tekstveld komt als lege string binnen. De secties laten een
 *      leeg deel weg, dus dat werkt vanzelf; een leeg knopobject moet wel
 *      verdwijnen, anders komt er een knop zonder tekst.
 *   3. De foto's van splitscreen liggen in de code vast en staan dus niet in
 *      het CMS.
 *
 * Dit is bewust geen derde koppelbestand. Het koppelt niets nieuws vast: het
 * vertaalt alleen de vorm van het CMS naar de vorm die SectionRenderer al
 * kent, en breekt zodra een van beide verandert.
 */

const reader = createReader(process.cwd(), keystaticConfig);

type PaginaNaam = 'home' | 'opdrachtgevers' | 'de100' | 'contact' | 'voorwaarden' | 'privacy';

/**
 * De deuren van het splitscreen krijgen hun foto uit de code, op volgorde.
 *
 * De redacteur kiest deze niet. Een splitscreen is de opening van de home met
 * twee vaste deuren — opdrachtgevers en professionals — en welke foto daarbij
 * hoort is een ontwerpbeslissing, geen redactionele.
 */
const DEURBEELDEN: { bron: string; alt: string }[] = [
  { bron: '/beeld/bar-pouring.jpg', alt: 'Bartender schenkt een glas in bij warm binnenlicht' },
  { bron: '/beeld/ploeg-drie.jpg', alt: 'Drie collega’s achter de tap' },
];

/** Een knop zonder tekst of zonder doel is geen knop. */
function knopUit(knop: { label: string; href: string } | null | undefined) {
  if (!knop?.label.trim() || !knop.href.trim()) return undefined;
  return { label: knop.label, href: knop.href };
}

/** Beeld zonder bron valt weg; de sectie loopt dan over de volle breedte door. */
function beeldUit(beeld: { bron: string | null; alt: string } | null | undefined) {
  if (!beeld?.bron?.trim()) return undefined;
  return { bron: beeld.bron, alt: beeld.alt };
}

function tekstUit(tekst: string | null | undefined) {
  return tekst?.trim() ? tekst : undefined;
}

/**
 * Leest een pagina uit het CMS en levert de sectielijst die SectionRenderer
 * verwacht. Ontbreekt de pagina, dan breekt de build hier af: een lege pagina
 * ziet er af en toe gewoon uit en zou dus stilletjes live kunnen gaan.
 */
export async function leesPagina(naam: PaginaNaam) {
  const pagina = await reader.singletons[naam].read();

  if (!pagina) {
    throw new Error(
      `src/content/paginas/${naam}.yaml ontbreekt of is onleesbaar; de pagina kan niet worden opgebouwd.`,
    );
  }

  const secties: Sectie[] = pagina.secties.map((blok): Sectie => {
    const { achtergrond, ruimte, breedte } = blok.value.weergave;
    const basis = { achtergrond, ruimte, breedte };

    switch (blok.discriminant) {
      case 'hero':
        return {
          type: 'hero',
          ...basis,
          bovenkop: tekstUit(blok.value.bovenkop),
          kop: blok.value.kop,
          tekst: tekstUit(blok.value.tekst),
          knop: knopUit(blok.value.knop),
          tweedeKnop: knopUit(blok.value.tweedeKnop),
          // Het vinkje staat vóór het beeld: uit betekent geen object om uit
          // te lezen, niet een leeg object.
          beeld: blok.value.beeld.discriminant ? beeldUit(blok.value.beeld.value) : undefined,
          schicht: blok.value.schicht,
          vullend: blok.value.vullend,
          dubbellaags: blok.value.dubbellaags,
        };

      case 'splitscreen':
        return {
          type: 'splitscreen',
          ...basis,
          deuren: blok.value.deuren.map((deur, index) => ({
            bovenkop: tekstUit(deur.bovenkop),
            kop: deur.kop,
            tekst: tekstUit(deur.tekst),
            knop: knopUit(deur.knop),
            beeld: DEURBEELDEN[index],
          })),
        };

      case 'kop-tekst':
        return {
          type: 'kop-tekst',
          ...basis,
          bovenkop: tekstUit(blok.value.bovenkop),
          kop: blok.value.kop,
          tekst: tekstUit(blok.value.tekst),
        };

      case 'beeld-tekst':
        return {
          type: 'beeld-tekst',
          ...basis,
          bovenkop: tekstUit(blok.value.bovenkop),
          kop: blok.value.kop,
          tekst: tekstUit(blok.value.tekst),
          beeld: beeldUit(blok.value.beeld),
          beeldPositie: blok.value.beeldPositie,
          verhouding: blok.value.verhouding,
        };

      case 'drie-kolommen':
        return {
          type: 'drie-kolommen',
          ...basis,
          bovenkop: tekstUit(blok.value.bovenkop),
          kop: tekstUit(blok.value.kop),
          items: blok.value.items.map((item) => ({
            nummer: tekstUit(item.nummer),
            kop: item.kop,
            tekst: tekstUit(item.tekst),
            href: tekstUit(item.href),
            beeld: item.beeld.discriminant ? (beeldUit(item.beeld.value) ?? undefined) : undefined,
            taal: item.taal === 'en' ? ('en' as const) : undefined,
          })),
          handschrift: tekstUit(blok.value.handschrift),
        };

      case 'citaten':
        return {
          type: 'citaten',
          ...basis,
          bovenkop: tekstUit(blok.value.bovenkop),
          items: blok.value.items.map((item) => ({
            citaat: item.citaat,
            naam: tekstUit(item.naam),
            rol: tekstUit(item.rol),
          })),
        };

      case 'oproep':
        return {
          type: 'oproep',
          ...basis,
          bovenkop: tekstUit(blok.value.bovenkop),
          kop: blok.value.kop,
          tekst: tekstUit(blok.value.tekst),
          knop: knopUit(blok.value.knop),
          tweedeKnop: knopUit(blok.value.tweedeKnop),
          pijl: blok.value.pijl,
        };

      /*
       * De velden van het formulier staan hier niet en komen ook niet uit het
       * CMS. Ze liggen vast in Formulier.tsx omdat de privacyverklaring op
       * /privacy belooft welke gegevens wij vragen; een veld erbij is dus een
       * wijziging aan die tekst en niet aan een sectie.
       */
      case 'formulier':
        return {
          type: 'formulier',
          ...basis,
          variant: blok.value.variant,
          actief: formulierActief(),
          bovenkop: tekstUit(blok.value.bovenkop),
          kop: blok.value.kop,
          tekst: tekstUit(blok.value.tekst),
        };

      case 'rijke-tekst':
        return {
          type: 'rijke-tekst',
          ...basis,
          kop: tekstUit(blok.value.kop),
          inhoud: blok.value.inhoud.node,
          schichtLijst: blok.value.schichtLijst,
        };

      case 'accordeon':
        return {
          type: 'accordeon',
          ...basis,
          bovenkop: tekstUit(blok.value.bovenkop),
          kop: tekstUit(blok.value.kop),
          items: blok.value.items.map((item) => ({
            vraag: item.vraag,
            antwoord: item.antwoord.node,
          })),
        };

      default: {
        // Compileerfout zodra het schema een blok kent dat hier geen tak heeft.
        const uitputtend: never = blok;
        throw new Error(`Onbekend sectieblok in het CMS: ${JSON.stringify(uitputtend)}`);
      }
    }
  });

  return { titel: pagina.titel, beschrijving: pagina.beschrijving, secties };
}
