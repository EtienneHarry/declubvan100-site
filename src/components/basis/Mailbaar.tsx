import { Fragment } from 'react';

export interface MailbaarProps {
  tekst: string;
}

/*
 * Platte tekst waarin een mailadres aan te tikken is.
 *
 * De meldingen van het formulier en de bevestiging noemen contact@declubvan.nl,
 * en die zinnen zijn zo goedgekeurd. Zolang het formulier uit staat, is mailen
 * de enige actie op /contact en /opdrachtgevers — en een adres dat je op een
 * telefoon moet overtypen of in de voettekst moet gaan zoeken, is een drempel
 * precies daar waar iemand zich wil melden.
 *
 * De tekst verandert dus niet; alleen het adres wordt een link. De linkstijl
 * komt uit laag 4 van tokens.css, net als elke andere link in lopende tekst.
 *
 * Het patroon is bewust krap: een gewoon adres, gevolgd door een domein met
 * een extensie van minstens twee letters. Een punt of komma aan het eind van de
 * zin valt er daardoor buiten. De vangende groep is nodig: split() zet de
 * treffers dan op de oneven plekken van de uitkomst.
 */
const ADRES = /([\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,})/i;

export default function Mailbaar({ tekst }: MailbaarProps) {
  const delen = tekst.split(ADRES);

  return (
    <>
      {delen.map((deel, index) =>
        index % 2 === 1 ? (
          <a key={index} href={`mailto:${deel}`}>
            {deel}
          </a>
        ) : (
          <Fragment key={index}>{deel}</Fragment>
        ),
      )}
    </>
  );
}
