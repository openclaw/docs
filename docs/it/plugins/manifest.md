---
read_when:
    - Stai creando un Plugin OpenClaw
    - È necessario rilasciare uno schema di configurazione del Plugin o eseguire il debug degli errori di validazione del Plugin
summary: Requisiti del manifest del Plugin + schema JSON (validazione rigorosa della configurazione)
title: Manifesto del Plugin
x-i18n:
    generated_at: "2026-05-03T21:38:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

Questa pagina è solo per il **manifest Plugin nativo di OpenClaw**.

Per i layout bundle compatibili, consulta [Bundle di Plugin](/it/plugins/bundles).

I formati bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito dei componenti Claude
  senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout bundle, ma non vengono convalidati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le root
delle skill dichiarate, le root dei comandi Claude, i valori predefiniti di `settings.json`
del bundle Claude, i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde
alle aspettative del runtime OpenClaw.

Ogni Plugin OpenClaw nativo **deve** includere un file `openclaw.plugin.json` nella
**root del Plugin**. OpenClaw usa questo manifest per convalidare la configurazione
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
- suggerimenti di attivazione per le superfici del piano di controllo
- proprietà abbreviata della famiglia di modelli
- snapshot statici della proprietà delle capability (`contracts`)
- metadati del runner QA che l'host condiviso `openclaw qa` può ispezionare
- metadati di configurazione specifici del canale uniti nelle superfici di catalogo e convalida

**Non usarlo per:** registrare comportamento di runtime, dichiarare entrypoint di codice
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

| Campo                                | Obbligatorio | Tipo                             | Significato                                                                                                                                                                                                                         |
| ------------------------------------ | ------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì            | `string`                         | ID canonico del Plugin. Questo è l'ID usato in `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Sì            | `object`                         | JSON Schema inline per la configurazione di questo Plugin.                                                                                                                                                                          |
| `enabledByDefault`                   | No            | `true`                           | Contrassegna un Plugin in bundle come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore non `true`, per lasciare il Plugin disabilitato per impostazione predefinita.                               |
| `enabledByDefaultOnPlatforms`        | No            | `string[]`                       | Contrassegna un Plugin in bundle come abilitato per impostazione predefinita solo sulle piattaforme Node.js elencate, per esempio `["darwin"]`. La configurazione esplicita ha comunque la precedenza.                              |
| `legacyPluginIds`                    | No            | `string[]`                       | ID legacy che vengono normalizzati in questo ID canonico del Plugin.                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | No            | `string[]`                       | ID dei provider che devono abilitare automaticamente questo Plugin quando auth, configurazione o riferimenti ai modelli li menzionano.                                                                                               |
| `kind`                               | No            | `"memory"` \| `"context-engine"` | Dichiara un tipo esclusivo di Plugin usato da `plugins.slots.*`.                                                                                                                                                                    |
| `channels`                           | No            | `string[]`                       | ID dei canali posseduti da questo Plugin. Usato per rilevamento e validazione della configurazione.                                                                                                                                 |
| `providers`                          | No            | `string[]`                       | ID dei provider posseduti da questo Plugin.                                                                                                                                                                                         |
| `providerDiscoveryEntry`             | No            | `string`                         | Percorso del modulo leggero di rilevamento provider, relativo alla root del Plugin, per metadati del catalogo provider con ambito manifesto che possono essere caricati senza attivare l'intero runtime del Plugin.                 |
| `modelSupport`                       | No            | `object`                         | Metadati sintetici, posseduti dal manifesto, sulla famiglia di modelli usati per caricare automaticamente il Plugin prima del runtime.                                                                                              |
| `modelCatalog`                       | No            | `object`                         | Metadati dichiarativi del catalogo modelli per i provider posseduti da questo Plugin. Questo è il contratto del control plane per elenchi futuri in sola lettura, onboarding, selettori di modelli, alias e soppressione senza caricare il runtime del Plugin. |
| `modelPricing`                       | No            | `object`                         | Criterio di lookup dei prezzi esterni posseduto dal provider. Usalo per escludere provider locali/self-hosted dai cataloghi prezzi remoti o mappare riferimenti provider a ID di catalogo OpenRouter/LiteLLM senza hardcodare ID provider nel core. |
| `modelIdNormalization`               | No            | `object`                         | Pulizia di alias/prefissi degli ID modello posseduta dal provider che deve essere eseguita prima del caricamento del runtime provider.                                                                                              |
| `providerEndpoints`                  | No            | `object[]`                       | Metadati host/baseUrl degli endpoint, posseduti dal manifesto, per route provider che il core deve classificare prima del caricamento del runtime provider.                                                                          |
| `providerRequest`                    | No            | `object`                         | Metadati economici di famiglia provider e compatibilità richiesta usati dal criterio generico delle richieste prima del caricamento del runtime provider.                                                                            |
| `cliBackends`                        | No            | `string[]`                       | ID dei backend di inferenza CLI posseduti da questo Plugin. Usati per l'auto-attivazione all'avvio da riferimenti espliciti nella configurazione.                                                                                   |
| `syntheticAuthRefs`                  | No            | `string[]`                       | Riferimenti a provider o backend CLI il cui hook di auth sintetico posseduto dal Plugin deve essere sondato durante il rilevamento a freddo dei modelli prima del caricamento del runtime.                                         |
| `nonSecretAuthMarkers`               | No            | `string[]`                       | Valori segnaposto delle chiavi API posseduti dal Plugin in bundle che rappresentano stato di credenziali locali non segrete, OAuth o ambientali.                                                                                     |
| `commandAliases`                     | No            | `object[]`                       | Nomi di comandi posseduti da questo Plugin che devono produrre diagnostica di configurazione e CLI consapevole del Plugin prima del caricamento del runtime.                                                                         |
| `providerAuthEnvVars`                | No            | `Record<string, string[]>`       | Metadati env di compatibilità deprecati per lookup di auth/stato del provider. Preferisci `setup.providers[].envVars` per i nuovi Plugin; OpenClaw continua a leggerlo durante la finestra di deprecazione.                         |
| `providerAuthAliases`                | No            | `Record<string, string>`         | ID dei provider che devono riutilizzare un altro ID provider per il lookup di auth, per esempio un provider di coding che condivide la chiave API e i profili auth del provider di base.                                             |
| `channelEnvVars`                     | No            | `Record<string, string[]>`       | Metadati env economici del canale che OpenClaw può ispezionare senza caricare codice del Plugin. Usali per configurazione canale o superfici auth guidate da env che gli helper generici di avvio/configurazione devono vedere.     |
| `providerAuthChoices`                | No            | `object[]`                       | Metadati economici delle scelte auth per selettori di onboarding, risoluzione del provider preferito e semplice wiring dei flag CLI.                                                                                                |
| `activation`                         | No            | `object`                         | Metadati economici del pianificatore di attivazione per caricamento attivato da avvio, provider, comando, canale, route e capability. Solo metadati; il runtime del Plugin possiede comunque il comportamento effettivo.            |
| `setup`                              | No            | `object`                         | Descrittori economici di setup/onboarding che le superfici di rilevamento e setup possono ispezionare senza caricare il runtime del Plugin.                                                                                         |
| `qaRunners`                          | No            | `object[]`                       | Descrittori economici dei runner QA usati dall'host condiviso `openclaw qa` prima del caricamento del runtime del Plugin.                                                                                                           |
| `contracts`                          | No            | `object`                         | Snapshot statico della proprietà delle capability per hook auth esterni, parlato, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione musicale, generazione video, web-fetch, ricerca web e proprietà degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No            | `Record<string, object>`         | Valori predefiniti economici di comprensione dei media per gli ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                    |
| `imageGenerationProviderMetadata`    | No            | `Record<string, object>`         | Metadati auth economici di generazione immagini per gli ID provider dichiarati in `contracts.imageGenerationProviders`, inclusi alias auth e guard base-url posseduti dal provider.                                                |
| `videoGenerationProviderMetadata`    | No            | `Record<string, object>`         | Metadati auth economici di generazione video per gli ID provider dichiarati in `contracts.videoGenerationProviders`, inclusi alias auth e guard base-url posseduti dal provider.                                                   |
| `musicGenerationProviderMetadata`    | No            | `Record<string, object>`         | Metadati auth economici di generazione musicale per gli ID provider dichiarati in `contracts.musicGenerationProviders`, inclusi alias auth e guard base-url posseduti dal provider.                                                |
| `toolMetadata`                       | No            | `Record<string, object>`         | Metadati economici di disponibilità per strumenti posseduti dal Plugin dichiarati in `contracts.tools`. Usali quando uno strumento non deve caricare il runtime a meno che esistano evidenze di configurazione, env o auth.         |
| `channelConfigs`                     | No            | `Record<string, object>`         | Metadati di configurazione canale posseduti dal manifesto uniti nelle superfici di rilevamento e validazione prima del caricamento del runtime.                                                                                      |
| `skills`                             | No            | `string[]`                       | Directory Skill da caricare, relative alla root del Plugin.                                                                                                                                                                         |
| `name`                               | No       | `string`                         | Nome del Plugin leggibile dall'utente.                                                                                                                                                                                              |
| `description`                        | No       | `string`                         | Breve riepilogo mostrato nelle superfici del Plugin.                                                                                                                                                                                |
| `version`                            | No       | `string`                         | Versione informativa del Plugin.                                                                                                                                                                                                    |
| `uiHints`                            | No       | `Record<string, object>`         | Etichette dell'interfaccia utente, segnaposto e indicazioni sulla sensibilità per i campi di configurazione.                                                                                                                        |

