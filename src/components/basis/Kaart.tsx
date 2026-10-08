import type { ReactNode } from 'react';

import { beeldSrcset } from '../../lib/beeld';
import { sizes } from '../../lib/breekpunten';
import { verhoudingKlasse } from '../../lib/tokens';

export interface KaartProps {
  /**
   * Foto boven de inhoud, altijd op 4:5. De verhouding ligt vast omdat de
   * kaarten naast elkaar staan: één afwijkende foto zet de hele rij scheef.
   * De tekst staat onder de foto en niet erop, dus dit gaat — net als bij
   * BeeldTekst — bewust niet via Beeldvlak: de sluier heeft hier geen functie.
   */
  beeld?: { bron: string; alt: string };
  /**
   * verhoogd = vlak in roet of mist; vlak = alleen een lijn; kaal = geen
   * kader en geen binnenruimte, alleen de inhoud.
   */
  variant?: 'verhoogd' | 'vlak' | 'kaal';
  /** Volgnummer of telwaarde, boven de kop. Staat op tabular-nums. */
  nummer?: ReactNode;
  kop?: ReactNode;
  tekst?: ReactNode;
  /** Blok onderaan; blijft op de bodem staan, ook als kaarten verschillen in hoogte. */
  voet?: ReactNode;
  href?: string;
  disabled?: boolean;
  /** Toont een skelet in plaats van de inhoud. */
  laadt?: boolean;
  /**
   * Het kopniveau van de kaartkop. Gezet door de sectie eromheen, zodat de
   * kaarten netjes onder de sectiekop hangen en er geen niveau wordt
   * overgeslagen.
   */
  kopNiveau?: 2 | 3 | 4;
  /**
   * De taal van de kop, als die afwijkt van de pagina. Het drieluik op Voor
   * wie is de club? heeft Engelse koppen op een Nederlandse pagina, en zonder
   * lang-attribuut las een schermlezer "Work when you want" met een
   * Nederlandse stem voor (WCAG 3.1.2).
   */
  taal?: 'nl' | 'en';
}

/*
 * De kaart, voor alles wat in een raster staat.
 *
 * Hoekig en met een lijn in plaats van een schaduw: op zwart bestaat schaduw
 * niet, diepte is een verhoogd vlak plus een lijn. Op een lichte achtergrond
 * komt er via [data-thema="licht"] wel een schaduw bij op hover.
 *
 * Klikbaar wordt hij zodra er een href meegaat; dan rendert hij als <a>.
 * onClick zit er niet in — alles is statisch voorgerenderd.
 */
function Skelet({ klasse }: { klasse: string }) {
  // Zie de spinner in Knop: motion-safe in plaats van de globale 1ms-regel.
  return <span className={`block rounded-none bg-tekst/10 motion-safe:animate-pulse ${klasse}`} />;
}

export default function Kaart({
  variant = 'verhoogd',
  beeld,
  nummer,
  kop,
  tekst,
  voet,
  href,
  disabled = false,
  laadt = false,
  kopNiveau = 3,
  taal,
}: KaartProps) {
  const Kop = `h${kopNiveau}` as 'h2' | 'h3' | 'h4';
  const klikbaar = Boolean(href) && !disabled && !laadt;
  // Zonder kader is er ook geen binnenruimte, en dus niets om met negatieve
  // marges op te heffen als er een foto boven staat.
  const kaal = variant === 'kaal';

  const klassen = [
    // Lijn en vlak op --duur-1, de verschuiving op --duur-2, curve --soepel-uit.
    // grow: in het raster van DrieKolommen vult de kaart zijn hele cel, zodat
    // kaarten naast elkaar even hoog zijn ongeacht hun tekst. Buiten een
    // flexkolom doet grow niets.
    'relative flex grow flex-col rounded-none ' +
      (kaal ? '' : 'border border-lijn p-6 ') +
      '[transition:background-color_var(--duur-1)_var(--soepel-uit),border-color_var(--duur-1)_var(--soepel-uit),box-shadow_var(--duur-1)_var(--soepel-uit),translate_var(--duur-2)_var(--soepel-uit),scale_var(--duur-2)_var(--soepel-uit)]',
    variant === 'verhoogd' ? 'bg-vlak-verhoogd' : 'bg-transparent',
    klikbaar
      ? 'no-underline hover:border-lijn-sterk hover:-translate-y-0.5 active:translate-y-0 active:scale-[var(--indruk)] ' +
        // Op zwart bestaat schaduw niet; op papier en mist mag er wel een korte
        // bij. Vandaar de voorouder-selector op data-thema.
        '[[data-thema=licht]_&]:hover:shadow-licht-2'
      : '',
    disabled ? 'pointer-events-none opacity-38' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inhoud = laadt ? (
    <>
      <Skelet klasse="mb-4 h-4 w-16" />
      <Skelet klasse="mb-3 h-6 w-3/4" />
      <Skelet klasse="h-4 w-full" />
    </>
  ) : (
    <>
      {/*
        De foto loopt tot de rand van de kaart: de negatieve marges heffen de
        padding op, zodat het beeld het kader vult en de tekst eronder zijn
        gewone binnenruimte houdt. object-cover snijdt de foto op 4:5, zoals
        overal waar een beeld in een vast vlak valt.
      */}
      {beeld?.bron.trim() ? (
        <div
          className={`relative mb-6 overflow-hidden ${kaal ? '' : '-mx-6 -mt-6'} ${verhoudingKlasse['portret']}`}
        >
          {/*
            Het raster van DrieKolommen loopt van een naar twee naar drie
            kolommen. Zonder sizes gaat de browser uit van de volle
            vensterbreedte en haalt hij voor een kaart van een derde toch de
            grootste variant op.
          */}
          <img
            src={beeld.bron}
            srcSet={beeldSrcset(beeld.bron)}
            sizes={sizes(
              [
                ['lg', '33vw'],
                ['sm', '50vw'],
              ],
              '100vw',
            )}
            alt={beeld.alt}
            // Een kaart staat nooit in de opening: lui laden, zodat hij niet
            // concurreert met wat de bezoeker als eerste ziet.
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      ) : null}
      {nummer ? (
        <span className="mb-4 font-machine text-bovenkop text-tekst-stil tabular-nums uppercase">
          {nummer}
        </span>
      ) : null}
      {kop ? <Kop lang={taal === 'en' ? 'en' : undefined} className="mb-2 text-kop-m text-balance break-words">{kop}</Kop> : null}
      {tekst ? <p className="text-lopend-m text-tekst-zacht">{tekst}</p> : null}
      {voet ? <div className="mt-auto pt-6">{voet}</div> : null}
    </>
  );

  if (klikbaar && href) {
    return (
      <a href={href} className={klassen}>
        {inhoud}
      </a>
    );
  }

  return (
    <div className={klassen} aria-busy={laadt || undefined}>
      {inhoud}
    </div>
  );
}
