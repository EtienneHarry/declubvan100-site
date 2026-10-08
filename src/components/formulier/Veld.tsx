import type { VeldDefinitie } from '../../lib/formulier-velden';

export interface VeldProps {
  veld: VeldDefinitie;
  /**
   * Komt vóór de veldnaam in de id, zodat twee formulieren op één pagina geen
   * label hebben dat naar het veld van de ander wijst. De `name` blijft kaal.
   */
  voorvoegsel: string;
  /** Wat er nú moet gebeuren, niet wat er stuk is. Leeg betekent geen fout. */
  fout?: string;
  /** Blijft staan na een afgekeurde inzending, zodat niemand opnieuw typt. */
  waarde?: string;
}

/*
 * Eén veld in een formulier: label, invoer en de foutregel eronder.
 *
 * DE DEFINITIE KOMT BINNEN, NIET DE LOSSE EIGENSCHAPPEN. Label, soort en of het
 * veld verplicht is staan in src/lib/formulier-velden.ts, en daar leest ook de
 * servervalidatie uit. Zou dit component zijn eigen props krijgen, dan kan het
 * label hier iets anders zeggen dan waar de server op controleert.
 *
 * `required` EN `type="email"` STAAN IN DE HTML. Dat is het vangnet voor wie
 * geen JavaScript heeft: de browser houdt dan zelf een leeg verplicht veld
 * tegen, in de taal van de bezoeker. FormulierScript zet `noValidate` bij het
 * laden en neemt het over met onze eigen meldingen, op dezelfde plek als de
 * serverfouten — zie dat bestand.
 *
 * (Een eerdere versie zette `noValidate` in de HTML, met als reden dat Chrome
 * Engelse meldingen toont. Dat klopte niet: die meldingen volgen de taal van de
 * browser, en wat ik zag kwam van mijn eigen omgeving.)
 *
 * De ids worden afgeleid van het voorvoegsel en de veldnaam, zodat label,
 * invoer en foutregel aan elkaar hangen zonder dat iemand ze met de hand gelijk
 * hoeft te houden.
 */

const LABEL = 'block font-semibold text-lopend-s text-tekst';
const HINT = 'font-normal text-tekst-stil';

/*
 * Het verhoogde vlak, zoals het design system het voor invoervelden aanwijst.
 * Niet `bg-roet` maar `bg-vlak-verhoogd`: dat is de semantische alias die per
 * thema kantelt — roet op een donkere sectie, mist op een lichte. Met de rauwe
 * kleur zou een formulier op papier een zwart veld krijgen.
 *
 * De rand is er voor het contrast tegen de achtergrond: het verhoogde vlak
 * verschilt maar weinig van de sectie eronder, en een veld dat je niet ziet
 * staan nodigt niet uit om ingevuld te worden.
 */
const INVOER =
  'block w-full rounded-veld border bg-vlak-verhoogd px-4 text-lopend-m text-tekst ' +
  'placeholder:text-tekst-stil ' +
  '[transition:border-color_var(--duur-1)_var(--soepel-uit)]';

/*
 * De sterke lijn en niet de gewone, en dat is gemeten. Met `border-lijn` haalde
 * de rand over het roet-veld tegen de bruine sectie 1,88:1, en het veldvlak
 * zelf tegen bruin 1,13:1 — niets bakende het veld met de 3:1 af die WCAG 1.4.11
 * aan een invoerveld stelt; pas bij hover kwam de sterke lijn. Met
 * `border-lijn-sterk` is dat 3,46:1 op donker en 3,00:1 over mist op papier.
 * Hover gaat een stap verder, naar de gedempte tekstkleur.
 */
const INVOER_NORMAAL = 'border-lijn-sterk hover:border-tekst-zacht';
const INVOER_FOUT = 'border-vuur';

export default function Veld({ veld, voorvoegsel, fout, waarde }: VeldProps) {
  const id = `${voorvoegsel}-${veld.naam}`;
  const foutId = `${id}-fout`;
  const heeftFout = Boolean(fout);
  const randen = heeftFout ? INVOER_FOUT : INVOER_NORMAAL;

  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {veld.label}
        {veld.optioneel ? <span className={HINT}> — mag je overslaan</span> : null}
      </label>

      {/*
        De attributen staan bij allebei uitgeschreven en niet in een gedeeld
        object dat erover gespreid wordt. Dit project staat geen
        spread-attributen toe — zie de vaste regels in CLAUDE.md — en de reden
        is hier zichtbaar: met een spread is aan de aanroep niet te zien welke
        attributen er op het element belanden.
      */}
      {veld.soort === 'bericht' ? (
        <textarea
          id={id}
          name={veld.naam}
          defaultValue={waarde}
          required={!veld.optioneel}
          maxLength={veld.max}
          rows={5}
          aria-invalid={heeftFout || undefined}
          aria-describedby={heeftFout ? foutId : undefined}
          className={`${INVOER} ${randen} mt-2 py-3`}
        />
      ) : (
        <input
          id={id}
          name={veld.naam}
          defaultValue={waarde}
          required={!veld.optioneel}
          maxLength={veld.max}
          type={veld.soort === 'email' ? 'email' : veld.soort === 'telefoon' ? 'tel' : 'text'}
          autoComplete={veld.autoComplete}
          aria-invalid={heeftFout || undefined}
          aria-describedby={heeftFout ? foutId : undefined}
          className={`${INVOER} ${randen} mt-2 min-h-14`}
        />
      )}

      {/*
        De foutregel staat ónder het veld en niet erboven: wie met de tab door
        het formulier loopt, komt hem tegen nadat hij het veld heeft gehoord, en
        aria-describedby koppelt hem er hoe dan ook aan.

        Hij staat er altijd, ook leeg. Dat is met opzet: het script vult hem bij
        een clientfout, en een element dat al in de DOM staat hoeft dan niet
        aangemaakt te worden — schermlezers kondigen een wijziging in bestaande
        tekst betrouwbaarder aan dan een element dat plotseling verschijnt.
      */}
      <p
        id={foutId}
        data-veld-fout={veld.naam}
        className={`mt-2 text-lopend-s text-tekst-fout ${heeftFout ? '' : 'hidden'}`}
      >
        {fout ?? ''}
      </p>
    </div>
  );
}