## Riferimento ai metadati del provider di generazione

I campi dei metadati del provider di generazione descrivono segnali di autenticazione statici per i
provider dichiarati nell'elenco `contracts.*GenerationProviders` corrispondente.
OpenClaw legge questi campi prima che il runtime del provider venga caricato, così gli strumenti core possono
decidere se un provider di generazione è disponibile senza importare ogni
Plugin provider.

Usa questi campi solo per fatti dichiarativi ed economici. Trasporto, trasformazioni delle richieste,
aggiornamento dei token, convalida delle credenziali e comportamento effettivo di generazione
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

| Campo           | Obbligatorio | Tipo       | Cosa significa                                                                                                                       |
| --------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`       | No           | `string[]` | ID provider aggiuntivi che devono contare come alias di autenticazione statici per il provider di generazione.                       |
| `authProviders` | No           | `string[]` | ID provider i cui profili di autenticazione configurati devono contare come autenticazione per questo provider di generazione.        |
| `configSignals` | No           | `object[]` | Segnali di disponibilità economici basati solo sulla configurazione per provider locali o self-hosted configurabili senza profili di autenticazione o variabili d'ambiente. |
| `authSignals`   | No           | `object[]` | Segnali di autenticazione espliciti. Quando presenti, sostituiscono il set di segnali predefinito derivato dall'ID provider, da `aliases` e da `authProviders`. |

Ogni voce `configSignals` supporta:

| Campo         | Obbligatorio | Tipo       | Cosa significa                                                                                                                                                                           |
| ------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sì           | `string`   | Percorso puntato verso l'oggetto di configurazione di proprietà del Plugin da ispezionare, per esempio `plugins.entries.example.config`.                                                 |
| `overlayPath` | No           | `string`   | Percorso puntato all'interno della configurazione root il cui oggetto deve sovrapporsi all'oggetto root prima di valutare il segnale. Usalo per configurazioni specifiche di capability come `image`, `video` o `music`. |
| `required`    | No           | `string[]` | Percorsi puntati all'interno della configurazione effettiva che devono avere valori configurati. Le stringhe devono essere non vuote; oggetti e array non devono essere vuoti.           |
| `requiredAny` | No           | `string[]` | Percorsi puntati all'interno della configurazione effettiva in cui almeno uno deve avere un valore configurato.                                                                          |
| `mode`        | No           | `object`   | Guard opzionale della modalità stringa all'interno della configurazione effettiva. Usalo quando la disponibilità basata solo sulla configurazione si applica solo a una modalità.        |

Ogni guard `mode` supporta:

| Campo        | Obbligatorio | Tipo       | Cosa significa                                                                      |
| ------------ | ------------ | ---------- | ----------------------------------------------------------------------------------- |
| `path`       | No           | `string`   | Percorso puntato all'interno della configurazione effettiva. Il valore predefinito è `mode`. |
| `default`    | No           | `string`   | Valore della modalità da usare quando la configurazione omette il percorso.          |
| `allowed`    | No           | `string[]` | Se presente, il segnale passa solo quando la modalità effettiva è uno di questi valori. |
| `disallowed` | No           | `string[]` | Se presente, il segnale fallisce quando la modalità effettiva è uno di questi valori. |

Ogni voce `authSignals` supporta:

| Campo             | Obbligatorio | Tipo     | Cosa significa                                                                                                                                                                 |
| ----------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Sì           | `string` | ID provider da controllare nei profili di autenticazione configurati.                                                                                                          |
| `providerBaseUrl` | No           | `object` | Guard opzionale che fa contare il segnale solo quando il provider configurato referenziato usa un URL di base consentito. Usalo quando un alias di autenticazione è valido solo per certe API. |

Ogni guard `providerBaseUrl` supporta:

| Campo             | Obbligatorio | Tipo       | Cosa significa                                                                                                                                        |
| ----------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì           | `string`   | ID di configurazione del provider il cui `baseUrl` deve essere controllato.                                                                           |
| `defaultBaseUrl`  | No           | `string`   | URL di base da assumere quando la configurazione del provider omette `baseUrl`.                                                                       |
| `allowedBaseUrls` | Sì           | `string[]` | URL di base consentiti per questo segnale di autenticazione. Il segnale viene ignorato quando l'URL di base configurato o predefinito non corrisponde a uno di questi valori normalizzati. |

## Riferimento ai metadati degli strumenti

`toolMetadata` usa le stesse forme `configSignals` e `authSignals` dei
metadati del provider di generazione, indicizzate per nome dello strumento. `contracts.tools` dichiara
la proprietà. `toolMetadata` dichiara prove di disponibilità economiche così OpenClaw può
evitare di importare il runtime di un Plugin solo per fare in modo che la factory del suo strumento restituisca `null`.

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

Se uno strumento non ha `toolMetadata`, OpenClaw conserva il comportamento esistente e
carica il Plugin proprietario quando il contratto dello strumento corrisponde alla policy. Per gli
strumenti hot-path la cui factory dipende da autenticazione/configurazione, gli autori dei Plugin dovrebbero dichiarare
`toolMetadata` invece di far importare al core il runtime per chiedere.

## Riferimento providerAuthChoices

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima che il runtime del provider venga caricato.
Gli elenchi di configurazione dei provider usano queste scelte del manifest, le scelte di configurazione derivate dal descrittore
e i metadati del catalogo di installazione senza caricare il runtime del provider.

| Campo                 | Obbligatorio | Tipo                                            | Cosa significa                                                                                            |
| --------------------- | ------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID provider a cui appartiene questa scelta.                                                               |
| `method`              | Sì           | `string`                                        | ID del metodo di autenticazione a cui effettuare il dispatch.                                             |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                           |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw ripiega su `choiceId`.                                 |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il selettore.                                                                    |
| `assistantPriority`   | No           | `number`                                        | Valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.                |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente consentendo comunque la selezione manuale dalla CLI.     |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID di scelta legacy che devono reindirizzare gli utenti a questa scelta sostitutiva.                      |
| `groupId`             | No           | `string`                                        | ID gruppo opzionale per raggruppare scelte correlate.                                                     |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                            |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                       |
| `optionKey`           | No           | `string`                                        | Chiave opzione interna per flussi di autenticazione semplici con un solo flag.                            |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                           |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'aiuto della CLI.                                                                   |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | Superfici di onboarding in cui questa scelta deve apparire. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento commandAliases

Usa `commandAliases` quando un plugin possiede un nome di comando runtime che gli utenti potrebbero
inserire per errore in `plugins.allow` o provare a eseguire come comando CLI radice. OpenClaw
usa questi metadati per la diagnostica senza importare codice runtime del plugin.

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

| Campo        | Obbligatorio | Tipo              | Significato                                                            |
| ------------ | ------------ | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo plugin.                       |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash di chat anziché comando CLI radice. |
| `cliCommand` | No           | `string`          | Comando CLI radice correlato da suggerire per operazioni CLI, se esiste. |

## riferimento activation

Usa `activation` quando il plugin può dichiarare a basso costo quali eventi del piano di controllo
dovrebbero includerlo in un piano di attivazione/caricamento.

Questo blocco è costituito da metadati del pianificatore, non da un'API del ciclo di vita. Non registra
comportamento runtime, non sostituisce `register(...)` e non promette che
il codice del plugin sia già stato eseguito. Il pianificatore di attivazione usa questi campi per
restringere i plugin candidati prima di ripiegare sui metadati esistenti di proprietà del manifest
come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook.

Preferisci i metadati più specifici che descrivono già la proprietà. Usa
`providers`, `channels`, `commandAliases`, descrittori di setup o `contracts`
quando questi campi esprimono la relazione. Usa `activation` per ulteriori
suggerimenti del pianificatore che non possono essere rappresentati da quei campi di proprietà.
Usa `cliBackends` di primo livello per alias runtime CLI come `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` è solo per
id di harness agente incorporati che non hanno già un campo di proprietà.

Questo blocco è solo metadati. Non registra comportamento runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.
I consumer attuali lo usano come suggerimento di restringimento prima di caricare plugin più ampi, quindi
la mancanza di metadati di attivazione non di startup di solito ha solo un costo prestazionale; non
dovrebbe cambiare la correttezza finché esistono ancora fallback di proprietà del manifest.

Ogni plugin dovrebbe impostare `activation.onStartup` intenzionalmente. Impostalo su `true`
solo quando il plugin deve essere eseguito durante l'avvio del Gateway. Impostalo su `false` quando
il plugin è inerte all'avvio e dovrebbe caricarsi solo da trigger più specifici.
Omettere `onStartup` non carica più implicitamente il plugin all'avvio; usa metadati
di attivazione espliciti per startup, canale, configurazione, agent-harness, memoria o
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

| Campo              | Obbligatorio | Tipo                                                 | Significato                                                                                                                                                                                |
| ------------------ | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | No           | `boolean`                                            | Attivazione esplicita all'avvio del Gateway. Ogni plugin dovrebbe impostarla. `true` importa il plugin durante l'avvio; `false` lo mantiene pigro all'avvio salvo che un altro trigger corrispondente richieda il caricamento. |
| `onProviders`      | No           | `string[]`                                           | Id provider che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                                                                  |
| `onAgentHarnesses` | No           | `string[]`                                           | Id runtime di harness agente incorporati che dovrebbero includere questo plugin nei piani di attivazione/caricamento. Usa `cliBackends` di primo livello per alias backend CLI.            |
| `onCommands`       | No           | `string[]`                                           | Id comando che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                                                                   |
| `onChannels`       | No           | `string[]`                                           | Id canale che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                                                                    |
| `onRoutes`         | No           | `string[]`                                           | Tipi di route che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                                                                |
| `onConfigPaths`    | No           | `string[]`                                           | Percorsi di configurazione relativi alla radice che dovrebbero includere questo plugin nei piani di startup/caricamento quando il percorso è presente e non esplicitamente disabilitato.  |
| `onCapabilities`   | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti di capacità ampi usati dalla pianificazione dell'attivazione del piano di controllo. Preferisci campi più specifici quando possibile.                                        |

Consumer live attuali:

- La pianificazione di avvio del Gateway usa `activation.onStartup` per l'importazione
  esplicita all'avvio
- la pianificazione CLI attivata da comandi ripiega sui legacy
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la pianificazione di avvio agent-runtime usa `activation.onAgentHarnesses` per
  harness incorporati e `cliBackends[]` di primo livello per alias runtime CLI
- la pianificazione di setup/canale attivata da canale ripiega sulla proprietà legacy `channels[]`
  quando mancano metadati espliciti di attivazione del canale
- la pianificazione dei plugin di startup usa `activation.onConfigPaths` per superfici di configurazione radice
  non di canale, come il blocco `browser` del plugin browser incluso
- la pianificazione di setup/runtime attivata da provider ripiega sulla proprietà legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti di attivazione
  del provider

La diagnostica del pianificatore può distinguere i suggerimenti di attivazione espliciti dai fallback
di proprietà del manifest. Ad esempio, `activation-command-hint` significa che
`activation.onCommands` ha corrisposto, mentre `manifest-command-alias` significa che il
pianificatore ha usato invece la proprietà `commandAliases`. Queste etichette di motivo sono per
diagnostica host e test; gli autori di plugin dovrebbero continuare a dichiarare i metadati
che descrivono meglio la proprietà.

## riferimento qaRunners

Usa `qaRunners` quando un plugin contribuisce uno o più runner di trasporto sotto
la radice condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il runtime
del plugin possiede ancora la registrazione CLI effettiva tramite una superficie
`runtime-api.ts` leggera che esporta `qaRunnerCliRegistrations`.

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
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, per esempio `matrix`.   |
| `description` | No           | `string` | Testo di aiuto fallback usato quando l'host condiviso richiede un comando stub. |

## riferimento setup

Usa `setup` quando le superfici di configurazione e onboarding richiedono metadati a basso costo
posseduti dal plugin prima dei caricamenti runtime.

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

`cliBackends` di primo livello resta valido e continua a descrivere backend di inferenza CLI.
`setup.cliBackends` è la superficie descrittore specifica del setup per flussi
piano di controllo/setup che dovrebbero restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di ricerca
preferita descriptor-first per la scoperta del setup. Se il descrittore restringe solo
il plugin candidato e il setup richiede ancora hook runtime di setup più ricchi,
imposta `requiresRuntime: true` e mantieni `setup-api` come percorso di esecuzione
fallback.

OpenClaw include anche `setup.providers[].envVars` nelle ricerche generiche di auth provider e
variabili d'ambiente. `providerAuthEnvVars` resta supportato tramite un adattatore di compatibilità
durante la finestra di deprecazione, ma i plugin non inclusi che lo usano ancora
ricevono una diagnostica del manifest. I nuovi plugin dovrebbero mettere i metadati env
di setup/stato in `setup.providers[].envVars`.

OpenClaw può anche derivare scelte di setup semplici da `setup.providers[].authMethods`
quando non è disponibile alcuna entry di setup, o quando `setup.requiresRuntime: false`
dichiara non necessario il runtime di setup. Le voci esplicite `providerAuthChoices` restano
preferite per etichette personalizzate, flag CLI, ambito di onboarding e metadati dell'assistente.

Imposta `requiresRuntime: false` solo quando questi descrittori sono sufficienti per la
superficie di setup. OpenClaw tratta `false` esplicito come un contratto solo descrittore
e non eseguirà `setup-api` o `openclaw.setupEntry` per la ricerca del setup. Se
un plugin solo descrittore include comunque una di quelle entry runtime di setup,
OpenClaw segnala una diagnostica additiva e continua a ignorarla. Omettere
`requiresRuntime` mantiene il comportamento fallback legacy, così i plugin esistenti che hanno aggiunto
descrittori senza il flag non si interrompono.

Poiché la ricerca del setup può eseguire codice `setup-api` posseduto dal plugin, i valori
normalizzati `setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra
i plugin scoperti. La proprietà ambigua fallisce in modo chiuso invece di scegliere un
vincitore dall'ordine di scoperta.

