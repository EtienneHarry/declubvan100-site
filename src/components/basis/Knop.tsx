import type { ReactNode } from 'react';

export type KnopVariant = 'vol' | 'vuur' | 'inkt' | 'lijn' | 'kaal';
export type KnopMaat = 's' | 'm' | 'l';

export interface KnopProps {
  /**
   * vol, vuur en inkt zijn alle drie gevuld: max 1 per blikveld. lijn is
   * secundair, kaal tertiair.
   *
   * vuur is de knop uit de mockup en de primaire actie van de site. inkt is de
   * zwarte knop ernaast, met cream als tekst. vol is de witte knop van vóór de
   * restyle; die blijft bestaan omdat het design system hem als primair kent,
   * maar de mockup gebruikt hem nergens.
   */
  variant?: KnopVariant;
  maat?: KnopMaat;
  /** Volle breedte. Alleen in formulieren en op mobiel. */
  breed?: boolean;
  /** Laadstatus: de tekst verdwijnt, de spinner verschijnt, de knop blijft even breed. */
  laadt?: boolean;
  disabled?: boolean;
  /** Met href rendert de knop als link. */
  href?: string;
  /**
   * Verstuurt deze knop een formulier?
   *
   * De standaard is 'button' en dat is met opzet: een knop zonder type binnen
   * een <form> verstuurt hem, en dat is precies het ongeluk dat je niet wilt bij
   * een knop die ergens anders voor staat. Alleen de verzendknop van een
   * formulier zet dit op 'submit'.
   *
   * Het is de enige losse DOM-eigenschap die dit component doorlaat. Dat is
   * verdedigbaar omdat het geen opmaak is maar gedrag, en omdat er geen andere
   * manier is om een formulier te versturen met de knop van dit design system.
   */
  type?: 'button' | 'submit';
  icoonLinks?: ReactNode;
  icoonRechts?: ReactNode;
  children: ReactNode;
}

/*
 * De knop. Rechthoekig, hoofdletters, tekst in de stem van de bezoeker —
 * "Stuur maar", niet "Verzenden".
 *
 * Afwijking van het propscontract: `as` en losse DOM-attributen ontbreken. Het
 * contract erft van ButtonHTMLAttributes, maar dit project staat geen
 * spread-attributen, className of style van buitenaf toe. `onClick` ontbreekt
 * om dezelfde reden plus een tweede: alles is nu statisch voorgerenderd, dus
 * een handler zou toch niet meelopen zonder hydratatie.
 *
 * De maten verschillen alleen in hoogte en padding, niet in lettergrootte. Het
 * design system zet daar .9375rem en 1.125rem neer, maar daar bestaat geen
 * token voor; `--text-knop` geldt dus voor alle drie.
 *
 * De knoptekst staat sinds de restyle in de typemachine: hoofdletters op
 * --machine-tracking, precies zoals de mockup. Dat is een van de drie plekken
 * waar die familie mag komen; zie het typografiehoofdstuk van
 * design-system.md.
 */
/*
 * Motion: kleur en lijn wisselen op --duur-1, de indruk op --duur-2. Dat zijn
 * twee verschillende duren op één element, dus dit gaat via de
 * transition-shorthand; een losse duration-klasse zou beide over één kam
 * scheren. De curve is --soepel-uit, de standaard voor alles wat verschijnt.
 *
 * De indruk loopt op `scale` en niet op `transform`. Tailwind 4 zet
 * `active:scale-[…]` op de losse scale-property, en een transitie op transform
 * raakt die niet: tot B16 sprong de indruk in één beeldje. Dezelfde valkuil als
 * de zoom in Beeldvlak, en net zo onzichtbaar aan de klassenaam.
 *
 * Bij prefers-reduced-motion zet de regel in tokens.css elke transitie op 1ms.
 */
const basis =
  'relative inline-flex items-center justify-center gap-2 rounded-none border-2 border-transparent font-machine text-knop uppercase no-underline ' +
  '[transition:background-color_var(--duur-1)_var(--soepel-uit),border-color_var(--duur-1)_var(--soepel-uit),color_var(--duur-1)_var(--soepel-uit),opacity_var(--duur-1)_var(--soepel-uit),scale_var(--duur-2)_var(--soepel-uit)]';

