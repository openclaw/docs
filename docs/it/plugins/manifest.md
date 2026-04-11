---
read_when:
    - Stai creando un plugin OpenClaw
    - Devi distribuire uno schema di configurazione del plugin o eseguire il debug degli errori di convalida del plugin
summary: Manifest del plugin + requisiti dello schema JSON (convalida rigorosa della configurazione)
title: Manifest del plugin
x-i18n:
    generated_at: "2026-04-11T15:16:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42d454b560a8f6bf714c5d782f34216be1216d83d0a319d08d7349332c91a9e4
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest del plugin (`openclaw.plugin.json`)

Questa pagina riguarda solo il **manifest nativo del plugin OpenClaw**.

Per i layout di bundle compatibili, vedi [Bundle di plugin](/it/plugins/bundles).

I formati di bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` o il layout predefinito del componente Claude senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout di bundle, ma non vengono convalidati rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le root delle skill dichiarate, le root dei comandi Claude, i valori predefiniti di `settings.json` del bundle Claude, i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde alle aspettative di runtime di OpenClaw.

Ogni plugin OpenClaw nativo **deve** includere un file `openclaw.plugin.json` nella **root del plugin**. OpenClaw usa questo manifest per convalidare la configurazione **senza eseguire il codice del plugin**. I manifest mancanti o non validi sono trattati come errori del plugin e bloccano la convalida della configurazione.

Vedi la guida completa al sistema dei plugin: [Plugin](/it/tools/plugin).
Per il modello di capability nativo e le indicazioni correnti sulla compatibilità esterna:
[Modello di capability](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il codice del tuo plugin.

Usalo per:

- identità del plugin
- convalida della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il runtime del plugin
- suggerimenti di attivazione leggeri che le superfici del control plane possono ispezionare prima del caricamento del runtime
- descrittori di configurazione leggeri che le superfici di setup/onboarding possono ispezionare prima del caricamento del runtime
- metadati di alias e attivazione automatica che devono essere risolti prima del caricamento del runtime del plugin
- metadati abbreviati di proprietà della famiglia di modelli che devono attivare automaticamente il plugin prima del caricamento del runtime
- snapshot statiche della proprietà delle capability usate per il cablaggio di compatibilità bundled e la copertura dei contratti
- metadati di configurazione specifici del canale che devono essere uniti nelle superfici di catalogo e convalida senza caricare il runtime
- suggerimenti UI per la configurazione

Non usarlo per:

- registrare il comportamento del runtime
- dichiarare entrypoint del codice
- metadati di installazione npm

Questi appartengono al codice del tuo plugin e a `package.json`.

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
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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
| `id`                                | Sì           | `string`                         | ID canonico del plugin. È l'ID usato in `plugins.entries.<id>`.                                                                                                                                             |
| `configSchema`                      | Sì           | `object`                         | Schema JSON inline per la configurazione di questo plugin.                                                                                                                                                    |
| `enabledByDefault`                  | No           | `true`                           | Contrassegna un plugin bundled come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita. |
| `legacyPluginIds`                   | No           | `string[]`                       | ID legacy che vengono normalizzati in questo ID canonico del plugin.                                                                                                                                         |
| `autoEnableWhenConfiguredProviders` | No           | `string[]`                       | ID provider che dovrebbero abilitare automaticamente questo plugin quando autenticazione, configurazione o riferimenti ai modelli li menzionano.                                                            |
| `kind`                              | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo di plugin esclusivo usato da `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | No           | `string[]`                       | ID dei canali posseduti da questo plugin. Usati per discovery e convalida della configurazione.                                                                                                              |
| `providers`                         | No           | `string[]`                       | ID dei provider posseduti da questo plugin.                                                                                                                                                                   |
| `modelSupport`                      | No           | `object`                         | Metadati abbreviati della famiglia di modelli posseduti dal manifest usati per caricare automaticamente il plugin prima del runtime.                                                                        |
| `cliBackends`                       | No           | `string[]`                       | ID dei backend di inferenza CLI posseduti da questo plugin. Usati per l'attivazione automatica all'avvio da riferimenti espliciti nella configurazione.                                                    |
| `commandAliases`                    | No           | `object[]`                       | Nomi di comando posseduti da questo plugin che dovrebbero produrre diagnostica di configurazione e CLI consapevole del plugin prima del caricamento del runtime.                                            |
| `providerAuthEnvVars`               | No           | `Record<string, string[]>`       | Metadati env leggeri per l'autenticazione del provider che OpenClaw può ispezionare senza caricare il codice del plugin.                                                                                    |
| `providerAuthAliases`               | No           | `Record<string, string>`         | ID provider che dovrebbero riutilizzare un altro ID provider per la ricerca dell'autenticazione, ad esempio un provider di coding che condivide la chiave API e i profili di autenticazione del provider base. |
| `channelEnvVars`                    | No           | `Record<string, string[]>`       | Metadati env leggeri del canale che OpenClaw può ispezionare senza caricare il codice del plugin. Usali per setup del canale guidato da env o superfici di autenticazione che gli helper generici di avvio/config dovrebbero vedere. |
| `providerAuthChoices`               | No           | `object[]`                       | Metadati leggeri delle scelte di autenticazione per selettori di onboarding, risoluzione del provider preferito e semplice collegamento dei flag CLI.                                                       |
| `activation`                        | No           | `object`                         | Suggerimenti di attivazione leggeri per il caricamento attivato da provider, comando, canale, route e capability. Solo metadati; il runtime del plugin continua a possedere il comportamento reale.         |
| `setup`                             | No           | `object`                         | Descrittori leggeri di setup/onboarding che le superfici di discovery e setup possono ispezionare senza caricare il runtime del plugin.                                                                     |
| `contracts`                         | No           | `object`                         | Snapshot statica delle capability bundled per speech, trascrizione realtime, voce realtime, media-understanding, image-generation, music-generation, video-generation, web-fetch, ricerca web e proprietà degli strumenti. |
| `channelConfigs`                    | No           | `Record<string, object>`         | Metadati di configurazione del canale posseduti dal manifest uniti nelle superfici di discovery e convalida prima del caricamento del runtime.                                                              |
| `skills`                            | No           | `string[]`                       | Directory Skills da caricare, relative alla root del plugin.                                                                                                                                                 |
| `name`                              | No           | `string`                         | Nome leggibile del plugin.                                                                                                                                                                                    |
| `description`                       | No           | `string`                         | Breve riepilogo mostrato nelle superfici del plugin.                                                                                                                                                         |
| `version`                           | No           | `string`                         | Versione informativa del plugin.                                                                                                                                                                              |
| `uiHints`                           | No           | `Record<string, object>`         | Etichette UI, segnaposto e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                        |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima che il runtime del provider venga caricato.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                              |
| --------------------- | ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID del provider a cui appartiene questa scelta.                                                          |
| `method`              | Sì           | `string`                                        | ID del metodo di autenticazione a cui inoltrare.                                                         |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                         |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                        |
| `choiceHint`          | No           | `string`                                        | Breve testo di supporto per il selettore.                                                                |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.            |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente, continuando però a consentire la selezione manuale da CLI. |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy delle scelte che dovrebbero reindirizzare gli utenti a questa scelta sostitutiva.             |
| `groupId`             | No           | `string`                                        | ID di gruppo facoltativo per raggruppare scelte correlate.                                               |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                           |
| `groupHint`           | No           | `string`                                        | Breve testo di supporto per il gruppo.                                                                   |
| `optionKey`           | No           | `string`                                        | Chiave interna dell'opzione per semplici flussi di autenticazione con un solo flag.                     |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, ad esempio `--openrouter-api-key`.                                                    |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, ad esempio `--openrouter-api-key <key>`.                               |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nella guida CLI.                                                                       |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici di onboarding dovrebbe comparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un plugin possiede un nome di comando runtime che gli utenti potrebbero inserire per errore in `plugins.allow` o tentare di eseguire come comando CLI root. OpenClaw usa questi metadati per la diagnostica senza importare il codice runtime del plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Campo        | Obbligatorio | Tipo              | Significato                                                                |
| ------------ | ------------ | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo plugin.                           |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat anziché come comando CLI root. |
| `cliCommand` | No           | `string`          | Comando CLI root correlato da suggerire per le operazioni CLI, se esiste. |

