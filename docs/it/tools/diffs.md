---
read_when:
    - Vuoi che gli agenti mostrino modifiche a codice o Markdown come diff
    - Vuoi un URL del visualizzatore pronto per canvas o un file diff renderizzato
    - Hai bisogno di artefatti diff temporanei controllati con impostazioni sicure predefinite
summary: Visualizzatore di diff in sola lettura e renderer di file per agenti (strumento plugin opzionale)
title: Diff
x-i18n:
    generated_at: "2026-04-05T14:06:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diff

`diffs` è uno strumento plugin opzionale con una breve guida di sistema integrata e una skill complementare che trasforma il contenuto delle modifiche in un artefatto diff in sola lettura per gli agenti.

Accetta uno dei seguenti input:

- testo `before` e `after`
- una `patch` unificata

Può restituire:

- un URL del visualizzatore del gateway per la presentazione in canvas
- un percorso file renderizzato (PNG o PDF) per la consegna nei messaggi
- entrambi gli output in una sola chiamata

Quando è abilitato, il plugin antepone una guida d'uso concisa nello spazio del prompt di sistema ed espone anche una skill dettagliata per i casi in cui l'agente ha bisogno di istruzioni più complete.

## Avvio rapido

1. Abilita il plugin.
2. Chiama `diffs` con `mode: "view"` per flussi incentrati prima di tutto sul canvas.
3. Chiama `diffs` con `mode: "file"` per flussi di consegna file in chat.
4. Chiama `diffs` con `mode: "both"` quando ti servono entrambi gli artefatti.

## Abilitare il plugin

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

Questo blocca l'hook `before_prompt_build` del plugin diffs mantenendo disponibili il plugin, lo strumento e la skill complementare.

Se vuoi disabilitare sia la guida sia lo strumento, disabilita invece il plugin.

## Flusso di lavoro tipico dell'agente

1. L'agente chiama `diffs`.
2. L'agente legge i campi `details`.
3. L'agente quindi:
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

- `before` (`string`): testo originale. Obbligatorio con `after` quando `patch` è omesso.
- `after` (`string`): testo aggiornato. Obbligatorio con `before` quando `patch` è omesso.
- `patch` (`string`): testo diff unificato. Mutuamente esclusivo con `before` e `after`.
- `path` (`string`): nome file visualizzato per la modalità before e after.
- `lang` (`string`): suggerimento di override della lingua per la modalità before e after. I valori sconosciuti ricadono su testo semplice.
- `title` (`string`): override del titolo del visualizzatore.
- `mode` (`"view" | "file" | "both"`): modalità di output. Il valore predefinito è quello del plugin `defaults.mode`.
  Alias deprecato: `"image"` si comporta come `"file"` ed è ancora accettato per retrocompatibilità.
- `theme` (`"light" | "dark"`): tema del visualizzatore. Il valore predefinito è quello del plugin `defaults.theme`.
- `layout` (`"unified" | "split"`): layout del diff. Il valore predefinito è quello del plugin `defaults.layout`.
- `expandUnchanged` (`boolean`): espande le sezioni non modificate quando è disponibile il contesto completo. Opzione solo per chiamata singola (non è una chiave predefinita del plugin).
- `fileFormat` (`"png" | "pdf"`): formato del file renderizzato. Il valore predefinito è quello del plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): preset di qualità per il rendering PNG o PDF.
- `fileScale` (`number`): override della scala del dispositivo (`1`-`4`).
- `fileMaxWidth` (`number`): larghezza massima di rendering in pixel CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL dell'artefatto in secondi per visualizzatore e output file standalone. Predefinito 1800, massimo 21600.
- `baseUrl` (`string`): override dell'origine URL del visualizzatore. Sostituisce il plugin `viewerBaseUrl`. Deve essere `http` o `https`, senza query/hash.

Alias di input legacy ancora accettati per retrocompatibilità:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Convalida e limiti:

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

Campi file quando viene renderizzato un PNG o PDF:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (stesso valore di `filePath`, per compatibilità con lo strumento message)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Vengono restituiti anche alias di compatibilità per i chiamanti esistenti:

