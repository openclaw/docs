---
read_when:
    - Vuoi che gli agenti mostrino le modifiche al codice o al Markdown come diff
    - Vuoi un URL del visualizzatore pronto per il canvas o un file diff renderizzato
    - Servono artefatti diff temporanei e controllati con impostazioni predefinite sicure
sidebarTitle: Diffs
summary: Visualizzatore di diff e renderer di file in sola lettura per agenti (strumento Plugin opzionale)
title: Differenze
x-i18n:
    generated_at: "2026-04-30T09:15:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` è uno strumento plugin opzionale con brevi indicazioni di sistema integrate e una skill complementare che trasforma il contenuto delle modifiche in un artefatto diff di sola lettura per gli agenti.

Accetta uno dei seguenti input:

- testo `before` e `after`
- una `patch` unificata

Può restituire:

- un URL del visualizzatore del Gateway per la presentazione su canvas
- un percorso di file renderizzato (PNG o PDF) per la consegna nei messaggi
- entrambi gli output in una sola chiamata

Quando è abilitato, il plugin antepone indicazioni d'uso concise nello spazio del prompt di sistema ed espone anche una skill dettagliata per i casi in cui l'agente necessita di istruzioni più complete.

## Avvio rapido

<Steps>
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
        Flussi orientati al canvas: gli agenti chiamano `diffs` con `mode: "view"` e aprono `details.viewerUrl` con `canvas present`.
      </Tab>
      <Tab title="file">
        Consegna di file in chat: gli agenti chiamano `diffs` con `mode: "file"` e inviano `details.filePath` con `message` usando `path` o `filePath`.
      </Tab>
      <Tab title="both">
        Combinato: gli agenti chiamano `diffs` con `mode: "both"` per ottenere entrambi gli artefatti in una sola chiamata.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Disabilitare le indicazioni di sistema integrate

Se vuoi mantenere abilitato lo strumento `diffs` ma disabilitare le sue indicazioni integrate nel prompt di sistema, imposta `plugins.entries.diffs.hooks.allowPromptInjection` su `false`:

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

Questo blocca l'hook `before_prompt_build` del plugin diffs mantenendo disponibili il plugin, lo strumento e la skill complementare.

Se vuoi disabilitare sia le indicazioni sia lo strumento, disabilita invece il plugin.

## Flusso di lavoro tipico dell'agente

<Steps>
  <Step title="Call diffs">
    L'agente chiama lo strumento `diffs` con l'input.
  </Step>
  <Step title="Read details">
    L'agente legge i campi `details` dalla risposta.
  </Step>
  <Step title="Present">
    L'agente apre `details.viewerUrl` con `canvas present`, invia `details.filePath` con `message` usando `path` o `filePath`, oppure fa entrambe le cose.
  </Step>
</Steps>

## Esempi di input

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

## Riferimento per l'input dello strumento

Tutti i campi sono opzionali salvo diversa indicazione.

<ParamField path="before" type="string">
  Testo originale. Obbligatorio con `after` quando `patch` è omesso.
</ParamField>
<ParamField path="after" type="string">
  Testo aggiornato. Obbligatorio con `before` quando `patch` è omesso.
</ParamField>
<ParamField path="patch" type="string">
  Testo diff unificato. Mutuamente esclusivo con `before` e `after`.
</ParamField>
<ParamField path="path" type="string">
  Nome file visualizzato per la modalità prima e dopo.
</ParamField>
<ParamField path="lang" type="string">
  Suggerimento per sovrascrivere la lingua nella modalità prima e dopo. I valori sconosciuti ricadono sul testo semplice.