## Riferimento `activation`

Usa `activation` quando il plugin può dichiarare in modo leggero quali eventi del control plane dovrebbero attivarlo in seguito.

Questo blocco contiene solo metadati. Non registra il comportamento del runtime e non sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Campo            | Obbligatorio | Tipo                                                 | Significato                                                      |
| ---------------- | ------------ | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | No           | `string[]`                                           | ID provider che dovrebbero attivare questo plugin quando richiesti. |
| `onCommands`     | No           | `string[]`                                           | ID comando che dovrebbero attivare questo plugin.                |
| `onChannels`     | No           | `string[]`                                           | ID canale che dovrebbero attivare questo plugin.                 |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che dovrebbero attivare questo plugin.             |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti generali di capability usati dalla pianificazione di attivazione del control plane. |

## Riferimento `setup`

Usa `setup` quando le superfici di setup e onboarding hanno bisogno di metadati leggeri posseduti dal plugin prima che il runtime venga caricato.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Il `cliBackends` di primo livello rimane valido e continua a descrivere i backend di inferenza CLI. `setup.cliBackends` è la superficie descrittiva specifica del setup per i flussi di control plane/setup che devono rimanere solo metadati.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Significato                                                                     |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------- |
| `id`          | Sì           | `string`   | ID del provider esposto durante il setup o l'onboarding.                        |
| `authMethods` | No           | `string[]` | ID dei metodi di setup/autenticazione supportati da questo provider senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili env che le superfici generiche di setup/stato possono controllare prima che il runtime del plugin venga caricato. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Significato                                                            |
| ------------------ | ------------ | ---------- | ---------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.  |
| `cliBackends`      | No           | `string[]` | ID backend disponibili in fase di setup senza attivazione completa del runtime. |
| `configMigrations` | No           | `string[]` | ID delle migrazioni di configurazione possedute dalla superficie di setup di questo plugin. |
| `requiresRuntime`  | No           | `boolean`  | Indica se il setup necessita ancora dell'esecuzione del runtime del plugin dopo il lookup del descrittore. |

