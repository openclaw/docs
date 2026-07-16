---
read_when:
    - Stai creando un plugin OpenClaw
    - È necessario distribuire uno schema di configurazione del plugin o eseguire il debug degli errori di convalida del plugin
summary: Requisiti del manifest del Plugin e dello schema JSON (convalida rigorosa della configurazione)
title: Manifest del Plugin
x-i18n:
    generated_at: "2026-07-16T14:37:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

Questa pagina descrive il **manifest nativo dei plugin OpenClaw**, `openclaw.plugin.json`. Per i layout di bundle compatibili (Codex, Claude, Cursor), consultare [Bundle di plugin](/it/plugins/bundles).

I formati di bundle compatibili usano invece i propri file manifest:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json`, oppure il layout predefinito dei componenti Claude senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente questi layout, ma non li convalida rispetto allo schema `openclaw.plugin.json` riportato di seguito. Per un bundle compatibile, OpenClaw legge i metadati del bundle, le radici delle Skills dichiarate, le radici dei comandi Claude, le impostazioni predefinite `settings.json` di Claude, le impostazioni predefinite LSP di Claude e i pacchetti di hook supportati, quando il layout corrisponde alle aspettative di runtime di OpenClaw.

Ogni plugin nativo OpenClaw **deve** includere `openclaw.plugin.json` nella **radice del plugin**. OpenClaw lo legge per convalidare la configurazione **senza eseguire il codice del plugin**. Un manifest mancante o non valido blocca la convalida della configurazione ed è considerato un errore del plugin.

Consultare [Plugin](/it/tools/plugin) per la guida completa al sistema di plugin e [Modello delle funzionalità](/it/plugins/architecture#public-capability-model) per il modello nativo delle funzionalità e le attuali indicazioni sulla compatibilità esterna.

## Funzione di questo file

`openclaw.plugin.json` contiene metadati che OpenClaw legge **prima di caricare il codice del plugin**. Tutto ciò che contiene deve poter essere esaminato con un costo sufficientemente basso senza avviare il runtime del plugin.

**Utilizzarlo per:**

- identità del plugin, convalida della configurazione e suggerimenti per l'interfaccia di configurazione
- metadati di autenticazione, onboarding e configurazione (alias, abilitazione automatica, variabili d'ambiente del provider, opzioni di autenticazione)
- indicazioni di attivazione per le superfici del piano di controllo
- titolarità abbreviata delle famiglie di modelli
- istantanee statiche della titolarità delle funzionalità (`contracts`)
- metadati dell'esecutore QA che l'host condiviso `openclaw qa` può esaminare
- metadati di configurazione specifici del canale, combinati nelle superfici di catalogo e convalida

**Non utilizzarlo per:** registrare il comportamento del runtime, dichiarare punti di ingresso del codice o specificare metadati di installazione npm. Questi elementi devono essere definiti nel codice del plugin e in `package.json`.

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
  "description": "Plugin del provider OpenRouter",
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

| Campo                                | Obbligatorio | Tipo                         | Significato                                                                                                                                                                                                                                                              |
| ------------------------------------ | ------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì      | `string`                     | ID canonico del plugin. È l'ID utilizzato in `plugins.entries.<id>`.                                                                                                                                                                                                        |
| `configSchema`                       | Sì      | `object`                     | Schema JSON incorporato per la configurazione di questo plugin.                                                                                                                                                                                                                               |
| `requiresPlugins`                    | No       | `string[]`                   | ID dei plugin che devono essere installati affinché questo plugin abbia effetto. Il rilevamento mantiene caricabile il plugin, ma mostra un avviso quando manca un plugin obbligatorio.                                                                                                               |
| `enabledByDefault`                   | No       | `true`                       | Contrassegna un plugin incluso come abilitato per impostazione predefinita. Ometterlo, oppure impostare qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita.                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | No       | `string[]`                   | Contrassegna un plugin incluso come abilitato per impostazione predefinita solo sulle piattaforme Node.js elencate, ad esempio `["darwin"]`. La configurazione esplicita ha comunque la precedenza.                                                                                                                                   |
| `legacyPluginIds`                    | No       | `string[]`                   | ID legacy normalizzati in questo ID canonico del plugin.                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | No       | `string[]`                   | ID dei provider che devono abilitare automaticamente questo plugin quando sono menzionati dall'autenticazione, dalla configurazione o dai riferimenti ai modelli.                                                                                                                                                                            |
| `kind`                               | No       | `PluginKind \| PluginKind[]` | Dichiara uno o più tipi di plugin esclusivi (`"memory"`, `"context-engine"`) utilizzati da `plugins.slots.*`. Un plugin che possiede entrambi gli slot dichiara entrambi i tipi in un unico array.                                                                                                    |
| `channels`                           | No       | `string[]`                   | ID dei canali di proprietà di questo plugin. Utilizzati per il rilevamento e la convalida della configurazione.                                                                                                                                                                                                |
| `providers`                          | No       | `string[]`                   | ID dei provider di proprietà di questo plugin.                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | No       | `string`                     | Percorso del modulo leggero del catalogo dei provider, relativo alla radice del plugin, per i metadati del catalogo dei provider con ambito limitato al manifesto che possono essere caricati senza attivare l'intero runtime del plugin.                                                                                        |
| `modelSupport`                       | No       | `object`                     | Metadati abbreviati delle famiglie di modelli di proprietà del manifesto, utilizzati per caricare automaticamente il plugin prima del runtime.                                                                                                                                                                                |
| `modelCatalog`                       | No       | `object`                     | Metadati dichiarativi del catalogo dei modelli per i provider di proprietà di questo plugin. Costituiscono il contratto del piano di controllo per future operazioni di sola lettura quali elenchi, configurazione iniziale, selettori di modelli, alias ed esclusioni, senza caricare il runtime del plugin.                                                |
| `modelPricing`                       | No       | `object`                     | Criterio di ricerca dei prezzi esterni di proprietà del provider. Utilizzarlo per escludere i provider locali o self-hosted dai cataloghi dei prezzi remoti oppure per associare i riferimenti dei provider agli ID dei cataloghi OpenRouter/LiteLLM senza codificare direttamente gli ID dei provider nel core.                                                    |
| `modelIdNormalization`               | No       | `object`                     | Normalizzazione degli alias o dei prefissi degli ID dei modelli di proprietà del provider, da eseguire prima del caricamento del runtime del provider.                                                                                                                                                                                  |
| `providerEndpoints`                  | No       | `object[]`                   | Metadati dell'host/baseUrl dell'endpoint di proprietà del manifesto per le route dei provider che il core deve classificare prima del caricamento del runtime del provider.                                                                                                                                                   |
| `providerRequest`                    | No       | `object`                     | Metadati leggeri sulla famiglia del provider e sulla compatibilità delle richieste, utilizzati dai criteri generici per le richieste prima del caricamento del runtime del provider.                                                                                                                                                     |
| `secretProviderIntegrations`         | No       | `Record<string, object>`     | Preimpostazioni dichiarative dei provider di esecuzione SecretRef che le interfacce di configurazione o installazione possono offrire senza codificare direttamente nel core integrazioni specifiche del provider.                                                                                                                            |
| `cliBackends`                        | No       | `string[]`                   | ID dei backend di inferenza CLI di proprietà di questo plugin. Utilizzati per l'attivazione automatica all'avvio a partire da riferimenti di configurazione espliciti.                                                                                                                                                                |
| `syntheticAuthRefs`                  | No       | `string[]`                   | Riferimenti ai provider o ai backend CLI per i quali deve essere verificato l'hook di autenticazione sintetica di proprietà del plugin durante il rilevamento a freddo dei modelli, prima del caricamento del runtime.                                                                                                                                     |
| `nonSecretAuthMarkers`               | No       | `string[]`                   | Valori segnaposto delle chiavi API, di proprietà del plugin incluso, che rappresentano lo stato di credenziali locali non segrete, OAuth o ambientali.                                                                                                                                                       |
| `commandAliases`                     | No       | `object[]`                   | Nomi dei comandi di proprietà di questo plugin che devono generare diagnostica della configurazione e della CLI specifica del plugin prima del caricamento del runtime.                                                                                                                                                       |
| `providerAuthEnvVars`                | No       | `Record<string, string[]>`   | Metadati delle variabili d'ambiente di compatibilità deprecati per la ricerca dell'autenticazione e dello stato del provider. Per i nuovi plugin, preferire `setup.providers[].envVars`; OpenClaw continua a leggerli durante il periodo di deprecazione.                                                                                        |
| `providerUsageAuthEnvVars`           | No       | `Record<string, string[]>`   | Credenziali del provider destinate esclusivamente all'utilizzo e alla fatturazione. OpenClaw usa questi nomi per rilevare l'utilizzo e rimuovere i segreti, ma mai per l'autenticazione dell'inferenza.                                                                                                                                  |
| `providerAuthAliases`                | No       | `Record<string, string>`     | ID dei provider che devono riutilizzare un altro ID provider per la ricerca dell'autenticazione, ad esempio un provider di programmazione che condivide la chiave API e i profili di autenticazione del provider di base.                                                                                                                 |
| `channelEnvVars`                     | No       | `Record<string, string[]>`   | Metadati leggeri delle variabili d'ambiente del canale che OpenClaw può esaminare senza caricare il codice del plugin. Utilizzarli per le interfacce di configurazione o autenticazione del canale basate sulle variabili d'ambiente che devono essere visibili agli helper generici di avvio e configurazione.                                                                                   |
| `providerAuthChoices`                | No       | `object[]`                   | Metadati leggeri per la scelta dell'autenticazione nei selettori della configurazione iniziale, nella risoluzione del provider preferito e nel semplice collegamento dei flag della CLI.                                                                                                                                                              |
| `activation`                         | No       | `object`                     | Metadati leggeri del pianificatore di attivazione per il caricamento attivato da avvio, provider, comando, canale, route e funzionalità. Solo metadati; il runtime del plugin rimane responsabile del comportamento effettivo.                                                                                              |
| `setup`                              | No       | `object`                     | Descrittori leggeri di configurazione e configurazione iniziale che le interfacce di rilevamento e configurazione possono esaminare senza caricare il runtime del plugin.                                                                                                                                                           |
| `qaRunners`                          | No       | `object[]`                   | Descrittori leggeri dell'esecutore QA utilizzati dall'host condiviso `openclaw qa` prima del caricamento del runtime del plugin.                                                                                                                                                                             |
| `contracts`                          | No       | `object`                     | Istantanea statica della proprietà delle funzionalità per hook di autenticazione esterni, embedding, sintesi vocale, trascrizione in tempo reale, voce in tempo reale, comprensione dei contenuti multimediali, generazione di immagini/video/musica, recupero web, ricerca web, provider worker, estrazione di documenti/contenuti web e proprietà degli strumenti. |
| `configContracts`                    | No       | `object`                     | Comportamento della configurazione di proprietà del manifesto utilizzato dagli helper generici del core: rilevamento dei flag pericolosi, destinazioni della migrazione SecretRef e restrizione dei percorsi di configurazione legacy. Consultare il [riferimento configContracts](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | No       | `Record<string, object>`     | Impostazioni predefinite leggere per la comprensione dei contenuti multimediali per gli ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadati di autenticazione leggeri per la generazione di immagini per gli ID provider dichiarati in `contracts.imageGenerationProviders`, inclusi gli alias di autenticazione di proprietà del provider e i controlli di protezione dell'URL di base.                                                                                                         |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadati di autenticazione leggeri per la generazione di video per gli ID provider dichiarati in `contracts.videoGenerationProviders`, inclusi gli alias di autenticazione di proprietà del provider e i controlli di protezione dell'URL di base.                                                                                                         |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | Metadati di autenticazione leggeri per la generazione di musica per gli ID provider dichiarati in `contracts.musicGenerationProviders`, inclusi gli alias di autenticazione di proprietà del provider e i controlli di protezione dell'URL di base.                                                                                                         |
| `toolMetadata`                       | No       | `Record<string, object>`     | Metadati di disponibilità leggeri per gli strumenti di proprietà del plugin dichiarati in `contracts.tools`. Utilizzarli quando uno strumento non deve caricare il runtime in assenza di evidenze relative a configurazione, ambiente o autenticazione.                                                                                                  |
| `channelConfigs`                     | No       | `Record<string, object>`     | Metadati della configurazione del canale di proprietà del manifesto, integrati nelle superfici di rilevamento e convalida prima del caricamento del runtime.                                                                                                                                                                 |
| `skills`                             | No       | `string[]`                   | Directory delle Skill da caricare, relative alla radice del plugin.                                                                                                                                                                                                                    |
| `name`                               | No       | `string`                     | Nome del plugin leggibile dall'utente.                                                                                                                                                                                                                                                |
| `description`                        | No       | `string`                     | Breve riepilogo visualizzato nelle superfici del plugin.                                                                                                                                                                                                                                    |
| `catalog`                            | No       | `object`                     | Indicazioni facoltative per la presentazione nelle superfici del catalogo dei plugin. Questi metadati non installano né abilitano un plugin e non gli accordano fiducia.                                                                                                                                               |
| `icon`                               | No       | `string`                     | URL HTTPS dell'immagine per le schede del marketplace/catalogo. ClawHub accetta qualsiasi URL `https://` valido e usa l'icona predefinita del plugin quando questo valore viene omesso o non è valido.                                                                                                         |
| `version`                            | No       | `string`                     | Versione informativa del plugin.                                                                                                                                                                                                                                              |
| `uiHints`                            | No       | `Record<string, object>`     | Etichette dell'interfaccia utente, segnaposto e indicazioni sulla sensibilità per i campi di configurazione.                                                                                                                                                                                                          |