Quando il runtime di setup viene eseguito, la diagnostica del registro di setup segnala drift dei descrittori
se `setup-api` registra un provider o backend CLI che i descrittori del manifest
non dichiarano, o se un descrittore non ha una registrazione runtime
corrispondente. Queste diagnostiche sono additive e non rifiutano plugin legacy.

### riferimento setup.providers

| Campo          | Obbligatorio | Tipo       | Significato                                                                                     |
| -------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `id`           | Sì           | `string`   | Id provider esposto durante setup o onboarding. Mantieni gli id normalizzati globalmente univoci. |
| `authMethods`  | No           | `string[]` | Id dei metodi di setup/auth supportati da questo provider senza caricare l'intero runtime.       |
| `envVars`      | No           | `string[]` | Variabili d'ambiente che le superfici generiche di setup/stato possono verificare prima del caricamento runtime del plugin. |
| `authEvidence` | No           | `object[]` | Controlli economici di evidenza auth locale per provider che possono autenticarsi tramite marker non segreti. |

`authEvidence` serve per marcatori locali delle credenziali di proprietà del provider che possono essere
verificati senza caricare codice runtime. Questi controlli devono restare economici e locali:
nessuna chiamata di rete, nessuna lettura da portachiavi o gestori di segreti, nessun comando shell e nessuna
verifica tramite API del provider.

