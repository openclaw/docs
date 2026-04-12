---
read_when:
    - Stai creando un plugin OpenClaw
    - Devi distribuire uno schema di configurazione del plugin o eseguire il debug degli errori di validazione del plugin
summary: Manifest del plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifest del plugin
x-i18n:
    generated_at: "2026-04-12T08:07:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf666b0f41f07641375a248f52e29ba6a68c3ec20404bedb6b52a20a5cd92e91
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

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le radici delle skill dichiarate, le radici dei comandi Claude, i valori predefiniti di `settings.json` del bundle Claude, i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde alle aspettative del runtime di OpenClaw.

Ogni plugin OpenClaw nativo **deve** includere un file `openclaw.plugin.json` nella **radice del plugin**. OpenClaw usa questo manifest per convalidare la configurazione **senza eseguire il codice del plugin**. I manifest mancanti o non validi vengono trattati come errori del plugin e bloccano la convalida della configurazione.

Consulta la guida completa al sistema dei plugin: [Plugin](/it/tools/plugin).
Per il modello nativo delle capacità e le indicazioni attuali sulla compatibilità esterna:
[Modello delle capacità](/it/plugins/architecture#public-capability-model).

## A cosa serve questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il codice del tuo plugin.

Usalo per:

- identità del plugin
- convalida della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il runtime del plugin
- suggerimenti di attivazione leggeri che le superfici del control plane possono ispezionare prima del caricamento del runtime
- descrittori di configurazione leggeri che le superfici di configurazione/onboarding possono ispezionare prima del caricamento del runtime
- metadati di alias e abilitazione automatica che devono risolversi prima del caricamento del runtime del plugin
- metadati abbreviati sulla proprietà della famiglia di modelli che dovrebbero attivare automaticamente il plugin prima del caricamento del runtime
- istantanee statiche della proprietà delle capacità usate per il wiring di compatibilità dei bundle e la copertura dei contratti
- metadati di configurazione specifici del canale che devono essere uniti nelle superfici di catalogo e convalida senza caricare il runtime
- suggerimenti UI per la configurazione

Non usarlo per:

- registrare il comportamento del runtime
- dichiarare gli entrypoint del codice
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
| `id`                                | Sì           | `string`                         | ID canonico del plugin. Questo è l'ID usato in `plugins.entries.<id>`.                                                                                                                                        |
| `configSchema`                      | Sì           | `object`                         | Schema JSON inline per la configurazione di questo plugin.                                                                                                                                                   |
| `enabledByDefault`                  | No           | `true`                           | Contrassegna un plugin bundle come abilitato per impostazione predefinita. Omettilo, o imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita.       |
| `legacyPluginIds`                   | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del plugin.                                                                                                                                          |
| `autoEnableWhenConfiguredProviders` | No           | `string[]`                       | ID provider che dovrebbero abilitare automaticamente questo plugin quando auth, configurazione o riferimenti a modelli li menzionano.                                                                        |
| `kind`                              | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo di plugin esclusivo usato da `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | No           | `string[]`                       | ID dei canali posseduti da questo plugin. Usati per il rilevamento e la convalida della configurazione.                                                                                                      |
| `providers`                         | No           | `string[]`                       | ID provider posseduti da questo plugin.                                                                                                                                                                      |
| `modelSupport`                      | No           | `object`                         | Metadati abbreviati relativi alla famiglia di modelli posseduti dal manifest, usati per caricare automaticamente il plugin prima del runtime.                                                               |
| `cliBackends`                       | No           | `string[]`                       | ID dei backend di inferenza CLI posseduti da questo plugin. Usati per l'attivazione automatica all'avvio da riferimenti espliciti nella configurazione.                                                     |
| `commandAliases`                    | No           | `object[]`                       | Nomi di comandi posseduti da questo plugin che dovrebbero produrre diagnostica di configurazione e CLI consapevole del plugin prima del caricamento del runtime.                                            |
| `providerAuthEnvVars`               | No           | `Record<string, string[]>`       | Metadati env leggeri per l'autenticazione del provider che OpenClaw può ispezionare senza caricare il codice del plugin.                                                                                    |
| `providerAuthAliases`               | No           | `Record<string, string>`         | ID provider che dovrebbero riutilizzare un altro ID provider per la ricerca auth, ad esempio un provider di coding che condivide la chiave API del provider di base e i profili auth.                      |
| `channelEnvVars`                    | No           | `Record<string, string[]>`       | Metadati env leggeri per i canali che OpenClaw può ispezionare senza caricare il codice del plugin. Usalo per superfici di configurazione o auth del canale guidate da env che i helper generici di avvio/configurazione dovrebbero vedere. |
| `providerAuthChoices`               | No           | `object[]`                       | Metadati leggeri delle scelte auth per selettori di onboarding, risoluzione del provider preferito e semplice collegamento dei flag CLI.                                                                    |
| `activation`                        | No           | `object`                         | Suggerimenti di attivazione leggeri per il caricamento attivato da provider, comando, canale, route e capacità. Solo metadati; il runtime del plugin continua a possedere il comportamento effettivo.      |
| `setup`                             | No           | `object`                         | Descrittori leggeri di configurazione/onboarding che le superfici di rilevamento e configurazione possono ispezionare senza caricare il runtime del plugin.                                                  |
| `contracts`                         | No           | `object`                         | Istantanea statica delle capacità bundle per speech, trascrizione in tempo reale, voce in tempo reale, media-understanding, generazione di immagini, generazione musicale, generazione video, web-fetch, ricerca web e proprietà degli strumenti. |
| `channelConfigs`                    | No           | `Record<string, object>`         | Metadati di configurazione del canale posseduti dal manifest, uniti nelle superfici di rilevamento e convalida prima del caricamento del runtime.                                                            |
| `skills`                            | No           | `string[]`                       | Directory delle Skills da caricare, relative alla radice del plugin.                                                                                                                                         |
| `name`                              | No           | `string`                         | Nome leggibile del plugin.                                                                                                                                                                                   |
| `description`                       | No           | `string`                         | Breve riepilogo mostrato nelle superfici del plugin.                                                                                                                                                         |
| `version`                           | No           | `string`                         | Versione informativa del plugin.                                                                                                                                                                             |
| `uiHints`                           | No           | `Record<string, object>`         | Etichette UI, placeholder e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                       |

## Riferimento `providerAuthChoices`

Ogni voce di `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima del caricamento del runtime del provider.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                               |
| --------------------- | ------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID del provider a cui appartiene questa scelta.                                                           |
| `method`              | Sì           | `string`                                        | ID del metodo auth a cui inoltrare.                                                                       |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta auth usato dai flussi di onboarding e CLI.                                        |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                          |
| `choiceHint`          | No           | `string`                                        | Breve testo di supporto per il selettore.                                                                 |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.             |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente, consentendo comunque la selezione manuale tramite CLI. |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy delle scelte che dovrebbero reindirizzare gli utenti a questa scelta sostitutiva.               |
| `groupId`             | No           | `string`                                        | ID di gruppo facoltativo per raggruppare scelte correlate.                                                |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                            |
| `groupHint`           | No           | `string`                                        | Breve testo di supporto per il gruppo.                                                                    |
| `optionKey`           | No           | `string`                                        | Chiave interna dell'opzione per flussi auth semplici a flag singolo.                                      |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, ad esempio `--openrouter-api-key`.                                                     |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, ad esempio `--openrouter-api-key <key>`.                                 |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nella guida CLI.                                                                        |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici di onboarding dovrebbe comparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un plugin possiede un nome di comando runtime che gli utenti potrebbero erroneamente inserire in `plugins.allow` o provare a eseguire come comando CLI di radice. OpenClaw usa questi metadati per la diagnostica senza importare il codice runtime del plugin.

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
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat anziché come comando CLI di radice. |
| `cliCommand` | No           | `string`          | Comando CLI di radice correlato da suggerire per le operazioni CLI, se esiste. |

## Riferimento `activation`

Usa `activation` quando il plugin può dichiarare in modo leggero quali eventi del control plane dovrebbero attivarlo in seguito.

Questo blocco contiene solo metadati. Non registra il comportamento runtime e non sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.

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
| `onProviders`    | No           | `string[]`                                           | ID provider che dovrebbero attivare questo plugin quando richiesto. |
| `onCommands`     | No           | `string[]`                                           | ID comando che dovrebbero attivare questo plugin.                |
| `onChannels`     | No           | `string[]`                                           | ID canale che dovrebbero attivare questo plugin.                 |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che dovrebbero attivare questo plugin.             |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti generali sulle capacità usati dalla pianificazione dell'attivazione del control plane. |

## Riferimento `setup`

Usa `setup` quando le superfici di configurazione e onboarding hanno bisogno di metadati leggeri posseduti dal plugin prima del caricamento del runtime.

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

Il `cliBackends` di primo livello resta valido e continua a descrivere i backend di inferenza CLI. `setup.cliBackends` è la superficie descrittiva specifica del setup per i flussi di setup/control plane che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di ricerca preferita, basata prima sui descrittori, per il rilevamento del setup. Se il descrittore restringe solo il plugin candidato e il setup ha comunque bisogno di hook runtime più ricchi in fase di configurazione, imposta `requiresRuntime: true` e mantieni `setup-api` come percorso di esecuzione di fallback.

Poiché la ricerca del setup può eseguire codice `setup-api` posseduto dal plugin, i valori normalizzati di `setup.providers[].id` e `setup.cliBackends[]` devono rimanere univoci tra i plugin rilevati. Una proprietà ambigua fallisce in modo conservativo invece di scegliere un vincitore in base all'ordine di rilevamento.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Significato                                                                          |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Sì           | `string`   | ID provider esposto durante setup o onboarding. Mantieni gli ID normalizzati univoci a livello globale. |
| `authMethods` | No           | `string[]` | ID dei metodi di setup/auth supportati da questo provider senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili env che le superfici generiche di setup/stato possono controllare prima del caricamento del runtime del plugin. |

### Campi di `setup`

| Campo              | Obbligatorio | Tipo       | Significato                                                                                         |
| ------------------ | ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.                               |
| `cliBackends`      | No           | `string[]` | ID backend in fase di setup usati per la ricerca del setup basata prima sui descrittori. Mantieni gli ID normalizzati univoci a livello globale. |
| `configMigrations` | No           | `string[]` | ID delle migrazioni di configurazione possedute dalla superficie di setup di questo plugin.         |
| `requiresRuntime`  | No           | `boolean`  | Indica se il setup richiede ancora l'esecuzione di `setup-api` dopo la ricerca basata sui descrittori. |

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

| Campo         | Tipo       | Significato                              |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente. |
| `help`        | `string`   | Breve testo di supporto.                 |
| `tags`        | `string[]` | Tag UI facoltativi.                      |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.     |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input del modulo. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici sulla proprietà delle capacità che OpenClaw può leggere senza importare il runtime del plugin.

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
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione in tempo reale posseduti da questo plugin. |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider voce in tempo reale posseduti da questo plugin. |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider media-understanding posseduti da questo plugin. |
| `imageGenerationProviders`       | `string[]` | ID dei provider di generazione immagini posseduti da questo plugin. |
| `videoGenerationProviders`       | `string[]` | ID dei provider di generazione video posseduti da questo plugin. |
| `webFetchProviders`              | `string[]` | ID dei provider web-fetch posseduti da questo plugin.           |
| `webSearchProviders`             | `string[]` | ID dei provider di ricerca web posseduti da questo plugin.      |
| `tools`                          | `string[]` | Nomi degli strumenti dell'agente posseduti da questo plugin per i controlli dei contratti bundle. |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin di canale ha bisogno di metadati di configurazione leggeri prima del caricamento del runtime.

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
          "label": "URL homeserver",
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

| Campo         | Tipo                     | Significato                                                                                 |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce di configurazione canale dichiarata. |
| `uiHints`     | `Record<string, object>` | Etichette UI / placeholder / suggerimenti di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita nelle superfici di selezione e ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                      |
| `preferOver`  | `string[]`               | ID plugin legacy o a priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw deve dedurre il tuo plugin provider da ID modello abbreviati come `gpt-5.4` o `claude-sonnet-4.6` prima del caricamento del runtime del plugin.

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
- `modelPatterns` ha la precedenza su `modelPrefixes`
- se un plugin non bundle e un plugin bundle corrispondono entrambi, vince il plugin non bundle
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                     |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.      |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

Le chiavi legacy di capacità di primo livello sono deprecate. Usa `openclaw doctor --fix` per spostare `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale caricamento del manifest non tratta più quei campi di primo livello come proprietà delle capacità.

## Manifest rispetto a package.json

I due file svolgono ruoli diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Rilevamento, convalida della configurazione, metadati delle scelte auth e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating dell'installazione, setup o metadati di catalogo |

Se non sei sicuro di dove collocare un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda il packaging, i file di entry o il comportamento di installazione npm, inseriscilo in `package.json`

### Campi di `package.json` che influenzano il rilevamento

Alcuni metadati del plugin prima del runtime vivono intenzionalmente in `package.json` sotto il blocco `openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                                  |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint dei plugin nativi.                                                                                                   |
| `openclaw.setupEntry`                                             | Entry point leggero solo per il setup usato durante l'onboarding e l'avvio differito del canale.                                            |
| `openclaw.channel`                                                | Metadati leggeri del catalogo canali come etichette, percorsi della documentazione, alias e testo di selezione.                            |
| `openclaw.channel.configuredState`                                | Metadati leggeri del verificatore dello stato configurato che possono rispondere a "esiste già una configurazione solo env?" senza caricare il runtime completo del canale. |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del verificatore dello stato auth persistito che possono rispondere a "c'è già qualcosa con accesso effettuato?" senza caricare il runtime completo del canale. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per plugin bundle e plugin pubblicati esternamente.                                              |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                                  |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22`.                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso limitato di recupero della reinstallazione del plugin bundle quando la configurazione non è valida.                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici del canale solo-setup di caricarsi prima del plugin canale completo durante l'avvio.                               |

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori validi ma più recenti saltano il plugin sugli host meno recenti.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente limitato. Non rende installabili configurazioni arbitrarie non valide. Oggi consente solo ai flussi di installazione di recuperare da specifici errori di aggiornamento obsoleti del plugin bundle, come un percorso del plugin bundle mancante o una voce `channels.<id>` obsoleta per quello stesso plugin bundle. Gli errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è un metadato di package per un piccolo modulo di controllo:

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

Usalo quando i flussi di setup, doctor o stato configurato hanno bisogno di una sonda auth sì/no economica prima del caricamento del plugin canale completo. L'export di destinazione dovrebbe essere una piccola funzione che legge solo lo stato persistito; non instradarla attraverso il barrel runtime completo del canale.

`openclaw.channel.configuredState` segue la stessa struttura per controlli economici dello stato configurato solo env:

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

Usalo quando un canale può determinare lo stato configurato da env o altri input minimi non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero runtime del canale, mantieni invece quella logica nell'hook `config.hasConfiguredState` del plugin.

## Requisiti dello schema JSON

- **Ogni plugin deve includere uno schema JSON**, anche se non accetta alcuna configurazione.
- È accettabile uno schema vuoto (ad esempio `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono convalidati in fase di lettura/scrittura della configurazione, non a runtime.

## Comportamento della convalida

- Le chiavi sconosciute `channels.*` sono **errori**, a meno che l'ID del canale non sia dichiarato da un manifest di plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*` devono fare riferimento a ID plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un plugin è installato ma ha un manifest o uno schema mancante o non valido, la convalida fallisce e Doctor segnala l'errore del plugin.
- Se la configurazione del plugin esiste ma il plugin è **disabilitato**, la configurazione viene mantenuta e viene mostrato un **avviso** in Doctor + nei log.

Consulta [Riferimento della configurazione](/it/gateway/configuration) per lo schema completo di `plugins.*`.

## Note

- Il manifest è **obbligatorio per i plugin OpenClaw nativi**, inclusi i caricamenti locali dal filesystem.
- Il runtime continua comunque a caricare separatamente il modulo del plugin; il manifest serve solo per rilevamento + convalida.
- I manifest nativi vengono analizzati con JSON5, quindi sono accettati commenti, virgole finali e chiavi senza virgolette, purché il valore finale resti comunque un oggetto.
- Il loader del manifest legge solo i campi del manifest documentati. Evita di aggiungere qui chiavi personalizzate di primo livello.
- `providerAuthEnvVars` è il percorso di metadati leggero per sonde auth, convalida dei marker env e superfici simili di autenticazione del provider che non dovrebbero avviare il runtime del plugin solo per ispezionare i nomi env.
- `providerAuthAliases` consente alle varianti del provider di riutilizzare le variabili env auth di un altro provider, i profili auth, l'auth basata sulla configurazione e la scelta di onboarding della chiave API senza codificare rigidamente questa relazione nel core.
- `channelEnvVars` è il percorso di metadati leggero per fallback shell-env, prompt di setup e superfici di canale simili che non dovrebbero avviare il runtime del plugin solo per ispezionare i nomi env.
- `providerAuthChoices` è il percorso di metadati leggero per selettori di scelta auth, risoluzione `--auth-choice`, mappatura del provider preferito e semplice registrazione dei flag CLI di onboarding prima del caricamento del runtime del provider. Per i metadati del wizard runtime che richiedono codice del provider, vedi [Hook runtime del provider](/it/plugins/architecture#provider-runtime-hooks).
- I tipi di plugin esclusivi vengono selezionati tramite `plugins.slots.*`.
  - `kind: "memory"` viene selezionato da `plugins.slots.memory`.
  - `kind: "context-engine"` viene selezionato da `plugins.slots.contextEngine`
    (predefinito: `legacy` integrato).
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un plugin non ne ha bisogno.
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build e qualsiasi requisito di allowlist del gestore di pacchetti (ad esempio pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins) — introduzione ai plugin
- [Architettura dei plugin](/it/plugins/architecture) — architettura interna
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento del Plugin SDK