## riferimento al catalogo

`catalog` fornisce indicazioni di visualizzazione facoltative ai browser dei plugin. Gli host possono ignorare queste indicazioni. Non installano né abilitano mai il plugin e non ne modificano il comportamento in fase di esecuzione o il livello di attendibilità.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Campo      | Tipo      | Significato                                                              |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Indica se le superfici del catalogo devono mettere in evidenza questo plugin.                       |
| `order`    | `number`  | Indicazione per l'ordine di visualizzazione crescente tra i plugin selezionati; i valori inferiori vengono mostrati prima. |

## riferimento ai metadati dei provider di generazione

I campi dei metadati dei provider di generazione descrivono segnali di autenticazione statici per i provider dichiarati nell'elenco `contracts.*GenerationProviders` corrispondente. OpenClaw legge questi campi prima del caricamento del runtime del provider, affinché gli strumenti principali possano determinare se un provider di generazione è disponibile senza importare ogni plugin del provider.

Usare questi campi solo per informazioni dichiarative e poco onerose da valutare. Il trasporto, le trasformazioni delle richieste, l'aggiornamento dei token, la convalida delle credenziali e il comportamento effettivo di generazione restano nel runtime del plugin.

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
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | No       | `string[]` | ID di provider aggiuntivi da considerare alias di autenticazione statici per il provider di generazione.                                                       |
| `authProviders`        | No       | `string[]` | ID dei provider i cui profili di autenticazione configurati devono essere considerati validi per questo provider di generazione.                                                      |
| `configSignals`        | No       | `object[]` | Segnali di disponibilità poco onerosi e basati solo sulla configurazione per provider locali o in hosting autonomo configurabili senza profili di autenticazione né variabili di ambiente.                 |
| `authSignals`          | No       | `object[]` | Segnali di autenticazione espliciti. Quando presenti, sostituiscono l'insieme predefinito di segnali derivato dall'ID del provider, da `aliases` e da `authProviders`.                     |
| `referenceAudioInputs` | No       | `boolean`  | Solo per la generazione video. Impostare su `true` quando il provider accetta risorse audio di riferimento; in caso contrario, `video_generate` nasconde i parametri di riferimento audio. |

Ogni voce `configSignals` supporta:

| Campo            | Obbligatorio | Tipo       | Significato                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Sì      | `string`   | Percorso puntato dell'oggetto di configurazione appartenente al plugin da esaminare, ad esempio `plugins.entries.example.config`.                                                                                      |
| `overlayPath`    | No       | `string`   | Percorso puntato all'interno della configurazione radice il cui oggetto deve sovrapporsi all'oggetto radice prima di valutare il segnale. Usarlo per configurazioni specifiche di una funzionalità, come `image`, `video` o `music`.   |
| `overlayMapPath` | No       | `string`   | Percorso puntato all'interno della configurazione radice i cui valori oggetto devono sovrapporsi singolarmente all'oggetto radice. Usarlo per mappe di account denominati, come `accounts`, in cui è sufficiente qualsiasi account configurato. |
| `required`       | No       | `string[]` | Percorsi puntati all'interno della configurazione effettiva che devono avere valori configurati. Le stringhe devono essere non vuote; gli oggetti e gli array non devono essere vuoti.                                                  |
| `requiredAny`    | No       | `string[]` | Percorsi puntati all'interno della configurazione effettiva, almeno uno dei quali deve avere un valore configurato.                                                                                                    |
| `mode`           | No       | `object`   | Vincolo facoltativo della modalità stringa all'interno della configurazione effettiva. Usarlo quando la disponibilità basata solo sulla configurazione si applica esclusivamente a una modalità.                                                                  |

Ogni vincolo `mode` supporta:

| Campo        | Obbligatorio | Tipo       | Significato                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No       | `string`   | Percorso puntato all'interno della configurazione effettiva. Il valore predefinito è `mode`.                          |
| `default`    | No       | `string`   | Valore della modalità da usare quando la configurazione omette il percorso.                                  |
| `allowed`    | No       | `string[]` | Se presente, il segnale viene accettato solo quando la modalità effettiva corrisponde a uno di questi valori. |
| `disallowed` | No       | `string[]` | Se presente, il segnale non viene accettato quando la modalità effettiva corrisponde a uno di questi valori.       |

Ogni voce `authSignals` supporta:

| Campo             | Obbligatorio | Tipo     | Significato                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì      | `string` | ID del provider da verificare nei profili di autenticazione configurati.                                                                                                                             |
| `providerBaseUrl` | No       | `object` | Vincolo facoltativo che considera valido il segnale solo quando il provider configurato a cui si fa riferimento utilizza un URL di base consentito. Usarlo quando un alias di autenticazione è valido solo per determinate API. |

Ogni vincolo `providerBaseUrl` supporta:

| Campo             | Obbligatorio | Tipo       | Significato                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì      | `string`   | ID della configurazione del provider il cui `baseUrl` deve essere verificato.                                                                                                |
| `defaultBaseUrl`  | No       | `string`   | URL di base da presupporre quando la configurazione del provider omette `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Sì      | `string[]` | URL di base consentiti per questo segnale di autenticazione. Il segnale viene ignorato quando l'URL di base configurato o predefinito non corrisponde a uno di questi valori normalizzati. |

## riferimento ai metadati degli strumenti

`toolMetadata` usa le stesse strutture `configSignals` e `authSignals` dei metadati dei provider di generazione, indicizzate in base al nome dello strumento. `contracts.tools` dichiara la proprietà. `toolMetadata` dichiara evidenze di disponibilità poco onerose da valutare, affinché OpenClaw possa evitare di importare il runtime di un plugin solo per ottenere `null` dalla relativa factory dello strumento.

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

Le voci `toolMetadata` accettano inoltre `optional` (contrassegna lo strumento come non obbligatorio per l'attivazione del plugin) e `replaySafe` (indica che è sicuro ripetere l'esecuzione dello strumento dopo un turno incompleto del modello), oltre ai campi condivisi `configSignals`/`authSignals` descritti sopra.

Se uno strumento non dispone di `toolMetadata`, OpenClaw mantiene il comportamento esistente e carica il plugin proprietario quando il contratto dello strumento corrisponde alla policy. Per gli strumenti del percorso critico la cui factory dipende dall'autenticazione o dalla configurazione, gli autori dei plugin devono dichiarare `toolMetadata` anziché fare in modo che il nucleo importi il runtime per interrogarlo.

## riferimento a providerAuthChoices

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione. OpenClaw la legge prima del caricamento del runtime del provider. Gli elenchi di configurazione dei provider usano queste scelte del manifesto, le scelte di configurazione derivate dai descrittori e i metadati del catalogo di installazione senza caricare il runtime del provider.

| Campo                 | Obbligatorio | Tipo                                                                  | Significato                                                                                             |
| --------------------- | ------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                                              | ID del provider a cui appartiene questa scelta.                                                                       |
| `method`              | Sì           | `string`                                                              | ID del metodo di autenticazione a cui effettuare il dispatch.                                                                            |
| `choiceId`            | Sì           | `string`                                                              | ID stabile della scelta di autenticazione utilizzato dai flussi di onboarding e della CLI.                                                   |
| `choiceLabel`         | No           | `string`                                                              | Etichetta visibile all'utente. Se omessa, OpenClaw usa come fallback `choiceId`.                                         |
| `choiceHint`          | No           | `string`                                                              | Breve testo di supporto per il selettore.                                                                         |
| `assistantPriority`   | No           | `number`                                                              | I valori inferiori vengono ordinati prima nei selettori interattivi guidati dall'assistente.                                        |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                                        | Nasconde la scelta dai selettori dell'assistente, consentendo comunque la selezione manuale tramite CLI.                         |
| `deprecatedChoiceIds` | No           | `string[]`                                                            | ID di scelte precedenti che devono reindirizzare gli utenti a questa scelta sostitutiva.                                  |
| `groupId`             | No           | `string`                                                              | ID di gruppo facoltativo per raggruppare scelte correlate.                                                           |
| `groupLabel`          | No           | `string`                                                              | Etichetta visibile all'utente per tale gruppo.                                                                         |
| `groupHint`           | No           | `string`                                                              | Breve testo di supporto per il gruppo.                                                                          |
| `onboardingFeatured`  | No           | `boolean`                                                             | Mostra questo gruppo nel livello in evidenza del selettore interattivo di onboarding, prima della voce "Altro...". |
| `optionKey`           | No           | `string`                                                              | Chiave interna dell'opzione per flussi di autenticazione semplici con un solo flag.                                                       |
| `cliFlag`             | No           | `string`                                                              | Nome del flag della CLI, ad esempio `--openrouter-api-key`.                                                            |
| `cliOption`           | No           | `string`                                                              | Forma completa dell'opzione della CLI, ad esempio `--openrouter-api-key <key>`.                                              |
| `cliDescription`      | No           | `string`                                                              | Descrizione utilizzata nella guida della CLI.                                                                             |
| `appGuidedSecret`     | No           | `boolean`                                                             | Un solo secret incollato insieme alle impostazioni predefinite del provider è sufficiente per la configurazione guidata dall'app.                              |
| `appGuidedDiscovery`  | No           | `boolean`                                                             | Il metodo di autenticazione runtime corrispondente gestisce il rilevamento locale in sola lettura tramite `appGuidedSetup`.                 |
| `appGuidedAuth`       | No           | `"oauth"` \| `"device-code"`                                          | Accesso interattivo gestito dal provider che i client di configurazione nativi possono visualizzare in modo generico.                        |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Superfici di onboarding in cui deve comparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`.  |