## Riferimento `uiHints`

`uiHints` è una mappa dai nomi dei campi di configurazione a piccoli suggerimenti di rendering.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Ogni suggerimento di campo può includere:

| Campo         | Tipo       | Significato                                |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Etichetta del campo visibile all'utente.   |
| `help`        | `string`   | Breve testo di supporto.                   |
| `tags`        | `string[]` | Tag UI facoltativi.                        |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.       |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input dei moduli. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di proprietà delle capability che OpenClaw può leggere senza importare il runtime del plugin.

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

| Campo                            | Tipo       | Significato                                                   |
| -------------------------------- | ---------- | ------------------------------------------------------------- |
| `speechProviders`                | `string[]` | ID dei provider speech posseduti da questo plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione realtime posseduti da questo plugin. |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider voce realtime posseduti da questo plugin.     |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider media-understanding posseduti da questo plugin. |
| `imageGenerationProviders`       | `string[]` | ID dei provider image-generation posseduti da questo plugin.  |
| `videoGenerationProviders`       | `string[]` | ID dei provider video-generation posseduti da questo plugin.  |
| `webFetchProviders`              | `string[]` | ID dei provider web-fetch posseduti da questo plugin.         |
| `webSearchProviders`             | `string[]` | ID dei provider di ricerca web posseduti da questo plugin.    |
| `tools`                          | `string[]` | Nomi degli strumenti dell'agente posseduti da questo plugin per i controlli dei contratti bundled. |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin di canale ha bisogno di metadati di configurazione leggeri prima che il runtime venga caricato.

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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Ogni voce di canale può includere:

| Campo         | Tipo                     | Significato                                                                                 |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce dichiarata di configurazione del canale. |
| `uiHints`     | `Record<string, object>` | Etichette UI facoltative/segnaposto/suggerimenti di sensibilità per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita nelle superfici di selezione e ispezione quando i metadati di runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                      |
| `preferOver`  | `string[]`               | ID di plugin legacy o a priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw deve dedurre il tuo plugin provider da ID modello abbreviati come `gpt-5.4` o `claude-sonnet-4.6` prima che il runtime del plugin venga caricato.

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
- `modelPatterns` ha precedenza su `modelPrefixes`
- se corrispondono sia un plugin non bundled sia un plugin bundled, vince il plugin non bundled
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                    |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.     |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