/*
 * De hover van vuur en inkt loopt via dekking en niet via een tweede kleur.
 * Een hovertoken erbij zou een waarde zijn die de mockup niet meet; met
 * dekking laat de knop een tikje van de sectie erdoor en dat werkt op elke
 * achtergrond dezelfde kant op. De lijnvariant deed dat al.
 *
 * De tekst op vuur is wit en niet cream: cream haalt er 3,69:1 en dus alleen
 * de groot-tekstdrempel. Zie het contrasthoofdstuk.
 *
 * DE LIJNVARIANT IS HET PAAR VAN VUUR. Hij stond op een neutrale grijze rand
 * met de tekstkleur erin; nu heeft hij de rand van vuur, een doorzichtige
 * vulling en cream als tekst. Zo horen de twee knoppen naast elkaar zichtbaar
 * bij elkaar: dezelfde kleur, de een gevuld en de ander open, en dat is de
 * rangorde zonder een tweede accentkleur.
 *
 * De hover tint met vuur en niet meer met de tekstkleur, om dezelfde reden.
 *
 * EN CREAM GELDT ALLEEN OP DONKER. Cream is een primitief en kantelt niet mee
 * met het thema, dus op een papieren sectie zou het lichte tekst op een lichte
 * ondergrond zijn: gemeten 1,44:1, onleesbaar. Op een lichte sectie valt de
 * tekst daarom terug op --tekst, dat daar inkt is. Dezelfde constructie als de
 * schaduw in Kaart.
 *
 * Dat is een afwijking van de opdracht ("cream tekst") en geen vergissing: op
 * elke sectie waar vandaag een knop staat is de achtergrond donker en krijg je
 * gewoon cream. De lichte tak is er voor de sectie die er nog niet is, en voor
 * /secties waar alle varianten op beide vlakken staan.
 *
 * EN OP EEN FOTO IS HIJ KRIJT. Dat is de regel uit tokens.css voor tekst op
 * beeld: "Cream haalt daar 3,29:1 en is dus geen tekstkleur op beeld." De
 * lijnknop "Inhuren" staat in de homehero op de foto, en gemeten op die foto
 * met de sluier erover zakte cream in de knoppenzone bij 11,7% van de pixels
 * onder 4,5:1 — knoptekst van 17px vet is geen grote tekst. Krijt haalt op de
 * sluier in het slechtste geval 5,04:1. [data-vlak=beeld] zet Beeldvlak zelf.
 */
const variantKlasse: Record<KnopVariant, string> = {
  vol: 'bg-tekst text-vlak border-tekst hover:bg-tekst-zacht hover:border-tekst-zacht active:bg-tekst-stil active:border-tekst-stil',
  vuur: 'bg-vuur text-krijt border-vuur hover:bg-vuur/88 hover:border-vuur/88 active:bg-vuur/76 active:border-vuur/76',
  inkt: 'bg-inkt text-cream border-inkt hover:bg-inkt/88 hover:border-inkt/88 active:bg-inkt/76 active:border-inkt/76',
  lijn:
    'bg-transparent text-cream border-vuur hover:bg-vuur/12 active:bg-vuur/20 ' +
    '[[data-thema=licht]_&]:text-tekst [[data-vlak=beeld]_&]:text-krijt',
  kaal: 'bg-transparent text-tekst border-transparent hover:text-tekst-zacht hover:underline active:text-tekst-stil',
};

const maatKlasse: Record<KnopMaat, string> = {
  s: 'min-h-9 px-4',
  m: 'min-h-11 px-6',
  l: 'min-h-14 px-8',
};

/** Kaal heeft een smallere binnenmarge dan de andere varianten. */
const kaalMaatKlasse: Record<KnopMaat, string> = {
  s: 'min-h-9 px-2',
  m: 'min-h-11 px-2',
  l: 'min-h-14 px-2',
};

function Spinner() {
  return (
    <span className="absolute inset-0 grid place-items-center">
      {/* motion-safe, niet de globale 1ms-regel: die zou de spinner juist
          razendsnel laten tollen in plaats van tot rust te brengen. Wie
          gereduceerde beweging vraagt, krijgt een stilstaande ring. */}
      <span className="block size-5 rounded-vol border-2 border-current/30 border-t-current motion-safe:animate-spin" />
    </span>
  );
}

export default function Knop({
  variant = 'vol',
  maat = 'm',
  breed = false,
  laadt = false,
  disabled = false,
  href,
  type = 'button',
  icoonLinks,
  icoonRechts,
  children,
}: KnopProps) {
  const uitgeschakeld = disabled || laadt;

  const klassen = [
    basis,
    variantKlasse[variant],
    variant === 'kaal' ? kaalMaatKlasse[maat] : maatKlasse[maat],
    breed ? 'w-full' : '',
    laadt ? 'cursor-progress text-transparent' : 'cursor-pointer',
    // De indruk bij :active. Geen veer, geen bounce — één stap kleiner.
    uitgeschakeld ? '' : 'active:scale-[var(--indruk)]',
    disabled ? 'cursor-not-allowed opacity-38' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inhoud = (
    <>
      {icoonLinks}
      <span className={laadt ? 'invisible' : undefined}>{children}</span>
      {icoonRechts}
      {laadt ? <Spinner /> : null}
    </>
  );

  if (href && !uitgeschakeld) {
    return (
      <a href={href} className={klassen}>
        {inhoud}
      </a>
    );
  }

  // Een uitgeschakelde link bestaat niet; die wordt een knop die niets doet.
  return (
    <button type={type} className={klassen} disabled={uitgeschakeld} aria-busy={laadt}>
      {inhoud}
    </button>
  );
}