Quando `appGuidedDiscovery` è true, il metodo di autenticazione del provider corrispondente deve esporre
`appGuidedSetup.detect` e `appGuidedSetup.prepare`. Il rilevamento deve essere
in sola lettura: nessun accesso, pull del modello, download o scrittura della configurazione. La preparazione verifica nuovamente
il modello esatto selezionato e restituisce una proposta di configurazione; OpenClaw esegue un test live di tale
proposta in isolamento e la applica solo dopo il successo.

## Riferimento di commandAliases

Usare `commandAliases` quando un plugin possiede un nome di comando runtime che gli utenti potrebbero inserire per errore in `plugins.allow` o tentare di eseguire come comando CLI radice. OpenClaw usa questi metadati per la diagnostica senza importare il codice runtime del plugin.

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

| Campo        | Obbligatorio | Tipo              | Significato                                                           |
| ------------ | ------------ | ----------------- | --------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando appartenente a questo plugin.                               |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat anziché come comando CLI radice. |
| `cliCommand` | No           | `string`          | Comando CLI radice correlato da suggerire per le operazioni CLI, se esistente.  |

## Riferimento di activation

Usare `activation` quando il plugin può dichiarare con costi minimi quali eventi del piano di controllo devono includerlo in un piano di attivazione/caricamento.

Questo blocco contiene metadati per il pianificatore, non è un'API del ciclo di vita. Non registra il comportamento runtime, non sostituisce `register(...)` e non garantisce che il codice del plugin sia già stato eseguito. Il pianificatore dell'attivazione usa questi campi per restringere l'insieme dei plugin candidati prima di ricorrere ai metadati esistenti sulla proprietà del manifest, come `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e gli hook.

Preferire i metadati più specifici che descrivono già la proprietà. Usare `providers`, `channels`, `commandAliases`, i descrittori di configurazione o `contracts` quando tali campi esprimono la relazione. Usare `activation` per indicazioni aggiuntive destinate al pianificatore che non possono essere rappresentate da tali campi di proprietà. Usare `cliBackends` di primo livello per gli alias runtime della CLI, come `claude-cli`, `my-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` è riservato agli ID degli harness incorporati per agenti che non dispongono già di un campo di proprietà.

Ogni plugin deve impostare `activation.onStartup` intenzionalmente. Impostarlo su `true` solo quando il plugin deve essere eseguito durante l'avvio del Gateway. Impostarlo su `false` quando il plugin è inattivo all'avvio e deve essere caricato solo da trigger più specifici. L'omissione di `onStartup` non determina più implicitamente il caricamento del plugin all'avvio; usare metadati di attivazione espliciti per l'avvio, il canale, la configurazione, l'harness dell'agente, la memoria o altri trigger di attivazione più specifici.

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

| Campo              | Obbligatorio | Tipo                                                 | Significato                                                                                                                                                                               |
| ------------------ | ------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No           | `boolean`                                            | Attivazione esplicita all'avvio del Gateway. Ogni plugin deve impostarla. `true` importa il plugin durante l'avvio; `false` ne mantiene il caricamento differito all'avvio, salvo che un altro trigger corrispondente ne richieda il caricamento. |
| `onProviders`      | No           | `string[]`                                           | ID dei provider che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                                      |
| `onAgentHarnesses` | No           | `string[]`                                           | ID runtime degli harness incorporati per agenti che devono includere questo plugin nei piani di attivazione/caricamento. Usare `cliBackends` di primo livello per gli alias del backend CLI.                                           |
| `onCommands`       | No           | `string[]`                                           | ID dei comandi che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                                       |
| `onChannels`       | No           | `string[]`                                           | ID dei canali che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                                       |
| `onRoutes`         | No           | `string[]`                                           | Tipi di route che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                                       |
| `onConfigPaths`    | No           | `string[]`                                           | Percorsi di configurazione relativi alla radice che devono includere questo plugin nei piani di avvio/caricamento quando il percorso è presente e non è esplicitamente disabilitato.                                                      |
| `onCapabilities`   | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicazioni generiche sulle capacità utilizzate dalla pianificazione dell'attivazione del piano di controllo. Preferire campi più specifici quando possibile.                                                                                     |

Consumer live attuali:

- La pianificazione dell'avvio del Gateway usa `activation.onStartup` per l'importazione esplicita all'avvio.
- La pianificazione della CLI attivata da comandi ricorre ai valori legacy `commandAliases[].cliCommand` o `commandAliases[].name`.
- La pianificazione dell'avvio del runtime dell'agente usa `activation.onAgentHarnesses` per gli harness incorporati e `cliBackends[]` di primo livello per gli alias del runtime CLI.
- La pianificazione della configurazione o del canale attivata dal canale ricorre alla proprietà legacy `channels[]` quando mancano metadati espliciti di attivazione del canale.
- La pianificazione dei Plugin all'avvio usa `activation.onConfigPaths` per le superfici di configurazione radice non relative ai canali, come il blocco `browser` del Plugin browser incluso.
- La pianificazione della configurazione o del runtime attivata dal provider ricorre alla proprietà legacy `providers[]` e a quella di primo livello `cliBackends[]` quando mancano metadati espliciti di attivazione del provider.

La diagnostica del pianificatore può distinguere le indicazioni di attivazione esplicite dal fallback alla proprietà del manifest. Ad esempio, `activation-command-hint` indica che `activation.onCommands` ha trovato una corrispondenza, mentre `manifest-command-alias` indica che il pianificatore ha usato invece la proprietà `commandAliases`. Queste etichette del motivo sono destinate alla diagnostica dell'host e ai test; gli autori dei Plugin devono continuare a dichiarare i metadati che descrivono meglio la proprietà.

## Riferimento di qaRunners

Usare `qaRunners` quando un Plugin fornisce uno o più runner di trasporto sotto
la radice condivisa `openclaw qa`. Mantenere questi metadati leggeri e statici; il runtime
del Plugin continua a gestire la registrazione effettiva della CLI tramite una superficie
leggera `runtime-api.ts` che esporta valori `qaRunnerCliRegistrations` corrispondenti. Un
valore facoltativo `adapterFactory` espone il trasporto agli scenari QA condivisi senza
modificare il runner del comando registrato.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Esegue il percorso QA live di Matrix basato su Docker su un homeserver usa e getta"
    }
  ]
}
```

| Campo         | Obbligatorio | Tipo     | Significato                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sì      | `string` | Sottocomando montato sotto `openclaw qa`, ad esempio `matrix`.    |
| `description` | No       | `string` | Testo della guida di fallback usato quando l'host condiviso necessita di un comando segnaposto. |

L'id `adapterFactory` deve corrispondere a `commandName`. Non esportare registrazioni
per comandi assenti dal manifest.

## Riferimento di setup

Usare `setup` quando le superfici di configurazione e onboarding necessitano di metadati leggeri di proprietà del Plugin prima del caricamento del runtime.

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
            "source": "credenziali locali openai"
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

Il valore di primo livello `cliBackends` rimane valido e continua a descrivere i backend di inferenza della CLI. `setup.cliBackends` è la superficie dei descrittori specifica per la configurazione, destinata ai flussi del piano di controllo e di configurazione che devono rimanere basati esclusivamente sui metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` costituiscono la superficie di ricerca preferita basata innanzitutto sui descrittori per il rilevamento della configurazione. Se il descrittore restringe soltanto il Plugin candidato e la configurazione necessita comunque di hook del runtime più completi in fase di configurazione, impostare `requiresRuntime: true` e mantenere `setup-api` come percorso di esecuzione di fallback.

OpenClaw include inoltre `setup.providers[].envVars` nelle ricerche generiche dell'autenticazione del provider e delle variabili d'ambiente. `providerAuthEnvVars` rimane supportato tramite un adattatore di compatibilità durante il periodo di deprecazione, ma i Plugin non inclusi che continuano a usarlo ricevono una diagnostica del manifest. I nuovi Plugin devono inserire i metadati delle variabili d'ambiente per configurazione e stato in `setup.providers[].envVars`.

Usare `providerUsageAuthEnvVars` quando una credenziale di fatturazione o a livello di organizzazione deve attivare `resolveUsageAuth` senza diventare una credenziale di inferenza. Questi nomi vengono inclusi nel blocco dei file dotenv dell'area di lavoro, nella rimozione dai processi figlio ACP, nel filtraggio dei segreti della sandbox e nell'eliminazione generale dei segreti. Il runtime del provider continua a leggere e classificare il valore all'interno di `resolveUsageAuth`.

