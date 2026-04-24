---
read_when:
    - Stai costruendo un Plugin OpenClaw
    - Devi distribuire uno schema di configurazione del Plugin o eseguire il debug degli errori di validazione del Plugin
summary: Manifest Plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-24T08:52:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

Questa pagina riguarda solo il **manifest nativo del Plugin OpenClaw**.

Per i layout bundle compatibili, consulta [Plugin bundle](/it/plugins/bundles).

I formati bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito del componente Claude
  senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche quei layout bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le
skill root dichiarate, le command root Claude, i valori predefiniti di `settings.json` del bundle Claude,
i valori predefiniti LSP del bundle Claude e gli hook pack supportati quando il layout corrisponde
alle aspettative runtime di OpenClaw.

Ogni Plugin OpenClaw nativo **deve** distribuire un file `openclaw.plugin.json` nella
**root del Plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire codice del Plugin**. I manifest mancanti o non validi vengono trattati come
errori del Plugin e bloccano la validazione della configurazione.

Consulta la guida completa al sistema Plugin: [Plugins](/it/tools/plugin).
Per il modello nativo di capacità e le attuali indicazioni di compatibilità esterna:
[Modello di capacità](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge **prima di caricare il
codice del tuo Plugin**. Tutto ciò che segue deve essere abbastanza economico da ispezionare senza avviare
il runtime del Plugin.

**Usalo per:**

- identità del Plugin, validazione della configurazione e suggerimenti UI della configurazione
- metadati di auth, onboarding e setup (alias, auto-enable, variabili env del provider, scelte auth)
- hint di attivazione per superfici del control plane
- proprietà abbreviata delle famiglie di modelli
- snapshot statici della proprietà delle capacità (`contracts`)
- metadati del runner QA che l'host condiviso `openclaw qa` può ispezionare
- metadati di configurazione specifici del canale uniti nelle superfici di catalogo e validazione

**Non usarlo per:** registrare comportamento runtime, dichiarare entrypoint di codice
o metadati di installazione npm. Questi appartengono al codice del tuo Plugin e a `package.json`.

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
| `id`                                 | Sì           | `string`                         | ID canonico del Plugin. È l'ID usato in `plugins.entries.<id>`.                                                                                                                                                                  |
| `configSchema`                       | Sì           | `object`                         | Schema JSON inline per la configurazione di questo Plugin.                                                                                                                                                                        |
| `enabledByDefault`                   | No           | `true`                           | Contrassegna un Plugin incluso come abilitato per default. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il Plugin disabilitato per default.                                                      |
| `legacyPluginIds`                    | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del Plugin.                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                       | ID provider che dovrebbero abilitare automaticamente questo Plugin quando auth, configurazione o model ref li menzionano.                                                                                                       |
| `kind`                               | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo di Plugin esclusivo usato da `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | No           | `string[]`                       | ID canale gestiti da questo Plugin. Usati per discovery e validazione della configurazione.                                                                                                                                      |
| `providers`                          | No           | `string[]`                       | ID provider gestiti da questo Plugin.                                                                                                                                                                                             |
| `providerDiscoveryEntry`             | No           | `string`                         | Percorso del modulo leggero di provider-discovery, relativo alla root del Plugin, per metadati del catalogo provider con ambito manifest che possono essere caricati senza attivare il runtime completo del Plugin.           |
| `modelSupport`                       | No           | `object`                         | Metadati shorthand della famiglia di modelli gestiti dal manifest, usati per caricare automaticamente il Plugin prima del runtime.                                                                                              |
| `providerEndpoints`                  | No           | `object[]`                       | Metadati manifest-owned di host/baseUrl degli endpoint per i percorsi del provider che il core deve classificare prima che venga caricato il runtime del provider.                                                              |
| `cliBackends`                        | No           | `string[]`                       | ID backend CLI inference gestiti da questo Plugin. Usati per l'autoattivazione all'avvio da riferimenti di configurazione espliciti.                                                                                           |
| `syntheticAuthRefs`                  | No           | `string[]`                       | Riferimenti provider o backend CLI i cui hook auth sintetici, gestiti dal Plugin, dovrebbero essere sondate durante la cold model discovery prima che il runtime venga caricato.                                               |
| `nonSecretAuthMarkers`               | No           | `string[]`                       | Valori placeholder della chiave API gestiti dal Plugin incluso che rappresentano stato credenziale locale, OAuth o ambientale non segreto.                                                                                     |
| `commandAliases`                     | No           | `object[]`                       | Nomi di comandi gestiti da questo Plugin che dovrebbero produrre diagnostica di configurazione e CLI consapevole del Plugin prima che il runtime venga caricato.                                                               |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`       | Metadati env economici di auth del provider che OpenClaw può ispezionare senza caricare il codice del Plugin.                                                                                                                  |
| `providerAuthAliases`                | No           | `Record<string, string>`         | ID provider che dovrebbero riusare un altro ID provider per il lookup auth, per esempio un provider di coding che condivide la chiave API e i profili auth del provider di base.                                               |
| `channelEnvVars`                     | No           | `Record<string, string[]>`       | Metadati env economici del canale che OpenClaw può ispezionare senza caricare il codice del Plugin. Usali per setup del canale basato su env o superfici auth che gli helper generici di startup/config dovrebbero vedere.   |
| `providerAuthChoices`                | No           | `object[]`                       | Metadati economici delle scelte auth per picker di onboarding, risoluzione del provider preferito e semplice collegamento ai flag CLI.                                                                                         |
| `activation`                         | No           | `object`                         | Metadati economici del planner di attivazione per caricamento attivato da provider, comando, canale, route e capacità. Solo metadati; il runtime del Plugin continua a gestire il comportamento reale.                       |
| `setup`                              | No           | `object`                         | Descrittori economici di setup/onboarding che le superfici di discovery e setup possono ispezionare senza caricare il runtime del Plugin.                                                                                     |
| `qaRunners`                          | No           | `object[]`                       | Descrittori economici del runner QA usati dall'host condiviso `openclaw qa` prima che il runtime del Plugin venga caricato.                                                                                                   |
| `contracts`                          | No           | `object`                         | Snapshot statico delle capacità incluse per hook auth esterni, speech, trascrizione realtime, voce realtime, media-understanding, generazione immagini, generazione musica, generazione video, web-fetch, web search e proprietà degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No           | `Record<string, object>`         | Valori predefiniti economici di media-understanding per gli ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                 |
| `channelConfigs`                     | No           | `Record<string, object>`         | Metadati di configurazione del canale gestiti dal manifest e uniti nelle superfici di discovery e validazione prima che il runtime venga caricato.                                                                             |
| `skills`                             | No           | `string[]`                       | Directory Skills da caricare, relative alla root del Plugin.                                                                                                                                                                      |
| `name`                               | No           | `string`                         | Nome leggibile del Plugin.                                                                                                                                                                                                        |
| `description`                        | No           | `string`                         | Breve riepilogo mostrato nelle superfici del Plugin.                                                                                                                                                                              |
| `version`                            | No           | `string`                         | Versione informativa del Plugin.                                                                                                                                                                                                  |
| `uiHints`                            | No           | `Record<string, object>`         | Etichette UI, placeholder e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                                           |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o auth.
OpenClaw la legge prima che il runtime del provider venga caricato.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                             |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID del provider a cui appartiene questa scelta.                                                         |
| `method`              | Sì           | `string`                                        | ID del metodo auth a cui inoltrare.                                                                     |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta auth usato dai flussi di onboarding e CLI.                                      |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                       |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il picker.                                                                     |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei picker interattivi guidati dall'assistente.              |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai picker dell'assistente pur consentendo la selezione manuale da CLI.            |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy delle scelte che dovrebbero reindirizzare gli utenti a questa scelta sostitutiva.            |
| `groupId`             | No           | `string`                                        | ID gruppo facoltativo per raggruppare scelte correlate.                                                |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                         |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                    |
| `optionKey`           | No           | `string`                                        | Chiave opzione interna per semplici flussi auth a un solo flag.                                        |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                        |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                    |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'help della CLI.                                                                 |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | Su quali superfici di onboarding questa scelta dovrebbe comparire. Se omesso, il predefinito è `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un Plugin gestisce un nome comando runtime che gli utenti potrebbero
erroneamente inserire in `plugins.allow` o provare a eseguire come comando CLI root. OpenClaw
usa questi metadati per la diagnostica senza importare il codice runtime del Plugin.

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

| Campo        | Obbligatorio | Tipo              | Significato                                                               |
| ------------ | ------------ | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo Plugin.                          |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash di chat invece che come comando CLI root. |
| `cliCommand` | No           | `string`          | Comando CLI root correlato da suggerire per operazioni CLI, se esiste.    |

## Riferimento `activation`

Usa `activation` quando il Plugin può dichiarare in modo economico quali eventi del control plane
dovrebbero includerlo in un piano di attivazione/caricamento.

Questo blocco è metadato del planner, non un'API di ciclo di vita. Non registra
comportamento runtime, non sostituisce `register(...)` e non promette che il
codice del Plugin sia già stato eseguito. Il planner di attivazione usa questi campi per
restringere i Plugin candidati prima di ricorrere ai metadati di proprietà del manifest
esistenti come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook.

Preferisci il metadato più ristretto che descrive già la proprietà. Usa
`providers`, `channels`, `commandAliases`, descrittori di setup o `contracts`
quando quei campi esprimono la relazione. Usa `activation` per hint aggiuntivi del planner che non possono essere rappresentati da quei campi di proprietà.

Questo blocco è solo metadato. Non registra comportamento runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.
I consumer correnti lo usano come hint di restringimento prima di un caricamento plugin più ampio, quindi la mancanza di metadati di attivazione in genere incide solo sulle prestazioni; non dovrebbe
cambiare la correttezza finché esistono ancora i fallback legacy di proprietà del manifest.

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

| Campo            | Obbligatorio | Tipo                                                 | Significato                                                                                              |
| ---------------- | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `onProviders`    | No           | `string[]`                                           | ID provider che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.               |
| `onCommands`     | No           | `string[]`                                           | ID comando che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                |
| `onChannels`     | No           | `string[]`                                           | ID canale che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                 |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.             |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Hint di capacità ampie usate dal planning di attivazione del control plane. Preferisci campi più ristretti quando possibile. |

Consumer live correnti:

- Il planning CLI attivato da comando ripiega su
  `commandAliases[].cliCommand` o `commandAliases[].name` legacy
- Il planning setup/channel attivato dal canale ripiega sulla proprietà legacy
  `channels[]` quando mancano metadati espliciti di attivazione del canale
- Il planning setup/runtime attivato dal provider ripiega sulla proprietà legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti di attivazione del provider

La diagnostica del planner può distinguere tra hint espliciti di attivazione e fallback
di proprietà del manifest. Per esempio, `activation-command-hint` significa che
c'è stata corrispondenza con `activation.onCommands`, mentre `manifest-command-alias` significa che il
planner ha usato invece la proprietà `commandAliases`. Queste label di motivazione sono per la
diagnostica dell'host e per i test; gli autori dei Plugin dovrebbero continuare a dichiarare il metadato
che descrive meglio la proprietà.

## Riferimento `qaRunners`

Usa `qaRunners` quando un Plugin contribuisce uno o più runner di trasporto sotto
la root condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il
runtime del Plugin continua a gestire la registrazione CLI reale tramite una superficie
leggera `runtime-api.ts` che esporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Esegue la lane QA Matrix live supportata da Docker contro un homeserver usa-e-getta"
    }
  ]
}
```

| Campo         | Obbligatorio | Tipo     | Significato                                                         |
| ------------- | ------------ | -------- | ------------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, per esempio `matrix`.     |
| `description` | No           | `string` | Testo help di fallback usato quando l'host condiviso ha bisogno di un comando stub. |

## Riferimento `setup`

Usa `setup` quando le superfici di setup e onboarding hanno bisogno di metadati economici gestiti dal Plugin
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

`cliBackends` di primo livello resta valido e continua a descrivere backend CLI inference.
`setup.cliBackends` è la superficie descrittiva specifica del setup per
flussi control-plane/setup che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie preferita
descriptor-first per il lookup della setup discovery. Se il descrittore restringe
solo il Plugin candidato e il setup ha ancora bisogno di hook runtime più ricchi a tempo di setup, imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione di fallback.

Poiché il lookup del setup può eseguire codice `setup-api` gestito dal Plugin, i valori normalizzati
di `setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra
i Plugin rilevati. La proprietà ambigua fallisce in modalità closed invece di scegliere un vincitore in base all'ordine di discovery.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Significato                                                                           |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Sì           | `string`   | ID provider esposto durante setup o onboarding. Mantieni univoci globalmente gli ID normalizzati. |
| `authMethods` | No           | `string[]` | ID dei metodi setup/auth che questo provider supporta senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili env che le superfici generiche di setup/stato possono controllare prima del caricamento del runtime del Plugin. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Significato                                                                                          |
| ------------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.                                |
| `cliBackends`      | No           | `string[]` | ID backend a tempo di setup usati per il lookup setup descriptor-first. Mantieni univoci globalmente gli ID normalizzati. |
| `configMigrations` | No           | `string[]` | ID delle migrazioni di configurazione gestite dalla superficie setup di questo Plugin.               |
| `requiresRuntime`  | No           | `boolean`  | Se il setup ha ancora bisogno dell'esecuzione di `setup-api` dopo il lookup del descrittore.        |

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

