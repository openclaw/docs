---
read_when:
    - Je wilt dat agenten code- of Markdown-bewerkingen als diffs tonen
    - Je wilt een canvas-klare viewer-URL of een gerenderd diff-bestand
    - Je hebt gecontroleerde, tijdelijke diff-artefacten met veilige standaardinstellingen nodig
sidebarTitle: Diffs
summary: Alleen-lezen diffviewer en bestandsrenderer voor agenten (optionele Plugin-tool)
title: Verschillen
x-i18n:
    generated_at: "2026-05-02T11:29:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` is een optionele Plugin-tool met korte ingebouwde systeemrichtlijnen en een bijbehorende skill die wijzigingsinhoud omzet in een alleen-lezen diffartefact voor agents.

Deze accepteert een van beide:

- `before`- en `after`-tekst
- een uniforme `patch`

Deze kan retourneren:

- een Gateway-viewer-URL voor canvaspresentatie
- een gerenderd bestandspad (PNG of PDF) voor berichtbezorging
- beide uitvoeritems in één aanroep

Wanneer ingeschakeld, voegt de Plugin beknopte gebruiksrichtlijnen toe aan de systeempromptruimte en stelt deze ook een gedetailleerde skill beschikbaar voor gevallen waarin de agent uitgebreidere instructies nodig heeft.

## Snel aan de slag

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        Canvasgerichte stromen: agents roepen `diffs` aan met `mode: "view"` en openen `details.viewerUrl` met `canvas present`.
      </Tab>
      <Tab title="file">
        Bestandsbezorging via chat: agents roepen `diffs` aan met `mode: "file"` en verzenden `details.filePath` met `message` met `path` of `filePath`.
      </Tab>
      <Tab title="both">
        Gecombineerd: agents roepen `diffs` aan met `mode: "both"` om beide artefacten in één aanroep te krijgen.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Ingebouwde systeemrichtlijnen uitschakelen

Als je de `diffs`-tool ingeschakeld wilt houden maar de ingebouwde systeempromptrichtlijnen wilt uitschakelen, stel je `plugins.entries.diffs.hooks.allowPromptInjection` in op `false`:

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

Dit blokkeert de `before_prompt_build`-hook van de diffs-Plugin, terwijl de Plugin, tool en bijbehorende skill beschikbaar blijven.

Als je zowel de richtlijnen als de tool wilt uitschakelen, schakel dan in plaats daarvan de Plugin uit.

## Typische agent-workflow

<Steps>
  <Step title="Call diffs">
    Agent roept de `diffs`-tool aan met invoer.
  </Step>
  <Step title="Read details">
    Agent leest `details`-velden uit het antwoord.
  </Step>
  <Step title="Present">
    Agent opent `details.viewerUrl` met `canvas present`, verzendt `details.filePath` met `message` met `path` of `filePath`, of doet beide.
  </Step>
</Steps>

## Invoervoorbeelden

<Tabs>
  <Tab title="Before and after">
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

Alle velden zijn optioneel tenzij anders vermeld.

<ParamField path="before" type="string">
  Originele tekst. Vereist met `after` wanneer `patch` is weggelaten.
</ParamField>
<ParamField path="after" type="string">
  Bijgewerkte tekst. Vereist met `before` wanneer `patch` is weggelaten.
</ParamField>
<ParamField path="patch" type="string">
  Uniforme difftekst. Wederzijds uitsluitend met `before` en `after`.
</ParamField>
<ParamField path="path" type="string">
  Weergavebestandsnaam voor de modus voor voor en na.
</ParamField>
<ParamField path="lang" type="string">
  Hint voor taaloverschrijving voor de modus voor voor en na. Onbekende waarden vallen terug op platte tekst.
</ParamField>
<ParamField path="title" type="string">
  Overschrijving van viewertitel.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Uitvoermodus. Standaard ingesteld op Plugin-standaard `defaults.mode`. Verouderde alias: `"image"` gedraagt zich als `"file"` en wordt nog steeds geaccepteerd voor achterwaartse compatibiliteit.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Viewerthema. Standaard ingesteld op Plugin-standaard `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diffindeling. Standaard ingesteld op Plugin-standaard `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Vouw ongewijzigde secties uit wanneer volledige context beschikbaar is. Alleen optie per aanroep (geen Plugin-standaardsleutel).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Gerenderde bestandsindeling. Standaard ingesteld op Plugin-standaard `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Kwaliteitsvoorinstelling voor PNG- of PDF-rendering.
</ParamField>
<ParamField path="fileScale" type="number">
  Overschrijving van apparaatschaal (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maximale renderbreedte in CSS-pixels (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Artefact-TTL in seconden voor viewer- en zelfstandige bestandsuitvoer. Max. 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Overschrijving van oorsprong voor viewer-URL. Overschrijft Plugin `viewerBaseUrl`. Moet `http` of `https` zijn, zonder query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Wordt nog steeds geaccepteerd voor achterwaartse compatibiliteit:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` en `after` elk max. 512 KiB.
    - `patch` max. 2 MiB.
    - `path` max. 2048 bytes.
    - `lang` max. 128 bytes.
    - `title` max. 1024 bytes.
    - Complexiteitslimiet voor patches: max. 128 bestanden en 120000 totale regels.
    - `patch` samen met `before` of `after` wordt geweigerd.
    - Veiligheidslimieten voor gerenderde bestanden (van toepassing op PNG en PDF):
      - `fileQuality: "standard"`: max. 8 MP (8.000.000 gerenderde pixels).
      - `fileQuality: "hq"`: max. 14 MP (14.000.000 gerenderde pixels).
      - `fileQuality: "print"`: max. 24 MP (24.000.000 gerenderde pixels).
      - PDF heeft daarnaast een maximum van 50 pagina's.

  </Accordion>
