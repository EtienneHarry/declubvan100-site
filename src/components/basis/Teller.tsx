export interface TellerProps {
  /** De koptekst. Het eerste getal van drie cijfers wordt de teller. */
  tekst: string;
}

/*
 * Een kop waarin het getal van 0 naar zijn eindwaarde telt.
 *
 * Los component en geen optie op Hero. Hero geeft zijn kop hier doorheen en
 * weet verder van niets; wie het gedrag wil begrijpen, hoeft maar één bestand
 * te lezen.
 *
 * HET GETAL STAAT LETTERLIJK IN DE HTML, EN MAAR ÉÉN KEER. Dit component
 * rendert 100, niet 0, en geen tweede kopie voor schermlezers. Die kopie stond
 * er tot B16 wel — een aria-hidden teller met een sr-only 100 ernaast — en
 * daardoor las de kop voor elke crawler, voor leesmodus en voor wie hem
 * kopieerde als "De Club van 100100". TellerScript zet de schermlezerskopie nu
 * alleen neer zolang er geteld wordt, en haalt hem daarna weer weg.
 *
 * ALLEEN EEN GETAL VAN DRIE CIJFERS TELT. De breedte die het getal krijgt is
 * --maat-teller, 3ch, zodat de kop niet wiebelt terwijl hij van 0 naar 100
 * loopt. Een getal van één, twee of vier cijfers past daar niet in — een
 * jaartal zou over de tekst ernaast lopen — en wordt dus gewoon tekst. De
 * redacteur kan elke kop typen; dit is de regel die dat veilig houdt.
 *
 * Er zit geen script in dit bestand. Een <script> in een React-component belandt
 * inline in de HTML, en dat blokkeert `script-src 'self'`. Het script staat in
 * TellerScript.astro, waar Astro er een gewoon bestand van maakt.
 */
export default function Teller({ tekst }: TellerProps) {
  const treffer = /(?<!\d)\d{3}(?!\d)/.exec(tekst);

  // Geen getal van drie cijfers in de kop: niets te tellen, en dan ook geen
  // extra elementen.
  if (!treffer) return <>{tekst}</>;

  const voor = tekst.slice(0, treffer.index);
  const getal = treffer[0];
  const na = tekst.slice(treffer.index + getal.length);

  return (
    <>
      {voor}
      <span data-teller className="inline-block w-[var(--maat-teller)] text-right tabular-nums">
        {getal}
      </span>
      {na}
    </>
  );
}
