---
read_when:
    - Je wilt dat agenten code- of Markdown-bewerkingen als diffs weergeven
    - Je wilt een canvasklare viewer-URL of een gerenderd diffbestand
    - Je hebt gecontroleerde, tijdelijke diff-artefacten met veilige standaardinstellingen nodig
sidebarTitle: Diffs
summary: Alleen-lezen diffviewer en bestandsrenderer voor agenten (optionele Plugin-tool)
title: Verschillen
x-i18n:
    generated_at: "2026-04-29T23:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` is een optionele plugin-tool met korte ingebouwde systeemrichtlijnen en een begeleidende skill die wijzigingsinhoud omzet in een alleen-lezen diff-artefact voor agents.

Het accepteert een van de volgende opties:

- `before`- en `after`-tekst
- een unified `patch`

Het kan het volgende retourneren:

- een Gateway-viewer-URL voor canvaspresentatie
- een gerenderd bestandspad (PNG of PDF) voor berichtbezorging
- beide uitvoerresultaten in één aanroep

Wanneer ingeschakeld, voegt de plugin beknopte gebruiksrichtlijnen toe aan de system-prompt-ruimte en maakt deze ook een gedetailleerde skill beschikbaar voor gevallen waarin de agent uitgebreidere instructies nodig heeft.

## Snel aan de slag

<Steps>
  <Step title="Schakel de plugin in">
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
        Canvas-eerst-flows: agents roepen `diffs` aan met `mode: "view"` en openen `details.viewerUrl` met `canvas present`.
      </Tab>
      <Tab title="file">
        Bestandsbezorging via chat: agents roepen `diffs` aan met `mode: "file"` en verzenden `details.filePath` met `message` via `path` of `filePath`.
      </Tab>
      <Tab title="both">
        Gecombineerd: agents roepen `diffs` aan met `mode: "both"` om beide artefacten in één aanroep te krijgen.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Ingebouwde systeemrichtlijnen uitschakelen

Als je de `diffs`-tool ingeschakeld wilt houden maar de ingebouwde system-prompt-richtlijnen wilt uitschakelen, stel je `plugins.entries.diffs.hooks.allowPromptInjection` in op `false`:

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

Dit blokkeert de `before_prompt_build`-hook van de diffs-plugin, terwijl de plugin, tool en begeleidende skill beschikbaar blijven.

Als je zowel de richtlijnen als de tool wilt uitschakelen, schakel dan in plaats daarvan de plugin uit.

## Typische agent-workflow

<Steps>
  <Step title="Roep diffs aan">
    De agent roept de `diffs`-tool aan met invoer.
  </Step>
  <Step title="Lees details">
    De agent leest `details`-velden uit de respons.
  </Step>
  <Step title="Presenteer">
    De agent opent `details.viewerUrl` met `canvas present`, verzendt `details.filePath` met `message` via `path` of `filePath`, of doet beide.
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
  Weergavebestandsnaam voor de voor-en-na-modus.
</ParamField>
<ParamField path="lang" type="string">
  Hint voor taaloverschrijving voor de voor-en-na-modus. Onbekende waarden vallen terug op platte tekst.
