---
read_when:
    - Stai creando un plugin di OpenClaw
    - Devi fornire uno schema di configurazione del plugin o eseguire il debug degli errori di validazione del plugin
summary: Requisiti del manifesto del Plugin + schema JSON (validazione rigorosa della configurazione)
title: Manifest del Plugin
x-i18n:
    generated_at: "2026-04-21T19:20:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304c08035724dfb1ce6349972729b621aafc00880d4d259db78c22b86e9056ba
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest del Plugin (`openclaw.plugin.json`)

Questa pagina riguarda solo il **manifest nativo dei plugin OpenClaw**.

Per i layout di bundle compatibili, vedi [Bundle di plugin](/it/plugins/bundles).

I formati di bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito dei componenti Claude senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout di bundle, ma non vengono validati rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le root delle skill dichiarate, le root dei comandi Claude, i valori predefiniti di `settings.json` del bundle Claude, i valori predefiniti LSP del bundle Claude e i pacchetti di hook supportati quando il layout corrisponde alle aspettative del runtime di OpenClaw.

Ogni plugin nativo OpenClaw **deve** includere un file `openclaw.plugin.json` nella **root del plugin**. OpenClaw usa questo manifest per validare la configurazione **senza eseguire il codice del plugin**. I manifest mancanti o non validi vengono trattati come errori del plugin e bloccano la validazione della configurazione.

