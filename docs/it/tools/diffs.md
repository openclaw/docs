---
read_when:
    - Vuoi che gli agenti mostrino le modifiche a codice o Markdown come diff
    - Vuoi un URL visualizzabile nel canvas o un file diff renderizzato
    - Hai bisogno di artefatti diff temporanei e controllati con impostazioni predefinite sicure
sidebarTitle: Diffs
summary: Visualizzatore diff in sola lettura e renderer di file per agenti (strumento Plugin facoltativo)
title: Diff
x-i18n:
    generated_at: "2026-04-26T11:39:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` è uno strumento Plugin facoltativo con una breve guida di sistema integrata e una skill complementare che trasforma il contenuto delle modifiche in un artefatto diff in sola lettura per gli agenti.

Accetta uno dei seguenti input:

- testo `before` e `after`
- una `patch` unificata

Può restituire:

- un URL del viewer del gateway per la presentazione nel canvas
- un percorso file renderizzato (PNG o PDF) per la consegna nei messaggi
- entrambi gli output in una sola chiamata

Quando è abilitato, il Plugin antepone una guida d'uso concisa nello spazio del prompt di sistema ed espone anche una skill dettagliata per i casi in cui l'agente abbia bisogno di istruzioni più complete.

## Avvio rapido

<Steps>
  <Step title="Abilita il Plugin">
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
  <Step title="Scegli una modalità">
    <Tabs>
      <Tab title="view">
        Flussi canvas-first: gli agenti chiamano `diffs` con `mode: "view"` e aprono `details.viewerUrl` con `canvas present`.
      </Tab>
      <Tab title="file">
        Consegna file in chat: gli agenti chiamano `diffs` con `mode: "file"` e inviano `details.filePath` con `message` usando `path` o `filePath`.
      </Tab>
      <Tab title="both">
        Combinata: gli agenti chiamano `diffs` con `mode: "both"` per ottenere entrambi gli artefatti in una sola chiamata.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Disabilitare la guida di sistema integrata

Se vuoi mantenere abilitato lo strumento `diffs` ma disabilitare la sua guida integrata nel prompt di sistema, imposta `plugins.entries.diffs.hooks.allowPromptInjection` su `false`:

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

Questo blocca l'hook `before_prompt_build` del Plugin diffs mantenendo disponibili il Plugin, lo strumento e la skill complementare.

Se vuoi disabilitare sia la guida sia lo strumento, disabilita invece il Plugin.

## Flusso di lavoro tipico dell'agente

<Steps>
  <Step title="Chiama diffs">
    L'agente chiama lo strumento `diffs` con l'input.
  </Step>
  <Step title="Leggi details">
    L'agente legge i campi `details` dalla risposta.
  </Step>
  <Step title="Presenta">
    L'agente apre `details.viewerUrl` con `canvas present`, invia `details.filePath` con `message` usando `path` o `filePath`, oppure fa entrambe le cose.
  </Step>
</Steps>

## Esempi di input

<Tabs>
  <Tab title="Before e after">
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

## Riferimento dell'input dello strumento

Tutti i campi sono facoltativi salvo diversa indicazione.

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
  Nome file visualizzato per la modalità before e after.
</ParamField>
<ParamField path="lang" type="string">
  Suggerimento di override della lingua per la modalità before e after. I valori sconosciuti ricadono su testo semplice.
