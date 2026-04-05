---
read_when:
    - Stai creando un plugin OpenClaw
    - Hai bisogno di distribuire uno schema di configurazione del plugin o di eseguire il debug degli errori di validazione del plugin
summary: Manifest del plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifest del plugin
x-i18n:
    generated_at: "2026-04-05T14:00:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 702447ad39f295cfffd4214c3e389bee667d2f9850754f2e02e325dde8e4ac00
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest del plugin (`openclaw.plugin.json`)

Questa pagina riguarda solo il **manifest nativo del plugin OpenClaw**.

Per i layout di bundle compatibili, vedi [Bundle di plugin](/plugins/bundles).

I formati di bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito dei componenti Claude
  senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout di bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le root Skills dichiarate,
le root dei comandi Claude, i valori predefiniti `settings.json` del bundle Claude,
i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde
alle aspettative del runtime di OpenClaw.

Ogni plugin nativo OpenClaw **deve** distribuire un file `openclaw.plugin.json` nella
**root del plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire il codice del plugin**. I manifest mancanti o non validi vengono trattati come
errori del plugin e bloccano la validazione della configurazione.

Vedi la guida completa al sistema dei plugin: [Plugin](/tools/plugin).
Per il modello di capacità nativo e le attuali indicazioni sulla compatibilità esterna:
[Modello di capacità](/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il
codice del tuo plugin.

Usalo per:

- identità del plugin
- validazione della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il
  runtime del plugin
- metadati di alias e auto-enable che devono essere risolti prima del caricamento del runtime del plugin
- metadati shorthand della famiglia di modelli che devono attivare automaticamente il
  plugin prima del caricamento del runtime
- snapshot statici della proprietà delle capacità usati per il wiring di compatibilità dei bundle e
  la copertura dei contratti
- metadati di configurazione specifici del canale che devono essere uniti nelle superfici di catalogo e validazione senza caricare il runtime
- suggerimenti UI per la configurazione

Non usarlo per:

- registrare il comportamento runtime
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

| Campo                               | Obbligatorio | Tipo                             | Significato                                                                                                                                                                                |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Sì           | `string`                         | ID canonico del plugin. Questo è l'id usato in `plugins.entries.<id>`.                                                                                                                    |
| `configSchema`                      | Sì           | `object`                         | JSON Schema inline per la configurazione di questo plugin.                                                                                                                                 |
| `enabledByDefault`                  | No           | `true`                           | Contrassegna un plugin incluso come abilitato per impostazione predefinita. Omettilo, o imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita. |
| `legacyPluginIds`                   | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID plugin canonico.                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | No           | `string[]`                       | ID provider che dovrebbero abilitare automaticamente questo plugin quando autenticazione, configurazione o riferimenti al modello li menzionano.                                          |
| `kind`                              | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo di plugin esclusivo usato da `plugins.slots.*`.                                                                                                                           |
| `channels`                          | No           | `string[]`                       | ID dei canali gestiti da questo plugin. Usati per discovery e validazione della configurazione.                                                                                           |
| `providers`                         | No           | `string[]`                       | ID dei provider gestiti da questo plugin.                                                                                                                                                  |
| `modelSupport`                      | No           | `object`                         | Metadati shorthand della famiglia di modelli gestiti dal manifest usati per caricare automaticamente il plugin prima del runtime.                                                         |
| `cliBackends`                       | No           | `string[]`                       | ID backend CLI inference gestiti da questo plugin. Usati per l'auto-attivazione all'avvio da riferimenti espliciti nella configurazione.                                                 |
| `providerAuthEnvVars`               | No           | `Record<string, string[]>`       | Metadati env dell'autenticazione del provider a basso costo che OpenClaw può ispezionare senza caricare il codice del plugin.                                                             |
| `providerAuthChoices`               | No           | `object[]`                       | Metadati di scelta auth a basso costo per selettori onboarding, risoluzione del provider preferito e semplice wiring dei flag CLI.                                                        |
| `contracts`                         | No           | `object`                         | Snapshot statico delle capacità incluse per speech, trascrizione realtime, voce realtime, comprensione media, generazione immagini, generazione video, web-fetch, ricerca web e proprietà degli strumenti. |
| `channelConfigs`                    | No           | `Record<string, object>`         | Metadati di configurazione del canale gestiti dal manifest uniti nelle superfici di discovery e validazione prima del caricamento del runtime.                                            |
| `skills`                            | No           | `string[]`                       | Directory Skills da caricare, relative alla root del plugin.                                                                                                                               |
| `name`                              | No           | `string`                         | Nome del plugin leggibile.                                                                                                                                                                 |
| `description`                       | No           | `string`                         | Breve riepilogo mostrato nelle superfici del plugin.                                                                                                                                       |
| `version`                           | No           | `string`                         | Versione informativa del plugin.                                                                                                                                                           |
| `uiHints`                           | No           | `Record<string, object>`         | Etichette UI, placeholder e suggerimenti di sensibilità per i campi di configurazione.                                                                                                     |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima del caricamento del runtime del provider.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                                       |
| --------------------- | ------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID provider a cui appartiene questa scelta.                                                                       |
| `method`              | Sì           | `string`                                        | ID del metodo di autenticazione a cui eseguire il dispatch.                                                       |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta auth usato dai flussi onboarding e CLI.                                                   |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omesso, OpenClaw usa `choiceId` come fallback.                                  |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il selettore.                                                                            |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.                     |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente pur consentendo comunque la selezione manuale via CLI.          |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy della scelta che dovrebbero reindirizzare gli utenti a questa scelta sostitutiva.                      |
| `groupId`             | No           | `string`                                        | ID di gruppo facoltativo per raggruppare scelte correlate.                                                        |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                                    |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                               |
| `optionKey`           | No           | `string`                                        | Chiave opzione interna per semplici flussi auth a flag singolo.                                                   |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                                   |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                               |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'help CLI.                                                                                  |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici onboarding dovrebbe apparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`. |

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

| Campo         | Tipo       | Significato                              |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente. |
| `help`        | `string`   | Breve testo di aiuto.                    |
| `tags`        | `string[]` | Tag UI facoltativi.                      |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.     |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input del modulo. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di proprietà delle capacità che OpenClaw può
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

| Campo                            | Tipo       | Significato                                              |
| -------------------------------- | ---------- | -------------------------------------------------------- |
| `speechProviders`                | `string[]` | ID dei provider speech gestiti da questo plugin.         |
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione realtime gestiti da questo plugin. |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider voce realtime gestiti da questo plugin.  |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider di comprensione media gestiti da questo plugin. |
| `imageGenerationProviders`       | `string[]` | ID dei provider di generazione immagini gestiti da questo plugin. |
| `videoGenerationProviders`       | `string[]` | ID dei provider di generazione video gestiti da questo plugin. |
| `webFetchProviders`              | `string[]` | ID dei provider web-fetch gestiti da questo plugin.      |
| `webSearchProviders`             | `string[]` | ID dei provider ricerca web gestiti da questo plugin.    |
| `tools`                          | `string[]` | Nomi degli strumenti agente gestiti da questo plugin per i controlli di contratto dei bundle. |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin di canale ha bisogno di metadati di configurazione a basso costo prima del caricamento del runtime.

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
      "description": "Connessione all'homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Ogni voce di canale può includere:

| Campo         | Tipo                     | Significato                                                                                  |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Obbligatorio per ogni voce dichiarata di configurazione del canale. |
| `uiHints`     | `Record<string, object>` | Etichette UI/placeholder/suggerimenti di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita nelle superfici del selettore e di ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                       |
| `preferOver`  | `string[]`               | ID plugin legacy o a priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw dovrebbe dedurre il tuo plugin provider da
ID modello shorthand come `gpt-5.4` o `claude-sonnet-4.6` prima del caricamento del runtime del plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica questa precedenza:

- i riferimenti espliciti `provider/model` usano i metadati `providers` gestiti dal manifest
- `modelPatterns` ha precedenza su `modelPrefixes`
- se un plugin non incluso e un plugin incluso corrispondono entrambi, vince il plugin non incluso
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                     |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello shorthand.       |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello shorthand dopo la rimozione del suffisso del profilo. |

Le chiavi capability legacy di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come
proprietà delle capacità.

## Manifest versus package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validazione della configurazione, metadati di scelta auth e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e il blocco `openclaw` usato per entrypoint, gating dell'installazione, setup o metadati di catalogo |

Se non sei sicuro di dove appartenga un certo metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda packaging, file di ingresso o comportamento dell'installazione npm, inseriscilo in `package.json`

### Campi `package.json` che influiscono sulla discovery

Alcuni metadati del plugin pre-runtime vivono intenzionalmente in `package.json` sotto il blocco
`openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara entrypoint nativi del plugin.                                                |
| `openclaw.setupEntry`                                             | Entry point leggero solo per setup usato durante onboarding e avvio differito dei canali. |
| `openclaw.channel`                                                | Metadati a basso costo del catalogo dei canali come etichette, percorsi documentazione, alias e testo di selezione. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per plugin inclusi e pubblicati esternamente. |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più origini di installazione. |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando un floor semver come `>=2026.3.22`. |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero tramite reinstallazione del plugin incluso quando la configurazione non è valida. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici del canale solo-setup di caricarsi prima del plugin di canale completo durante l'avvio. |

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il
caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori più recenti ma validi saltano il
plugin sugli host più vecchi.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie non funzionanti. Oggi consente solo ai flussi di installazione di recuperare da specifici errori di aggiornamento di plugin inclusi ormai obsoleti, come un percorso plugin incluso mancante o una voce `channels.<id>` obsoleta per quel medesimo
plugin incluso. Errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori
a `openclaw doctor --fix`.

## Requisiti JSON Schema

- **Ogni plugin deve distribuire un JSON Schema**, anche se non accetta configurazione.
- Uno schema vuoto è accettabile (per esempio `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati al momento della lettura/scrittura della configurazione, non a runtime.

## Comportamento della validazione

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'id del canale non sia dichiarato da
  un manifest del plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a ID plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un plugin è installato ma ha un manifest o uno schema danneggiato o mancante,
  la validazione fallisce e Doctor segnala l'errore del plugin.
- Se esiste una configurazione del plugin ma il plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + nei log.

Vedi [Riferimento della configurazione](/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i plugin nativi OpenClaw**, inclusi i caricamenti dal filesystem locale.
- Il runtime carica comunque separatamente il modulo del plugin; il manifest serve solo per
  discovery + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi sono accettati commenti, virgole finali e
  chiavi senza virgolette purché il valore finale resti comunque un oggetto.
- Il loader del manifest legge solo i campi del manifest documentati. Evita di aggiungere
  qui chiavi di primo livello personalizzate.
- `providerAuthEnvVars` è il percorso di metadati a basso costo per probe di autenticazione, validazione dei marker env
  e superfici simili di autenticazione del provider che non dovrebbero avviare il runtime del plugin solo per ispezionare i nomi env.
- `providerAuthChoices` è il percorso di metadati a basso costo per selettori di scelta auth,
  risoluzione di `--auth-choice`, mappatura del provider preferito e semplice registrazione dei flag CLI di onboarding prima del caricamento del runtime del provider. Per i metadati del runtime wizard
  che richiedono codice del provider, vedi
  [Hook runtime del provider](/plugins/architecture#provider-runtime-hooks).
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

- [Creare plugin](/plugins/building-plugins) — come iniziare con i plugin
- [Architettura dei plugin](/plugins/architecture) — architettura interna
- [Panoramica SDK](/plugins/sdk-overview) — riferimento del Plugin SDK