Voci di prova supportate:

| Campo              | Obbligatorio | Tipo       | Significato                                                                                                  |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Sì           | `string`   | Attualmente `local-file-with-env`.                                                                          |
| `fileEnvVar`       | No           | `string`   | Variabile di ambiente contenente un percorso esplicito al file delle credenziali.                            |
| `fallbackPaths`    | No           | `string[]` | Percorsi locali dei file delle credenziali controllati quando `fileEnvVar` è assente o vuota. Supporta `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | No           | `string[]` | Almeno una delle variabili di ambiente elencate deve essere non vuota prima che la prova sia valida.         |
| `requiresAllEnv`   | No           | `string[]` | Ogni variabile di ambiente elencata deve essere non vuota prima che la prova sia valida.                     |
| `credentialMarker` | Sì           | `string`   | Marcatore non segreto restituito quando la prova è presente.                                                |
| `source`           | No           | `string`   | Etichetta della sorgente visibile all'utente per l'output di autenticazione/stato.                          |

### campi di configurazione

| Campo              | Obbligatorio | Tipo       | Significato                                                                                       |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di configurazione dei provider esposti durante la configurazione e l'onboarding.      |
| `cliBackends`      | No           | `string[]` | ID dei backend usati in fase di configurazione per la ricerca basata prima sui descrittori. Mantieni gli ID normalizzati univoci a livello globale. |
| `configMigrations` | No           | `string[]` | ID delle migrazioni di configurazione di proprietà della superficie di configurazione di questo plugin. |
| `requiresRuntime`  | No           | `boolean`  | Indica se la configurazione richiede ancora l'esecuzione di `setup-api` dopo la ricerca dei descrittori. |

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
| `label`       | `string`   | Etichetta del campo visibile all'utente. |
| `help`        | `string`   | Breve testo di aiuto.                 |
| `tags`        | `string[]` | Tag UI opzionali.                     |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.  |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input del modulo. |

## riferimento contracts

Usa `contracts` solo per metadati statici di proprietà delle capacità che OpenClaw può
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
| `embeddedExtensionFactories`     | `string[]` | ID delle factory di estensioni del server app Codex, attualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | ID runtime per cui un plugin incluso può registrare middleware dei risultati degli strumenti. |
| `externalAuthProviders`          | `string[]` | ID dei provider di cui questo plugin possiede l'hook del profilo di autenticazione esterna. |
| `speechProviders`                | `string[]` | ID dei provider vocali di proprietà di questo plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione in tempo reale di proprietà di questo plugin. |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider voce in tempo reale di proprietà di questo plugin.  |
| `memoryEmbeddingProviders`       | `string[]` | ID dei provider di embedding della memoria di proprietà di questo plugin. |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider di comprensione dei media di proprietà di questo plugin. |
| `imageGenerationProviders`       | `string[]` | ID dei provider di generazione di immagini di proprietà di questo plugin. |
| `videoGenerationProviders`       | `string[]` | ID dei provider di generazione video di proprietà di questo plugin. |
| `webFetchProviders`              | `string[]` | ID dei provider di recupero web di proprietà di questo plugin.      |
| `webSearchProviders`             | `string[]` | ID dei provider di ricerca web di proprietà di questo plugin.       |
| `migrationProviders`             | `string[]` | ID dei provider di importazione di proprietà di questo plugin per `openclaw migrate`. |
| `tools`                          | `string[]` | Nomi degli strumenti agente di proprietà di questo plugin.          |

`contracts.embeddedExtensionFactories` viene mantenuto per le factory di estensioni
solo per server app Codex incluse. Le trasformazioni dei risultati degli strumenti incluse dovrebbero
dichiarare `contracts.agentToolResultMiddleware` e registrarsi invece con
`api.registerAgentToolResultMiddleware(...)`. I plugin esterni non possono
registrare middleware dei risultati degli strumenti perché il punto di integrazione può riscrivere output di strumenti
ad alta fiducia prima che il modello lo veda.

Le registrazioni runtime `api.registerTool(...)` devono corrispondere a `contracts.tools`.
La scoperta degli strumenti usa questo elenco per caricare solo i runtime dei plugin che possono possedere gli
strumenti richiesti.

I plugin provider che implementano `resolveExternalAuthProfiles` dovrebbero dichiarare
`contracts.externalAuthProviders`. I plugin senza la dichiarazione passano ancora
attraverso un fallback di compatibilità deprecato, ma quel fallback è più lento e
verrà rimosso dopo la finestra di migrazione.

I provider di embedding della memoria inclusi dovrebbero dichiarare
`contracts.memoryEmbeddingProviders` per ogni ID adattatore che espongono, inclusi
gli adattatori integrati come `local`. I percorsi CLI autonomi usano questo contratto di manifest
per caricare solo il plugin proprietario prima che il runtime completo del Gateway abbia
registrato i provider.

## riferimento mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` quando un provider di comprensione dei media ha
modelli predefiniti, priorità di fallback di autenticazione automatica o supporto nativo ai documenti di cui
gli helper core generici hanno bisogno prima del caricamento del runtime. Le chiavi devono anche essere dichiarate in
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacità multimediali esposte da questo provider.                          |
| `defaultModels`        | `Record<string, string>`            | Valori predefiniti capacità-modello usati quando la configurazione non specifica un modello. |
| `autoPriority`         | `Record<string, number>`            | I numeri più bassi vengono ordinati prima per il fallback automatico del provider basato sulle credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input di documenti nativi supportati dal provider.                         |

