/**
 * Een duur-token uit de CSS als milliseconden.
 *
 * In de bron staat `--duur-4: 520ms`, maar de CSS die de browser krijgt is
 * geminificeerd, en daar staat `.52s`. `parseFloat` leest daar 0,52 uit, en
 * wie dat als milliseconden gebruikt, rekent duizend keer te kort: de teller
 * liep zo in één beeldje van 0 naar 100, en het vangnet van de opening ging na
 * 500 in plaats van 800 milliseconden af. Geen foutmelding, alleen een
 * beweging die er niet is.
 *
 * Daarom altijd via deze functie, en nooit met een losse `parseFloat`: hij
 * kijkt naar de eenheid. Geen getal levert 0 op.
 */
export function duurInMs(waarde: string): number {
  const tekst = waarde.trim();
  const getal = Number.parseFloat(tekst);
  if (!Number.isFinite(getal)) return 0;
  if (tekst.endsWith('ms')) return getal;
  if (tekst.endsWith('s')) return getal * 1000;
  return getal;
}
