---
read_when:
    - Stai creando un Plugin OpenClaw
    - Devi distribuire uno schema di configurazione del Plugin o eseguire il debug degli errori di convalida del Plugin
summary: Manifest del Plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifesto del Plugin
x-i18n:
    generated_at: "2026-06-27T17:51:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Questa pagina riguarda solo il **manifest del Plugin OpenClaw nativo**.

Per i layout di bundle compatibili, consulta [Bundle di Plugin](/it/plugins/bundles).

I formati di bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito dei componenti Claude
  senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche quei layout di bundle, ma non vengono convalidati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le radici
delle Skills dichiarate, le radici dei comandi Claude, i valori predefiniti di `settings.json`
del bundle Claude, i valori predefiniti LSP del bundle Claude e i pacchetti di hook supportati quando il layout corrisponde
alle aspettative del runtime di OpenClaw.

Ogni Plugin OpenClaw nativo **deve** includere un file `openclaw.plugin.json` nella
**radice del Plugin**. OpenClaw usa questo manifest per convalidare la configurazione
**senza eseguire codice del Plugin**. I manifest mancanti o non validi sono trattati come
errori del Plugin e bloccano la convalida della configurazione.

Consulta la guida completa al sistema di Plugin: [Plugin](/it/tools/plugin).
Per il modello di capability nativo e le indicazioni attuali sulla compatibilità esterna:
[Modello di capability](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge **prima di caricare il tuo
codice del Plugin**. Tutto ciò che segue deve essere abbastanza leggero da ispezionare senza avviare
il runtime del Plugin.

**Usalo per:**

- identità del Plugin, convalida della configurazione e suggerimenti per l'interfaccia di configurazione
- metadati di autenticazione, onboarding e configurazione iniziale (alias, abilitazione automatica, variabili env del provider, scelte di autenticazione)
- suggerimenti di attivazione per le superfici del control plane
- proprietà abbreviata delle famiglie di modelli
- snapshot statici della proprietà delle capability (`contracts`)
- metadati del runner QA che l'host condiviso `openclaw qa` può ispezionare
- metadati di configurazione specifici del canale uniti nelle superfici di catalogo e convalida

**Non usarlo per:** registrare comportamenti di runtime, dichiarare entrypoint di codice
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

## Esempio ricco

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
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

| Campo                                | Obbligatorio | Tipo                             | Cosa significa                                                                                                                                                                                                                                        |
| ------------------------------------ | ------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì           | `string`                         | ID canonico del Plugin. Questo è l'ID usato in `plugins.entries.<id>`.                                                                                                                                                                                |
| `configSchema`                       | Sì           | `object`                         | JSON Schema inline per la configurazione di questo Plugin.                                                                                                                                                                                            |
| `requiresPlugins`                    | No           | `string[]`                       | ID dei Plugin che devono essere installati affinché questo Plugin abbia effetto. Il discovery mantiene il Plugin caricabile, ma avvisa quando manca un Plugin richiesto.                                                                              |
| `enabledByDefault`                   | No           | `true`                           | Contrassegna un Plugin in bundle come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il Plugin disabilitato per impostazione predefinita.                                          |
| `enabledByDefaultOnPlatforms`        | No           | `string[]`                       | Contrassegna un Plugin in bundle come abilitato per impostazione predefinita solo sulle piattaforme Node.js elencate, per esempio `["darwin"]`. La configurazione esplicita ha comunque la precedenza.                                                |
| `legacyPluginIds`                    | No           | `string[]`                       | ID legacy che vengono normalizzati in questo ID canonico del Plugin.                                                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                       | ID dei provider che devono abilitare automaticamente questo Plugin quando auth, configurazione o riferimenti ai modelli li menzionano.                                                                                                                 |
| `kind`                               | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo esclusivo di Plugin usato da `plugins.slots.*`.                                                                                                                                                                                       |
| `channels`                           | No           | `string[]`                       | ID dei canali di proprietà di questo Plugin. Usato per discovery e validazione della configurazione.                                                                                                                                                   |
| `providers`                          | No           | `string[]`                       | ID dei provider di proprietà di questo Plugin.                                                                                                                                                                                                        |
| `providerCatalogEntry`               | No           | `string`                         | Percorso del modulo leggero del catalogo provider, relativo alla radice del Plugin, per metadati del catalogo provider con ambito manifest che possono essere caricati senza attivare l'intero runtime del Plugin.                                    |
| `modelSupport`                       | No           | `object`                         | Metadati abbreviati della famiglia di modelli di proprietà del manifest, usati per caricare automaticamente il Plugin prima del runtime.                                                                                                               |
| `modelCatalog`                       | No           | `object`                         | Metadati dichiarativi del catalogo modelli per provider di proprietà di questo Plugin. Questo è il contratto del control plane per futuri elenchi in sola lettura, onboarding, selettori di modelli, alias e soppressione senza caricare il runtime del Plugin. |
| `modelPricing`                       | No           | `object`                         | Policy di ricerca dei prezzi esterni di proprietà del provider. Usala per escludere i provider locali/self-hosted dai cataloghi prezzi remoti o mappare i riferimenti provider agli ID catalogo OpenRouter/LiteLLM senza codificare ID provider nel core. |
| `modelIdNormalization`               | No           | `object`                         | Pulizia di alias/prefissi degli ID modello di proprietà del provider che deve essere eseguita prima del caricamento del runtime del provider.                                                                                                          |
| `providerEndpoints`                  | No           | `object[]`                       | Metadati host/baseUrl degli endpoint di proprietà del manifest per route provider che il core deve classificare prima del caricamento del runtime del provider.                                                                                        |
| `providerRequest`                    | No           | `object`                         | Metadati economici di famiglia provider e compatibilità della richiesta usati dalla policy generica delle richieste prima del caricamento del runtime del provider.                                                                                    |
| `secretProviderIntegrations`         | No           | `Record<string, object>`         | Preset dichiarativi dei provider exec SecretRef che le superfici di setup o installazione possono offrire senza codificare nel core integrazioni specifiche del provider.                                                                             |
| `cliBackends`                        | No           | `string[]`                       | ID dei backend di inferenza CLI di proprietà di questo Plugin. Usati per l'auto-attivazione all'avvio da riferimenti di configurazione espliciti.                                                                                                      |
| `syntheticAuthRefs`                  | No           | `string[]`                       | Riferimenti a provider o backend CLI il cui hook di autenticazione sintetica di proprietà del Plugin deve essere sondato durante il discovery a freddo dei modelli prima del caricamento del runtime.                                                  |
| `nonSecretAuthMarkers`               | No           | `string[]`                       | Valori segnaposto di chiavi API di proprietà del Plugin in bundle che rappresentano stato di credenziali locali, OAuth o ambient non segreto.                                                                                                          |
| `commandAliases`                     | No           | `object[]`                       | Nomi di comandi di proprietà di questo Plugin che devono produrre diagnostica di configurazione e CLI consapevole del Plugin prima del caricamento del runtime.                                                                                       |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`       | Metadati env di compatibilità deprecati per la ricerca di autenticazione/stato del provider. Preferisci `setup.providers[].envVars` per i nuovi Plugin; OpenClaw continua a leggerli durante la finestra di deprecazione.                             |
| `providerAuthAliases`                | No           | `Record<string, string>`         | ID provider che devono riusare un altro ID provider per la ricerca auth, per esempio un provider di coding che condivide la chiave API e i profili auth del provider di base.                                                                         |
| `channelEnvVars`                     | No           | `Record<string, string[]>`       | Metadati env leggeri del canale che OpenClaw può ispezionare senza caricare codice del Plugin. Usali per superfici di setup del canale o auth guidate da env che gli helper generici di avvio/configurazione devono vedere.                           |
| `providerAuthChoices`                | No           | `object[]`                       | Metadati leggeri delle scelte auth per selettori di onboarding, risoluzione del provider preferito e semplice collegamento dei flag CLI.                                                                                                              |
| `activation`                         | No           | `object`                         | Metadati leggeri del planner di attivazione per caricamento attivato da avvio, provider, comando, canale, route e capability. Solo metadati; il runtime del Plugin resta proprietario del comportamento effettivo.                                    |
| `setup`                              | No           | `object`                         | Descrittori leggeri di setup/onboarding che discovery e superfici di setup possono ispezionare senza caricare il runtime del Plugin.                                                                                                                  |
| `qaRunners`                          | No           | `object[]`                       | Descrittori leggeri dei runner QA usati dall'host condiviso `openclaw qa` prima del caricamento del runtime del Plugin.                                                                                                                              |
| `contracts`                          | No           | `object`                         | Snapshot statico della proprietà delle capability per hook auth esterni, embedding, speech, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione musicale, generazione video, web-fetch, ricerca web e proprietà degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No           | `Record<string, object>`         | Default leggeri di comprensione dei media per ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                                                       |
| `imageGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati auth leggeri di generazione immagini per ID provider dichiarati in `contracts.imageGenerationProviders`, inclusi alias auth di proprietà del provider e guardie base-url.                                                                    |
| `videoGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati auth leggeri di generazione video per ID provider dichiarati in `contracts.videoGenerationProviders`, inclusi alias auth di proprietà del provider e guardie base-url.                                                                      |
| `musicGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati auth leggeri di generazione musicale per ID provider dichiarati in `contracts.musicGenerationProviders`, inclusi alias auth di proprietà del provider e guardie base-url.                                                                    |
| `toolMetadata`                       | No       | `Record<string, object>`         | Metadati di disponibilità economici per strumenti di proprietà del plugin dichiarati in `contracts.tools`. Usali quando uno strumento non deve caricare il runtime a meno che non esistano prove di configurazione, env o autenticazione.                                                                       |
| `channelConfigs`                     | No       | `Record<string, object>`         | Metadati di configurazione del canale di proprietà del manifest uniti alle superfici di rilevamento e convalida prima del caricamento del runtime.                                                                                                                                      |
| `skills`                             | No       | `string[]`                       | Directory Skills da caricare, relative alla radice del plugin.                                                                                                                                                                                         |
| `name`                               | No       | `string`                         | Nome del plugin leggibile dall'utente.                                                                                                                                                                                                                     |
| `description`                        | No       | `string`                         | Breve riepilogo mostrato nelle superfici del plugin.                                                                                                                                                                                                         |
| `icon`                               | No       | `string`                         | URL immagine HTTPS per le schede marketplace/catalogo. ClawHub accetta qualsiasi URL `https://` valido e usa l'icona predefinita del plugin come fallback quando questo valore è omesso o non valido.                                                                              |
| `version`                            | No       | `string`                         | Versione informativa del plugin.                                                                                                                                                                                                                   |
| `uiHints`                            | No       | `Record<string, object>`         | Etichette UI, segnaposto e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                                                                               |

## Riferimento dei metadati dei provider di generazione

I campi dei metadati dei provider di generazione descrivono segnali di autenticazione statici per i
provider dichiarati nell'elenco `contracts.*GenerationProviders` corrispondente.
OpenClaw legge questi campi prima del caricamento del runtime del provider, così gli strumenti core possono
decidere se un provider di generazione è disponibile senza importare ogni
Plugin del provider.

Usa questi campi solo per fatti economici e dichiarativi. Trasporto, trasformazioni delle richieste,
refresh dei token, validazione delle credenziali e comportamento effettivo di generazione
restano nel runtime del Plugin.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Ogni voce di metadati supporta:

| Campo                  | Obbligatorio | Tipo       | Significato                                                                                                                                       |
| ---------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | No           | `string[]` | ID provider aggiuntivi che devono contare come alias di autenticazione statici per il provider di generazione.                                    |
| `authProviders`        | No           | `string[]` | ID provider i cui profili di autenticazione configurati devono contare come autenticazione per questo provider di generazione.                    |
| `configSignals`        | No           | `object[]` | Segnali di disponibilità economici e basati solo sulla configurazione per provider locali o self-hosted che possono essere configurati senza profili di autenticazione o variabili d'ambiente. |
| `authSignals`          | No           | `object[]` | Segnali di autenticazione espliciti. Quando presenti, sostituiscono l'insieme di segnali predefinito derivato dall'ID provider, da `aliases` e da `authProviders`. |
| `referenceAudioInputs` | No           | `boolean`  | Solo generazione video. Imposta su `true` quando il provider accetta risorse audio di riferimento; altrimenti `video_generate` nasconde i parametri di riferimento audio. |

Ogni voce `configSignals` supporta:

| Campo            | Obbligatorio | Tipo       | Significato                                                                                                                                                                             |
| ---------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sì           | `string`   | Percorso puntato all'oggetto di configurazione di proprietà del Plugin da ispezionare, ad esempio `plugins.entries.example.config`.                                                     |
| `overlayPath`    | No           | `string`   | Percorso puntato all'interno della configurazione root il cui oggetto deve sovrapporsi all'oggetto root prima di valutare il segnale. Usalo per configurazioni specifiche di capability come `image`, `video` o `music`. |
| `overlayMapPath` | No           | `string`   | Percorso puntato all'interno della configurazione root i cui valori oggetto devono ciascuno sovrapporsi all'oggetto root. Usalo per mappe di account nominati come `accounts`, in cui qualsiasi account configurato deve qualificarsi. |
| `required`       | No           | `string[]` | Percorsi puntati all'interno della configurazione effettiva che devono avere valori configurati. Le stringhe non devono essere vuote; oggetti e array non devono essere vuoti.          |
| `requiredAny`    | No           | `string[]` | Percorsi puntati all'interno della configurazione effettiva in cui almeno uno deve avere un valore configurato.                                                                         |
| `mode`           | No           | `object`   | Guardia opzionale della modalità stringa all'interno della configurazione effettiva. Usala quando la disponibilità solo tramite configurazione si applica solo a una modalità.          |

Ogni guardia `mode` supporta:

| Campo        | Obbligatorio | Tipo       | Significato                                                                 |
| ------------ | ------------ | ---------- | --------------------------------------------------------------------------- |
| `path`       | No           | `string`   | Percorso puntato all'interno della configurazione effettiva. Il valore predefinito è `mode`. |
| `default`    | No           | `string`   | Valore della modalità da usare quando la configurazione omette il percorso. |
| `allowed`    | No           | `string[]` | Se presente, il segnale passa solo quando la modalità effettiva è uno di questi valori. |
| `disallowed` | No           | `string[]` | Se presente, il segnale fallisce quando la modalità effettiva è uno di questi valori. |

Ogni voce `authSignals` supporta:

| Campo             | Obbligatorio | Tipo     | Significato                                                                                                                                                                 |
| ----------------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì           | `string` | ID provider da controllare nei profili di autenticazione configurati.                                                                                                       |
| `providerBaseUrl` | No           | `object` | Guardia opzionale che fa contare il segnale solo quando il provider configurato referenziato usa un URL base consentito. Usala quando un alias di autenticazione è valido solo per certe API. |

Ogni guardia `providerBaseUrl` supporta:

| Campo             | Obbligatorio | Tipo       | Significato                                                                                                                                       |
| ----------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì           | `string`   | ID di configurazione del provider il cui `baseUrl` deve essere controllato.                                                                        |
| `defaultBaseUrl`  | No           | `string`   | URL base da assumere quando la configurazione del provider omette `baseUrl`.                                                                       |
| `allowedBaseUrls` | Sì           | `string[]` | URL base consentiti per questo segnale di autenticazione. Il segnale viene ignorato quando l'URL base configurato o predefinito non corrisponde a uno di questi valori normalizzati. |

## Riferimento dei metadati degli strumenti

`toolMetadata` usa le stesse forme `configSignals` e `authSignals` dei
metadati dei provider di generazione, indicizzate per nome dello strumento. `contracts.tools` dichiara
la proprietà. `toolMetadata` dichiara evidenza di disponibilità economica così OpenClaw può
evitare di importare il runtime di un Plugin solo per far restituire `null` alla sua factory dello strumento.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Se uno strumento non ha `toolMetadata`, OpenClaw preserva il comportamento esistente e
carica il Plugin proprietario quando il contratto dello strumento corrisponde alla policy. Per gli
strumenti hot-path la cui factory dipende da autenticazione/configurazione, gli autori di Plugin devono dichiarare
`toolMetadata` invece di far importare al core il runtime per chiedere.

## Riferimento providerAuthChoices

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima del caricamento del runtime del provider.
Gli elenchi di configurazione dei provider usano queste scelte del manifesto, le scelte di configurazione
derivate dal descrittore e i metadati del catalogo di installazione senza caricare il runtime del provider.

| Campo                 | Obbligatorio | Tipo                                                                  | Significato                                                                                                                   |
| --------------------- | ------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                                              | ID del provider a cui appartiene questa scelta.                                                                               |
| `method`              | Sì           | `string`                                                              | ID del metodo di autenticazione a cui inoltrare.                                                                              |
| `choiceId`            | Sì           | `string`                                                              | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                                               |
| `choiceLabel`         | No           | `string`                                                              | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                                              |
| `choiceHint`          | No           | `string`                                                              | Breve testo di supporto per il selettore.                                                                                     |
| `assistantPriority`   | No           | `number`                                                              | Valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.                                    |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                                        | Nasconde la scelta dai selettori dell'assistente pur consentendo ancora la selezione manuale dalla CLI.                       |
| `deprecatedChoiceIds` | No           | `string[]`                                                            | ID di scelte legacy che devono reindirizzare gli utenti a questa scelta sostitutiva.                                          |
| `groupId`             | No           | `string`                                                              | ID di gruppo opzionale per raggruppare scelte correlate.                                                                      |
| `groupLabel`          | No           | `string`                                                              | Etichetta visibile all'utente per quel gruppo.                                                                                |
| `groupHint`           | No           | `string`                                                              | Breve testo di supporto per il gruppo.                                                                                        |
| `optionKey`           | No           | `string`                                                              | Chiave di opzione interna per flussi di autenticazione semplici con un solo flag.                                             |
| `cliFlag`             | No           | `string`                                                              | Nome del flag CLI, ad esempio `--openrouter-api-key`.                                                                         |
| `cliOption`           | No           | `string`                                                              | Forma completa dell'opzione CLI, ad esempio `--openrouter-api-key <key>`.                                                    |
| `cliDescription`      | No           | `string`                                                              | Descrizione usata nell'aiuto della CLI.                                                                                       |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Superfici di onboarding in cui questa scelta deve apparire. Se omesso, il valore predefinito è `["text-inference"]`.         |

## Riferimento di commandAliases

Usa `commandAliases` quando un plugin possiede un nome di comando runtime che gli utenti potrebbero
inserire per errore in `plugins.allow` o provare a eseguire come comando CLI radice. OpenClaw
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

| Campo        | Obbligatorio | Tipo              | Significato                                                               |
| ------------ | ------------ | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo plugin.                          |
| `kind`       | No           | `"runtime-slash"` | Marca l'alias come comando slash di chat invece che come comando CLI radice. |
| `cliCommand` | No           | `string`          | Comando CLI radice correlato da suggerire per le operazioni CLI, se esiste. |

## Riferimento di activation

Usa `activation` quando il plugin può dichiarare a basso costo quali eventi del piano di controllo
devono includerlo in un piano di attivazione/caricamento.

Questo blocco è metadati del pianificatore, non un'API del ciclo di vita. Non registra
comportamento runtime, non sostituisce `register(...)` e non promette che
il codice del plugin sia già stato eseguito. Il pianificatore di attivazione usa questi campi per
restringere i plugin candidati prima di ricadere sui metadati di proprietà del manifest esistenti
come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook.

Preferisci i metadati più ristretti che descrivono già la proprietà. Usa
`providers`, `channels`, `commandAliases`, descrittori di setup o `contracts`
quando quei campi esprimono la relazione. Usa `activation` per suggerimenti aggiuntivi al pianificatore
che non possono essere rappresentati da quei campi di proprietà.
Usa `cliBackends` di primo livello per gli alias runtime CLI come `claude-cli`,
`my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` è solo per
gli ID di harness agente incorporati che non hanno già un campo di proprietà.

Questo blocco è solo metadati. Non registra comportamento runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.
I consumer attuali lo usano come suggerimento di restringimento prima di un caricamento più ampio dei plugin, quindi
la mancanza di metadati di attivazione non di avvio di solito incide solo sulle prestazioni; non
dovrebbe cambiare la correttezza finché esistono ancora fallback di proprietà del manifest.

Ogni plugin deve impostare `activation.onStartup` intenzionalmente. Impostalo su `true`
solo quando il plugin deve essere eseguito durante l'avvio del Gateway. Impostalo su `false` quando
il plugin è inerte all'avvio e deve caricarsi solo da trigger più ristretti.
Omettere `onStartup` non carica più implicitamente il plugin all'avvio; usa metadati di
attivazione espliciti per avvio, canale, configurazione, harness agente, memoria o
altri trigger di attivazione più ristretti.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Campo              | Obbligatorio | Tipo                                                 | Significato                                                                                                                                                                                |
| ------------------ | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | No           | `boolean`                                            | Attivazione esplicita all'avvio del Gateway. Ogni plugin deve impostarla. `true` importa il plugin durante l'avvio; `false` lo mantiene lazy all'avvio salvo che un altro trigger corrispondente richieda il caricamento. |
| `onProviders`      | No           | `string[]`                                           | ID dei provider che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                  |
| `onAgentHarnesses` | No           | `string[]`                                           | ID runtime degli harness agente incorporati che devono includere questo plugin nei piani di attivazione/caricamento. Usa `cliBackends` di primo livello per gli alias backend CLI.          |
| `onCommands`       | No           | `string[]`                                           | ID dei comandi che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                   |
| `onChannels`       | No           | `string[]`                                           | ID dei canali che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                    |
| `onRoutes`         | No           | `string[]`                                           | Tipi di route che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                    |
| `onConfigPaths`    | No           | `string[]`                                           | Percorsi di configurazione relativi alla radice che devono includere questo plugin nei piani di avvio/caricamento quando il percorso è presente e non esplicitamente disabilitato.          |
| `onCapabilities`   | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti di capacità ampi usati dalla pianificazione di attivazione del piano di controllo. Preferisci campi più ristretti quando possibile.                                          |

Consumer attualmente attivi:

- la pianificazione dell'avvio del Gateway usa `activation.onStartup` per l'importazione
  esplicita all'avvio
- la pianificazione CLI attivata da comandi ricade sui campi legacy
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la pianificazione dell'avvio dell'agent-runtime usa `activation.onAgentHarnesses` per
  gli harness incorporati e `cliBackends[]` di primo livello per gli alias runtime CLI
- la pianificazione di setup/canale attivata da canale ricade sulla proprietà legacy `channels[]`
  quando mancano metadati espliciti di attivazione del canale
- la pianificazione dei plugin all'avvio usa `activation.onConfigPaths` per superfici di configurazione
  radice non di canale, come il blocco `browser` del plugin browser in bundle
- la pianificazione di setup/runtime attivata da provider ricade sulla proprietà legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti
  di attivazione del provider

La diagnostica del pianificatore può distinguere i suggerimenti di attivazione espliciti dal fallback
di proprietà del manifest. Per esempio, `activation-command-hint` significa che
`activation.onCommands` ha trovato una corrispondenza, mentre `manifest-command-alias` significa che il
pianificatore ha usato invece la proprietà `commandAliases`. Queste etichette di motivo servono per
la diagnostica e i test dell'host; gli autori dei plugin devono continuare a dichiarare i metadati
che descrivono meglio la proprietà.

## Riferimento di qaRunners

Usa `qaRunners` quando un plugin contribuisce uno o più runner di trasporto sotto
la radice condivisa `openclaw qa`. Mantieni questi metadati leggeri e statici; il runtime
del plugin possiede comunque la registrazione CLI effettiva tramite una superficie leggera
`runtime-api.ts` che esporta `qaRunnerCliRegistrations`.

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

| Campo         | Obbligatorio | Tipo     | Significato                                                        |
| ------------- | ------------ | -------- | ------------------------------------------------------------------ |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, per esempio `matrix`.    |
| `description` | No           | `string` | Testo di aiuto di fallback usato quando l'host condiviso necessita di un comando stub. |

## riferimento setup

Usa `setup` quando le superfici di configurazione e onboarding richiedono metadati economici di proprietà del plugin
prima del caricamento del runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` di primo livello rimane valido e continua a descrivere i backend
di inferenza CLI. `setup.cliBackends` è la superficie di descrittori specifica della configurazione per
i flussi di piano di controllo/configurazione che devono rimanere basati solo su metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di ricerca
preferita basata prima sui descrittori per la scoperta della configurazione. Se il descrittore
restringe solo il plugin candidato e la configurazione necessita ancora di hook runtime più ricchi
in fase di configurazione, imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione di fallback.

OpenClaw include anche `setup.providers[].envVars` nelle ricerche generiche di autenticazione provider e
variabili di ambiente. `providerAuthEnvVars` rimane supportato tramite un adattatore di compatibilità
durante la finestra di deprecazione, ma i plugin non bundled che lo usano ancora
ricevono una diagnostica del manifest. I nuovi plugin devono inserire i metadati di ambiente
di configurazione/stato in `setup.providers[].envVars`.

OpenClaw può anche derivare scelte di configurazione semplici da `setup.providers[].authMethods`
quando non è disponibile alcuna voce di configurazione, oppure quando `setup.requiresRuntime: false`
dichiara che il runtime di configurazione non è necessario. Le voci esplicite `providerAuthChoices` restano
preferite per etichette personalizzate, flag CLI, ambito di onboarding e metadati dell'assistente.

Imposta `requiresRuntime: false` solo quando quei descrittori sono sufficienti per la
superficie di configurazione. OpenClaw tratta `false` esplicito come un contratto basato solo su descrittori
e non eseguirà `setup-api` o `openclaw.setupEntry` per la ricerca della configurazione. Se
un plugin basato solo su descrittori distribuisce comunque una di quelle voci runtime di configurazione,
OpenClaw segnala una diagnostica additiva e continua a ignorarla. L'omissione di
`requiresRuntime` mantiene il comportamento di fallback legacy, così i plugin esistenti che hanno aggiunto
descrittori senza il flag non si rompono.

Poiché la ricerca della configurazione può eseguire codice `setup-api` di proprietà del plugin, i valori normalizzati
`setup.providers[].id` e `setup.cliBackends[]` devono rimanere univoci tra i
plugin scoperti. La proprietà ambigua fallisce in modo chiuso invece di scegliere un
vincitore dall'ordine di scoperta.

Quando il runtime di configurazione viene eseguito, le diagnostiche del registro di configurazione segnalano deriva dei descrittori
se `setup-api` registra un provider o un backend CLI che i descrittori del manifest
non dichiarano, oppure se un descrittore non ha alcuna registrazione runtime
corrispondente. Queste diagnostiche sono additive e non rifiutano i plugin legacy.

### riferimento setup.providers

| Campo          | Obbligatorio | Tipo       | Significato                                                                                       |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Sì           | `string`   | ID provider esposto durante la configurazione o l'onboarding. Mantieni gli ID normalizzati globalmente univoci. |
| `authMethods`  | No           | `string[]` | ID dei metodi di configurazione/autenticazione supportati da questo provider senza caricare l'intero runtime. |
| `envVars`      | No           | `string[]` | Variabili di ambiente che le superfici generiche di configurazione/stato possono controllare prima del caricamento del runtime del plugin. |
| `authEvidence` | No           | `object[]` | Controlli economici di evidenza di autenticazione locale per provider che possono autenticarsi tramite marcatori non segreti. |

`authEvidence` è pensato per marcatori di credenziali locali di proprietà del provider che possono essere
verificati senza caricare codice runtime. Questi controlli devono restare economici e locali:
nessuna chiamata di rete, nessuna lettura da keychain o gestori di segreti, nessun comando shell e nessuna
sonda API del provider.

Voci di evidenza supportate:

| Campo              | Obbligatorio | Tipo       | Significato                                                                                                  |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Sì           | `string`   | Attualmente `local-file-with-env`.                                                                           |
| `fileEnvVar`       | No           | `string`   | Variabile di ambiente contenente un percorso esplicito del file delle credenziali.                            |
| `fallbackPaths`    | No           | `string[]` | Percorsi locali dei file di credenziali controllati quando `fileEnvVar` è assente o vuota. Supporta `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | No           | `string[]` | Almeno una delle variabili di ambiente elencate deve essere non vuota perché l'evidenza sia valida.          |
| `requiresAllEnv`   | No           | `string[]` | Ogni variabile di ambiente elencata deve essere non vuota perché l'evidenza sia valida.                      |
| `credentialMarker` | Sì           | `string`   | Marcatore non segreto restituito quando l'evidenza è presente.                                                |
| `source`           | No           | `string`   | Etichetta della sorgente rivolta all'utente per l'output di autenticazione/stato.                             |

### campi setup

| Campo              | Obbligatorio | Tipo       | Significato                                                                                          |
| ------------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di configurazione dei provider esposti durante la configurazione e l'onboarding.         |
| `cliBackends`      | No           | `string[]` | ID backend in fase di configurazione usati per la ricerca della configurazione basata prima sui descrittori. Mantieni gli ID normalizzati globalmente univoci. |
| `configMigrations` | No           | `string[]` | ID di migrazione della configurazione di proprietà della superficie di configurazione di questo plugin. |
| `requiresRuntime`  | No           | `boolean`  | Se la configurazione necessita ancora dell'esecuzione di `setup-api` dopo la ricerca tramite descrittori. |

## riferimento uiHints

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

| Campo         | Tipo       | Significato                           |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | Etichetta del campo rivolta all'utente. |
| `help`        | `string`   | Breve testo di aiuto.                 |
| `tags`        | `string[]` | Tag UI facoltativi.                   |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.  |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input dei moduli. |

## riferimento contracts

Usa `contracts` solo per metadati statici di proprietà delle capability che OpenClaw può
leggere senza importare il runtime del plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Ogni elenco è facoltativo:

| Campo                            | Tipo       | Significato                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | ID delle factory di estensioni app-server Codex, attualmente `codex-app-server`.                                                                |
| `agentToolResultMiddleware`      | `string[]` | ID degli ambienti di esecuzione per cui questo Plugin può registrare middleware dei risultati degli strumenti.                                                                     |
| `trustedToolPolicies`            | `string[]` | ID delle policy pre-strumento attendibili locali al Plugin che un Plugin installato può registrare. I Plugin inclusi possono registrare policy senza questo campo. |
| `externalAuthProviders`          | `string[]` | ID dei provider di cui questo Plugin possiede l'hook del profilo di autenticazione esterna.                                                                      |
| `embeddingProviders`             | `string[]` | ID dei provider di embedding generali che questo Plugin possiede per l'uso riutilizzabile di embedding vettoriali, inclusa la memoria.                                 |
| `speechProviders`                | `string[]` | ID dei provider vocali che questo Plugin possiede.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione in tempo reale che questo Plugin possiede.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider vocali in tempo reale che questo Plugin possiede.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | ID deprecati dei provider di embedding specifici per la memoria che questo Plugin possiede.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider di comprensione dei media che questo Plugin possiede.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | ID dei provider di origine delle trascrizioni che questo Plugin possiede.                                                                                     |
| `imageGenerationProviders`       | `string[]` | ID dei provider di generazione di immagini che questo Plugin possiede.                                                                                      |
| `videoGenerationProviders`       | `string[]` | ID dei provider di generazione di video che questo Plugin possiede.                                                                                      |
| `webFetchProviders`              | `string[]` | ID dei provider di recupero web che questo Plugin possiede.                                                                                             |
| `webSearchProviders`             | `string[]` | ID dei provider di ricerca web che questo Plugin possiede.                                                                                            |
| `migrationProviders`             | `string[]` | ID dei provider di importazione che questo Plugin possiede per `openclaw migrate`.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Titolarità riservata per le route HTTP autenticate dei Plugin che inviano metodi Gateway nello stesso processo.                                  |
| `tools`                          | `string[]` | Nomi degli strumenti agente che questo Plugin possiede.                                                                                                   |

`contracts.embeddedExtensionFactories` è mantenuto per le factory di estensioni incluse
solo per app-server Codex. Le trasformazioni incluse dei risultati degli strumenti dovrebbero
dichiarare invece `contracts.agentToolResultMiddleware` e registrarsi con
`api.registerAgentToolResultMiddleware(...)`. I Plugin installati possono usare
lo stesso punto di integrazione middleware solo quando è abilitato esplicitamente e solo per gli ambienti di esecuzione che
dichiarano in `contracts.agentToolResultMiddleware`.

I Plugin installati che richiedono il livello di policy pre-strumento attendibile dall'host devono dichiarare
ogni ID locale registrato in `contracts.trustedToolPolicies` ed essere abilitati
esplicitamente. I Plugin inclusi mantengono il percorso di policy attendibile esistente, ma i Plugin
installati con ID di policy non dichiarati vengono rifiutati prima della registrazione. Gli ID di policy
sono limitati al Plugin che li registra, quindi due Plugin possono entrambi dichiarare e
registrare `workflow-budget`; un singolo Plugin non può registrare lo stesso ID locale
due volte.

Le registrazioni `api.registerTool(...)` dell'ambiente di esecuzione devono corrispondere a `contracts.tools`.
La scoperta degli strumenti usa questo elenco per caricare solo gli ambienti di esecuzione dei Plugin che possono possedere gli
strumenti richiesti.

I Plugin provider che implementano `resolveExternalAuthProfiles` dovrebbero dichiarare
`contracts.externalAuthProviders`; gli hook di autenticazione esterna non dichiarati vengono ignorati.

I provider di embedding generali dovrebbero dichiarare `contracts.embeddingProviders` per
ogni adattatore registrato con `api.registerEmbeddingProvider(...)`. Usa il
contratto generale per la generazione riutilizzabile di vettori, inclusi i provider consumati dalla
ricerca in memoria. `contracts.memoryEmbeddingProviders` è una compatibilità deprecata
specifica per la memoria e rimane solo mentre i provider esistenti migrano
al punto di integrazione generico dei provider di embedding.

`contracts.gatewayMethodDispatch` attualmente accetta
`"authenticated-request"`. È un controllo di igiene dell'API per le route HTTP native dei Plugin
che inviano intenzionalmente metodi del piano di controllo Gateway nello stesso processo, non
una sandbox contro Plugin nativi malevoli. Usalo solo per superfici incluse/operative
revisionate attentamente che richiedono già l'autenticazione HTTP Gateway.

## Riferimento mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` quando un provider di comprensione dei media ha
modelli predefiniti, priorità di fallback di autenticazione automatica o supporto nativo per documenti di cui
gli helper generici del core hanno bisogno prima del caricamento dell'ambiente di esecuzione. Le chiavi devono anche essere dichiarate in
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

Ogni voce di provider può includere:

| Campo                  | Tipo                                | Significato                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacità media esposte da questo provider.                                 |
| `defaultModels`        | `Record<string, string>`            | Valori predefiniti capacità-modello usati quando la configurazione non specifica un modello.      |
| `autoPriority`         | `Record<string, number>`            | Numeri più bassi vengono ordinati prima per il fallback automatico del provider basato sulle credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input di documenti nativi supportati dal provider.                            |

## Riferimento channelConfigs

Usa `channelConfigs` quando un Plugin di canale ha bisogno di metadati di configurazione leggeri prima
del caricamento dell'ambiente di esecuzione. La scoperta in sola lettura della configurazione/stato del canale può usare questi metadati
direttamente per i canali esterni configurati quando non è disponibile alcuna voce di configurazione, oppure
quando `setup.requiresRuntime: false` dichiara che l'ambiente di esecuzione di configurazione non è necessario.

`channelConfigs` è metadato del manifesto del Plugin, non una nuova sezione di configurazione utente
di primo livello. Gli utenti configurano ancora le istanze di canale sotto `channels.<channel-id>`.
OpenClaw legge i metadati del manifesto per decidere quale Plugin possiede quel canale
configurato prima che il codice dell'ambiente di esecuzione del Plugin venga eseguito.

Per un Plugin di canale, `configSchema` e `channelConfigs` descrivono percorsi
diversi:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

I Plugin non inclusi che dichiarano `channels[]` dovrebbero anche dichiarare voci
`channelConfigs` corrispondenti. Senza di esse, OpenClaw può comunque caricare il Plugin, ma
le superfici di schema di configurazione, configurazione e Control UI nel percorso a freddo non possono conoscere la
forma delle opzioni possedute dal canale finché l'ambiente di esecuzione del Plugin non viene eseguito.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` possono dichiarare valori predefiniti statici `auto` per controlli di configurazione dei comandi
che vengono eseguiti prima del caricamento dell'ambiente di esecuzione del canale. I canali inclusi possono anche pubblicare
gli stessi valori predefiniti tramite `package.json#openclaw.channel.commands` insieme
agli altri metadati di catalogo canale posseduti dal pacchetto.

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Ogni voce di canale può includere:

| Campo         | Tipo                     | Significato                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Obbligatorio per ogni voce di configurazione canale dichiarata.         |
| `uiHints`     | `Record<string, object>` | Etichette/segnaposto/suggerimenti di sensibilità opzionali dell'interfaccia per quella sezione di configurazione canale.          |
| `label`       | `string`                 | Etichetta del canale unita nelle superfici di selezione e ispezione quando i metadati dell'ambiente di esecuzione non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                               |
| `commands`    | `object`                 | Valori predefiniti automatici statici per comandi nativi e Skill nativa nei controlli di configurazione pre-esecuzione.       |
| `preferOver`  | `string[]`               | ID di Plugin legacy o a priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione.    |

### Sostituire un altro Plugin di canale

Usa `preferOver` quando il tuo Plugin è il proprietario preferito per un ID canale che
anche un altro Plugin può fornire. I casi comuni sono un ID Plugin rinominato, un
Plugin autonomo che sostituisce un Plugin incluso, oppure un fork mantenuto che
mantiene lo stesso ID canale per compatibilità di configurazione.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Quando `channels.chat` è configurato, OpenClaw considera sia l'ID canale sia
l'ID Plugin preferito. Se il Plugin a priorità inferiore era stato selezionato solo perché
è incluso o abilitato per impostazione predefinita, OpenClaw lo disabilita nella configurazione
effettiva dell'ambiente di esecuzione in modo che un solo Plugin possieda il canale e i suoi strumenti. La selezione esplicita
dell'utente continua a prevalere: se l'utente abilita esplicitamente entrambi i Plugin, OpenClaw
preserva quella scelta e segnala diagnostiche di canali/strumenti duplicati invece di
modificare silenziosamente l'insieme di Plugin richiesto.

Mantieni `preferOver` limitato agli ID di Plugin che possono davvero fornire lo stesso canale.
Non è un campo di priorità generale e non rinomina le chiavi di configurazione utente.

## Riferimento modelSupport

Usa `modelSupport` quando OpenClaw deve dedurre il Plugin del fornitore da
ID modello abbreviati come `gpt-5.5` o `claude-sonnet-4.6` prima del caricamento
dell'ambiente di esecuzione del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica questa precedenza:

- i riferimenti espliciti `provider/model` usano i metadati del manifest
  `providers` del proprietario
- `modelPatterns` ha precedenza su `modelPrefixes`
- se corrispondono sia un Plugin non incluso sia un Plugin incluso, prevale il
  Plugin non incluso
- l'ambiguita restante viene ignorata finche l'utente o la configurazione non
  specifica un fornitore

Campi:

| Campo           | Tipo       | Significato                                                                         |
| --------------- | ---------- | ----------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.          |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

Le voci `modelPatterns` vengono compilate tramite `compileSafeRegex`, che rifiuta
i pattern contenenti ripetizioni annidate (per esempio `(a+)+$`). I pattern che
non superano il controllo di sicurezza vengono saltati silenziosamente, come le
regex sintatticamente non valide. Mantieni i pattern semplici ed evita i
quantificatori annidati.

## riferimento modelCatalog

Usa `modelCatalog` quando OpenClaw deve conoscere i metadati dei modelli del
fornitore prima di caricare l'ambiente di esecuzione del Plugin. Questa e la
sorgente di proprieta del manifest per righe di catalogo fisse, alias dei
fornitori, regole di soppressione e modalita di discovery. L'aggiornamento in
runtime resta nel codice di runtime del fornitore, ma il manifest indica al core
quando il runtime e richiesto.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Campi di primo livello:

| Campo            | Tipo                                                     | Significato                                                                                                  |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `providers`      | `Record<string, object>`                                 | Righe di catalogo per gli ID fornitore di proprieta di questo Plugin. Le chiavi dovrebbero comparire anche in `providers` di primo livello. |
| `aliases`        | `Record<string, object>`                                 | Alias dei fornitori che devono risolversi a un fornitore posseduto per la pianificazione del catalogo o delle soppressioni. |
| `suppressions`   | `object[]`                                               | Righe modello da un'altra sorgente che questo Plugin sopprime per un motivo specifico del fornitore.          |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se il catalogo del fornitore puo essere letto dai metadati del manifest, aggiornato nella cache o richiede il runtime. |
| `runtimeAugment` | `boolean`                                                | Imposta su `true` solo quando il runtime del fornitore deve aggiungere righe di catalogo dopo la pianificazione manifest/configurazione. |

`aliases` partecipa alla ricerca della proprieta del fornitore per la
pianificazione del catalogo modelli. Le destinazioni degli alias devono essere
fornitori di primo livello posseduti dallo stesso Plugin. Quando un elenco
filtrato per fornitore usa un alias, OpenClaw puo leggere il manifest
proprietario e applicare override di API/base URL dell'alias senza caricare il
runtime del fornitore. Gli alias non espandono gli elenchi di catalogo non
filtrati; gli elenchi ampi emettono solo le righe del fornitore canonico
proprietario.

`suppressions` sostituisce il vecchio hook del runtime del fornitore
`suppressBuiltInModel`. Le voci di soppressione sono rispettate solo quando il
fornitore e posseduto dal Plugin o dichiarato come chiave `modelCatalog.aliases`
che punta a un fornitore posseduto. Gli hook di soppressione del runtime non
vengono piu chiamati durante la risoluzione del modello.

Campi del fornitore:

| Campo     | Tipo                     | Significato                                                               |
| --------- | ------------------------ | ------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL predefinito opzionale per i modelli in questo catalogo fornitore. |
| `api`     | `ModelApi`               | Adattatore API predefinito opzionale per i modelli in questo catalogo fornitore. |
| `headers` | `Record<string, string>` | Header statici opzionali applicati a questo catalogo fornitore.           |
| `models`  | `object[]`               | Righe modello obbligatorie. Le righe senza un `id` vengono ignorate.      |

Campi del modello:

| Campo           | Tipo                                                           | Significato                                                               |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID modello locale del fornitore, senza il prefisso `provider/`.           |
| `name`          | `string`                                                       | Nome visualizzato opzionale.                                              |
| `api`           | `ModelApi`                                                     | Override API opzionale per modello.                                       |
| `baseUrl`       | `string`                                                       | Override base URL opzionale per modello.                                  |
| `headers`       | `Record<string, string>`                                       | Header statici opzionali per modello.                                     |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalita accettate dal modello.                                           |
| `reasoning`     | `boolean`                                                      | Indica se il modello espone comportamento di ragionamento.                |
| `contextWindow` | `number`                                                       | Finestra di contesto nativa del fornitore.                                |
| `contextTokens` | `number`                                                       | Limite effettivo opzionale del contesto runtime quando diverso da `contextWindow`. |
| `maxTokens`     | `number`                                                       | Token massimi di output quando noti.                                      |
| `cost`          | `object`                                                       | Prezzi opzionali in USD per milione di token, incluso `tieredPricing` opzionale. |
| `compat`        | `object`                                                       | Flag di compatibilita opzionali corrispondenti alla compatibilita della configurazione modello di OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato dell'elenco. Sopprimi solo quando la riga non deve apparire affatto. |
| `statusReason`  | `string`                                                       | Motivo opzionale mostrato con uno stato non disponibile.                  |
| `replaces`      | `string[]`                                                     | ID modello locali del fornitore piu vecchi che questo modello sostituisce. |
| `replacedBy`    | `string`                                                       | ID modello locale del fornitore sostitutivo per righe deprecate.          |
| `tags`          | `string[]`                                                     | Tag stabili usati da selettori e filtri.                                  |

Campi di soppressione:

| Campo                      | Tipo       | Significato                                                                                             |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID fornitore della riga upstream da sopprimere. Deve essere posseduto da questo Plugin o dichiarato come alias posseduto. |
| `model`                    | `string`   | ID modello locale del fornitore da sopprimere.                                                          |
| `reason`                   | `string`   | Messaggio opzionale mostrato quando la riga soppressa viene richiesta direttamente.                     |
| `when.baseUrlHosts`        | `string[]` | Elenco opzionale degli host base URL effettivi del fornitore richiesti prima che la soppressione si applichi. |
| `when.providerConfigApiIn` | `string[]` | Elenco opzionale di valori `api` esatti della configurazione del fornitore richiesti prima che la soppressione si applichi. |

Non inserire dati disponibili solo a runtime in `modelCatalog`. Usa `static`
solo quando le righe del manifest sono abbastanza complete da permettere alle
superfici di elenco filtrate per fornitore e ai selettori di saltare la
discovery da registro/runtime. Usa `refreshable` quando le righe del manifest
sono seed o supplementi elencabili utili, ma un aggiornamento/cache puo
aggiungere altre righe in seguito; le righe refreshable non sono autorevoli da
sole. Usa `runtime` quando OpenClaw deve caricare il runtime del fornitore per
conoscere l'elenco.

## riferimento modelIdNormalization

Usa `modelIdNormalization` per la pulizia economica degli ID modello di
proprieta del fornitore che deve avvenire prima del caricamento del runtime del
fornitore. Questo mantiene alias come nomi modello brevi, ID legacy locali del
fornitore e regole di prefisso proxy nel manifest del Plugin proprietario
anziche nelle tabelle core di selezione dei modelli.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Campi del fornitore:

| Campo                                | Tipo                    | Significato                                                                              |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias esatti degli ID modello senza distinzione tra maiuscole e minuscole. I valori vengono restituiti come scritti. |
| `stripPrefixes`                      | `string[]`              | Prefissi da rimuovere prima della ricerca alias, utili per duplicazioni legacy provider/model. |
| `prefixWhenBare`                     | `string`                | Prefisso da aggiungere quando l'ID modello normalizzato non contiene gia `/`.            |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regole condizionali di prefisso per ID senza provider dopo la ricerca alias, indicizzate da `modelPrefix` e `prefix`. |

## riferimento providerEndpoints

Usa `providerEndpoints` per la classificazione degli endpoint che la policy
generica delle richieste deve conoscere prima del caricamento del runtime del
fornitore. Il core possiede ancora il significato di ogni `endpointClass`; i
manifest dei Plugin possiedono i metadati di host e base URL.

Campi endpoint:

| Campo                          | Tipo       | Significato                                                                                                  |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `endpointClass`                | `string`   | Classe endpoint core nota, come `openrouter`, `moonshot-native` o `google-vertex`.                           |
| `hosts`                        | `string[]` | Nomi host esatti che mappano alla classe endpoint.                                                           |
| `hostSuffixes`                 | `string[]` | Suffissi host che mappano alla classe endpoint. Anteponi `.` per la corrispondenza solo dei suffissi dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizzati esatti che mappano alla classe endpoint.                                        |
| `googleVertexRegion`           | `string`   | Regione Google Vertex statica per host globali esatti.                                                       |
| `googleVertexRegionHostSuffix` | `string`   | Suffisso da rimuovere dagli host corrispondenti per esporre il prefisso della regione Google Vertex.          |

## Riferimento providerRequest

Usa `providerRequest` per metadati economici di compatibilità della richiesta di cui la policy
generica delle richieste ha bisogno senza caricare il runtime del provider. Mantieni la riscrittura
del payload specifica del comportamento negli hook del runtime del provider o negli helper condivisi
della famiglia di provider.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Campi del provider:

| Campo                 | Tipo         | Significato                                                                                |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `family`              | `string`     | Etichetta della famiglia di provider usata dalle decisioni e dalla diagnostica generiche di compatibilità delle richieste. |
| `compatibilityFamily` | `"moonshot"` | Bucket opzionale di compatibilità della famiglia di provider per helper condivisi delle richieste. |
| `openAICompletions`   | `object`     | Flag delle richieste di completamenti compatibili con OpenAI, attualmente `supportsStreamingUsage`. |

## Riferimento secretProviderIntegrations

Usa `secretProviderIntegrations` quando un plugin può pubblicare un preset riutilizzabile
di provider exec SecretRef. OpenClaw legge questi metadati prima che il runtime del plugin venga caricato,
memorizza la proprietà del plugin in `secrets.providers.<alias>.pluginIntegration` e
lascia la risoluzione effettiva dei segreti al runtime SecretRef.
I preset sono esposti solo per plugin in bundle e plugin installati scoperti
dalle radici di installazione gestite dei plugin, come installazioni git e ClawHub.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

La chiave della mappa è l'id dell'integrazione. Se `providerAlias` viene omesso, OpenClaw usa
l'id dell'integrazione come alias del provider SecretRef. Gli alias dei provider devono corrispondere
al normale pattern degli alias dei provider SecretRef, per esempio `team-secrets` o
`onepassword-work`.

Quando un operatore seleziona il preset, OpenClaw scrive un riferimento provider come:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

All'avvio/ricaricamento, OpenClaw risolve quel provider caricando i metadati correnti
del manifest del plugin, verificando che il plugin proprietario sia installato e attivo, e
materializzando il comando exec dal manifest. La disabilitazione o rimozione del
plugin revoca il provider per i SecretRef attivi. Gli operatori che vogliono una
configurazione exec autonoma possono comunque scrivere direttamente provider manuali `command`/`args`.

Attualmente sono supportati solo preset `source: "exec"`. `command` deve essere
`${node}` e `args[0]` deve essere uno script resolver relativo alla radice del plugin con `./`.
OpenClaw lo materializza all'avvio/ricaricamento nell'eseguibile Node corrente e
nel percorso assoluto dello script interno al plugin. Opzioni Node come `--require`, `--import`,
`--loader`, `--env-file`, `--eval` e `--print` non fanno parte del contratto
dei preset del manifest. Gli operatori che hanno bisogno di comandi non Node possono configurare
direttamente provider exec manuali autonomi.

OpenClaw deriva `trustedDirs` per i preset del manifest dalla radice del plugin e,
per i preset `${node}`, dalla directory dell'eseguibile Node corrente. I
`trustedDirs` scritti nel manifest vengono ignorati. Altre opzioni del provider exec come `timeoutMs`,
`maxOutputBytes`, `jsonOnly`, `env`, `passEnv` e `allowInsecurePath` passano
alla normale configurazione del provider exec SecretRef.

## Riferimento modelPricing

Usa `modelPricing` quando un provider deve controllare il comportamento di pricing del control plane prima
che il runtime venga caricato. La cache di pricing del Gateway legge questi metadati senza importare
il codice runtime del provider.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Campi del provider:

| Campo        | Tipo              | Significato                                                                                         |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Imposta `false` per provider locali/self-hosted che non devono mai recuperare prezzi OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Mappatura della ricerca prezzi OpenRouter. `false` disabilita la ricerca OpenRouter per questo provider. |
| `liteLLM`    | `false \| object` | Mappatura della ricerca prezzi LiteLLM. `false` disabilita la ricerca LiteLLM per questo provider.   |

Campi della sorgente:

| Campo                      | Tipo               | Significato                                                                                                      |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id provider del catalogo esterno quando differisce dall'id provider OpenClaw, per esempio `z-ai` per un provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Tratta gli id modello contenenti barre come riferimenti provider/modello annidati, utile per provider proxy come OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varianti aggiuntive degli id modello del catalogo esterno. `version-dots` prova id versione puntati come `claude-opus-4.6`. |

### Indice dei provider OpenClaw

L'Indice dei provider OpenClaw è un metadato di anteprima di proprietà di OpenClaw per provider
i cui plugin potrebbero non essere ancora installati. Non fa parte di un manifest di plugin.
I manifest dei plugin restano l'autorità per i plugin installati. L'Indice dei provider è
il contratto di fallback interno che le superfici future di provider installabili e selettore modelli
pre-installazione consumeranno quando un plugin provider non è installato.

Ordine di autorità del catalogo:

1. Configurazione utente.
2. Manifest del plugin installato `modelCatalog`.
3. Cache del catalogo modelli da aggiornamento esplicito.
4. Righe di anteprima dell'Indice dei provider OpenClaw.

L'Indice dei provider non deve contenere segreti, stato abilitato, hook runtime o
dati modello live specifici dell'account. I suoi cataloghi di anteprima usano la stessa
forma di riga provider `modelCatalog` dei manifest dei plugin, ma dovrebbero restare limitati
a metadati di visualizzazione stabili, a meno che campi dell'adapter runtime come `api`,
`baseUrl`, pricing o flag di compatibilità siano mantenuti intenzionalmente allineati al
manifest del plugin installato. I provider con discovery live `/models` dovrebbero
scrivere righe aggiornate tramite il percorso esplicito della cache del catalogo modelli invece di
fare in modo che normali elenchi o onboarding chiamino le API del provider.

Le voci dell'Indice dei provider possono anche contenere metadati di plugin installabili per provider
il cui plugin è stato spostato fuori dal core o comunque non è ancora installato. Questi
metadati rispecchiano il pattern del catalogo canali: nome pacchetto, specifica di installazione npm,
integrità prevista ed etichette economiche di scelta auth bastano per mostrare
un'opzione di configurazione installabile. Una volta installato il plugin, il suo manifest prevale e
la voce dell'Indice dei provider viene ignorata per quel provider.

Le chiavi di capability top-level legacy sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi top-level come proprietà delle capability.

## Manifest rispetto a package.json

I due file servono a scopi diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, convalida della configurazione, metadati delle scelte auth e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating dell'installazione, setup o metadati di catalogo |

Se non sai dove collocare un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di ingresso o comportamento di installazione npm, mettilo in `package.json`

### Campi package.json che influenzano la discovery

Alcuni metadati pre-runtime del plugin vivono intenzionalmente in `package.json` sotto il
blocco `openclaw` invece che in `openclaw.plugin.json`.
`openclaw.bundle` e `openclaw.bundle.json` non sono contratti di plugin OpenClaw;
i plugin nativi devono usare `openclaw.plugin.json` più i campi supportati
`package.json#openclaw` qui sotto.

Esempi importanti:

| Campo                                                                                      | Significato                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Dichiara gli entrypoint nativi del Plugin. Deve restare all'interno della directory del pacchetto del Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Dichiara gli entrypoint runtime JavaScript compilati per i pacchetti installati. Deve restare all'interno della directory del pacchetto del Plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Entrypoint leggero solo per la configurazione usato durante l'onboarding, l'avvio differito del canale e il rilevamento dello stato del canale/SecretRef in sola lettura. Deve restare all'interno della directory del pacchetto del Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Dichiara l'entrypoint di configurazione JavaScript compilato per i pacchetti installati. Richiede `setupEntry`, deve esistere e deve restare all'interno della directory del pacchetto del Plugin.                         |
| `openclaw.channel`                                                                         | Metadati economici del catalogo canali, come etichette, percorsi della documentazione, alias e testo di selezione.                                                                                                 |
| `openclaw.channel.commands`                                                                | Metadati statici di comandi nativi e impostazioni predefinite automatiche delle skill native usati da config, audit e superfici di elenco comandi prima del caricamento del runtime del canale.                                          |
| `openclaw.channel.configuredState`                                                         | Metadati leggeri del verificatore dello stato configurato che possono rispondere a "la configurazione solo tramite env esiste già?" senza caricare l'intero runtime del canale.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadati leggeri del verificatore dell'autenticazione persistita che possono rispondere a "qualcosa ha già effettuato l'accesso?" senza caricare l'intero runtime del canale.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Suggerimenti di installazione/aggiornamento per Plugin inclusi e pubblicati esternamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.compat.pluginApi`                                                                | Intervallo minimo dell'API dei Plugin OpenClaw richiesto da questo pacchetto, usando una soglia semver come `>=2026.5.27`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | Stringa di integrità npm dist attesa, come `sha512-...`; i flussi di installazione e aggiornamento verificano l'artefatto recuperato rispetto a essa.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Consente un percorso ristretto di ripristino tramite reinstallazione di Plugin incluso quando la configurazione non è valida.                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Alias di pacchetti npm che devono materializzarsi quando i vincoli di piattaforma del loro lockfile corrispondono all'host corrente.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Consente alle superfici del canale setup-runtime di caricarsi prima dell'ascolto, poi differisce il Plugin del canale configurato completo fino all'attivazione post-ascolto.                                                 |

I metadati del manifest decidono quali scelte di provider/canale/configurazione appaiono in
onboarding prima del caricamento del runtime. `package.json#openclaw.install` indica
all'onboarding come recuperare o abilitare quel Plugin quando l'utente sceglie una di quelle
opzioni. Non spostare i suggerimenti di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del
registro dei manifest per sorgenti di Plugin non incluse. I valori non validi vengono rifiutati;
i valori più recenti ma validi saltano i Plugin esterni sugli host più vecchi. Si presume che i
Plugin sorgente inclusi siano co-versionati con il checkout dell'host.

`openclaw.install.requiredPlatformPackages` è per i pacchetti npm che espongono
binari nativi richiesti tramite alias opzionali specifici della piattaforma. Elenca il
nome nudo del pacchetto npm per ogni alias di piattaforma supportato. Durante l'installazione npm,
OpenClaw verifica solo l'alias dichiarato i cui vincoli nel lockfile corrispondono
all'host corrente. Se npm segnala il successo ma omette quell'alias, OpenClaw riprova una volta
con una cache pulita ed esegue il rollback dell'installazione se l'alias è ancora mancante.

`openclaw.compat.pluginApi` viene applicato durante l'installazione del pacchetto per sorgenti di
Plugin non incluse. Usalo per la soglia dell'API SDK/runtime dei Plugin OpenClaw con cui il
pacchetto è stato compilato. Può essere più restrittivo di `minHostVersion` quando un
pacchetto Plugin richiede un'API più recente ma mantiene comunque un suggerimento di installazione più basso per altri
flussi. La sincronizzazione delle release ufficiali di OpenClaw aumenta per impostazione predefinita le soglie API dei Plugin ufficiali esistenti
alla versione della release di OpenClaw, ma le release solo Plugin possono mantenere una
soglia più bassa quando il pacchetto supporta intenzionalmente host più vecchi. Non usare la
sola versione del pacchetto come contratto di compatibilità. `peerDependencies.openclaw`
rimane metadato del pacchetto npm; OpenClaw usa il contratto `openclaw.compat.pluginApi`
per le decisioni di compatibilità dell'installazione.

I metadati ufficiali di installazione su richiesta dovrebbero usare `clawhubSpec` quando il Plugin è
pubblicato su ClawHub; l'onboarding lo tratta come la sorgente remota preferita e
registra i dati dell'artefatto ClawHub dopo l'installazione. `npmSpec` rimane il fallback di compatibilità
per i pacchetti che non sono ancora passati a ClawHub.

Il pinning esatto della versione npm vive già in `npmSpec`, per esempio
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci del catalogo esterno ufficiale
dovrebbero associare specifiche esatte a `expectedIntegrity` così i flussi di aggiornamento falliscono
chiusi se l'artefatto npm recuperato non corrisponde più alla release fissata.
L'onboarding interattivo offre ancora specifiche npm da registri attendibili, inclusi
nomi di pacchetto nudi e dist-tag, per compatibilità. La diagnostica del catalogo può
distinguere sorgenti esatte, mobili, con pin di integrità, con integrità mancante, con
mancata corrispondenza del nome pacchetto e con scelta predefinita non valida. Avvisa anche quando
`expectedIntegrity` è presente ma non esiste una sorgente npm valida che possa fissare.
Quando `expectedIntegrity` è presente,
i flussi di installazione/aggiornamento la applicano; quando è omessa, la risoluzione del registro viene
registrata senza un pin di integrità.

I Plugin di canale dovrebbero fornire `openclaw.setupEntry` quando stato, elenco canali
o scansioni SecretRef devono identificare account configurati senza caricare l'intero
runtime. L'entry di configurazione dovrebbe esporre metadati del canale più adapter di config,
stato e segreti sicuri per la configurazione; mantieni client di rete, listener Gateway e
runtime di trasporto nell'entrypoint principale dell'estensione.

I campi degli entrypoint runtime non sovrascrivono i controlli del confine del pacchetto per i campi
degli entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non può rendere caricabile un
percorso `openclaw.extensions` in uscita dal pacchetto.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non rende
installabili configurazioni rotte arbitrarie. Oggi consente solo ai flussi di installazione
di recuperare da specifici errori obsoleti di aggiornamento di Plugin inclusi, come un
percorso del Plugin incluso mancante o una voce `channels.<id>` obsoleta per lo stesso
Plugin incluso. Errori di configurazione non correlati bloccano comunque l'installazione e indirizzano gli operatori
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è metadato di pacchetto per un piccolo modulo
verificatore:

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

Usalo quando setup, doctor, stato o flussi di presenza in sola lettura hanno bisogno di un probe di autenticazione
sì/no economico prima del caricamento del Plugin di canale completo. Lo stato di autenticazione persistito non è
lo stato del canale configurato: non usare questi metadati per abilitare automaticamente Plugin,
riparare dipendenze runtime o decidere se un runtime di canale debba caricarsi.
L'export di destinazione dovrebbe essere una piccola funzione che legge solo lo stato persistito; non
instradarlo attraverso il barrel del runtime di canale completo.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici di configurazione
solo env:

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
runtime del canale, mantieni quella logica nell'hook `config.hasConfiguredState`
del Plugin.

## Precedenza di discovery (ID di Plugin duplicati)

OpenClaw scopre Plugin da diverse root. Per l'ordine grezzo di scansione del filesystem,
vedi [Ordine di scansione dei Plugin](/it/gateway/configuration-reference#plugin-scan-order).
Se due discovery condividono lo stesso `id`, viene mantenuto solo il manifest con
**precedenza più alta**; i duplicati con precedenza inferiore vengono scartati invece di essere caricati accanto a esso.

Precedenza, dalla più alta alla più bassa:

1. **Selezionato da config** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Incluso** — Plugin distribuiti con OpenClaw
3. **Installazione globale** — Plugin installati nella root globale dei Plugin OpenClaw
4. **Workspace** — Plugin scoperti relativamente al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un Plugin incluso presente nel workspace non oscurerà la build inclusa.
- Per sovrascrivere davvero un Plugin incluso con uno locale, fissalo tramite `plugins.entries.<id>` così vince per precedenza invece di affidarti alla discovery del workspace.
- Gli scarti dei duplicati vengono registrati così Doctor e la diagnostica di startup possono indicare la copia scartata.
- Gli override duplicati selezionati da config vengono formulati come override espliciti nella diagnostica, ma avvisano comunque così fork obsoleti e ombreggiamenti accidentali restano visibili.

## Requisiti JSON Schema

- **Ogni plugin deve distribuire uno Schema JSON**, anche se non accetta configurazione.
- Uno schema vuoto è accettabile (per esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati al momento della lettura/scrittura della configurazione, non a runtime.
- Quando si estende o si crea un fork di un plugin in bundle con nuove chiavi di configurazione, aggiornare contemporaneamente il `configSchema` in `openclaw.plugin.json` di quel plugin. Gli schemi dei plugin in bundle sono rigorosi, quindi l'aggiunta di `plugins.entries.<id>.config.myNewKey` nella configurazione utente senza aggiungere `myNewKey` a `configSchema.properties` verrà rifiutata prima del caricamento del runtime del plugin.

Esempio di estensione dello schema:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Comportamento della validazione

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'id del canale non sia dichiarato da
  un manifest di plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a id di plugin **rilevabili**. Gli id sconosciuti sono **errori**.
- Se un plugin è installato ma ha un manifest o uno schema mancante o non valido,
  la validazione non riesce e Doctor segnala l'errore del plugin.
- Se esiste una configurazione del plugin ma il plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + log.

Vedi [Riferimento della configurazione](/it/gateway/configuration) per lo schema completo di `plugins.*`.

## Note

- Il manifest è **obbligatorio per i plugin nativi di OpenClaw**, inclusi i caricamenti dal filesystem locale. Il runtime carica comunque separatamente il modulo del plugin; il manifest serve solo per rilevamento + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi senza virgolette sono accettati purché il valore finale sia ancora un oggetto.
- Il loader del manifest legge solo i campi documentati del manifest. Evitare chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono essere tutti omessi quando un plugin non ne ha bisogno.
- `providerCatalogEntry` deve restare leggero e non dovrebbe importare codice runtime ampio; usalo per metadati statici del catalogo provider o descrittori di rilevamento mirati, non per l'esecuzione al momento della richiesta.
- I tipi di plugin esclusivi vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` tramite `plugins.slots.memory`, `kind: "context-engine"` tramite `plugins.slots.contextEngine` (predefinito `legacy`).
- Dichiarare il tipo di plugin esclusivo in questo manifest. `OpenClawPluginDefinition.kind` nella voce runtime è deprecato e resta solo come fallback di compatibilità per i plugin più vecchi.
- I metadati delle variabili d'ambiente (`setup.providers[].envVars`, `providerAuthEnvVars` deprecato e `channelEnvVars`) sono solo dichiarativi. Stato, audit, validazione della consegna cron e altre superfici di sola lettura applicano comunque l'attendibilità del plugin e la policy di attivazione effettiva prima di trattare una variabile d'ambiente come configurata.
- Per i metadati del wizard runtime che richiedono codice del provider, vedi [hook runtime del provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build e qualsiasi requisito di allowlist del package manager (per esempio, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Correlati

<CardGroup cols={3}>
  <Card title="Creare plugin" href="/it/plugins/building-plugins" icon="rocket">
    Introduzione ai plugin.
  </Card>
  <Card title="Architettura dei plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello delle capability.
  </Card>
  <Card title="Panoramica dell'SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento dell'SDK dei plugin e importazioni di sottopercorsi.
  </Card>
</CardGroup>