Ogni hint di campo può includere:

| Campo         | Tipo       | Significato                               |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente.  |
| `help`        | `string`   | Breve testo di aiuto.                     |
| `tags`        | `string[]` | Tag UI facoltativi.                       |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.      |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo placeholder per gli input del form. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di proprietà delle capacità che OpenClaw può
leggere senza importare il runtime del Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| Campo                            | Tipo       | Significato                                                            |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID runtime embedded per cui un Plugin incluso può registrare factory.  |
| `externalAuthProviders`          | `string[]` | ID provider di cui questo Plugin gestisce l'hook del profilo auth esterno. |
| `speechProviders`                | `string[]` | ID provider speech gestiti da questo Plugin.                           |
| `realtimeTranscriptionProviders` | `string[]` | ID provider di trascrizione realtime gestiti da questo Plugin.         |
| `realtimeVoiceProviders`         | `string[]` | ID provider di voce realtime gestiti da questo Plugin.                 |
| `memoryEmbeddingProviders`       | `string[]` | ID provider di embedding della memoria gestiti da questo Plugin.       |
| `mediaUnderstandingProviders`    | `string[]` | ID provider di media-understanding gestiti da questo Plugin.           |
| `imageGenerationProviders`       | `string[]` | ID provider di generazione immagini gestiti da questo Plugin.          |
| `videoGenerationProviders`       | `string[]` | ID provider di generazione video gestiti da questo Plugin.             |
| `webFetchProviders`              | `string[]` | ID provider di web-fetch gestiti da questo Plugin.                     |
| `webSearchProviders`             | `string[]` | ID provider di web-search gestiti da questo Plugin.                    |
| `tools`                          | `string[]` | Nomi degli strumenti agente gestiti da questo Plugin per i controlli di contratto dei bundle. |

