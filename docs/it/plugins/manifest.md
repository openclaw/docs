---
read_when:
    - Stai creando un plugin OpenClaw
    - Devi distribuire uno schema di configurazione del plugin o eseguire il debug degli errori di convalida del plugin
summary: Requisiti del manifesto del Plugin e dello schema JSON (convalida rigorosa della configurazione)
title: Manifesto del Plugin
x-i18n:
    generated_at: "2026-07-12T07:18:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Questa pagina tratta il **manifest nativo dei Plugin OpenClaw**, `openclaw.plugin.json`. Per i layout dei bundle compatibili (Codex, Claude, Cursor), consulta [Bundle di Plugin](/it/plugins/bundles).

I formati di bundle compatibili utilizzano invece i propri file manifest:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito dei componenti Claude senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente questi layout, ma non li convalida rispetto allo schema `openclaw.plugin.json` riportato di seguito. Per un bundle compatibile, OpenClaw legge i metadati del bundle, le radici dichiarate delle Skills, le radici dei comandi Claude, i valori predefiniti di `settings.json` di Claude, i valori predefiniti LSP di Claude e i pacchetti di hook supportati, quando il layout corrisponde alle aspettative di runtime di OpenClaw.

Ogni Plugin nativo di OpenClaw **deve** includere `openclaw.plugin.json` nella **radice del Plugin**. OpenClaw lo legge per convalidare la configurazione **senza eseguire il codice del Plugin**. Un manifest mancante o non valido blocca la convalida della configurazione ed è considerato un errore del Plugin.