Le chiavi legacy di capability di primo livello sono deprecate. Usa `openclaw doctor --fix` per spostare `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale caricamento del manifest non tratta più quei campi di primo livello come proprietà di capability.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, convalida della configurazione, metadati delle scelte di autenticazione e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating di installazione, setup o metadati di catalogo |

Se non sei sicuro di dove debba stare un elemento di metadati, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda packaging, file entry o comportamento di installazione npm, inseriscilo in `package.json`

### Campi `package.json` che influenzano la discovery

Alcuni metadati del plugin pre-runtime vivono intenzionalmente in `package.json` sotto il blocco `openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                                  |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint del plugin nativo.                                                                                                   |
| `openclaw.setupEntry`                                             | Entrypoint leggero solo setup usato durante onboarding e avvio differito del canale.                                                        |
| `openclaw.channel`                                                | Metadati leggeri del catalogo canali come etichette, percorsi docs, alias e testo di selezione.                                            |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo dello stato configurato che possono rispondere a "esiste già una configurazione solo env?" senza caricare il runtime completo del canale. |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo dello stato di autenticazione persistito che possono rispondere a "c'è già qualcosa con accesso effettuato?" senza caricare il runtime completo del canale. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per plugin bundled e pubblicati esternamente.                                                    |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più origini di installazione.                                                    |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22`.                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero della reinstallazione del plugin bundled quando la configurazione non è valida.                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici del canale solo setup di caricarsi prima del plugin canale completo durante l'avvio.                                |

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori validi ma più recenti fanno saltare il plugin sugli host più vecchi.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente limitato. Non rende installabili configurazioni arbitrarie danneggiate. Oggi consente solo ai flussi di installazione di recuperare da specifici errori obsoleti di aggiornamento del plugin bundled, come un percorso mancante del plugin bundled o una voce `channels.<id>` obsoleta per quello stesso plugin bundled. Gli errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è metadato di pacchetto per un piccolo modulo di controllo:

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

Usalo quando i flussi di setup, doctor o stato configurato hanno bisogno di una verifica di autenticazione sì/no economica prima che venga caricato il plugin completo del canale. L'export di destinazione deve essere una piccola funzione che legge solo lo stato persistito; non instradarla attraverso il barrel completo del runtime del canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici dello stato configurato solo env:

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

Usalo quando un canale può determinare lo stato configurato da env o da altri piccoli input non runtime. Se il controllo richiede la risoluzione completa della configurazione o il runtime reale del canale, mantieni invece quella logica nell'hook `config.hasConfiguredState` del plugin.

## Requisiti dello schema JSON

- **Ogni plugin deve includere uno schema JSON**, anche se non accetta alcuna configurazione.
- È accettabile uno schema vuoto, ad esempio `{ "type": "object", "additionalProperties": false }`.
- Gli schemi vengono convalidati in fase di lettura/scrittura della configurazione, non in fase di runtime.

## Comportamento della convalida

- Le chiavi sconosciute `channels.*` sono **errori**, a meno che l'ID del canale non sia dichiarato da un manifest del plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*` devono fare riferimento a ID plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un plugin è installato ma ha un manifest o uno schema danneggiato o mancante, la convalida fallisce e Doctor segnala l'errore del plugin.
- Se la configurazione del plugin esiste ma il plugin è **disabilitato**, la configurazione viene mantenuta e viene mostrato un **avviso** in Doctor + nei log.

Vedi [Riferimento della configurazione](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i plugin OpenClaw nativi**, inclusi i caricamenti locali dal filesystem.
- Il runtime continua a caricare separatamente il modulo del plugin; il manifest serve solo per discovery + convalida.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi senza virgolette sono accettati purché il valore finale resti un oggetto.
- Il loader del manifest legge solo i campi del manifest documentati. Evita di aggiungere qui chiavi di primo livello personalizzate.
- `providerAuthEnvVars` è il percorso di metadati economico per verifiche di autenticazione, convalida dei marker env e superfici simili di autenticazione del provider che non devono avviare il runtime del plugin solo per ispezionare i nomi env.
- `providerAuthAliases` consente alle varianti del provider di riutilizzare le variabili env di autenticazione di un altro provider, i profili di autenticazione, l'autenticazione basata sulla configurazione e la scelta di onboarding della chiave API senza codificare rigidamente quella relazione nel core.
- `channelEnvVars` è il percorso di metadati economico per fallback shell-env, prompt di setup e superfici di canale simili che non devono avviare il runtime del plugin solo per ispezionare i nomi env.
- `providerAuthChoices` è il percorso di metadati economico per selettori di scelta di autenticazione, risoluzione di `--auth-choice`, mapping del provider preferito e semplice registrazione dei flag CLI di onboarding prima che il runtime del provider venga caricato. Per i metadati del wizard runtime che richiedono codice del provider, vedi [Hook runtime del provider](/it/plugins/architecture#provider-runtime-hooks).
- I tipi di plugin esclusivi vengono selezionati tramite `plugins.slots.*`.
  - `kind: "memory"` viene selezionato da `plugins.slots.memory`.
  - `kind: "context-engine"` viene selezionato da `plugins.slots.contextEngine`
    (predefinito: `legacy` integrato).
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un plugin non ne ha bisogno.
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build e gli eventuali requisiti di allowlist del gestore di pacchetti, ad esempio pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`.

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins) — introduzione ai plugin
- [Architettura dei plugin](/it/plugins/architecture) — architettura interna
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento dell'SDK dei plugin