## riferimento channelConfigs

Usa `channelConfigs` quando un plugin di canale richiede metadati di configurazione economici prima del
caricamento del runtime. La scoperta in sola lettura della configurazione/stato del canale può usare questi metadati
direttamente per canali esterni configurati quando non è disponibile alcuna voce di configurazione, oppure
quando `setup.requiresRuntime: false` dichiara non necessario il runtime di configurazione.

`channelConfigs` è metadato del manifest del plugin, non una nuova sezione di configurazione utente di primo livello.
Gli utenti configurano comunque le istanze di canale sotto `channels.<channel-id>`.
OpenClaw legge i metadati del manifest per decidere quale plugin possiede quel canale
configurato prima che il codice runtime del plugin venga eseguito.

Per un plugin di canale, `configSchema` e `channelConfigs` descrivono percorsi diversi:

- `configSchema` convalida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` convalida `channels.<channel-id>`

I plugin non inclusi che dichiarano `channels[]` dovrebbero dichiarare anche le voci
`channelConfigs` corrispondenti. Senza di esse, OpenClaw può comunque caricare il plugin, ma
lo schema di configurazione nei percorsi freddi, la configurazione e le superfici della Control UI non possono conoscere la
forma delle opzioni di proprietà del canale finché il runtime del plugin non viene eseguito.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` possono dichiarare valori predefiniti statici `auto` per i controlli di configurazione dei comandi
che vengono eseguiti prima del caricamento del runtime del canale. I canali inclusi possono anche pubblicare
gli stessi valori predefiniti tramite `package.json#openclaw.channel.commands` insieme
agli altri metadati del catalogo dei canali di proprietà del pacchetto.

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
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Obbligatorio per ogni voce di configurazione di canale dichiarata. |
| `uiHints`     | `Record<string, object>` | Etichette UI, segnaposto e indicazioni sensibili facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita alle superfici di selezione e ispezione quando i metadati di runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                    |
| `commands`    | `object`                 | Comando nativo statico e impostazioni predefinite automatiche delle Skills native per i controlli di configurazione pre-runtime. |
| `preferOver`  | `string[]`               | ID di Plugin legacy o a priorità inferiore che questo canale deve superare nelle superfici di selezione. |

### Sostituzione di un altro Plugin di canale

Usa `preferOver` quando il tuo Plugin è il proprietario preferito per un ID di canale che
può essere fornito anche da un altro Plugin. I casi comuni sono un ID di Plugin rinominato, un
Plugin autonomo che sostituisce un Plugin incluso, o un fork mantenuto che
mantiene lo stesso ID di canale per la compatibilità della configurazione.

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

Quando `channels.chat` è configurato, OpenClaw considera sia l'ID del canale sia
l'ID del Plugin preferito. Se il Plugin a priorità inferiore è stato selezionato solo perché
è incluso o abilitato per impostazione predefinita, OpenClaw lo disabilita nella configurazione
di runtime effettiva, in modo che un solo Plugin possieda il canale e i relativi strumenti. La selezione esplicita dell'utente
ha comunque la precedenza: se l'utente abilita esplicitamente entrambi i Plugin, OpenClaw
mantiene tale scelta e segnala diagnostiche di canali/strumenti duplicati invece di
modificare silenziosamente l'insieme di Plugin richiesto.

Mantieni `preferOver` limitato agli ID di Plugin che possono davvero fornire lo stesso canale.
Non è un campo di priorità generale e non rinomina le chiavi di configurazione dell'utente.

## Riferimento modelSupport

Usa `modelSupport` quando OpenClaw deve dedurre il tuo Plugin provider da
ID modello abbreviati come `gpt-5.5` o `claude-sonnet-4.6` prima del caricamento del runtime del Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica questa precedenza:

- i riferimenti espliciti `provider/model` usano i metadati del manifest `providers` proprietario
- `modelPatterns` ha la precedenza su `modelPrefixes`
- se un Plugin non incluso e un Plugin incluso corrispondono entrambi, vince il Plugin non incluso
- l'ambiguità restante viene ignorata finché l'utente o la configurazione specifica un provider

Campi:

| Campo           | Tipo       | Significato                                                                    |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.      |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

## Riferimento modelCatalog

Usa `modelCatalog` quando OpenClaw deve conoscere i metadati dei modelli del provider prima
di caricare il runtime del Plugin. Questa è la fonte di proprietà del manifest per righe di catalogo
fisse, alias di provider, regole di soppressione e modalità di discovery. L'aggiornamento di runtime
resta nel codice di runtime del provider, ma il manifest indica al core quando il runtime
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

Campi di livello superiore:

| Campo          | Tipo                                                     | Significato                                                                                                 |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Righe di catalogo per gli ID provider di proprietà di questo Plugin. Le chiavi devono apparire anche in `providers` di livello superiore. |
| `aliases`      | `Record<string, object>`                                 | Alias di provider che devono risolversi a un provider posseduto per la pianificazione del catalogo o delle soppressioni. |
| `suppressions` | `object[]`                                               | Righe di modello da un'altra fonte che questo Plugin sopprime per un motivo specifico del provider.         |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Se il catalogo del provider può essere letto dai metadati del manifest, aggiornato nella cache o richiede il runtime. |

`aliases` partecipa alla ricerca della proprietà del provider per la pianificazione di model-catalog.
Le destinazioni degli alias devono essere provider di livello superiore posseduti dallo stesso Plugin. Quando un
elenco filtrato per provider usa un alias, OpenClaw può leggere il manifest proprietario e
applicare override API/base URL dell'alias senza caricare il runtime del provider.
Gli alias non espandono gli elenchi di catalogo non filtrati; gli elenchi ampi emettono solo
le righe del provider canonico proprietario.