I Plugin provider che implementano `resolveExternalAuthProfiles` dovrebbero dichiarare
`contracts.externalAuthProviders`. I Plugin senza questa dichiarazione passano ancora
attraverso un fallback di compatibilità deprecato, ma quel fallback è più lento e
verrà rimosso dopo la finestra di migrazione.

I provider di embedding della memoria inclusi dovrebbero dichiarare
`contracts.memoryEmbeddingProviders` per ogni ID adattatore che espongono, inclusi
adattatori integrati come `local`. I percorsi CLI standalone usano questo contratto del manifest per caricare solo il Plugin proprietario prima che il runtime completo del Gateway abbia registrato i provider.

## Riferimento `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` quando un provider di media-understanding ha
modelli predefiniti, priorità di fallback auth automatico o supporto nativo ai documenti che
gli helper core generici devono conoscere prima che il runtime venga caricato. Le chiavi devono essere dichiarate anche in
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

| Campo                  | Tipo                                | Significato                                                                   |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacità media esposte da questo provider.                                    |
| `defaultModels`        | `Record<string, string>`            | Predefiniti capability-to-model usati quando la configurazione non specifica un modello. |
| `autoPriority`         | `Record<string, number>`            | I numeri più bassi vengono ordinati prima per il fallback automatico del provider basato su credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input documento nativi supportati dal provider.                               |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin di canale ha bisogno di metadati economici di configurazione prima che il
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
          "label": "URL dell'homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Connessione all'homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Ogni voce canale può includere:

| Campo         | Tipo                     | Significato                                                                                |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce dichiarata di configurazione del canale. |
| `uiHints`     | `Record<string, object>` | Etichette UI/placeholder/hint di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita nelle superfici picker e inspect quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici inspect e catalogo.                          |
| `preferOver`  | `string[]`               | ID Plugin legacy o di priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw dovrebbe dedurre il tuo plugin provider da
ID modello shorthand come `gpt-5.5` o `claude-sonnet-4.6` prima che il runtime del plugin
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

- i riferimenti espliciti `provider/model` usano i metadati di manifest `providers` del proprietario
- `modelPatterns` hanno la precedenza su `modelPrefixes`
- se corrispondono sia un plugin non incluso sia uno incluso, vince il
  plugin non incluso
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                  |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` sugli ID modello shorthand.            |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate sugli ID modello shorthand dopo la rimozione del suffisso del profilo. |

Le chiavi di capacità legacy di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come
proprietà di capacità.

## Manifest versus package.json

I due file hanno compiti diversi:

| File                   | Usalo per                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validazione della configurazione, metadati delle scelte auth e suggerimenti UI che devono esistere prima che il codice del Plugin venga eseguito |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating dell'installazione, setup o metadati di catalogo |

Se non sei sicuro di dove appartenga un certo metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del Plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di entry o comportamento di installazione npm, mettilo in `package.json`

### Campi `package.json` che influenzano la discovery

Alcuni metadati del Plugin pre-runtime vivono intenzionalmente in `package.json` sotto il
blocco `openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint nativi del Plugin. Devono restare all'interno della directory del pacchetto Plugin.                                                                          |
| `openclaw.runtimeExtensions`                                      | Dichiara gli entrypoint runtime JavaScript buildati per i pacchetti installati. Devono restare all'interno della directory del pacchetto Plugin.                                    |
| `openclaw.setupEntry`                                             | Entrypoint leggero solo-setup usato durante onboarding, startup differito del canale e discovery dello stato del canale/SecretRef in sola lettura. Deve restare all'interno della directory del pacchetto Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Dichiara l'entrypoint setup JavaScript buildato per i pacchetti installati. Deve restare all'interno della directory del pacchetto Plugin.                                          |
| `openclaw.channel`                                                | Metadati economici del catalogo canale come etichette, percorsi doc, alias e testo di selezione.                                                                                    |
| `openclaw.channel.configuredState`                                | Metadati leggeri del checker dello stato configurato che possono rispondere a "esiste già una configurazione solo-env?" senza caricare il runtime completo del canale.             |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del checker auth persistita che possono rispondere a "qualcosa è già autenticato?" senza caricare il runtime completo del canale.                                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hint di installazione/aggiornamento per Plugin inclusi e pubblicati esternamente.                                                                                                     |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                                                                            |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando un vincolo semver minimo come `>=2026.3.22`.                                                                                  |
| `openclaw.install.expectedIntegrity`                              | Stringa di integrità attesa della distribuzione npm come `sha512-...`; i flussi di installazione e aggiornamento verificano rispetto a essa l'artefatto scaricato.                |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero tramite reinstallazione del Plugin incluso quando la configurazione non è valida.                                                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici del canale solo-setup di caricarsi prima del Plugin canale completo durante l'avvio.                                                                         |

