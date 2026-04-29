---
x-i18n:
    generated_at: "2026-04-29T23:19:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Ontwerp voor import van aangepast Tweakcn-thema

Status: goedgekeurd in terminal op 2026-04-22

## Samenvatting

Voeg precies één browserlokaal aangepast Control UI-themaslot toe dat kan worden geïmporteerd vanuit een tweakcn-deellink. De bestaande ingebouwde themafamilies blijven `claw`, `knot` en `dash`. De nieuwe familie `custom` gedraagt zich als een normale OpenClaw-themafamilie en ondersteunt de modi `light`, `dark` en `system` wanneer de geïmporteerde tweakcn-payload zowel lichte als donkere tokensets bevat.

Het geïmporteerde thema wordt alleen opgeslagen in het huidige browserprofiel, samen met de rest van de Control UI-instellingen. Het wordt niet naar de Gateway-configuratie geschreven en wordt niet tussen apparaten of browsers gesynchroniseerd.

## Probleem

Het Control UI-themasysteem is momenteel beperkt tot drie hardgecodeerde themafamilies:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Gebruikers kunnen wisselen tussen ingebouwde families en modusvarianten, maar ze kunnen geen thema uit tweakcn gebruiken zonder repo-CSS te bewerken. Het gevraagde resultaat is kleiner dan een algemeen themasysteem: behoud de drie ingebouwde thema’s en voeg één door de gebruiker beheerd geïmporteerd slot toe dat vanuit een tweakcn-link kan worden vervangen.

## Doelen

- Laat de bestaande ingebouwde themafamilies ongewijzigd.
- Voeg precies één geïmporteerd aangepast slot toe, geen themabibliotheek.
- Accepteer een tweakcn-deellink of een directe `https://tweakcn.com/r/themes/{id}`-URL.
- Bewaar het geïmporteerde thema alleen in de lokale opslag van de browser.
- Laat het geïmporteerde slot werken met de bestaande modusbesturing voor `light`, `dark` en `system`.
- Houd foutgedrag veilig: een foutieve import breekt nooit het actieve UI-thema.

## Niet-doelen

- Geen bibliotheek met meerdere thema’s of browserlokale lijst met imports.
- Geen opslag aan Gateway-zijde of synchronisatie tussen apparaten.
- Geen willekeurige CSS-editor of ruwe thema-JSON-editor.
- Geen automatisch laden van externe lettertype-assets vanuit tweakcn.
- Geen poging om tweakcn-payloads te ondersteunen die slechts één modus beschikbaar maken.
- Geen repo-brede herstructurering van theming buiten de noodzakelijke naden voor de Control UI.

## Gebruikersbeslissingen die al zijn genomen

- Behoud de drie ingebouwde thema’s.
- Voeg één door tweakcn aangedreven importslot toe.
- Sla het geïmporteerde thema op in de browser, niet in de Gateway-configuratie.
- Ondersteun `light`, `dark` en `system` voor het geïmporteerde slot.
- Het overschrijven van het aangepaste slot met de volgende import is het beoogde gedrag.

## Aanbevolen aanpak

Voeg een vierde themafamilie-id, `custom`, toe aan het Control UI-themamodel. De familie `custom` wordt alleen selecteerbaar wanneer er een geldige tweakcn-import aanwezig is. De geïmporteerde payload wordt genormaliseerd naar een OpenClaw-specifiek aangepast themarecord en opgeslagen in de lokale opslag van de browser, samen met de rest van de UI-instellingen.

Tijdens runtime rendert OpenClaw een beheerde `<style>`-tag die de opgeloste aangepaste CSS-variabeleblokken definieert:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Dit houdt aangepaste themavariabelen beperkt tot de familie `custom` en voorkomt dat inline CSS-variabelen naar de ingebouwde families lekken.

## Architectuur

### Themamodel

Werk `ui/src/ui/theme.ts` bij:

- Breid `ThemeName` uit met `custom`.
- Breid `ResolvedTheme` uit met `custom` en `custom-light`.
- Breid `VALID_THEME_NAMES` uit.
- Werk `resolveTheme()` bij zodat `custom` het bestaande familiegedrag weerspiegelt:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` of `custom-light` op basis van OS-voorkeur

Er worden geen legacy-aliassen toegevoegd voor `custom`.

### Opslagmodel

Breid `UiSettings`-opslag in `ui/src/ui/storage.ts` uit met één optionele aangepaste-thema-payload:

- `customTheme?: ImportedCustomTheme`

Aanbevolen opgeslagen vorm:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Opmerkingen:

- `sourceUrl` slaat de oorspronkelijke gebruikersinvoer op na normalisatie.
- `themeId` is de tweakcn-thema-id die uit de URL is gehaald.
- `label` is het tweakcn-veld `name` wanneer aanwezig, anders `Custom`.
- `light` en `dark` zijn al genormaliseerde OpenClaw-tokenmaps, geen ruwe tweakcn-payloads.
- De geïmporteerde payload staat naast andere browserlokale instellingen en wordt geserialiseerd in hetzelfde lokale-opslagdocument.
- Als opgeslagen aangepaste-themagegevens bij het laden ontbreken of ongeldig zijn, negeer de payload en val terug op `theme: "claw"` wanneer de opgeslagen familie `custom` was.

### Runtime-toepassing

Voeg een smalle aangepaste-thema-stylesheetbeheerder toe in de Control UI-runtime, beheerd in de buurt van `ui/src/ui/app-settings.ts` en `ui/src/ui/theme.ts`.

Verantwoordelijkheden:

- Maak of werk één stabiele `<style id="openclaw-custom-theme">`-tag in `document.head` bij.
- Emit CSS alleen wanneer er een geldige aangepaste-thema-payload bestaat.
- Verwijder de inhoud van de style-tag wanneer de payload wordt gewist.
- Houd CSS voor ingebouwde families in `ui/src/styles/base.css`; voeg geïmporteerde tokens niet in de ingecheckte stylesheet in.

Deze beheerder draait wanneer instellingen worden geladen, opgeslagen, geïmporteerd of gewist.

### Selectors voor lichte modus

De implementatie moet bij voorkeur `data-theme-mode="light"` gebruiken voor lichtestijl over families heen, in plaats van `custom-light` apart te behandelen. Als een bestaande selector vastzit aan `data-theme="light"` en op elke lichte familie moet worden toegepast, verbreed die dan als onderdeel van dit werk.

## Import-UX

Werk `ui/src/ui/views/config.ts` bij in de sectie `Appearance`:

- Voeg een themakaart `Custom` toe naast `Claw`, `Knot` en `Dash`.
- Toon de kaart als uitgeschakeld wanneer er geen geïmporteerd aangepast thema bestaat.
- Voeg onder het themaraster een importpaneel toe met:
  - één tekstinvoer voor een tweakcn-deellink of `/r/themes/{id}`-URL
  - één knop `Import`
  - één pad `Replace` wanneer er al een aangepaste payload bestaat
  - één actie `Clear` wanneer er al een aangepaste payload bestaat
- Toon het geïmporteerde themalabel en de bronhost wanneer er een payload bestaat.
- Als het actieve thema `custom` is, wordt een geïmporteerde vervanging direct toegepast.
- Als het actieve thema niet `custom` is, slaat importeren alleen de nieuwe payload op totdat de gebruiker de kaart `Custom` selecteert.

De snelle themakiezer voor instellingen in `ui/src/ui/views/config-quick.ts` moet `Custom` ook alleen tonen wanneer er een payload bestaat.

## URL-parsing en extern ophalen

Het browserimportpad accepteert:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

De implementatie moet beide vormen normaliseren naar:

- `https://tweakcn.com/r/themes/{id}`

De browser haalt daarna het genormaliseerde endpoint `/r/themes/{id}` direct op.

Gebruik een smalle schemavalidator voor de externe payload. Een zod-schema heeft de voorkeur omdat dit een onvertrouwde externe grens is.

Vereiste externe velden:

- topniveau `name` als optionele string
- `cssVars.theme` als optioneel object
- `cssVars.light` als object
- `cssVars.dark` als object

Als `cssVars.light` of `cssVars.dark` ontbreekt, wijs de import dan af. Dit is bewust: het goedgekeurde productgedrag is volledige modusondersteuning, niet best-effort-synthese van een ontbrekende kant.

## Tokenmapping