`suppressions` sostituisce il vecchio hook di runtime del provider `suppressBuiltInModel`.
Le voci di soppressione sono rispettate solo quando il provider è posseduto dal Plugin o
dichiarato come chiave `modelCatalog.aliases` che punta a un provider posseduto. Gli hook
di soppressione di runtime non vengono più chiamati durante la risoluzione dei modelli.

Campi del provider:

| Campo     | Tipo                     | Significato                                                       |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL predefinito facoltativo per i modelli in questo catalogo del provider. |
| `api`     | `ModelApi`               | Adattatore API predefinito facoltativo per i modelli in questo catalogo del provider. |
| `headers` | `Record<string, string>` | Header statici facoltativi che si applicano a questo catalogo del provider. |
| `models`  | `object[]`               | Righe modello obbligatorie. Le righe senza un `id` vengono ignorate. |

Campi del modello:

| Campo           | Tipo                                                           | Significato                                                               |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID modello locale del provider, senza il prefisso `provider/`.            |
| `name`          | `string`                                                       | Nome visualizzato facoltativo.                                            |
| `api`           | `ModelApi`                                                     | Override API facoltativo per modello.                                     |
| `baseUrl`       | `string`                                                       | Override base URL facoltativo per modello.                                |
| `headers`       | `Record<string, string>`                                       | Header statici facoltativi per modello.                                   |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalità accettate dal modello.                                           |
| `reasoning`     | `boolean`                                                      | Se il modello espone un comportamento di ragionamento.                    |
| `contextWindow` | `number`                                                       | Finestra di contesto nativa del provider.                                 |
| `contextTokens` | `number`                                                       | Limite di contesto runtime effettivo facoltativo quando diverso da `contextWindow`. |
| `maxTokens`     | `number`                                                       | Token di output massimi quando noti.                                      |
| `cost`          | `object`                                                       | Prezzi facoltativi in USD per milione di token, incluso `tieredPricing` facoltativo. |
| `compat`        | `object`                                                       | Flag di compatibilità facoltativi corrispondenti alla compatibilità della configurazione modello di OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato dell'elenco. Sopprimi solo quando la riga non deve apparire affatto. |
| `statusReason`  | `string`                                                       | Motivo facoltativo mostrato con uno stato non disponibile.                |
| `replaces`      | `string[]`                                                     | ID modello locali del provider più vecchi che questo modello sostituisce. |
| `replacedBy`    | `string`                                                       | ID modello locale del provider sostitutivo per righe deprecate.           |
| `tags`          | `string[]`                                                     | Tag stabili usati da selettori e filtri.                                  |

Campi di soppressione:

| Campo                      | Tipo       | Significato                                                                                             |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID provider per la riga upstream da sopprimere. Deve essere posseduto da questo Plugin o dichiarato come alias posseduto. |
| `model`                    | `string`   | ID modello locale del provider da sopprimere.                                                           |
| `reason`                   | `string`   | Messaggio facoltativo mostrato quando la riga soppressa viene richiesta direttamente.                    |
| `when.baseUrlHosts`        | `string[]` | Elenco facoltativo degli host base URL effettivi del provider richiesti prima che la soppressione si applichi. |
| `when.providerConfigApiIn` | `string[]` | Elenco facoltativo di valori `api` esatti della configurazione del provider richiesti prima che la soppressione si applichi. |

Non inserire dati disponibili solo a runtime in `modelCatalog`. Usa `static` solo quando le righe del manifesto sono abbastanza complete da consentire alle superfici di elenco e selezione filtrate per provider di saltare il rilevamento tramite registro/runtime. Usa `refreshable` quando le righe del manifesto sono seed elencabili utili o integrazioni, ma un aggiornamento/cache può aggiungere altre righe in seguito; le righe refreshable non sono autorevoli da sole. Usa `runtime` quando OpenClaw deve caricare il runtime del provider per conoscere l'elenco.

## riferimento modelIdNormalization

Usa `modelIdNormalization` per una pulizia economica degli ID modello gestita dal provider che deve avvenire prima del caricamento del runtime del provider. Questo mantiene alias come nomi modello brevi, ID legacy locali del provider e regole dei prefissi proxy nel manifesto del plugin proprietario invece che nelle tabelle core di selezione dei modelli.

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

| Campo                                | Tipo                    | Significato                                                                               |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias esatti degli ID modello senza distinzione tra maiuscole e minuscole. I valori vengono restituiti così come scritti. |
| `stripPrefixes`                      | `string[]`              | Prefissi da rimuovere prima della ricerca degli alias, utili per duplicazioni legacy provider/modello. |
| `prefixWhenBare`                     | `string`                | Prefisso da aggiungere quando l'ID modello normalizzato non contiene già `/`.              |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regole condizionali di prefisso per ID semplici dopo la ricerca degli alias, indicizzate da `modelPrefix` e `prefix`. |

## riferimento providerEndpoints

Usa `providerEndpoints` per la classificazione degli endpoint che la policy generica delle richieste deve conoscere prima del caricamento del runtime del provider. Il core continua a possedere il significato di ogni `endpointClass`; i manifesti dei plugin possiedono i metadati di host e URL di base.

Campi degli endpoint:

| Campo                          | Tipo       | Significato                                                                                  |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe di endpoint core nota, come `openrouter`, `moonshot-native` o `google-vertex`.        |
| `hosts`                        | `string[]` | Nomi host esatti che mappano alla classe di endpoint.                                        |
| `hostSuffixes`                 | `string[]` | Suffissi host che mappano alla classe di endpoint. Anteponi `.` per corrispondenza solo con suffissi di dominio. |
| `baseUrls`                     | `string[]` | URL di base HTTP(S) normalizzati esatti che mappano alla classe di endpoint.                 |
| `googleVertexRegion`           | `string`   | Regione statica Google Vertex per host globali esatti.                                       |
| `googleVertexRegionHostSuffix` | `string`   | Suffisso da rimuovere dagli host corrispondenti per esporre il prefisso della regione Google Vertex. |

## riferimento providerRequest

Usa `providerRequest` per metadati economici di compatibilità delle richieste di cui la policy generica delle richieste ha bisogno senza caricare il runtime del provider. Mantieni le riscritture del payload specifiche del comportamento negli hook runtime del provider o negli helper condivisi della famiglia di provider.

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