Vedi la guida completa al sistema di plugin: [Plugin](/it/tools/plugin).
Per il modello nativo delle capability e l'attuale guida sulla compatibilità esterna:
[Modello delle capability](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il codice del tuo plugin.

Usalo per:

- identità del plugin
- validazione della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il runtime del plugin
- suggerimenti di attivazione leggeri che le superfici del piano di controllo possono ispezionare prima del caricamento del runtime
- descrittori di configurazione leggeri che le superfici di configurazione/onboarding possono ispezionare prima del caricamento del runtime
- metadati di alias e abilitazione automatica che devono essere risolti prima del caricamento del runtime del plugin
- metadati abbreviati sulla proprietà delle famiglie di modelli che devono attivare automaticamente il plugin prima del caricamento del runtime
- snapshot statiche della proprietà delle capability usate per il wiring compatibile dei bundle e la copertura dei contratti
- metadati leggeri per il runner QA che l'host condiviso `openclaw qa` può ispezionare prima del caricamento del runtime del plugin
- metadati di configurazione specifici del canale che devono confluire nelle superfici di catalogo e validazione senza caricare il runtime
- suggerimenti per l'interfaccia utente della configurazione

Non usarlo per:

- registrare il comportamento a runtime
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

## Esempio avanzato

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
| `configSchema`                      | Sì           | `object`                         | JSON Schema inline per la configurazione di questo plugin.                                                                                                                                                   |
| `enabledByDefault`                  | No           | `true`                           | Contrassegna un plugin incluso come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita. |
| `legacyPluginIds`                   | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del plugin.                                                                                                                                         |
| `autoEnableWhenConfiguredProviders` | No           | `string[]`                       | ID provider che devono abilitare automaticamente questo plugin quando auth, config o riferimenti ai modelli li menzionano.                                                                                  |
| `kind`                              | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo esclusivo di plugin usato da `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | No           | `string[]`                       | ID canale di proprietà di questo plugin. Usati per il rilevamento e la validazione della configurazione.                                                                                                     |
| `providers`                         | No           | `string[]`                       | ID provider di proprietà di questo plugin.                                                                                                                                                                   |
| `modelSupport`                      | No           | `object`                         | Metadati abbreviati di proprietà del manifest sulle famiglie di modelli, usati per caricare automaticamente il plugin prima del runtime.                                                                    |
| `providerEndpoints`                 | No           | `object[]`                       | Metadati di proprietà del manifest su host/baseUrl degli endpoint per le route del provider che il core deve classificare prima del caricamento del runtime del provider.                                   |
| `cliBackends`                       | No           | `string[]`                       | ID backend CLI di inferenza di proprietà di questo plugin. Usati per l'attivazione automatica all'avvio a partire da riferimenti espliciti nella configurazione.                                           |
| `syntheticAuthRefs`                 | No           | `string[]`                       | Riferimenti a provider o backend CLI il cui hook di auth sintetica, di proprietà del plugin, deve essere verificato durante il rilevamento a freddo dei modelli prima del caricamento del runtime.         |
| `nonSecretAuthMarkers`              | No           | `string[]`                       | Valori segnaposto della chiave API, di proprietà del plugin incluso, che rappresentano uno stato delle credenziali locale, OAuth o ambientale non segreto.                                                  |
| `commandAliases`                    | No           | `object[]`                       | Nomi di comando di proprietà di questo plugin che devono produrre configurazione consapevole del plugin e diagnostica CLI prima del caricamento del runtime.                                                |
| `providerAuthEnvVars`               | No           | `Record<string, string[]>`       | Metadati leggeri sulle variabili d'ambiente di auth del provider che OpenClaw può ispezionare senza caricare il codice del plugin.                                                                          |
| `providerAuthAliases`               | No           | `Record<string, string>`         | ID provider che devono riutilizzare un altro ID provider per la ricerca dell'auth, per esempio un provider di coding che condivide la chiave API e i profili di auth del provider di base.                 |
| `channelEnvVars`                    | No           | `Record<string, string[]>`       | Metadati leggeri sulle variabili d'ambiente del canale che OpenClaw può ispezionare senza caricare il codice del plugin. Usalo per superfici di configurazione o auth del canale guidate da env che gli helper generici di avvio/configurazione devono vedere. |
| `providerAuthChoices`               | No           | `object[]`                       | Metadati leggeri sulle scelte di auth per selettori di onboarding, risoluzione del provider preferito e semplice wiring dei flag CLI.                                                                       |
| `activation`                        | No           | `object`                         | Suggerimenti leggeri di attivazione per caricamento attivato da provider, comando, canale, route e capability. Solo metadati; il runtime del plugin continua a possedere il comportamento effettivo.       |
| `setup`                             | No           | `object`                         | Descrittori leggeri di configurazione/onboarding che le superfici di rilevamento e configurazione possono ispezionare senza caricare il runtime del plugin.                                                 |
| `qaRunners`                         | No           | `object[]`                       | Descrittori leggeri del runner QA usati dall'host condiviso `openclaw qa` prima del caricamento del runtime del plugin.                                                                                    |
| `contracts`                         | No           | `object`                         | Snapshot statica delle capability incluse per speech, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione musicale, generazione video, recupero web, ricerca web e proprietà degli strumenti. |
| `channelConfigs`                    | No           | `Record<string, object>`         | Metadati di configurazione del canale di proprietà del manifest uniti alle superfici di rilevamento e validazione prima del caricamento del runtime.                                                        |
| `skills`                            | No           | `string[]`                       | Directory delle Skills da caricare, relative alla root del plugin.                                                                                                                                           |
| `name`                              | No           | `string`                         | Nome leggibile del plugin.                                                                                                                                                                                   |
| `description`                       | No           | `string`                         | Breve riepilogo mostrato nelle superfici del plugin.                                                                                                                                                         |
| `version`                           | No           | `string`                         | Versione informativa del plugin.                                                                                                                                                                             |
| `uiHints`                           | No           | `Record<string, object>`         | Etichette UI, segnaposto e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                        |

## Riferimento `providerAuthChoices`

Ogni voce di `providerAuthChoices` descrive una scelta di onboarding o auth.
OpenClaw la legge prima del caricamento del runtime del provider.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                             |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID del provider a cui appartiene questa scelta.                                                         |
| `method`              | Sì           | `string`                                        | ID del metodo di auth a cui instradare.                                                                 |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di auth usato dai flussi di onboarding e CLI.                                  |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                       |
| `choiceHint`          | No           | `string`                                        | Breve testo di supporto per il selettore.                                                               |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.           |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente pur consentendo comunque la selezione manuale via CLI. |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy delle scelte che devono reindirizzare gli utenti a questa scelta sostitutiva.                |
| `groupId`             | No           | `string`                                        | ID facoltativo del gruppo per raggruppare scelte correlate.                                             |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                          |
| `groupHint`           | No           | `string`                                        | Breve testo di supporto per il gruppo.                                                                  |
| `optionKey`           | No           | `string`                                        | Chiave interna dell'opzione per semplici flussi di auth con un solo flag.                               |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, ad esempio `--openrouter-api-key`.                                                   |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, ad esempio `--openrouter-api-key <key>`.                               |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nella guida CLI.                                                                      |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici di onboarding deve comparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un plugin possiede un nome di comando a runtime che gli utenti potrebbero inserire erroneamente in `plugins.allow` o provare a eseguire come comando CLI di root. OpenClaw usa questi metadati per la diagnostica senza importare il codice runtime del plugin.

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
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat anziché comando CLI di root. |
| `cliCommand` | No           | `string`          | Comando CLI di root correlato da suggerire per le operazioni CLI, se esiste. |

## Riferimento `activation`

Usa `activation` quando il plugin può dichiarare in modo leggero quali eventi del piano di controllo devono attivarlo in seguito.

## Riferimento `qaRunners`

Usa `qaRunners` quando un plugin contribuisce con uno o più runner di trasporto sotto la root condivisa `openclaw qa`. Mantieni questi metadati leggeri e statici; il runtime del plugin continua a possedere l'effettiva registrazione CLI tramite una superficie leggera `runtime-api.ts` che esporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Campo         | Obbligatorio | Tipo     | Significato                                                       |
| ------------- | ------------ | -------- | ----------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, ad esempio `matrix`.    |
| `description` | No           | `string` | Testo di aiuto di fallback usato quando l'host condiviso necessita di un comando stub. |

Questo blocco è solo metadato. Non registra il comportamento a runtime e non sostituisce `register(...)`, `setupEntry` o altri entrypoint del runtime/plugin.
I consumer attuali lo usano come suggerimento di restringimento prima di un caricamento più ampio del plugin, quindi la mancanza di metadati di attivazione di solito incide solo sulle prestazioni; non dovrebbe modificare la correttezza finché esistono ancora i fallback legacy sulla proprietà del manifest.

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
| `onProviders`    | No           | `string[]`                                           | ID provider che devono attivare questo plugin quando richiesti.  |
| `onCommands`     | No           | `string[]`                                           | ID comando che devono attivare questo plugin.                    |
| `onChannels`     | No           | `string[]`                                           | ID canale che devono attivare questo plugin.                     |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che devono attivare questo plugin.                 |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti ampi sulle capability usati dalla pianificazione dell'attivazione del piano di controllo. |

Consumer live attuali:

- la pianificazione CLI attivata da comandi usa come fallback `commandAliases[].cliCommand` legacy oppure `commandAliases[].name`
- la pianificazione di configurazione/canale attivata da canali usa come fallback la proprietà legacy `channels[]` quando mancano metadati espliciti di attivazione del canale
- la pianificazione di configurazione/runtime attivata da provider usa come fallback la proprietà legacy `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti di attivazione del provider

## Riferimento `setup`

Usa `setup` quando le superfici di configurazione e onboarding hanno bisogno di metadati leggeri di proprietà del plugin prima del caricamento del runtime.

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

`cliBackends` di primo livello resta valido e continua a descrivere i backend CLI di inferenza. `setup.cliBackends` è la superficie descrittiva specifica per la configurazione per i flussi del piano di controllo/configurazione che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di lookup preferita, descriptor-first, per il rilevamento della configurazione. Se il descrittore restringe solo il plugin candidato e la configurazione richiede comunque hook runtime più ricchi in fase di setup, imposta `requiresRuntime: true` e mantieni `setup-api` come percorso di esecuzione di fallback.

Poiché il lookup della configurazione può eseguire codice `setup-api` di proprietà del plugin, i valori normalizzati di `setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra i plugin rilevati. La proprietà ambigua fallisce in modo conservativo invece di scegliere un vincitore in base all'ordine di rilevamento.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Significato                                                                                 |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------- |
| `id`          | Sì           | `string`   | ID provider esposto durante la configurazione o l'onboarding. Mantieni gli ID normalizzati univoci a livello globale. |
| `authMethods` | No           | `string[]` | ID dei metodi di configurazione/auth supportati da questo provider senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili d'ambiente che le superfici generiche di configurazione/stato possono controllare prima del caricamento del runtime del plugin. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Significato                                                                                         |
| ------------------ | ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di configurazione del provider esposti durante la configurazione e l'onboarding.        |
| `cliBackends`      | No           | `string[]` | ID backend in fase di configurazione usati per il lookup descriptor-first della configurazione. Mantieni gli ID normalizzati univoci a livello globale. |
| `configMigrations` | No           | `string[]` | ID delle migrazioni di configurazione di proprietà della superficie di configurazione di questo plugin. |
| `requiresRuntime`  | No           | `boolean`  | Se la configurazione richiede ancora l'esecuzione di `setup-api` dopo il lookup del descrittore.   |

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

| Campo         | Tipo       | Significato                            |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente. |
| `help`        | `string`   | Breve testo di supporto.               |
| `tags`        | `string[]` | Tag UI facoltativi.                    |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.   |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input del modulo. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici sulla proprietà delle capability che OpenClaw può leggere senza importare il runtime del plugin.

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

| Campo                            | Tipo       | Significato                                                    |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | ID provider speech di proprietà di questo plugin.              |
| `realtimeTranscriptionProviders` | `string[]` | ID provider di trascrizione realtime di proprietà di questo plugin. |
| `realtimeVoiceProviders`         | `string[]` | ID provider di voce realtime di proprietà di questo plugin.    |
| `mediaUnderstandingProviders`    | `string[]` | ID provider di comprensione dei media di proprietà di questo plugin. |
| `imageGenerationProviders`       | `string[]` | ID provider di generazione immagini di proprietà di questo plugin. |
| `videoGenerationProviders`       | `string[]` | ID provider di generazione video di proprietà di questo plugin. |
| `webFetchProviders`              | `string[]` | ID provider di recupero web di proprietà di questo plugin.     |
| `webSearchProviders`             | `string[]` | ID provider di ricerca web di proprietà di questo plugin.      |
| `tools`                          | `string[]` | Nomi degli strumenti dell'agente di proprietà di questo plugin per i controlli dei contratti inclusi. |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin di canale ha bisogno di metadati leggeri di configurazione prima del caricamento del runtime.

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

| Campo         | Tipo                     | Significato                                                                                |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Obbligatorio per ogni voce dichiarata di configurazione del canale. |
| `uiHints`     | `Record<string, object>` | Etichette UI/segnaposto/suggerimenti di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita alle superfici di selezione e ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                    |
| `preferOver`  | `string[]`               | ID plugin legacy o a priorità inferiore che questo canale deve superare nelle superfici di selezione. |

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

- i riferimenti espliciti `provider/model` usano i metadati del manifest `providers` del proprietario
- `modelPatterns` ha precedenza su `modelPrefixes`
- se un plugin non incluso e un plugin incluso corrispondono entrambi, vince il plugin non incluso
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                      |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.       |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

Le chiavi legacy di capability di primo livello sono deprecate. Usa `openclaw doctor --fix` per spostare `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale caricamento del manifest non tratta più quei campi di primo livello come proprietà delle capability.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Rilevamento, validazione della configurazione, metadati delle scelte di auth e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating dell'installazione, configurazione o metadati di catalogo |

Se non sei sicuro di dove debba stare un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda packaging, file di entrypoint o comportamento di installazione npm, inseriscilo in `package.json`

### Campi di package.json che influenzano il rilevamento

Alcuni metadati del plugin pre-runtime vivono intenzionalmente in `package.json` sotto il blocco `openclaw` anziché in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint del plugin nativo.                                                                                                |
| `openclaw.setupEntry`                                             | Entry point leggero solo per la configurazione, usato durante onboarding, avvio differito dei canali e rilevamento in sola lettura di stato del canale/SecretRef. |
| `openclaw.channel`                                                | Metadati leggeri del catalogo dei canali come etichette, percorsi della documentazione, alias e testo di selezione.                    |
| `openclaw.channel.configuredState`                                | Metadati leggeri del verificatore dello stato configurato che possono rispondere a "esiste già una configurazione solo env?" senza caricare il runtime completo del canale. |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del verificatore dello stato di auth persistito che possono rispondere a "qualcuno ha già effettuato l'accesso?" senza caricare il runtime completo del canale. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per plugin inclusi e pubblicati esternamente.                                               |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                               |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22`.                                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso limitato di recupero tramite reinstallazione del plugin incluso quando la configurazione non è valida.             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici del canale solo di configurazione di caricarsi prima del plugin completo del canale durante l'avvio.           |

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori più recenti ma validi saltano il plugin sugli host più vecchi.

I plugin di canale dovrebbero fornire `openclaw.setupEntry` quando stato, elenco dei canali o scansioni SecretRef devono identificare gli account configurati senza caricare il runtime completo. L'entry di setup dovrebbe esporre i metadati del canale più adattatori sicuri per il setup relativi a configurazione, stato e segreti; mantieni client di rete, listener Gateway e runtime di trasporto nell'entrypoint principale dell'estensione.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente limitato. Non rende installabili configurazioni arbitrarie rotte. Oggi consente solo ai flussi di installazione di recuperare da specifici errori obsoleti di aggiornamento del plugin incluso, come un percorso mancante del plugin incluso o una voce `channels.<id>` obsoleta per quello stesso plugin incluso. Errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori a `openclaw doctor --fix`.

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

Usalo quando i flussi di setup, doctor o stato configurato necessitano di una verifica auth sì/no economica prima del caricamento del plugin completo del canale. L'export di destinazione dovrebbe essere una piccola funzione che legge solo lo stato persistito; non instradarla attraverso il barrel del runtime completo del canale.

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

Usalo quando un canale può determinare lo stato configurato da env o da altri input minimi non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero runtime del canale, mantieni invece quella logica nell'hook `config.hasConfiguredState` del plugin.

## Requisiti di JSON Schema

- **Ogni plugin deve includere un JSON Schema**, anche se non accetta alcuna configurazione.
- È accettabile uno schema vuoto, ad esempio `{ "type": "object", "additionalProperties": false }`.
- Gli schemi vengono validati al momento della lettura/scrittura della configurazione, non a runtime.

## Comportamento della validazione

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'ID canale non sia dichiarato da un manifest di plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*` devono fare riferimento a ID plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un plugin è installato ma ha un manifest o uno schema mancante o non valido, la validazione fallisce e Doctor segnala l'errore del plugin.
- Se la configurazione del plugin esiste ma il plugin è **disabilitato**, la configurazione viene mantenuta e viene mostrato un **avviso** in Doctor + nei log.

Vedi [Riferimento della configurazione](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i plugin nativi OpenClaw**, compresi i caricamenti dal filesystem locale.
- Il runtime continua a caricare separatamente il modulo del plugin; il manifest serve solo per rilevamento + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi senza virgolette sono accettati purché il valore finale resti comunque un oggetto.
- Solo i campi del manifest documentati vengono letti dal loader del manifest. Evita di aggiungere qui chiavi personalizzate di primo livello.
- `providerAuthEnvVars` è il percorso di metadati leggero per probe di auth, validazione degli env marker e superfici simili di auth del provider che non dovrebbero avviare il runtime del plugin solo per ispezionare i nomi env.
- `providerAuthAliases` consente alle varianti di provider di riutilizzare le variabili d'ambiente di auth, i profili di auth, l'auth basata su configurazione e la scelta di onboarding della chiave API di un altro provider senza hardcodificare quella relazione nel core.
- `providerEndpoints` consente ai plugin provider di possedere metadati semplici di corrispondenza host/baseUrl degli endpoint. Usalo solo per classi di endpoint già supportate dal core; il plugin continua a possedere il comportamento a runtime.
- `syntheticAuthRefs` è il percorso di metadati leggero per hook di auth sintetica di proprietà del provider che devono essere visibili al rilevamento a freddo dei modelli prima che esista il registro runtime. Elenca solo i riferimenti il cui provider o backend CLI a runtime implementa effettivamente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` è il percorso di metadati leggero per chiavi API segnaposto di proprietà dei plugin inclusi, come marker di credenziali locali, OAuth o ambientali.
  Il core le tratta come non segrete per la visualizzazione dell'auth e gli audit dei segreti senza hardcodificare il provider proprietario.
- `channelEnvVars` è il percorso di metadati leggero per fallback shell-env, prompt di setup e superfici simili dei canali che non dovrebbero avviare il runtime del plugin solo per ispezionare i nomi env.
- `providerAuthChoices` è il percorso di metadati leggero per selettori di scelta auth, risoluzione di `--auth-choice`, mappatura del provider preferito e semplice registrazione dei flag CLI di onboarding prima del caricamento del runtime del provider. Per i metadati del wizard runtime che richiedono codice del provider, vedi [Hook runtime del provider](/it/plugins/architecture#provider-runtime-hooks).
- I tipi esclusivi di plugin vengono selezionati tramite `plugins.slots.*`.
  - `kind: "memory"` viene selezionato da `plugins.slots.memory`.
  - `kind: "context-engine"` viene selezionato da `plugins.slots.contextEngine`
    (predefinito: `legacy` integrato).
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un plugin non ne ha bisogno.
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build e gli eventuali requisiti di allowlist del gestore pacchetti (ad esempio, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins) — introduzione ai plugin
- [Architettura dei plugin](/it/plugins/architecture) — architettura interna
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento dell'SDK dei Plugin
