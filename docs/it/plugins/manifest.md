---
read_when:
    - Stai creando un plugin OpenClaw
    - Devi distribuire uno schema di configurazione del plugin o eseguire il debug degli errori di validazione del plugin
summary: Manifest del plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifest del plugin
x-i18n:
    generated_at: "2026-04-07T08:15:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22d41b9f8748b1b1b066ee856be4a8f41e88b9a8bc073d74fc79d2bb0982f01a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest del plugin (`openclaw.plugin.json`)

Questa pagina riguarda solo il **manifest nativo dei plugin OpenClaw**.

Per i layout di bundle compatibili, vedi [Bundle di plugin](/it/plugins/bundles).

I formati di bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` o il layout predefinito del componente Claude
  senza un manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout di bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le radici
Skills dichiarate, le radici dei comandi Claude, i valori predefiniti di `settings.json` del bundle Claude,
i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde
alle aspettative di runtime di OpenClaw.

Ogni plugin OpenClaw nativo **deve** includere un file `openclaw.plugin.json` nella
**radice del plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire il codice del plugin**. I manifest mancanti o non validi vengono trattati come
errori del plugin e bloccano la validazione della configurazione.

Vedi la guida completa al sistema di plugin: [Plugins](/it/tools/plugin).
Per il modello di capacità nativo e le indicazioni attuali sulla compatibilità esterna:
[Modello di capacità](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il
codice del tuo plugin.

Usalo per:

- identità del plugin
- validazione della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il runtime
  del plugin
- metadati di alias e auto-enable che devono essere risolti prima del caricamento del runtime del plugin
- metadati sintetici di appartenenza alla famiglia di modelli che devono attivare automaticamente il
  plugin prima del caricamento del runtime
- snapshot statiche di appartenenza alle capacità usate per il wiring di compatibilità dei bundle e
  la copertura dei contratti
- metadati di configurazione specifici del canale che devono confluire nelle superfici di catalogo e validazione
  senza caricare il runtime
- suggerimenti UI per la configurazione

Non usarlo per:

- registrare comportamento runtime
- dichiarare entrypoint di codice
- metadati di installazione npm

Questi appartengono al codice del plugin e a `package.json`.

## Esempio minimo

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Esempio completo

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin provider OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Chiave API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Chiave API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Chiave API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Riferimento dei campi di primo livello

| Campo                               | Obbligatorio | Tipo                             | Significato                                                                                                                                                                                                  |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Sì           | `string`                         | ID canonico del plugin. È l'ID usato in `plugins.entries.<id>`.                                                                                                                                              |
| `configSchema`                      | Sì           | `object`                         | JSON Schema inline per la configurazione di questo plugin.                                                                                                                                                    |
| `enabledByDefault`                  | No           | `true`                           | Contrassegna un plugin incluso come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita. |
| `legacyPluginIds`                   | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del plugin.                                                                                                                                          |
| `autoEnableWhenConfiguredProviders` | No           | `string[]`                       | ID provider che devono abilitare automaticamente questo plugin quando auth, config o riferimenti di modello li menzionano.                                                                                  |
| `kind`                              | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo di plugin esclusivo usato da `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | No           | `string[]`                       | ID di canali posseduti da questo plugin. Usati per rilevamento e validazione della configurazione.                                                                                                           |
| `providers`                         | No           | `string[]`                       | ID provider posseduti da questo plugin.                                                                                                                                                                       |
| `modelSupport`                      | No           | `object`                         | Metadati sintetici di appartenenza alla famiglia di modelli posseduti dal manifest usati per caricare automaticamente il plugin prima del runtime.                                                          |
| `cliBackends`                       | No           | `string[]`                       | ID backend CLI inference posseduti da questo plugin. Usati per l'auto-attivazione all'avvio da riferimenti di configurazione espliciti.                                                                     |
| `providerAuthEnvVars`               | No           | `Record<string, string[]>`       | Metadati env leggeri per l'autenticazione provider che OpenClaw può ispezionare senza caricare il codice del plugin.                                                                                        |
| `channelEnvVars`                    | No           | `Record<string, string[]>`       | Metadati env leggeri per i canali che OpenClaw può ispezionare senza caricare il codice del plugin. Usalo per setup di canali guidati da env o superfici di autenticazione che helper generici di startup/config devono poter vedere. |
| `providerAuthChoices`               | No           | `object[]`                       | Metadati leggeri delle scelte di autenticazione per selettori di onboarding, risoluzione del provider preferito e semplice wiring dei flag CLI.                                                             |
| `contracts`                         | No           | `object`                         | Snapshot statica di capacità incluse per speech, trascrizione realtime, voce realtime, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search e appartenenza degli strumenti. |
| `channelConfigs`                    | No           | `Record<string, object>`         | Metadati di configurazione del canale posseduti dal manifest, uniti alle superfici di rilevamento e validazione prima del caricamento del runtime.                                                          |
| `skills`                            | No           | `string[]`                       | Directory Skills da caricare, relative alla radice del plugin.                                                                                                                                               |
| `name`                              | No           | `string`                         | Nome leggibile del plugin.                                                                                                                                                                                   |
| `description`                       | No           | `string`                         | Breve riepilogo mostrato nelle superfici del plugin.                                                                                                                                                         |
| `version`                           | No           | `string`                         | Versione informativa del plugin.                                                                                                                                                                             |
| `uiHints`                           | No           | `Record<string, object>`         | Etichette UI, placeholder e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                       |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima che il runtime del provider venga caricato.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                                  |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`            | Sì           | `string`                                        | ID del provider a cui appartiene questa scelta.                                                              |
| `method`              | Sì           | `string`                                        | ID del metodo di autenticazione a cui inoltrare.                                                             |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di autenticazione usato da onboarding e flussi CLI.                                  |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                            |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il selettore.                                                                       |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.                |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente pur consentendo ancora la selezione manuale via CLI.       |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy delle scelte che devono reindirizzare gli utenti a questa scelta sostitutiva.                     |
| `groupId`             | No           | `string`                                        | ID gruppo facoltativo per raggruppare scelte correlate.                                                      |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                               |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                          |
| `optionKey`           | No           | `string`                                        | Chiave opzione interna per semplici flussi auth a flag singolo.                                              |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                              |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'help della CLI.                                                                       |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | Su quali superfici di onboarding questa scelta deve apparire. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento `uiHints`

`uiHints` è una mappa dai nomi dei campi di configurazione a piccoli suggerimenti di rendering.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chiave API",
      "help": "Usata per le richieste OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Ogni suggerimento di campo può includere:

| Campo         | Tipo       | Significato                                 |
| ------------- | ---------- | ------------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente.    |
| `help`        | `string`   | Breve testo di aiuto.                       |
| `tags`        | `string[]` | Tag UI facoltativi.                         |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.        |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input dei moduli.  |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di appartenenza alle capacità che OpenClaw può
leggere senza importare il runtime del plugin.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Ogni elenco è facoltativo:

| Campo                            | Tipo       | Significato                                                     |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | ID dei provider speech posseduti da questo plugin.              |
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione realtime posseduti da questo plugin. |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider di voce realtime posseduti da questo plugin.    |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider media-understanding posseduti da questo plugin. |
| `imageGenerationProviders`       | `string[]` | ID dei provider image-generation posseduti da questo plugin.    |
| `videoGenerationProviders`       | `string[]` | ID dei provider video-generation posseduti da questo plugin.    |
| `webFetchProviders`              | `string[]` | ID dei provider web-fetch posseduti da questo plugin.           |
| `webSearchProviders`             | `string[]` | ID dei provider web search posseduti da questo plugin.          |
| `tools`                          | `string[]` | Nomi degli strumenti dell'agente posseduti da questo plugin per i controlli di contratto dei bundle. |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin canale ha bisogno di metadati di configurazione leggeri prima
del caricamento del runtime.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL Homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Connessione homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Ogni voce di canale può includere:

| Campo         | Tipo                     | Significato                                                                                     |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Obbligatorio per ogni voce di configurazione del canale dichiarata. |
| `uiHints`     | `Record<string, object>` | Etichette UI/placeholder/suggerimenti di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita alle superfici di selezione e ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                         |
| `preferOver`  | `string[]`               | ID plugin legacy o a priorità inferiore che questo canale deve superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw deve dedurre il tuo plugin provider da
ID di modello abbreviati come `gpt-5.4` o `claude-sonnet-4.6` prima che il runtime del plugin
venga caricato.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica questa precedenza:

- i riferimenti espliciti `provider/model` usano i metadati `providers` del manifest proprietario
- `modelPatterns` hanno la precedenza su `modelPrefixes`
- se sia un plugin non incluso sia un plugin incluso corrispondono, vince il plugin non incluso
- l'ambiguità residua viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                  |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` sugli ID di modello abbreviati.        |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate sugli ID di modello abbreviati dopo la rimozione del suffisso del profilo. |