| Campo                 | Tipo         | Significato                                                                          |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`              | `string`     | Etichetta della famiglia del provider usata dalle decisioni generiche di compatibilità delle richieste e dalla diagnostica. |
| `compatibilityFamily` | `"moonshot"` | Bucket opzionale di compatibilità della famiglia di provider per helper di richiesta condivisi. |
| `openAICompletions`   | `object`     | Flag per richieste di completamento compatibili con OpenAI, attualmente `supportsStreamingUsage`. |

## riferimento modelPricing

Usa `modelPricing` quando un provider necessita di comportamento dei prezzi del control plane prima del caricamento del runtime. La cache dei prezzi del Gateway legge questi metadati senza importare codice runtime del provider.

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
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Imposta `false` per provider locali/self-hosted che non devono mai recuperare prezzi OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Mappatura di lookup dei prezzi OpenRouter. `false` disabilita il lookup OpenRouter per questo provider. |
| `liteLLM`    | `false \| object` | Mappatura di lookup dei prezzi LiteLLM. `false` disabilita il lookup LiteLLM per questo provider. |

Campi sorgente:

| Campo                      | Tipo               | Significato                                                                                                        |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | ID provider del catalogo esterno quando differisce dall'ID provider OpenClaw, per esempio `z-ai` per un provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Tratta gli ID modello contenenti slash come riferimenti annidati provider/modello, utile per provider proxy come OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varianti aggiuntive degli ID modello del catalogo esterno. `version-dots` prova ID versione puntati come `claude-opus-4.6`. |

### Indice dei provider OpenClaw

L'Indice dei provider OpenClaw è un metadato di anteprima posseduto da OpenClaw per provider i cui plugin potrebbero non essere ancora installati. Non fa parte di un manifesto di plugin. I manifesti dei plugin restano l'autorità del plugin installato. L'Indice dei provider è il contratto di fallback interno che le future superfici di selezione modello per provider installabili e pre-installazione consumeranno quando un plugin provider non è installato.

Ordine di autorità del catalogo:

1. Configurazione utente.
2. Manifesto `modelCatalog` del plugin installato.
3. Cache del catalogo modelli da aggiornamento esplicito.
4. Righe di anteprima dell'Indice dei provider OpenClaw.

L'Indice dei provider non deve contenere segreti, stato abilitato, hook runtime o dati modello live specifici dell'account. I suoi cataloghi di anteprima usano la stessa forma di riga provider `modelCatalog` dei manifesti dei plugin, ma dovrebbero restare limitati a metadati di visualizzazione stabili, a meno che campi dell'adattatore runtime come `api`, `baseUrl`, prezzi o flag di compatibilità non siano mantenuti intenzionalmente allineati al manifesto del plugin installato. I provider con rilevamento live `/models` dovrebbero scrivere le righe aggiornate tramite il percorso esplicito della cache del catalogo modelli invece di far chiamare le API del provider alle normali operazioni di elenco o onboarding.

Le voci dell'Indice dei provider possono anche contenere metadati di plugin installabile per provider il cui plugin è stato spostato fuori dal core o non è comunque ancora installato. Questi metadati rispecchiano il modello del catalogo dei canali: nome del pacchetto, specifica di installazione npm, integrità attesa ed etichette economiche per la scelta di autenticazione sono sufficienti per mostrare un'opzione di configurazione installabile. Una volta installato il plugin, il suo manifesto prevale e la voce dell'Indice dei provider viene ignorata per quel provider.

Le chiavi di capability legacy di livello superiore sono deprecate. Usa `openclaw doctor --fix` per spostare `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale caricamento dei manifesti non tratta più quei campi di livello superiore come proprietà delle capability.

## Manifesto rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Rilevamento, validazione della configurazione, metadati di scelta dell'autenticazione e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e il blocco `openclaw` usato per entrypoint, gating dell'installazione, configurazione o metadati di catalogo |

Se non sei sicuro di dove appartenga un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda packaging, file di ingresso o comportamento di installazione npm, inseriscilo in `package.json`

### Campi package.json che influenzano il rilevamento

Alcuni metadati pre-runtime del plugin vivono intenzionalmente in `package.json` sotto il blocco `openclaw` invece che in `openclaw.plugin.json`.
`openclaw.bundle` e `openclaw.bundle.json` non sono contratti di plugin OpenClaw; i plugin nativi devono usare `openclaw.plugin.json` più i campi supportati di `package.json#openclaw` riportati sotto.

Esempi importanti:

| Campo                                                                                      | Cosa significa                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Dichiara gli entrypoint Plugin nativi. Deve restare all'interno della directory del pacchetto Plugin.                                                                                                       |
| `openclaw.runtimeExtensions`                                                               | Dichiara gli entrypoint runtime JavaScript compilati per i pacchetti installati. Deve restare all'interno della directory del pacchetto Plugin.                                                             |
| `openclaw.setupEntry`                                                                      | Entrypoint leggero solo per la configurazione usato durante l'onboarding, l'avvio differito del canale e il rilevamento dello stato canale/SecretRef in sola lettura. Deve restare all'interno della directory del pacchetto Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Dichiara l'entrypoint di configurazione JavaScript compilato per i pacchetti installati. Richiede `setupEntry`, deve esistere e deve restare all'interno della directory del pacchetto Plugin.              |
| `openclaw.channel`                                                                         | Metadati economici del catalogo canali, come etichette, percorsi della documentazione, alias e testo di selezione.                                                                                          |
| `openclaw.channel.commands`                                                                | Metadati statici per comandi nativi e default automatici delle skill native usati da configurazione, audit e superfici di elenco comandi prima del caricamento del runtime del canale.                      |
| `openclaw.channel.configuredState`                                                         | Metadati leggeri del verificatore dello stato configurato che possono rispondere a "esiste già una configurazione solo da env?" senza caricare l'intero runtime del canale.                                |
| `openclaw.channel.persistedAuthState`                                                      | Metadati leggeri del verificatore dell'autenticazione persistita che possono rispondere a "c'è già qualcosa con accesso effettuato?" senza caricare l'intero runtime del canale.                           |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Suggerimenti di installazione/aggiornamento per Plugin inclusi e pubblicati esternamente.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Percorso di installazione preferito quando sono disponibili più origini di installazione.                                                                                                                    |
| `openclaw.install.minHostVersion`                                                          | Versione minima supportata dell'host OpenClaw, usando un limite inferiore semver come `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                                  |
| `openclaw.install.expectedIntegrity`                                                       | Stringa di integrità attesa della distribuzione npm, come `sha512-...`; i flussi di installazione e aggiornamento verificano l'artefatto scaricato rispetto a essa.                                        |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Consente un percorso ristretto di ripristino tramite reinstallazione di un Plugin incluso quando la configurazione non è valida.                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permette alle superfici canale solo di configurazione di caricarsi prima dell'intero Plugin del canale durante l'avvio.                                                                                     |

I metadati del manifesto decidono quali scelte di provider/canale/configurazione appaiono
nell'onboarding prima del caricamento del runtime. `package.json#openclaw.install` indica
all'onboarding come recuperare o abilitare quel Plugin quando l'utente sceglie una di quelle
opzioni. Non spostare i suggerimenti di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del
registro dei manifesti per origini Plugin non incluse. I valori non validi vengono rifiutati;
i valori più recenti ma validi saltano i Plugin esterni sugli host meno recenti. Si presume che i
Plugin sorgente inclusi siano co-versionati con il checkout dell'host.

I metadati ufficiali di installazione su richiesta dovrebbero usare `clawhubSpec` quando il Plugin è
pubblicato su ClawHub; l'onboarding lo tratta come l'origine remota preferita e
registra i fatti dell'artefatto ClawHub dopo l'installazione. `npmSpec` resta il fallback di
compatibilità per i pacchetti che non sono ancora passati a ClawHub.