OpenClaw può inoltre ricavare semplici opzioni di configurazione da `setup.providers[].authMethods` quando non è disponibile alcuna voce di configurazione o quando `setup.requiresRuntime: false` dichiara che il runtime di configurazione non è necessario. Le voci esplicite `providerAuthChoices` restano preferite per etichette personalizzate, flag CLI, ambito dell'onboarding e metadati dell'assistente.

Impostare `requiresRuntime: false` solo quando tali descrittori sono sufficienti per la superficie di configurazione. OpenClaw considera il valore esplicito `false` un contratto basato esclusivamente sui descrittori e non eseguirà `setup-api` o `openclaw.setupEntry` per la ricerca della configurazione. Se un Plugin basato esclusivamente sui descrittori fornisce comunque una di queste voci del runtime di configurazione, OpenClaw segnala una diagnostica aggiuntiva e continua a ignorarla. L'omissione di `requiresRuntime` mantiene il comportamento di fallback legacy, affinché i Plugin esistenti che hanno aggiunto descrittori senza il flag non smettano di funzionare.

Poiché la ricerca della configurazione può eseguire codice `setup-api` di proprietà del Plugin, i valori normalizzati `setup.providers[].id` e `setup.cliBackends[]` devono rimanere univoci tra i Plugin rilevati. In presenza di una proprietà ambigua, l'operazione non riesce in modo sicuro anziché scegliere un vincitore in base all'ordine di rilevamento.

Quando il runtime di configurazione viene eseguito, la diagnostica del registro di configurazione segnala una divergenza dei descrittori se `setup-api` registra un provider o un backend CLI non dichiarato dai descrittori del manifest oppure se un descrittore non dispone di una registrazione runtime corrispondente. Queste diagnostiche sono aggiuntive e non rifiutano i Plugin legacy.

### Riferimento di setup.providers

| Campo          | Obbligatorio | Tipo       | Significato                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sì      | `string`   | Id del provider esposto durante la configurazione o l'onboarding. Mantenere globalmente univoci gli id normalizzati.             |
| `authMethods`  | No       | `string[]` | Id dei metodi di configurazione/autenticazione supportati dal provider senza caricare l'intero runtime.                       |
| `envVars`      | No       | `string[]` | Variabili d'ambiente che le superfici generiche di configurazione/stato possono verificare prima del caricamento del runtime del Plugin.               |
| `authEvidence` | No       | `object[]` | Verifiche leggere delle prove di autenticazione locali per i provider che possono autenticarsi tramite marcatori non segreti. |

`authEvidence` è destinato ai marcatori delle credenziali locali di proprietà del provider che possono essere verificati senza caricare il codice del runtime. Queste verifiche devono rimanere leggere e locali: nessuna chiamata di rete, nessuna lettura dal portachiavi o da gestori di segreti, nessun comando shell e nessuna interrogazione dell'API del provider.

Voci di prova supportate:

| Campo              | Obbligatorio | Tipo       | Significato                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sì      | `string`   | Attualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | No       | `string`   | Variabile d'ambiente contenente il percorso esplicito di un file di credenziali.                                                           |
| `fallbackPaths`    | No       | `string[]` | Percorsi dei file di credenziali locali verificati quando `fileEnvVar` è assente o vuoto. Supporta `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | No       | `string[]` | Almeno una delle variabili d'ambiente elencate deve essere non vuota affinché la prova sia valida.                                    |
| `requiresAllEnv`   | No       | `string[]` | Tutte le variabili d'ambiente elencate devono essere non vuote affinché la prova sia valida.                                           |
| `credentialMarker` | Sì      | `string`   | Marcatore non segreto restituito quando la prova è presente.                                                       |
| `source`           | No       | `string`   | Etichetta della sorgente visibile all'utente per l'output di autenticazione/stato.                                                               |

### Campi di setup

| Campo              | Obbligatorio | Tipo       | Significato                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No       | `object[]` | Descrittori di configurazione dei provider esposti durante la configurazione e l'onboarding.                                     |
| `cliBackends`      | No       | `string[]` | Id dei backend in fase di configurazione usati per la ricerca della configurazione basata innanzitutto sui descrittori. Mantenere globalmente univoci gli id normalizzati. |
| `configMigrations` | No       | `string[]` | Id delle migrazioni della configurazione di proprietà della superficie di configurazione di questo Plugin.                                          |
| `requiresRuntime`  | No       | `boolean`  | Indica se la configurazione necessita ancora dell'esecuzione di `setup-api` dopo la ricerca tramite descrittore.                            |

## Riferimento di uiHints

`uiHints` è una mappa dai nomi dei campi di configurazione a piccoli suggerimenti di rendering. Le chiavi possono usare punti per i campi di configurazione annidati, ma nessun segmento del percorso può essere `__proto__`, `constructor` o `prototype`; la configurazione rifiuta tali nomi.

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

Ogni suggerimento per un campo può includere:

| Campo         | Tipo       | Significato                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente.                |
| `help`        | `string`   | Breve testo di supporto.                      |
| `tags`        | `string[]` | Tag facoltativi dell'interfaccia utente.                       |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.            |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per i campi di immissione dei moduli.       |

## Riferimento di contracts

Usare `contracts` solo per i metadati statici di proprietà delle funzionalità che OpenClaw può leggere senza importare il runtime del Plugin.

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
| `embeddedExtensionFactories`     | `string[]` | ID delle factory di estensioni del server applicativo Codex, attualmente `codex-app-server`.                                                                |
| `agentToolResultMiddleware`      | `string[]` | ID dei runtime per i quali questo plugin può registrare middleware dei risultati degli strumenti.                                                                     |
| `trustedToolPolicies`            | `string[]` | ID locali del plugin delle policy attendibili pre-strumento che un plugin installato può registrare. I plugin inclusi possono registrare policy senza questo campo. |
| `externalAuthProviders`          | `string[]` | ID dei provider di cui questo plugin gestisce l'hook del profilo di autenticazione esterna.                                                                      |
| `embeddingProviders`             | `string[]` | ID dei provider generali di incorporamento gestiti da questo plugin per l'uso riutilizzabile degli incorporamenti vettoriali, inclusa la memoria.                                 |
| `speechProviders`                | `string[]` | ID dei provider vocali gestiti da questo plugin.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione in tempo reale gestiti da questo plugin.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider vocali in tempo reale gestiti da questo plugin.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | ID deprecati dei provider di incorporamento specifici per la memoria gestiti da questo plugin.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider di comprensione dei contenuti multimediali gestiti da questo plugin.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | ID dei provider di origine delle trascrizioni gestiti da questo plugin.                                                                                     |
| `documentExtractors`             | `string[]` | ID dei provider di estrazione da documenti (ad esempio PDF) gestiti da questo plugin.                                                                  |
| `imageGenerationProviders`       | `string[]` | ID dei provider di generazione di immagini gestiti da questo plugin.                                                                                      |
| `videoGenerationProviders`       | `string[]` | ID dei provider di generazione video gestiti da questo plugin.                                                                                      |
| `musicGenerationProviders`       | `string[]` | ID dei provider di generazione musicale gestiti da questo plugin.                                                                                      |
| `webContentExtractors`           | `string[]` | ID dei provider di estrazione dei contenuti delle pagine web gestiti da questo plugin.                                                                           |
| `webFetchProviders`              | `string[]` | ID dei provider di recupero web gestiti da questo plugin.                                                                                             |
| `webSearchProviders`             | `string[]` | ID dei provider di ricerca web gestiti da questo plugin.                                                                                            |
| `workerProviders`                | `string[]` | ID dei provider di worker cloud gestiti da questo plugin per il provisioning e il ciclo di vita dei lease basato sui profili.                                      |
| `usageProviders`                 | `string[]` | ID dei provider di cui questo plugin gestisce gli hook di autenticazione dell'utilizzo e delle istantanee di utilizzo.                                                             |
| `migrationProviders`             | `string[]` | ID dei provider di importazione gestiti da questo plugin per `openclaw migrate`.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Autorizzazione riservata alle route HTTP autenticate dei plugin che inoltrano i metodi del Gateway all'interno del processo.                                  |
| `tools`                          | `string[]` | Nomi degli strumenti dell'agente gestiti da questo plugin.                                                                                                   |

`contracts.embeddedExtensionFactories` viene mantenuto per le factory di estensioni incluse destinate esclusivamente al server applicativo Codex. Le trasformazioni incluse dei risultati degli strumenti devono invece dichiarare `contracts.agentToolResultMiddleware` e registrarsi con `api.registerAgentToolResultMiddleware(...)`. I plugin installati possono utilizzare lo stesso punto di integrazione del middleware solo quando sono abilitati esplicitamente e solo per i runtime dichiarati in `contracts.agentToolResultMiddleware`.

I plugin installati che richiedono il livello di policy pre-strumento considerato attendibile dall'host devono dichiarare ogni ID locale registrato in `contracts.trustedToolPolicies` ed essere abilitati esplicitamente. I plugin inclusi mantengono il percorso esistente delle policy attendibili, ma i plugin installati con ID di policy non dichiarati vengono rifiutati prima della registrazione. Gli ID delle policy sono circoscritti al plugin che li registra, quindi due plugin possono entrambi dichiarare e registrare `workflow-budget`; un singolo plugin non può registrare due volte lo stesso ID locale.

Le registrazioni `api.registerTool(...)` del runtime devono corrispondere a `contracts.tools`. Il rilevamento degli strumenti usa questo elenco per caricare solo i runtime dei plugin che possono gestire gli strumenti richiesti.

I plugin dei provider che implementano `resolveExternalAuthProfiles` devono dichiarare `contracts.externalAuthProviders`; gli hook di autenticazione esterna non dichiarati vengono ignorati.

I plugin dei provider che implementano sia `resolveUsageAuth` sia `fetchUsageSnapshot` devono dichiarare in `contracts.usageProviders` ogni ID di provider rilevato automaticamente. Il rilevamento dell'utilizzo legge questo contratto prima di caricare il codice del runtime, quindi verifica entrambi gli hook dopo aver caricato solo i gestori dichiarati.

I provider generali di incorporamento devono dichiarare `contracts.embeddingProviders` per ogni adattatore registrato con `api.registerEmbeddingProvider(...)`. Utilizzare il contratto generale per la generazione riutilizzabile di vettori, inclusi i provider usati dalla ricerca nella memoria. `contracts.memoryEmbeddingProviders` è una compatibilità deprecata specifica per la memoria e viene mantenuta solo durante la migrazione dei provider esistenti al punto di integrazione generico dei provider di incorporamento.

I provider di worker devono dichiarare ogni ID `api.registerWorkerProvider(...)` in `contracts.workerProviders`. Il core rende persistente l'intento durevole prima di chiamare `provision`; i provider convalidano le proprie impostazioni prima dell'allocazione esterna e le chiamate ripetute con lo stesso ID operazione devono adottare lo stesso lease. Il core rende persistente anche l'istantanea delle impostazioni convalidate e la passa con `leaseId` a `inspect({ leaseId, profile })` e `destroy({ leaseId, profile })`, anche dopo la modifica o la rimozione del profilo denominato. La distruzione è idempotente, l'ispezione restituisce l'unione chiusa degli stati `active` / `destroyed` / `unknown` e il materiale della chiave privata SSH viene referenziato solo tramite `SecretRef`. Gli endpoint SSH sottoposti a provisioning devono includere anche un valore pubblico `hostKey` proveniente dall'output attendibile del provisioning, esattamente nel formato `algorithm base64`, senza nome host né commento, affinché il core possa fissare l'host prima della connessione. I provider che generano riferimenti dinamici alle identità possono implementare l'autorevole `resolveSshIdentity({ leaseId, profile, keyRef })`; i provider che ne sono privi usano il risolutore generico dei segreti del core. Un `unknown` autorevole rende orfano un record locale attivo; dopo una richiesta di distruzione persistente, ne conferma la dismissione.

`contracts.gatewayMethodDispatch` attualmente accetta `"authenticated-request"`. È un controllo di correttezza dell'API per le route HTTP native dei plugin che inoltrano intenzionalmente i metodi del piano di controllo del Gateway all'interno del processo, non una sandbox contro plugin nativi malevoli. Utilizzarlo solo per superfici incluse o dell'operatore sottoposte a verifica rigorosa che richiedono già l'autenticazione HTTP del Gateway. Una route autorizzata rimane raggiungibile mentre l'ammissione del lavoro radice del Gateway è chiusa solo quando dichiara anche `auth: "gateway"` e il valore `gatewayRuntimeScopeSurface: "trusted-operator"` specifico della route; le normali route correlate dello stesso plugin rimangono dietro il confine di ammissione. In questo modo, lo stato di sospensione e la ripresa restano raggiungibili senza concedere all'intero plugin un'esclusione dall'ammissione. Mantenere limitate l'analisi e la definizione della risposta al di fuori dell'inoltro; il lavoro sostanziale o con effetti di modifica deve passare attraverso l'inoltro dei metodi del Gateway, che gestisce l'ammissione e l'applicazione dell'ambito.

## Riferimento di configContracts

Utilizzare `configContracts` per il comportamento di configurazione gestito dal manifest che gli helper generici del core richiedono senza importare il runtime del plugin: rilevamento dei flag pericolosi, destinazioni di migrazione SecretRef e limitazione dei percorsi di configurazione legacy.

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
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | No       | `string[]` | Percorsi di configurazione relativi alla radice che indicano che potrebbero essere applicabili le migrazioni di compatibilità di questo plugin durante la configurazione. Consente alle letture generiche della configurazione del runtime di ignorare tutte le superfici di configurazione del plugin quando la configurazione non fa mai riferimento al plugin.                 |
| `compatibilityRuntimePaths`   | No       | `string[]` | Percorsi di compatibilità relativi alla radice che questo plugin può gestire durante il runtime prima che il codice del plugin sia completamente attivato. Utilizzarli per le superfici legacy che devono restringere gli insiemi di candidati inclusi senza importare il runtime di ogni plugin compatibile. |
| `dangerousFlags`              | No       | `object[]` | Valori letterali di configurazione che `openclaw doctor` deve contrassegnare come non sicuri o pericolosi quando sono abilitati. Vedere di seguito.                                                                                                                                   |
| `secretInputs`                | No       | `object`   | Percorsi di configurazione sotto `plugins.entries.<id>.config` che il registro delle destinazioni di migrazione/verifica SecretRef deve trattare come stringhe con forma di segreto. Vedere di seguito.                                                                                  |

Ogni voce `dangerousFlags` supporta:

| Campo    | Obbligatorio | Tipo                                  | Significato                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Sì      | `string`                              | Percorso di configurazione separato da punti relativo a `plugins.entries.<id>.config`. Supporta i caratteri jolly `*` per i segmenti di mappe/array. |
| `equals` | Sì      | `string \| number \| boolean \| null` | Valore letterale esatto che contrassegna questo valore di configurazione come pericoloso.                                                            |

`secretInputs` supporta:

| Campo                   | Obbligatorio | Tipo       | Significato                                                                                                                                                                                                   |
| ----------------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | No       | `boolean`  | Sostituisce l'abilitazione predefinita del plugin incluso nel determinare se questa superficie SecretRef è attiva. Utilizzarlo quando il plugin è incluso, ma la superficie deve rimanere inattiva finché non viene abilitata esplicitamente nella configurazione. |
| `paths`                 | Sì      | `object[]` | Percorsi di configurazione contenenti segreti, ciascuno con `path` (separato da punti, relativo a `plugins.entries.<id>.config`, supporta i caratteri jolly `*`) e `expected` facoltativo (attualmente solo `"string"`).                            |

## Riferimento di mediaUnderstandingProviderMetadata

Utilizzare `mediaUnderstandingProviderMetadata` quando un provider per la comprensione dei contenuti multimediali dispone di modelli predefiniti, priorità di fallback per l'autenticazione automatica o supporto nativo dei documenti necessari agli helper generici del core prima del caricamento del runtime. Le chiavi devono essere dichiarate anche in `contracts.mediaUnderstandingProviders`.

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

| Campo                  | Tipo                                                             | Significato                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Funzionalità multimediali esposte da questo provider.                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | Valori predefiniti da funzionalità a modello utilizzati quando la configurazione non specifica un modello.                                         |
| `autoPriority`         | `Record<string, number>`                                         | I numeri più bassi vengono ordinati prima per il fallback automatico del provider basato sulle credenziali.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Input di documenti nativi supportati dal provider.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Sostituzioni dei modelli per tipo di documento. Impostare `image: false` per disabilitare l'estrazione basata su immagini per quel tipo di documento. |

## Riferimento di channelConfigs

Utilizzare `channelConfigs` quando un plugin di canale necessita di metadati di configurazione leggeri prima del caricamento del runtime. Il rilevamento in sola lettura della configurazione e dello stato del canale può utilizzare direttamente questi metadati per i canali esterni configurati quando non è disponibile alcuna voce di configurazione o quando `setup.requiresRuntime: false` dichiara che il runtime di configurazione non è necessario.

`channelConfigs` rappresenta i metadati del manifesto del plugin, non una nuova sezione di configurazione utente di primo livello. Gli utenti continuano a configurare le istanze dei canali in `channels.<channel-id>`. OpenClaw legge i metadati del manifesto per determinare quale plugin è proprietario del canale configurato prima dell'esecuzione del codice runtime del plugin.

Per un plugin di canale, `configSchema` e `channelConfigs` descrivono percorsi diversi:

- `configSchema` convalida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` convalida `channels.<channel-id>`

