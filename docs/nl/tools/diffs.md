---
read_when:
    - Je wilt dat agents code- of Markdown-bewerkingen als diffs tonen
    - Je wilt een viewer-URL die klaar is voor het canvas of een gerenderd diffbestand
    - Je hebt gecontroleerde, tijdelijke diff-artefacten met veilige standaardinstellingen nodig
sidebarTitle: Diffs
summary: Alleen-lezen diffviewer en bestandsrenderer voor agenten (optionele Plugin-tool)
title: Verschillen
x-i18n:
    generated_at: "2026-06-27T18:24:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` is een optionele plugintool met korte ingebouwde systeeminstructies en een begeleidende skill die wijzigingsinhoud omzet in een read-only diff-artefact voor agents.

De tool accepteert een van beide:

- `before`- en `after`-tekst
- een unified `patch`

De tool kan het volgende retourneren:

- een Gateway-viewer-URL voor canvaspresentatie
- een gerenderd bestandspad (PNG of PDF) voor berichtbezorging
- beide outputs in één aanroep

Wanneer ingeschakeld, voegt de Plugin beknopte gebruiksinstructies toe aan de systeempromptruimte en biedt ook een gedetailleerde skill voor gevallen waarin de agent uitgebreidere instructies nodig heeft.

## Snelstart

<Steps>
  <Step title="Installeer de Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Schakel de Plugin in">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Kies een modus">
    <Tabs>
      <Tab title="view">
        Canvas-first flows: agents roepen `diffs` aan met `mode: "view"` en openen `details.viewerUrl` met `canvas present`.
      </Tab>
      <Tab title="file">
        Chatbestandsbezorging: agents roepen `diffs` aan met `mode: "file"` en sturen `details.filePath` met `message` via `path` of `filePath`.
      </Tab>
      <Tab title="both">
        Gecombineerd: agents roepen `diffs` aan met `mode: "both"` om beide artefacten in één aanroep te krijgen.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Ingebouwde systeeminstructies uitschakelen

Als je de `diffs`-tool ingeschakeld wilt houden maar de ingebouwde systeemprompt-instructies wilt uitschakelen, stel je `plugins.entries.diffs.hooks.allowPromptInjection` in op `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Dit blokkeert de `before_prompt_build`-hook van de diffs-Plugin, terwijl de Plugin, tool en begeleidende skill beschikbaar blijven.

Als je zowel de instructies als de tool wilt uitschakelen, schakel dan de Plugin zelf uit.

## Typische agentworkflow

<Steps>
  <Step title="Roep diffs aan">
    Agent roept de `diffs`-tool aan met invoer.
  </Step>
  <Step title="Lees details">
    Agent leest `details`-velden uit de respons.
  </Step>
  <Step title="Presenteer">
    Agent opent `details.viewerUrl` met `canvas present`, stuurt `details.filePath` met `message` via `path` of `filePath`, of doet beide.
  </Step>
</Steps>

## Invoervoorbeelden

<Tabs>
  <Tab title="Voor en na">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Referentie voor toolinvoer

Alle velden zijn optioneel, tenzij anders vermeld.

<ParamField path="before" type="string">
  Oorspronkelijke tekst. Vereist met `after` wanneer `patch` is weggelaten.
</ParamField>
<ParamField path="after" type="string">
  Bijgewerkte tekst. Vereist met `before` wanneer `patch` is weggelaten.
</ParamField>
<ParamField path="patch" type="string">
  Unified diff-tekst. Wederzijds uitsluitend met `before` en `after`.
</ParamField>
<ParamField path="path" type="string">
  Weergavenaam voor bestand in de voor-en-na-modus.
</ParamField>
<ParamField path="lang" type="string">
  Taaloverride-hint voor de voor-en-na-modus. Onbekende waarden en talen buiten de standaard viewerset vallen terug op platte tekst, tenzij de
  Diff Viewer Language Pack-Plugin is geïnstalleerd.
</ParamField>

<ParamField path="title" type="string">
  Override voor viewertitel.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Outputmodus. Standaardwaarde is de Plugin-standaard `defaults.mode`. Verouderde alias: `"image"` gedraagt zich als `"file"` en wordt nog steeds geaccepteerd voor achterwaartse compatibiliteit.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Viewerthema. Standaardwaarde is de Plugin-standaard `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff-layout. Standaardwaarde is de Plugin-standaard `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Vouw ongewijzigde secties uit wanneer volledige context beschikbaar is. Alleen optie per aanroep (geen Plugin-standaardsleutel).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Gerenderde bestandsindeling. Standaardwaarde is de Plugin-standaard `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Kwaliteitspreset voor PNG- of PDF-rendering.