</AccordionGroup>

## Contract voor uitvoerdetails

De tool retourneert gestructureerde metadata onder `details`.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Gedeelde velden voor modi die een viewer maken:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` wanneer beschikbaar)

  </Accordion>
  <Accordion title="File fields">
    Bestandsvelden wanneer PNG of PDF wordt gerenderd:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (dezelfde waarde als `filePath`, voor compatibiliteit met de berichttool)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    Ook geretourneerd voor bestaande aanroepers:

    - `format` (dezelfde waarde als `fileFormat`)
    - `imagePath` (dezelfde waarde als `filePath`)
    - `imageBytes` (dezelfde waarde als `fileBytes`)
    - `imageQuality` (dezelfde waarde als `fileQuality`)
    - `imageScale` (dezelfde waarde als `fileScale`)
    - `imageMaxWidth` (dezelfde waarde als `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Samenvatting van modusgedrag:

| Modus    | Wat wordt geretourneerd                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Alleen viewervelden.                                                                                                          |
| `"file"` | Alleen bestandsvelden, geen viewerartefact.                                                                                   |
| `"both"` | Viewervelden plus bestandsvelden. Als bestandsrendering mislukt, wordt de viewer nog steeds geretourneerd met `fileError` en alias `imageError`. |

## Samengevouwen ongewijzigde secties

- De viewer kan rijen tonen zoals `N unmodified lines`.
- Uitvouwbesturingselementen op die rijen zijn voorwaardelijk en niet gegarandeerd voor elk invoertype.
- Uitvouwbesturingselementen verschijnen wanneer de gerenderde diff uitbreidbare contextgegevens heeft, wat typisch is voor voor-en-na-invoer.
- Voor veel uniforme patchinvoer zijn weggelaten contextinhouden niet beschikbaar in de geparste patch-hunks, dus de rij kan verschijnen zonder uitvouwbesturingselementen. Dit is verwacht gedrag.
- `expandUnchanged` is alleen van toepassing wanneer uitbreidbare context bestaat.

## Plugin-standaarden

Stel Plugin-brede standaarden in `~/.openclaw/openclaw.json` in:

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
          },
        },
      },
    },
  },
}
```

Ondersteunde standaarden:

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

Expliciete toolparameters overschrijven deze standaarden.

### Persistente configuratie voor viewer-URL

<ParamField path="viewerBaseUrl" type="string">
  Terugval van de Plugin voor geretourneerde viewerlinks wanneer een toolaanroep geen `baseUrl` doorgeeft. Moet `http` of `https` zijn, zonder query/hash.
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
  `false`: niet-loopback-aanvragen naar viewerroutes worden geweigerd. `true`: externe viewers zijn toegestaan als het pad met token geldig is.
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

## Levenscyclus en opslag van artefacten

- Artefacten worden opgeslagen onder de tijdelijke submap: `$TMPDIR/openclaw-diffs`.
- Metadata van viewerartefacten bevat:
  - willekeurige artefact-ID (20 hextekens)
  - willekeurige token (48 hextekens)
  - `createdAt` en `expiresAt`
  - opgeslagen `viewer.html`-pad
- De standaard artefact-TTL is 30 minuten wanneer niet opgegeven.
- De maximaal geaccepteerde viewer-TTL is 6 uur.
- Opschoning wordt opportunistisch uitgevoerd na het maken van artefacten.
- Verlopen artefacten worden verwijderd.
- Terugvalopschoning verwijdert verouderde mappen ouder dan 24 uur wanneer metadata ontbreekt.

## Viewer-URL en netwerkgedrag

Viewerroute:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewerassets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Het viewerdocument resolveert die assets relatief ten opzichte van de viewer-URL, zodat een optioneel `baseUrl`-padvoorvoegsel ook voor beide assetaanvragen behouden blijft.

URL-constructiegedrag:

- Als `baseUrl` van de toolaanroep is opgegeven, wordt deze gebruikt na strikte validatie.
- Anders, als Plugin `viewerBaseUrl` is geconfigureerd, wordt deze gebruikt.
- Zonder een van beide overschrijvingen wordt de viewer-URL standaard ingesteld op loopback `127.0.0.1`.
- Als de Gateway-bindmodus `custom` is en `gateway.customBindHost` is ingesteld, wordt die host gebruikt.

`baseUrl`-regels:

- Moet `http://` of `https://` zijn.
- Query en hash worden geweigerd.
- Oorsprong plus optioneel basispad is toegestaan.