Consulta [Plugin](/it/tools/plugin) per la guida completa al sistema dei Plugin e [Modello delle funzionalità](/it/plugins/architecture#public-capability-model) per il modello nativo delle funzionalità e le indicazioni attuali sulla compatibilità esterna.

## Funzione di questo file

`openclaw.plugin.json` contiene metadati che OpenClaw legge **prima di caricare il codice del Plugin**. Tutto ciò che contiene deve poter essere esaminato con un costo minimo, senza avviare il runtime del Plugin.

**Usalo per:**

- identità del Plugin, convalida della configurazione e suggerimenti per l'interfaccia di configurazione
- metadati di autenticazione, onboarding e configurazione (alias, abilitazione automatica, variabili di ambiente del provider, opzioni di autenticazione)
- indicazioni di attivazione per le superfici del piano di controllo
- proprietà abbreviata delle famiglie di modelli
- snapshot statici della proprietà delle funzionalità (`contracts`)
- metadati dell'esecutore QA che l'host condiviso `openclaw qa` può esaminare
- metadati di configurazione specifici del canale, integrati nelle superfici del catalogo e della convalida

**Non usarlo per:** registrare comportamenti di runtime, dichiarare punti di ingresso del codice o metadati di installazione npm. Questi elementi appartengono al codice del Plugin e a `package.json`.

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

| Campo                                | Obbligatorio | Tipo                         | Significato                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | ------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì           | `string`                     | ID canonico del plugin. È l'ID utilizzato in `plugins.entries.<id>`.                                                                                                                                                                                                                               |
| `configSchema`                       | Sì           | `object`                     | Schema JSON incorporato per la configurazione di questo plugin.                                                                                                                                                                                                                                   |
| `requiresPlugins`                    | No           | `string[]`                   | ID dei plugin che devono essere anch'essi installati affinché questo plugin abbia effetto. Il rilevamento mantiene il plugin caricabile, ma avvisa quando manca un plugin obbligatorio.                                                                                                             |
| `enabledByDefault`                   | No           | `true`                       | Contrassegna un plugin incluso come abilitato per impostazione predefinita. Ometterlo, oppure impostare un valore diverso da `true`, lascia il plugin disabilitato per impostazione predefinita.                                                                                                    |
| `enabledByDefaultOnPlatforms`        | No           | `string[]`                   | Contrassegna un plugin incluso come abilitato per impostazione predefinita solo sulle piattaforme Node.js elencate, ad esempio `["darwin"]`. La configurazione esplicita ha comunque la precedenza.                                                                                                  |
| `legacyPluginIds`                    | No           | `string[]`                   | ID precedenti che vengono normalizzati nell'ID canonico di questo plugin.                                                                                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                   | ID dei provider che devono abilitare automaticamente questo plugin quando vengono menzionati nei riferimenti di autenticazione, configurazione o modello.                                                                                                                                        |
| `kind`                               | No           | `PluginKind \| PluginKind[]` | Dichiara uno o più tipi esclusivi di plugin (`"memory"`, `"context-engine"`) utilizzati da `plugins.slots.*`. Un plugin che possiede entrambi gli slot dichiara entrambi i tipi in un unico array.                                                                                                  |
| `channels`                           | No           | `string[]`                   | ID dei canali di proprietà di questo plugin. Utilizzati per il rilevamento e la convalida della configurazione.                                                                                                                                                                                    |
| `providers`                          | No           | `string[]`                   | ID dei provider di proprietà di questo plugin.                                                                                                                                                                                                                                                     |
| `providerCatalogEntry`               | No           | `string`                     | Percorso del modulo leggero del catalogo dei provider, relativo alla radice del plugin, per i metadati del catalogo dei provider circoscritti al manifest che possono essere caricati senza attivare l'intero runtime del plugin.                                                                    |
| `modelSupport`                       | No           | `object`                     | Metadati abbreviati della famiglia di modelli di proprietà del manifest, utilizzati per caricare automaticamente il plugin prima del runtime.                                                                                                                                                     |
| `modelCatalog`                       | No           | `object`                     | Metadati dichiarativi del catalogo dei modelli per i provider di proprietà di questo plugin. Costituiscono il contratto del piano di controllo per future funzionalità di elenco in sola lettura, onboarding, selezione dei modelli, alias e soppressione senza caricare il runtime del plugin.      |
| `modelPricing`                       | No           | `object`                     | Criterio di ricerca dei prezzi esterni di proprietà del provider. Usarlo per escludere i provider locali o self-hosted dai cataloghi dei prezzi remoti oppure per associare i riferimenti dei provider agli ID di catalogo OpenRouter/LiteLLM senza codificare rigidamente gli ID dei provider nel core. |
| `modelIdNormalization`               | No           | `object`                     | Pulizia degli alias e dei prefissi degli ID dei modelli di proprietà del provider, da eseguire prima del caricamento del runtime del provider.                                                                                                                                                    |
| `providerEndpoints`                  | No           | `object[]`                   | Metadati host/baseUrl degli endpoint di proprietà del manifest per le route dei provider che il core deve classificare prima del caricamento del runtime del provider.                                                                                                                            |
| `providerRequest`                    | No           | `object`                     | Metadati leggeri sulla famiglia del provider e sulla compatibilità delle richieste, utilizzati dai criteri generici per le richieste prima del caricamento del runtime del provider.                                                                                                              |
| `secretProviderIntegrations`         | No           | `Record<string, object>`     | Preimpostazioni dichiarative dei provider exec SecretRef che le interfacce di configurazione o installazione possono offrire senza codificare rigidamente nel core le integrazioni specifiche dei provider.                                                                                        |
| `cliBackends`                        | No           | `string[]`                   | ID dei backend di inferenza CLI di proprietà di questo plugin. Utilizzati per l'attivazione automatica all'avvio a partire da riferimenti di configurazione espliciti.                                                                                                                            |
| `syntheticAuthRefs`                  | No           | `string[]`                   | Riferimenti a provider o backend CLI per i quali deve essere verificato l'hook di autenticazione sintetico di proprietà del plugin durante il rilevamento a freddo dei modelli, prima del caricamento del runtime.                                                                                  |
| `nonSecretAuthMarkers`               | No           | `string[]`                   | Valori segnaposto delle chiavi API di proprietà del plugin incluso che rappresentano uno stato delle credenziali locale, OAuth o ambientale non segreto.                                                                                                                                          |
| `commandAliases`                     | No           | `object[]`                   | Nomi dei comandi di proprietà di questo plugin che devono produrre diagnostica della configurazione e della CLI consapevole del plugin prima del caricamento del runtime.                                                                                                                         |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`   | Metadati di compatibilità deprecati delle variabili d'ambiente per la ricerca dell'autenticazione e dello stato del provider. Per i nuovi plugin, preferire `setup.providers[].envVars`; OpenClaw continua a leggerli durante il periodo di deprecazione.                                            |
| `providerUsageAuthEnvVars`           | No           | `Record<string, string[]>`   | Credenziali del provider destinate esclusivamente all'utilizzo e alla fatturazione. OpenClaw usa questi nomi per il rilevamento dell'utilizzo e la rimozione dei segreti, ma mai per l'autenticazione dell'inferenza.                                                                               |
| `providerAuthAliases`                | No           | `Record<string, string>`     | ID dei provider che devono riutilizzare un altro ID provider per la ricerca dell'autenticazione, ad esempio un provider di programmazione che condivide la chiave API e i profili di autenticazione del provider di base.                                                                         |
| `channelEnvVars`                     | No           | `Record<string, string[]>`   | Metadati leggeri delle variabili d'ambiente del canale che OpenClaw può ispezionare senza caricare il codice del plugin. Usarli per la configurazione del canale o le interfacce di autenticazione basate su variabili d'ambiente che gli helper generici di avvio/configurazione devono rilevare.    |
| `providerAuthChoices`                | No           | `object[]`                   | Metadati leggeri delle opzioni di autenticazione per i selettori di onboarding, la risoluzione del provider preferito e il semplice collegamento dei flag della CLI.                                                                                                                              |
| `activation`                         | No           | `object`                     | Metadati leggeri del pianificatore di attivazione per il caricamento attivato da avvio, provider, comando, canale, route e funzionalità. Solo metadati; il runtime del plugin continua a gestire il comportamento effettivo.                                                                         |
| `setup`                              | No           | `object`                     | Descrittori leggeri di configurazione/onboarding che il rilevamento e le interfacce di configurazione possono ispezionare senza caricare il runtime del plugin.                                                                                                                                   |
| `qaRunners`                          | No           | `object[]`                   | Descrittori leggeri degli esecutori QA utilizzati dall'host condiviso `openclaw qa` prima del caricamento del runtime del plugin.                                                                                                                                                                 |
| `contracts`                          | No           | `object`                     | Istantanea statica della proprietà delle funzionalità per hook di autenticazione esterni, embedding, sintesi vocale, trascrizione in tempo reale, voce in tempo reale, comprensione dei contenuti multimediali, generazione di immagini/video/musica, recupero web, ricerca web, provider di worker, estrazione di documenti/contenuti web e proprietà degli strumenti. |
| `configContracts`                    | No           | `object`                     | Comportamento della configurazione di proprietà del manifest utilizzato dagli helper generici del core: rilevamento dei flag pericolosi, destinazioni della migrazione SecretRef e restringimento dei percorsi di configurazione precedenti. Consultare il [riferimento configContracts](#configcontracts-reference). |
| `mediaUnderstandingProviderMetadata` | No       | `Record<string, object>`     | Valori predefiniti leggeri per la comprensione dei contenuti multimediali per gli ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                                        |
| `imageGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadati di autenticazione leggeri per la generazione di immagini per gli ID provider dichiarati in `contracts.imageGenerationProviders`, inclusi gli alias di autenticazione di proprietà del provider e i controlli sull'URL di base.                                     |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadati di autenticazione leggeri per la generazione di video per gli ID provider dichiarati in `contracts.videoGenerationProviders`, inclusi gli alias di autenticazione di proprietà del provider e i controlli sull'URL di base.                                        |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadati di autenticazione leggeri per la generazione di musica per gli ID provider dichiarati in `contracts.musicGenerationProviders`, inclusi gli alias di autenticazione di proprietà del provider e i controlli sull'URL di base.                                       |
| `toolMetadata`                       | No       | `Record<string, object>`     | Metadati di disponibilità leggeri per gli strumenti di proprietà del plugin dichiarati in `contracts.tools`. Utilizzarli quando uno strumento non deve caricare il runtime in assenza di configurazione, variabili d'ambiente o prove di autenticazione.                      |
| `channelConfigs`                     | No       | `Record<string, object>`     | Metadati di configurazione dei canali di proprietà del manifest, integrati nelle superfici di individuazione e convalida prima del caricamento del runtime.                                                                                                                  |
| `skills`                             | No       | `string[]`                   | Directory delle Skills da caricare, relative alla radice del plugin.                                                                                                                                                                                                       |
| `name`                               | No       | `string`                     | Nome del plugin leggibile dagli utenti.                                                                                                                                                                                                                                    |
| `description`                        | No       | `string`                     | Breve riepilogo mostrato nelle superfici del plugin.                                                                                                                                                                                                                        |
| `catalog`                            | No       | `object`                     | Indicazioni di presentazione facoltative per le superfici del catalogo dei plugin. Questi metadati non installano, abilitano né concedono attendibilità a un plugin.                                                                                                        |
| `icon`                               | No       | `string`                     | URL HTTPS dell'immagine per le schede del marketplace/catalogo. ClawHub accetta qualsiasi URL `https://` valido e usa l'icona predefinita del plugin quando questo valore è omesso o non valido.                                                                             |
| `version`                            | No       | `string`                     | Versione informativa del plugin.                                                                                                                                                                                                                                           |
| `uiHints`                            | No       | `Record<string, object>`     | Etichette dell'interfaccia utente, segnaposto e indicazioni sulla sensibilità per i campi di configurazione.                                                                                                                                                                |

## Riferimento del catalogo

`catalog` fornisce indicazioni di visualizzazione facoltative ai browser dei plugin. Gli host possono ignorare queste indicazioni. Non installano né abilitano mai il plugin e non ne modificano il comportamento in fase di esecuzione o il livello di attendibilità.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Campo      | Tipo      | Significato                                                                        |
| ---------- | --------- | ---------------------------------------------------------------------------------- |
| `featured` | `boolean` | Indica se le superfici del catalogo devono mettere in evidenza questo plugin.       |
| `order`    | `number`  | Indicazione di visualizzazione crescente tra i plugin selezionati; i valori più bassi compaiono prima. |

## Riferimento dei metadati dei provider di generazione

I campi dei metadati dei provider di generazione descrivono segnali di autenticazione statici per i provider dichiarati nell'elenco `contracts.*GenerationProviders` corrispondente. OpenClaw legge questi campi prima del caricamento del runtime del provider, in modo che gli strumenti principali possano determinare se un provider di generazione è disponibile senza importare ogni plugin del provider.

Usa questi campi solo per informazioni dichiarative facili da verificare. Il trasporto, le trasformazioni delle richieste, l'aggiornamento dei token, la convalida delle credenziali e il comportamento effettivo di generazione rimangono nel runtime del plugin.

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

| Campo                  | Obbligatorio | Tipo       | Significato                                                                                                                                                             |
| ---------------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | No           | `string[]` | ID di provider aggiuntivi da considerare alias di autenticazione statici per il provider di generazione.                                                                |
| `authProviders`        | No           | `string[]` | ID dei provider i cui profili di autenticazione configurati devono essere considerati validi per questo provider di generazione.                                        |
| `configSignals`        | No           | `object[]` | Segnali di disponibilità semplici e basati solo sulla configurazione per provider locali o self-hosted configurabili senza profili di autenticazione o variabili d'ambiente. |
| `authSignals`          | No           | `object[]` | Segnali di autenticazione espliciti. Se presenti, sostituiscono l'insieme predefinito di segnali derivato dall'ID del provider, da `aliases` e da `authProviders`.         |
| `referenceAudioInputs` | No           | `boolean`  | Solo per la generazione video. Imposta su `true` quando il provider accetta risorse audio di riferimento; altrimenti `video_generate` nasconde i parametri audio di riferimento. |

Ogni voce di `configSignals` supporta:

| Campo            | Obbligatorio | Tipo       | Significato                                                                                                                                                                                                 |
| ---------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sì           | `string`   | Percorso puntato dell'oggetto di configurazione di proprietà del plugin da esaminare, ad esempio `plugins.entries.example.config`.                                                                           |
| `overlayPath`    | No           | `string`   | Percorso puntato all'interno della configurazione radice il cui oggetto deve sovrapporsi all'oggetto radice prima di valutare il segnale. Usalo per configurazioni specifiche di una funzionalità, come `image`, `video` o `music`. |
| `overlayMapPath` | No           | `string`   | Percorso puntato all'interno della configurazione radice i cui valori oggetto devono sovrapporsi singolarmente all'oggetto radice. Usalo per mappe di account denominati come `accounts`, in cui è sufficiente qualsiasi account configurato. |
| `required`       | No           | `string[]` | Percorsi puntati all'interno della configurazione effettiva che devono avere valori configurati. Le stringhe non devono essere vuote; gli oggetti e gli array non devono essere vuoti.                       |
| `requiredAny`    | No           | `string[]` | Percorsi puntati all'interno della configurazione effettiva, di cui almeno uno deve avere un valore configurato.                                                                                            |
| `mode`           | No           | `object`   | Vincolo facoltativo relativo a una modalità stringa all'interno della configurazione effettiva. Usalo quando la disponibilità basata solo sulla configurazione si applica a una sola modalità.                |

Ogni vincolo `mode` supporta:

| Campo        | Obbligatorio | Tipo       | Significato                                                                                                      |
| ------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `path`       | No           | `string`   | Percorso puntato all'interno della configurazione effettiva. Il valore predefinito è `mode`.                      |
| `default`    | No           | `string`   | Valore della modalità da usare quando la configurazione omette il percorso.                                       |
| `allowed`    | No           | `string[]` | Se presente, il segnale è valido solo quando la modalità effettiva corrisponde a uno di questi valori.            |
| `disallowed` | No           | `string[]` | Se presente, il segnale non è valido quando la modalità effettiva corrisponde a uno di questi valori.             |

Ogni voce di `authSignals` supporta:

| Campo             | Obbligatorio | Tipo     | Significato                                                                                                                                                                      |
| ----------------- | ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì           | `string` | ID del provider da verificare nei profili di autenticazione configurati.                                                                                                         |
| `providerBaseUrl` | No           | `object` | Vincolo facoltativo che considera valido il segnale solo quando il provider configurato a cui si fa riferimento usa un URL di base consentito. Usalo quando un alias di autenticazione è valido solo per determinate API. |

Ogni vincolo `providerBaseUrl` supporta:

| Campo             | Obbligatorio | Tipo       | Significato                                                                                                                                                                           |
| ----------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì           | `string`   | ID della configurazione del provider di cui verificare `baseUrl`.                                                                                                                     |
| `defaultBaseUrl`  | No           | `string`   | URL di base da presupporre quando la configurazione del provider omette `baseUrl`.                                                                                                    |
| `allowedBaseUrls` | Sì           | `string[]` | URL di base consentiti per questo segnale di autenticazione. Il segnale viene ignorato quando l'URL di base configurato o predefinito non corrisponde a uno di questi valori normalizzati. |

## Riferimento dei metadati degli strumenti

`toolMetadata` usa le stesse strutture `configSignals` e `authSignals` dei metadati dei provider di generazione, indicizzate per nome dello strumento. `contracts.tools` dichiara la proprietà. `toolMetadata` dichiara semplici evidenze di disponibilità, affinché OpenClaw possa evitare di importare il runtime di un plugin solo per ottenere `null` dalla relativa factory dello strumento.

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

Le voci di `toolMetadata` accettano inoltre `optional` (contrassegna lo strumento come non obbligatorio per l'attivazione del plugin) e `replaySafe` (contrassegna l'esecuzione dello strumento come ripetibile in sicurezza dopo un turno incompleto del modello), oltre ai campi condivisi `configSignals`/`authSignals` descritti sopra.

Se uno strumento non dispone di `toolMetadata`, OpenClaw conserva il comportamento esistente e carica il plugin proprietario quando il contratto dello strumento è conforme ai criteri. Per gli strumenti nei percorsi critici la cui factory dipende dall'autenticazione o dalla configurazione, gli autori dei plugin devono dichiarare `toolMetadata` anziché costringere il nucleo a importare il runtime per interrogarlo.

## Riferimento di providerAuthChoices

Ogni voce di `providerAuthChoices` descrive una scelta di onboarding o autenticazione. OpenClaw la legge prima del caricamento del runtime del provider. Gli elenchi di configurazione dei provider usano queste scelte del manifesto, le scelte di configurazione derivate dai descrittori e i metadati del catalogo di installazione senza caricare il runtime del provider.

| Campo                 | Obbligatorio | Tipo                                                                  | Significato                                                                                                                     |
| --------------------- | ------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                                              | ID del provider a cui appartiene questa scelta.                                                                                  |
| `method`              | Sì           | `string`                                                              | ID del metodo di autenticazione a cui inoltrare la richiesta.                                                                    |
| `choiceId`            | Sì           | `string`                                                              | ID stabile della scelta di autenticazione usato dai flussi di onboarding e della CLI.                                           |
| `choiceLabel`         | No           | `string`                                                              | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come valore di ripiego.                                        |
| `choiceHint`          | No           | `string`                                                              | Breve testo di aiuto per il selettore.                                                                                           |
| `assistantPriority`   | No           | `number`                                                              | I valori inferiori vengono ordinati per primi nei selettori interattivi gestiti dall'assistente.                                 |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                                        | Nasconde la scelta dai selettori dell'assistente, consentendone comunque la selezione manuale tramite CLI.                       |
| `deprecatedChoiceIds` | No           | `string[]`                                                            | ID di scelta obsoleti che devono reindirizzare gli utenti a questa scelta sostitutiva.                                           |
| `groupId`             | No           | `string`                                                              | ID facoltativo del gruppo per raggruppare scelte correlate.                                                                      |
| `groupLabel`          | No           | `string`                                                              | Etichetta visibile all'utente per tale gruppo.                                                                                    |
| `groupHint`           | No           | `string`                                                              | Breve testo di aiuto per il gruppo.                                                                                              |
| `onboardingFeatured`  | No           | `boolean`                                                             | Mostra questo gruppo nel livello in evidenza del selettore interattivo di onboarding, prima della voce "More...".                |
| `optionKey`           | No           | `string`                                                              | Chiave interna dell'opzione per semplici flussi di autenticazione con un unico flag.                                             |
| `cliFlag`             | No           | `string`                                                              | Nome del flag della CLI, ad esempio `--openrouter-api-key`.                                                                      |
| `cliOption`           | No           | `string`                                                              | Forma completa dell'opzione della CLI, ad esempio `--openrouter-api-key <key>`.                                                  |
| `cliDescription`      | No           | `string`                                                              | Descrizione usata nella guida della CLI.                                                                                          |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Superfici di onboarding in cui deve comparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`.            |

## Riferimento per commandAliases

Usa `commandAliases` quando un Plugin possiede il nome di un comando di runtime che gli utenti potrebbero inserire per errore in `plugins.allow` o tentare di eseguire come comando radice della CLI. OpenClaw usa questi metadati per la diagnostica senza importare il codice di runtime del Plugin.

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

| Campo        | Obbligatorio | Tipo              | Significato                                                                                   |
| ------------ | ------------ | ----------------- | --------------------------------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando appartenente a questo Plugin.                                                |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat anziché come comando radice della CLI.     |
| `cliCommand` | No           | `string`          | Comando radice della CLI correlato da suggerire per le operazioni della CLI, se disponibile.  |

## Riferimento per activation

Usa `activation` quando il Plugin può dichiarare in modo economico quali eventi del piano di controllo devono includerlo in un piano di attivazione/caricamento.

Questo blocco contiene metadati del pianificatore, non è un'API del ciclo di vita. Non registra comportamenti di runtime, non sostituisce `register(...)` e non garantisce che il codice del Plugin sia già stato eseguito. Il pianificatore dell'attivazione usa questi campi per restringere l'insieme dei Plugin candidati prima di ricorrere ai metadati di proprietà esistenti del manifesto, come `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e gli hook.

Preferisci i metadati più specifici che descrivono già la proprietà. Usa `providers`, `channels`, `commandAliases`, i descrittori di configurazione o `contracts` quando tali campi esprimono la relazione. Usa `activation` per ulteriori suggerimenti al pianificatore che non possono essere rappresentati da tali campi di proprietà. Usa `cliBackends` di primo livello per gli alias di runtime della CLI come `claude-cli`, `my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` serve solo per gli ID degli harness agente incorporati che non dispongono già di un campo di proprietà.

Ogni Plugin deve impostare intenzionalmente `activation.onStartup`. Impostalo su `true` solo quando il Plugin deve essere eseguito durante l'avvio del Gateway. Impostalo su `false` quando il Plugin è inattivo all'avvio e deve essere caricato solo tramite trigger più specifici. L'omissione di `onStartup` non comporta più il caricamento implicito del Plugin all'avvio; usa metadati di attivazione espliciti per l'avvio, il canale, la configurazione, l'harness agente, la memoria o altri trigger di attivazione più specifici.

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

| Campo              | Obbligatorio | Tipo                                                 | Significato                                                                                                                                                                                                   |
| ------------------ | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No           | `boolean`                                            | Attivazione esplicita all'avvio del Gateway. Ogni Plugin deve impostarla. `true` importa il Plugin durante l'avvio; `false` ne ritarda il caricamento all'avvio, salvo che un altro trigger corrispondente lo richieda. |
| `onProviders`      | No           | `string[]`                                           | ID dei provider che devono includere questo Plugin nei piani di attivazione/caricamento.                                                                                                                       |
| `onAgentHarnesses` | No           | `string[]`                                           | ID di runtime degli harness agente incorporati che devono includere questo Plugin nei piani di attivazione/caricamento. Usa `cliBackends` di primo livello per gli alias dei backend della CLI.                 |
| `onCommands`       | No           | `string[]`                                           | ID dei comandi che devono includere questo Plugin nei piani di attivazione/caricamento.                                                                                                                        |
| `onChannels`       | No           | `string[]`                                           | ID dei canali che devono includere questo Plugin nei piani di attivazione/caricamento.                                                                                                                         |
| `onRoutes`         | No           | `string[]`                                           | Tipi di route che devono includere questo Plugin nei piani di attivazione/caricamento.                                                                                                                         |
| `onConfigPaths`    | No           | `string[]`                                           | Percorsi di configurazione relativi alla radice che devono includere questo Plugin nei piani di avvio/caricamento quando il percorso è presente e non è esplicitamente disabilitato.                           |
| `onCapabilities`   | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicazioni generali sulle funzionalità usate dalla pianificazione dell'attivazione del piano di controllo. Quando possibile, preferisci campi più specifici.                                                   |

Utilizzi attivi correnti:

- La pianificazione dell'avvio del Gateway usa `activation.onStartup` per l'importazione esplicita all'avvio.
- La pianificazione della CLI attivata da comandi ricorre ai valori legacy `commandAliases[].cliCommand` o `commandAliases[].name`.
- La pianificazione dell'avvio del runtime agente usa `activation.onAgentHarnesses` per gli harness incorporati e `cliBackends[]` di primo livello per gli alias di runtime della CLI.
- La pianificazione della configurazione o dei canali attivata da un canale ricorre alla proprietà legacy `channels[]` quando mancano metadati espliciti di attivazione del canale.
- La pianificazione dei Plugin all'avvio usa `activation.onConfigPaths` per le superfici di configurazione radice non relative ai canali, come il blocco `browser` del Plugin browser incluso.
- La pianificazione della configurazione o del runtime attivata da un provider ricorre alla proprietà legacy `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti di attivazione del provider.

La diagnostica del pianificatore può distinguere i suggerimenti di attivazione espliciti dal ripiego sulla proprietà del manifesto. Ad esempio, `activation-command-hint` indica una corrispondenza con `activation.onCommands`, mentre `manifest-command-alias` indica che il pianificatore ha usato invece la proprietà `commandAliases`. Queste etichette di motivazione sono destinate alla diagnostica dell'host e ai test; gli autori dei Plugin devono continuare a dichiarare i metadati che descrivono meglio la proprietà.

## Riferimento per qaRunners

Usa `qaRunners` quando un Plugin fornisce uno o più runner di trasporto sotto
la radice condivisa `openclaw qa`. Mantieni questi metadati leggeri e statici; il runtime
del Plugin continua a gestire l'effettiva registrazione della CLI tramite una superficie
leggera `runtime-api.ts` che esporta le corrispondenti `qaRunnerCliRegistrations`. Un
`adapterFactory` facoltativo espone il trasporto agli scenari QA condivisi senza
modificare il runner del comando registrato.

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

| Campo         | Obbligatorio | Tipo     | Significato                                                                                   |
| ------------- | ------------ | -------- | --------------------------------------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, ad esempio `matrix`.                                |
| `description` | No           | `string` | Testo di guida di ripiego usato quando l'host condiviso necessita di un comando segnaposto.   |

L'id `adapterFactory` deve corrispondere a `commandName`. Non esportare registrazioni
per comandi assenti dal manifest.

## riferimento setup

Usa `setup` quando le superfici di configurazione iniziale e onboarding necessitano di metadati economici di proprietà del plugin prima del caricamento del runtime.

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

`cliBackends` di primo livello rimane valido e continua a descrivere i backend di inferenza della CLI. `setup.cliBackends` è la superficie dei descrittori specifica della configurazione iniziale per i flussi del piano di controllo e di configurazione iniziale che devono rimanere basati esclusivamente sui metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di ricerca preferita, basata anzitutto sui descrittori, per il rilevamento durante la configurazione iniziale. Se il descrittore si limita a restringere il plugin candidato e la configurazione iniziale necessita ancora di hook di runtime più completi in questa fase, imposta `requiresRuntime: true` e mantieni `setup-api` come percorso di esecuzione di ripiego.

OpenClaw include inoltre `setup.providers[].envVars` nelle ricerche generiche delle variabili di ambiente e di autenticazione del provider. `providerAuthEnvVars` rimane supportato tramite un adattatore di compatibilità durante il periodo di deprecazione, ma i plugin non inclusi nel bundle che continuano a utilizzarlo ricevono una diagnostica del manifest. I nuovi plugin devono inserire i metadati delle variabili di ambiente per configurazione iniziale e stato in `setup.providers[].envVars`.

Usa `providerUsageAuthEnvVars` quando una credenziale a livello di fatturazione o organizzazione deve attivare `resolveUsageAuth` senza diventare una credenziale di inferenza. Questi nomi vengono inclusi nel blocco dei file dotenv dell'area di lavoro, nella rimozione dai processi figli ACP, nel filtraggio dei segreti della sandbox e nella rimozione generale dei segreti. Il runtime del provider continua a leggere e classificare il valore all'interno di `resolveUsageAuth`.

OpenClaw può anche derivare semplici opzioni di configurazione iniziale da `setup.providers[].authMethods` quando non è disponibile alcuna voce di configurazione iniziale o quando `setup.requiresRuntime: false` dichiara non necessario il runtime di configurazione iniziale. Le voci esplicite di `providerAuthChoices` rimangono preferite per etichette personalizzate, flag della CLI, ambito dell'onboarding e metadati dell'assistente.

Imposta `requiresRuntime: false` solo quando tali descrittori sono sufficienti per la superficie di configurazione iniziale. OpenClaw considera il valore esplicito `false` un contratto basato esclusivamente sui descrittori e non esegue `setup-api` né `openclaw.setupEntry` per la ricerca della configurazione iniziale. Se un plugin basato esclusivamente sui descrittori distribuisce comunque una di queste voci del runtime di configurazione iniziale, OpenClaw segnala una diagnostica aggiuntiva e continua a ignorarla. L'omissione di `requiresRuntime` mantiene il comportamento di ripiego precedente, affinché i plugin esistenti che hanno aggiunto descrittori senza il flag non smettano di funzionare.

Poiché la ricerca della configurazione iniziale può eseguire codice `setup-api` di proprietà del plugin, i valori normalizzati di `setup.providers[].id` e `setup.cliBackends[]` devono rimanere univoci tra i plugin rilevati. In caso di proprietà ambigua, l'operazione non procede anziché scegliere un vincitore in base all'ordine di rilevamento.

Quando il runtime di configurazione iniziale viene eseguito, le diagnostiche del registro di configurazione iniziale segnalano una divergenza dei descrittori se `setup-api` registra un provider o un backend della CLI che i descrittori del manifest non dichiarano, oppure se un descrittore non ha una registrazione runtime corrispondente. Queste diagnostiche sono aggiuntive e non rifiutano i plugin precedenti.

### riferimento setup.providers

| Campo          | Obbligatorio | Tipo       | Significato                                                                                                      |
| -------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `id`           | Sì           | `string`   | ID del provider esposto durante la configurazione iniziale o l'onboarding. Mantieni globalmente univoci gli ID normalizzati. |
| `authMethods`  | No           | `string[]` | ID dei metodi di configurazione iniziale/autenticazione supportati dal provider senza caricare l'intero runtime. |
| `envVars`      | No           | `string[]` | Variabili di ambiente che le superfici generiche di configurazione iniziale/stato possono verificare prima del caricamento del runtime del plugin. |
| `authEvidence` | No           | `object[]` | Verifiche economiche delle prove di autenticazione locali per provider che possono autenticarsi tramite indicatori non segreti. |

`authEvidence` è destinato agli indicatori di credenziali locali di proprietà del provider che possono essere verificati senza caricare codice runtime. Queste verifiche devono rimanere economiche e locali: nessuna chiamata di rete, nessuna lettura dal portachiavi o da gestori di segreti, nessun comando di shell e nessuna verifica tramite API del provider.

Voci di prova supportate:

| Campo              | Obbligatorio | Tipo       | Significato                                                                                                               |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `type`             | Sì           | `string`   | Attualmente `local-file-with-env`.                                                                                        |
| `fileEnvVar`       | No           | `string`   | Variabile di ambiente contenente un percorso esplicito del file delle credenziali.                                       |
| `fallbackPaths`    | No           | `string[]` | Percorsi locali dei file delle credenziali verificati quando `fileEnvVar` è assente o vuota. Supporta `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | No           | `string[]` | Almeno una delle variabili di ambiente elencate deve essere non vuota affinché la prova sia valida.                       |
| `requiresAllEnv`   | No           | `string[]` | Tutte le variabili di ambiente elencate devono essere non vuote affinché la prova sia valida.                             |
| `credentialMarker` | Sì           | `string`   | Indicatore non segreto restituito quando la prova è presente.                                                             |
| `source`           | No           | `string`   | Etichetta della fonte visibile all'utente per l'output di autenticazione/stato.                                           |

### campi setup

| Campo              | Obbligatorio | Tipo       | Significato                                                                                                      |
| ------------------ | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di configurazione iniziale dei provider esposti durante la configurazione iniziale e l'onboarding.    |
| `cliBackends`      | No           | `string[]` | ID dei backend usati durante la configurazione iniziale per la ricerca basata anzitutto sui descrittori. Mantieni globalmente univoci gli ID normalizzati. |
| `configMigrations` | No           | `string[]` | ID delle migrazioni della configurazione di proprietà della superficie di configurazione iniziale di questo plugin. |
| `requiresRuntime`  | No           | `boolean`  | Indica se la configurazione iniziale necessita ancora dell'esecuzione di `setup-api` dopo la ricerca dei descrittori. |

## riferimento uiHints

`uiHints` è una mappa che associa i nomi dei campi di configurazione a piccoli suggerimenti di rendering. Le chiavi possono usare punti per i campi di configurazione annidati, ma nessun segmento del percorso può essere `__proto__`, `constructor` o `prototype`; la configurazione iniziale rifiuta tali nomi.

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

| Campo         | Tipo       | Significato                                      |
| ------------- | ---------- | ------------------------------------------------ |
| `label`       | `string`   | Etichetta del campo visibile all'utente.         |
| `help`        | `string`   | Breve testo di supporto.                         |
| `tags`        | `string[]` | Tag facoltativi dell'interfaccia utente.         |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.             |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile.  |
| `placeholder` | `string`   | Testo segnaposto per i campi di input del modulo. |

## riferimento contracts

Usa `contracts` solo per metadati statici sulla proprietà delle funzionalità che OpenClaw può leggere senza importare il runtime del plugin.

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
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Ogni elenco è facoltativo:

| Campo                            | Tipo       | Significato                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | ID delle factory di estensioni del server applicativo Codex, attualmente `codex-app-server`.                                         |
| `agentToolResultMiddleware`      | `string[]` | ID dei runtime per i quali questo plugin può registrare middleware per i risultati degli strumenti.                                 |
| `trustedToolPolicies`            | `string[]` | ID locali del plugin delle policy attendibili pre-strumento che un plugin installato può registrare. I plugin inclusi possono registrare policy senza questo campo. |
| `externalAuthProviders`          | `string[]` | ID dei provider di cui questo plugin gestisce l'hook dei profili di autenticazione esterna.                                         |
| `embeddingProviders`             | `string[]` | ID dei provider generici di embedding gestiti da questo plugin per l'uso riutilizzabile di embedding vettoriali, inclusa la memoria. |
| `speechProviders`                | `string[]` | ID dei provider vocali gestiti da questo plugin.                                                                                    |
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione in tempo reale gestiti da questo plugin.                                                            |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider vocali in tempo reale gestiti da questo plugin.                                                                     |
| `memoryEmbeddingProviders`       | `string[]` | ID deprecati dei provider di embedding specifici per la memoria gestiti da questo plugin.                                            |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider di comprensione dei contenuti multimediali gestiti da questo plugin.                                                |
| `transcriptSourceProviders`      | `string[]` | ID dei provider delle sorgenti di trascrizione gestiti da questo plugin.                                                            |
| `documentExtractors`             | `string[]` | ID dei provider di estrazione di documenti (ad esempio PDF) gestiti da questo plugin.                                                |
| `imageGenerationProviders`       | `string[]` | ID dei provider di generazione di immagini gestiti da questo plugin.                                                                |
| `videoGenerationProviders`       | `string[]` | ID dei provider di generazione di video gestiti da questo plugin.                                                                   |
| `musicGenerationProviders`       | `string[]` | ID dei provider di generazione musicale gestiti da questo plugin.                                                                   |
| `webContentExtractors`           | `string[]` | ID dei provider di estrazione dei contenuti delle pagine web gestiti da questo plugin.                                               |
| `webFetchProviders`              | `string[]` | ID dei provider per il recupero dal web gestiti da questo plugin.                                                                   |
| `webSearchProviders`             | `string[]` | ID dei provider di ricerca sul web gestiti da questo plugin.                                                                        |
| `workerProviders`                | `string[]` | ID dei provider di worker cloud gestiti da questo plugin per il provisioning e il ciclo di vita dei lease basato sui profili.       |
| `usageProviders`                 | `string[]` | ID dei provider di cui questo plugin gestisce gli hook di autenticazione dell'utilizzo e delle istantanee di utilizzo.               |
| `migrationProviders`             | `string[]` | ID dei provider di importazione gestiti da questo plugin per `openclaw migrate`.                                                     |
| `gatewayMethodDispatch`          | `string[]` | Autorizzazione riservata alle route HTTP autenticate dei plugin che inoltrano internamente i metodi del Gateway.                     |
| `tools`                          | `string[]` | Nomi degli strumenti dell'agente gestiti da questo plugin.                                                                          |

`contracts.embeddedExtensionFactories` viene mantenuto per le factory di estensioni incluse destinate esclusivamente al server applicativo Codex. Le trasformazioni incluse dei risultati degli strumenti devono invece dichiarare `contracts.agentToolResultMiddleware` e registrarsi con `api.registerAgentToolResultMiddleware(...)`. I plugin installati possono usare lo stesso punto di integrazione del middleware solo quando sono abilitati esplicitamente e solo per i runtime dichiarati in `contracts.agentToolResultMiddleware`.

I plugin installati che necessitano del livello di policy attendibili pre-strumento dell'host devono dichiarare ogni ID locale registrato in `contracts.trustedToolPolicies` ed essere abilitati esplicitamente. I plugin inclusi mantengono il percorso esistente delle policy attendibili, ma i plugin installati con ID di policy non dichiarati vengono rifiutati prima della registrazione. Gli ID delle policy sono limitati all'ambito del plugin che li registra, pertanto due plugin possono entrambi dichiarare e registrare `workflow-budget`; un singolo plugin non può registrare due volte lo stesso ID locale.

Le registrazioni `api.registerTool(...)` in fase di runtime devono corrispondere a `contracts.tools`. Il rilevamento degli strumenti usa questo elenco per caricare soltanto i runtime dei plugin che possono gestire gli strumenti richiesti.

I plugin provider che implementano `resolveExternalAuthProfiles` devono dichiarare `contracts.externalAuthProviders`; gli hook di autenticazione esterna non dichiarati vengono ignorati.

I plugin provider che implementano sia `resolveUsageAuth` sia `fetchUsageSnapshot` devono dichiarare in `contracts.usageProviders` ogni ID provider rilevato automaticamente. Il rilevamento dell'utilizzo legge questo contratto prima di caricare il codice di runtime, quindi verifica entrambi gli hook dopo aver caricato soltanto i gestori dichiarati.

I provider generici di embedding devono dichiarare `contracts.embeddingProviders` per ogni adattatore registrato con `api.registerEmbeddingProvider(...)`. Usare il contratto generico per la generazione riutilizzabile di vettori, inclusi i provider utilizzati dalla ricerca nella memoria. `contracts.memoryEmbeddingProviders` è una compatibilità deprecata specifica per la memoria e viene mantenuta solo mentre i provider esistenti migrano al punto di integrazione generico dei provider di embedding.

I provider di worker devono dichiarare in `contracts.workerProviders` ogni ID registrato tramite `api.registerWorkerProvider(...)`. Il core rende persistente l'intento durevole prima di chiamare `provision`; i provider convalidano le proprie impostazioni prima dell'allocazione esterna e le chiamate ripetute con lo stesso ID operazione devono adottare lo stesso lease. Il core rende persistente anche l'istantanea delle impostazioni convalidate e la passa insieme a `leaseId` a `inspect({ leaseId, profile })` e `destroy({ leaseId, profile })`, anche dopo che il profilo indicato è stato modificato o rimosso. La distruzione è idempotente, l'ispezione restituisce l'unione chiusa degli stati `active` / `destroyed` / `unknown` e il materiale della chiave privata SSH viene referenziato esclusivamente tramite `SecretRef`. Gli endpoint SSH sottoposti a provisioning devono includere anche un `hostKey` pubblico proveniente da un output di provisioning attendibile, nel formato esatto `algorithm base64`, senza nome host né commento, affinché il core possa vincolare l'host prima della connessione. I provider che generano riferimenti dinamici alle identità possono implementare il metodo autorevole `resolveSshIdentity({ leaseId, profile, keyRef })`; i provider che ne sono privi usano il risolutore generico dei segreti del core. Un risultato autorevole `unknown` rende orfano un record locale attivo; dopo una richiesta di distruzione persistente, ne conferma lo smantellamento.

`contracts.gatewayMethodDispatch` attualmente accetta `"authenticated-request"`. È un controllo di igiene dell'API per le route HTTP native dei plugin che inoltrano intenzionalmente all'interno del processo i metodi del piano di controllo del Gateway, non una sandbox contro plugin nativi dannosi. Usarlo soltanto per superfici incluse o destinate agli operatori sottoposte a revisione rigorosa e che richiedono già l'autenticazione HTTP del Gateway. Una route autorizzata rimane raggiungibile mentre l'ammissione del lavoro di livello principale del Gateway è chiusa solo se dichiara anche `auth: "gateway"` e il valore specifico della route `gatewayRuntimeScopeSurface: "trusted-operator"`; le normali route adiacenti dello stesso plugin restano soggette al limite di ammissione. In questo modo, lo stato di sospensione e la ripresa rimangono raggiungibili senza concedere all'intero plugin la possibilità di aggirare l'ammissione. Mantenere limitate, al di fuori dell'inoltro, l'analisi e la definizione della risposta; il lavoro sostanziale o che modifica lo stato deve passare attraverso l'inoltro dei metodi del Gateway, che gestisce l'applicazione delle regole di ammissione e di ambito.

## Riferimento per configContracts

Usare `configContracts` per il comportamento della configurazione gestito dal manifesto, necessario agli helper generici del core senza importare il runtime del plugin: rilevamento dei flag pericolosi, destinazioni della migrazione di SecretRef e restrizione dei percorsi di configurazione legacy.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Campo                         | Obbligatorio | Tipo       | Significato                                                                                                                                                                                                                          |
| ----------------------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | No           | `string[]` | Percorsi di configurazione relativi alla radice che indicano che potrebbero essere applicabili le migrazioni di compatibilità di questo plugin durante la configurazione. Consente alle letture generiche della configurazione di runtime di ignorare tutte le superfici di configurazione dei plugin quando la configurazione non fa mai riferimento al plugin. |
| `compatibilityRuntimePaths`   | No           | `string[]` | Percorsi di compatibilità relativi alla radice che questo plugin può gestire durante il runtime prima che il codice del plugin sia completamente attivato. Usarlo per le superfici legacy che devono restringere gli insiemi dei candidati inclusi senza importare il runtime di ogni plugin compatibile. |
| `dangerousFlags`              | No           | `object[]` | Valori letterali di configurazione che `openclaw doctor` deve segnalare come non sicuri o pericolosi quando sono abilitati. Vedere sotto. |
| `secretInputs`                | No           | `object`   | Percorsi di configurazione sotto `plugins.entries.<id>.config` che il registro delle destinazioni della migrazione e del controllo di SecretRef deve trattare come stringhe con struttura di segreto. Vedere sotto. |

Ogni voce di `dangerousFlags` supporta:

| Campo    | Obbligatorio | Tipo                                  | Significato                                                                                                       |
| -------- | ------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sì           | `string`                              | Percorso di configurazione separato da punti e relativo a `plugins.entries.<id>.config`. Supporta caratteri jolly `*` per i segmenti di mappe e array. |
| `equals` | Sì           | `string \| number \| boolean \| null` | Valore letterale esatto che contrassegna questo valore di configurazione come pericoloso.                          |

`secretInputs` supporta:

| Campo                   | Obbligatorio | Tipo       | Significato                                                                                                                                                                                                                 |
| ----------------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | No           | `boolean`  | Sostituisce l'abilitazione predefinita del Plugin incluso quando si determina se questa superficie SecretRef è attiva. Usarlo quando il Plugin è incluso, ma la superficie deve rimanere inattiva finché non viene abilitata esplicitamente nella configurazione. |
| `paths`                 | Sì           | `object[]` | Percorsi di configurazione con struttura di segreto, ciascuno con `path` (separato da punti, relativo a `plugins.entries.<id>.config`, supporta i caratteri jolly `*`) e `expected` facoltativo (attualmente solo `"string"`).                            |

## Riferimento di mediaUnderstandingProviderMetadata

Usare `mediaUnderstandingProviderMetadata` quando un provider per la comprensione dei contenuti multimediali dispone di modelli predefiniti, di una priorità di ripiego per l'autenticazione automatica o di supporto nativo per i documenti, necessari agli helper generici del core prima del caricamento del runtime. Le chiavi devono essere dichiarate anche in `contracts.mediaUnderstandingProviders`.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Ogni voce del provider può includere:

| Campo                  | Tipo                                                             | Significato                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Funzionalità multimediali esposte da questo provider.                                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | Associazioni predefinite tra funzionalità e modelli, usate quando la configurazione non specifica un modello.                            |
| `autoPriority`         | `Record<string, number>`                                         | I numeri più bassi vengono ordinati prima per il ripiego automatico tra provider basato sulle credenziali.                              |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Input di documenti nativi supportati dal provider.                                                                                       |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Sostituzioni dei modelli per tipo di documento. Impostare `image: false` per disabilitare l'estrazione basata su immagini per quel tipo di documento. |

## Riferimento di channelConfigs

Usare `channelConfigs` quando un Plugin di canale necessita di metadati di configurazione leggeri prima del caricamento del runtime. Il rilevamento in sola lettura della configurazione e dello stato del canale può usare direttamente questi metadati per i canali esterni configurati quando non è disponibile una voce di configurazione iniziale oppure quando `setup.requiresRuntime: false` dichiara che il runtime non è necessario per la configurazione iniziale.

`channelConfigs` è un metadato del manifesto del Plugin, non una nuova sezione di configurazione utente di primo livello. Gli utenti continuano a configurare le istanze dei canali in `channels.<channel-id>`. OpenClaw legge i metadati del manifesto per determinare quale Plugin è proprietario del canale configurato prima che venga eseguito il codice di runtime del Plugin.

Per un Plugin di canale, `configSchema` e `channelConfigs` descrivono percorsi diversi:

- `configSchema` convalida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` convalida `channels.<channel-id>`

I Plugin non inclusi che dichiarano `channels[]` devono dichiarare anche le voci `channelConfigs` corrispondenti. In loro assenza, OpenClaw può comunque caricare il Plugin, ma lo schema di configurazione nei percorsi a freddo, la configurazione iniziale e le superfici dell'interfaccia di controllo non possono conoscere la struttura delle opzioni di proprietà del canale finché non viene eseguito il runtime del Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e `nativeSkillsAutoEnabled` possono dichiarare valori predefiniti statici `auto` per i controlli della configurazione dei comandi eseguiti prima del caricamento del runtime del canale. I canali inclusi possono pubblicare gli stessi valori predefiniti anche tramite `package.json#openclaw.channel.commands`, insieme agli altri metadati del catalogo dei canali di proprietà del pacchetto.

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

Ogni voce del canale può includere:

| Campo         | Tipo                     | Significato                                                                                                                              |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce dichiarata della configurazione del canale.                                  |
| `uiHints`     | `Record<string, object>` | Etichette, segnaposto e indicazioni facoltative sui dati sensibili per la sezione di configurazione del canale.                           |
| `label`       | `string`                 | Etichetta del canale integrata nelle superfici di selezione e ispezione quando i metadati del runtime non sono pronti.                    |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e del catalogo.                                                               |
| `commands`    | `object`                 | Valori predefiniti automatici statici per i comandi nativi e le skill native, destinati ai controlli della configurazione prima del runtime. |
| `preferOver`  | `string[]`               | ID di Plugin obsoleti o con priorità inferiore che questo canale deve superare nelle superfici di selezione.                             |

### Sostituzione di un altro Plugin di canale

Usare `preferOver` quando il proprio Plugin è il proprietario preferito per un ID canale che può essere fornito anche da un altro Plugin. I casi comuni includono un ID Plugin rinominato, un Plugin autonomo che sostituisce un Plugin incluso oppure un fork mantenuto che conserva lo stesso ID canale per garantire la compatibilità della configurazione.

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

Quando `channels.chat` è configurato, OpenClaw considera sia l'ID canale sia l'ID Plugin preferito. Se il Plugin con priorità inferiore è stato selezionato solo perché è incluso o abilitato per impostazione predefinita, OpenClaw lo disabilita nella configurazione effettiva del runtime, affinché un solo Plugin sia proprietario del canale e dei relativi strumenti. La selezione esplicita dell'utente continua ad avere la precedenza: se l'utente abilita esplicitamente entrambi i Plugin (tramite `plugins.allow` o una configurazione sostanziale di `plugins.entries`), OpenClaw mantiene tale scelta e segnala la duplicazione dei canali o degli strumenti, anziché modificare silenziosamente l'insieme di Plugin richiesto.

Limitare `preferOver` agli ID dei Plugin che possono effettivamente fornire lo stesso canale. Non è un campo di priorità generico e non rinomina le chiavi della configurazione utente.

## Riferimento di modelSupport

Usare `modelSupport` quando OpenClaw deve dedurre il Plugin del provider da ID modello abbreviati come `gpt-5.6-sol` o `claude-sonnet-4.6` prima del caricamento del runtime del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica il seguente ordine di precedenza:

- i riferimenti espliciti `provider/model` usano i metadati del manifesto `providers` del proprietario
- `modelPatterns` ha la precedenza su `modelPrefixes`
- se corrispondono sia un Plugin non incluso sia un Plugin incluso, prevale il Plugin non incluso
- le ambiguità rimanenti vengono ignorate finché l'utente o la configurazione non specifica un provider

Campi:

| Campo           | Tipo       | Significato                                                                                                          |
| --------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati tramite `startsWith` con gli ID modello abbreviati.                                             |
| `modelPatterns` | `string[]` | Espressioni regolari confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo.           |

Le voci `modelPatterns` vengono compilate tramite `compileSafeRegex`, che rifiuta i modelli contenenti ripetizioni annidate, ad esempio `(a+)+$`. I modelli che non superano il controllo di sicurezza vengono ignorati silenziosamente, come le espressioni regolari sintatticamente non valide. Mantenere i modelli semplici ed evitare quantificatori annidati.

## Riferimento di modelCatalog

Usare `modelCatalog` quando OpenClaw deve conoscere i metadati dei modelli del provider prima di caricare il runtime del Plugin. Questa è la fonte di proprietà del manifesto per le righe fisse del catalogo, gli alias dei provider, le regole di esclusione e la modalità di rilevamento. L'aggiornamento durante il runtime resta di competenza del codice di runtime del provider, ma il manifesto indica al core quando il runtime è necessario.

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

| Campo            | Tipo                                                     | Significato                                                                                                           |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Righe del catalogo per gli ID dei provider di proprietà di questo plugin. Le chiavi devono comparire anche in `providers` al livello superiore. |
| `aliases`        | `Record<string, object>`                                 | Alias dei provider che devono risolversi in un provider di proprietà del plugin per la pianificazione del catalogo o delle soppressioni. |
| `suppressions`   | `object[]`                                               | Righe di modelli provenienti da un'altra origine che questo plugin sopprime per un motivo specifico del provider.      |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se il catalogo del provider può essere letto dai metadati del manifesto, aggiornato nella cache o richiede il runtime. |
| `runtimeAugment` | `boolean`                                                | Impostare su `true` solo quando il runtime del provider deve aggiungere righe al catalogo dopo la pianificazione del manifesto o della configurazione. |

`aliases` partecipa alla ricerca della proprietà del provider per la pianificazione del catalogo dei modelli. Le destinazioni degli alias devono essere provider al livello superiore di proprietà dello stesso plugin. Quando un elenco filtrato per provider usa un alias, OpenClaw può leggere il manifesto proprietario e applicare le sostituzioni dell'API e dell'URL di base dell'alias senza caricare il runtime del provider. Gli alias non ampliano gli elenchi non filtrati del catalogo; gli elenchi generali restituiscono solo le righe del provider canonico proprietario.

`suppressions` sostituisce il precedente hook `suppressBuiltInModel` del runtime del provider. Le voci di soppressione vengono rispettate solo quando il provider è di proprietà del plugin o è dichiarato come chiave di `modelCatalog.aliases` che punta a un provider di proprietà del plugin. Gli hook di soppressione del runtime non vengono più chiamati durante la risoluzione dei modelli.

Campi del provider:

| Campo                 | Tipo                     | Significato                                                                                                                                                                                                                           |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL di base predefinito facoltativo per i modelli nel catalogo di questo provider.                                                                                                                                                     |
| `api`                 | `ModelApi`               | Adattatore API predefinito facoltativo per i modelli nel catalogo di questo provider.                                                                                                                                                  |
| `headers`             | `Record<string, string>` | Intestazioni statiche facoltative applicate al catalogo di questo provider.                                                                                                                                                            |
| `defaultUtilityModel` | `string`                 | ID facoltativo di un modello piccolo consigliato dal provider per brevi attività di utilità interne (titoli, narrazione dell'avanzamento). Usato quando `agents.defaults.utilityModel` non è impostato e questo provider serve il modello principale dell'agente. |
| `models`              | `object[]`               | Righe dei modelli obbligatorie. Le righe prive di `id` vengono ignorate.                                                                                                                                                               |

Campi del modello:

| Campo              | Tipo                                                           | Significato                                                                             |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | ID del modello locale al provider, senza il prefisso `provider/`.                       |
| `name`             | `string`                                                       | Nome visualizzato facoltativo.                                                          |
| `api`              | `ModelApi`                                                     | Sostituzione facoltativa dell'API per il singolo modello.                               |
| `baseUrl`          | `string`                                                       | Sostituzione facoltativa dell'URL di base per il singolo modello.                       |
| `headers`          | `Record<string, string>`                                       | Intestazioni statiche facoltative per il singolo modello.                               |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalità accettate dal modello. Gli altri valori vengono eliminati senza avvisi.        |
| `reasoning`        | `boolean`                                                      | Indica se il modello espone funzionalità di ragionamento.                               |
| `contextWindow`    | `number`                                                       | Finestra di contesto nativa del provider.                                               |
| `contextTokens`    | `number`                                                       | Limite effettivo facoltativo del contesto di runtime, quando differisce da `contextWindow`. |
| `maxTokens`        | `number`                                                       | Numero massimo di token di output, quando noto.                                         |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Sostituzioni facoltative dell'ID del modello o dei parametri per ciascun livello di ragionamento. |
| `cost`             | `object`                                                       | Prezzi facoltativi in USD per milione di token, incluso l'eventuale `tieredPricing`.     |
| `compat`           | `object`                                                       | Flag di compatibilità facoltativi corrispondenti alla compatibilità della configurazione dei modelli di OpenClaw. |
| `mediaInput`       | `object`                                                       | Configurazione facoltativa dell'input per modalità, attualmente solo per le immagini.   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato nell'elenco. Sopprimere solo quando la riga non deve comparire affatto.           |
| `statusReason`     | `string`                                                       | Motivo facoltativo mostrato con uno stato diverso da disponibile.                       |
| `replaces`         | `string[]`                                                     | ID precedenti dei modelli locali al provider sostituiti da questo modello.              |
| `replacedBy`       | `string`                                                       | ID del modello sostitutivo locale al provider per le righe deprecate.                   |
| `tags`             | `string[]`                                                     | Tag stabili usati dai selettori e dai filtri.                                           |

Campi di soppressione:

| Campo                      | Tipo       | Significato                                                                                                         |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID del provider della riga a monte da sopprimere. Deve essere di proprietà di questo plugin o dichiarato come alias di proprietà del plugin. |
| `model`                    | `string`   | ID del modello locale al provider da sopprimere.                                                                    |
| `reason`                   | `string`   | Messaggio facoltativo mostrato quando la riga soppressa viene richiesta direttamente.                               |
| `when.baseUrlHosts`        | `string[]` | Elenco facoltativo degli host effettivi dell'URL di base del provider richiesti affinché si applichi la soppressione. |
| `when.providerConfigApiIn` | `string[]` | Elenco facoltativo dei valori esatti `api` della configurazione del provider richiesti affinché si applichi la soppressione. |

Non inserire in `modelCatalog` dati disponibili solo durante il runtime. Usa `static` solo quando le righe del manifesto sono sufficientemente complete da consentire agli elenchi filtrati per provider e alle interfacce di selezione di ignorare l'individuazione tramite registro o runtime. Usa `refreshable` quando le righe del manifesto sono valori iniziali o integrativi utili e visualizzabili, ma un aggiornamento o la cache possono aggiungere altre righe in seguito; le righe aggiornabili non sono autorevoli da sole. Usa `runtime` quando OpenClaw deve caricare il runtime del provider per conoscere l'elenco.

## Riferimento per modelIdNormalization

Usa `modelIdNormalization` per una semplice normalizzazione degli ID dei modelli di proprietà del provider che deve avvenire prima del caricamento del runtime del provider. In questo modo, gli alias come i nomi brevi dei modelli, gli ID precedenti locali al provider e le regole dei prefissi proxy rimangono nel manifesto del plugin proprietario anziché nelle tabelle principali di selezione dei modelli.

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

Campi del provider:

| Campo                                | Tipo                    | Significato                                                                                         |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias esatti degli ID dei modelli, senza distinzione tra maiuscole e minuscole. I valori vengono restituiti così come sono scritti. |
| `stripPrefixes`                      | `string[]`              | Prefissi da rimuovere prima della ricerca degli alias, utili per la duplicazione precedente di provider e modello. |
| `prefixWhenBare`                     | `string`                | Prefisso da aggiungere quando l'ID normalizzato del modello non contiene già `/`.                   |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regole condizionali per il prefisso degli ID semplici dopo la ricerca degli alias, definite da `modelPrefix` e `prefix`. |

## Riferimento per providerEndpoints

Usa `providerEndpoints` per la classificazione degli endpoint che i criteri generici delle richieste devono conoscere prima del caricamento del runtime del provider. Il core mantiene la proprietà del significato di ogni `endpointClass`; i manifesti dei plugin mantengono la proprietà dei metadati relativi all'host e all'URL di base.

I plugin dei provider ufficialmente esternalizzati sono esclusi dalla distribuzione del core, quindi
i relativi manifesti rimangono invisibili finché non vengono installati. Anche i relativi `providerEndpoints`
devono essere replicati in `scripts/lib/official-external-provider-catalog.json`, affinché
la classificazione degli endpoint continui a funzionare senza il plugin; un test del contratto
verifica tale replica.

Campi dell'endpoint:

| Campo                          | Tipo       | Significato                                                                                              |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe nota di endpoint core, ad esempio `openrouter`, `moonshot-native` o `google-vertex`.              |
| `hosts`                        | `string[]` | Nomi host esatti associati alla classe di endpoint.                                                      |
| `hostSuffixes`                 | `string[]` | Suffissi host associati alla classe di endpoint. Anteporre `.` per la corrispondenza dei soli suffissi di dominio. |
| `baseUrls`                     | `string[]` | URL di base HTTP(S) normalizzati esatti associati alla classe di endpoint.                               |
| `googleVertexRegion`           | `string`   | Regione Google Vertex statica per gli host globali esatti.                                              |
| `googleVertexRegionHostSuffix` | `string`   | Suffisso da rimuovere dagli host corrispondenti per ricavare il prefisso della regione Google Vertex.   |

## Riferimento di providerRequest

Usa `providerRequest` per metadati poco costosi sulla compatibilità delle richieste, necessari ai criteri generici per le richieste senza caricare il runtime del provider. Mantieni la riscrittura dei payload specifica del comportamento negli hook del runtime del provider o negli helper condivisi della famiglia di provider.

```json
{
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

| Campo                 | Tipo         | Significato                                                                                              |
| --------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etichetta della famiglia del provider usata dalle decisioni generiche sulla compatibilità delle richieste e dalla diagnostica. |
| `compatibilityFamily` | `"moonshot"` | Gruppo facoltativo di compatibilità della famiglia del provider per gli helper condivisi delle richieste. |
| `openAICompletions`   | `object`     | Flag delle richieste di completamento compatibili con OpenAI, attualmente `supportsStreamingUsage`.      |

## Riferimento di secretProviderIntegrations

Usa `secretProviderIntegrations` quando un plugin può pubblicare una preimpostazione riutilizzabile di provider exec SecretRef. OpenClaw legge questi metadati prima del caricamento del runtime del plugin, memorizza la proprietà del plugin in `secrets.providers.<alias>.pluginIntegration` e lascia la risoluzione effettiva dei segreti al runtime SecretRef. Le preimpostazioni sono esposte solo per i plugin inclusi e per quelli installati rilevati dalle radici gestite di installazione dei plugin, come le installazioni da git e ClawHub.

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

La chiave della mappa è l'ID dell'integrazione. Se `providerAlias` viene omesso, OpenClaw usa l'ID dell'integrazione come alias del provider SecretRef. Gli alias dei provider devono corrispondere al normale schema degli alias dei provider SecretRef, ad esempio `team-secrets` o `onepassword-work`.

Quando un operatore seleziona la preimpostazione, OpenClaw scrive un riferimento al provider simile al seguente:

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

All'avvio o al ricaricamento, OpenClaw risolve tale provider caricando i metadati correnti del manifesto del plugin, verificando che il plugin proprietario sia installato e attivo e concretizzando dal manifesto il comando exec. La disattivazione o la rimozione del plugin revoca il provider per i SecretRef attivi. Gli operatori che desiderano una configurazione exec autonoma possono comunque specificare direttamente provider manuali con `command`/`args`.

Attualmente sono supportate solo le preimpostazioni con `source: "exec"`. `command` deve essere `${node}` e `args[0]` deve essere uno script risolutore con percorso relativo alla radice del plugin che inizi con `./`. All'avvio o al ricaricamento, OpenClaw lo concretizza usando l'eseguibile Node corrente e il percorso assoluto dello script all'interno del plugin. Le opzioni di Node come `--require`, `--import`, `--loader`, `--env-file`, `--eval` e `--print` non fanno parte del contratto delle preimpostazioni del manifesto. Gli operatori che necessitano di comandi non Node possono configurare direttamente provider exec manuali autonomi.

Per le preimpostazioni del manifesto, OpenClaw deriva `trustedDirs` dalla radice del plugin e, per le preimpostazioni `${node}`, dalla directory dell'eseguibile Node corrente. I valori `trustedDirs` definiti nel manifesto vengono ignorati. Le altre opzioni del provider exec, come `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` e `allowInsecurePath`, vengono trasferite alla normale configurazione del provider exec SecretRef.

## Riferimento di modelPricing

Usa `modelPricing` quando un provider necessita del comportamento di determinazione dei prezzi del piano di controllo prima del caricamento del runtime. La cache dei prezzi del Gateway legge questi metadati senza importare il codice del runtime del provider.

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

| Campo        | Tipo              | Significato                                                                                                  |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Impostare su `false` per i provider locali o ospitati autonomamente che non devono mai recuperare i prezzi da OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Mappatura per la ricerca dei prezzi di OpenRouter. `false` disabilita la ricerca in OpenRouter per questo provider. |
| `liteLLM`    | `false \| object` | Mappatura per la ricerca dei prezzi di LiteLLM. `false` disabilita la ricerca in LiteLLM per questo provider. |

Campi della sorgente:

| Campo                      | Tipo               | Significato                                                                                                            |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID del provider del catalogo esterno quando differisce dall'ID del provider OpenClaw, ad esempio `z-ai` per un provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Tratta gli ID modello contenenti barre come riferimenti annidati provider/modello, utile per i provider proxy come OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varianti aggiuntive dell'ID modello del catalogo esterno. `version-dots` prova ID di versione con punti come `claude-opus-4.6`. |

### Indice dei provider OpenClaw

L'Indice dei provider OpenClaw è costituito da metadati di anteprima gestiti da OpenClaw per provider i cui plugin potrebbero non essere ancora installati. Non fa parte del manifesto di un plugin. I manifesti dei plugin restano la fonte autorevole per i plugin installati. L'Indice dei provider è il contratto interno di ripiego che le future interfacce per i provider installabili e per la selezione dei modelli prima dell'installazione utilizzeranno quando un plugin del provider non è installato.

Ordine di autorità del catalogo:

1. Configurazione dell'utente.
2. `modelCatalog` del manifesto del plugin installato.
3. Cache del catalogo dei modelli ottenuta da un aggiornamento esplicito.
4. Righe di anteprima dell'Indice dei provider OpenClaw.

L'Indice dei provider non deve contenere segreti, stato di abilitazione, hook di runtime o dati dei modelli specifici dell'account ottenuti in tempo reale. I suoi cataloghi di anteprima usano la stessa struttura delle righe del provider `modelCatalog` dei manifesti dei plugin, ma devono limitarsi a metadati di visualizzazione stabili, a meno che campi dell'adattatore di runtime come `api`, `baseUrl`, prezzi o flag di compatibilità non vengano mantenuti intenzionalmente allineati al manifesto del plugin installato. I provider con rilevamento in tempo reale tramite `/models` devono scrivere le righe aggiornate attraverso il percorso esplicito della cache del catalogo dei modelli, anziché far sì che la normale visualizzazione dell'elenco o la configurazione iniziale invochino le API del provider.

Le voci dell'Indice dei provider possono anche contenere metadati di plugin installabili per i provider il cui plugin è stato spostato fuori dal core o non è ancora installato per altri motivi. Questi metadati rispecchiano lo schema del catalogo dei canali: nome del pacchetto, specifica di installazione npm, integrità prevista ed etichette essenziali per le opzioni di autenticazione sono sufficienti per mostrare un'opzione di configurazione installabile. Una volta installato il plugin, il suo manifesto prevale e la voce dell'Indice dei provider viene ignorata per quel provider.

`openclaw doctor --fix` migra un insieme piccolo e chiuso di chiavi legacy di funzionalità del manifesto di primo livello in `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` e `tools`. Nessuna di queste, né qualsiasi altro elenco di funzionalità, viene più letta come campo di primo livello del manifesto; il normale caricamento del manifesto le riconosce solo in `contracts`.

## Manifesto rispetto a package.json

I due file svolgono funzioni diverse:

| File                   | Utilizzo                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Rilevamento, convalida della configurazione, metadati delle opzioni di autenticazione e indicazioni per l'interfaccia utente che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per punti di ingresso, condizioni di installazione, configurazione o metadati del catalogo |

Se non sai dove collocare un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda la creazione del pacchetto, i file di ingresso o il comportamento dell'installazione npm, inseriscilo in `package.json`

### Campi di package.json che influiscono sul rilevamento

Alcuni metadati dei plugin precedenti al runtime risiedono intenzionalmente in `package.json`, nel blocco `openclaw`, anziché in `openclaw.plugin.json`. `openclaw.bundle` e `openclaw.bundle.json` non sono contratti dei plugin OpenClaw; i plugin nativi devono usare `openclaw.plugin.json` insieme ai campi supportati di `package.json#openclaw` riportati di seguito.

Esempi importanti:

| Campo                                                                                      | Significato                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Dichiara i punti di ingresso nativi del plugin. Devono rimanere all'interno della directory del pacchetto del plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Dichiara i punti di ingresso runtime JavaScript compilati per i pacchetti installati. Devono rimanere all'interno della directory del pacchetto del plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Punto di ingresso leggero riservato alla configurazione, usato durante l'onboarding, l'avvio differito del canale e il rilevamento in sola lettura dello stato del canale e dei SecretRef. Deve rimanere all'interno della directory del pacchetto del plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Dichiara il punto di ingresso di configurazione JavaScript compilato per i pacchetti installati. Richiede `setupEntry`, deve esistere e deve rimanere all'interno della directory del pacchetto del plugin.                         |
| `openclaw.channel`                                                                         | Metadati leggeri del catalogo dei canali, come etichette, percorsi della documentazione, alias e testo di selezione.                                                                                                 |
| `openclaw.channel.commands`                                                                | Metadati statici dei comandi nativi e delle impostazioni predefinite automatiche delle skill native, usati dalle superfici di configurazione, controllo e elenco dei comandi prima del caricamento del runtime del canale.                                          |
| `openclaw.channel.configuredState`                                                         | Metadati leggeri per il controllo dello stato configurato, in grado di rispondere alla domanda «esiste già una configurazione basata esclusivamente sulle variabili d'ambiente?» senza caricare l'intero runtime del canale.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadati leggeri per il controllo dello stato di autenticazione persistente, in grado di rispondere alla domanda «è già stato effettuato un accesso?» senza caricare l'intero runtime del canale.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicazioni di installazione/aggiornamento per i plugin inclusi e pubblicati esternamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Percorso di installazione preferito quando sono disponibili più origini di installazione.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versione minima supportata dell'host OpenClaw, specificata con un limite inferiore semver come `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.compat.pluginApi`                                                                | Intervallo minimo dell'API dei plugin OpenClaw richiesto da questo pacchetto, specificato con un limite inferiore semver come `>=2026.5.27`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | Stringa di integrità prevista della distribuzione npm, ad esempio `sha512-...`; i flussi di installazione e aggiornamento verificano rispetto a essa l'artefatto recuperato.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Consente un percorso limitato di ripristino tramite reinstallazione di un plugin incluso quando la configurazione non è valida.                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Alias di pacchetti npm che devono essere materializzati quando i relativi vincoli di piattaforma nel lockfile corrispondono all'host corrente.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Consente il caricamento delle superfici del canale del runtime di configurazione prima dell'ascolto, quindi differisce il caricamento completo del plugin del canale configurato fino all'attivazione successiva all'avvio dell'ascolto.                                                 |

I metadati del manifesto determinano quali opzioni di provider, canale e configurazione compaiono durante l'onboarding prima del caricamento del runtime. `package.json#openclaw.install` indica all'onboarding come recuperare o abilitare il plugin quando l'utente seleziona una di queste opzioni. Non spostare le indicazioni di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del registro dei manifesti per le origini di plugin non incluse. I valori non validi vengono rifiutati; i valori validi ma più recenti causano l'esclusione dei plugin esterni sugli host meno recenti. Si presume che i plugin sorgente inclusi abbiano la stessa versione del checkout dell'host.

`openclaw.install.requiredPlatformPackages` è destinato ai pacchetti npm che espongono i binari nativi richiesti tramite alias facoltativi specifici della piattaforma. Elenca il nome semplice del pacchetto npm per ogni alias di piattaforma supportato. Durante l'installazione npm, OpenClaw verifica solo l'alias dichiarato i cui vincoli nel lockfile corrispondono all'host corrente. Se npm segnala il completamento dell'operazione ma omette tale alias, OpenClaw riprova una volta con una cache nuova e annulla l'installazione se l'alias continua a mancare.

`openclaw.compat.pluginApi` viene applicato durante l'installazione del pacchetto per le origini di plugin non incluse. Usalo per indicare la versione minima dell'API SDK/runtime dei plugin OpenClaw rispetto alla quale è stato compilato il pacchetto. Può essere più restrittivo di `minHostVersion` quando un pacchetto plugin richiede un'API più recente ma mantiene un'indicazione di installazione inferiore per altri flussi. Per impostazione predefinita, la sincronizzazione delle versioni ufficiali di OpenClaw aggiorna i limiti inferiori esistenti delle API dei plugin ufficiali alla versione della release OpenClaw, ma le release del solo plugin possono mantenere un limite inferiore quando il pacchetto supporta intenzionalmente host meno recenti. Non usare la sola versione del pacchetto come contratto di compatibilità. `peerDependencies.openclaw` rimane un metadato del pacchetto npm; OpenClaw usa il contratto `openclaw.compat.pluginApi` per le decisioni sulla compatibilità dell'installazione.

I metadati ufficiali per l'installazione su richiesta devono usare `clawhubSpec` quando il plugin è pubblicato su ClawHub; l'onboarding considera questa l'origine remota preferita e registra i dati dell'artefatto ClawHub dopo l'installazione. `npmSpec` rimane l'alternativa di compatibilità per i pacchetti che non sono ancora passati a ClawHub.

Il blocco esatto della versione npm è già definito in `npmSpec`, ad esempio `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci ufficiali del catalogo esterno devono associare le specifiche esatte a `expectedIntegrity`, affinché i flussi di aggiornamento interrompano l'operazione in modo sicuro se l'artefatto npm recuperato non corrisponde più alla release bloccata. Per compatibilità, l'onboarding interattivo continua a offrire specifiche npm di registri attendibili, inclusi nomi semplici dei pacchetti e dist-tag. La diagnostica del catalogo può distinguere tra origini esatte, variabili, bloccate tramite integrità, prive di integrità, con nome del pacchetto non corrispondente e con scelta predefinita non valida. Avvisa inoltre quando `expectedIntegrity` è presente ma non esiste un'origine npm valida a cui associarlo. Quando `expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo applicano; quando è omesso, la risoluzione del registro viene registrata senza un blocco di integrità.

I plugin dei canali devono fornire `openclaw.setupEntry` quando le scansioni dello stato, dell'elenco dei canali o dei SecretRef devono identificare gli account configurati senza caricare l'intero runtime. Il punto di ingresso della configurazione deve esporre i metadati del canale insieme agli adattatori di configurazione, stato e segreti sicuri per la configurazione; mantieni i client di rete, i listener del Gateway e i runtime di trasporto nel punto di ingresso principale dell'estensione.

I campi dei punti di ingresso runtime non sostituiscono i controlli dei confini del pacchetto per i campi dei punti di ingresso sorgente. Ad esempio, `openclaw.runtimeExtensions` non può rendere caricabile un percorso `openclaw.extensions` che esce dal pacchetto.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente limitato. Non rende installabili configurazioni arbitrarie non funzionanti. Attualmente consente ai flussi di installazione solo di ripristinarsi da specifici errori obsoleti di aggiornamento dei plugin inclusi, come un percorso mancante di un plugin incluso o una voce `channels.<id>` obsoleta per lo stesso plugin incluso. Gli errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è un metadato del pacchetto per un piccolo modulo di controllo:

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

Usalo quando i flussi di configurazione, doctor, stato o rilevamento in sola lettura necessitano di un controllo di autenticazione rapido con risposta sì/no prima del caricamento completo del plugin del canale. Lo stato di autenticazione persistente non coincide con lo stato configurato del canale: non usare questi metadati per abilitare automaticamente i plugin, riparare le dipendenze del runtime o decidere se il runtime di un canale debba essere caricato. L'esportazione di destinazione deve essere una piccola funzione che legge esclusivamente lo stato persistente; non instradarla attraverso il barrel completo del runtime del canale.

`openclaw.channel.configuredState` segue la stessa struttura per controlli rapidi dello stato configurato basati esclusivamente sulle variabili d'ambiente:

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

Usalo quando un canale può determinare lo stato configurato dalle variabili d'ambiente o da altri piccoli input esterni al runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero runtime del canale, mantieni invece tale logica nell'hook `config.hasConfiguredState` del plugin.

## Precedenza del rilevamento (ID di plugin duplicati)

OpenClaw rileva i plugin da tre radici, controllate in questo ordine: i plugin inclusi distribuiti con OpenClaw, la radice di installazione globale (`~/.openclaw/extensions`) e la radice dell'area di lavoro corrente (`<workspace>/.openclaw/extensions`), oltre alle eventuali voci esplicite di `plugins.load.paths`.

Se due elementi rilevati condividono lo stesso `id`, viene mantenuto solo il manifesto con la **precedenza più alta**; i duplicati con precedenza inferiore vengono scartati anziché essere caricati insieme. Precedenza, dalla più alta alla più bassa:

1. **Selezionato dalla configurazione** — un percorso bloccato esplicitamente in `plugins.entries.<id>`
2. **Installazione globale corrispondente a un record di installazione monitorato** — un plugin installato tramite `openclaw plugin install`/`openclaw plugin update` che il monitoraggio delle installazioni di OpenClaw riconosce per lo stesso ID, anche quando l'ID appartiene anche a un plugin incluso
3. **Incluso** — plugin distribuiti con OpenClaw
4. **Area di lavoro** — plugin rilevati relativamente all'area di lavoro corrente
5. Qualsiasi altro candidato rilevato

Implicazioni:

- Una copia derivata o obsoleta di un plugin incluso, presente senza monitoraggio nell'area di lavoro o nella radice globale, non sostituirà la build inclusa.
- Per sostituire un plugin incluso, esegui `openclaw plugin install` per quell'ID in modo che l'installazione globale monitorata abbia la precedenza sulla copia inclusa, oppure blocca un percorso specifico tramite `plugins.entries.<id>` affinché prevalga grazie alla precedenza della selezione da configurazione.
- Gli scarti dei duplicati vengono registrati, così Doctor e la diagnostica di avvio possono indicare la copia scartata.
- Nella diagnostica, le sostituzioni dei duplicati selezionate dalla configurazione vengono descritte come sostituzioni esplicite, ma generano comunque un avviso affinché le derivazioni obsolete e gli oscuramenti accidentali rimangano visibili.

## Requisiti dello schema JSON

- **Ogni plugin deve includere uno schema JSON**, anche se non accetta alcuna configurazione.
- Uno schema vuoto è accettabile (ad esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono convalidati durante la lettura/scrittura della configurazione, non in fase di runtime.
- Quando si estende o si crea un fork di un plugin incluso aggiungendo nuove chiavi di configurazione, aggiornare contemporaneamente il relativo `configSchema` in `openclaw.plugin.json`. Gli schemi dei plugin inclusi sono rigorosi, quindi l'aggiunta di `plugins.entries.<id>.config.myNewKey` nella configurazione utente senza aggiungere `myNewKey` a `configSchema.properties` verrà rifiutata prima del caricamento del runtime del plugin.

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

## Comportamento della convalida

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'ID del canale non sia dichiarato dal manifesto di un plugin. Se lo stesso ID compare anche in `plugins.allow`, `plugins.entries` o `plugins.installs` (un plugin a cui si fa riferimento ma che attualmente non è rilevabile), OpenClaw declassa invece l'errore ad **avviso**.
- I riferimenti a ID di plugin sconosciuti in `plugins.entries.<id>`, `plugins.allow` e `plugins.deny` sono **avvisi** ("voce di configurazione obsoleta ignorata"), non errori, affinché gli aggiornamenti e i plugin rimossi o rinominati non blocchino l'avvio del Gateway.
- Il riferimento a un ID di plugin sconosciuto in `plugins.slots.memory` è un **errore**, tranne nel caso del plugin esterno ufficiale noto `memory-lancedb`, per il quale viene invece generato un avviso.
- Se un plugin è installato ma presenta un manifesto o uno schema mancante o non valido, la convalida non riesce e Doctor segnala l'errore del plugin.
- Se la configurazione di un plugin esiste ma il plugin è **disabilitato**, la configurazione viene mantenuta e viene visualizzato un **avviso** in Doctor e nei log.

Per lo schema completo di `plugins.*`, consultare il [riferimento alla configurazione](/it/gateway/configuration).

## Note

- Il manifesto è **obbligatorio per i plugin nativi di OpenClaw**, inclusi quelli caricati dal file system locale. Il runtime continua a caricare separatamente il modulo del plugin; il manifesto serve esclusivamente per il rilevamento e la convalida.
- I manifesti nativi vengono analizzati come JSON5, quindi sono accettati commenti, virgole finali e chiavi senza virgolette, purché il valore finale sia comunque un oggetto.
- Il caricatore dei manifesti legge esclusivamente i campi documentati. Evitare chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un plugin non ne ha bisogno.
- `providerCatalogEntry` deve rimanere leggero e non dovrebbe importare ampie porzioni di codice di runtime; utilizzarlo per metadati statici del catalogo dei provider o descrittori di rilevamento circoscritti, non per l'esecuzione durante la gestione delle richieste.
- I tipi di plugin esclusivi vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory` (valore predefinito `memory-core`), `kind: "context-engine"` mediante `plugins.slots.contextEngine` (valore predefinito `legacy`).
- Dichiarare il tipo di plugin esclusivo in questo manifesto. `OpenClawPluginDefinition.kind` nella voce di runtime è deprecato e rimane disponibile solo come ripiego di compatibilità per i plugin meno recenti.
- I metadati delle variabili d'ambiente (`setup.providers[].envVars`, il deprecato `providerAuthEnvVars` e `channelEnvVars`) sono esclusivamente dichiarativi. Lo stato, il controllo, la convalida della consegna Cron e le altre superfici di sola lettura continuano ad applicare i criteri di attendibilità e di attivazione effettiva del plugin prima di considerare configurata una variabile d'ambiente.
- Per i metadati della procedura guidata di runtime che richiedono codice del provider, consultare gli [hook di runtime del provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il plugin dipende da moduli nativi, documentare i passaggi di compilazione e gli eventuali requisiti relativi all'elenco consentito del gestore di pacchetti (ad esempio, `allow-build-scripts` di pnpm e `pnpm rebuild <package>`).

## Contenuti correlati

<CardGroup cols={3}>
  <Card title="Creazione di plugin" href="/it/plugins/building-plugins" icon="rocket">
    Introduzione ai plugin.
  </Card>
  <Card title="Architettura dei plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello delle funzionalità.
  </Card>
  <Card title="Panoramica dell'SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento all'SDK dei plugin e importazioni dei sottopercorsi.
  </Card>
</CardGroup>