Le chiavi di capacità legacy di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come appartenenza
alle capacità.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Rilevamento, validazione della configurazione, metadati delle scelte auth e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating dell'installazione, setup o metadati di catalogo |

Se non sei sicuro di dove debba stare un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di entry o comportamento di installazione npm, mettilo in `package.json`

### Campi di package.json che influenzano il rilevamento

Alcuni metadati dei plugin pre-runtime vivono intenzionalmente in `package.json` sotto il
blocco `openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint dei plugin nativi.                                                                                                |
| `openclaw.setupEntry`                                             | Entry point leggero solo setup usato durante onboarding e avvio differito del canale.                                                   |
| `openclaw.channel`                                                | Metadati leggeri di catalogo del canale come etichette, percorsi documentazione, alias e testo di selezione.                           |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo dello stato configurato che possono rispondere a “esiste già una configurazione solo env?” senza caricare il runtime completo del canale. |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo auth persistita che possono rispondere a “c'è già qualcosa con accesso effettuato?” senza caricare il runtime completo del canale. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per plugin inclusi e pubblicati esternamente.                                               |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                               |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22`.                                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero della reinstallazione di plugin inclusi quando la configurazione non è valida.               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici di canale solo setup di caricarsi prima del plugin canale completo durante l'avvio.                             |

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il
caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori
validi ma più recenti saltano il plugin su host più vecchi.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non rende
installabili configurazioni arbitrarie non funzionanti. Oggi consente solo ai flussi di installazione
di recuperare da specifici errori obsoleti di aggiornamento di plugin inclusi, come un
percorso del plugin incluso mancante o una voce `channels.<id>` obsoleta per quello stesso
plugin incluso. Errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è un metadato di package per un piccolo modulo
checker:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Usalo quando i flussi di setup, doctor o stato configurato hanno bisogno di una
probe auth sì/no leggera prima del caricamento del plugin canale completo. L'export di destinazione deve essere una piccola
funzione che legge solo lo stato persistito; non instradarla attraverso il barrel runtime completo
del canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli leggeri
dello stato configurato solo env:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Usalo quando un canale può rispondere allo stato configurato da env o altri piccoli
input non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero
runtime del canale, mantieni invece quella logica nell'hook del plugin `config.hasConfiguredState`.