## Beveiligingsmodel

<AccordionGroup>
  <Accordion title="Viewer-verharding">
    - Standaard alleen loopback.
    - Getokeniseerde viewerpaden met strikte ID- en tokenvalidatie.
    - CSP voor viewerrespons:
      - `default-src 'none'`
      - scripts en assets alleen van self
      - geen uitgaande `connect-src`
    - Throttling van externe missers wanneer externe toegang is ingeschakeld:
      - 40 mislukkingen per 60 seconden
      - lock-out van 60 seconden (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Verharding van bestandsweergave">
    - Routering van screenshotbrowserverzoeken is standaard-weigeren.
    - Alleen lokale viewerassets van `http://127.0.0.1/plugins/diffs/assets/*` zijn toegestaan.
    - Externe netwerkverzoeken worden geblokkeerd.

  </Accordion>
</AccordionGroup>

## Browservereisten voor bestandsmodus

`mode: "file"` en `mode: "both"` hebben een Chromium-compatibele browser nodig.

Volgorde van oplossing:

<Steps>
  <Step title="Config">
    `browser.executablePath` in de OpenClaw-configuratie.
  </Step>
  <Step title="Omgevingsvariabelen">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platformfallback">
    Fallback voor ontdekking van platformcommando/pad.
  </Step>
</Steps>

Veelvoorkomende fouttekst:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Los dit op door Chrome, Chromium, Edge of Brave te installeren, of door een van de opties voor het uitvoerbare pad hierboven in te stellen.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Invoervalidatiefouten">
    - `Provide patch or both before and after text.` — neem zowel `before` als `after` op, of geef `patch` op.
    - `Provide either patch or before/after input, not both.` — meng geen invoermodi.
    - `Invalid baseUrl: ...` — gebruik een `http(s)`-origin met optioneel pad, zonder query/hash.
    - `{field} exceeds maximum size (...)` — verklein de payloadgrootte.
    - Weigering van grote patch — verminder het aantal patchbestanden of het totale aantal regels.

  </Accordion>
  <Accordion title="Toegankelijkheid van viewer">
    - De viewer-URL wordt standaard omgezet naar `127.0.0.1`.
    - Voor scenario's met externe toegang:
      - stel Plugin `viewerBaseUrl` in, of
      - geef `baseUrl` per toolaanroep door, of
      - gebruik `gateway.bind=custom` en `gateway.customBindHost`
    - Als `gateway.trustedProxies` loopback bevat voor een proxy op dezelfde host (bijvoorbeeld Tailscale Serve), mislukken ruwe loopback-viewerverzoeken zonder doorgestuurde client-IP-headers bewust gesloten.
    - Voor die proxytopologie:
      - geef de voorkeur aan `mode: "file"` of `mode: "both"` wanneer je alleen een bijlage nodig hebt, of
      - schakel bewust `security.allowRemoteViewer` in en stel Plugin `viewerBaseUrl` in of geef een proxy/openbare `baseUrl` door wanneer je een deelbare viewer-URL nodig hebt
    - Schakel `security.allowRemoteViewer` alleen in wanneer je externe viewertoegang wilt.

  </Accordion>
  <Accordion title="Rij met ongewijzigde regels heeft geen uitvouwknop">
    Dit kan gebeuren bij patchinvoer wanneer de patch geen uitvouwbare context bevat. Dit is verwacht en duidt niet op een viewerfout.
  </Accordion>
  <Accordion title="Artefact niet gevonden">
    - Artefact verlopen vanwege TTL.
    - Token of pad gewijzigd.
    - Opschoning heeft verouderde gegevens verwijderd.

  </Accordion>
</AccordionGroup>

## Operationele richtlijnen

- Geef de voorkeur aan `mode: "view"` voor lokale interactieve reviews in canvas.
- Geef de voorkeur aan `mode: "file"` voor uitgaande chatkanalen die een bijlage nodig hebben.
- Houd `allowRemoteViewer` uitgeschakeld tenzij je implementatie externe viewer-URL's vereist.
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