I metadati del manifest decidono quali scelte di provider/canale/setup compaiono
nell'onboarding prima che il runtime venga caricato. `package.json#openclaw.install` indica
all'onboarding come recuperare o abilitare quel Plugin quando l'utente sceglie una di quelle
opzioni. Non spostare gli hint di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del
registro dei manifest. I valori non validi vengono rifiutati; i valori più recenti ma validi saltano il
Plugin sugli host più vecchi.

Il pinning esatto della versione npm vive già in `npmSpec`, per esempio
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci ufficiali del catalogo esterno
dovrebbero abbinare specifiche esatte con `expectedIntegrity` così i flussi di aggiornamento falliscono in modalità closed se l'artefatto npm scaricato non corrisponde più alla release fissata.
L'onboarding interattivo continua a offrire specifiche npm del registry attendibili, inclusi nomi pacchetto semplici e dist-tag, per compatibilità. La diagnostica del catalogo può
distinguere tra sorgenti esatte, flottanti, con integrità fissata e prive di integrità.
Quando `expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo applicano; quando
è omesso, la risoluzione del registry viene registrata senza integrity pin.

I plugin di canale dovrebbero fornire `openclaw.setupEntry` quando stato, elenco canali
o scansioni SecretRef devono identificare gli account configurati senza caricare il runtime completo.
L'entry setup dovrebbe esporre metadati del canale più adattatori di configurazione, stato e segreti sicuri per il setup; mantieni client di rete, listener gateway e runtime di trasporto nell'entrypoint principale dell'estensione.

I campi dell'entrypoint runtime non sovrascrivono i controlli dei confini del pacchetto per i campi dell'entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non può rendere caricabile un percorso `openclaw.extensions` in fuga.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie rotte. Oggi consente solo ai flussi di installazione di recuperare da specifici errori obsoleti negli upgrade dei Plugin inclusi, come un
percorso mancante del Plugin incluso o una voce `channels.<id>` obsoleta per quello stesso
Plugin incluso. Errori di configurazione non correlati continuano a bloccare l'installazione e a inviare gli operatori a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è metadato di pacchetto per un piccolo modulo checker:

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

Usalo quando i flussi di setup, doctor o configured-state hanno bisogno di un probe auth economico sì/no
prima che il plugin canale completo venga caricato. L'export di destinazione dovrebbe essere una piccola
funzione che legge solo lo stato persistito; non instradarla tramite il barrel runtime completo del canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici di stato configurato solo-env:

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

Usalo quando un canale può rispondere allo stato configurato da env o da altri piccoli
input non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero
runtime del canale, mantieni quella logica nell'hook del plugin `config.hasConfiguredState`.

## Precedenza di discovery (ID Plugin duplicati)

OpenClaw rileva i Plugin da varie root (inclusi, installazione globale, workspace, percorsi espliciti selezionati dalla configurazione). Se due discovery condividono lo stesso `id`, viene mantenuto solo il manifest con **precedenza più alta**; i duplicati con precedenza inferiore vengono scartati invece di essere caricati accanto.

Precedenza, dalla più alta alla più bassa:

1. **Selezionato dalla configurazione** — un percorso esplicitamente fissato in `plugins.entries.<id>`
2. **Incluso** — Plugin distribuiti con OpenClaw
3. **Installazione globale** — Plugin installati nella root globale dei Plugin OpenClaw
4. **Workspace** — Plugin rilevati in relazione al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un Plugin incluso presente nel workspace non oscurerà la build inclusa.
- Per sovrascrivere davvero un Plugin incluso con uno locale, fissalo tramite `plugins.entries.<id>` così vincerà per precedenza invece di affidarti alla discovery nel workspace.
- Gli scarti per duplicati vengono registrati nei log così Doctor e la diagnostica di avvio possono indicare la copia scartata.

## Requisiti dello schema JSON

- **Ogni Plugin deve distribuire uno schema JSON**, anche se non accetta configurazione.
- Uno schema vuoto è accettabile (per esempio `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati in fase di lettura/scrittura della configurazione, non a runtime.

