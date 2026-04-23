---
read_when:
    - Stai creando un plugin OpenClaw
    - Devi distribuire uno schema di configurazione del plugin o eseguire il debug degli errori di validazione del plugin
summary: Manifest del plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifest del plugin
x-i18n:
    generated_at: "2026-04-23T08:31:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest del plugin (`openclaw.plugin.json`)

Questa pagina riguarda solo il **manifest nativo del plugin OpenClaw**.

Per i layout bundle compatibili, vedi [Plugin bundles](/it/plugins/bundles).

I formati bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito del componente Claude
  senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le
radici delle Skills dichiarate, le radici dei comandi Claude, i valori predefiniti `settings.json` del bundle Claude,
i valori predefiniti LSP del bundle Claude e gli hook pack supportati quando il layout corrisponde alle aspettative del runtime di OpenClaw.

Ogni plugin nativo OpenClaw **deve** distribuire un file `openclaw.plugin.json` nella
**radice del plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire il codice del plugin**. Manifest mancanti o non validi vengono trattati come
errori del plugin e bloccano la validazione della configurazione.

Vedi la guida completa al sistema dei plugin: [Plugins](/it/tools/plugin).
Per il modello di capability nativo e le attuali indicazioni di compatibilità esterna:
[Capability model](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il
codice del tuo plugin.

Usalo per:

- identità del plugin
- validazione della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il runtime del plugin
- hint di attivazione economici che le superfici di control plane possono ispezionare prima del caricamento del runtime
- descrittori di setup economici che le superfici di setup/onboarding possono ispezionare prima del caricamento del runtime
- metadati di alias e auto-enable che devono essere risolti prima del caricamento del runtime del plugin
- metadati shorthand di ownership della famiglia di modelli che devono auto-attivare il
  plugin prima del caricamento del runtime
- snapshot statici di ownership delle capability usati per il wiring compat bundled e
  la copertura dei contratti
- metadati economici del QA runner che l’host condiviso `openclaw qa` può ispezionare
  prima del caricamento del runtime del plugin
- metadati di configurazione specifici del canale che devono confluire nelle superfici di catalogo e validazione
  senza caricare il runtime
- hint UI della configurazione

Non usarlo per:

- registrare comportamento a runtime
- dichiarare entrypoint del codice
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
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
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

| Campo                                | Obbligatorio | Tipo                             | Significato                                                                                                                                                                                                                      |
| ------------------------------------ | ------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì           | `string`                         | ID canonico del plugin. È l’ID usato in `plugins.entries.<id>`.                                                                                                                                                                  |
| `configSchema`                       | Sì           | `object`                         | Schema JSON inline per la configurazione di questo plugin.                                                                                                                                                                        |
| `enabledByDefault`                   | No           | `true`                           | Contrassegna un plugin bundled come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita.                    |
| `legacyPluginIds`                    | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del plugin.                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                       | ID provider che dovrebbero abilitare automaticamente questo plugin quando autenticazione, configurazione o ref dei modelli li menzionano.                                                                                        |
| `kind`                               | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo di plugin esclusivo usato da `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | No           | `string[]`                       | ID canale gestiti da questo plugin. Usati per discovery e validazione della configurazione.                                                                                                                                      |
| `providers`                          | No           | `string[]`                       | ID provider gestiti da questo plugin.                                                                                                                                                                                             |
| `modelSupport`                       | No           | `object`                         | Metadati shorthand di famiglia di modelli gestiti dal manifest usati per caricare automaticamente il plugin prima del runtime.                                                                                                  |
| `providerEndpoints`                  | No           | `object[]`                       | Metadati di host/baseUrl degli endpoint gestiti dal manifest per route provider che il core deve classificare prima che il runtime del provider venga caricato.                                                                 |
| `cliBackends`                        | No           | `string[]`                       | ID backend CLI inference gestiti da questo plugin. Usati per l’auto-attivazione all’avvio da ref di configurazione espliciti.                                                                                                   |
| `syntheticAuthRefs`                  | No           | `string[]`                       | Ref provider o backend CLI il cui hook di autenticazione sintetica gestito dal plugin dovrebbe essere verificato durante la cold model discovery prima del caricamento del runtime.                                             |
| `nonSecretAuthMarkers`               | No           | `string[]`                       | Valori segnaposto di chiave API gestiti dal plugin bundled che rappresentano stato di credenziali locali, OAuth o ambienti non secret.                                                                                          |
| `commandAliases`                     | No           | `object[]`                       | Nomi comando gestiti da questo plugin che dovrebbero produrre diagnostica CLI e di configurazione consapevole del plugin prima del caricamento del runtime.                                                                     |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`       | Metadati economici delle env di autenticazione provider che OpenClaw può ispezionare senza caricare il codice del plugin.                                                                                                       |
| `providerAuthAliases`                | No           | `Record<string, string>`         | ID provider che dovrebbero riutilizzare un altro ID provider per il lookup di autenticazione, ad esempio un provider di coding che condivide la chiave API del provider di base e i profili di autenticazione.                  |
| `channelEnvVars`                     | No           | `Record<string, string[]>`       | Metadati economici delle env di canale che OpenClaw può ispezionare senza caricare il codice del plugin. Usalo per superfici di setup o autenticazione del canale guidate da env che gli helper generici di avvio/config dovrebbero vedere. |
| `providerAuthChoices`                | No           | `object[]`                       | Metadati economici delle scelte di autenticazione per selettori di onboarding, risoluzione del provider preferito e semplice wiring dei flag CLI.                                                                               |
| `activation`                         | No           | `object`                         | Hint economici di attivazione per caricamento attivato da provider, comando, canale, route e capability. Solo metadati; il runtime del plugin continua a gestire il comportamento effettivo.                                   |
| `setup`                              | No           | `object`                         | Descrittori economici di setup/onboarding che le superfici di discovery e setup possono ispezionare senza caricare il runtime del plugin.                                                                                       |
| `qaRunners`                          | No           | `object[]`                       | Descrittori economici del QA runner usati dall’host condiviso `openclaw qa` prima del caricamento del runtime del plugin.                                                                                                       |
| `contracts`                          | No           | `object`                         | Snapshot statico delle capability bundled per hook di autenticazione esterni, speech, trascrizione realtime, voce realtime, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search e ownership degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No           | `Record<string, object>`         | Valori predefiniti economici di media-understanding per ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                       |
| `channelConfigs`                     | No           | `Record<string, object>`         | Metadati di configurazione canale gestiti dal manifest uniti alle superfici di discovery e validazione prima del caricamento del runtime.                                                                                       |
| `skills`                             | No           | `string[]`                       | Directory Skills da caricare, relative alla radice del plugin.                                                                                                                                                                   |
| `name`                               | No           | `string`                         | Nome leggibile del plugin.                                                                                                                                                                                                        |
| `description`                        | No           | `string`                         | Breve riepilogo mostrato nelle superfici dei plugin.                                                                                                                                                                              |
| `version`                            | No           | `string`                         | Versione informativa del plugin.                                                                                                                                                                                                  |
| `uiHints`                            | No           | `Record<string, object>`         | Etichette UI, segnaposto e hint di sensibilità per i campi di configurazione.                                                                                                                                                    |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima che il runtime del provider venga caricato.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                             |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID provider a cui appartiene questa scelta.                                                             |
| `method`              | Sì           | `string`                                        | ID del metodo di autenticazione a cui effettuare il dispatch.                                           |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi CLI e di onboarding.                        |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all’utente. Se omessa, OpenClaw usa come fallback `choiceId`.                      |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il selettore.                                                                  |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall’assistente.           |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell’assistente pur consentendo comunque la selezione CLI manuale.    |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy della scelta che dovrebbero reindirizzare l’utente a questa scelta sostitutiva.              |
| `groupId`             | No           | `string`                                        | ID di gruppo facoltativo per raggruppare scelte correlate.                                              |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all’utente per quel gruppo.                                                          |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                     |
| `optionKey`           | No           | `string`                                        | Chiave opzione interna per flussi di autenticazione semplici con un solo flag.                         |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, ad esempio `--openrouter-api-key`.                                                   |
| `cliOption`           | No           | `string`                                        | Forma completa dell’opzione CLI, ad esempio `--openrouter-api-key <key>`.                               |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell’help CLI.                                                                        |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici di onboarding dovrebbe apparire questa scelta. Se omesso, usa come predefinito `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un plugin gestisce un nome di comando a runtime che gli utenti possono
mettere erroneamente in `plugins.allow` o tentare di eseguire come comando CLI root. OpenClaw
usa questi metadati per la diagnostica senza importare il codice runtime del plugin.

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
| `kind`       | No           | `"runtime-slash"` | Contrassegna l’alias come comando slash di chat anziché comando CLI root.  |
| `cliCommand` | No           | `string`          | Comando CLI root correlato da suggerire per operazioni CLI, se esiste.     |

## Riferimento `activation`

Usa `activation` quando il plugin può dichiarare in modo economico quali eventi del control plane
dovrebbero attivarlo in seguito.

## Riferimento `qaRunners`

Usa `qaRunners` quando un plugin contribuisce con uno o più transport runner sotto
la root condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il runtime del plugin
continua a gestire la registrazione CLI effettiva tramite una superficie leggera
`runtime-api.ts` che esporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Esegui la lane QA live Matrix basata su Docker contro un homeserver usa e getta"
    }
  ]
}
```

| Campo         | Obbligatorio | Tipo     | Significato                                                           |
| ------------- | ------------ | -------- | --------------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, ad esempio `matrix`.        |
| `description` | No           | `string` | Testo di help di fallback usato quando l’host condiviso ha bisogno di un comando stub. |

Questo blocco contiene solo metadati. Non registra comportamento a runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.
I consumer attuali lo usano come hint di restringimento prima di un caricamento più ampio del plugin, quindi l’assenza di metadati di attivazione di solito ha solo un costo di prestazioni; non dovrebbe
cambiare la correttezza finché esistono ancora fallback legacy di ownership del manifest.

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

| Campo            | Obbligatorio | Tipo                                                 | Significato                                                          |
| ---------------- | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `onProviders`    | No           | `string[]`                                           | ID provider che dovrebbero attivare questo plugin quando richiesti.  |
| `onCommands`     | No           | `string[]`                                           | ID comando che dovrebbero attivare questo plugin.                    |
| `onChannels`     | No           | `string[]`                                           | ID canale che dovrebbero attivare questo plugin.                     |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che dovrebbero attivare questo plugin.                 |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Hint ampi di capability usati dalla pianificazione di attivazione del control plane. |

Consumer live attuali:

- la pianificazione CLI attivata da comandi usa come fallback
  `commandAliases[].cliCommand` oppure `commandAliases[].name`
- la pianificazione di setup/canale attivata da canale usa come fallback la ownership legacy `channels[]`
  quando mancano metadati espliciti di attivazione del canale
- la pianificazione di setup/runtime attivata da provider usa come fallback la ownership legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti
  di attivazione del provider

## Riferimento `setup`

Usa `setup` quando le superfici di setup e onboarding hanno bisogno di metadati economici gestiti dal plugin
prima che il runtime venga caricato.

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

`cliBackends` di primo livello resta valido e continua a descrivere i backend CLI inference.
`setup.cliBackends` è la superficie descrittiva specifica del setup per i
flussi di setup/control plane che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di lookup preferita
basata prima sui descrittori per la discovery del setup. Se il descrittore restringe solo il plugin candidato e il setup ha comunque bisogno di hook runtime più ricchi in fase di setup,
imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione di fallback.

Poiché il lookup del setup può eseguire codice `setup-api` gestito dal plugin, i valori normalizzati
`setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra i plugin rilevati.
L’ownership ambigua fallisce in modalità fail-closed invece di scegliere un vincitore in base all’ordine di discovery.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Significato                                                                          |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Sì           | `string`   | ID provider esposto durante setup o onboarding. Mantieni gli ID normalizzati globalmente univoci. |
| `authMethods` | No           | `string[]` | ID dei metodi di setup/autenticazione che questo provider supporta senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Env vars che le superfici generiche di setup/stato possono controllare prima che venga caricato il runtime del plugin. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Significato                                                                                         |
| ------------------ | ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.                               |
| `cliBackends`      | No           | `string[]` | ID backend in fase di setup usati per lookup basato prima sui descrittori. Mantieni gli ID normalizzati globalmente univoci. |
| `configMigrations` | No           | `string[]` | ID di migrazione della configurazione gestiti dalla superficie di setup di questo plugin.           |
| `requiresRuntime`  | No           | `boolean`  | Se il setup richiede ancora l’esecuzione di `setup-api` dopo il lookup del descrittore.            |

## Riferimento `uiHints`

`uiHints` è una mappa dai nomi dei campi di configurazione a piccoli hint di rendering.

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

Ogni hint di campo può includere:

| Campo         | Tipo       | Significato                              |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all’utente. |
| `help`        | `string`   | Breve testo di aiuto.                    |
| `tags`        | `string[]` | Tag UI facoltativi.                      |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.     |
| `sensitive`   | `boolean`  | Contrassegna il campo come secret o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input del form. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di ownership delle capability che OpenClaw può
leggere senza importare il runtime del plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
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

| Campo                            | Tipo       | Significato                                                           |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID runtime embedded per cui un plugin bundled può registrare factory. |
| `externalAuthProviders`          | `string[]` | ID provider di cui questo plugin gestisce l’hook del profilo di autenticazione esterna. |
| `speechProviders`                | `string[]` | ID provider speech gestiti da questo plugin.                          |
| `realtimeTranscriptionProviders` | `string[]` | ID provider di trascrizione realtime gestiti da questo plugin.        |
| `realtimeVoiceProviders`         | `string[]` | ID provider di voce realtime gestiti da questo plugin.                |
| `mediaUnderstandingProviders`    | `string[]` | ID provider di Media Understanding gestiti da questo plugin.          |
| `imageGenerationProviders`       | `string[]` | ID provider di generazione immagini gestiti da questo plugin.         |
| `videoGenerationProviders`       | `string[]` | ID provider di generazione video gestiti da questo plugin.            |
| `webFetchProviders`              | `string[]` | ID provider di web-fetch gestiti da questo plugin.                    |
| `webSearchProviders`             | `string[]` | ID provider di web search gestiti da questo plugin.                   |
| `tools`                          | `string[]` | Nomi degli strumenti agent gestiti da questo plugin per i controlli di contratto bundled. |

I plugin provider che implementano `resolveExternalAuthProfiles` dovrebbero dichiarare
`contracts.externalAuthProviders`. I plugin senza questa dichiarazione continuano a funzionare
tramite un fallback di compatibilità deprecato, ma quel fallback è più lento e
verrà rimosso dopo la finestra di migrazione.

## Riferimento `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` quando un provider di Media Understanding ha
modelli predefiniti, priorità di fallback auto-auth o supporto nativo ai documenti di cui gli helper generici del core hanno bisogno prima che il runtime venga caricato. Le chiavi devono anche essere dichiarate in
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Ogni voce provider può includere:

| Campo                  | Tipo                                | Significato                                                                |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capability media esposte da questo provider.                               |
| `defaultModels`        | `Record<string, string>`            | Valori predefiniti capability→modello usati quando la configurazione non specifica un modello. |
| `autoPriority`         | `Record<string, number>`            | I numeri più bassi vengono ordinati prima per il fallback automatico del provider basato su credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input documento nativi supportati dal provider.                            |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin canale ha bisogno di metadati di configurazione economici prima che il
runtime venga caricato.

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

Ogni voce canale può includere:

| Campo         | Tipo                     | Significato                                                                                 |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce di configurazione canale dichiarata. |
| `uiHints`     | `Record<string, object>` | Etichette UI/segnaposto/hint di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita alle superfici di selezione e ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                      |
| `preferOver`  | `string[]`               | ID plugin legacy o a priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw dovrebbe dedurre il tuo plugin provider da
ID modello shorthand come `gpt-5.4` o `claude-sonnet-4.6` prima che il runtime del plugin venga caricato.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica questa precedenza:

- i ref espliciti `provider/model` usano i metadati `providers` del manifest proprietario
- `modelPatterns` ha la precedenza su `modelPrefixes`
- se corrispondono sia un plugin non bundled sia uno bundled, vince il plugin
  non bundled
- l’ambiguità residua viene ignorata finché l’utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                       |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello shorthand.         |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello shorthand dopo la rimozione del suffisso del profilo. |

Le chiavi capability legacy di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come
ownership delle capability.

## Manifest versus package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validazione della configurazione, metadati delle scelte di autenticazione e hint UI che devono esistere prima che il codice del plugin venga eseguito |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating di installazione, setup o metadati di catalogo |

Se non sei sicuro di dove appartenga un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di entry o comportamento di installazione npm, mettilo in `package.json`

### Campi `package.json` che influenzano la discovery

Alcuni metadati di plugin pre-runtime vivono intenzionalmente in `package.json` sotto il
blocco `openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint del plugin nativo. Devono restare all’interno della directory del pacchetto del plugin.                                                                      |
| `openclaw.runtimeExtensions`                                      | Dichiara gli entrypoint runtime JavaScript buildati per i pacchetti installati. Devono restare all’interno della directory del pacchetto del plugin.                                 |
| `openclaw.setupEntry`                                             | Entrypoint leggero solo setup usato durante onboarding, avvio differito del canale e discovery in sola lettura di stato canale/SecretRef. Deve restare all’interno della directory del pacchetto del plugin. |
| `openclaw.runtimeSetupEntry`                                      | Dichiara l’entrypoint di setup JavaScript buildato per i pacchetti installati. Deve restare all’interno della directory del pacchetto del plugin.                                    |
| `openclaw.channel`                                                | Metadati economici del catalogo canali come etichette, percorsi documentazione, alias e testo di selezione.                                                                          |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo di stato configurato che possono rispondere a "esiste già una configurazione solo env?" senza caricare il runtime completo del canale.                |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo di autenticazione persistita che possono rispondere a "è già presente qualcosa con accesso eseguito?" senza caricare il runtime completo del canale. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hint di installazione/aggiornamento per plugin bundled e pubblicati esternamente.                                                                                                     |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                                                                            |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell’host OpenClaw, usando un floor semver come `>=2026.3.22`.                                                                                            |
| `openclaw.install.expectedIntegrity`                              | Stringa di integrità attesa della dist npm come `sha512-...`; i flussi di installazione e aggiornamento verificano l’artefatto recuperato rispetto a essa.                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero reinstallazione del plugin bundled quando la configurazione non è valida.                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici canale solo setup di caricarsi prima del plugin canale completo durante l’avvio.                                                                             |

I metadati del manifest decidono quali scelte di provider/canale/setup compaiono
nell’onboarding prima che il runtime venga caricato. `package.json#openclaw.install` dice
all’onboarding come recuperare o abilitare quel plugin quando l’utente sceglie una di queste
opzioni. Non spostare gli hint di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l’installazione e il
caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori più recenti ma validi fanno saltare il
plugin sugli host più vecchi.

Il pinning esatto della versione npm vive già in `npmSpec`, per esempio
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Abbinalo a
`expectedIntegrity` quando vuoi che i flussi di aggiornamento falliscano in fail-closed se l’artefatto
npm recuperato non corrisponde più alla release fissata. L’onboarding interattivo
offre npm spec del registry attendibili, inclusi nomi di pacchetto bare e dist-tag.
Quando `expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo applicano; quando viene
omesso, la risoluzione del registry viene registrata senza un pin di integrità.

I plugin canale dovrebbero fornire `openclaw.setupEntry` quando stato, elenco canali
o scansioni SecretRef devono identificare account configurati senza caricare il runtime completo.
La voce di setup dovrebbe esporre metadati del canale più adapter di configurazione,
stato e secret sicuri per il setup; mantieni client di rete, listener del Gateway e
runtime di trasporto nell’entrypoint principale dell’estensione.

I campi dell’entrypoint runtime non sostituiscono i controlli dei confini del pacchetto per i
campi dell’entrypoint sorgente. Ad esempio, `openclaw.runtimeExtensions` non può rendere caricabile un percorso `openclaw.extensions` che esce dai limiti consentiti.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie rotte. Oggi consente solo ai flussi di installazione di recuperare da specifici errori obsoleti di upgrade di plugin bundled, come un
percorso plugin bundled mancante o una voce `channels.<id>` obsoleta per quello stesso
plugin bundled. Errori di configurazione non correlati continuano a bloccare l’installazione e indirizzano gli operator a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è metadato del pacchetto per un piccolo modulo checker:

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

Usalo quando i flussi di setup, doctor o stato configurato hanno bisogno di una sonda economica sì/no sull’autenticazione
prima che il plugin canale completo venga caricato. L’export di destinazione dovrebbe essere una piccola
funzione che legge solo lo stato persistito; non instradarla tramite il barrel runtime completo del
canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici di stato configurato solo env:

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
runtime del canale, mantieni quella logica nell’hook `config.hasConfiguredState` del plugin.

## Precedenza di discovery (ID plugin duplicati)

OpenClaw rileva i plugin da più radici (bundled, installazione globale, workspace, percorsi espliciti selezionati nella configurazione). Se due rilevamenti condividono lo stesso `id`, viene mantenuto solo il manifest con **precedenza più alta**; i duplicati a precedenza inferiore vengono scartati invece di essere caricati accanto ad esso.

Precedenza, dalla più alta alla più bassa:

1. **Config-selected** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Bundled** — plugin distribuiti con OpenClaw
3. **Global install** — plugin installati nella radice globale dei plugin OpenClaw
4. **Workspace** — plugin rilevati relativamente al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un plugin bundled presente nel workspace non sovrascriverà la build bundled.
- Per sovrascrivere davvero un plugin bundled con uno locale, fissalo tramite `plugins.entries.<id>` così vinca per precedenza invece di affidarti alla discovery del workspace.
- Gli scarti dei duplicati vengono registrati così Doctor e la diagnostica di avvio possono indicare la copia scartata.

## Requisiti dello schema JSON

- **Ogni plugin deve distribuire uno schema JSON**, anche se non accetta configurazione.
- È accettabile uno schema vuoto (ad esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati al momento della lettura/scrittura della configurazione, non a runtime.

## Comportamento della validazione

- Le chiavi sconosciute `channels.*` sono **errori**, a meno che l’ID canale non sia dichiarato da
  un manifest del plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a ID plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un plugin è installato ma ha un manifest o uno schema rotto o mancante,
  la validazione fallisce e Doctor segnala l’errore del plugin.
- Se esiste una configurazione del plugin ma il plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + nei log.

Vedi [Configuration reference](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i plugin nativi OpenClaw**, inclusi i caricamenti locali dal filesystem.
- Il runtime continua comunque a caricare separatamente il modulo del plugin; il manifest serve solo per
  discovery + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e
  chiavi senza virgolette sono accettati finché il valore finale resta un oggetto.
- Il loader del manifest legge solo i campi documentati del manifest. Evita di aggiungere
  qui chiavi personalizzate di primo livello.
- `providerAuthEnvVars` è il percorso di metadati economico per sonde di autenticazione, validazione
  degli env marker e superfici simili di autenticazione provider che non dovrebbero avviare il runtime del plugin solo per ispezionare nomi env.
- `providerAuthAliases` consente alle varianti provider di riusare l’autenticazione di un altro provider:
  env vars, profili di autenticazione, autenticazione basata su configurazione e scelta di onboarding con chiave API
  senza hardcodare questa relazione nel core.
- `providerEndpoints` consente ai plugin provider di gestire semplici metadati di matching
  host/baseUrl degli endpoint. Usalo solo per classi di endpoint che il core già supporta;
  il plugin continua comunque a gestire il comportamento a runtime.
- `syntheticAuthRefs` è il percorso di metadati economico per hook di autenticazione sintetica
  gestiti dal provider che devono essere visibili alla cold model discovery prima che esista il registro runtime.
  Elenca solo i ref il cui provider runtime o backend CLI implementi davvero
  `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` è il percorso di metadati economico per valori segnaposto di chiave API
  gestiti dal plugin bundled, come marker di credenziali locali, OAuth o ambienti.
  Il core li tratta come non-secret per la visualizzazione dell’autenticazione e gli audit dei secret senza
  hardcodare il provider proprietario.
- `channelEnvVars` è il percorso di metadati economico per fallback shell-env, prompt di setup
  e superfici simili del canale che non dovrebbero avviare il runtime del plugin
  solo per ispezionare nomi env. I nomi env sono metadati, non attivazione di per sé:
  stato, audit, validazione della consegna Cron e altre superfici in sola lettura continuano ad applicare la trust policy del plugin e la policy di attivazione effettiva prima di
  trattare una env var come canale configurato.
- `providerAuthChoices` è il percorso di metadati economico per selettori di scelta autenticazione,
  risoluzione `--auth-choice`, mapping del provider preferito e semplice registrazione dei flag CLI di onboarding prima che il runtime del provider venga caricato. Per metadati del wizard runtime
  che richiedono codice provider, vedi
  [Provider runtime hooks](/it/plugins/architecture#provider-runtime-hooks).
- I tipi esclusivi di plugin vengono selezionati tramite `plugins.slots.*`.
  - `kind: "memory"` viene selezionato da `plugins.slots.memory`.
  - `kind: "context-engine"` viene selezionato da `plugins.slots.contextEngine`
    (predefinito: `legacy` integrato).
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un
  plugin non ne ha bisogno.
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build ed eventuali
  requisiti di allowlist del package manager (ad esempio pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Correlati

- [Building Plugins](/it/plugins/building-plugins) — introduzione ai plugin
- [Plugin Architecture](/it/plugins/architecture) — architettura interna
- [SDK Overview](/it/plugins/sdk-overview) — riferimento Plugin SDK
