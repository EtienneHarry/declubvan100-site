export interface HandschriftProps {
  /** De regel. Moet elders op de pagina al in gewone tekst staan. */
  tekst: string;
}

/*
 * De handgeschreven regel.
 *
 * Het derde ding dat de mockup binnenbrengt naast de ovaal en de streep, en het
 * enige element op deze site dat puur decoratief is. Eén regel per pagina —
 * niet per sectie.
 *
 * HIJ STAAT ALTIJD OP aria-hidden, EN DAAR IS GEEN PROP VOOR. Dat is dezelfde
 * soort keuze als de sluier in Beeldvlak: geen tak die hem overslaat, want de
 * regel eromheen is niet af te dwingen met een afspraak.
 *
 * De richtlijn zegt: verbergen zodra dezelfde boodschap al in gewone tekst op de
 * pagina staat. Dat is bij dit lettertype altijd het geval, want de andere kant
 * van dezelfde richtlijn is dat een boodschap die er nog niet staat
 * betekenisdragend is — en betekenisdragende tekst hoort niet in het
 * handschrift maar in de dragende letter. De twee helften sluiten elkaar dus
 * uit, en wat overblijft is: dit component is altijd een herhaling.
 *
 * Concreet betekent dat: gebruik hem alleen onder iets wat hij herhaalt. In de
 * mockup staat hij onder een drieluik met drie bijschriften en zegt hij
 * precies diezelfde drie zinnen nog een keer. Zet je hem ergens neer waar die
 * tekst niet staat, dan hoort een schermlezer hem niet en mist die bezoeker
 * inhoud — en dat is dan geen fout van dit component maar van de plaatsing.
 *
 * Geen haal en geen beweging. De ovaal en de streep tekenen zichzelf omdat ze
 * een gebaar zijn dat ergens naar wijst; deze regel is een sfeerbeeld en hoort
 * er gewoon te staan.
 */
export default function Handschrift({ tekst }: HandschriftProps) {
  return (
    <p aria-hidden="true" className="font-hand text-kop-l text-cream text-balance break-words">
      {tekst}
    </p>
  );
}