- `format` (stesso valore di `fileFormat`)
- `imagePath` (stesso valore di `filePath`)
- `imageBytes` (stesso valore di `fileBytes`)
- `imageQuality` (stesso valore di `fileQuality`)
- `imageScale` (stesso valore di `fileScale`)
- `imageMaxWidth` (stesso valore di `fileMaxWidth`)

Riepilogo del comportamento delle modalità:

- `mode: "view"`: solo campi del visualizzatore.
- `mode: "file"`: solo campi file, nessun artefatto del visualizzatore.
- `mode: "both"`: campi del visualizzatore più campi file. Se il rendering del file fallisce, il visualizzatore viene comunque restituito con `fileError` e l'alias di compatibilità `imageError`.

## Sezioni non modificate compresse

- Il visualizzatore può mostrare righe come `N unmodified lines`.
- I controlli di espansione su quelle righe sono condizionali e non garantiti per ogni tipo di input.
- I controlli di espansione compaiono quando il diff renderizzato ha dati di contesto espandibili, cosa tipica dell'input before e after.
- Per molti input patch unificati, i corpi del contesto omesso non sono disponibili negli hunk della patch analizzata, quindi la riga può apparire senza controlli di espansione. Questo è un comportamento previsto.
- `expandUnchanged` si applica solo quando esiste un contesto espandibile.

## Valori predefiniti del plugin

Imposta i valori predefiniti a livello plugin in `~/.openclaw/openclaw.json`:

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

I parametri espliciti dello strumento sostituiscono questi valori predefiniti.

Configurazione persistente dell'URL del visualizzatore:

- `viewerBaseUrl` (`string`, facoltativo)
  - Fallback di proprietà del plugin per i link del visualizzatore restituiti quando una chiamata dello strumento non passa `baseUrl`.
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

## Configurazione della sicurezza

- `security.allowRemoteViewer` (`boolean`, predefinito `false`)
  - `false`: le richieste non loopback alle route del visualizzatore vengono negate.
  - `true`: i visualizzatori remoti sono consentiti se il percorso con token è valido.

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

## Ciclo di vita e archiviazione degli artefatti

- Gli artefatti vengono archiviati nella sottocartella temporanea: `$TMPDIR/openclaw-diffs`.
- I metadati dell'artefatto del visualizzatore contengono:
  - ID artefatto casuale (20 caratteri esadecimali)
  - token casuale (48 caratteri esadecimali)
  - `createdAt` e `expiresAt`
  - percorso `viewer.html` archiviato
- Il TTL predefinito dell'artefatto è 30 minuti quando non specificato.
- Il TTL massimo accettato per il visualizzatore è 6 ore.
- La pulizia viene eseguita in modo opportunistico dopo la creazione dell'artefatto.
- Gli artefatti scaduti vengono eliminati.
- La pulizia di fallback rimuove le cartelle obsolete più vecchie di 24 ore quando mancano i metadati.

## URL del visualizzatore e comportamento di rete

Route del visualizzatore:

- `/plugins/diffs/view/{artifactId}/{token}`

Risorse del visualizzatore:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Il documento del visualizzatore risolve tali risorse in modo relativo all'URL del visualizzatore, quindi un prefisso di percorso `baseUrl` facoltativo viene preservato anche per entrambe le richieste delle risorse.

Comportamento di costruzione dell'URL:

- Se viene fornito `baseUrl` nella chiamata dello strumento, viene usato dopo una rigorosa convalida.
- Altrimenti, se è configurato il plugin `viewerBaseUrl`, viene usato quello.
- Senza nessuno dei due override, l'URL del visualizzatore usa per impostazione predefinita loopback `127.0.0.1`.
- Se la modalità di bind del gateway è `custom` e `gateway.customBindHost` è impostato, viene usato quell'host.

Regole di `baseUrl`:

- Deve essere `http://` o `https://`.
- Query e hash vengono rifiutati.
- Sono consentiti l'origine più un percorso base facoltativo.

## Modello di sicurezza

Rinforzo del visualizzatore:

