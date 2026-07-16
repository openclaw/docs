---
read_when:
    - Si desidera che gli agenti mostrino le modifiche al codice o al Markdown sotto forma di diff
    - Si desidera un URL del visualizzatore pronto per Canvas o un file diff renderizzato
    - Servono artefatti diff controllati e temporanei con impostazioni predefinite sicure
sidebarTitle: Diffs
summary: Visualizzatore di differenze in sola lettura e renderer di file per agenti (strumento Plugin opzionale)
title: Differenze
x-i18n:
    generated_at: "2026-07-16T15:08:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` è uno strumento opzionale di un plugin incluso che trasforma un testo precedente/successivo o una patch unificata in un artefatto diff di sola lettura. Anteposta inoltre brevi indicazioni per l'agente al prompt di sistema e include una skill complementare con istruzioni più complete.

Input: testo `before` + `after`, oppure una `patch` unificata (opzioni mutuamente esclusive).

Output: un URL del visualizzatore del Gateway per la presentazione su canvas, un percorso di file PNG/PDF sottoposto a rendering per la consegna tramite messaggio, oppure entrambi.

## Avvio rapido

<Steps>
  <Step title="Installare il plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Abilitare il plugin">
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
  <Step title="Scegliere una modalità">
    <Tabs>
      <Tab title="view">
        Flussi che privilegiano il canvas: gli agenti chiamano `diffs` con `mode: "view"` e aprono `details.viewerUrl` con `canvas present`.
      </Tab>
      <Tab title="file">
        Consegna di file in chat: gli agenti chiamano `diffs` con `mode: "file"` e inviano `details.filePath` con `message` usando `path` o `filePath`.
      </Tab>
      <Tab title="both">
        Modalità combinata (predefinita): gli agenti chiamano `diffs` con `mode: "both"` per ottenere entrambi gli artefatti con una sola chiamata.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Disabilitare le indicazioni di sistema integrate

Per mantenere lo strumento ma rimuovere le indicazioni anteposte al prompt di sistema, impostare `plugins.entries.diffs.hooks.allowPromptInjection` su `false`:

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

Questa impostazione blocca l'hook `before_prompt_build` del plugin, mantenendo disponibili lo strumento e la skill. Per disabilitare sia le indicazioni sia lo strumento, disabilitare invece il plugin.

## Riferimento per l'input dello strumento

Tutti i campi sono facoltativi, salvo diversa indicazione.

<ParamField path="before" type="string">
  Testo originale. Obbligatorio con `after` quando `patch` viene omesso.
</ParamField>
<ParamField path="after" type="string">
  Testo aggiornato. Obbligatorio con `before` quando `patch` viene omesso.
</ParamField>
<ParamField path="patch" type="string">
  Testo del diff unificato. Mutuamente esclusivo con `before` e `after`.
</ParamField>
<ParamField path="path" type="string">
  Nome file visualizzato per la modalità precedente/successivo.
</ParamField>
<ParamField path="lang" type="string">
  Indicazione per ignorare la lingua rilevata nella modalità precedente/successivo. I valori sconosciuti e le lingue non incluse nel gruppo predefinito del visualizzatore ricorrono al testo normale, a meno che non sia installato il plugin Diff Viewer Language Pack.
</ParamField>
<ParamField path="title" type="string">
  Titolo alternativo del visualizzatore.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modalità di output. Il valore predefinito è quello del plugin `defaults.mode` (`both`). Alias deprecato: `"image"` si comporta in modo identico a `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del visualizzatore. Il valore predefinito è quello del plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Layout del diff. Il valore predefinito è quello del plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Espande le sezioni invariate quando è disponibile il contesto completo. Opzione disponibile solo per singola chiamata (non è una chiave predefinita del plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato del file sottoposto a rendering. Il valore predefinito è quello del plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preimpostazione di qualità per il rendering PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Valore alternativo per la scala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Larghezza massima di rendering in pixel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL dell'artefatto in secondi per il visualizzatore e gli output di file autonomi. Valore massimo: `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Origine alternativa dell'URL del visualizzatore. Sostituisce il valore `viewerBaseUrl` del plugin. Deve essere `http` o `https`, senza query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Convalida e limiti">
    - `before`/`after`: massimo 512 KiB ciascuno.
    - `patch`: massimo 2 MiB.
    - `path`: massimo 2048 byte.
    - `lang`: massimo 128 byte.
    - `title`: massimo 1024 byte.
    - Limite di complessità della patch: massimo 128 file e 120000 righe totali.
    - `patch` insieme a `before`/`after` viene rifiutato.
    - Limiti di sicurezza dei file sottoposti a rendering (PNG e PDF):
      - `fileQuality: "standard"`: massimo 8 MP (8,000,000 pixel sottoposti a rendering).
      - `fileQuality: "hq"`: massimo 14 MP.
      - `fileQuality: "print"`: massimo 24 MP.
      - Anche i PDF sono limitati a 50 pagine.

  </Accordion>
