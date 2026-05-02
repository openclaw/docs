---
read_when:
    - Stai creando un Plugin OpenClaw
    - Devi rilasciare uno schema di configurazione del plugin o eseguire il debug degli errori di validazione del plugin
summary: Requisiti del manifest del Plugin + schema JSON (validazione rigorosa della configurazione)
title: Manifest del Plugin
x-i18n:
    generated_at: "2026-05-02T08:29:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 371a7364374df57c0b4a55229b86beea24140d0b352a54e8281e103bf66f5662
    source_path: plugins/manifest.md
    workflow: 16
---

Questa pagina è solo per il **manifest nativo del plugin OpenClaw**.

Per i layout di bundle compatibili, vedi [Bundle dei plugin](/it/plugins/bundles).

I formati di bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito dei componenti Claude
  senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout di bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le radici
delle skill dichiarate, le radici dei comandi Claude, i valori predefiniti di `settings.json`
del bundle Claude, i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde
alle aspettative del runtime OpenClaw.

Ogni plugin OpenClaw nativo **deve** includere un file `openclaw.plugin.json` nella
**radice del plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire codice del plugin**. I manifest mancanti o non validi sono trattati come
errori del plugin e bloccano la validazione della configurazione.

Consulta la guida completa al sistema di plugin: [Plugin](/it/tools/plugin).
Per il modello di capacità nativo e le indicazioni attuali sulla compatibilità esterna:
[Modello di capacità](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` sono i metadati che OpenClaw legge **prima di caricare il codice del tuo
plugin**. Tutto ciò che segue deve essere abbastanza leggero da poter essere ispezionato senza avviare
il runtime del plugin.

**Usalo per:**

- identità del plugin, validazione della configurazione e suggerimenti per l'interfaccia di configurazione
- metadati di autenticazione, onboarding e configurazione iniziale (alias, abilitazione automatica, variabili d'ambiente del provider, scelte di autenticazione)
- suggerimenti di attivazione per le superfici del piano di controllo
- proprietà abbreviata delle famiglie di modelli
- snapshot statici della proprietà delle capacità (`contracts`)
- metadati del runner QA che l'host condiviso `openclaw qa` può ispezionare
- metadati di configurazione specifici del canale uniti nel catalogo e nelle superfici di validazione

**Non usarlo per:** registrare comportamenti di runtime, dichiarare entrypoint di codice
o metadati di installazione npm. Questi appartengono al codice del tuo plugin e a `package.json`.

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

| Campo                                | Obbligatorio | Tipo                             | Significato                                                                                                                                                                                                                       |
| ------------------------------------ | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì           | `string`                         | Id canonico del Plugin. Questo è l'id usato in `plugins.entries.<id>`.                                                                                                                                                            |
| `configSchema`                       | Sì           | `object`                         | JSON Schema inline per la configurazione di questo Plugin.                                                                                                                                                                        |
| `enabledByDefault`                   | No           | `true`                           | Contrassegna un Plugin incluso come abilitato per impostazione predefinita. Omettilo, o imposta qualsiasi valore diverso da `true`, per lasciare il Plugin disabilitato per impostazione predefinita.                            |
| `legacyPluginIds`                    | No           | `string[]`                       | Id legacy che vengono normalizzati in questo id canonico del Plugin.                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                       | Id dei provider che devono abilitare automaticamente questo Plugin quando autenticazione, configurazione o riferimenti ai modelli li menzionano.                                                                                  |
| `kind`                               | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo di Plugin esclusivo usato da `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | No           | `string[]`                       | Id dei canali posseduti da questo Plugin. Usato per la discovery e la convalida della configurazione.                                                                                                                            |
| `providers`                          | No           | `string[]`                       | Id dei provider posseduti da questo Plugin.                                                                                                                                                                                       |
| `providerDiscoveryEntry`             | No           | `string`                         | Percorso del modulo leggero di discovery dei provider, relativo alla radice del Plugin, per metadati del catalogo provider con ambito del manifest che possono essere caricati senza attivare l'intero runtime del Plugin.       |
| `modelSupport`                       | No           | `object`                         | Metadati abbreviati della famiglia di modelli, posseduti dal manifest, usati per caricare automaticamente il Plugin prima del runtime.                                                                                            |
| `modelCatalog`                       | No           | `object`                         | Metadati dichiarativi del catalogo modelli per i provider posseduti da questo Plugin. Questo è il contratto del piano di controllo per futuri elenchi in sola lettura, onboarding, selettori di modelli, alias e soppressione senza caricare il runtime del Plugin. |
| `modelPricing`                       | No           | `object`                         | Policy di lookup dei prezzi esterni posseduta dal provider. Usala per escludere provider locali o ospitati autonomamente dai cataloghi prezzi remoti oppure mappare i riferimenti dei provider agli id catalogo OpenRouter/LiteLLM senza codificare in modo fisso gli id dei provider nel core. |
| `modelIdNormalization`               | No           | `object`                         | Pulizia di alias/prefissi degli id modello posseduta dal provider che deve essere eseguita prima del caricamento del runtime del provider.                                                                                        |
| `providerEndpoints`                  | No           | `object[]`                       | Metadati host/baseUrl degli endpoint, posseduti dal manifest, per rotte provider che il core deve classificare prima del caricamento del runtime del provider.                                                                    |
| `providerRequest`                    | No           | `object`                         | Metadati leggeri di famiglia provider e compatibilità delle richieste usati dalla policy di richiesta generica prima del caricamento del runtime del provider.                                                                    |
| `cliBackends`                        | No           | `string[]`                       | Id dei backend di inferenza CLI posseduti da questo Plugin. Usati per l'autoattivazione all'avvio da riferimenti espliciti nella configurazione.                                                                                 |
| `syntheticAuthRefs`                  | No           | `string[]`                       | Riferimenti a provider o backend CLI il cui hook di autenticazione sintetica posseduto dal Plugin deve essere sondato durante la discovery a freddo dei modelli prima del caricamento del runtime.                               |
| `nonSecretAuthMarkers`               | No           | `string[]`                       | Valori segnaposto delle chiavi API posseduti dal Plugin incluso che rappresentano stato di credenziali locali, OAuth o ambienti non segrete.                                                                                     |
| `commandAliases`                     | No           | `object[]`                       | Nomi dei comandi posseduti da questo Plugin che devono produrre diagnostica della configurazione e della CLI consapevole del Plugin prima del caricamento del runtime.                                                           |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`       | Metadati env di compatibilità deprecati per il lookup di autenticazione/stato del provider. Preferisci `setup.providers[].envVars` per i nuovi Plugin; OpenClaw continua a leggerlo durante la finestra di deprecazione.         |
| `providerAuthAliases`                | No           | `Record<string, string>`         | Id dei provider che devono riutilizzare un altro id provider per il lookup di autenticazione, per esempio un provider di coding che condivide la chiave API e i profili di autenticazione del provider di base.                  |
| `channelEnvVars`                     | No           | `Record<string, string[]>`       | Metadati env leggeri dei canali che OpenClaw può ispezionare senza caricare codice del Plugin. Usali per setup dei canali guidato da env o superfici di autenticazione che gli helper generici di avvio/configurazione devono vedere. |
| `providerAuthChoices`                | No           | `object[]`                       | Metadati leggeri delle scelte di autenticazione per selettori di onboarding, risoluzione del provider preferito e semplice cablaggio dei flag CLI.                                                                               |
| `activation`                         | No           | `object`                         | Metadati leggeri del planner di attivazione per caricamento attivato da avvio, provider, comando, canale, rotta e capability. Solo metadati; il runtime del Plugin resta responsabile del comportamento effettivo.              |
| `setup`                              | No           | `object`                         | Descrittori leggeri di setup/onboarding che le superfici di discovery e setup possono ispezionare senza caricare il runtime del Plugin.                                                                                          |
| `qaRunners`                          | No           | `object[]`                       | Descrittori leggeri dei runner QA usati dall'host condiviso `openclaw qa` prima del caricamento del runtime del Plugin.                                                                                                          |
| `contracts`                          | No           | `object`                         | Snapshot statico della proprietà delle capability per hook di autenticazione esterni, parlato, trascrizione realtime, voce realtime, comprensione dei media, generazione immagini, generazione musicale, generazione video, web-fetch, ricerca web e proprietà degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No           | `Record<string, object>`         | Default leggeri di comprensione dei media per gli id provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                              |
| `imageGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati leggeri di autenticazione per la generazione di immagini per gli id provider dichiarati in `contracts.imageGenerationProviders`, inclusi alias di autenticazione e guardie base-url posseduti dal provider.             |
| `videoGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati leggeri di autenticazione per la generazione di video per gli id provider dichiarati in `contracts.videoGenerationProviders`, inclusi alias di autenticazione e guardie base-url posseduti dal provider.                |
| `musicGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati leggeri di autenticazione per la generazione musicale per gli id provider dichiarati in `contracts.musicGenerationProviders`, inclusi alias di autenticazione e guardie base-url posseduti dal provider.                |
| `toolMetadata`                       | No           | `Record<string, object>`         | Metadati leggeri di disponibilità per strumenti posseduti dal Plugin dichiarati in `contracts.tools`. Usali quando uno strumento non deve caricare il runtime a meno che esistano evidenze di configurazione, env o autenticazione. |
| `channelConfigs`                     | No           | `Record<string, object>`         | Metadati di configurazione dei canali posseduti dal manifest uniti nelle superfici di discovery e convalida prima del caricamento del runtime.                                                                                    |
| `skills`                             | No           | `string[]`                       | Directory delle Skills da caricare, relative alla radice del Plugin.                                                                                                                                                              |
| `name`                               | No           | `string`                         | Nome leggibile del Plugin.                                                                                                                                                                                                         |
| `description`                        | No       | `string`                         | Breve riepilogo mostrato nelle superfici Plugin.                                                                                                                                                                                             |
| `version`                            | No       | `string`                         | Versione informativa del Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | No       | `Record<string, object>`         | Etichette UI, segnaposto e indicazioni sulla sensibilità per i campi di configurazione.                                                                                                                                                                   |

## Riferimento dei metadati dei provider di generazione

I campi dei metadati dei provider di generazione descrivono segnali di autenticazione statici per
i provider dichiarati nell'elenco `contracts.*GenerationProviders` corrispondente.
OpenClaw legge questi campi prima del caricamento del runtime del provider, in modo che gli strumenti core possano
decidere se un provider di generazione è disponibile senza importare ogni
plugin provider.

Usa questi campi solo per informazioni dichiarative economiche. Trasporto, trasformazioni delle richieste,
aggiornamento dei token, validazione delle credenziali e comportamento effettivo di generazione
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

| Campo           | Obbligatorio | Tipo       | Cosa significa                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | No       | `string[]` | ID provider aggiuntivi che devono contare come alias di autenticazione statici per il provider di generazione.                                       |
| `authProviders` | No       | `string[]` | ID provider i cui profili di autenticazione configurati devono contare come autenticazione per questo provider di generazione.                                      |
| `configSignals` | No       | `object[]` | Segnali di disponibilità economici basati solo sulla configurazione per provider locali o self-hosted che possono essere configurati senza profili di autenticazione o variabili di ambiente. |
| `authSignals`   | No       | `object[]` | Segnali di autenticazione espliciti. Quando presenti, sostituiscono l'insieme di segnali predefinito derivato dall'ID provider, da `aliases` e da `authProviders`.     |

Ogni voce `configSignals` supporta:

| Campo         | Obbligatorio | Tipo       | Cosa significa                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sì      | `string`   | Percorso puntato all'oggetto di configurazione di proprietà del plugin da ispezionare, per esempio `plugins.entries.example.config`.                                                                                    |
| `overlayPath` | No       | `string`   | Percorso puntato all'interno della configurazione radice il cui oggetto deve sovrapporsi all'oggetto radice prima di valutare il segnale. Usalo per configurazioni specifiche di una capacità come `image`, `video` o `music`. |
| `required`    | No       | `string[]` | Percorsi puntati all'interno della configurazione effettiva che devono avere valori configurati. Le stringhe devono essere non vuote; oggetti e array non devono essere vuoti.                                                |
| `requiredAny` | No       | `string[]` | Percorsi puntati all'interno della configurazione effettiva in cui almeno uno deve avere un valore configurato.                                                                                                  |
| `mode`        | No       | `object`   | Guardia facoltativa della modalità stringa all'interno della configurazione effettiva. Usala quando la disponibilità basata solo sulla configurazione si applica solo a una modalità.                                                                |

Ogni guardia `mode` supporta:

| Campo        | Obbligatorio | Tipo       | Cosa significa                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No       | `string`   | Percorso puntato all'interno della configurazione effettiva. Il valore predefinito è `mode`.                          |
| `default`    | No       | `string`   | Valore della modalità da usare quando la configurazione omette il percorso.                                  |
| `allowed`    | No       | `string[]` | Se presente, il segnale passa solo quando la modalità effettiva è uno di questi valori. |
| `disallowed` | No       | `string[]` | Se presente, il segnale fallisce quando la modalità effettiva è uno di questi valori.       |

Ogni voce `authSignals` supporta:

| Campo             | Obbligatorio | Tipo     | Cosa significa                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì      | `string` | ID provider da controllare nei profili di autenticazione configurati.                                                                                                                             |
| `providerBaseUrl` | No       | `object` | Guardia facoltativa che fa contare il segnale solo quando il provider configurato referenziato usa un URL di base consentito. Usala quando un alias di autenticazione è valido solo per determinate API. |

Ogni guardia `providerBaseUrl` supporta:

| Campo             | Obbligatorio | Tipo       | Cosa significa                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì      | `string`   | ID di configurazione provider il cui `baseUrl` deve essere controllato.                                                                                                |
| `defaultBaseUrl`  | No       | `string`   | URL di base da assumere quando la configurazione del provider omette `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Sì      | `string[]` | URL di base consentiti per questo segnale di autenticazione. Il segnale viene ignorato quando l'URL di base configurato o predefinito non corrisponde a uno di questi valori normalizzati. |

## Riferimento dei metadati degli strumenti

`toolMetadata` usa le stesse forme `configSignals` e `authSignals` dei
metadati dei provider di generazione, indicizzate per nome dello strumento. `contracts.tools` dichiara
la proprietà. `toolMetadata` dichiara prove di disponibilità economiche in modo che OpenClaw possa
evitare di importare il runtime di un plugin solo per far restituire `null` alla sua factory dello strumento.

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
carica il plugin proprietario quando il contratto dello strumento corrisponde alla policy. Per gli
strumenti nel percorso critico la cui factory dipende da autenticazione/configurazione, gli autori di plugin dovrebbero dichiarare
`toolMetadata` invece di fare importare al core il runtime per chiedere.

## Riferimento di providerAuthChoices

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima del caricamento del runtime del provider.
Gli elenchi di configurazione dei provider usano queste scelte del manifest, le scelte di configurazione derivate dai descrittori
e i metadati del catalogo di installazione senza caricare il runtime del provider.

| Campo                 | Obbligatorio | Tipo                                            | Cosa significa                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì      | `string`                                        | ID provider a cui appartiene questa scelta.                                                                      |
| `method`              | Sì      | `string`                                        | ID metodo di autenticazione a cui eseguire il dispatch.                                                                           |
| `choiceId`            | Sì      | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                                                  |
| `choiceLabel`         | No       | `string`                                        | Etichetta rivolta all'utente. Se omessa, OpenClaw ripiega su `choiceId`.                                        |
| `choiceHint`          | No       | `string`                                        | Breve testo di aiuto per il selettore.                                                                        |
| `assistantPriority`   | No       | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.                                       |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente consentendo comunque la selezione manuale da CLI.                        |
| `deprecatedChoiceIds` | No       | `string[]`                                      | ID scelta legacy che devono reindirizzare gli utenti a questa scelta sostitutiva.                                 |
| `groupId`             | No       | `string`                                        | ID gruppo facoltativo per raggruppare scelte correlate.                                                          |
| `groupLabel`          | No       | `string`                                        | Etichetta rivolta all'utente per quel gruppo.                                                                        |
| `groupHint`           | No       | `string`                                        | Breve testo di aiuto per il gruppo.                                                                         |
| `optionKey`           | No       | `string`                                        | Chiave opzione interna per flussi di autenticazione semplici con un solo flag.                                                      |
| `cliFlag`             | No       | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                           |
| `cliOption`           | No       | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | No       | `string`                                        | Descrizione usata nell'aiuto CLI.                                                                            |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | Superfici di onboarding in cui questa scelta deve apparire. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento di commandAliases

Usa `commandAliases` quando un plugin possiede un nome di comando runtime che gli utenti potrebbero
inserire per errore in `plugins.allow` o tentare di eseguire come comando CLI radice. OpenClaw
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
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat anziché comando CLI radice. |
| `cliCommand` | No           | `string`          | Comando CLI radice correlato da suggerire per le operazioni CLI, se esiste. |

## riferimento activation

Usa `activation` quando il plugin può dichiarare a basso costo quali eventi del piano di controllo
dovrebbero includerlo in un piano di attivazione/caricamento.

Questo blocco è metadati del planner, non un'API del ciclo di vita. Non registra
comportamenti runtime, non sostituisce `register(...)` e non promette che
il codice del plugin sia già stato eseguito. Il planner di attivazione usa questi campi per
restringere i plugin candidati prima di ripiegare sui metadati di proprietà del manifest esistenti,
come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook.

Preferisci i metadati più ristretti che descrivono già la proprietà. Usa
`providers`, `channels`, `commandAliases`, descrittori di setup o `contracts`
quando questi campi esprimono la relazione. Usa `activation` per suggerimenti aggiuntivi del planner
che non possono essere rappresentati da quei campi di proprietà.
Usa `cliBackends` di primo livello per alias runtime CLI come `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` è solo per
id di harness agent incorporati che non hanno già un campo di proprietà.

Questo blocco è solo metadati. Non registra comportamenti runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.
I consumer attuali lo usano come suggerimento di restringimento prima di un caricamento più ampio dei plugin, quindi
l'assenza di metadati di attivazione non di startup di solito costa solo prestazioni; non
dovrebbe modificare la correttezza finché esistono ancora fallback di proprietà del manifest.

Ogni plugin dovrebbe impostare `activation.onStartup` intenzionalmente. Impostalo su `true`
solo quando il plugin deve essere eseguito durante l'avvio del Gateway. Impostalo su `false` quando
il plugin è inerte all'avvio e dovrebbe caricarsi solo da trigger più ristretti.
Omettere `onStartup` non carica più implicitamente il plugin all'avvio; usa metadati di
attivazione espliciti per startup, canale, configurazione, harness agent, memoria o
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

| Campo              | Obbligatorio | Tipo                                                 | Significato                                                                                                                                                                                        |
| ------------------ | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No           | `boolean`                                            | Attivazione esplicita all'avvio del Gateway. Ogni plugin dovrebbe impostarla. `true` importa il plugin durante l'avvio; `false` lo mantiene lazy all'avvio salvo che un altro trigger corrispondente richieda il caricamento. |
| `onProviders`      | No           | `string[]`                                           | Id dei provider che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                                                                      |
| `onAgentHarnesses` | No           | `string[]`                                           | Id runtime degli harness agent incorporati che dovrebbero includere questo plugin nei piani di attivazione/caricamento. Usa `cliBackends` di primo livello per gli alias backend CLI.              |
| `onCommands`       | No           | `string[]`                                           | Id dei comandi che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                                                                       |
| `onChannels`       | No           | `string[]`                                           | Id dei canali che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                                                                        |
| `onRoutes`         | No           | `string[]`                                           | Tipi di route che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                                                                        |
| `onConfigPaths`    | No           | `string[]`                                           | Percorsi di configurazione relativi alla radice che dovrebbero includere questo plugin nei piani di startup/caricamento quando il percorso è presente e non esplicitamente disabilitato.           |
| `onCapabilities`   | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti di capacità ampi usati dalla pianificazione di attivazione del piano di controllo. Preferisci campi più ristretti quando possibile.                                                   |

Consumer live attuali:

- La pianificazione dell'avvio del Gateway usa `activation.onStartup` per l'importazione
  esplicita all'avvio
- la pianificazione CLI attivata da comando ripiega sui legacy
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la pianificazione dell'avvio dell'agent-runtime usa `activation.onAgentHarnesses` per
  harness incorporati e `cliBackends[]` di primo livello per alias runtime CLI
- la pianificazione setup/canale attivata da canale ripiega sulla proprietà legacy `channels[]`
  quando mancano metadati di attivazione canale espliciti
- la pianificazione dei plugin all'avvio usa `activation.onConfigPaths` per superfici di configurazione radice
  non di canale, come il blocco `browser` del plugin browser incluso
- la pianificazione setup/runtime attivata da provider ripiega sulla proprietà legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati di
  attivazione provider espliciti

La diagnostica del planner può distinguere i suggerimenti di attivazione espliciti dal fallback di
proprietà del manifest. Per esempio, `activation-command-hint` significa che
`activation.onCommands` ha corrisposto, mentre `manifest-command-alias` significa che il
planner ha usato invece la proprietà `commandAliases`. Queste etichette di motivo sono per
la diagnostica dell'host e i test; gli autori di plugin dovrebbero continuare a dichiarare i metadati
che descrivono meglio la proprietà.

## riferimento qaRunners

Usa `qaRunners` quando un plugin contribuisce uno o più runner di trasporto sotto
la radice condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il runtime del plugin
possiede comunque la registrazione CLI effettiva tramite una superficie
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

| Campo         | Obbligatorio | Tipo     | Significato                                                          |
| ------------- | ------------ | -------- | -------------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, per esempio `matrix`.      |
| `description` | No           | `string` | Testo di aiuto di fallback usato quando l'host condiviso necessita di un comando stub. |

## riferimento setup

Usa `setup` quando le superfici di setup e onboarding necessitano di metadati economici di proprietà del plugin
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

`cliBackends` di primo livello resta valido e continua a descrivere backend di inferenza CLI.
`setup.cliBackends` è la superficie descrittore specifica del setup per
flussi di piano di controllo/setup che dovrebbero restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di lookup
descriptor-first preferita per la scoperta del setup. Se il descrittore restringe solo
il plugin candidato e il setup necessita ancora di hook runtime più ricchi in fase di setup,
imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione di fallback.

OpenClaw include anche `setup.providers[].envVars` nei lookup generici di auth provider e
variabili d'ambiente. `providerAuthEnvVars` resta supportato tramite un adattatore di compatibilità
durante la finestra di deprecazione, ma i plugin non inclusi che lo usano ancora
ricevono una diagnostica del manifest. I nuovi plugin dovrebbero mettere i metadati env di setup/status
in `setup.providers[].envVars`.

OpenClaw può anche derivare scelte di setup semplici da `setup.providers[].authMethods`
quando non è disponibile una voce di setup, o quando `setup.requiresRuntime: false`
dichiara che il runtime di setup non è necessario. Le voci esplicite `providerAuthChoices` restano
preferite per etichette personalizzate, flag CLI, ambito di onboarding e metadati dell'assistente.

Imposta `requiresRuntime: false` solo quando quei descrittori sono sufficienti per la
superficie di setup. OpenClaw tratta `false` esplicito come un contratto solo descrittore
e non eseguirà `setup-api` o `openclaw.setupEntry` per il lookup del setup. Se
un plugin solo descrittore distribuisce comunque una di quelle voci runtime di setup,
OpenClaw segnala una diagnostica additiva e continua a ignorarla. L'omissione di
`requiresRuntime` mantiene il comportamento di fallback legacy, così i plugin esistenti che hanno aggiunto
descrittori senza il flag non si rompono.

Poiché il lookup del setup può eseguire codice `setup-api` di proprietà del plugin, i valori
normalizzati `setup.providers[].id` e `setup.cliBackends[]` devono restare unici tra
i plugin scoperti. La proprietà ambigua fallisce in modo chiuso invece di scegliere un
vincitore dall'ordine di scoperta.

Quando il runtime di setup viene eseguito, la diagnostica del registro di setup segnala drift dei descrittori
se `setup-api` registra un provider o backend CLI che i descrittori del manifest
non dichiarano, o se un descrittore non ha una registrazione runtime
corrispondente. Queste diagnostiche sono additive e non rifiutano i plugin legacy.

### riferimento setup.providers

| Campo          | Obbligatorio | Tipo       | Significato                                                                                         |
| -------------- | ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `id`           | Sì           | `string`   | Id del provider esposto durante setup o onboarding. Mantieni gli id normalizzati globalmente unici. |
| `authMethods`  | No           | `string[]` | Id dei metodi di setup/auth supportati da questo provider senza caricare il runtime completo.       |
| `envVars`      | No           | `string[]` | Variabili d'ambiente che le superfici generiche di setup/status possono controllare prima del caricamento del runtime del plugin. |
| `authEvidence` | No           | `object[]` | Controlli economici di evidenza auth locale per provider che possono autenticarsi tramite marker non segreti. |

`authEvidence` serve per marker locali di credenziali di proprietà del provider che possono essere
verificati senza caricare codice runtime. Questi controlli devono restare economici e locali:
nessuna chiamata di rete, nessuna lettura da keychain o secret manager, nessun comando shell e nessun
probe API del provider.

Voci di evidenza supportate:

| Campo              | Obbligatorio | Tipo       | Cosa significa                                                                                                  |
| ------------------ | ------------ | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `type`             | Sì           | `string`   | Attualmente `local-file-with-env`.                                                                              |
| `fileEnvVar`       | No           | `string`   | Variabile env che contiene un percorso esplicito al file delle credenziali.                                      |
| `fallbackPaths`    | No           | `string[]` | Percorsi locali dei file di credenziali controllati quando `fileEnvVar` è assente o vuota. Supporta `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | No           | `string[]` | Almeno una variabile env elencata deve essere non vuota prima che l'evidenza sia valida.                         |
| `requiresAllEnv`   | No           | `string[]` | Ogni variabile env elencata deve essere non vuota prima che l'evidenza sia valida.                               |
| `credentialMarker` | Sì           | `string`   | Marker non segreto restituito quando l'evidenza è presente.                                                      |
| `source`           | No           | `string`   | Etichetta sorgente visibile all'utente per l'output di autenticazione/stato.                                     |

### campi di setup

| Campo              | Obbligatorio | Tipo       | Cosa significa                                                                                         |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.                                  |
| `cliBackends`      | No           | `string[]` | ID backend in fase di setup usati per la ricerca setup descriptor-first. Mantieni gli ID normalizzati globalmente univoci. |
| `configMigrations` | No           | `string[]` | ID di migrazione della config di proprietà della superficie di setup di questo plugin.                  |
| `requiresRuntime`  | No           | `boolean`  | Indica se il setup necessita ancora dell'esecuzione di `setup-api` dopo la ricerca del descrittore.     |

## riferimento `uiHints`

`uiHints` è una mappa dai nomi dei campi di config a piccoli suggerimenti di rendering.

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

| Campo         | Tipo       | Cosa significa                                  |
| ------------- | ---------- | ----------------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente.        |
| `help`        | `string`   | Breve testo di aiuto.                           |
| `tags`        | `string[]` | Tag UI facoltativi.                             |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.            |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo placeholder per gli input dei moduli.     |

## riferimento `contracts`

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

Ogni elenco è facoltativo:

| Campo                            | Tipo       | Cosa significa                                                        |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID factory di estensioni app-server Codex, attualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | ID runtime per cui un plugin incluso può registrare middleware dei risultati degli strumenti. |
| `externalAuthProviders`          | `string[]` | ID provider di cui questo plugin possiede l'hook del profilo di autenticazione esterna. |
| `speechProviders`                | `string[]` | ID dei provider vocali di proprietà di questo plugin.                 |
| `realtimeTranscriptionProviders` | `string[]` | ID provider di trascrizione realtime di proprietà di questo plugin.   |
| `realtimeVoiceProviders`         | `string[]` | ID provider vocali realtime di proprietà di questo plugin.            |
| `memoryEmbeddingProviders`       | `string[]` | ID provider di embedding della memoria di proprietà di questo plugin. |
| `mediaUnderstandingProviders`    | `string[]` | ID provider di comprensione dei media di proprietà di questo plugin.  |
| `imageGenerationProviders`       | `string[]` | ID provider di generazione immagini di proprietà di questo plugin.    |
| `videoGenerationProviders`       | `string[]` | ID provider di generazione video di proprietà di questo plugin.       |
| `webFetchProviders`              | `string[]` | ID provider di web-fetch di proprietà di questo plugin.               |
| `webSearchProviders`             | `string[]` | ID provider di web-search di proprietà di questo plugin.              |
| `migrationProviders`             | `string[]` | ID provider di importazione di proprietà di questo plugin per `openclaw migrate`. |
| `tools`                          | `string[]` | Nomi degli strumenti agente di proprietà di questo plugin.            |

`contracts.embeddedExtensionFactories` è mantenuto per le factory di estensioni solo
app-server Codex incluse. Le trasformazioni incluse dei risultati degli strumenti devono
dichiarare `contracts.agentToolResultMiddleware` e registrarsi invece con
`api.registerAgentToolResultMiddleware(...)`. I plugin esterni non possono
registrare middleware dei risultati degli strumenti perché il seam può riscrivere output
di strumenti ad alta fiducia prima che il modello lo veda.

Le registrazioni runtime `api.registerTool(...)` devono corrispondere a `contracts.tools`.
La scoperta degli strumenti usa questo elenco per caricare solo i runtime dei plugin che possono possedere gli
strumenti richiesti.

I plugin provider che implementano `resolveExternalAuthProfiles` devono dichiarare
`contracts.externalAuthProviders`. I plugin senza la dichiarazione passano ancora
attraverso un fallback di compatibilità deprecato, ma quel fallback è più lento e
sarà rimosso dopo la finestra di migrazione.

I provider inclusi di embedding della memoria devono dichiarare
`contracts.memoryEmbeddingProviders` per ogni ID adapter che espongono, inclusi
adapter integrati come `local`. I percorsi CLI standalone usano questo contratto di manifest
per caricare solo il plugin proprietario prima che il runtime Gateway completo abbia
registrato i provider.

## riferimento `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` quando un provider di comprensione dei media ha
modelli predefiniti, priorità di fallback auto-auth o supporto nativo per documenti di cui
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

| Campo                  | Tipo                                | Cosa significa                                                                |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacità media esposte da questo provider.                                    |
| `defaultModels`        | `Record<string, string>`            | Default capacità-modello usati quando la config non specifica un modello.     |
| `autoPriority`         | `Record<string, number>`            | Numeri più bassi vengono ordinati prima per il fallback automatico del provider basato su credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input di documenti nativi supportati dal provider.                            |

## riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin di canale necessita di metadati di config economici prima del
caricamento del runtime. La scoperta in sola lettura di setup/stato del canale può usare questi metadati
direttamente per canali esterni configurati quando non è disponibile alcuna voce di setup, oppure
quando `setup.requiresRuntime: false` dichiara che il runtime di setup non è necessario.

`channelConfigs` è metadato del manifest del plugin, non una nuova sezione di config
utente di primo livello. Gli utenti configurano comunque le istanze di canale sotto `channels.<channel-id>`.
OpenClaw legge i metadati del manifest per decidere quale plugin possiede quel canale
configurato prima che il codice runtime del plugin venga eseguito.

Per un plugin di canale, `configSchema` e `channelConfigs` descrivono percorsi diversi:

- `configSchema` convalida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` convalida `channels.<channel-id>`

I plugin non inclusi che dichiarano `channels[]` devono dichiarare anche voci
`channelConfigs` corrispondenti. Senza di esse, OpenClaw può comunque caricare il plugin, ma
lo schema di config del cold path, il setup e le superfici Control UI non possono conoscere la
forma delle opzioni di proprietà del canale finché il runtime del plugin non viene eseguito.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` possono dichiarare default statici `auto` per controlli di config dei comandi
che vengono eseguiti prima del caricamento del runtime del canale. I canali inclusi possono anche pubblicare
gli stessi default tramite `package.json#openclaw.channel.commands` insieme agli
altri metadati del catalogo canali di proprietà del pacchetto.

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
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Richiesto per ogni voce dichiarata della configurazione del canale. |
| `uiHints`     | `Record<string, object>` | Etichette/placeholder/indicazioni sensibili UI opzionali per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita alle superfici di selezione e ispezione quando i metadati di runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                    |
| `commands`    | `object`                 | Comando nativo statico e impostazioni predefinite automatiche delle skill native per i controlli di configurazione pre-runtime. |
| `preferOver`  | `string[]`               | ID plugin legacy o con priorità inferiore che questo canale deve superare nelle superfici di selezione. |

### Sostituire un altro plugin di canale

Usa `preferOver` quando il tuo plugin è il proprietario preferito per un ID canale che
può essere fornito anche da un altro plugin. I casi comuni sono un ID plugin rinominato, un
plugin standalone che sostituisce un plugin incluso, o un fork mantenuto che
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

Quando `channels.chat` è configurato, OpenClaw considera sia l’ID canale sia
l’ID plugin preferito. Se il plugin con priorità inferiore era stato selezionato solo perché
è incluso o abilitato per impostazione predefinita, OpenClaw lo disabilita nella
configurazione di runtime effettiva, così un solo plugin possiede il canale e i suoi strumenti. La selezione esplicita dell’utente
ha comunque la precedenza: se l’utente abilita esplicitamente entrambi i plugin, OpenClaw
preserva quella scelta e segnala diagnostica sui canali/strumenti duplicati invece di
modificare silenziosamente l’insieme di plugin richiesto.

Mantieni `preferOver` limitato agli ID plugin che possono realmente fornire lo stesso canale.
Non è un campo di priorità generale e non rinomina le chiavi di configurazione utente.

## Riferimento di modelSupport

Usa `modelSupport` quando OpenClaw deve dedurre il tuo plugin provider da
ID modello abbreviati come `gpt-5.5` o `claude-sonnet-4.6` prima del caricamento
del runtime del plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica questa precedenza:

- i riferimenti espliciti `provider/model` usano i metadati del manifesto `providers` proprietario
- `modelPatterns` ha la precedenza su `modelPrefixes`
- se un plugin non incluso e un plugin incluso corrispondono entrambi, vince il plugin
  non incluso
- le ambiguità rimanenti vengono ignorate finché l’utente o la configurazione non specifica un provider

Campi:

| Campo           | Tipo       | Significato                                                                    |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.      |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

## Riferimento di modelCatalog

Usa `modelCatalog` quando OpenClaw deve conoscere i metadati dei modelli del provider prima
di caricare il runtime del plugin. Questa è la sorgente posseduta dal manifesto per righe di catalogo
fisse, alias provider, regole di soppressione e modalità di discovery. L’aggiornamento runtime
rimane nel codice runtime del provider, ma il manifesto indica al core quando il runtime
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

| Campo          | Tipo                                                     | Significato                                                                                                 |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Righe di catalogo per gli ID provider posseduti da questo plugin. Le chiavi devono comparire anche in `providers` di primo livello. |
| `aliases`      | `Record<string, object>`                                 | Alias provider che devono risolversi a un provider posseduto per la pianificazione del catalogo o della soppressione. |
| `suppressions` | `object[]`                                               | Righe modello provenienti da un’altra sorgente che questo plugin sopprime per un motivo specifico del provider. |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se il catalogo del provider può essere letto dai metadati del manifesto, aggiornato nella cache o richiede runtime. |

`aliases` partecipa alla ricerca della proprietà del provider per la pianificazione del catalogo dei modelli.
Le destinazioni degli alias devono essere provider di primo livello posseduti dallo stesso plugin. Quando un
elenco filtrato per provider usa un alias, OpenClaw può leggere il manifesto proprietario e
applicare override di API/base URL dell’alias senza caricare il runtime del provider.
Gli alias non espandono gli elenchi di catalogo non filtrati; gli elenchi ampi emettono solo
le righe del provider canonico proprietario.

`suppressions` sostituisce il vecchio hook runtime del provider `suppressBuiltInModel`.
Le voci di soppressione vengono rispettate solo quando il provider è posseduto dal plugin o
dichiarato come chiave `modelCatalog.aliases` che punta a un provider posseduto. Gli hook di
soppressione runtime non vengono più chiamati durante la risoluzione del modello.

Campi del provider:

| Campo     | Tipo                     | Significato                                                       |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predefinito opzionale per i modelli in questo catalogo provider. |
| `api`     | `ModelApi`               | Adattatore API predefinito opzionale per i modelli in questo catalogo provider. |
| `headers` | `Record<string, string>` | Header statici opzionali che si applicano a questo catalogo provider. |
| `models`  | `object[]`               | Righe modello richieste. Le righe senza un `id` vengono ignorate.  |

Campi del modello:

| Campo           | Tipo                                                           | Significato                                                               |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID modello locale del provider, senza il prefisso `provider/`.            |
| `name`          | `string`                                                       | Nome visualizzato opzionale.                                              |
| `api`           | `ModelApi`                                                     | Override API opzionale per modello.                                       |
| `baseUrl`       | `string`                                                       | Override opzionale dell’URL base per modello.                             |
| `headers`       | `Record<string, string>`                                       | Header statici opzionali per modello.                                     |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalità accettate dal modello.                                           |
| `reasoning`     | `boolean`                                                      | Indica se il modello espone comportamento di reasoning.                   |
| `contextWindow` | `number`                                                       | Finestra di contesto nativa del provider.                                 |
| `contextTokens` | `number`                                                       | Limite effettivo opzionale del contesto runtime quando diverso da `contextWindow`. |
| `maxTokens`     | `number`                                                       | Token di output massimi quando noti.                                      |
| `cost`          | `object`                                                       | Prezzi opzionali in USD per milione di token, incluso `tieredPricing` opzionale. |
| `compat`        | `object`                                                       | Flag di compatibilità opzionali corrispondenti alla compatibilità della configurazione del modello OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato dell’elenco. Sopprimi solo quando la riga non deve apparire affatto. |
| `statusReason`  | `string`                                                       | Motivo opzionale mostrato con stato non disponibile.                      |
| `replaces`      | `string[]`                                                     | ID modello locali del provider più vecchi che questo modello sostituisce. |
| `replacedBy`    | `string`                                                       | ID modello locale del provider sostitutivo per le righe deprecate.        |
| `tags`          | `string[]`                                                     | Tag stabili usati da selettori e filtri.                                  |

Campi di soppressione:

| Campo                      | Tipo       | Significato                                                                                             |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID provider per la riga upstream da sopprimere. Deve essere posseduto da questo plugin o dichiarato come alias posseduto. |
| `model`                    | `string`   | ID modello locale del provider da sopprimere.                                                           |
| `reason`                   | `string`   | Messaggio opzionale mostrato quando la riga soppressa viene richiesta direttamente.                      |
| `when.baseUrlHosts`        | `string[]` | Elenco opzionale di host effettivi dell’URL base del provider richiesti prima che la soppressione si applichi. |
| `when.providerConfigApiIn` | `string[]` | Elenco opzionale di valori `api` esatti della configurazione del provider richiesti prima che la soppressione si applichi. |

Non inserire dati solo runtime in `modelCatalog`. Usa `static` solo quando le
righe del manifest sono complete a sufficienza perché gli elenchi filtrati per
provider e le superfici di selezione possano saltare la discovery di
registro/runtime. Usa `refreshable` quando le righe del manifest sono semi o
integrazioni elencabili utili, ma un refresh/cache può aggiungere altre righe in
seguito; le righe refreshable non sono autorevoli da sole. Usa `runtime` quando
OpenClaw deve caricare il runtime del provider per conoscere l'elenco.

## Riferimento modelIdNormalization

Usa `modelIdNormalization` per una pulizia economica degli ID modello di
proprietà del provider che deve avvenire prima del caricamento del runtime del
provider. Questo mantiene alias come nomi modello brevi, ID legacy locali del
provider e regole di prefisso proxy nel manifest del Plugin proprietario invece
che nelle tabelle core di selezione del modello.

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

| Campo                                | Tipo                    | Significato                                                                                |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Alias esatti degli ID modello senza distinzione tra maiuscole e minuscole. I valori sono restituiti come scritti. |
| `stripPrefixes`                      | `string[]`              | Prefissi da rimuovere prima della ricerca degli alias, utili per duplicazioni legacy provider/modello. |
| `prefixWhenBare`                     | `string`                | Prefisso da aggiungere quando l'ID modello normalizzato non contiene già `/`.              |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regole condizionali di prefisso per ID nudi dopo la ricerca degli alias, indicizzate da `modelPrefix` e `prefix`. |

## Riferimento providerEndpoints

Usa `providerEndpoints` per la classificazione degli endpoint che la policy
generica delle richieste deve conoscere prima del caricamento del runtime del
provider. Il core possiede ancora il significato di ogni `endpointClass`; i
manifest dei Plugin possiedono i metadati di host e URL base.

Campi degli endpoint:

| Campo                          | Tipo       | Significato                                                                                 |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe di endpoint core nota, come `openrouter`, `moonshot-native` o `google-vertex`.       |
| `hosts`                        | `string[]` | Nomi host esatti che mappano alla classe di endpoint.                                       |
| `hostSuffixes`                 | `string[]` | Suffissi host che mappano alla classe di endpoint. Anteponi `.` per la corrispondenza solo come suffisso di dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizzati esatti che mappano alla classe di endpoint.                   |
| `googleVertexRegion`           | `string`   | Regione Google Vertex statica per host globali esatti.                                      |
| `googleVertexRegionHostSuffix` | `string`   | Suffisso da rimuovere dagli host corrispondenti per esporre il prefisso della regione Google Vertex. |

## Riferimento providerRequest

Usa `providerRequest` per metadati economici di compatibilità delle richieste di
cui la policy generica delle richieste ha bisogno senza caricare il runtime del
provider. Mantieni la riscrittura del payload specifica del comportamento negli
hook runtime del provider o negli helper condivisi della famiglia di provider.

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
| `family`              | `string`     | Etichetta della famiglia di provider usata dalle decisioni generiche di compatibilità delle richieste e dalla diagnostica. |
| `compatibilityFamily` | `"moonshot"` | Bucket opzionale di compatibilità della famiglia di provider per helper di richiesta condivisi. |
| `openAICompletions`   | `object`     | Flag di richiesta completions compatibili con OpenAI, attualmente `supportsStreamingUsage`. |

## Riferimento modelPricing

Usa `modelPricing` quando un provider ha bisogno di comportamento di pricing del
control plane prima del caricamento del runtime. La cache di pricing del Gateway
legge questi metadati senza importare codice runtime del provider.

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
| `external`   | `boolean`         | Imposta `false` per provider locali/self-hosted che non devono mai recuperare pricing OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Mappatura di lookup pricing OpenRouter. `false` disabilita il lookup OpenRouter per questo provider. |
| `liteLLM`    | `false \| object` | Mappatura di lookup pricing LiteLLM. `false` disabilita il lookup LiteLLM per questo provider.      |

Campi della sorgente:

| Campo                      | Tipo               | Significato                                                                                                          |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID provider del catalogo esterno quando differisce dall'ID provider OpenClaw, per esempio `z-ai` per un provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Tratta gli ID modello contenenti slash come riferimenti provider/modello nidificati, utile per provider proxy come OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varianti extra degli ID modello del catalogo esterno. `version-dots` prova ID versione con punti come `claude-opus-4.6`. |

### OpenClaw Provider Index

OpenClaw Provider Index è metadato di anteprima di proprietà di OpenClaw per
provider i cui Plugin potrebbero non essere ancora installati. Non fa parte di
un manifest di Plugin. I manifest dei Plugin restano l'autorità dei Plugin
installati. Provider Index è il contratto di fallback interno che le future
superfici per provider installabili e selettori modello pre-installazione
consumeranno quando un Plugin provider non è installato.

Ordine di autorità del catalogo:

1. Configurazione utente.
2. `modelCatalog` del manifest del Plugin installato.
3. Cache del catalogo modelli da refresh esplicito.
4. Righe di anteprima di OpenClaw Provider Index.

Provider Index non deve contenere segreti, stato abilitato, hook runtime o dati
modello live specifici dell'account. I suoi cataloghi di anteprima usano la
stessa forma di riga provider `modelCatalog` dei manifest dei Plugin, ma
dovrebbero restare limitati a metadati di visualizzazione stabili, a meno che i
campi dell'adapter runtime come `api`, `baseUrl`, pricing o flag di
compatibilità siano intenzionalmente mantenuti allineati al manifest del Plugin
installato. I provider con discovery live `/models` dovrebbero scrivere righe
aggiornate tramite il percorso esplicito della cache del catalogo modelli invece
di far chiamare API del provider alle normali operazioni di elenco o onboarding.

Le voci di Provider Index possono anche contenere metadati di Plugin
installabile per provider il cui Plugin è stato spostato fuori dal core o non è
ancora installato per altri motivi. Questi metadati rispecchiano il pattern del
catalogo canali: nome del pacchetto, spec di installazione npm, integrità
prevista ed etichette economiche per la scelta di autenticazione sono
sufficienti per mostrare un'opzione di setup installabile. Una volta installato
il Plugin, il suo manifest prevale e la voce di Provider Index viene ignorata
per quel provider.

Le chiavi di capability legacy di primo livello sono deprecate. Usa
`openclaw doctor --fix` per spostare `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` sotto
`contracts`; il normale caricamento del manifest non tratta più quei campi di
primo livello come proprietà della capability.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validazione della configurazione, metadati di scelta autenticazione e suggerimenti UI che devono esistere prima dell'esecuzione del codice del Plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating di installazione, setup o metadati catalogo |

Se non sei sicuro di dove appartenga un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del Plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di ingresso o comportamento di installazione npm, mettilo in `package.json`

### Campi package.json che influenzano la discovery

Alcuni metadati pre-runtime dei Plugin vivono intenzionalmente in `package.json`
sotto il blocco `openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Cosa significa                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Dichiara gli entrypoint Plugin nativi. Deve restare all'interno della directory del pacchetto Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Dichiara gli entrypoint runtime JavaScript compilati per i pacchetti installati. Deve restare all'interno della directory del pacchetto Plugin.                                                                 |
| `openclaw.setupEntry`                                             | Entrypoint leggero solo per la configurazione usato durante l'onboarding, l'avvio differito del canale e il rilevamento in sola lettura dello stato del canale/SecretRef. Deve restare all'interno della directory del pacchetto Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Dichiara l'entrypoint di configurazione JavaScript compilato per i pacchetti installati. Richiede `setupEntry`, deve esistere e deve restare all'interno della directory del pacchetto Plugin.                         |
| `openclaw.channel`                                                | Metadati economici del catalogo canali, come etichette, percorsi della documentazione, alias e testo di selezione.                                                                                                 |
| `openclaw.channel.commands`                                       | Metadati statici dei comandi nativi e dei valori predefiniti automatici delle skill native usati da superfici di configurazione, audit ed elenco comandi prima del caricamento del runtime del canale.                                          |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo dello stato configurato che possono rispondere a "la configurazione solo env esiste gia?" senza caricare l'intero runtime del canale.                                         |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo dell'autenticazione persistita che possono rispondere a "qualcosa ha gia effettuato l'accesso?" senza caricare l'intero runtime del canale.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per Plugin inclusi ed esternamente pubblicati.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili piu origini di installazione.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.install.expectedIntegrity`                              | Stringa di integrita npm dist attesa, come `sha512-...`; i flussi di installazione e aggiornamento verificano rispetto a essa l'artefatto scaricato.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di ripristino tramite reinstallazione di un Plugin incluso quando la configurazione non e valida.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permette alle superfici del canale solo di configurazione di caricarsi prima del Plugin completo del canale durante l'avvio.                                                                                                 |

I metadati del manifesto decidono quali scelte di provider/canale/configurazione compaiono
nell'onboarding prima del caricamento del runtime. `package.json#openclaw.install` indica
all'onboarding come recuperare o abilitare quel Plugin quando l'utente sceglie una di quelle
opzioni. Non spostare i suggerimenti di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del
registro dei manifesti per le origini Plugin non incluse. I valori non validi vengono rifiutati;
i valori piu recenti ma validi saltano i Plugin esterni sugli host piu vecchi. Si presume che i
Plugin sorgente inclusi siano co-versionati con il checkout dell'host.

Il pinning della versione npm esatta vive gia in `npmSpec`, per esempio
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci del catalogo esterno ufficiale
dovrebbero associare specifiche esatte a `expectedIntegrity`, cosi i flussi di aggiornamento
falliscono in modo chiuso se l'artefatto npm scaricato non corrisponde piu alla release fissata.
L'onboarding interattivo offre ancora specifiche npm del registro attendibile, inclusi nomi di
pacchetti semplici e dist-tag, per compatibilita. Le diagnostiche del catalogo possono
distinguere origini esatte, mobili, fissate per integrita, prive di integrita, con nome pacchetto
non corrispondente e con scelta predefinita non valida. Avvisano inoltre quando
`expectedIntegrity` e presente ma non esiste alcuna origine npm valida che possa fissare.
Quando `expectedIntegrity` e presente,
i flussi di installazione/aggiornamento la applicano; quando e omessa, la risoluzione del registro
viene registrata senza un pin di integrita.

I Plugin di canale dovrebbero fornire `openclaw.setupEntry` quando stato, elenco canali
o scansioni SecretRef devono identificare account configurati senza caricare l'intero
runtime. L'entry di configurazione dovrebbe esporre metadati del canale piu adapter di
configurazione, stato e segreti sicuri per la configurazione; mantieni client di rete, listener
del Gateway e runtime di trasporto nell'entrypoint principale dell'estensione.

I campi degli entrypoint runtime non sovrascrivono i controlli del confine di pacchetto per i
campi degli entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non puo rendere
caricabile un percorso `openclaw.extensions` che esce dal confine.

`openclaw.install.allowInvalidConfigRecovery` e volutamente ristretto. Non rende installabili
configurazioni arbitrarie danneggiate. Oggi consente ai flussi di installazione solo di
riprendersi da specifici errori obsoleti di aggiornamento di Plugin inclusi, come un percorso
Plugin incluso mancante o una voce `channels.<id>` obsoleta per quello stesso Plugin incluso.
Gli errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano
gli operatori a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` e metadati di pacchetto per un piccolo modulo di controllo:

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

Usalo quando i flussi di configurazione, doctor, stato o presenza in sola lettura richiedono un
probe di autenticazione economico si/no prima che il Plugin completo del canale venga caricato.
Lo stato di autenticazione persistito non e lo stato configurato del canale: non usare questi
metadati per abilitare automaticamente Plugin, riparare dipendenze runtime o decidere se un
runtime di canale debba caricarsi. L'export di destinazione dovrebbe essere una piccola funzione
che legge solo lo stato persistito; non instradarlo attraverso il barrel completo del runtime del
canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici dello stato
configurato solo env:

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

Usalo quando un canale puo rispondere sullo stato configurato da env o da altri piccoli input
non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero
runtime del canale, mantieni quella logica nell'hook Plugin `config.hasConfiguredState`.

## Precedenza di rilevamento (id Plugin duplicati)

OpenClaw rileva i Plugin da diverse radici (inclusi, installazione globale, workspace, percorsi selezionati esplicitamente dalla configurazione). Se due rilevamenti condividono lo stesso `id`, viene mantenuto solo il manifesto con **precedenza piu alta**; i duplicati a precedenza piu bassa vengono scartati invece di essere caricati accanto a esso.

Precedenza, dalla piu alta alla piu bassa:

1. **Selezionato dalla configurazione** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Incluso** — Plugin distribuiti con OpenClaw
3. **Installazione globale** — Plugin installati nella radice globale dei Plugin OpenClaw
4. **Workspace** — Plugin rilevati relativamente al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un Plugin incluso presente nel workspace non oscurera la build inclusa.
- Per sovrascrivere davvero un Plugin incluso con uno locale, fissalo tramite `plugins.entries.<id>` cosi vince per precedenza invece di fare affidamento sul rilevamento del workspace.
- Gli scarti dei duplicati vengono registrati cosi Doctor e le diagnostiche di avvio possono indicare la copia scartata.

## Requisiti dello Schema JSON

- **Ogni Plugin deve distribuire uno Schema JSON**, anche se non accetta configurazione.
- Uno schema vuoto e accettabile (per esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono convalidati al momento della lettura/scrittura della configurazione, non a runtime.

## Comportamento di convalida

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'id del canale non sia dichiarato da
  un manifesto Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a id Plugin **rilevabili**. Gli id sconosciuti sono **errori**.
- Se un Plugin e installato ma ha un manifesto o uno schema danneggiato o mancante,
  la convalida fallisce e Doctor segnala l'errore del Plugin.
- Se la configurazione del Plugin esiste ma il Plugin e **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + log.

Vedi [Riferimento configurazione](/it/gateway/configuration) per lo schema `plugins.*` completo.

## Note

- Il manifesto e **richiesto per i Plugin OpenClaw nativi**, inclusi i caricamenti dal filesystem locale. Il runtime carica comunque il modulo Plugin separatamente; il manifesto serve solo per rilevamento + convalida.
- I manifesti nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi senza virgolette sono accettati finche il valore finale resta comunque un oggetto.
- Il caricatore dei manifesti legge solo i campi del manifesto documentati. Evita chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono tutti essere omessi quando un Plugin non ne ha bisogno.
- `providerDiscoveryEntry` deve restare leggero e non dovrebbe importare ampio codice runtime; usalo per metadati statici del catalogo provider o descrittori di rilevamento ristretti, non per l'esecuzione al momento della richiesta.
- I tipi Plugin esclusivi vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` tramite `plugins.slots.memory`, `kind: "context-engine"` tramite `plugins.slots.contextEngine` (predefinito `legacy`).
- Dichiara il tipo Plugin esclusivo in questo manifesto. `OpenClawPluginDefinition.kind` dell'entry runtime e deprecato e resta solo come fallback di compatibilita per Plugin piu vecchi.
- I metadati delle variabili d'ambiente (`setup.providers[].envVars`, `providerAuthEnvVars` deprecato e `channelEnvVars`) sono solo dichiarativi. Stato, audit, convalida della consegna cron e altre superfici in sola lettura applicano comunque la policy di fiducia del Plugin e di attivazione effettiva prima di trattare una variabile d'ambiente come configurata.
- Per i metadati del wizard runtime che richiedono codice del provider, vedi [hook runtime provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il tuo Plugin dipende da moduli nativi, documenta i passaggi di build e gli eventuali requisiti allowlist del package manager (per esempio, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Correlati

<CardGroup cols={3}>
  <Card title="Creare Plugin" href="/it/plugins/building-plugins" icon="rocket">
    Introduzione ai Plugin.
  </Card>
  <Card title="Architettura Plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello di capacita.
  </Card>
  <Card title="Panoramica SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento SDK Plugin e import di sottopercorsi.
  </Card>
</CardGroup>