## Comportamento della validazione

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'ID canale non sia dichiarato da
  un manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a ID Plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un Plugin è installato ma ha un manifest o uno schema rotto o mancante,
  la validazione fallisce e Doctor segnala l'errore del Plugin.
- Se esiste una configurazione del Plugin ma il Plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + nei log.

Consulta [Riferimento di configurazione](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i Plugin OpenClaw nativi**, inclusi i caricamenti dal filesystem locale. Il runtime continua a caricare separatamente il modulo del Plugin; il manifest serve solo per discovery + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, trailing comma e chiavi non quotate sono accettati purché il valore finale resti un oggetto.
- Il loader del manifest legge solo i campi documentati del manifest. Evita chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono essere tutti omessi quando un Plugin non ne ha bisogno.
- `providerDiscoveryEntry` deve restare leggero e non dovrebbe importare codice runtime ampio; usalo per metadati statici del catalogo provider o descrittori di discovery ristretti, non per esecuzione al momento della richiesta.
- I tipi di Plugin esclusivi vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` tramite `plugins.slots.memory`, `kind: "context-engine"` tramite `plugins.slots.contextEngine` (predefinito `legacy`).
- I metadati delle variabili env (`providerAuthEnvVars`, `channelEnvVars`) sono solo dichiarativi. Stato, audit, validazione della consegna Cron e altre superfici in sola lettura applicano comunque il trust del Plugin e i criteri di attivazione effettivi prima di trattare una variabile env come configurata.
- Per i metadati runtime della wizard che richiedono codice del provider, consulta [Hook runtime del provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il tuo Plugin dipende da moduli nativi, documenta i passaggi di build e gli eventuali requisiti di allowlist del package manager (per esempio pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Correlati

<CardGroup cols={3}>
  <Card title="Costruire Plugin" href="/it/plugins/building-plugins" icon="rocket">
    Primi passi con i Plugin.
  </Card>
  <Card title="Architettura del Plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello di capacità.
  </Card>
  <Card title="Panoramica SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento all'SDK del Plugin e import dei sottopercorsi.
  </Card>
</CardGroup>