</ParamField>
<ParamField path="title" type="string">
  Sovrascrittura del titolo del visualizzatore.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modalità di output. Il valore predefinito è il default del plugin `defaults.mode`. Alias deprecato: `"image"` si comporta come `"file"` ed è ancora accettato per compatibilità con le versioni precedenti.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del visualizzatore. Il valore predefinito è il default del plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Layout del diff. Il valore predefinito è il default del plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Espande le sezioni invariate quando è disponibile il contesto completo. Opzione solo per singola chiamata (non una chiave predefinita del plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato del file renderizzato. Il valore predefinito è il default del plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preset di qualità per la renderizzazione PNG o PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Sovrascrittura della scala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Larghezza massima di rendering in pixel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL dell'artefatto in secondi per gli output del visualizzatore e del file autonomo. Massimo 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Sovrascrittura dell'origine dell'URL del visualizzatore. Sovrascrive `viewerBaseUrl` del plugin. Deve essere `http` o `https`, senza query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Ancora accettati per compatibilità con le versioni precedenti:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` e `after` massimo 512 KiB ciascuno.
    - `patch` massimo 2 MiB.
    - `path` massimo 2048 byte.
    - `lang` massimo 128 byte.
    - `title` massimo 1024 byte.
    - Limite di complessità della patch: massimo 128 file e 120000 righe totali.
    - `patch` insieme a `before` o `after` viene rifiutato.
    - Limiti di sicurezza per i file renderizzati (si applicano a PNG e PDF):
      - `fileQuality: "standard"`: massimo 8 MP (8.000.000 pixel renderizzati).
      - `fileQuality: "hq"`: massimo 14 MP (14.000.000 pixel renderizzati).
      - `fileQuality: "print"`: massimo 24 MP (24.000.000 pixel renderizzati).
      - Anche il PDF ha un massimo di 50 pagine.

  </Accordion>
</AccordionGroup>

## Contratto dei dettagli di output

Lo strumento restituisce metadati strutturati sotto `details`.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Campi condivisi per le modalità che creano un visualizzatore:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` quando disponibili)

  </Accordion>
  <Accordion title="File fields">
    Campi del file quando viene renderizzato PNG o PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (stesso valore di `filePath`, per compatibilità con lo strumento messaggi)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    Restituiti anche per i chiamanti esistenti:

    - `format` (stesso valore di `fileFormat`)
    - `imagePath` (stesso valore di `filePath`)
    - `imageBytes` (stesso valore di `fileBytes`)
    - `imageQuality` (stesso valore di `fileQuality`)
    - `imageScale` (stesso valore di `fileScale`)
    - `imageMaxWidth` (stesso valore di `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Riepilogo del comportamento della modalità:

| Modalità | Cosa viene restituito                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Solo campi del visualizzatore.                                                                                                                |
| `"file"` | Solo campi del file, nessun artefatto del visualizzatore.                                                                                     |
| `"both"` | Campi del visualizzatore più campi del file. Se il rendering del file non riesce, il visualizzatore viene comunque restituito con alias `fileError` e `imageError`. |

## Sezioni non modificate compresse

- Il visualizzatore può mostrare righe come `N unmodified lines`.
- I controlli di espansione su quelle righe sono condizionali e non garantiti per ogni tipo di input.
- I controlli di espansione compaiono quando il diff renderizzato contiene dati di contesto espandibili, cosa tipica per input prima e dopo.
- Per molti input di patch unificate, i corpi di contesto omessi non sono disponibili negli hunk della patch analizzata, quindi la riga può comparire senza controlli di espansione. Questo è il comportamento previsto.
- `expandUnchanged` si applica solo quando esiste un contesto espandibile.

## Valori predefiniti del Plugin

Imposta i valori predefiniti a livello di Plugin in `~/.openclaw/openclaw.json`:

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

Impostazioni predefinite supportate:

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

I parametri espliciti dello strumento sovrascrivono queste impostazioni predefinite.

### Configurazione dell'URL persistente del visualizzatore

<ParamField path="viewerBaseUrl" type="string">
  Fallback di proprietà del Plugin per i link del visualizzatore restituiti quando una chiamata allo strumento non passa `baseUrl`. Deve essere `http` o `https`, senza query/hash.
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

## Configurazione di sicurezza

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: le richieste non-loopback alle route del viewer vengono negate. `true`: i viewer remoti sono consentiti se il percorso con token è valido.
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

## Ciclo di vita e archiviazione degli artefatti

- Gli artefatti sono archiviati nella sottocartella temporanea: `$TMPDIR/openclaw-diffs`.
- I metadati dell'artefatto del viewer contengono:
  - ID artefatto casuale (20 caratteri esadecimali)
  - token casuale (48 caratteri esadecimali)
  - `createdAt` ed `expiresAt`
  - percorso `viewer.html` archiviato
- Il TTL predefinito dell'artefatto è di 30 minuti quando non specificato.
- Il TTL massimo accettato per il viewer è di 6 ore.
- La pulizia viene eseguita opportunisticamente dopo la creazione dell'artefatto.
- Gli artefatti scaduti vengono eliminati.
- La pulizia di fallback rimuove le cartelle obsolete più vecchie di 24 ore quando i metadati mancano.

## URL del viewer e comportamento di rete

Route del viewer:

- `/plugins/diffs/view/{artifactId}/{token}`

Asset del viewer:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Il documento del viewer risolve questi asset in modo relativo all'URL del viewer, quindi anche un prefisso di percorso `baseUrl` facoltativo viene preservato per entrambe le richieste degli asset.

Comportamento di costruzione dell'URL:

- Se viene fornito `baseUrl` della chiamata allo strumento, viene usato dopo una validazione rigorosa.
- Altrimenti, se `viewerBaseUrl` del Plugin è configurato, viene usato.
- Senza nessuna delle due sostituzioni, l'URL del viewer usa per impostazione predefinita il loopback `127.0.0.1`.
- Se la modalità di bind del Gateway è `custom` e `gateway.customBindHost` è impostato, viene usato quell'host.

Regole di `baseUrl`:

- Deve essere `http://` o `https://`.
- Query e hash vengono rifiutati.
- Sono consentiti l'origine più un percorso base facoltativo.

## Modello di sicurezza

<AccordionGroup>
  <Accordion title="Rafforzamento del viewer">
    - Solo loopback per impostazione predefinita.
    - Percorsi del viewer con token, con validazione rigorosa di ID e token.
    - CSP della risposta del viewer:
      - `default-src 'none'`
      - script e asset solo dalla stessa origine
      - nessun `connect-src` in uscita
    - Limitazione dei miss remoti quando l'accesso remoto è abilitato:
      - 40 errori ogni 60 secondi
      - blocco di 60 secondi (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Rafforzamento del rendering dei file">
    - Il routing delle richieste del browser per gli screenshot è deny-by-default.
    - Sono consentiti solo gli asset del visualizzatore locale da `http://127.0.0.1/plugins/diffs/assets/*`.
    - Le richieste di rete esterne sono bloccate.

  </Accordion>
</AccordionGroup>

## Requisiti del browser per la modalità file

`mode: "file"` e `mode: "both"` richiedono un browser compatibile con Chromium.

Ordine di risoluzione:

<Steps>
  <Step title="Configurazione">
    `browser.executablePath` nella configurazione OpenClaw.
  </Step>
  <Step title="Variabili d'ambiente">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Fallback della piattaforma">
    Fallback di rilevamento di comandi/percorsi della piattaforma.
  </Step>
</Steps>

Testo di errore comune:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Risolvi installando Chrome, Chromium, Edge o Brave, oppure impostando una delle opzioni di percorso dell'eseguibile sopra.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori di validazione dell'input">
    - `Provide patch or both before and after text.` — includi sia `before` sia `after`, oppure fornisci `patch`.
    - `Provide either patch or before/after input, not both.` — non mescolare le modalità di input.
    - `Invalid baseUrl: ...` — usa un'origine `http(s)` con percorso opzionale, senza query/hash.
    - `{field} exceeds maximum size (...)` — riduci la dimensione del payload.
    - Rifiuto di patch grandi — riduci il numero di file della patch o le righe totali.

  </Accordion>
  <Accordion title="Accessibilità del visualizzatore">
    - L'URL del visualizzatore risolve a `127.0.0.1` per impostazione predefinita.
    - Per scenari di accesso remoto:
      - imposta `viewerBaseUrl` del plugin, oppure
      - passa `baseUrl` per ogni chiamata dello strumento, oppure
      - usa `gateway.bind=custom` e `gateway.customBindHost`
    - Se `gateway.trustedProxies` include loopback per un proxy sullo stesso host (ad esempio Tailscale Serve), le richieste raw loopback del visualizzatore senza intestazioni client-IP inoltrate falliscono chiuse per progettazione.
    - Per quella topologia di proxy:
      - preferisci `mode: "file"` o `mode: "both"` quando ti serve solo un allegato, oppure
      - abilita intenzionalmente `security.allowRemoteViewer` e imposta `viewerBaseUrl` del plugin oppure passa un `baseUrl` proxy/pubblico quando ti serve un URL del visualizzatore condivisibile
    - Abilita `security.allowRemoteViewer` solo quando intendi consentire l'accesso esterno al visualizzatore.

  </Accordion>
  <Accordion title="La riga delle righe non modificate non ha un pulsante di espansione">
    Questo può accadere per l'input patch quando la patch non contiene contesto espandibile. È previsto e non indica un errore del visualizzatore.
  </Accordion>
  <Accordion title="Artefatto non trovato">
    - Artefatto scaduto a causa del TTL.
    - Token o percorso modificato.
    - La pulizia ha rimosso dati obsoleti.

  </Accordion>
</AccordionGroup>

## Indicazioni operative

- Preferisci `mode: "view"` per revisioni interattive locali in canvas.
- Preferisci `mode: "file"` per canali chat in uscita che richiedono un allegato.
- Mantieni `allowRemoteViewer` disabilitato a meno che la tua distribuzione richieda URL del visualizzatore remoti.
- Imposta `ttlSeconds` brevi ed espliciti per diff sensibili.
- Evita di inviare segreti nell'input diff quando non è necessario.
- Se il tuo canale comprime le immagini in modo aggressivo (ad esempio Telegram o WhatsApp), preferisci l'output PDF (`fileFormat: "pdf"`).

<Note>
Motore di rendering dei diff basato su [Diffs](https://diffs.com).
</Note>

## Correlati

- [Browser](/it/tools/browser)
- [Plugin](/it/tools/plugin)
- [Panoramica degli strumenti](/it/tools)