</AccordionGroup>

## Evidenziazione della sintassi

Linguaggi integrati:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` e `toml`.

Gli alias comuni (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` e così via) vengono normalizzati in questi linguaggi.

Installare il plugin Diff Viewer Language Pack per ulteriori linguaggi (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff e altri):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Senza il pacchetto, i linguaggi non supportati vengono comunque visualizzati come testo normale leggibile. Consultare il [plugin Diffs Language Pack](/it/plugins/reference/diffs-language-pack) e i [linguaggi Shiki](https://shiki.style/languages) per il catalogo upstream.

## Contratto dei dettagli di output

Tutti i risultati riusciti includono `changed`: un input precedente/successivo identico restituisce `false` senza creare un artefatto; i risultati sottoposti a rendering restituiscono `true`.

<AccordionGroup>
  <Accordion title="Campi del visualizzatore (modalità view e both)">
    - `changed`
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
  <Accordion title="Campi del file (modalità file e both)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (stesso valore di `filePath`, per la compatibilità con lo strumento per i messaggi)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| Modalità | Restituisce                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `"view"` | Solo i campi del visualizzatore.                                                                             |
| `"file"` | Solo i campi del file, senza alcun artefatto del visualizzatore.                                             |
| `"both"` | I campi del visualizzatore e quelli del file. Se il rendering del file non riesce, il visualizzatore viene comunque restituito con `fileError`. |

### Sezioni invariate compresse

Il visualizzatore mostra righe come `N unmodified lines`. I controlli di espansione vengono visualizzati solo quando il diff sottoposto a rendering dispone di dati contestuali espandibili (in genere per l'input precedente/successivo). Molte patch unificate omettono i corpi del contesto nei rispettivi hunk, quindi la riga può essere visualizzata senza un controllo di espansione: è il comportamento previsto, non un bug. `expandUnchanged` si applica solo quando esiste un contesto espandibile.

### Navigazione tra più file

Le patch che interessano più di un file iniziano con una scheda riepilogativa dei file modificati: conteggi totali di `+N` / `-N`, conteggi per file, badge per file aggiunti/eliminati/rinominati e link di ancoraggio per passare direttamente a ciascun file. I file PNG/PDF sottoposti a rendering mantengono i conteggi nelle intestazioni dei singoli file, ma omettono i selettori interattivi della visualizzazione, poiché in un file statico non sono operativi.

## Valori predefiniti del plugin

Impostare i valori predefiniti per l'intero plugin in `~/.openclaw/openclaw.json`:

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

Chiavi `defaults` supportate: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. I parametri espliciti della chiamata allo strumento hanno la precedenza su questi valori.

### Configurazione persistente dell'URL del visualizzatore

<ParamField path="viewerBaseUrl" type="string">
  Valore di ripiego gestito dal plugin per i link del visualizzatore restituiti quando una chiamata allo strumento non passa `baseUrl`. Deve essere `http` o `https`, senza query/hash.
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
  `false`: le richieste non loopback alle route del visualizzatore vengono negate. `true`: i visualizzatori remoti sono consentiti se il percorso con token è valido.
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

- Gli artefatti si trovano in `$TMPDIR/openclaw-diffs`.
- I metadati del visualizzatore memorizzano un ID artefatto casuale di 20 caratteri esadecimali, un token casuale di 48 caratteri esadecimali, `createdAt`/`expiresAt` e il percorso `viewer.html` memorizzato.
- TTL predefinito degli artefatti: 30 minuti. TTL massimo accettato: 6 ore.
- La pulizia viene eseguita in modo opportunistico dopo ogni chiamata di creazione di un artefatto; gli artefatti scaduti vengono eliminati.
- La scansione di ripiego rimuove le cartelle obsolete più vecchie di 24 ore quando mancano i metadati.

## Comportamento dell'URL del visualizzatore e della rete

Route del visualizzatore: `/plugins/diffs/view/{artifactId}/{token}`

Risorse del visualizzatore:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (solo quando il diff usa la lingua di un language pack)

Il documento del visualizzatore risolve queste risorse rispetto all'URL del visualizzatore, quindi anche un prefisso di percorso facoltativo `baseUrl` viene applicato alle richieste delle risorse.

Ordine di risoluzione dell'URL: `baseUrl` della chiamata allo strumento (dopo una convalida rigorosa) -> `viewerBaseUrl` del Plugin -> valore predefinito di loopback `127.0.0.1`. Se la modalità di associazione del Gateway è `custom` ed è impostato `gateway.customBindHost`, viene usato tale host anziché il loopback.

Regole di `baseUrl`: deve essere `http://` o `https://`; query e hash vengono rifiutati; sono consentiti un'origine e un percorso base facoltativo.

## Modello di sicurezza

<AccordionGroup>
  <Accordion title="Protezione del visualizzatore">
    - Per impostazione predefinita, solo loopback.
    - Percorsi del visualizzatore con token e convalida rigorosa dei formati di ID e token.
    - CSP della risposta del visualizzatore: `default-src 'none'`; script e risorse solo dall'origine stessa; nessuna richiesta `connect-src` in uscita.
    - Limitazione dei tentativi remoti non riusciti quando è abilitato l'accesso remoto: 40 errori in 60 secondi attivano un blocco di 60 secondi (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Protezione del rendering dei file">
    - L'instradamento delle richieste del browser per gli screenshot nega tutto per impostazione predefinita.
    - Sono consentite solo le risorse locali del visualizzatore provenienti da `http://127.0.0.1/plugins/diffs/assets/*`.
    - Le richieste di rete esterne vengono bloccate.

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
    Percorsi di installazione comuni e ricerche `PATH` per Chrome, Chromium, Edge e Brave.
  </Step>
</Steps>

Testo di errore comune: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Per risolvere, installare Chrome, Chromium, Edge o Brave oppure impostare una delle opzioni del percorso dell'eseguibile indicate sopra.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Errori di convalida dell'input">
    - `Provide patch or both before and after text.` -- includere sia `before` sia `after` oppure fornire `patch`.
    - `Provide either patch or before/after input, not both.` -- non combinare modalità di input diverse.
    - `Invalid baseUrl: ...` -- usare un'origine `http(s)` con un percorso facoltativo, senza query/hash.
    - `{field} exceeds maximum size (...)` -- ridurre le dimensioni del payload.
    - Rifiuto di una patch di grandi dimensioni -- ridurre il numero di file della patch o il totale delle righe.

  </Accordion>
  <Accordion title="Accessibilità del visualizzatore">
    - Per impostazione predefinita, l'URL del visualizzatore viene risolto in `127.0.0.1`.
    - Per l'accesso remoto, impostare `viewerBaseUrl` del Plugin, passare `baseUrl` a ogni chiamata oppure usare `gateway.bind=custom` con `gateway.customBindHost`.
    - Se `gateway.trustedProxies` include il loopback per un proxy sullo stesso host (ad esempio Tailscale Serve), le richieste dirette al visualizzatore tramite loopback prive di intestazioni inoltrate con l'IP del client vengono rifiutate per impostazione predefinita, come previsto.
    - Per questa topologia proxy, è preferibile usare `mode: "file"`/`"both"` per un allegato oppure abilitare intenzionalmente `security.allowRemoteViewer` insieme a `viewerBaseUrl` del Plugin/un `baseUrl` del proxy per ottenere un link condivisibile al visualizzatore.
    - Abilitare `security.allowRemoteViewer` solo quando si intende consentire l'accesso esterno al visualizzatore.

  </Accordion>
  <Accordion title="La riga delle righe non modificate non presenta alcun pulsante di espansione">
    Comportamento previsto per un input patch privo di contesto espandibile; non si tratta di un errore del visualizzatore.
  </Accordion>
  <Accordion title="Artefatto non trovato">
    - L'artefatto è scaduto a causa del TTL.
    - Il token o il percorso è cambiato.
    - La pulizia ha rimosso i dati obsoleti.

  </Accordion>
</AccordionGroup>

## Indicazioni operative

- Preferire `mode: "view"` per le revisioni interattive locali nel canvas.
- Preferire `mode: "file"` per i canali di chat in uscita che richiedono un allegato.
- Mantenere `allowRemoteViewer` disabilitato, a meno che la distribuzione non richieda URL remoti del visualizzatore.
- Impostare esplicitamente un `ttlSeconds` breve per i diff sensibili.
- Evitare di inviare segreti nell'input del diff quando non è necessario.
- Se il canale comprime le immagini in modo aggressivo (ad esempio Telegram o WhatsApp), preferire l'output PDF (`fileFormat: "pdf"`).

<Note>
Motore di rendering dei diff basato su [Diffs](https://diffs.com).
</Note>

## Argomenti correlati

- [Browser](/it/tools/browser)
- [Plugin](/it/tools/plugin)
- [Panoramica degli strumenti](/it/tools)