I plugin non inclusi che dichiarano `channels[]` devono dichiarare anche le voci `channelConfigs` corrispondenti. Senza di esse, OpenClaw può comunque caricare il plugin, ma lo schema di configurazione del percorso a freddo, la configurazione e le superfici della Control UI non possono conoscere la struttura delle opzioni di proprietà del canale finché non viene eseguito il runtime del plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e `nativeSkillsAutoEnabled` possono dichiarare valori predefiniti statici `auto` per i controlli della configurazione dei comandi eseguiti prima del caricamento del runtime del canale. I canali inclusi possono inoltre pubblicare gli stessi valori predefiniti tramite `package.json#openclaw.channel.commands`, insieme agli altri metadati del catalogo dei canali di proprietà del pacchetto.

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

| Campo         | Tipo                     | Significato                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce di configurazione del canale dichiarata.         |
| `uiHints`     | `Record<string, object>` | Etichette dell'interfaccia utente, segnaposto e indicazioni sulla sensibilità facoltativi per quella sezione di configurazione del canale.          |
| `label`       | `string`                 | Etichetta del canale integrata nelle superfici di selezione e ispezione quando i metadati del runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                               |
| `commands`    | `object`                 | Valori predefiniti automatici statici per comandi nativi e Skills native, destinati ai controlli di configurazione precedenti al runtime.       |
| `preferOver`  | `string[]`               | ID di plugin legacy o con priorità inferiore che questo canale deve superare nelle superfici di selezione.    |

### Sostituzione di un altro plugin di canale

Utilizzare `preferOver` quando il proprio plugin è il proprietario preferito di un ID canale che può essere fornito anche da un altro plugin. I casi comuni includono un ID plugin rinominato, un plugin autonomo che sostituisce un plugin incluso o un fork mantenuto che conserva lo stesso ID canale per la compatibilità della configurazione.

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

Quando `channels.chat` è configurato, OpenClaw considera sia l'ID canale sia l'ID del plugin preferito. Se il plugin con priorità inferiore è stato selezionato solo perché incluso o abilitato per impostazione predefinita, OpenClaw lo disabilita nella configurazione runtime effettiva, in modo che un solo plugin sia proprietario del canale e dei relativi strumenti. La selezione esplicita dell'utente prevale comunque: se l'utente abilita esplicitamente entrambi i plugin (tramite `plugins.allow` o una configurazione `plugins.entries` sostanziale), OpenClaw conserva tale scelta e segnala la diagnostica relativa alla duplicazione di canali e strumenti anziché modificare silenziosamente l'insieme di plugin richiesto.

Limitare `preferOver` agli ID di plugin che possono realmente fornire lo stesso canale. Non è un campo di priorità generale e non rinomina le chiavi della configurazione utente.

## Riferimento di modelSupport

Utilizzare `modelSupport` quando OpenClaw deve dedurre il plugin del provider da ID modello abbreviati come `gpt-5.6-sol` o `claude-sonnet-4.6` prima del caricamento del runtime del plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica questa precedenza:

- i riferimenti `provider/model` espliciti utilizzano i metadati del manifesto `providers` proprietario
- `modelPatterns` prevalgono su `modelPrefixes`
- se un plugin non incluso e uno incluso corrispondono entrambi, prevale il plugin non incluso
- l'ambiguità residua viene ignorata finché l'utente o la configurazione non specifica un provider

Campi:

| Campo           | Tipo       | Significato                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.                 |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