Spiegel tweakcn-variabelen niet blind. Normaliseer een begrensde subset naar OpenClaw-tokens en leid de rest af in een helper.

### Direct geïmporteerde tokens

Uit elk tweakcn-modusblok:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Uit gedeelde `cssVars.theme` wanneer aanwezig:

- `font-sans`
- `font-mono`

Als een modusblok `font-sans`, `font-mono` of `radius` overschrijft, wint de modusspecifieke waarde.

### Tokens afgeleid voor OpenClaw

De importeur leidt OpenClaw-specifieke variabelen af uit de geïmporteerde basiskleuren:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Afleidingsregels staan in een pure helper, zodat ze onafhankelijk kunnen worden getest. Exacte kleurmengformules zijn een implementatiedetail, maar de helper moet aan twee beperkingen voldoen:

- behoud leesbaar contrast dicht bij de intentie van het geïmporteerde thema
- produceer stabiele uitvoer voor dezelfde geïmporteerde payload

### Genegeerde tokens in v1

Deze tweakcn-tokens worden in de eerste versie bewust genegeerd:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Dit houdt de scope gericht op de tokens die de huidige Control UI daadwerkelijk nodig heeft.

### Lettertypen

Lettertypestacks worden geïmporteerd als ze aanwezig zijn, maar OpenClaw laadt in v1 geen externe lettertype-assets. Als de geïmporteerde stack verwijst naar lettertypen die niet beschikbaar zijn in de browser, geldt normaal fallbackgedrag.

## Foutgedrag

Foutieve imports moeten gesloten falen.

- Ongeldig URL-formaat: toon inline validatiefout, haal niets op.
- Niet-ondersteunde host of padvorm: toon inline validatiefout, haal niets op.
- Netwerkfout, niet-OK-respons of misvormde JSON: toon inline fout, laat de huidige opgeslagen payload onaangetast.
- Schemafout of ontbrekende lichte/donkere blokken: toon inline fout, laat de huidige opgeslagen payload onaangetast.
- Wisactie:
  - verwijdert de opgeslagen aangepaste payload
  - verwijdert de inhoud van de beheerde aangepaste style-tag
  - als `custom` actief is, schakelt de themafamilie terug naar `claw`
- Ongeldige opgeslagen aangepaste payload bij eerste keer laden:
  - negeer de opgeslagen payload
  - emit geen aangepaste CSS
  - als de opgeslagen themafamilie `custom` was, val terug op `claw`

Op geen enkel moment mag een mislukte import het actieve document achterlaten met gedeeltelijk toegepaste aangepaste CSS-variabelen.

## Bestanden die naar verwachting wijzigen bij implementatie

Primaire bestanden:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Waarschijnlijke nieuwe helpers:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

Tests:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- nieuwe gerichte tests voor URL-parsing en payloadnormalisatie

## Testen

Minimale implementatiedekking:

- parseer de deellink-URL naar een tweakcn-thema-id
- normaliseer `/themes/{id}` en `/r/themes/{id}` naar de fetch-URL
- wijs niet-ondersteunde hosts en misvormde id’s af
- valideer de vorm van de tweakcn-payload
- map een geldige tweakcn-payload naar genormaliseerde lichte en donkere OpenClaw-tokenmaps
- laad en bewaar de aangepaste payload in browserlokale instellingen
- los `custom` op voor `light`, `dark` en `system`
- schakel selectie van `Custom` uit wanneer er geen payload bestaat
- pas het geïmporteerde thema direct toe wanneer `custom` al actief is
- val terug op `claw` wanneer het actieve aangepaste thema wordt gewist

Doel voor handmatige verificatie:

- importeer een bekend tweakcn-thema vanuit Instellingen
- wissel tussen `light`, `dark` en `system`
- wissel tussen `custom` en de ingebouwde families
- herlaad de pagina en bevestig dat het geïmporteerde aangepaste thema lokaal behouden blijft

## Uitrolnotities

Deze functie is bewust klein. Als gebruikers later vragen om meerdere geïmporteerde thema’s, hernoemen, exporteren of synchronisatie tussen apparaten, behandel dat dan als een vervolgontwerp. Bouw in deze implementatie niet vooraf een abstractie voor een themabibliotheek.