- Solo loopback per impostazione predefinita.
- Percorsi del visualizzatore con token e convalida rigorosa di ID e token.
- CSP della risposta del visualizzatore:
  - `default-src 'none'`
  - script e risorse solo da self
  - nessun `connect-src` in uscita
- Limitazione delle mancate corrispondenze remote quando l'accesso remoto è abilitato:
  - 40 errori in 60 secondi
  - blocco di 60 secondi (`429 Too Many Requests`)

Rinforzo del rendering dei file:

- L'instradamento delle richieste del browser per screenshot è deny-by-default.
- Sono consentite solo risorse locali del visualizzatore da `http://127.0.0.1/plugins/diffs/assets/*`.
- Le richieste di rete esterne sono bloccate.

## Requisiti del browser per la modalità file

`mode: "file"` e `mode: "both"` richiedono un browser compatibile con Chromium.

Ordine di risoluzione:

1. `browser.executablePath` nella configurazione di OpenClaw.
2. Variabili d'ambiente:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Fallback di rilevamento del comando/percorso della piattaforma.

Testo di errore comune:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Correggi installando Chrome, Chromium, Edge o Brave, oppure impostando una delle opzioni di percorso eseguibile sopra.

## Risoluzione dei problemi

Errori di convalida dell'input:

- `Provide patch or both before and after text.`
  - Includi sia `before` sia `after`, oppure fornisci `patch`.
- `Provide either patch or before/after input, not both.`
  - Non mescolare le modalità di input.
- `Invalid baseUrl: ...`
  - Usa un'origine `http(s)` con percorso facoltativo, senza query/hash.
- `{field} exceeds maximum size (...)`
  - Riduci la dimensione del payload.
- Rifiuto di patch troppo grande
  - Riduci il numero di file della patch o il totale delle righe.

Problemi di accessibilità del visualizzatore:

- L'URL del visualizzatore usa per impostazione predefinita `127.0.0.1`.
- Per scenari di accesso remoto, puoi:
  - impostare il plugin `viewerBaseUrl`, oppure
  - passare `baseUrl` per singola chiamata dello strumento, oppure
  - usare `gateway.bind=custom` e `gateway.customBindHost`
- Se `gateway.trustedProxies` include loopback per un proxy sullo stesso host (per esempio Tailscale Serve), le richieste raw loopback al visualizzatore senza header IP client inoltrati vengono chiuse in modo sicuro per progettazione.
- Per questa topologia proxy:
  - preferisci `mode: "file"` o `mode: "both"` quando ti serve solo un allegato, oppure
  - abilita intenzionalmente `security.allowRemoteViewer` e imposta il plugin `viewerBaseUrl` o passa un `baseUrl` proxy/pubblico quando ti serve un URL del visualizzatore condivisibile
- Abilita `security.allowRemoteViewer` solo quando intendi consentire l'accesso esterno al visualizzatore.

La riga delle righe non modificate non ha il pulsante di espansione:

- Questo può accadere per input patch quando la patch non include contesto espandibile.
- È un comportamento previsto e non indica un errore del visualizzatore.

Artefatto non trovato:

- L'artefatto è scaduto a causa del TTL.
- Il token o il percorso sono cambiati.
- La pulizia ha rimosso dati obsoleti.

## Linee guida operative

- Preferisci `mode: "view"` per revisioni interattive locali in canvas.
- Preferisci `mode: "file"` per canali di chat in uscita che richiedono un allegato.
- Mantieni `allowRemoteViewer` disabilitato a meno che la tua distribuzione non richieda URL di visualizzatore remoti.
- Imposta un `ttlSeconds` breve ed esplicito per diff sensibili.
- Evita di inviare segreti nell'input diff quando non necessario.
- Se il tuo canale comprime aggressivamente le immagini (per esempio Telegram o WhatsApp), preferisci l'output PDF (`fileFormat: "pdf"`).

Motore di rendering dei diff:

- Basato su [Diffs](https://diffs.com).

## Documenti correlati

- [Panoramica degli strumenti](/tools)
- [Plugin](/tools/plugin)
- [Browser](/tools/browser)
