import {
  achtergrondKlasse,
  breedteKlasse,
  isLichteAchtergrond,
  maatRegelKlasse,
  ruimteKlasse,
  type AchtergrondToken,
  type BreedteToken,
  type RuimteToken,
} from '../../lib/tokens';
import type { KopNiveau } from '../../lib/SectionRenderer';
import { ploeg } from '../../lib/beweging';
import { HONINGPOT, MELDING, VELDEN, type Variant } from '../../lib/formulier-velden';
import Bovenkop from '../basis/Bovenkop';
import Knop from '../basis/Knop';
import Koptekst from '../basis/Koptekst';
import Mailbaar from '../basis/Mailbaar';
import Veld from '../formulier/Veld';

export interface FormulierProps {
  achtergrond: AchtergrondToken;
  ruimte: RuimteToken;
  breedte: BreedteToken;
  /** Aanmelden bij de club, of personeel inhuren. Bepaalt welke velden er staan. */
  variant: Variant;
  bovenkop?: string;
  kop: string;
  tekst?: string;
  kopNiveau?: KopNiveau;
  /**
   * Runtime-props, niet redactioneel. Het CMS vult ze nooit; de verzendroute
   * geeft ze mee als zij het formulier opnieuw toont na een afgekeurde
   * inzending. Daarom staan ze niet in keystatic.config.ts.
   */
  fouten?: Record<string, string>;
  waardes?: Record<string, string>;
  /**
   * Staat het formulier open? Komt uit FORMULIER_ACTIEF, gelezen in
   * src/lib/pagina.ts en in de verzendroute.
   *
   * Staat hij uit, dan rendert deze sectie geen velden maar één regel die zegt
   * waar de bezoeker wél terechtkan. Geen half formulier en geen knop die niets
   * doet: wie hem invult en dan leest dat het niet kan, is twee keer
   * teleurgesteld.
   */
  actief?: boolean;
}

/*
 * Het formulier, in twee varianten: aanmelden bij de club en personeel inhuren.
 *
 * HET WERKT ZONDER JAVASCRIPT, en dat is de hele architectuur. Een gewone
 * <form method="post"> post naar /contact/verzenden, een route die on demand
 * draait; die controleert, verstuurt en stuurt je door. Valt het script uit, dan
 * werkt het formulier nog steeds — alleen zonder de "bezig"-stand en zonder dat
 * de focus naar de eerste fout springt.
 *
 * Dat is ook waarom /contact vooraf gerenderd kan blijven: de pagina hoeft niets
 * te weten, alleen de afhandeling.
 *
 * GEEN PERSOONSGEGEVENS IN DE URL. Na een afgekeurde inzending rendert de route
 * dit formulier opnieuw met de ingevulde waardes erin, en die komen uit de
 * POST-body. Er gaat dus nooit een naam of een mailadres door de adresbalk, waar
 * het in de geschiedenis van de browser en in serverlogs zou blijven staan.
 *
 * TWEE HORDES TEGEN BOTS, EN ZE VANGEN VERSCHILLENDE. De honeypot is een veld
 * dat een mens nooit ziet en dus nooit invult; hij werkt altijd, ook zonder
 * JavaScript, en staat op `hidden` via een klasse — een style-attribuut zou door
 * de CSP geblokkeerd worden, en dan stond het veld gewoon zichtbaar. De
 * tijdsdrempel meet hoe lang iemand over het invullen deed en komt uit
 * FormulierScript; ontbreekt hij, dan wordt de inzending niet geweigerd.
 *
 * DE VELDEN KOMEN UIT src/lib/formulier-velden.ts, en die lijst wordt ook door
 * de servervalidatie gelezen. Ze hangen aan wat de privacyverklaring belooft;
 * die noemt ze sinds 28 september 2026 alle zeven.
 *
 * DE IDS KRIJGEN DE VARIANT ERVOOR. Het CMS laat twee formulierblokken op één
 * pagina toe, en met alleen de veldnaam als id kregen aanmelden en inhuren dan
 * allebei een `naam` en een `email` — twee labels die naar hetzelfde veld
 * wijzen. De `name` blijft de kale veldnaam: daar leest de server op.
 */
