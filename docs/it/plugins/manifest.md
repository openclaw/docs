---
read_when:
    - Stai creando un Plugin OpenClaw
    - Devi distribuire uno schema di configurazione del Plugin o eseguire il debug degli errori di validazione del Plugin
summary: Requisiti del manifesto del Plugin + schema JSON (validazione rigorosa della configurazione)
title: Manifesto del Plugin
x-i18n:
    generated_at: "2026-05-02T20:48:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Questa pagina è solo per il **manifest del Plugin nativo di OpenClaw**.

Per i layout dei bundle compatibili, consulta [bundle di Plugin](/it/plugins/bundles).

I formati di bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito dei componenti Claude
  senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche quei layout di bundle, ma non vengono convalidati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le radici
dichiarate delle skill, le radici dei comandi Claude, i valori predefiniti di `settings.json`
del bundle Claude, i valori predefiniti LSP del bundle Claude e i pacchetti di hook supportati quando il layout corrisponde
alle aspettative del runtime di OpenClaw.

Ogni Plugin nativo di OpenClaw **deve** includere un file `openclaw.plugin.json` nella
**radice del plugin**. OpenClaw usa questo manifest per convalidare la configurazione
**senza eseguire il codice del plugin**. I manifest mancanti o non validi vengono trattati come
errori del plugin e bloccano la convalida della configurazione.