</ParamField>
<ParamField path="title" type="string">
  Override del titolo del viewer.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modalità di output. Predefinita: valore di default del Plugin `defaults.mode`. Alias deprecato: `"image"` si comporta come `"file"` ed è ancora accettato per compatibilità retroattiva.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del viewer. Predefinito: valore di default del Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Layout del diff. Predefinito: valore di default del Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Espande le sezioni non modificate quando è disponibile il contesto completo. Opzione solo per chiamata (non una chiave di default del Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato del file renderizzato. Predefinito: valore di default del Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preset di qualità per il rendering PNG o PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Override della scala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Larghezza massima di rendering in pixel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL dell'artefatto in secondi per viewer e output file standalone. Massimo 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Override dell'origine URL del viewer. Sovrascrive il `viewerBaseUrl` del Plugin. Deve essere `http` o `https`, senza query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Alias di input legacy">
    Ancora accettati per compatibilità retroattiva:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validazione e limiti">
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
      - Il PDF ha anche un massimo di 50 pagine.

  </Accordion>
</AccordionGroup>

## Contratto dei dettagli di output

Lo strumento restituisce metadati strutturati sotto `details`.

<AccordionGroup>
  <Accordion title="Campi del viewer">
    Campi condivisi per le modalità che creano un viewer:

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
  <Accordion title="Campi del file">
    Campi del file quando viene renderizzato PNG o PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (stesso valore di `filePath`, per compatibilità con lo strumento message)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Alias di compatibilità">
    Restituiti anche per i chiamanti esistenti:

    - `format` (stesso valore di `fileFormat`)
    - `imagePath` (stesso valore di `filePath`)
    - `imageBytes` (stesso valore di `fileBytes`)
    - `imageQuality` (stesso valore di `fileQuality`)
    - `imageScale` (stesso valore di `fileScale`)
    - `imageMaxWidth` (stesso valore di `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Riepilogo del comportamento per modalità:

| Modalità | Cosa viene restituito                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Solo campi del viewer.                                                                                                 |
| `"file"` | Solo campi del file, senza artefatto viewer.                                                                           |
| `"both"` | Campi del viewer più campi del file. Se il rendering del file fallisce, il viewer viene comunque restituito con `fileError` e alias `imageError`. |

## Sezioni non modificate compattate

- Il viewer può mostrare righe come `N unmodified lines`.
- I controlli di espansione su queste righe sono condizionali e non garantiti per ogni tipo di input.
- I controlli di espansione compaiono quando il diff renderizzato ha dati di contesto espandibili, cosa tipica per input before e after.
- Per molti input patch unificati, i corpi di contesto omessi non sono disponibili negli hunk della patch analizzata, quindi la riga può comparire senza controlli di espansione. Questo è un comportamento previsto.
- `expandUnchanged` si applica solo quando esiste contesto espandibile.

## Valori predefiniti del Plugin

Imposta i valori predefiniti a livello Plugin in `~/.openclaw/openclaw.json`:

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

Valori predefiniti supportati:

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

I parametri espliciti dello strumento sovrascrivono questi valori predefiniti.

### Configurazione persistente dell'URL del viewer

<ParamField path="viewerBaseUrl" type="string">
  Fallback posseduto dal Plugin per i link del viewer restituiti quando una chiamata allo strumento non passa `baseUrl`. Deve essere `http` o `https`, senza query/hash.
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
  `false`: le richieste non loopback verso le route del viewer vengono negate. `true`: i viewer remoti sono consentiti se il percorso tokenizzato è valido.
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

- Gli artefatti sono memorizzati nella sottocartella temporanea: `$TMPDIR/openclaw-diffs`.
- I metadati dell'artefatto viewer contengono:
  - ID artefatto casuale (20 caratteri esadecimali)
  - token casuale (48 caratteri esadecimali)
  - `createdAt` e `expiresAt`
  - percorso `viewer.html` memorizzato
- Il TTL predefinito dell'artefatto è 30 minuti se non specificato.
- Il TTL massimo accettato per il viewer è 6 ore.
- La pulizia viene eseguita in modo opportunistico dopo la creazione dell'artefatto.
- Gli artefatti scaduti vengono eliminati.
- La pulizia di fallback rimuove le cartelle obsolete più vecchie di 24 ore quando mancano i metadati.

## URL del viewer e comportamento di rete

Route del viewer:

- `/plugins/diffs/view/{artifactId}/{token}`

Asset del viewer:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Il documento del viewer risolve questi asset in modo relativo all'URL del viewer, quindi un prefisso di percorso `baseUrl` facoltativo viene preservato anche per tali richieste di asset.

Comportamento di costruzione dell'URL:

- Se viene fornito `baseUrl` nella chiamata allo strumento, viene usato dopo una validazione rigorosa.
- Altrimenti, se è configurato `viewerBaseUrl` del Plugin, viene usato quello.
- Senza nessuno dei due override, l'URL del viewer usa come predefinito il loopback `127.0.0.1`.
- Se la modalità di bind del gateway è `custom` e `gateway.customBindHost` è impostato, viene usato quell'host.

Regole di `baseUrl`:

- Deve essere `http://` o `https://`.
- Query e hash vengono rifiutati.
- Sono consentiti l'origine più un eventuale percorso base facoltativo.

## Modello di sicurezza

<AccordionGroup>
  <Accordion title="Protezione del viewer">
    - Solo loopback per impostazione predefinita.
    - Percorsi del viewer con token e validazione rigorosa di ID e token.
    - CSP della risposta del viewer:
      - `default-src 'none'`
      - script e asset solo da self
      - nessun `connect-src` in uscita
    - Limitazione dei tentativi falliti remoti quando l'accesso remoto è abilitato:
      - 40 errori in 60 secondi
      - blocco di 60 secondi (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Protezione del rendering dei file">
    - L'instradamento delle richieste del browser per gli screenshot è deny-by-default.
    - Sono consentiti solo gli asset locali del viewer da `http://127.0.0.1/plugins/diffs/assets/*`.
    - Le richieste di rete esterne sono bloccate.

  </Accordion>
</AccordionGroup>

## Requisiti del browser per la modalità file

`mode: "file"` e `mode: "both"` richiedono un browser compatibile con Chromium.

Ordine di risoluzione:

<Steps>
  <Step title="Configurazione">
    `browser.executablePath` nella configurazione di OpenClaw.
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

Correggi installando Chrome, Chromium, Edge o Brave, oppure impostando una delle opzioni di percorso dell'eseguibile sopra.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori di validazione dell'input">
    - `Provide patch or both before and after text.` — includi sia `before` sia `after`, oppure fornisci `patch`.
    - `Provide either patch or before/after input, not both.` — non mescolare le modalità di input.
    - `Invalid baseUrl: ...` — usa un'origine `http(s)` con percorso facoltativo, senza query/hash.
    - `{field} exceeds maximum size (...)` — riduci la dimensione del payload.
    - Rifiuto di patch grandi — riduci il numero di file della patch o il totale delle righe.

  </Accordion>
  <Accordion title="Accessibilità del viewer">
    - L'URL del viewer viene risolto in `127.0.0.1` per impostazione predefinita.
    - Per scenari di accesso remoto, puoi:
      - impostare il `viewerBaseUrl` del Plugin, oppure
      - passare `baseUrl` per singola chiamata allo strumento, oppure
      - usare `gateway.bind=custom` e `gateway.customBindHost`
    - Se `gateway.trustedProxies` include il loopback per un proxy sullo stesso host (per esempio Tailscale Serve), le richieste raw loopback al viewer senza header forwarded client-IP falliscono in modalità fail closed per progettazione.
    - Per questa topologia proxy:
      - preferisci `mode: "file"` o `mode: "both"` quando ti serve solo un allegato, oppure
      - abilita intenzionalmente `security.allowRemoteViewer` e imposta il `viewerBaseUrl` del Plugin o passa un `baseUrl` proxy/pubblico quando ti serve un URL del viewer condivisibile
    - Abilita `security.allowRemoteViewer` solo quando intendi consentire l'accesso esterno al viewer.

  </Accordion>
  <Accordion title="La riga delle linee non modificate non ha il pulsante di espansione">
    Questo può accadere con input patch quando la patch non contiene contesto espandibile. È un comportamento previsto e non indica un guasto del viewer.
  </Accordion>
  <Accordion title="Artefatto non trovato">
    - Artefatto scaduto per TTL.
    - Token o percorso modificati.
    - La pulizia ha rimosso dati obsoleti.

  </Accordion>
</AccordionGroup>

## Linee guida operative

- Preferisci `mode: "view"` per revisioni interattive locali nel canvas.
- Preferisci `mode: "file"` per i canali chat in uscita che richiedono un allegato.
- Mantieni `allowRemoteViewer` disabilitato a meno che il tuo deployment non richieda URL del viewer remoti.
- Imposta `ttlSeconds` brevi ed espliciti per diff sensibili.
- Evita di inviare segreti nell'input diff quando non necessario.
- Se il tuo canale comprime in modo aggressivo le immagini (per esempio Telegram o WhatsApp), preferisci l'output PDF (`fileFormat: "pdf"`).

<Note>
Motore di rendering dei diff basato su [Diffs](https://diffs.com).
</Note>

## Correlati

- [Browser](/it/tools/browser)
- [Plugin](/it/tools/plugin)
- [Panoramica degli strumenti](/it/tools)