export default function Formulier({
  achtergrond,
  ruimte,
  breedte,
  variant,
  bovenkop,
  kop,
  tekst,
  kopNiveau = 2,
  fouten,
  waardes,
  actief = false,
}: FormulierProps) {
  const Kop = kopNiveau === 1 ? 'h1' : 'h2';
  const velden = VELDEN[variant];
  const algemeneFout = fouten?.['algemeen'];

  // Bovenkop, kop, tekst, formulier — elk aanwezig onderdeel schuift op.
  const volgende = ploeg();

  return (
    <section
      className={`${achtergrondKlasse[achtergrond]} ${ruimteKlasse[ruimte]}`}
      data-thema={isLichteAchtergrond[achtergrond] ? 'licht' : undefined}
    >
      <div className={breedteKlasse[breedte]}>
        {bovenkop?.trim() ? <Bovenkop stap={volgende()}>{bovenkop}</Bovenkop> : null}

        {kop.trim() ? (
          <Kop
            data-onthul="kop"
            data-onthul-stap={volgende()}
            className="mt-4 text-display-l text-balance break-words first:mt-0"
          >
            <Koptekst tekst={kop} />
          </Kop>
        ) : null}

        {tekst?.trim() ? (
          <p
            data-onthul="blok"
            data-onthul-stap={volgende()}
            className={`mt-6 text-lopend-l text-tekst-zacht ${maatRegelKlasse[achtergrond]}`}
          >
            {tekst}
          </p>
        ) : null}

        {!actief ? (
          <p
            data-onthul="blok"
            data-onthul-stap={volgende()}
            className={`mt-8 text-lopend-m text-tekst-zacht ${maatRegelKlasse[achtergrond]}`}
          >
            <Mailbaar tekst={MELDING.nogNietActief} />
          </p>
        ) : (
        <form
          method="post"
          action="/contact/verzenden"
          data-onthul="blok"
          data-onthul-stap={volgende()}
          data-formulier={variant}
          className="mt-10 flex max-w-[var(--maat-regel-donker)] flex-col gap-6"
        >
          {/*
            Welke variant dit is, gaat mee in de inzending. De route leest hem om
            de juiste velden te controleren en het juiste onderwerp te zetten —
            en dat onderwerp is wat de twee bewaartermijnen uit de
            privacyverklaring in de mailbox uit elkaar houdt.
          */}
          <input type="hidden" name="variant" value={variant} />

          {/*
            De plek waar de status wordt aangekondigd. Hij staat er altijd, ook
            leeg: een schermlezer meldt een wijziging in bestaande tekst
            betrouwbaarder dan een element dat plotseling verschijnt.

            Daarom empty:sr-only en niet `hidden`. Dat stond er eerst, en
            display:none haalt het element uit de toegankelijkheidsboom: het
            script haalde de klasse weg en zette de tekst in dezelfde stap, en een
            live region die tegelijk met zijn inhoud verschijnt, wordt door veel
            schermlezers niet voorgelezen. Leeg staat hij nu onzichtbaar maar wél
            in de boom, en neemt hij geen ruimte in de gap van het formulier.

            role="status" en niet role="alert" — dit onderbreekt niet wat de
            bezoeker aan het doen is, het vertelt wat er gebeurde.
          */}
          <p
            data-formulier-status=""
            role="status"
            aria-live="polite"
            className="text-lopend-m text-tekst-zacht empty:sr-only"
          >
            {algemeneFout ? <Mailbaar tekst={algemeneFout} /> : null}
          </p>

          {velden.map((veld) => (
            <Veld
              key={veld.naam}
              veld={veld}
              voorvoegsel={variant}
              fout={fouten?.[veld.naam]}
              waarde={waardes?.[veld.naam]}
            />
          ))}

          {/*
            De honeypot. `hidden` is display:none via een klasse en niet via een
            style-attribuut, want dat laatste blokkeert de CSP — en een honeypot
            die zichtbaar wordt is geen honeypot maar een raar extra veld.

            tabIndex en aria-hidden houden hem ook weg bij wie met het toetsenbord
            of een schermlezer werkt; die zouden hem anders alsnog tegenkomen en
            zichzelf buitensluiten door hem in te vullen. autoComplete off en de
            drie data-attributen houden de browser en de grote
            wachtwoordbeheerders ervan af hem behulpzaam te vullen, wat hetzelfde
            zou doen. Zie HONINGPOT voor waarom de naam nergens op lijkt.
          */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor={`${variant}-${HONINGPOT}`}>Laat dit veld leeg</label>
            <input
              id={`${variant}-${HONINGPOT}`}
              name={HONINGPOT}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              data-1p-ignore=""
              data-lpignore="true"
              data-bwignore=""
              defaultValue=""
            />
          </div>

          {/* FormulierScript vult dit bij het laden. Leeg is geen afkeuring. */}
          <input type="hidden" name="geladen" defaultValue="" data-formulier-geladen="" />

          <div>
            <Knop variant="vuur" maat="m" type="submit">
              Stuur maar
            </Knop>
            {/*
              De tekst voor de bezig-stand staat hier en niet in het script, zodat
              alle zichtbare tekst uit één bron komt. Het script leest hem eruit
              en zet hem op de knop.
            */}
            <span data-formulier-bezig-tekst="" className="hidden">
              {MELDING.bezig}
            </span>
          </div>
        </form>
        )}
      </div>
    </section>
  );
}