## Requisiti dello schema JSON

- **Ogni plugin deve includere un JSON Schema**, anche se non accetta alcuna configurazione.
- Uno schema vuoto è accettabile (per esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati in fase di lettura/scrittura della configurazione, non a runtime.

## Comportamento della validazione

- Le chiavi sconosciute `channels.*` sono **errori**, a meno che l'ID del canale non sia dichiarato da
  un manifest di plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a ID plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un plugin è installato ma ha un manifest o uno schema danneggiato o mancante,
  la validazione fallisce e Doctor segnala l'errore del plugin.
- Se la configurazione del plugin esiste ma il plugin è **disabilitato**, la configurazione viene mantenuta e
  in Doctor + log viene mostrato un **avviso**.

Vedi [Riferimento della configurazione](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i plugin OpenClaw nativi**, inclusi i caricamenti locali dal filesystem.
- Il runtime continua comunque a caricare separatamente il modulo del plugin; il manifest serve solo per
  rilevamento + validazione.
- I manifest nativi sono analizzati con JSON5, quindi commenti, virgole finali e
  chiavi non tra virgolette sono accettati purché il valore finale resti un oggetto.
- Il loader del manifest legge solo i campi documentati del manifest. Evita di aggiungere
  qui chiavi di primo livello personalizzate.
- `providerAuthEnvVars` è il percorso di metadati leggero per probe auth, validazione dei marker env
  e superfici simili di autenticazione provider che non devono avviare il runtime del plugin
  solo per ispezionare i nomi env.
- `channelEnvVars` è il percorso di metadati leggero per fallback shell-env, prompt di setup
  e superfici simili di canale che non devono avviare il runtime del plugin
  solo per ispezionare i nomi env.
- `providerAuthChoices` è il percorso di metadati leggero per selettori di scelta auth,
  risoluzione `--auth-choice`, mappatura del provider preferito e semplice registrazione
  dei flag CLI di onboarding prima del caricamento del runtime del provider. Per i metadati
  del wizard runtime che richiedono il codice del provider, vedi
  [Hook runtime del provider](/it/plugins/architecture#provider-runtime-hooks).
- I tipi di plugin esclusivi vengono selezionati tramite `plugins.slots.*`.
  - `kind: "memory"` viene selezionato da `plugins.slots.memory`.
  - `kind: "context-engine"` viene selezionato da `plugins.slots.contextEngine`
    (predefinito: `legacy` integrato).
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un
  plugin non ne ha bisogno.
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build e qualsiasi
  requisito di allowlist del gestore pacchetti (per esempio, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins) — come iniziare con i plugin
- [Architettura dei plugin](/it/plugins/architecture) — architettura interna
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento del Plugin SDK