</ParamField>
<ParamField path="fileScale" type="number">
  Override voor apparaatschaal (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maximale renderbreedte in CSS-pixels (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Artefact-TTL in seconden voor viewer- en zelfstandige bestandsoutputs. Max. 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Override voor oorsprong van viewer-URL. Overschrijft Plugin `viewerBaseUrl`. Moet `http` of `https` zijn, zonder query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Verouderde invoeraliases">
    Nog steeds geaccepteerd voor achterwaartse compatibiliteit:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validatie en limieten">
    - `before` en `after` elk maximaal 512 KiB.
    - `patch` maximaal 2 MiB.
    - `path` maximaal 2048 bytes.
    - `lang` maximaal 128 bytes.
    - `title` maximaal 1024 bytes.
    - Limiet voor patchcomplexiteit: maximaal 128 bestanden en 120000 totale regels.
    - `patch` samen met `before` of `after` wordt geweigerd.
    - Veiligheidslimieten voor gerenderde bestanden (van toepassing op PNG en PDF):
      - `fileQuality: "standard"`: maximaal 8 MP (8.000.000 gerenderde pixels).
      - `fileQuality: "hq"`: maximaal 14 MP (14.000.000 gerenderde pixels).
      - `fileQuality: "print"`: maximaal 24 MP (24.000.000 gerenderde pixels).
      - PDF heeft daarnaast een maximum van 50 pagina's.

  </Accordion>
</AccordionGroup>

## Syntaxismarkering

OpenClaw bevat syntaxismarkering voor gangbare broncode-, configuratie- en documentatietalen:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` en `toml`.

Gangbare aliassen zoals `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt` en `ps1` worden genormaliseerd naar die standaardtalen.

Installeer de Diff Viewer Language Pack-plugin om andere talen te highlighten:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Als het language pack beschikbaar is, kan OpenClaw veel meer talen highlighten. Als het pack niet is geinstalleerd, worden bestanden buiten de standaardlijst nog steeds weergegeven als leesbare platte tekst. Voorbeelden zijn Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI en diff-bestanden.

Zie [Diffs Language Pack-plugin](/nl/plugins/reference/diffs-language-pack) voor details en [Shiki-talen](https://shiki.style/languages) voor Shiki's upstream taal- en aliascatalogus.

## Contract voor uitvoerdetails

De tool retourneert gestructureerde metadata onder `details`.

<AccordionGroup>
  <Accordion title="Viewer-velden">
    Gedeelde velden voor modi die een viewer maken:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` indien beschikbaar)

  </Accordion>
  <Accordion title="Bestandsvelden">
    Bestandsvelden wanneer PNG of PDF wordt gerenderd:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (dezelfde waarde als `filePath`, voor compatibiliteit met message tools)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibiliteitsaliassen">
    Ook geretourneerd voor bestaande callers:

    - `format` (dezelfde waarde als `fileFormat`)
    - `imagePath` (dezelfde waarde als `filePath`)
    - `imageBytes` (dezelfde waarde als `fileBytes`)
    - `imageQuality` (dezelfde waarde als `fileQuality`)
    - `imageScale` (dezelfde waarde als `fileScale`)
    - `imageMaxWidth` (dezelfde waarde als `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Samenvatting van modusgedrag:

| Modus    | Wat wordt geretourneerd                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Alleen viewer-velden.                                                                                                    |
| `"file"` | Alleen bestandsvelden, geen viewer-artifact.                                                                              |
| `"both"` | Viewer-velden plus bestandsvelden. Als bestandsrendering mislukt, retourneert de viewer nog steeds met alias `fileError` en `imageError`. |

## Samengevouwen ongewijzigde secties

- De viewer kan rijen tonen zoals `N unmodified lines`.
- Uitklapknoppen op die rijen zijn voorwaardelijk en niet gegarandeerd voor elk inputtype.
- Uitklapknoppen verschijnen wanneer de gerenderde diff uitbreidbare contextgegevens heeft, wat typisch is voor invoer voor en na.
- Voor veel unified patch-invoer zijn weggelaten contextgedeelten niet beschikbaar in de geparsete patch-hunks, dus de rij kan zonder uitklapknoppen verschijnen. Dit is verwacht gedrag.
- `expandUnchanged` is alleen van toepassing wanneer uitbreidbare context bestaat.

## Plugin-standaardwaarden

Stel Plugin-brede standaardwaarden in `~/.openclaw/openclaw.json` in:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

Ondersteunde standaardwaarden:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`
- `ttlSeconds`

Expliciete toolparameters overschrijven deze standaardwaarden.

### Configuratie voor permanente viewer-URL

<ParamField path="viewerBaseUrl" type="string">
  Plugin-eigen fallback voor geretourneerde viewerlinks wanneer een toolaanroep geen `baseUrl` doorgeeft. Moet `http` of `https` zijn, zonder query/hash.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Beveiligingsconfiguratie

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: niet-loopback-verzoeken naar viewerroutes worden geweigerd. `true`: remote viewers zijn toegestaan als het getokeniseerde pad geldig is.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Artifact-levenscyclus en opslag

- Artefacten worden opgeslagen onder de tijdelijke submap: `$TMPDIR/openclaw-diffs`.
- Metadata van viewer-artefacten bevat:
  - willekeurige artefact-ID (20 hex-tekens)
  - willekeurig token (48 hex-tekens)
  - `createdAt` en `expiresAt`
  - opgeslagen pad naar `viewer.html`
- De standaard-TTL voor artefacten is 30 minuten wanneer deze niet is opgegeven.
- De maximaal geaccepteerde viewer-TTL is 6 uur.
- Opschoning wordt opportunistisch uitgevoerd na het maken van artefacten.
- Verlopen artefacten worden verwijderd.
- Fallback-opschoning verwijdert verouderde mappen ouder dan 24 uur wanneer metadata ontbreekt.

## Viewer-URL en netwerkgedrag

Viewer-route:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer-assets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` wanneer de diff een taal uit het Diff Viewer Language Pack gebruikt

Het viewer-document lost die assets op relatief aan de viewer-URL, zodat een optioneel `baseUrl`-padprefix ook voor beide asset-aanvragen behouden blijft.

Gedrag voor URL-opbouw:

- Als tool-aanroep `baseUrl` is opgegeven, wordt deze gebruikt na strikte validatie.
- Anders, als Plugin `viewerBaseUrl` is geconfigureerd, wordt deze gebruikt.
- Zonder een van beide overrides gebruikt de viewer-URL standaard loopback `127.0.0.1`.
- Als de Gateway-bindmodus `custom` is en `gateway.customBindHost` is ingesteld, wordt die host gebruikt.

`baseUrl`-regels:

- Moet `http://` of `https://` zijn.
- Query en hash worden geweigerd.
- Origin plus optioneel basispad is toegestaan.

## Beveiligingsmodel

<AccordionGroup>
  <Accordion title="Viewer-verharding">
    - Standaard alleen loopback.
    - Getokeniseerde viewer-paden met strikte ID- en tokenvalidatie.
    - CSP voor viewer-respons:
      - `default-src 'none'`
      - scripts en assets alleen van self
      - geen uitgaande `connect-src`
    - Beperking van externe missers wanneer externe toegang is ingeschakeld:
      - 40 mislukkingen per 60 seconden
      - 60 seconden blokkering (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Verharding van bestandsweergave">
    - Routering van screenshot-browseraanvragen is standaard geweigerd.
    - Alleen lokale viewer-assets van `http://127.0.0.1/plugins/diffs/assets/*` zijn toegestaan.
    - Externe netwerkaanvragen worden geblokkeerd.

  </Accordion>
</AccordionGroup>

## Browservereisten voor bestandsmodus

`mode: "file"` en `mode: "both"` hebben een Chromium-compatibele browser nodig.

Volgorde van oplossing:

<Steps>
  <Step title="Configuratie">
    `browser.executablePath` in OpenClaw-configuratie.
  </Step>
  <Step title="Omgevingsvariabelen">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platform-fallback">
    Fallback voor ontdekking van platformcommando/pad.
  </Step>
</Steps>

Veelvoorkomende fouttekst:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Los dit op door Chrome, Chromium, Edge of Brave te installeren, of door een van de opties voor uitvoerbaar pad hierboven in te stellen.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Invoervalidatiefouten">
    - `Provide patch or both before and after text.` — voeg zowel `before` als `after` toe, of geef `patch` op.
    - `Provide either patch or before/after input, not both.` — meng invoermodi niet.
    - `Invalid baseUrl: ...` — gebruik `http(s)`-origin met optioneel pad, geen query/hash.
    - `{field} exceeds maximum size (...)` — verklein de payload.
    - Weigering van grote patch — verminder het aantal patchbestanden of het totale aantal regels.

  </Accordion>
  <Accordion title="Toegankelijkheid van viewer">
    - De viewer-URL wordt standaard opgelost naar `127.0.0.1`.
    - Voor scenario's met externe toegang:
      - stel Plugin `viewerBaseUrl` in, of
      - geef `baseUrl` per tool-aanroep door, of
      - gebruik `gateway.bind=custom` en `gateway.customBindHost`
    - Als `gateway.trustedProxies` loopback bevat voor een proxy op dezelfde host (bijvoorbeeld Tailscale Serve), falen ruwe loopback-viewer-aanvragen zonder doorgestuurde client-IP-headers bewust gesloten.
    - Voor die proxy-topologie:
      - geef de voorkeur aan `mode: "file"` of `mode: "both"` wanneer je alleen een bijlage nodig hebt, of
      - schakel bewust `security.allowRemoteViewer` in en stel Plugin `viewerBaseUrl` in of geef een proxy/openbare `baseUrl` door wanneer je een deelbare viewer-URL nodig hebt
    - Schakel `security.allowRemoteViewer` alleen in wanneer je externe viewer-toegang bedoelt.

  </Accordion>
  <Accordion title="Rij met ongewijzigde regels heeft geen uitklapknop">
    Dit kan gebeuren bij patch-invoer wanneer de patch geen uitbreidbare context bevat. Dit is verwacht en duidt niet op een viewer-fout.
  </Accordion>
  <Accordion title="Artefact niet gevonden">
    - Artefact verlopen door TTL.
    - Token of pad gewijzigd.
    - Opschoning heeft verouderde gegevens verwijderd.

  </Accordion>
</AccordionGroup>

## Operationele richtlijnen

- Geef de voorkeur aan `mode: "view"` voor lokale interactieve reviews in canvas.
- Geef de voorkeur aan `mode: "file"` voor uitgaande chatkanalen die een bijlage nodig hebben.
- Laat `allowRemoteViewer` uitgeschakeld tenzij je deployment externe viewer-URL's vereist.
- Stel expliciete korte `ttlSeconds` in voor gevoelige diffs.
- Vermijd het verzenden van geheimen in diff-invoer wanneer dit niet vereist is.
- Als je kanaal afbeeldingen agressief comprimeert (bijvoorbeeld Telegram of WhatsApp), geef dan de voorkeur aan PDF-uitvoer (`fileFormat: "pdf"`).

<Note>
Diff-renderingengine aangedreven door [Diffs](https://diffs.com).
</Note>

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Plugins](/nl/tools/plugin)
- [Tools-overzicht](/nl/tools)
