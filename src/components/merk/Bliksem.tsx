import bliksemSvg from '../../assets/logo/bliksem.svg?raw';

export type BliksemRol = 'groot' | 'scheiding' | 'opsomming';

export interface BliksemProps {
  /**
   * groot = uitgesneden achtergrondvlak, max 1 per pagina;
   * scheiding = tussen secties, max 2 per pagina;
   * opsomming = bullet in lijsten over de 100 of de selectie.
   */
  rol?: BliksemRol;
}

/*
 * De handgetekende schicht: het enige eigen vormelement van het merk.
 *
 * De rol bepaalt maat en dekking, want dat is precies wat de richtlijn
 * vastlegt. De props `hoogte` en `dekking` uit het propscontract zijn hier
 * weggelaten: die vragen een style-attribuut en dat blokkeert de CSP. Wie een
 * andere maat nodig heeft, kiest een andere rol.
 *
 * Bij `groot` vult de schicht zijn ouder; die ouder bepaalt dus hoe groot en
 * waar. De richtlijn wil minstens 40% van de sectiehoogte en toestaan dat hij
 * afloopt — dat is een keuze van de sectie, niet van dit component.
 *
 * Altijd decoratief: aria-hidden, zodat de <title> in de SVG niet in elke
 * opsomming "De Club van 100" gaat voorlezen.
 */
const rolKlasse: Record<BliksemRol, string> = {
  groot: 'block h-full opacity-[0.08] [&>svg]:h-full [&>svg]:w-auto',
  scheiding: 'block [&>svg]:h-6 [&>svg]:w-auto',
  opsomming: 'block shrink-0 [&>svg]:h-4 [&>svg]:w-auto',
};

export default function Bliksem({ rol = 'opsomming' }: BliksemProps) {
  return (
    <span
      aria-hidden="true"
      className={rolKlasse[rol]}
      dangerouslySetInnerHTML={{ __html: bliksemSvg }}
    />
  );
}
