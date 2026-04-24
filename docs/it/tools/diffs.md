---
read_when:
    - |-
      Vuoi che gli agenti mostrino modifiche di codice o markdown come diffкәаanalysis to=functions.read արվումcommentary  彩神争霸邀请码commentary to=functions.read  天天中彩票谁json
      {"path":"docs/.i18n/glossary.it.json","offset":1,"limit":200}
    - |-
      Vuoi un URL del visualizzatore pronto per canvas o un file diff renderizzato♀♀♀analysis to=functions.read даҩcommentary 彩彩票娱乐commentary to=functions.read  久赢json
      {"path":"docs/.i18n/glossary.it.json","offset":1,"limit":200}
    - Ti servono artifact diff controllati, temporanei e con valori predefiniti sicuri
summary: Visualizzatore diff e renderer di file in sola lettura per agenti (strumento Plugin facoltativo)
title: Diffs
x-i18n:
    generated_at: "2026-04-24T09:05:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` è uno strumento Plugin facoltativo con una breve guida di sistema integrata e una skill complementare che trasforma il contenuto delle modifiche in un artifact diff in sola lettura per gli agenti.

Accetta uno dei due formati:

- testo `before` e `after`
- un `patch` unificato

Può restituire:

- un URL del visualizzatore del gateway per la presentazione canvas
- un percorso file renderizzato (PNG o PDF) per il recapito nei messaggi
- entrambi gli output in una sola chiamata

Quando è abilitato, il Plugin antepone una guida d'uso concisa nello spazio del prompt di sistema ed espone anche una skill dettagliata per i casi in cui l'agente ha bisogno di istruzioni più complete.

## Avvio rapido

1. Abilita il Plugin.
2. Chiama `diffs` con `mode: "view"` per flussi canvas-first.
3. Chiama `diffs` con `mode: "file"` per flussi di recapito di file in chat.
4. Chiama `diffs` con `mode: "both"` quando ti servono entrambi gli artifact.

## Abilitare il Plugin

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

Questo blocca l'hook `before_prompt_build` del plugin diffs mantenendo disponibili Plugin, strumento e skill complementare.

Se vuoi disabilitare sia la guida sia lo strumento, disabilita invece il Plugin.

## Workflow tipico dell'agente

1. L'agente chiama `diffs`.
2. L'agente legge i campi `details`.
3. L'agente poi:
   - apre `details.viewerUrl` con `canvas present`
   - invia `details.filePath` con `message` usando `path` o `filePath`
   - fa entrambe le cose

## Esempi di input

Before e after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Riferimento dell'input dello strumento

Tutti i campi sono facoltativi salvo diversa indicazione:

- `before` (`string`): testo originale. Obbligatorio insieme a `after` quando `patch` è omesso.
- `after` (`string`): testo aggiornato. Obbligatorio insieme a `before` quando `patch` è omesso.
- `patch` (`string`): testo diff unificato. Mutualmente esclusivo con `before` e `after`.
- `path` (`string`): nome file visualizzato per la modalità before e after.
- `lang` (`string`): suggerimento di override della lingua per la modalità before e after. I valori sconosciuti usano il fallback al testo semplice.
- `title` (`string`): override del titolo del visualizzatore.
- `mode` (`"view" | "file" | "both"`): modalità di output. Il valore predefinito è il valore del Plugin `defaults.mode`.
  Alias deprecato: `"image"` si comporta come `"file"` ed è ancora accettato per compatibilità retroattiva.
- `theme` (`"light" | "dark"`): tema del visualizzatore. Il valore predefinito è il valore del Plugin `defaults.theme`.
- `layout` (`"unified" | "split"`): layout del diff. Il valore predefinito è il valore del Plugin `defaults.layout`.
- `expandUnchanged` (`boolean`): espande le sezioni non modificate quando è disponibile il contesto completo. Opzione solo per chiamata (non è una chiave predefinita del Plugin).
- `fileFormat` (`"png" | "pdf"`): formato del file renderizzato. Il valore predefinito è il valore del Plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): preset di qualità per il rendering PNG o PDF.
- `fileScale` (`number`): override della scala del dispositivo (`1`-`4`).
- `fileMaxWidth` (`number`): larghezza massima di rendering in pixel CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL dell'artifact in secondi per visualizzatore e output file standalone. Predefinito 1800, massimo 21600.
- `baseUrl` (`string`): override dell'origine URL del visualizzatore. Sovrascrive `viewerBaseUrl` del Plugin. Deve essere `http` o `https`, senza query/hash.

Alias di input legacy ancora accettati per compatibilità retroattiva:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validazione e limiti:

- `before` e `after` massimo 512 KiB ciascuno.
- `patch` massimo 2 MiB.
- `path` massimo 2048 byte.
- `lang` massimo 128 byte.
- `title` massimo 1024 byte.
- Limite di complessità del patch: massimo 128 file e 120000 righe totali.
- `patch` insieme a `before` o `after` viene rifiutato.
- Limiti di sicurezza del file renderizzato (si applicano sia a PNG sia a PDF):
  - `fileQuality: "standard"`: massimo 8 MP (8.000.000 pixel renderizzati).
  - `fileQuality: "hq"`: massimo 14 MP (14.000.000 pixel renderizzati).
  - `fileQuality: "print"`: massimo 24 MP (24.000.000 pixel renderizzati).
  - Il PDF ha inoltre un massimo di 50 pagine.

## Contratto dei dettagli di output

Lo strumento restituisce metadati strutturati sotto `details`.

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

Campi file quando viene renderizzato PNG o PDF:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (stesso valore di `filePath`, per compatibilità con lo strumento message)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Alias di compatibilità restituiti anche per i chiamanti esistenti:

- `format` (stesso valore di `fileFormat`)
- `imagePath` (stesso valore di `filePath`)
- `imageBytes` (stesso valore di `fileBytes`)
- `imageQuality` (stesso valore di `fileQuality`)
- `imageScale` (stesso valore di `fileScale`)
- `imageMaxWidth` (stesso valore di `fileMaxWidth`)

Riepilogo del comportamento per modalità:

- `mode: "view"`: solo campi del visualizzatore.
- `mode: "file"`: solo campi del file, nessun artifact del visualizzatore.
- `mode: "both"`: campi del visualizzatore più campi del file. Se il rendering del file fallisce, il visualizzatore viene comunque restituito con `fileError` e alias di compatibilità `imageError`.

## Sezioni non modificate compresse

- Il visualizzatore può mostrare righe come `N unmodified lines`.
- I controlli di espansione su quelle righe sono condizionali e non garantiti per ogni tipo di input.
- I controlli di espansione compaiono quando il diff renderizzato ha dati di contesto espandibili, cosa tipica per input before e after.
- Per molti input unified patch, i corpi di contesto omessi non sono disponibili negli hunk del patch parsato, quindi la riga può comparire senza controlli di espansione. Questo è comportamento previsto.
- `expandUnchanged` si applica solo quando esiste contesto espandibile.

## Valori predefiniti del Plugin

Imposta i valori predefiniti globali del Plugin in `~/.openclaw/openclaw.json`:

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

Configurazione persistente dell'URL del visualizzatore:

- `viewerBaseUrl` (`string`, facoltativo)
  - Fallback di proprietà del Plugin per i link del visualizzatore restituiti quando una chiamata allo strumento non passa `baseUrl`.
  - Deve essere `http` o `https`, senza query/hash.

Esempio:

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

- `security.allowRemoteViewer` (`boolean`, predefinito `false`)
  - `false`: le richieste non-loopback verso le route del visualizzatore vengono negate.
  - `true`: i visualizzatori remoti sono consentiti se il percorso tokenizzato è valido.

Esempio:

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

## Ciclo di vita e archiviazione degli artifact

- Gli artifact vengono memorizzati nella sottocartella temporanea: `$TMPDIR/openclaw-diffs`.
- I metadati degli artifact del visualizzatore contengono:
  - ID artifact casuale (20 caratteri esadecimali)
  - token casuale (48 caratteri esadecimali)
  - `createdAt` e `expiresAt`
  - percorso `viewer.html` memorizzato
- Il TTL predefinito dell'artifact è 30 minuti quando non specificato.
- Il TTL massimo accettato del visualizzatore è 6 ore.
- La pulizia viene eseguita in modo opportunistico dopo la creazione dell'artifact.
- Gli artifact scaduti vengono eliminati.
- La pulizia di fallback rimuove le cartelle stale più vecchie di 24 ore quando mancano i metadati.

## URL del visualizzatore e comportamento di rete

Route del visualizzatore:

- `/plugins/diffs/view/{artifactId}/{token}`

Asset del visualizzatore:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Il documento del visualizzatore risolve quegli asset relativamente all'URL del visualizzatore, quindi un prefisso di percorso `baseUrl` facoltativo viene preservato anche per le richieste degli asset.

Comportamento della costruzione dell'URL:

- Se viene fornito `baseUrl` nella chiamata allo strumento, viene usato dopo una validazione rigorosa.
- Altrimenti, se è configurato `viewerBaseUrl` del Plugin, viene usato quello.
- Senza nessuno dei due override, l'URL del visualizzatore usa come predefinito il loopback `127.0.0.1`.
- Se la modalità di bind del gateway è `custom` e `gateway.customBindHost` è impostato, viene usato quell'host.

Regole di `baseUrl`:

- Deve essere `http://` o `https://`.
- Query e hash vengono rifiutati.
- È consentita l'origine più un percorso base facoltativo.

## Modello di sicurezza

Hardening del visualizzatore:

- Solo loopback per impostazione predefinita.
- Percorsi del visualizzatore tokenizzati con validazione rigorosa di ID e token.
- CSP della risposta del visualizzatore:
  - `default-src 'none'`
  - script e asset solo da self
  - nessun `connect-src` in uscita
- Throttling dei miss remoti quando l'accesso remoto è abilitato:
  - 40 errori in 60 secondi
  - lockout di 60 secondi (`429 Too Many Requests`)

Hardening del rendering dei file:

- L'instradamento delle richieste del browser per gli screenshot è deny-by-default.
- Sono consentiti solo asset locali del visualizzatore da `http://127.0.0.1/plugins/diffs/assets/*`.
- Le richieste di rete esterne sono bloccate.

## Requisiti del browser per la modalità file

`mode: "file"` e `mode: "both"` richiedono un browser compatibile con Chromium.

Ordine di risoluzione:

1. `browser.executablePath` nella configurazione OpenClaw.
2. Variabili d'ambiente:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Fallback di rilevamento comando/percorso della piattaforma.

Testo di errore comune:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Correggi installando Chrome, Chromium, Edge o Brave, oppure impostando una delle opzioni di percorso dell'eseguibile sopra.

## Risoluzione dei problemi

Errori di validazione dell'input:

- `Provide patch or both before and after text.`
  - Includi sia `before` sia `after`, oppure fornisci `patch`.
- `Provide either patch or before/after input, not both.`
  - Non mischiare le modalità di input.
- `Invalid baseUrl: ...`
  - Usa un'origine `http(s)` con percorso facoltativo, senza query/hash.
- `{field} exceeds maximum size (...)`
  - Riduci la dimensione del payload.
- Rifiuto di patch troppo grande
  - Riduci il numero di file del patch o il totale delle righe.

Problemi di accessibilità del visualizzatore:

- L'URL del visualizzatore usa come predefinito `127.0.0.1`.
- Per scenari di accesso remoto, oppure:
  - imposta `viewerBaseUrl` del Plugin, oppure
  - passa `baseUrl` per chiamata allo strumento, oppure
  - usa `gateway.bind=custom` e `gateway.customBindHost`
- Se `gateway.trustedProxies` include loopback per un proxy sullo stesso host (ad esempio Tailscale Serve), le richieste raw del visualizzatore in loopback senza header di IP client inoltrato falliscono in modalità fail-closed per progettazione.
- Per quella topologia di proxy:
  - preferisci `mode: "file"` o `mode: "both"` quando ti serve solo un allegato, oppure
  - abilita intenzionalmente `security.allowRemoteViewer` e imposta `viewerBaseUrl` del Plugin o passa un `baseUrl` proxy/pubblico quando hai bisogno di un URL del visualizzatore condivisibile
- Abilita `security.allowRemoteViewer` solo quando intendi davvero consentire l'accesso esterno al visualizzatore.

La riga delle linee non modificate non ha il pulsante di espansione:

- Questo può accadere per input patch quando il patch non contiene contesto espandibile.
- Questo è comportamento previsto e non indica un guasto del visualizzatore.

Artifact non trovato:

- L'artifact è scaduto a causa del TTL.
- Il token o il percorso sono cambiati.
- La pulizia ha rimosso dati stale.

## Indicazioni operative

- Preferisci `mode: "view"` per revisioni interattive locali in canvas.
- Preferisci `mode: "file"` per canali chat in uscita che richiedono un allegato.
- Mantieni `allowRemoteViewer` disabilitato a meno che la tua distribuzione non richieda URL del visualizzatore remoti.
- Imposta `ttlSeconds` brevi ed espliciti per diff sensibili.
- Evita di inviare segreti nell'input del diff quando non necessario.
- Se il tuo canale comprime in modo aggressivo le immagini (ad esempio Telegram o WhatsApp), preferisci l'output PDF (`fileFormat: "pdf"`).

Motore di rendering dei diff:

- Basato su [Diffs](https://diffs.com).

## Documenti correlati

- [Panoramica degli strumenti](/it/tools)
- [Plugin](/it/tools/plugin)
- [Browser](/it/tools/browser)