Le voci `modelPatterns` vengono compilate tramite `compileSafeRegex`, che rifiuta i modelli contenenti ripetizioni annidate (ad esempio `(a+)+$`). I modelli che non superano il controllo di sicurezza vengono ignorati silenziosamente, analogamente alle regex sintatticamente non valide. Mantenere i modelli semplici ed evitare quantificatori annidati.

## Riferimento di modelCatalog

Utilizzare `modelCatalog` quando OpenClaw deve conoscere i metadati dei modelli del provider prima di caricare il runtime del plugin. Questa è la fonte di proprietà del manifesto per le righe fisse del catalogo, gli alias dei provider, le regole di soppressione e la modalità di rilevamento. L'aggiornamento durante il runtime rimane responsabilità del codice runtime del provider, ma il manifesto indica al core quando il runtime è necessario.

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
        "reason": "non disponibile in Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Campi di primo livello:

| Campo            | Tipo                                                     | Significato                                                                                               |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Righe del catalogo per gli ID dei provider di proprietà di questo plugin. Le chiavi devono comparire anche in `providers` al livello superiore.       |
| `aliases`        | `Record<string, object>`                                 | Alias dei provider che devono essere risolti in un provider di proprietà per la pianificazione del catalogo o della soppressione.              |
| `suppressions`   | `object[]`                                               | Righe dei modelli provenienti da un'altra origine che questo plugin sopprime per un motivo specifico del provider.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se il catalogo del provider può essere letto dai metadati del manifest, aggiornato nella cache o richiede il runtime. |
| `runtimeAugment` | `boolean`                                                | Impostare su `true` solo quando il runtime del provider deve aggiungere righe del catalogo dopo la pianificazione del manifest o della configurazione.       |

`aliases` partecipa alla ricerca della proprietà del provider per la pianificazione del catalogo dei modelli. Le destinazioni degli alias devono essere provider di livello superiore di proprietà dello stesso plugin. Quando un elenco filtrato per provider utilizza un alias, OpenClaw può leggere il manifest proprietario e applicare le sostituzioni dell'API e dell'URL di base dell'alias senza caricare il runtime del provider. Gli alias non espandono gli elenchi di catalogo non filtrati; gli elenchi generali emettono solo le righe del provider canonico proprietario.

`suppressions` sostituisce il precedente hook `suppressBuiltInModel` del runtime del provider. Le voci di soppressione vengono rispettate solo quando il provider è di proprietà del plugin o è dichiarato come chiave `modelCatalog.aliases` che punta a un provider di proprietà. Gli hook di soppressione del runtime non vengono più chiamati durante la risoluzione del modello.

Campi del provider:

| Campo                 | Tipo                     | Significato                                                                                                                                                                                                     |
| --------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL di base predefinito facoltativo per i modelli nel catalogo di questo provider.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Adattatore API predefinito facoltativo per i modelli nel catalogo di questo provider.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Intestazioni statiche facoltative applicate al catalogo di questo provider.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | ID facoltativo di un modello piccolo consigliato dal provider per brevi attività di utilità interna (titoli, descrizione dell'avanzamento). Utilizzato quando `agents.defaults.utilityModel` non è impostato e questo provider serve il modello principale dell'agente. |
| `models`              | `object[]`               | Righe dei modelli obbligatorie. Le righe prive di `id` vengono ignorate.                                                                                                                                                            |

Campi del modello:

| Campo              | Tipo                                                           | Significato                                                               |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`               | `string`                                                       | ID del modello locale al provider, senza il prefisso `provider/`.                    |
| `name`             | `string`                                                       | Nome visualizzato facoltativo.                                                      |
| `api`              | `ModelApi`                                                     | Sostituzione facoltativa dell'API per singolo modello.                                            |
| `baseUrl`          | `string`                                                       | Sostituzione facoltativa dell'URL di base per singolo modello.                                       |
| `headers`          | `Record<string, string>`                                       | Intestazioni statiche facoltative per singolo modello.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalità accettate dal modello. Gli altri valori vengono scartati senza avviso.            |
| `reasoning`        | `boolean`                                                      | Indica se il modello espone un comportamento di ragionamento.                               |
| `contextWindow`    | `number`                                                       | Finestra di contesto nativa del provider.                                             |
| `contextTokens`    | `number`                                                       | Limite effettivo facoltativo del contesto di runtime quando differisce da `contextWindow`. |
| `maxTokens`        | `number`                                                       | Numero massimo di token di output, se noto.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Sostituzioni facoltative dell'ID del modello o dei parametri per ciascun livello di elaborazione.                    |
| `cost`             | `object`                                                       | Prezzo facoltativo in USD per milione di token, incluso `tieredPricing` facoltativo. |
| `compat`           | `object`                                                       | Flag di compatibilità facoltativi corrispondenti alla compatibilità della configurazione dei modelli OpenClaw.  |
| `mediaInput`       | `object`                                                       | Configurazione di input facoltativa per modalità, attualmente solo per le immagini.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato di elencazione. Sopprimere solo quando la riga non deve comparire affatto.          |
| `statusReason`     | `string`                                                       | Motivo facoltativo mostrato con uno stato di non disponibilità.                            |
| `replaces`         | `string[]`                                                     | ID precedenti del modello locali al provider sostituiti da questo modello.                       |
| `replacedBy`       | `string`                                                       | ID del modello sostitutivo locale al provider per le righe deprecate.                    |
| `tags`             | `string[]`                                                     | Tag stabili utilizzati dai selettori e dai filtri.                                    |

Campi di soppressione:

| Campo                      | Tipo       | Significato                                                                                             |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID del provider per la riga upstream da sopprimere. Deve essere di proprietà di questo plugin o dichiarato come alias di proprietà. |
| `model`                    | `string`   | ID del modello locale al provider da sopprimere.                                                                      |
| `reason`                   | `string`   | Messaggio facoltativo mostrato quando la riga soppressa viene richiesta direttamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Elenco facoltativo degli host effettivi dell'URL di base del provider richiesti prima che venga applicata la soppressione.               |
| `when.providerConfigApiIn` | `string[]` | Elenco facoltativo dei valori esatti `api` della configurazione del provider richiesti prima che venga applicata la soppressione.              |

Non inserire dati disponibili solo durante il runtime in `modelCatalog`. Utilizzare `static` solo quando le righe del manifest sono sufficientemente complete da consentire agli elenchi filtrati per provider e alle interfacce dei selettori di ignorare il rilevamento del registro o del runtime. Utilizzare `refreshable` quando le righe del manifest costituiscono elementi iniziali o integrativi utili per gli elenchi, ma un aggiornamento o la cache possono aggiungere altre righe in seguito; le righe aggiornabili non sono autorevoli da sole. Utilizzare `runtime` quando OpenClaw deve caricare il runtime del provider per conoscere l'elenco.

## Riferimento di modelIdNormalization

Utilizzare `modelIdNormalization` per la normalizzazione economica degli ID dei modelli di proprietà del provider che deve avvenire prima del caricamento del runtime del provider. In questo modo, alias come i nomi brevi dei modelli, gli ID legacy locali al provider e le regole dei prefissi proxy rimangono nel manifest del plugin proprietario anziché nelle tabelle principali di selezione dei modelli.

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

| Campo                                | Tipo                    | Significato                                                                             |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias esatti degli ID dei modelli senza distinzione tra maiuscole e minuscole. I valori vengono restituiti così come sono scritti.                  |
| `stripPrefixes`                      | `string[]`              | Prefissi da rimuovere prima della ricerca degli alias, utili per le duplicazioni legacy di provider/modello.     |
| `prefixWhenBare`                     | `string`                | Prefisso da aggiungere quando l'ID normalizzato del modello non contiene già `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regole condizionali per i prefissi degli ID senza prefisso dopo la ricerca degli alias, indicizzate da `modelPrefix` e `prefix`. |

## Riferimento di providerEndpoints

Utilizzare `providerEndpoints` per la classificazione degli endpoint che i criteri generici delle richieste devono conoscere prima del caricamento del runtime del provider. Il core mantiene la proprietà del significato di ogni `endpointClass`; i manifest dei plugin mantengono la proprietà dei metadati dell'host e dell'URL di base.

I plugin dei provider ufficialmente esternalizzati sono esclusi dalla distribuzione del core, pertanto
i relativi manifest non sono visibili finché non vengono installati. Anche i relativi `providerEndpoints` devono
essere replicati in `scripts/lib/official-external-provider-catalog.json`, affinché
la classificazione degli endpoint continui a funzionare senza il plugin; un test del contratto
verifica la replica.

Campi dell'endpoint:

| Campo                          | Tipo       | Significato                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe nota di endpoint core, ad esempio `openrouter`, `moonshot-native` o `google-vertex`.        |
| `hosts`                        | `string[]` | Nomi host esatti associati alla classe di endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Suffissi host associati alla classe di endpoint. Aggiungere il prefisso `.` per la corrispondenza basata esclusivamente sul suffisso di dominio. |
| `baseUrls`                     | `string[]` | URL di base HTTP(S) normalizzati esatti associati alla classe di endpoint.                             |
| `googleVertexRegion`           | `string`   | Regione statica di Google Vertex per host globali esatti.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Suffisso da rimuovere dagli host corrispondenti per esporre il prefisso della regione Google Vertex.                 |

## Riferimento providerRequest

Usare `providerRequest` per metadati leggeri sulla compatibilità delle richieste, necessari ai criteri generici delle richieste senza caricare il runtime del provider. Mantenere la riscrittura del payload specifica del comportamento negli hook del runtime del provider o negli helper condivisi della famiglia di provider.

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

| Campo                 | Tipo         | Significato                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etichetta della famiglia di provider usata dalle decisioni generiche sulla compatibilità delle richieste e dalla diagnostica. |
| `compatibilityFamily` | `"moonshot"` | Gruppo facoltativo di compatibilità della famiglia di provider per gli helper condivisi delle richieste.              |
| `openAICompletions`   | `object`     | Flag delle richieste di completamento compatibili con OpenAI, attualmente `supportsStreamingUsage`.       |

## Riferimento secretProviderIntegrations

Usare `secretProviderIntegrations` quando un plugin può pubblicare una preimpostazione riutilizzabile del provider exec SecretRef. OpenClaw legge questi metadati prima del caricamento del runtime del plugin, memorizza la proprietà del plugin in `secrets.providers.<alias>.pluginIntegration` e lascia l'effettiva risoluzione dei segreti al runtime SecretRef. Le preimpostazioni sono esposte solo per i plugin inclusi e per i plugin installati rilevati nelle directory radice gestite di installazione dei plugin, ad esempio le installazioni da git e ClawHub.

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

La chiave della mappa è l'ID dell'integrazione. Se `providerAlias` viene omesso, OpenClaw usa l'ID dell'integrazione come alias del provider SecretRef. Gli alias dei provider devono rispettare il normale schema degli alias dei provider SecretRef, ad esempio `team-secrets` o `onepassword-work`.

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

All'avvio o al ricaricamento, OpenClaw risolve tale provider caricando i metadati correnti del manifest del plugin, verificando che il plugin proprietario sia installato e attivo e materializzando il comando exec dal manifest. La disabilitazione o la rimozione del plugin revoca il provider per i SecretRef attivi. Gli operatori che desiderano una configurazione exec autonoma possono comunque scrivere direttamente provider manuali `command`/`args`.

Attualmente sono supportate solo le preimpostazioni `source: "exec"`. `command` deve essere `${node}` e `args[0]` deve essere uno script di risoluzione `./` relativo alla directory radice del plugin. OpenClaw lo materializza all'avvio o al ricaricamento usando l'eseguibile Node corrente e il percorso assoluto dello script nel plugin. Le opzioni di Node quali `--require`, `--import`, `--loader`, `--env-file`, `--eval` e `--print` non fanno parte del contratto delle preimpostazioni del manifest. Gli operatori che necessitano di comandi non Node possono configurare direttamente provider exec manuali autonomi.

OpenClaw ricava `trustedDirs` per le preimpostazioni del manifest dalla directory radice del plugin e, per le preimpostazioni `${node}`, dalla directory dell'eseguibile Node corrente. Gli `trustedDirs` definiti nel manifest vengono ignorati. Le altre opzioni del provider exec, quali `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` e `allowInsecurePath`, vengono trasmesse alla normale configurazione del provider exec SecretRef.

## Riferimento modelPricing

Usare `modelPricing` quando un provider necessita del comportamento dei prezzi del piano di controllo prima del caricamento del runtime. La cache dei prezzi del Gateway legge questi metadati senza importare il codice del runtime del provider.

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

| Campo        | Tipo              | Significato                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Impostare `false` per i provider locali o self-hosted che non devono mai recuperare i prezzi da OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Mappatura della ricerca dei prezzi di OpenRouter. `false` disabilita la ricerca in OpenRouter per questo provider.           |
| `liteLLM`    | `false \| object` | Mappatura della ricerca dei prezzi di LiteLLM. `false` disabilita la ricerca in LiteLLM per questo provider.                 |

Campi dell'origine:

| Campo                      | Tipo               | Significato                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID del provider del catalogo esterno quando differisce dall'ID del provider OpenClaw, ad esempio `z-ai` per un provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Considera gli ID modello contenenti barre come riferimenti provider/modello annidati, utile per provider proxy come OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Varianti aggiuntive degli ID modello del catalogo esterno. `version-dots` prova gli ID di versione con punti, come `claude-opus-4.6`.            |

### Indice dei provider OpenClaw

L'Indice dei provider OpenClaw è costituito da metadati di anteprima di proprietà di OpenClaw per provider i cui plugin potrebbero non essere ancora installati. Non fa parte del manifest di un plugin. I manifest dei plugin restano la fonte autorevole per i plugin installati. L'Indice dei provider è il contratto di fallback interno che verrà utilizzato dalle future interfacce per provider installabili e dalla selezione dei modelli prima dell'installazione quando un plugin del provider non è installato.

Ordine di autorità del catalogo:

1. Configurazione utente.
2. Manifest del plugin installato `modelCatalog`.
3. Cache del catalogo dei modelli da aggiornamento esplicito.
4. Righe di anteprima dell'Indice dei provider OpenClaw.

L'Indice dei provider non deve contenere segreti, stato di abilitazione, hook di runtime o dati dei modelli specifici di account attivi. I relativi cataloghi di anteprima usano la stessa struttura delle righe del provider `modelCatalog` dei manifest dei plugin, ma devono rimanere limitati a metadati di visualizzazione stabili, a meno che campi dell'adattatore di runtime quali `api`, `baseUrl`, prezzi o flag di compatibilità non vengano intenzionalmente mantenuti allineati con il manifest del plugin installato. I provider con rilevamento `/models` attivo devono scrivere le righe aggiornate tramite il percorso esplicito della cache del catalogo dei modelli, anziché fare in modo che la normale elencazione o l'onboarding chiamino le API dei provider.

Le voci dell'Indice dei provider possono anche includere metadati dei plugin installabili per provider il cui plugin è stato spostato fuori dal core o non è ancora installato per altri motivi. Questi metadati rispecchiano lo schema del catalogo dei canali: il nome del pacchetto, la specifica di installazione npm, l'integrità prevista e semplici etichette per le opzioni di autenticazione sono sufficienti per mostrare un'opzione di configurazione installabile. Una volta installato il plugin, il relativo manifest prevale e la voce dell'Indice dei provider viene ignorata per quel provider.

`openclaw doctor --fix` migra un insieme piccolo e chiuso di chiavi di funzionalità legacy di primo livello del manifest in `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` e `tools`. Nessuna di queste, né qualsiasi altro elenco di funzionalità, viene più letta come campo di primo livello del manifest; il normale caricamento del manifest le riconosce solo sotto `contracts`.

## Manifest rispetto a package.json

I due file svolgono funzioni diverse:

| File                   | Utilizzarlo per                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Rilevamento, convalida della configurazione, metadati delle opzioni di autenticazione e suggerimenti per l'interfaccia utente che devono esistere prima dell'esecuzione del codice del plugin                         |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per punti di ingresso, controllo dell'installazione, configurazione o metadati del catalogo |

In caso di dubbi su dove collocare un elemento di metadati, applicare questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, inserirlo in `openclaw.plugin.json`
- se riguarda la creazione del pacchetto, i file di ingresso o il comportamento dell'installazione npm, inserirlo in `package.json`

### Campi di package.json che influiscono sul rilevamento

Alcuni metadati dei plugin precedenti al runtime risiedono intenzionalmente in `package.json`, nel blocco `openclaw`, anziché in `openclaw.plugin.json`. `openclaw.bundle` e `openclaw.bundle.json` non sono contratti dei plugin OpenClaw; i plugin nativi devono usare `openclaw.plugin.json` insieme ai campi `package.json#openclaw` supportati riportati di seguito.

Esempi importanti:

| Campo                                                                                      | Significato                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Dichiara gli entrypoint nativi del plugin. Devono rimanere all'interno della directory del pacchetto del plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Dichiara gli entrypoint compilati del runtime JavaScript per i pacchetti installati. Devono rimanere all'interno della directory del pacchetto del plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Entrypoint leggero riservato alla configurazione, usato durante l'onboarding, l'avvio differito del canale e il rilevamento in sola lettura dello stato del canale e dei SecretRef. Deve rimanere all'interno della directory del pacchetto del plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Dichiara l'entrypoint compilato di configurazione JavaScript per i pacchetti installati. Richiede `setupEntry`, deve esistere e deve rimanere all'interno della directory del pacchetto del plugin.                         |
| `openclaw.channel`                                                                         | Metadati leggeri del catalogo dei canali, come etichette, percorsi della documentazione, alias e testo di selezione.                                                                                                 |
| `openclaw.channel.commands`                                                                | Metadati statici dei comandi nativi e delle impostazioni predefinite automatiche delle skill native, usati dalle superfici di configurazione, controllo e elenco dei comandi prima del caricamento del runtime del canale.                                          |
| `openclaw.channel.configuredState`                                                         | Metadati leggeri del controllo dello stato configurato, in grado di rispondere alla domanda «esiste già una configurazione basata esclusivamente sulle variabili d'ambiente?» senza caricare l'intero runtime del canale.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadati leggeri del controllo dell'autenticazione persistente, in grado di rispondere alla domanda «è già stato effettuato un accesso?» senza caricare l'intero runtime del canale.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicazioni per l'installazione e l'aggiornamento dei plugin inclusi e pubblicati esternamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Percorso di installazione preferito quando sono disponibili più origini di installazione.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Versione minima supportata dell'host OpenClaw, espressa come limite inferiore semver, ad esempio `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.compat.pluginApi`                                                                | Intervallo minimo dell'API dei plugin OpenClaw richiesto da questo pacchetto, espresso come limite inferiore semver, ad esempio `>=2026.5.27`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | Stringa di integrità npm prevista, ad esempio `sha512-...`; i flussi di installazione e aggiornamento verificano l'artefatto recuperato rispetto a tale stringa.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Consente un percorso di ripristino circoscritto per la reinstallazione di un plugin incluso quando la configurazione non è valida.                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Alias di pacchetti npm che devono essere materializzati quando i relativi vincoli di piattaforma nel lockfile corrispondono all'host corrente.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Consente il caricamento delle superfici del canale del runtime di configurazione prima dell'ascolto, rinviando poi il plugin del canale configurato completo fino all'attivazione successiva all'ascolto.                                                 |

I metadati del manifest determinano quali opzioni di provider, canale e configurazione vengono visualizzate nell'onboarding prima del caricamento del runtime. `package.json#openclaw.install` indica all'onboarding come recuperare o abilitare il plugin quando viene selezionata una di queste opzioni. Non spostare le indicazioni di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del registro dei manifest per le origini dei plugin non inclusi. I valori non validi vengono rifiutati; i valori più recenti ma validi fanno sì che i plugin esterni vengano ignorati sugli host meno recenti. Si presume che i plugin di origine inclusi abbiano la stessa versione del checkout dell'host.

`openclaw.install.requiredPlatformPackages` è destinato ai pacchetti npm che espongono i binari nativi richiesti tramite alias facoltativi specifici per piattaforma. Elencare il nome semplice del pacchetto npm per ogni alias di piattaforma supportato. Durante l'installazione npm, OpenClaw verifica esclusivamente l'alias dichiarato i cui vincoli nel lockfile corrispondono all'host corrente. Se npm segnala l'esito positivo ma omette tale alias, OpenClaw riprova una volta con una cache nuova e annulla l'installazione se l'alias risulta ancora mancante.

`openclaw.compat.pluginApi` viene applicato durante l'installazione dei pacchetti per le origini dei plugin non inclusi. Utilizzarlo per indicare il limite inferiore dell'API SDK/runtime dei plugin OpenClaw rispetto al quale è stato compilato il pacchetto. Può essere più restrittivo di `minHostVersion` quando un pacchetto plugin richiede un'API più recente, ma mantiene un'indicazione di installazione inferiore per altri flussi. Per impostazione predefinita, la sincronizzazione delle versioni ufficiali di OpenClaw aggiorna i limiti inferiori esistenti delle API dei plugin ufficiali alla versione di OpenClaw, ma le versioni relative esclusivamente ai plugin possono mantenere un limite inferiore quando il pacchetto supporta intenzionalmente host meno recenti. Non utilizzare soltanto la versione del pacchetto come contratto di compatibilità. `peerDependencies.openclaw` rimane un metadato del pacchetto npm; OpenClaw utilizza il contratto `openclaw.compat.pluginApi` per le decisioni sulla compatibilità dell'installazione.

I metadati ufficiali per l'installazione su richiesta devono utilizzare `clawhubSpec` quando il plugin è pubblicato su ClawHub; l'onboarding considera questa l'origine remota preferita e registra i dati dell'artefatto ClawHub dopo l'installazione. `npmSpec` rimane il ripiego di compatibilità per i pacchetti che non sono ancora passati a ClawHub.

Il blocco a una versione npm esatta è già definito in `npmSpec`, ad esempio `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci ufficiali del catalogo esterno devono associare le specifiche esatte a `expectedIntegrity`, affinché i flussi di aggiornamento si interrompano in modo sicuro se l'artefatto npm recuperato non corrisponde più alla versione bloccata. Per compatibilità, l'onboarding interattivo continua a proporre specifiche npm provenienti da registri attendibili, inclusi nomi semplici di pacchetti e dist-tag. La diagnostica del catalogo è in grado di distinguere origini esatte, mobili, bloccate tramite integrità, prive di integrità, con nome del pacchetto non corrispondente e con scelta predefinita non valida. Inoltre, genera un avviso quando `expectedIntegrity` è presente ma non esiste un'origine npm valida a cui possa essere associato. Quando `expectedIntegrity` è presente, i flussi di installazione e aggiornamento lo applicano; quando viene omesso, la risoluzione del registro viene registrata senza un vincolo di integrità.

I plugin dei canali devono fornire `openclaw.setupEntry` quando le scansioni dello stato, dell'elenco dei canali o dei SecretRef devono identificare gli account configurati senza caricare l'intero runtime. L'entrypoint di configurazione deve esporre i metadati del canale insieme agli adattatori di configurazione, stato e segreti sicuri per la configurazione; mantenere i client di rete, i listener del Gateway e i runtime di trasporto nell'entrypoint principale dell'estensione.

I campi degli entrypoint del runtime non sostituiscono i controlli dei limiti del pacchetto per i campi degli entrypoint del codice sorgente. Ad esempio, `openclaw.runtimeExtensions` non può rendere caricabile un percorso `openclaw.extensions` che fuoriesce dal pacchetto.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente circoscritto. Non rende installabili configurazioni non valide arbitrarie. Attualmente consente ai flussi di installazione di recuperare soltanto da specifici errori obsoleti di aggiornamento dei plugin inclusi, ad esempio un percorso mancante di un plugin incluso o una voce `channels.<id>` obsoleta per lo stesso plugin incluso. Gli errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori a `openclaw doctor --fix`.

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

Utilizzarlo quando i flussi di configurazione, Doctor, stato o verifica della presenza in sola lettura richiedono un controllo di autenticazione sì/no poco oneroso prima del caricamento del plugin completo del canale. Lo stato di autenticazione persistente non corrisponde allo stato configurato del canale: non utilizzare questi metadati per abilitare automaticamente i plugin, riparare le dipendenze del runtime o decidere se caricare il runtime di un canale. L'esportazione di destinazione deve essere una piccola funzione che legge esclusivamente lo stato persistente; non instradarla tramite il barrel completo del runtime del canale.

`openclaw.channel.configuredState` supporta controlli poco onerosi della configurazione. Preferire metadati dichiarativi delle variabili d'ambiente quando queste sono sufficienti:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Utilizzare `env.allOf` quando sono richieste tutte le variabili elencate e `env.anyOf` quando è sufficiente una qualsiasi variabile non vuota. Se un piccolo controllo non relativo al runtime richiede più dei metadati delle variabili d'ambiente, utilizzare `specifier` insieme a `exportName`, come mostrato per `persistedAuthState`; quando `env` è presente, OpenClaw lo utilizza senza caricare tale modulo. Se il controllo richiede la risoluzione completa della configurazione o il runtime effettivo del canale, mantenere tale logica nell'hook `config.hasConfiguredState` del plugin.

## Precedenza del rilevamento (ID dei plugin duplicati)

OpenClaw rileva i plugin da tre radici, controllate in questo ordine: i plugin inclusi distribuiti con OpenClaw, la radice di installazione globale (`~/.openclaw/extensions`) e la radice dello spazio di lavoro corrente (`<workspace>/.openclaw/extensions`), oltre alle eventuali voci esplicite `plugins.load.paths`.

Se due elementi rilevati condividono lo stesso `id`, viene mantenuto soltanto il manifest con la **precedenza più alta**; i duplicati con precedenza inferiore vengono eliminati anziché essere caricati insieme a esso. Precedenza, dalla più alta alla più bassa:

1. **Selezionato dalla configurazione** — un percorso bloccato esplicitamente in `plugins.entries.<id>`
2. **Installazione globale corrispondente a un record di installazione monitorato** — un plugin installato tramite `openclaw plugin install`/`openclaw plugin update` che il monitoraggio delle installazioni di OpenClaw riconosce per lo stesso ID, anche quando l'ID appartiene anche a un plugin incluso
3. **Incluso** — plugin distribuiti con OpenClaw
4. **Spazio di lavoro** — plugin rilevati relativamente allo spazio di lavoro corrente
5. Qualsiasi altro candidato rilevato

Implicazioni:

- Una copia derivata o obsoleta di un plugin incluso, presente senza essere monitorata nello spazio di lavoro o nella radice globale, non sostituirà la compilazione inclusa.
- Per sostituire un plugin incluso, eseguire `openclaw plugin install` per tale ID affinché l'installazione globale monitorata abbia precedenza sulla copia inclusa, oppure bloccare un percorso specifico tramite `plugins.entries.<id>` affinché prevalga grazie alla precedenza della selezione tramite configurazione.
- Le eliminazioni dei duplicati vengono registrate, affinché Doctor e la diagnostica di avvio possano indicare la copia scartata.
- Le sostituzioni dei duplicati selezionate dalla configurazione vengono descritte nella diagnostica come sostituzioni esplicite, ma generano comunque un avviso affinché le derivazioni obsolete e le sostituzioni accidentali rimangano visibili.

## Requisiti dello schema JSON

- **Ogni plugin deve includere un JSON Schema**, anche se non accetta alcuna configurazione.
- È accettabile uno schema vuoto (ad esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono convalidati durante la lettura/scrittura della configurazione, non in fase di runtime.
- Quando si estende o si crea un fork di un plugin incluso aggiungendo nuove chiavi di configurazione, aggiornare contemporaneamente anche `openclaw.plugin.json` `configSchema` del plugin. Gli schemi dei plugin inclusi sono rigorosi, quindi l'aggiunta di `plugins.entries.<id>.config.myNewKey` nella configurazione utente senza aggiungere `myNewKey` a `configSchema.properties` verrà rifiutata prima del caricamento del runtime del plugin.

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

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'ID del canale non sia dichiarato dal manifesto di un plugin. Se lo stesso ID compare anche in `plugins.allow`, `plugins.entries` o `plugins.installs` (un plugin a cui si fa riferimento ma che al momento non è rilevabile), OpenClaw lo declassa invece a **avviso**.
- `plugins.entries.<id>`, `plugins.allow` e `plugins.deny` che fanno riferimento a ID di plugin sconosciuti generano **avvisi** ("voce di configurazione obsoleta ignorata"), non errori, in modo che gli aggiornamenti e i plugin rimossi o rinominati non impediscano l'avvio del Gateway.
- `plugins.slots.memory` che fa riferimento a un ID di plugin sconosciuto genera un **errore**, fatta eccezione per il noto plugin esterno ufficiale `memory-lancedb`, che genera invece un avviso.
- Se un plugin è installato ma ha un manifesto o uno schema danneggiato o mancante, la convalida non riesce e Doctor segnala l'errore del plugin.
- Se esiste una configurazione del plugin ma il plugin è **disabilitato**, la configurazione viene mantenuta e viene mostrato un **avviso** in Doctor e nei log.

Consultare il [riferimento della configurazione](/it/gateway/configuration) per lo schema `plugins.*` completo.

## Note

- Il manifesto è **obbligatorio per i plugin nativi di OpenClaw**, inclusi i caricamenti dal file system locale. Il runtime carica comunque separatamente il modulo del plugin; il manifesto serve solo per il rilevamento e la convalida.
- I manifesti nativi vengono analizzati con JSON5, quindi sono accettati commenti, virgole finali e chiavi senza virgolette, purché il valore finale sia comunque un oggetto.
- Il caricatore del manifesto legge solo i campi documentati del manifesto. Evitare chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un plugin non ne ha bisogno.
- `providerCatalogEntry` deve rimanere leggero e non dovrebbe importare ampie porzioni di codice del runtime; utilizzarlo per i metadati statici del catalogo dei provider o per descrittori di rilevamento circoscritti, non per l'esecuzione al momento della richiesta.
- I tipi di plugin esclusivi vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` mediante `plugins.slots.memory` (valore predefinito `memory-core`), `kind: "context-engine"` mediante `plugins.slots.contextEngine` (valore predefinito `legacy`).
- Dichiarare il tipo di plugin esclusivo in questo manifesto. `OpenClawPluginDefinition.kind` della voce di runtime è deprecato e rimane solo come meccanismo di compatibilità per i plugin meno recenti.
- I metadati delle variabili di ambiente (`setup.providers[].envVars`, `providerAuthEnvVars` deprecato e `channelEnvVars`) sono esclusivamente dichiarativi. Stato, controllo, convalida della consegna Cron e altre superfici di sola lettura applicano comunque i criteri di attendibilità del plugin e di attivazione effettiva prima di considerare configurata una variabile di ambiente.
- Per i metadati della procedura guidata di runtime che richiedono il codice del provider, consultare gli [hook di runtime del provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il plugin dipende da moduli nativi, documentare i passaggi di compilazione ed eventuali requisiti relativi all'elenco di elementi consentiti del gestore di pacchetti (ad esempio, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Contenuti correlati

<CardGroup cols={3}>
  <Card title="Creazione di plugin" href="/it/plugins/building-plugins" icon="rocket">
    Introduzione ai plugin.
  </Card>
  <Card title="Architettura dei plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello delle funzionalità.
  </Card>
  <Card title="Panoramica dell'SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento dell'SDK dei plugin e importazioni da sottopercorsi.
  </Card>
</CardGroup>