Il pinning esatto della versione npm vive già in `npmSpec`, per esempio
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci ufficiali del catalogo esterno
dovrebbero abbinare specifiche esatte a `expectedIntegrity` in modo che i flussi di aggiornamento falliscano
in modo chiuso se l'artefatto npm recuperato non corrisponde più al rilascio fissato.
L'onboarding interattivo offre ancora specifiche npm di registri attendibili, inclusi
nomi di pacchetto semplici e dist-tag, per compatibilità. La diagnostica del catalogo può
distinguere origini esatte, mobili, vincolate all'integrità, prive di integrità, con mancata corrispondenza
del nome pacchetto e con scelta predefinita non valida. Avvisa inoltre quando
`expectedIntegrity` è presente ma non esiste un'origine npm valida a cui possa applicare il pin.
Quando `expectedIntegrity` è presente,
i flussi di installazione/aggiornamento lo applicano; quando è omesso, la risoluzione del registro viene
registrata senza un pin di integrità.

I Plugin canale dovrebbero fornire `openclaw.setupEntry` quando scansioni di stato, elenco canali
o SecretRef devono identificare account configurati senza caricare l'intero
runtime. L'entry di configurazione dovrebbe esporre metadati del canale più adapter di configurazione,
stato e segreti sicuri per la configurazione; mantieni client di rete, listener Gateway e
runtime di trasporto nell'entrypoint principale dell'estensione.

I campi degli entrypoint runtime non sovrascrivono i controlli sui confini del pacchetto per i campi
entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non può rendere caricabile un
percorso `openclaw.extensions` in uscita dal pacchetto.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie rotte. Oggi consente solo ai flussi di installazione
di riprendersi da specifici errori obsoleti di aggiornamento di Plugin inclusi, come un
percorso di Plugin incluso mancante o una voce `channels.<id>` obsoleta per quello stesso
Plugin incluso. Errori di configurazione non correlati bloccano comunque l'installazione e indirizzano gli operatori
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è metadato di pacchetto per un minuscolo modulo
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

Usalo quando flussi di configurazione, doctor, stato o presenza in sola lettura richiedono una sonda di autenticazione
economica sì/no prima del caricamento dell'intero Plugin canale. Lo stato di autenticazione persistito non è
stato canale configurato: non usare questi metadati per abilitare automaticamente Plugin,
riparare dipendenze runtime o decidere se un runtime canale debba caricarsi.
L'export di destinazione dovrebbe essere una piccola funzione che legge solo lo stato persistito; non
instradarlo attraverso il barrel completo del runtime del canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici di configurazione
solo da env:

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

Usalo quando un canale può rispondere allo stato configurato da env o altri input minuscoli
non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero
runtime del canale, mantieni quella logica invece nell'hook `config.hasConfiguredState`
del Plugin.

## Precedenza di rilevamento (id Plugin duplicati)

OpenClaw rileva Plugin da diverse radici (inclusi, installazione globale, workspace, percorsi selezionati esplicitamente dalla configurazione). Se due rilevamenti condividono lo stesso `id`, viene mantenuto solo il manifesto con la **precedenza più alta**; i duplicati con precedenza inferiore vengono scartati invece di essere caricati accanto a esso.

Precedenza, dalla più alta alla più bassa:

1. **Selezionato dalla configurazione** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Incluso** — Plugin distribuiti con OpenClaw
3. **Installazione globale** — Plugin installati nella radice globale dei Plugin OpenClaw
4. **Workspace** — Plugin rilevati rispetto al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un Plugin incluso presente nel workspace non metterà in ombra la build inclusa.
- Per sovrascrivere davvero un Plugin incluso con uno locale, fissalo tramite `plugins.entries.<id>` così vince per precedenza invece di fare affidamento sul rilevamento del workspace.
- Gli scarti dei duplicati vengono registrati in log così Doctor e la diagnostica di avvio possono indicare la copia scartata.
- Le sovrascritture duplicate selezionate dalla configurazione sono formulate come sovrascritture esplicite nella diagnostica, ma avvisano comunque così fork obsoleti e ombreggiamenti accidentali restano visibili.

## Requisiti JSON Schema

- **Ogni Plugin deve includere un JSON Schema**, anche se non accetta configurazione.
- Uno schema vuoto è accettabile (per esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati al momento di lettura/scrittura della configurazione, non a runtime.
- Quando estendi o forki un Plugin incluso con nuove chiavi di configurazione, aggiorna contemporaneamente il `configSchema` di `openclaw.plugin.json` di quel Plugin. Gli schemi dei Plugin inclusi sono rigorosi, quindi aggiungere `plugins.entries.<id>.config.myNewKey` nella configurazione utente senza aggiungere `myNewKey` a `configSchema.properties` verrà rifiutato prima del caricamento del runtime del Plugin.

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

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'id del canale sia dichiarato da
  un manifesto Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a id Plugin **rilevabili**. Gli id sconosciuti sono **errori**.
- Se un Plugin è installato ma ha un manifesto o uno schema rotto o mancante,
  la validazione fallisce e Doctor segnala l'errore del Plugin.
- Se esiste una configurazione del Plugin ma il Plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + log.

Vedi [Riferimento di configurazione](/it/gateway/configuration) per lo schema completo di `plugins.*`.

## Note

- Il manifesto è **obbligatorio per i plugin OpenClaw nativi**, inclusi i caricamenti dal file system locale. Il runtime carica comunque separatamente il modulo del plugin; il manifesto serve solo per discovery + validazione.
- I manifesti nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi senza virgolette sono accettati purché il valore finale sia comunque un oggetto.
- Il loader del manifesto legge solo i campi documentati del manifesto. Evita chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono essere tutti omessi quando un plugin non ne ha bisogno.
- `providerDiscoveryEntry` deve restare leggero e non dovrebbe importare codice runtime ampio; usalo per metadati statici del catalogo provider o descrittori di discovery ristretti, non per l’esecuzione al momento della richiesta.
- I tipi di plugin esclusivi vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` tramite `plugins.slots.memory`, `kind: "context-engine"` tramite `plugins.slots.contextEngine` (predefinito `legacy`).
- Dichiara il tipo di plugin esclusivo in questo manifesto. `OpenClawPluginDefinition.kind` dell’entry runtime è deprecato e rimane solo come fallback di compatibilità per i plugin più vecchi.
- I metadati delle variabili d’ambiente (`setup.providers[].envVars`, il deprecato `providerAuthEnvVars` e `channelEnvVars`) sono solo dichiarativi. Stato, audit, validazione della consegna Cron e altre superfici in sola lettura applicano comunque l’attendibilità del plugin e la policy di attivazione effettiva prima di trattare una variabile d’ambiente come configurata.
- Per i metadati del wizard runtime che richiedono codice provider, vedi [hook runtime dei provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build e qualsiasi requisito di allowlist del package manager (ad esempio, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Correlati

<CardGroup cols={3}>
  <Card title="Creazione di plugin" href="/it/plugins/building-plugins" icon="rocket">
    Primi passi con i plugin.
  </Card>
  <Card title="Architettura dei plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello delle capacità.
  </Card>
  <Card title="Panoramica dell'SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento dell’SDK dei plugin e importazioni da sottopercorsi.
  </Card>
</CardGroup>