Consulta la guida completa al sistema di plugin: [Plugin](/it/tools/plugin).
Per il modello di capability nativo e le indicazioni attuali sulla compatibilità esterna:
[Modello di capability](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge **prima di caricare il codice del
plugin**. Tutto quanto segue deve essere abbastanza leggero da poter essere ispezionato senza avviare
il runtime del plugin.

**Usalo per:**

- identità del plugin, convalida della configurazione e suggerimenti per l'interfaccia di configurazione
- metadati di autenticazione, onboarding e configurazione iniziale (alias, abilitazione automatica, variabili di ambiente del provider, scelte di autenticazione)
- suggerimenti di attivazione per le superfici del control plane
- proprietà abbreviata della famiglia di modelli
- snapshot statici della proprietà delle capability (`contracts`)
- metadati del runner QA che l'host condiviso `openclaw qa` può ispezionare
- metadati di configurazione specifici del canale uniti nelle superfici di catalogo e convalida

**Non usarlo per:** registrare comportamenti di runtime, dichiarare entrypoint del codice
o metadati di installazione npm. Questi appartengono al codice del plugin e a `package.json`.

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

| Campo                                | Obbligatorio | Tipo                             | Che cosa significa                                                                                                                                                                                                                  |
| ------------------------------------ | ------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì           | `string`                         | ID canonico del plugin. Questo è l'ID usato in `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Sì           | `object`                         | JSON Schema inline per la configurazione di questo plugin.                                                                                                                                                                          |
| `enabledByDefault`                   | No           | `true`                           | Contrassegna un plugin incluso come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita.                          |
| `legacyPluginIds`                    | No           | `string[]`                       | ID legacy che vengono normalizzati in questo ID canonico del plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                       | ID provider che dovrebbero abilitare automaticamente questo plugin quando autenticazione, configurazione o riferimenti ai modelli li menzionano.                                                                                     |
| `kind`                               | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo di plugin esclusivo usato da `plugins.slots.*`.                                                                                                                                                                    |
| `channels`                           | No           | `string[]`                       | ID canale di proprietà di questo plugin. Usati per la scoperta e la convalida della configurazione.                                                                                                                                 |
| `providers`                          | No           | `string[]`                       | ID provider di proprietà di questo plugin.                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | No           | `string`                         | Percorso del modulo leggero di scoperta provider, relativo alla radice del plugin, per metadati del catalogo provider con ambito manifest che possono essere caricati senza attivare l'intero runtime del plugin.                   |
| `modelSupport`                       | No           | `object`                         | Metadati abbreviati, di proprietà del manifest, sulla famiglia di modelli usati per caricare automaticamente il plugin prima del runtime.                                                                                            |
| `modelCatalog`                       | No           | `object`                         | Metadati dichiarativi del catalogo modelli per i provider di proprietà di questo plugin. Questo è il contratto del piano di controllo per future liste di sola lettura, onboarding, selettori di modelli, alias e soppressione senza caricare il runtime del plugin. |
| `modelPricing`                       | No           | `object`                         | Criterio di ricerca prezzi esterno di proprietà del provider. Usalo per escludere provider locali/self-hosted dai cataloghi prezzi remoti o per mappare riferimenti provider a ID catalogo OpenRouter/LiteLLM senza codificare ID provider nel core. |
| `modelIdNormalization`               | No           | `object`                         | Pulizia di alias/prefissi degli ID modello di proprietà del provider che deve essere eseguita prima del caricamento del runtime del provider.                                                                                        |
| `providerEndpoints`                  | No           | `object[]`                       | Metadati host/baseUrl degli endpoint, di proprietà del manifest, per le route provider che il core deve classificare prima del caricamento del runtime del provider.                                                                 |
| `providerRequest`                    | No           | `object`                         | Metadati leggeri su famiglia provider e compatibilità delle richieste usati dai criteri generici di richiesta prima del caricamento del runtime del provider.                                                                       |
| `cliBackends`                        | No           | `string[]`                       | ID backend di inferenza CLI di proprietà di questo plugin. Usati per l'attivazione automatica all'avvio da riferimenti espliciti nella configurazione.                                                                               |
| `syntheticAuthRefs`                  | No           | `string[]`                       | Riferimenti a provider o backend CLI il cui hook di autenticazione sintetica di proprietà del plugin dovrebbe essere sondato durante la scoperta a freddo dei modelli prima del caricamento del runtime.                            |
| `nonSecretAuthMarkers`               | No           | `string[]`                       | Valori segnaposto di chiavi API di proprietà del plugin incluso che rappresentano uno stato di credenziali non segreto locale, OAuth o ambientale.                                                                                   |
| `commandAliases`                     | No           | `object[]`                       | Nomi di comandi di proprietà di questo plugin che dovrebbero produrre diagnostica di configurazione e CLI consapevole del plugin prima del caricamento del runtime.                                                                  |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`       | Metadati env di compatibilità deprecati per la ricerca di autenticazione/stato provider. Preferisci `setup.providers[].envVars` per i nuovi plugin; OpenClaw li legge ancora durante la finestra di deprecazione.                   |
| `providerAuthAliases`                | No           | `Record<string, string>`         | ID provider che dovrebbero riusare un altro ID provider per la ricerca dell'autenticazione, per esempio un provider di coding che condivide la chiave API e i profili di autenticazione del provider di base.                        |
| `channelEnvVars`                     | No           | `Record<string, string[]>`       | Metadati env leggeri del canale che OpenClaw può ispezionare senza caricare codice del plugin. Usali per la configurazione del canale guidata da env o per superfici di autenticazione che gli helper generici di avvio/configurazione dovrebbero vedere. |
| `providerAuthChoices`                | No           | `object[]`                       | Metadati leggeri sulle scelte di autenticazione per selettori di onboarding, risoluzione del provider preferito e semplice cablaggio dei flag CLI.                                                                                   |
| `activation`                         | No           | `object`                         | Metadati leggeri del pianificatore di attivazione per caricamento attivato da avvio, provider, comando, canale, route e capability. Solo metadati; il runtime del plugin resta proprietario del comportamento effettivo.             |
| `setup`                              | No           | `object`                         | Descrittori leggeri di configurazione/onboarding che le superfici di scoperta e configurazione possono ispezionare senza caricare il runtime del plugin.                                                                            |
| `qaRunners`                          | No           | `object[]`                       | Descrittori leggeri di runner QA usati dall'host condiviso `openclaw qa` prima del caricamento del runtime del plugin.                                                                                                             |
| `contracts`                          | No           | `object`                         | Snapshot statico della proprietà delle capability per hook di autenticazione esterni, voce, trascrizione in tempo reale, voce in tempo reale, comprensione dei media, generazione di immagini, generazione musicale, generazione video, web-fetch, ricerca web e proprietà degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No           | `Record<string, object>`         | Valori predefiniti leggeri di comprensione dei media per gli ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                      |
| `imageGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati leggeri di autenticazione per la generazione di immagini per gli ID provider dichiarati in `contracts.imageGenerationProviders`, inclusi alias di autenticazione di proprietà del provider e guardie base-url.             |
| `videoGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati leggeri di autenticazione per la generazione video per gli ID provider dichiarati in `contracts.videoGenerationProviders`, inclusi alias di autenticazione di proprietà del provider e guardie base-url.                    |
| `musicGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati leggeri di autenticazione per la generazione musicale per gli ID provider dichiarati in `contracts.musicGenerationProviders`, inclusi alias di autenticazione di proprietà del provider e guardie base-url.                 |
| `toolMetadata`                       | No           | `Record<string, object>`         | Metadati leggeri di disponibilità per strumenti di proprietà del plugin dichiarati in `contracts.tools`. Usali quando uno strumento non dovrebbe caricare il runtime a meno che esistano prove di configurazione, env o autenticazione. |
| `channelConfigs`                     | No           | `Record<string, object>`         | Metadati di configurazione canale di proprietà del manifest uniti alle superfici di scoperta e convalida prima del caricamento del runtime.                                                                                         |
| `skills`                             | No           | `string[]`                       | Directory Skills da caricare, relative alla radice del plugin.                                                                                                                                                                      |
| `name`                               | No           | `string`                         | Nome del plugin leggibile da persone.                                                                                                                                                                                              |
| `description`                        | No       | `string`                         | Breve riepilogo mostrato nelle superfici del Plugin.                                                                                                                                                                                |
| `version`                            | No       | `string`                         | Versione informativa del Plugin.                                                                                                                                                                                                    |
| `uiHints`                            | No       | `Record<string, object>`         | Etichette dell'interfaccia utente, segnaposto e indicazioni di sensibilità per i campi di configurazione.                                                                                                                           |

## Riferimento dei metadati del provider di generazione

I campi dei metadati del provider di generazione descrivono segnali di autenticazione statici per i
provider dichiarati nell'elenco `contracts.*GenerationProviders` corrispondente.
OpenClaw legge questi campi prima del caricamento del runtime del provider, così gli strumenti core possono
decidere se un provider di generazione è disponibile senza importare ogni
provider plugin.

Usa questi campi solo per fatti dichiarativi ed economici. Trasporto, trasformazioni delle richieste,
aggiornamento dei token, convalida delle credenziali e comportamento effettivo di generazione
rimangono nel runtime del plugin.

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

| Campo           | Obbligatorio | Tipo       | Significato                                                                                                                       |
| --------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | No           | `string[]` | ID provider aggiuntivi che devono valere come alias di autenticazione statici per il provider di generazione.                     |
| `authProviders` | No           | `string[]` | ID provider i cui profili di autenticazione configurati devono valere come autenticazione per questo provider di generazione.      |
| `configSignals` | No           | `object[]` | Segnali di disponibilità economici basati solo sulla configurazione per provider locali o self-hosted configurabili senza profili di autenticazione o variabili di ambiente. |
| `authSignals`   | No           | `object[]` | Segnali di autenticazione espliciti. Quando presenti, sostituiscono il set di segnali predefinito derivato dall'ID provider, da `aliases` e da `authProviders`. |

Ogni voce `configSignals` supporta:

| Campo         | Obbligatorio | Tipo       | Significato                                                                                                                                                                           |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sì           | `string`   | Percorso puntato all'oggetto di configurazione posseduto dal plugin da ispezionare, per esempio `plugins.entries.example.config`.                                                     |
| `overlayPath` | No           | `string`   | Percorso puntato all'interno della configurazione radice il cui oggetto deve sovrapporsi all'oggetto radice prima di valutare il segnale. Usalo per configurazioni specifiche di capability come `image`, `video` o `music`. |
| `required`    | No           | `string[]` | Percorsi puntati all'interno della configurazione effettiva che devono avere valori configurati. Le stringhe non devono essere vuote; oggetti e array non devono essere vuoti.        |
| `requiredAny` | No           | `string[]` | Percorsi puntati all'interno della configurazione effettiva in cui almeno uno deve avere un valore configurato.                                                                        |
| `mode`        | No           | `object`   | Guardia opzionale della modalità stringa all'interno della configurazione effettiva. Usala quando la disponibilità basata solo sulla configurazione si applica solo a una modalità.   |

Ogni guardia `mode` supporta:

| Campo        | Obbligatorio | Tipo       | Significato                                                                      |
| ------------ | ------------ | ---------- | -------------------------------------------------------------------------------- |
| `path`       | No           | `string`   | Percorso puntato all'interno della configurazione effettiva. Il valore predefinito è `mode`. |
| `default`    | No           | `string`   | Valore della modalità da usare quando la configurazione omette il percorso.      |
| `allowed`    | No           | `string[]` | Se presente, il segnale passa solo quando la modalità effettiva è uno di questi valori. |
| `disallowed` | No           | `string[]` | Se presente, il segnale fallisce quando la modalità effettiva è uno di questi valori. |

Ogni voce `authSignals` supporta:

| Campo             | Obbligatorio | Tipo     | Significato                                                                                                                                                                 |
| ----------------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì           | `string` | ID provider da controllare nei profili di autenticazione configurati.                                                                                                       |
| `providerBaseUrl` | No           | `object` | Guardia opzionale che fa contare il segnale solo quando il provider configurato di riferimento usa un URL di base consentito. Usala quando un alias di autenticazione è valido solo per determinate API. |

Ogni guardia `providerBaseUrl` supporta:

| Campo             | Obbligatorio | Tipo       | Significato                                                                                                                                        |
| ----------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì           | `string`   | ID configurazione provider il cui `baseUrl` deve essere controllato.                                                                               |
| `defaultBaseUrl`  | No           | `string`   | URL di base da assumere quando la configurazione del provider omette `baseUrl`.                                                                    |
| `allowedBaseUrls` | Sì           | `string[]` | URL di base consentiti per questo segnale di autenticazione. Il segnale viene ignorato quando l'URL di base configurato o predefinito non corrisponde a uno di questi valori normalizzati. |

## Riferimento dei metadati degli strumenti

`toolMetadata` usa le stesse forme `configSignals` e `authSignals` dei
metadati del provider di generazione, indicizzate per nome dello strumento. `contracts.tools` dichiara
la proprietà. `toolMetadata` dichiara prove di disponibilità economiche, così OpenClaw può
evitare di importare un runtime plugin solo per far restituire `null` alla sua factory dello strumento.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
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
carica il plugin proprietario quando il contratto dello strumento corrisponde alla policy. Per strumenti
hot-path la cui factory dipende da autenticazione/configurazione, gli autori di plugin dovrebbero dichiarare
`toolMetadata` invece di far importare al core il runtime per interrogare.

## Riferimento providerAuthChoices

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima del caricamento del runtime del provider.
Gli elenchi di configurazione dei provider usano queste scelte del manifesto, le scelte di configurazione
derivate dal descrittore e i metadati del catalogo di installazione senza caricare il runtime del provider.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                            |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | Sì           | `string`                                        | ID provider a cui appartiene questa scelta.                                                            |
| `method`              | Sì           | `string`                                        | ID metodo di autenticazione a cui eseguire il dispatch.                                                |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                        |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw ripiega su `choiceId`.                              |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il selettore.                                                                 |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.           |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente pur consentendo ancora la selezione manuale da CLI.   |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID scelta legacy che devono reindirizzare gli utenti a questa scelta sostitutiva.                      |
| `groupId`             | No           | `string`                                        | ID gruppo opzionale per raggruppare scelte correlate.                                                  |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                         |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                    |
| `optionKey`           | No           | `string`                                        | Chiave opzione interna per flussi di autenticazione semplici con un solo flag.                         |
| `cliFlag`             | No           | `string`                                        | Nome flag CLI, come `--openrouter-api-key`.                                                            |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                    |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'aiuto CLI.                                                                      |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | Superfici di onboarding in cui questa scelta deve apparire. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento commandAliases

Usa `commandAliases` quando un Plugin possiede un nome di comando runtime che gli utenti potrebbero
inserire per errore in `plugins.allow` o provare a eseguire come comando CLI radice. OpenClaw
usa questi metadati per la diagnostica senza importare codice runtime del Plugin.

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

| Campo        | Obbligatorio | Tipo              | Significato                                                                      |
| ------------ | ------------ | ----------------- | -------------------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo Plugin.                                 |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash di chat invece che comando CLI radice.   |
| `cliCommand` | No           | `string`          | Comando CLI radice correlato da suggerire per le operazioni CLI, se ne esiste uno. |

## riferimento activation

Usa `activation` quando il Plugin può dichiarare a basso costo quali eventi del piano di controllo
dovrebbero includerlo in un piano di attivazione/caricamento.

Questo blocco è metadati del pianificatore, non un'API di ciclo di vita. Non registra
comportamenti runtime, non sostituisce `register(...)` e non promette che
il codice del Plugin sia già stato eseguito. Il pianificatore di attivazione usa questi campi per
restringere i Plugin candidati prima di ripiegare sui metadati di proprietà del manifesto esistenti
come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook.

Preferisci i metadati più specifici che descrivono già la proprietà. Usa
`providers`, `channels`, `commandAliases`, descrittori di setup o `contracts`
quando questi campi esprimono la relazione. Usa `activation` per suggerimenti aggiuntivi al pianificatore
che non possono essere rappresentati da quei campi di proprietà.
Usa `cliBackends` di primo livello per alias runtime CLI come `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` è solo per
ID di harness agente incorporati che non hanno già un campo di proprietà.

Questo blocco è solo metadati. Non registra comportamenti runtime e non
sostituisce `register(...)`, `setupEntry` o altri punti di ingresso runtime/Plugin.
I consumatori attuali lo usano come suggerimento di restringimento prima di un caricamento più ampio dei Plugin, quindi
metadati di attivazione non di avvio mancanti di solito costano solo prestazioni; non
dovrebbero modificare la correttezza finché esistono ancora fallback di proprietà del manifesto.

Ogni Plugin dovrebbe impostare `activation.onStartup` intenzionalmente. Impostalo su `true`
solo quando il Plugin deve essere eseguito durante l'avvio del Gateway. Impostalo su `false` quando
il Plugin è inerte all'avvio e dovrebbe caricarsi solo da trigger più specifici.
Omettere `onStartup` non carica più implicitamente il Plugin all'avvio; usa metadati di
attivazione espliciti per avvio, canale, configurazione, harness agente, memoria o
altri trigger di attivazione più specifici.

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

| Campo              | Obbligatorio | Tipo                                                 | Significato                                                                                                                                                                                          |
| ------------------ | ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No           | `boolean`                                            | Attivazione esplicita all'avvio del Gateway. Ogni Plugin dovrebbe impostarla. `true` importa il Plugin durante l'avvio; `false` lo mantiene lazy all'avvio salvo che un altro trigger corrispondente richieda il caricamento. |
| `onProviders`      | No           | `string[]`                                           | ID provider che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                                                                                                             |
| `onAgentHarnesses` | No           | `string[]`                                           | ID runtime di harness agente incorporati che dovrebbero includere questo Plugin nei piani di attivazione/caricamento. Usa `cliBackends` di primo livello per gli alias backend CLI.                 |
| `onCommands`       | No           | `string[]`                                           | ID comando che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                                                                                                              |
| `onChannels`       | No           | `string[]`                                           | ID canale che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                                                                                                               |
| `onRoutes`         | No           | `string[]`                                           | Tipi di route che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                                                                                                           |
| `onConfigPaths`    | No           | `string[]`                                           | Percorsi di configurazione relativi alla radice che dovrebbero includere questo Plugin nei piani di avvio/caricamento quando il percorso è presente e non disabilitato esplicitamente.              |
| `onCapabilities`   | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti di capacità ampi usati dalla pianificazione di attivazione del piano di controllo. Preferisci campi più specifici quando possibile.                                                     |

Consumatori live attuali:

- La pianificazione di avvio del Gateway usa `activation.onStartup` per l'importazione
  esplicita all'avvio
- la pianificazione CLI attivata da comandi ripiega sui legacy
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la pianificazione di avvio agent-runtime usa `activation.onAgentHarnesses` per
  harness incorporati e `cliBackends[]` di primo livello per alias runtime CLI
- la pianificazione setup/canale attivata da canale ripiega sulla proprietà legacy `channels[]`
  quando mancano metadati espliciti di attivazione canale
- la pianificazione dei Plugin di avvio usa `activation.onConfigPaths` per superfici di configurazione radice
  non di canale come il blocco `browser` del Plugin browser incluso
- la pianificazione setup/runtime attivata da provider ripiega sulla proprietà legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti di
  attivazione provider

La diagnostica del pianificatore può distinguere i suggerimenti di attivazione espliciti dal fallback di
proprietà del manifesto. Per esempio, `activation-command-hint` significa che
`activation.onCommands` ha corrisposto, mentre `manifest-command-alias` significa che il
pianificatore ha usato invece la proprietà `commandAliases`. Queste etichette di motivo servono per
diagnostica dell'host e test; gli autori di Plugin dovrebbero continuare a dichiarare i metadati
che descrivono meglio la proprietà.

## riferimento qaRunners

Usa `qaRunners` quando un Plugin contribuisce uno o più runner di trasporto sotto
la radice condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il runtime del Plugin
possiede comunque la registrazione CLI effettiva tramite una superficie leggera
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

| Campo         | Obbligatorio | Tipo     | Significato                                                          |
| ------------- | ------------ | -------- | -------------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, per esempio `matrix`.      |
| `description` | No           | `string` | Testo di aiuto di fallback usato quando l'host condiviso necessita di un comando stub. |

## riferimento setup

Usa `setup` quando le superfici di setup e onboarding hanno bisogno di metadati a basso costo di proprietà del Plugin
prima che il runtime venga caricato.

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

`cliBackends` di primo livello resta valido e continua a descrivere i backend di inferenza CLI.
`setup.cliBackends` è la superficie descrittore specifica del setup per
flussi del piano di controllo/setup che dovrebbero restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di ricerca
descriptor-first preferita per la scoperta del setup. Se il descrittore restringe solo
il Plugin candidato e il setup necessita comunque di hook runtime più ricchi in fase di setup,
imposta `requiresRuntime: true` e mantieni `setup-api` come percorso di esecuzione
di fallback.

OpenClaw include anche `setup.providers[].envVars` nelle ricerche generiche di autenticazione provider e
variabili d'ambiente. `providerAuthEnvVars` rimane supportato tramite un adattatore di compatibilità
durante la finestra di deprecazione, ma i Plugin non inclusi che lo usano ancora
ricevono una diagnostica del manifesto. I nuovi Plugin dovrebbero mettere i metadati env di setup/stato
su `setup.providers[].envVars`.

OpenClaw può anche derivare semplici scelte di setup da `setup.providers[].authMethods`
quando non è disponibile una voce di setup, oppure quando `setup.requiresRuntime: false`
dichiara che il runtime di setup non è necessario. Le voci esplicite `providerAuthChoices` restano
preferite per etichette personalizzate, flag CLI, ambito di onboarding e metadati assistente.

Imposta `requiresRuntime: false` solo quando quei descrittori sono sufficienti per la
superficie di setup. OpenClaw tratta `false` esplicito come un contratto solo descrittore
e non eseguirà `setup-api` o `openclaw.setupEntry` per la ricerca di setup. Se
un Plugin solo descrittore include comunque una di quelle voci runtime di setup,
OpenClaw segnala una diagnostica additiva e continua a ignorarla. `requiresRuntime`
omesso mantiene il comportamento di fallback legacy così i Plugin esistenti che hanno aggiunto
descrittori senza il flag non si rompono.

Poiché la ricerca di setup può eseguire codice `setup-api` di proprietà del Plugin, i valori
normalizzati `setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra
i Plugin scoperti. Una proprietà ambigua fallisce in modo chiuso invece di scegliere un
vincitore dall'ordine di scoperta.

Quando il runtime di setup viene eseguito, la diagnostica del registro setup segnala drift dei descrittori
se `setup-api` registra un provider o backend CLI che i descrittori del manifesto
non dichiarano, oppure se un descrittore non ha una registrazione runtime
corrispondente. Queste diagnostiche sono additive e non respingono i Plugin legacy.

### riferimento setup.providers

| Campo          | Obbligatorio | Tipo       | Significato                                                                                         |
| -------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `id`           | Sì           | `string`   | ID provider esposto durante setup o onboarding. Mantieni gli ID normalizzati globalmente univoci.   |
| `authMethods`  | No           | `string[]` | ID metodo di setup/autenticazione supportati da questo provider senza caricare il runtime completo. |
| `envVars`      | No           | `string[]` | Variabili d'ambiente che le superfici generiche di setup/stato possono controllare prima che il runtime del Plugin venga caricato. |
| `authEvidence` | No           | `object[]` | Controlli economici di evidenza di autenticazione locale per provider che possono autenticarsi tramite marcatori non segreti. |

`authEvidence` serve per i marker di credenziali locali di proprietà del provider che possono essere
verificati senza caricare codice runtime. Questi controlli devono restare economici e locali:
nessuna chiamata di rete, nessuna lettura da portachiavi o secret manager, nessun comando shell e nessun
probe delle API del provider.

Voci di evidenza supportate:

| Campo              | Obbligatorio | Tipo       | Significato                                                                                                  |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Sì           | `string`   | Attualmente `local-file-with-env`.                                                                          |
| `fileEnvVar`       | No           | `string`   | Variabile d'ambiente che contiene un percorso esplicito del file di credenziali.                             |
| `fallbackPaths`    | No           | `string[]` | Percorsi locali dei file di credenziali controllati quando `fileEnvVar` è assente o vuota. Supporta `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | No           | `string[]` | Almeno una variabile d'ambiente elencata deve essere non vuota prima che l'evidenza sia valida.              |
| `requiresAllEnv`   | No           | `string[]` | Ogni variabile d'ambiente elencata deve essere non vuota prima che l'evidenza sia valida.                    |
| `credentialMarker` | Sì           | `string`   | Marker non segreto restituito quando l'evidenza è presente.                                                  |
| `source`           | No           | `string`   | Etichetta sorgente rivolta all'utente per l'output di autenticazione/stato.                                  |

### campi setup

| Campo              | Obbligatorio | Tipo       | Significato                                                                                       |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di configurazione del provider esposti durante setup e onboarding.                    |
| `cliBackends`      | No           | `string[]` | ID backend usati in fase di setup per la ricerca setup descriptor-first. Mantieni gli ID normalizzati univoci a livello globale. |
| `configMigrations` | No           | `string[]` | ID di migrazione della configurazione posseduti dalla superficie di setup di questo plugin.       |
| `requiresRuntime`  | No           | `boolean`  | Se il setup necessita ancora dell'esecuzione di `setup-api` dopo la ricerca del descrittore.      |

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

| Campo         | Tipo       | Significato                            |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Etichetta del campo rivolta all'utente. |
| `help`        | `string`   | Breve testo di aiuto.                  |
| `tags`        | `string[]` | Tag UI opzionali.                      |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.   |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input dei moduli. |

## riferimento contracts

Usa `contracts` solo per metadati statici di proprietà delle capability che OpenClaw può
leggere senza importare il runtime del plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Ogni elenco è opzionale:

| Campo                            | Tipo       | Significato                                                         |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID factory di estensione app-server Codex, attualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | ID runtime per cui un plugin integrato può registrare middleware dei risultati degli strumenti. |
| `externalAuthProviders`          | `string[]` | ID provider il cui hook del profilo di autenticazione esterna è posseduto da questo plugin. |
| `speechProviders`                | `string[]` | ID provider speech posseduti da questo plugin.                      |
| `realtimeTranscriptionProviders` | `string[]` | ID provider di trascrizione realtime posseduti da questo plugin.    |
| `realtimeVoiceProviders`         | `string[]` | ID provider voice realtime posseduti da questo plugin.              |
| `memoryEmbeddingProviders`       | `string[]` | ID provider memory embedding posseduti da questo plugin.            |
| `mediaUnderstandingProviders`    | `string[]` | ID provider media-understanding posseduti da questo plugin.         |
| `imageGenerationProviders`       | `string[]` | ID provider image-generation posseduti da questo plugin.            |
| `videoGenerationProviders`       | `string[]` | ID provider video-generation posseduti da questo plugin.            |
| `webFetchProviders`              | `string[]` | ID provider web-fetch posseduti da questo plugin.                   |
| `webSearchProviders`             | `string[]` | ID provider web-search posseduti da questo plugin.                  |
| `migrationProviders`             | `string[]` | ID provider di importazione posseduti da questo plugin per `openclaw migrate`. |
| `tools`                          | `string[]` | Nomi degli strumenti agente posseduti da questo plugin.             |

`contracts.embeddedExtensionFactories` è mantenuto per le factory di estensione integrate solo
per app-server Codex. Le trasformazioni integrate dei risultati degli strumenti dovrebbero
dichiarare `contracts.agentToolResultMiddleware` e registrarsi con
`api.registerAgentToolResultMiddleware(...)`. I plugin esterni non possono
registrare middleware dei risultati degli strumenti perché la seam può riscrivere output di strumenti ad alta affidabilità
prima che il modello lo veda.

Le registrazioni runtime `api.registerTool(...)` devono corrispondere a `contracts.tools`.
Il rilevamento degli strumenti usa questo elenco per caricare solo i runtime dei plugin che possono possedere gli
strumenti richiesti.

I plugin provider che implementano `resolveExternalAuthProfiles` dovrebbero dichiarare
`contracts.externalAuthProviders`. I plugin senza la dichiarazione passano ancora
attraverso un fallback di compatibilità deprecato, ma quel fallback è più lento e
sarà rimosso dopo la finestra di migrazione.

I provider memory embedding integrati dovrebbero dichiarare
`contracts.memoryEmbeddingProviders` per ogni ID adattatore che espongono, inclusi
gli adattatori integrati come `local`. I percorsi CLI autonomi usano questo contratto del manifest
per caricare solo il plugin proprietario prima che il runtime completo del Gateway abbia
registrato i provider.

## riferimento mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` quando un provider media-understanding ha
modelli predefiniti, priorità di fallback auto-auth o supporto nativo ai documenti che
gli helper core generici necessitano prima del caricamento del runtime. Le chiavi devono essere dichiarate anche in
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
| `defaultModels`        | `Record<string, string>`            | Valori predefiniti capability-modello usati quando la config non specifica un modello. |
| `autoPriority`         | `Record<string, number>`            | Numeri più bassi vengono ordinati prima per il fallback automatico del provider basato sulle credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input documentali nativi supportati dal provider.                          |

## riferimento channelConfigs

Usa `channelConfigs` quando un plugin di canale necessita di metadati di configurazione economici prima
del caricamento del runtime. Il rilevamento read-only di setup/stato del canale può usare questi metadati
direttamente per canali esterni configurati quando non è disponibile alcuna voce di setup, oppure
quando `setup.requiresRuntime: false` dichiara che il runtime di setup non è necessario.

`channelConfigs` è metadato del manifest del plugin, non una nuova sezione di configurazione utente di primo livello.
Gli utenti configurano comunque le istanze di canale sotto `channels.<channel-id>`.
OpenClaw legge i metadati del manifest per decidere quale plugin possiede quel canale configurato
prima che il codice runtime del plugin venga eseguito.

Per un plugin di canale, `configSchema` e `channelConfigs` descrivono percorsi diversi:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

I plugin non integrati che dichiarano `channels[]` dovrebbero anche dichiarare voci
`channelConfigs` corrispondenti. Senza di esse, OpenClaw può comunque caricare il plugin, ma
le superfici di schema config cold-path, setup e Control UI non possono conoscere la
forma delle opzioni possedute dal canale finché il runtime del plugin non viene eseguito.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` possono dichiarare valori predefiniti statici `auto` per controlli di configurazione dei comandi
che vengono eseguiti prima del caricamento del runtime del canale. I canali integrati possono anche pubblicare
gli stessi valori predefiniti tramite `package.json#openclaw.channel.commands` insieme
agli altri metadati del catalogo canali posseduti dal pacchetto.

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

| Campo         | Tipo                     | Significato                                                                               |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce di configurazione canale dichiarata. |
| `uiHints`     | `Record<string, object>` | Etichette UI, segnaposto e indicazioni di sensibilità opzionali per quella sezione di configurazione canale. |
| `label`       | `string`                 | Etichetta del canale unita alle superfici di selezione e ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                    |
| `commands`    | `object`                 | Comando nativo statico e valori predefiniti automatici delle skill native per i controlli di configurazione pre-runtime. |
| `preferOver`  | `string[]`               | ID Plugin legacy o a priorità inferiore che questo canale deve superare nelle superfici di selezione. |

### Sostituire un altro Plugin di canale

Usa `preferOver` quando il tuo Plugin è il proprietario preferito per un ID canale che
anche un altro Plugin può fornire. I casi comuni sono un ID Plugin rinominato, un
Plugin autonomo che sostituisce un Plugin incluso, oppure un fork mantenuto che
mantiene lo stesso ID canale per la compatibilità della configurazione.

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
è incluso o abilitato per impostazione predefinita, OpenClaw lo disabilita nella
configurazione runtime effettiva, così un solo Plugin possiede il canale e i suoi strumenti. La selezione esplicita dell'utente
ha comunque la precedenza: se l'utente abilita esplicitamente entrambi i Plugin, OpenClaw
preserva tale scelta e segnala diagnostiche di canale/strumento duplicati invece di
modificare silenziosamente l'insieme di Plugin richiesto.

Mantieni `preferOver` limitato agli ID Plugin che possono davvero fornire lo stesso canale.
Non è un campo di priorità generale e non rinomina le chiavi di configurazione utente.

## Riferimento modelSupport

Usa `modelSupport` quando OpenClaw deve dedurre il tuo Plugin provider da
ID modello abbreviati come `gpt-5.5` o `claude-sonnet-4.6` prima del caricamento del runtime
del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica questa precedenza:

- i riferimenti espliciti `provider/model` usano i metadati manifest `providers` proprietari
- `modelPatterns` prevale su `modelPrefixes`
- se corrispondono sia un Plugin non incluso sia un Plugin incluso, vince il Plugin
  non incluso
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specifica un provider

Campi:

| Campo           | Tipo       | Significato                                                                   |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.    |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

## Riferimento modelCatalog

Usa `modelCatalog` quando OpenClaw deve conoscere i metadati dei modelli del provider prima
di caricare il runtime del Plugin. Questa è la fonte posseduta dal manifest per righe di catalogo
fisse, alias di provider, regole di soppressione e modalità di discovery. L'aggiornamento runtime
resta nel codice runtime del provider, ma il manifest indica al core quando il runtime
è richiesto.

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

| Campo          | Tipo                                                     | Significato                                                                                               |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Righe di catalogo per gli ID provider posseduti da questo Plugin. Le chiavi devono comparire anche in `providers` di primo livello. |
| `aliases`      | `Record<string, object>`                                 | Alias di provider che devono risolversi in un provider posseduto per la pianificazione del catalogo o della soppressione. |
| `suppressions` | `object[]`                                               | Righe modello provenienti da un'altra fonte che questo Plugin sopprime per un motivo specifico del provider. |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se il catalogo del provider può essere letto dai metadati del manifest, aggiornato nella cache o richiede il runtime. |

`aliases` partecipa alla ricerca della proprietà del provider per la pianificazione del catalogo modelli.
Le destinazioni degli alias devono essere provider di primo livello posseduti dallo stesso Plugin. Quando un
elenco filtrato per provider usa un alias, OpenClaw può leggere il manifest proprietario e
applicare override di API/URL di base dell'alias senza caricare il runtime del provider.
Gli alias non espandono gli elenchi di catalogo non filtrati; gli elenchi ampi emettono solo
le righe del provider canonico proprietario.

`suppressions` sostituisce il vecchio hook runtime del provider `suppressBuiltInModel`.
Le voci di soppressione vengono rispettate solo quando il provider è posseduto dal Plugin oppure
dichiarato come chiave `modelCatalog.aliases` che punta a un provider posseduto. Gli hook di
soppressione runtime non vengono più chiamati durante la risoluzione dei modelli.

Campi del provider:

| Campo     | Tipo                     | Significato                                                     |
| --------- | ------------------------ | --------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL di base predefinito opzionale per i modelli in questo catalogo provider. |
| `api`     | `ModelApi`               | Adattatore API predefinito opzionale per i modelli in questo catalogo provider. |
| `headers` | `Record<string, string>` | Header statici opzionali che si applicano a questo catalogo provider. |
| `models`  | `object[]`               | Righe modello obbligatorie. Le righe senza un `id` vengono ignorate. |

Campi del modello:

| Campo           | Tipo                                                           | Significato                                                               |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID modello locale del provider, senza il prefisso `provider/`.           |
| `name`          | `string`                                                       | Nome visualizzato opzionale.                                             |
| `api`           | `ModelApi`                                                     | Override API opzionale per modello.                                      |
| `baseUrl`       | `string`                                                       | Override URL di base opzionale per modello.                              |
| `headers`       | `Record<string, string>`                                       | Header statici opzionali per modello.                                    |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalità accettate dal modello.                                          |
| `reasoning`     | `boolean`                                                      | Indica se il modello espone comportamento di ragionamento.               |
| `contextWindow` | `number`                                                       | Finestra di contesto nativa del provider.                                |
| `contextTokens` | `number`                                                       | Limite di contesto runtime effettivo opzionale quando diverso da `contextWindow`. |
| `maxTokens`     | `number`                                                       | Token massimi di output quando noti.                                     |
| `cost`          | `object`                                                       | Prezzi opzionali in USD per milione di token, incluso `tieredPricing` opzionale. |
| `compat`        | `object`                                                       | Flag di compatibilità opzionali corrispondenti alla compatibilità della configurazione modello di OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato dell'elenco. Sopprimi solo quando la riga non deve comparire affatto. |
| `statusReason`  | `string`                                                       | Motivo opzionale mostrato con uno stato non disponibile.                 |
| `replaces`      | `string[]`                                                     | ID modello locali del provider più vecchi che questo modello sostituisce. |
| `replacedBy`    | `string`                                                       | ID modello locale del provider sostitutivo per righe deprecate.          |
| `tags`          | `string[]`                                                     | Tag stabili usati da selettori e filtri.                                 |

Campi di soppressione:

| Campo                      | Tipo       | Significato                                                                                             |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID provider per la riga upstream da sopprimere. Deve essere posseduto da questo Plugin o dichiarato come alias posseduto. |
| `model`                    | `string`   | ID modello locale del provider da sopprimere.                                                          |
| `reason`                   | `string`   | Messaggio opzionale mostrato quando la riga soppressa viene richiesta direttamente.                     |
| `when.baseUrlHosts`        | `string[]` | Elenco opzionale degli host URL di base effettivi del provider richiesti prima che la soppressione si applichi. |
| `when.providerConfigApiIn` | `string[]` | Elenco opzionale di valori `api` esatti della configurazione provider richiesti prima che la soppressione si applichi. |

Non inserire dati solo runtime in `modelCatalog`. Usa `static` solo quando le righe del manifest
sono abbastanza complete da consentire alle superfici di elenco filtrato per provider e di selezione
di saltare il rilevamento tramite registry/runtime. Usa `refreshable` quando le righe del manifest sono utili
come seed o integrazioni elencabili, ma un aggiornamento/cache puo aggiungere altre righe in seguito;
le righe refreshable non sono autorevoli di per se. Usa `runtime` quando OpenClaw
deve caricare il runtime del provider per conoscere l'elenco.

## Riferimento modelIdNormalization

Usa `modelIdNormalization` per una pulizia economica degli ID modello di proprieta del provider che deve
avvenire prima del caricamento del runtime del provider. Questo mantiene alias come nomi modello brevi,
ID legacy locali al provider e regole di prefisso proxy nel manifest del plugin proprietario
invece che nelle tabelle core di selezione dei modelli.

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

| Campo                                | Tipo                    | Che cosa significa                                                                                 |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias esatti degli ID modello, senza distinzione tra maiuscole e minuscole. I valori sono restituiti come scritti. |
| `stripPrefixes`                      | `string[]`              | Prefissi da rimuovere prima della ricerca alias, utili per duplicazioni legacy provider/modello.   |
| `prefixWhenBare`                     | `string`                | Prefisso da aggiungere quando l'ID modello normalizzato non contiene gia `/`.                       |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regole condizionali di prefisso per ID semplici dopo la ricerca alias, indicizzate da `modelPrefix` e `prefix`. |

## Riferimento providerEndpoints

Usa `providerEndpoints` per la classificazione degli endpoint che la policy generica delle richieste
deve conoscere prima del caricamento del runtime del provider. Il core possiede ancora il significato di ogni
`endpointClass`; i manifest dei plugin possiedono i metadati di host e URL base.

Campi dell'endpoint:

| Campo                          | Tipo       | Che cosa significa                                                                                  |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe di endpoint core nota, come `openrouter`, `moonshot-native` o `google-vertex`.               |
| `hosts`                        | `string[]` | Nomi host esatti che mappano alla classe di endpoint.                                               |
| `hostSuffixes`                 | `string[]` | Suffissi host che mappano alla classe di endpoint. Anteponi `.` per la corrispondenza solo dei suffissi di dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizzati esatti che mappano alla classe di endpoint.                           |
| `googleVertexRegion`           | `string`   | Regione Google Vertex statica per host globali esatti.                                             |
| `googleVertexRegionHostSuffix` | `string`   | Suffisso da rimuovere dagli host corrispondenti per esporre il prefisso della regione Google Vertex. |

## Riferimento providerRequest

Usa `providerRequest` per metadati economici di compatibilita delle richieste di cui la policy
generica delle richieste ha bisogno senza caricare il runtime del provider. Mantieni la riscrittura
dei payload specifica del comportamento negli hook runtime del provider o negli helper condivisi della famiglia di provider.

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

| Campo                 | Tipo         | Che cosa significa                                                                         |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `family`              | `string`     | Etichetta della famiglia di provider usata da decisioni generiche di compatibilita delle richieste e diagnostica. |
| `compatibilityFamily` | `"moonshot"` | Bucket opzionale di compatibilita della famiglia di provider per helper condivisi delle richieste. |
| `openAICompletions`   | `object`     | Flag delle richieste di completamento compatibili con OpenAI, attualmente `supportsStreamingUsage`. |

## Riferimento modelPricing

Usa `modelPricing` quando un provider deve controllare il comportamento dei prezzi nel piano di controllo prima
del caricamento del runtime. La cache dei prezzi del Gateway legge questi metadati senza importare
codice runtime del provider.

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

| Campo        | Tipo              | Che cosa significa                                                                                      |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Imposta `false` per provider locali/self-hosted che non devono mai recuperare prezzi OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Mappatura della ricerca prezzi OpenRouter. `false` disabilita la ricerca OpenRouter per questo provider. |
| `liteLLM`    | `false \| object` | Mappatura della ricerca prezzi LiteLLM. `false` disabilita la ricerca LiteLLM per questo provider.       |

Campi della sorgente:

| Campo                      | Tipo               | Che cosa significa                                                                                                      |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID del provider del catalogo esterno quando differisce dall'ID provider OpenClaw, per esempio `z-ai` per un provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Tratta gli ID modello che contengono slash come riferimenti provider/modello annidati, utile per provider proxy come OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varianti aggiuntive di ID modello del catalogo esterno. `version-dots` prova ID versione con punti come `claude-opus-4.6`. |

### Indice dei Provider OpenClaw

L'Indice dei Provider OpenClaw e un metadato di anteprima di proprieta di OpenClaw per provider
i cui plugin potrebbero non essere ancora installati. Non fa parte di un manifest di plugin.
I manifest dei plugin restano l'autorita per i plugin installati. L'Indice dei Provider e
il contratto interno di fallback che le future superfici di selezione modello per provider installabili e pre-installazione
consumeranno quando un plugin provider non e installato.

Ordine di autorita del catalogo:

1. Configurazione utente.
2. Manifest del plugin installato `modelCatalog`.
3. Cache del catalogo modelli da aggiornamento esplicito.
4. Righe di anteprima dell'Indice dei Provider OpenClaw.

L'Indice dei Provider non deve contenere segreti, stato abilitato, hook runtime o
dati modello live specifici dell'account. I suoi cataloghi di anteprima usano la stessa
forma di riga provider `modelCatalog` dei manifest dei plugin, ma devono restare limitati
a metadati di visualizzazione stabili, a meno che campi dell'adapter runtime come `api`,
`baseUrl`, prezzi o flag di compatibilita siano mantenuti intenzionalmente allineati con
il manifest del plugin installato. I provider con rilevamento live `/models` devono
scrivere le righe aggiornate tramite il percorso esplicito della cache del catalogo modelli invece di
far chiamare le API del provider da elenchi normali o onboarding.

Le voci dell'Indice dei Provider possono anche trasportare metadati di plugin installabili per provider
il cui plugin e stato spostato fuori dal core o comunque non e ancora installato. Questi
metadati rispecchiano il pattern del catalogo dei canali: nome pacchetto, specifica di installazione npm,
integrita attesa ed etichette economiche di scelta auth sono sufficienti per mostrare
un'opzione di configurazione installabile. Una volta installato il plugin, il suo manifest prevale e
la voce dell'Indice dei Provider viene ignorata per quel provider.

Le chiavi di capacita legacy di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta piu quei campi di primo livello come proprieta
delle capacita.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Rilevamento, convalida della configurazione, metadati di scelta auth e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating dell'installazione, setup o metadati di catalogo |

Se non sei sicuro di dove appartenga un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di ingresso o comportamento di installazione npm, mettilo in `package.json`

### Campi di package.json che influenzano il rilevamento

Alcuni metadati di plugin pre-runtime vivono intenzionalmente in `package.json` sotto il blocco
`openclaw` invece che in `openclaw.plugin.json`.
`openclaw.bundle` e `openclaw.bundle.json` non sono contratti di plugin OpenClaw;
i plugin nativi devono usare `openclaw.plugin.json` piu i campi
`package.json#openclaw` supportati sotto.

Esempi importanti:

| Campo                                                                                      | Significato                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Dichiara gli entrypoint Plugin nativi. Deve restare all'interno della directory del pacchetto Plugin.                                                                              |
| `openclaw.runtimeExtensions`                                                               | Dichiara gli entrypoint runtime JavaScript compilati per i pacchetti installati. Deve restare all'interno della directory del pacchetto Plugin.                                    |
| `openclaw.setupEntry`                                                                      | Entrypoint leggero solo per setup usato durante l'onboarding, l'avvio differito del canale e il rilevamento dello stato canale/SecretRef in sola lettura. Deve restare all'interno della directory del pacchetto Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Dichiara l'entrypoint di setup JavaScript compilato per i pacchetti installati. Richiede `setupEntry`, deve esistere e deve restare all'interno della directory del pacchetto Plugin. |
| `openclaw.channel`                                                                         | Metadati leggeri del catalogo canali, come etichette, percorsi della documentazione, alias e testo di selezione.                                                                  |
| `openclaw.channel.commands`                                                                | Metadati statici dei comandi nativi e dei valori predefiniti automatici delle skill native usati da config, audit e superfici dell'elenco comandi prima del caricamento del runtime del canale. |
| `openclaw.channel.configuredState`                                                         | Metadati leggeri del controllo dello stato configurato che possono rispondere a "la configurazione solo env esiste gia?" senza caricare l'intero runtime del canale.               |
| `openclaw.channel.persistedAuthState`                                                      | Metadati leggeri del controllo dell'autenticazione persistita che possono rispondere a "qualcosa ha gia effettuato l'accesso?" senza caricare l'intero runtime del canale.         |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Suggerimenti di installazione/aggiornamento per Plugin inclusi e pubblicati esternamente.                                                                                          |
| `openclaw.install.defaultChoice`                                                           | Percorso di installazione preferito quando sono disponibili piu fonti di installazione.                                                                                            |
| `openclaw.install.minHostVersion`                                                          | Versione minima supportata dell'host OpenClaw, usando un limite inferiore semver come `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                        |
| `openclaw.install.expectedIntegrity`                                                       | Stringa di integrita dist npm prevista, come `sha512-...`; i flussi di installazione e aggiornamento verificano l'artefatto recuperato rispetto a essa.                           |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Consente un percorso ristretto di ripristino tramite reinstallazione di Plugin incluso quando la configurazione non e valida.                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Consente alle superfici canale solo di setup di caricarsi prima del Plugin canale completo durante l'avvio.                                                                        |

I metadati del manifest decidono quali scelte di provider/canale/setup appaiono nell'onboarding prima del caricamento del runtime. `package.json#openclaw.install` indica all'onboarding come recuperare o abilitare quel Plugin quando l'utente sceglie una di quelle opzioni. Non spostare i suggerimenti di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del registro manifest per sorgenti Plugin non incluse. I valori non validi vengono rifiutati; i valori piu recenti ma validi saltano i Plugin esterni sugli host meno recenti. Si presume che i Plugin sorgente inclusi siano co-versionati con il checkout dell'host.

I metadati ufficiali di installazione on-demand dovrebbero usare `clawhubSpec` quando il Plugin e pubblicato su ClawHub; l'onboarding lo tratta come la fonte remota preferita e registra i fatti dell'artefatto ClawHub dopo l'installazione. `npmSpec` resta il fallback di compatibilita per i pacchetti che non sono ancora passati a ClawHub.

Il pinning della versione npm esatta vive gia in `npmSpec`, per esempio `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci ufficiali del catalogo esterno dovrebbero associare specifiche esatte a `expectedIntegrity` cosi che i flussi di aggiornamento falliscano in modo chiuso se l'artefatto npm recuperato non corrisponde piu alla release fissata. L'onboarding interattivo offre ancora specifiche npm da registry attendibili, inclusi nomi di pacchetti semplici e dist-tag, per compatibilita. La diagnostica del catalogo puo distinguere fonti esatte, mobili, fissate con integrita, prive di integrita, con nome pacchetto non corrispondente e con scelta predefinita non valida. Avvisa anche quando `expectedIntegrity` e presente ma non esiste una sorgente npm valida a cui possa applicare il pin. Quando `expectedIntegrity` e presente, i flussi di installazione/aggiornamento lo applicano; quando e omesso, la risoluzione del registry viene registrata senza un pin di integrita.

I Plugin canale dovrebbero fornire `openclaw.setupEntry` quando stato, elenco canali o scansioni SecretRef devono identificare account configurati senza caricare l'intero runtime. L'entry di setup dovrebbe esporre metadati del canale piu adattatori di configurazione, stato e segreti sicuri per il setup; mantieni client di rete, listener Gateway e runtime di trasporto nell'entrypoint principale dell'estensione.

I campi entrypoint runtime non sovrascrivono i controlli dei confini del pacchetto per i campi entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non puo rendere caricabile un percorso `openclaw.extensions` che esce dai confini.

`openclaw.install.allowInvalidConfigRecovery` e intenzionalmente ristretto. Non rende installabili configurazioni rotte arbitrarie. Oggi consente solo ai flussi di installazione di ripristinare da specifici errori obsoleti di upgrade di Plugin inclusi, come un percorso di Plugin incluso mancante o una voce `channels.<id>` obsoleta per quello stesso Plugin incluso. Errori di configurazione non correlati bloccano comunque l'installazione e indirizzano gli operatori a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` e metadato di pacchetto per un minuscolo modulo di controllo:

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

Usalo quando setup, doctor, stato o flussi di presenza in sola lettura richiedono un probe di autenticazione si/no economico prima del caricamento del Plugin canale completo. Lo stato di autenticazione persistito non e lo stato canale configurato: non usare questi metadati per abilitare automaticamente i Plugin, riparare dipendenze runtime o decidere se un runtime canale debba caricarsi. L'export di destinazione dovrebbe essere una piccola funzione che legge solo lo stato persistito; non instradarlo attraverso il barrel del runtime canale completo.

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

Usalo quando un canale puo rispondere allo stato configurato da env o da altri input minuscoli non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero runtime del canale, mantieni quella logica nell'hook `config.hasConfiguredState` del Plugin.

## Precedenza di discovery (id Plugin duplicati)

OpenClaw scopre i Plugin da diverse radici (inclusi, installazione globale, workspace, percorsi selezionati esplicitamente dalla configurazione). Se due discovery condividono lo stesso `id`, viene mantenuto solo il manifest con la **precedenza piu alta**; i duplicati con precedenza inferiore vengono scartati invece di essere caricati accanto a esso.

Precedenza, dalla piu alta alla piu bassa:

1. **Selezionato da configurazione** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Incluso** — Plugin distribuiti con OpenClaw
3. **Installazione globale** — Plugin installati nella radice Plugin globale di OpenClaw
4. **Workspace** — Plugin scoperti relativamente al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un Plugin incluso presente nel workspace non oscurera la build inclusa.
- Per sovrascrivere davvero un Plugin incluso con uno locale, fissalo tramite `plugins.entries.<id>` cosi vince per precedenza invece di affidarti alla discovery del workspace.
- Gli scarti dei duplicati vengono registrati nei log cosi Doctor e la diagnostica di avvio possono indicare la copia scartata.
- Le sovrascritture duplicate selezionate da configurazione sono formulate come sovrascritture esplicite nella diagnostica, ma avvisano comunque cosi fork obsoleti e ombreggiamenti accidentali restano visibili.

## Requisiti dello schema JSON

- **Ogni Plugin deve distribuire uno schema JSON**, anche se non accetta configurazione.
- Uno schema vuoto e accettabile (per esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati al momento di lettura/scrittura della configurazione, non a runtime.
- Quando estendi o forki un Plugin incluso con nuove chiavi di configurazione, aggiorna contemporaneamente il `configSchema` di `openclaw.plugin.json` di quel Plugin. Gli schemi dei Plugin inclusi sono rigorosi, quindi aggiungere `plugins.entries.<id>.config.myNewKey` nella configurazione utente senza aggiungere `myNewKey` a `configSchema.properties` verra rifiutato prima del caricamento del runtime del Plugin.

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

## Comportamento di validazione

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'id canale non sia dichiarato da
  un manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a id Plugin **scopribili**. Gli id sconosciuti sono **errori**.
- Se un Plugin e installato ma ha un manifest o uno schema rotto o mancante,
  la validazione fallisce e Doctor segnala l'errore del Plugin.
- Se la configurazione Plugin esiste ma il Plugin e **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + log.

Vedi [Riferimento di configurazione](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifesto è **obbligatorio per i plugin nativi di OpenClaw**, inclusi i caricamenti dal filesystem locale. Il runtime carica comunque separatamente il modulo del plugin; il manifesto serve solo per discovery + validazione.
- I manifesti nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi non tra virgolette sono accettati purché il valore finale sia comunque un oggetto.
- Il loader del manifesto legge solo i campi del manifesto documentati. Evita chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono essere tutti omessi quando un plugin non ne ha bisogno.
- `providerDiscoveryEntry` deve restare leggero e non dovrebbe importare codice runtime ampio; usalo per metadati statici del catalogo provider o descrittori di discovery mirati, non per l’esecuzione al momento della richiesta.
- I tipi di plugin esclusivi sono selezionati tramite `plugins.slots.*`: `kind: "memory"` tramite `plugins.slots.memory`, `kind: "context-engine"` tramite `plugins.slots.contextEngine` (predefinito `legacy`).
- Dichiara il tipo di plugin esclusivo in questo manifesto. `OpenClawPluginDefinition.kind` della voce runtime è deprecato e resta solo come fallback di compatibilità per i plugin più vecchi.
- I metadati delle variabili d’ambiente (`setup.providers[].envVars`, il deprecato `providerAuthEnvVars` e `channelEnvVars`) sono solo dichiarativi. Stato, audit, validazione della consegna cron e altre superfici di sola lettura applicano comunque l’attendibilità del plugin e la policy di attivazione effettiva prima di trattare una variabile d’ambiente come configurata.
- Per i metadati del wizard runtime che richiedono codice del provider, consulta [hook runtime del provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build e qualsiasi requisito di allowlist del package manager (ad esempio, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Correlati

<CardGroup cols={3}>
  <Card title="Building plugins" href="/it/plugins/building-plugins" icon="rocket">
    Introduzione ai plugin.
  </Card>
  <Card title="Plugin architecture" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello di capability.
  </Card>
  <Card title="SDK overview" href="/it/plugins/sdk-overview" icon="book">
    Riferimento del Plugin SDK e importazioni dei sottopercorsi.
  </Card>
</CardGroup>