</ParamField>
<ParamField path="title" type="string">
  Overschrijving van viewertitel.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Uitvoermodus. Standaardwaarde is de standaardinstelling van de plugin `defaults.mode`. Verouderde alias: `"image"` gedraagt zich als `"file"` en wordt nog steeds geaccepteerd voor achterwaartse compatibiliteit.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Viewerthema. Standaardwaarde is de standaardinstelling van de plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff-indeling. Standaardwaarde is de standaardinstelling van de plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Vouw ongewijzigde secties uit wanneer volledige context beschikbaar is. Alleen optie per aanroep (geen standaardinstellingssleutel van de plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Gerenderde bestandsindeling. Standaardwaarde is de standaardinstelling van de plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Kwaliteitspreset voor PNG- of PDF-rendering.
</ParamField>
<ParamField path="fileScale" type="number">
  Overschrijving van apparaatschaal (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maximale renderbreedte in CSS-pixels (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Artefact-TTL in seconden voor viewer- en zelfstandige bestandsuitvoer. Maximaal 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Overschrijving van oorsprong voor viewer-URL. Overschrijft plugin `viewerBaseUrl`. Moet `http` of `https` zijn, zonder query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Verouderde invoeraliassen">
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
    - Limiet voor patchcomplexiteit: maximaal 128 bestanden en 120000 regels in totaal.
    - `patch` en `before` of `after` samen worden geweigerd.
    - Veiligheidslimieten voor gerenderde bestanden (van toepassing op PNG en PDF):
      - `fileQuality: "standard"`: maximaal 8 MP (8.000.000 gerenderde pixels).
      - `fileQuality: "hq"`: maximaal 14 MP (14.000.000 gerenderde pixels).
      - `fileQuality: "print"`: maximaal 24 MP (24.000.000 gerenderde pixels).
      - PDF heeft daarnaast een maximum van 50 pagina's.

  </Accordion>
</AccordionGroup>

## Contract voor uitvoerdetails

De tool retourneert gestructureerde metadata onder `details`.

<AccordionGroup>
  <Accordion title="Viewervelden">
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
  <Accordion title="Bestandsvelden">
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
  <Accordion title="Compatibiliteitsaliassen">
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
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Alleen viewervelden.                                                                                                         |
| `"file"` | Alleen bestandsvelden, geen viewer-artefact.                                                                                 |
| `"both"` | Viewervelden plus bestandsvelden. Als bestandsrendering mislukt, retourneert de viewer nog steeds met de alias `fileError` en `imageError`. |

## Samengevouwen ongewijzigde secties

- De viewer kan rijen tonen zoals `N unmodified lines`.
- Uitvouwknoppen op die rijen zijn voorwaardelijk en niet gegarandeerd voor elk invoertype.
- Uitvouwknoppen verschijnen wanneer de gerenderde diff uitbreidbare contextgegevens heeft, wat typisch is voor voor- en na-invoer.
- Voor veel unified-patch-invoer is weggelaten contextinhoud niet beschikbaar in de geparseerde patchhunks, zodat de rij zonder uitvouwknoppen kan verschijnen. Dit is verwacht gedrag.
- `expandUnchanged` is alleen van toepassing wanneer uitbreidbare context bestaat.

## Plugin-standaardinstellingen

Stel Pluginbrede standaardinstellingen in `~/.openclaw/openclaw.json` in:

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

Ondersteunde standaardinstellingen:

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

Expliciete toolparameters overschrijven deze standaardinstellingen.

### Configuratie voor permanente viewer-URL

<ParamField path="viewerBaseUrl" type="string">
  Fallback in eigendom van de Plugin voor geretourneerde viewerlinks wanneer een toolaanroep geen `baseUrl` doorgeeft. Moet `http` of `https` zijn, zonder query/hash.
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
  `false`: niet-loopback-verzoeken naar viewerroutes worden geweigerd. `true`: externe viewers zijn toegestaan als het getokeniseerde pad geldig is.
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
- Metadata van viewer-artefacten bevat:
  - willekeurige artefact-ID (20 hextekens)
  - willekeurig token (48 hextekens)
  - `createdAt` en `expiresAt`
  - opgeslagen pad naar `viewer.html`
- De standaard-TTL voor artefacten is 30 minuten wanneer deze niet is opgegeven.
- De maximaal geaccepteerde viewer-TTL is 6 uur.
- Opschoning wordt opportunistisch uitgevoerd na het maken van artefacten.
- Verlopen artefacten worden verwijderd.
- Fallbackopschoning verwijdert verouderde mappen ouder dan 24 uur wanneer metadata ontbreekt.

## Viewer-URL en netwerkgedrag

Viewerroute:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewerassets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Het viewerdocument lost die assets relatief ten opzichte van de viewer-URL op, zodat een optioneel `baseUrl`-padprefix ook voor beide assetverzoeken behouden blijft.

Gedrag voor URL-constructie:

- Als toolaanroep `baseUrl` wordt opgegeven, wordt deze gebruikt na strikte validatie.
- Anders, als Plugin `viewerBaseUrl` is geconfigureerd, wordt deze gebruikt.
- Zonder een van beide overschrijvingen gebruikt de viewer-URL standaard loopback `127.0.0.1`.
- Als Gateway-bindmodus `custom` is en `gateway.customBindHost` is ingesteld, wordt die host gebruikt.

`baseUrl`-regels:

- Moet `http://` of `https://` zijn.
- Query en hash worden geweigerd.
- Origin plus optioneel basispad is toegestaan.

## Beveiligingsmodel

<AccordionGroup>
  <Accordion title="Viewer-hardening">
    - Standaard alleen loopback.
    - Getokeniseerde viewerpaden met strikte validatie van ID en token.
    - CSP voor viewerrespons:
      - `default-src 'none'`
      - scripts en assets alleen van self
      - geen uitgaande `connect-src`
    - Throttling van externe misses wanneer externe toegang is ingeschakeld:
      - 40 fouten per 60 seconden
      - 60 seconden lock-out (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Verharding van bestandsrendering">
    - Routering van screenshotbrowserverzoeken is standaard geweigerd.
    - Alleen lokale viewer-assets van `http://127.0.0.1/plugins/diffs/assets/*` zijn toegestaan.
    - Externe netwerkverzoeken worden geblokkeerd.

  </Accordion>
</AccordionGroup>

## Browservereisten voor bestandsmodus

`mode: "file"` en `mode: "both"` hebben een Chromium-compatibele browser nodig.

Volgorde voor het bepalen:

<Steps>
  <Step title="Configuratie">
    `browser.executablePath` in OpenClaw-configuratie.
  </Step>
  <Step title="Omgevingsvariabelen">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platformterugval">
    Terugval via platformopdracht-/paddetectie.
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
    - Afwijzing van grote patch — verminder het aantal patchbestanden of het totale aantal regels.

  </Accordion>
  <Accordion title="Toegankelijkheid van viewer">
    - De viewer-URL wordt standaard omgezet naar `127.0.0.1`.
    - Voor scenario's met externe toegang:
      - stel Plugin `viewerBaseUrl` in, of
      - geef `baseUrl` per toolaanroep mee, of
      - gebruik `gateway.bind=custom` en `gateway.customBindHost`
    - Als `gateway.trustedProxies` loopback bevat voor een proxy op dezelfde host (bijvoorbeeld Tailscale Serve), mislukken onbewerkte loopback-viewerverzoeken zonder doorgestuurde client-IP-headers standaard gesloten.
    - Voor die proxytopologie:
      - geef de voorkeur aan `mode: "file"` of `mode: "both"` wanneer je alleen een bijlage nodig hebt, of
      - schakel bewust `security.allowRemoteViewer` in en stel Plugin `viewerBaseUrl` in of geef een proxy-/publieke `baseUrl` mee wanneer je een deelbare viewer-URL nodig hebt
    - Schakel `security.allowRemoteViewer` alleen in wanneer je externe viewertoegang bedoelt.

  </Accordion>
  <Accordion title="Rij met ongewijzigde regels heeft geen uitvouwknop">
    Dit kan gebeuren bij patchinvoer wanneer de patch geen uitbreidbare context bevat. Dit is verwacht en wijst niet op een viewerfout.
  </Accordion>
  <Accordion title="Artefact niet gevonden">
    - Artefact verlopen door TTL.
    - Token of pad gewijzigd.
    - Opschoning heeft verouderde data verwijderd.

  </Accordion>
</AccordionGroup>

## Operationele richtlijnen

- Geef de voorkeur aan `mode: "view"` voor lokale interactieve reviews in canvas.
- Geef de voorkeur aan `mode: "file"` voor uitgaande chatkanalen die een bijlage nodig hebben.
- Laat `allowRemoteViewer` uitgeschakeld tenzij je implementatie externe viewer-URL's vereist.
- Stel expliciete korte `ttlSeconds` in voor gevoelige diffs.
- Vermijd het verzenden van geheimen in diffinvoer wanneer dat niet nodig is.
- Als je kanaal afbeeldingen agressief comprimeert (bijvoorbeeld Telegram of WhatsApp), geef dan de voorkeur aan PDF-uitvoer (`fileFormat: "pdf"`).

<Note>
Diff-renderingengine mogelijk gemaakt door [Diffs](https://diffs.com).
</Note>

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Plugins](/nl/tools/plugin)
- [Tooloverzicht](/nl/tools)
