---
read_when:
    - Stai creando un Plugin OpenClaw
    - È necessario pubblicare uno schema di configurazione del Plugin o eseguire il debug degli errori di convalida del Plugin
summary: Requisiti del manifest del Plugin + schema JSON (validazione rigorosa della configurazione)
title: Manifesto del Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

Questa pagina riguarda solo il **manifesto Plugin nativo di OpenClaw**.

Per i layout di pacchetti compatibili, consulta [Pacchetti Plugin](/it/plugins/bundles).

I formati di pacchetto compatibili usano file manifesto diversi:

- Pacchetto Codex: `.codex-plugin/plugin.json`
- Pacchetto Claude: `.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude
  senza manifesto
- Pacchetto Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout di pacchetti, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i pacchetti compatibili, OpenClaw attualmente legge i metadati del pacchetto più le radici
delle skill dichiarate, le radici dei comandi Claude, i valori predefiniti di `settings.json`
del pacchetto Claude, i valori predefiniti LSP del pacchetto Claude e i pacchetti di hook supportati quando il layout corrisponde
alle aspettative del runtime di OpenClaw.

Ogni Plugin nativo di OpenClaw **deve** includere un file `openclaw.plugin.json` nella
**radice del plugin**. OpenClaw usa questo manifesto per validare la configurazione
**senza eseguire il codice del plugin**. I manifesti mancanti o non validi vengono trattati come
errori del plugin e bloccano la validazione della configurazione.

Consulta la guida completa del sistema di plugin: [Plugin](/it/tools/plugin).
Per il modello di capacità nativo e le indicazioni attuali sulla compatibilità esterna:
[Modello di capacità](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge **prima di caricare il tuo
codice del plugin**. Tutto ciò che segue deve essere abbastanza leggero da ispezionare senza avviare
il runtime del plugin.

**Usalo per:**

- identità del plugin, validazione della configurazione e suggerimenti per l'interfaccia di configurazione
- metadati di autenticazione, onboarding e configurazione iniziale (alias, abilitazione automatica, variabili di ambiente del provider, scelte di autenticazione)
- suggerimenti di attivazione per le superfici del piano di controllo
- proprietà abbreviata delle famiglie di modelli
- snapshot statici della proprietà delle capacità (`contracts`)
- metadati del runner QA che l'host condiviso `openclaw qa` può ispezionare
- metadati di configurazione specifici del canale uniti nelle superfici di catalogo e validazione

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

| Campo                                | Obbligatorio | Tipo                             | Significato                                                                                                                                                                                                                                        |
| ------------------------------------ | ------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì           | `string`                         | ID canonico del plugin. È l'ID usato in `plugins.entries.<id>`.                                                                                                                                                                                    |
| `configSchema`                       | Sì           | `object`                         | JSON Schema inline per la configurazione di questo plugin.                                                                                                                                                                                         |
| `enabledByDefault`                   | No           | `true`                           | Contrassegna un plugin incluso come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore non `true`, per lasciare il plugin disabilitato per impostazione predefinita.                                                |
| `enabledByDefaultOnPlatforms`        | No           | `string[]`                       | Contrassegna un plugin incluso come abilitato per impostazione predefinita solo sulle piattaforme Node.js elencate, ad esempio `["darwin"]`. La configurazione esplicita ha comunque la precedenza.                                                |
| `legacyPluginIds`                    | No           | `string[]`                       | ID legacy che vengono normalizzati in questo ID canonico del plugin.                                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                       | ID provider che devono abilitare automaticamente questo plugin quando autenticazione, configurazione o riferimenti ai modelli li menzionano.                                                                                                        |
| `kind`                               | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo di plugin esclusivo usato da `plugins.slots.*`.                                                                                                                                                                                   |
| `channels`                           | No           | `string[]`                       | ID canale posseduti da questo plugin. Usati per discovery e convalida della configurazione.                                                                                                                                                        |
| `providers`                          | No           | `string[]`                       | ID provider posseduti da questo plugin.                                                                                                                                                                                                            |
| `providerCatalogEntry`               | No           | `string`                         | Percorso del modulo leggero del catalogo provider, relativo alla radice del plugin, per metadati del catalogo provider con ambito manifesto che possono essere caricati senza attivare l'intero runtime del plugin.                               |
| `modelSupport`                       | No           | `object`                         | Metadati abbreviati della famiglia di modelli posseduti dal manifesto, usati per caricare automaticamente il plugin prima del runtime.                                                                                                             |
| `modelCatalog`                       | No           | `object`                         | Metadati dichiarativi del catalogo modelli per i provider posseduti da questo plugin. Questo è il contratto del piano di controllo per future liste in sola lettura, onboarding, selettori di modelli, alias e soppressione senza caricare il runtime del plugin. |
| `modelPricing`                       | No           | `object`                         | Criterio di ricerca dei prezzi esterni posseduto dal provider. Usalo per escludere i provider locali/self-hosted dai cataloghi prezzi remoti o mappare i riferimenti provider agli ID catalogo OpenRouter/LiteLLM senza codificare ID provider nel core. |
| `modelIdNormalization`               | No           | `object`                         | Pulizia di alias/prefissi degli ID modello posseduta dal provider che deve essere eseguita prima del caricamento del runtime del provider.                                                                                                         |
| `providerEndpoints`                  | No           | `object[]`                       | Metadati endpoint host/baseUrl posseduti dal manifesto per le route provider che il core deve classificare prima del caricamento del runtime del provider.                                                                                         |
| `providerRequest`                    | No           | `object`                         | Metadati leggeri della famiglia provider e della compatibilità delle richieste usati dal criterio generico delle richieste prima del caricamento del runtime del provider.                                                                         |
| `cliBackends`                        | No           | `string[]`                       | ID backend di inferenza CLI posseduti da questo plugin. Usati per l'autoattivazione all'avvio da riferimenti di configurazione espliciti.                                                                                                          |
| `syntheticAuthRefs`                  | No           | `string[]`                       | Riferimenti provider o backend CLI il cui hook di autenticazione sintetica posseduto dal plugin deve essere sondato durante la discovery a freddo dei modelli prima del caricamento del runtime.                                                   |
| `nonSecretAuthMarkers`               | No           | `string[]`                       | Valori segnaposto delle chiavi API posseduti dal plugin incluso che rappresentano stato di credenziali locali, OAuth o ambientali non segrete.                                                                                                     |
| `commandAliases`                     | No           | `object[]`                       | Nomi di comando posseduti da questo plugin che devono produrre configurazione e diagnostica CLI consapevoli del plugin prima del caricamento del runtime.                                                                                          |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`       | Metadati env di compatibilità deprecati per la ricerca autenticazione/stato del provider. Preferisci `setup.providers[].envVars` per i nuovi plugin; OpenClaw li legge ancora durante la finestra di deprecazione.                                 |
| `providerAuthAliases`                | No           | `Record<string, string>`         | ID provider che devono riutilizzare un altro ID provider per la ricerca dell'autenticazione, ad esempio un provider di coding che condivide la chiave API e i profili di autenticazione del provider di base.                                      |
| `channelEnvVars`                     | No           | `Record<string, string[]>`       | Metadati env leggeri dei canali che OpenClaw può ispezionare senza caricare codice del plugin. Usali per superfici di configurazione o autenticazione dei canali guidate da env che gli helper generici di avvio/configurazione devono vedere.     |
| `providerAuthChoices`                | No           | `object[]`                       | Metadati leggeri delle scelte di autenticazione per selettori di onboarding, risoluzione del provider preferito e semplice cablaggio dei flag CLI.                                                                                                |
| `activation`                         | No           | `object`                         | Metadati leggeri del pianificatore di attivazione per caricamenti attivati da avvio, provider, comando, canale, route e capability. Solo metadati; il runtime del plugin possiede comunque il comportamento effettivo.                             |
| `setup`                              | No           | `object`                         | Descrittori leggeri di configurazione/onboarding che le superfici di discovery e configurazione possono ispezionare senza caricare il runtime del plugin.                                                                                         |
| `qaRunners`                          | No           | `object[]`                       | Descrittori leggeri dei runner QA usati dall'host `openclaw qa` condiviso prima del caricamento del runtime del plugin.                                                                                                                            |
| `contracts`                          | No           | `object`                         | Snapshot statica della proprietà delle capability per hook di autenticazione esterna, speech, trascrizione realtime, voce realtime, comprensione multimediale, generazione di immagini, generazione musicale, generazione video, web-fetch, ricerca web e proprietà degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No           | `Record<string, object>`         | Impostazioni predefinite leggere di comprensione multimediale per gli ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                           |
| `imageGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati leggeri di autenticazione per la generazione di immagini per gli ID provider dichiarati in `contracts.imageGenerationProviders`, inclusi alias di autenticazione posseduti dal provider e guard delle URL di base.                       |
| `videoGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati leggeri di autenticazione per la generazione video per gli ID provider dichiarati in `contracts.videoGenerationProviders`, inclusi alias di autenticazione posseduti dal provider e guard delle URL di base.                              |
| `musicGenerationProviderMetadata`    | No           | `Record<string, object>`         | Metadati leggeri di autenticazione per la generazione musicale per gli ID provider dichiarati in `contracts.musicGenerationProviders`, inclusi alias di autenticazione posseduti dal provider e guard delle URL di base.                           |
| `toolMetadata`                       | No           | `Record<string, object>`         | Metadati leggeri di disponibilità per gli strumenti posseduti dal plugin dichiarati in `contracts.tools`. Usali quando uno strumento non deve caricare il runtime a meno che non esistano prove di configurazione, env o autenticazione.           |
| `channelConfigs`                     | No           | `Record<string, object>`         | Metadati di configurazione dei canali posseduti dal manifesto uniti nelle superfici di discovery e convalida prima del caricamento del runtime.                                                                                                    |
| `skills`                             | No           | `string[]`                       | Directory di Skills da caricare, relativi alla radice del plugin.                                                                                                                                                                                  |
| `name`                               | No       | `string`                         | Nome del Plugin leggibile da una persona.                                                                                                                                                                                                         |
| `description`                        | No       | `string`                         | Breve riepilogo mostrato nelle interfacce del Plugin.                                                                                                                                                                                             |
| `version`                            | No       | `string`                         | Versione informativa del Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | No       | `Record<string, object>`         | Etichette UI, segnaposto e indicazioni sulla sensibilità per i campi di configurazione.                                                                                                                                                                   |

## Riferimento ai metadati del provider di generazione

I campi dei metadati del provider di generazione descrivono segnali di autenticazione statici per
i provider dichiarati nell'elenco `contracts.*GenerationProviders` corrispondente.
OpenClaw legge questi campi prima del caricamento del runtime del provider, così gli strumenti core possono
decidere se un provider di generazione è disponibile senza importare ogni
Plugin provider.

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

| Campo           | Obbligatorio | Tipo       | Significato                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | No       | `string[]` | ID provider aggiuntivi che devono contare come alias di autenticazione statici per il provider di generazione.                                       |
| `authProviders` | No       | `string[]` | ID provider i cui profili di autenticazione configurati devono contare come autenticazione per questo provider di generazione.                                      |
| `configSignals` | No       | `object[]` | Segnali di disponibilità economici basati solo sulla configurazione per provider locali o self-hosted che possono essere configurati senza profili di autenticazione o variabili di ambiente. |
| `authSignals`   | No       | `object[]` | Segnali di autenticazione espliciti. Quando presenti, sostituiscono l'insieme di segnali predefinito derivato dall'ID provider, da `aliases` e da `authProviders`.     |

Ogni voce `configSignals` supporta:

| Campo         | Obbligatorio | Tipo       | Significato                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Sì      | `string`   | Percorso puntato verso l'oggetto di configurazione di proprietà del Plugin da ispezionare, ad esempio `plugins.entries.example.config`.                                                                                    |
| `overlayPath` | No       | `string`   | Percorso puntato dentro la configurazione radice il cui oggetto deve sovrapporsi all'oggetto radice prima di valutare il segnale. Usalo per configurazioni specifiche di capacità come `image`, `video` o `music`. |
| `required`    | No       | `string[]` | Percorsi puntati dentro la configurazione effettiva che devono avere valori configurati. Le stringhe devono essere non vuote; oggetti e array non devono essere vuoti.                                                |
| `requiredAny` | No       | `string[]` | Percorsi puntati dentro la configurazione effettiva in cui almeno uno deve avere un valore configurato.                                                                                                  |
| `mode`        | No       | `object`   | Guard opzionale per la modalità stringa dentro la configurazione effettiva. Usalo quando la disponibilità basata solo sulla configurazione si applica solo a una modalità.                                                                |

Ogni guard `mode` supporta:

| Campo        | Obbligatorio | Tipo       | Significato                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | No       | `string`   | Percorso puntato dentro la configurazione effettiva. Valore predefinito: `mode`.                          |
| `default`    | No       | `string`   | Valore della modalità da usare quando la configurazione omette il percorso.                                  |
| `allowed`    | No       | `string[]` | Se presente, il segnale passa solo quando la modalità effettiva è uno di questi valori. |
| `disallowed` | No       | `string[]` | Se presente, il segnale fallisce quando la modalità effettiva è uno di questi valori.       |

Ogni voce `authSignals` supporta:

| Campo             | Obbligatorio | Tipo     | Significato                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì      | `string` | ID provider da controllare nei profili di autenticazione configurati.                                                                                                                             |
| `providerBaseUrl` | No       | `object` | Guard opzionale che fa contare il segnale solo quando il provider configurato referenziato usa un URL di base consentito. Usalo quando un alias di autenticazione è valido solo per certe API. |

Ogni guard `providerBaseUrl` supporta:

| Campo             | Obbligatorio | Tipo       | Significato                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Sì      | `string`   | ID configurazione provider il cui `baseUrl` deve essere controllato.                                                                                                |
| `defaultBaseUrl`  | No       | `string`   | URL di base da assumere quando la configurazione del provider omette `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Sì      | `string[]` | URL di base consentiti per questo segnale di autenticazione. Il segnale viene ignorato quando l'URL di base configurato o predefinito non corrisponde a uno di questi valori normalizzati. |

## Riferimento ai metadati degli strumenti

`toolMetadata` usa le stesse forme `configSignals` e `authSignals` dei
metadati del provider di generazione, indicizzate per nome strumento. `contracts.tools` dichiara
la proprietà. `toolMetadata` dichiara prove economiche di disponibilità, così OpenClaw può
evitare di importare un runtime del Plugin solo per far restituire `null` alla sua factory dello strumento.

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
carica il Plugin proprietario quando il contratto dello strumento corrisponde alla policy. Per gli strumenti
su hot-path la cui factory dipende da autenticazione/configurazione, gli autori dei Plugin devono dichiarare
`toolMetadata` invece di fare importare al core il runtime per interrogarlo.

## Riferimento a providerAuthChoices

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima del caricamento del runtime del provider.
Gli elenchi di configurazione dei provider usano queste scelte del manifest, scelte di configurazione derivate dal descrittore
e metadati del catalogo di installazione senza caricare il runtime del provider.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì      | `string`                                        | ID provider a cui appartiene questa scelta.                                                                      |
| `method`              | Sì      | `string`                                        | ID metodo di autenticazione a cui inviare.                                                                           |
| `choiceId`            | Sì      | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                                                  |
| `choiceLabel`         | No       | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw ripiega su `choiceId`.                                        |
| `choiceHint`          | No       | `string`                                        | Breve testo di aiuto per il selettore.                                                                        |
| `assistantPriority`   | No       | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.                                       |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente pur continuando a consentire la selezione manuale tramite CLI.                        |
| `deprecatedChoiceIds` | No       | `string[]`                                      | ID scelta legacy che devono reindirizzare gli utenti a questa scelta sostitutiva.                                 |
| `groupId`             | No       | `string`                                        | ID gruppo opzionale per raggruppare scelte correlate.                                                          |
| `groupLabel`          | No       | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                                        |
| `groupHint`           | No       | `string`                                        | Breve testo di aiuto per il gruppo.                                                                         |
| `optionKey`           | No       | `string`                                        | Chiave opzione interna per flussi di autenticazione semplici con un solo flag.                                                      |
| `cliFlag`             | No       | `string`                                        | Nome flag CLI, ad esempio `--openrouter-api-key`.                                                           |
| `cliOption`           | No       | `string`                                        | Forma completa dell'opzione CLI, ad esempio `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | No       | `string`                                        | Descrizione usata nell'help della CLI.                                                                            |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | Superfici di onboarding in cui deve apparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento a commandAliases

Usa `commandAliases` quando un Plugin possiede un nome di comando runtime che gli utenti potrebbero
erroneamente inserire in `plugins.allow` o provare a eseguire come comando CLI radice. OpenClaw
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

| Campo        | Obbligatorio | Tipo              | Significato                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Sì      | `string`          | Nome del comando che appartiene a questo Plugin.                               |
| `kind`       | No       | `"runtime-slash"` | Contrassegna l'alias come comando slash di chat anziché come comando CLI radice. |
| `cliCommand` | No       | `string`          | Comando CLI radice correlato da suggerire per le operazioni CLI, se esiste.  |

## Riferimento di activation

Usa `activation` quando il Plugin può dichiarare in modo economico quali eventi del piano di controllo
dovrebbero includerlo in un piano di attivazione/caricamento.

Questo blocco è metadati del pianificatore, non un'API di ciclo di vita. Non registra
comportamento runtime, non sostituisce `register(...)` e non promette che
il codice del Plugin sia già stato eseguito. Il pianificatore di attivazione usa questi campi per
restringere i Plugin candidati prima di ricorrere ai metadati di proprietà del manifest esistenti
come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook.

Preferisci i metadati più ristretti che descrivono già la proprietà. Usa
`providers`, `channels`, `commandAliases`, descrittori di setup o `contracts`
quando quei campi esprimono la relazione. Usa `activation` per suggerimenti aggiuntivi del pianificatore
che non possono essere rappresentati da quei campi di proprietà.
Usa `cliBackends` di primo livello per alias runtime CLI come `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` è solo per
id di harness agente incorporati che non hanno già un campo di proprietà.

Questo blocco è solo metadati. Non registra comportamento runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/Plugin.
I consumer attuali lo usano come suggerimento di restringimento prima di un caricamento più ampio dei Plugin, quindi
la mancanza di metadati di attivazione non di startup di solito costa solo prestazioni;
non dovrebbe cambiare la correttezza finché esistono ancora fallback di proprietà del manifest.

Ogni Plugin dovrebbe impostare `activation.onStartup` intenzionalmente. Impostalo su `true`
solo quando il Plugin deve essere eseguito durante l'avvio del Gateway. Impostalo su `false` quando
il Plugin è inerte all'avvio e deve caricarsi solo da trigger più ristretti.
Omettere `onStartup` non carica più implicitamente il Plugin all'avvio; usa metadati di
attivazione espliciti per startup, canale, configurazione, agent-harness, memoria o
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

| Campo              | Obbligatorio | Tipo                                                 | Significato                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No       | `boolean`                                            | Attivazione esplicita all'avvio del Gateway. Ogni Plugin dovrebbe impostarla. `true` importa il Plugin durante l'avvio; `false` lo mantiene lazy all'avvio a meno che un altro trigger corrispondente richieda il caricamento. |
| `onProviders`      | No       | `string[]`                                           | Id provider che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                                                                                                                      |
| `onAgentHarnesses` | No       | `string[]`                                           | Id runtime di harness agente incorporati che dovrebbero includere questo Plugin nei piani di attivazione/caricamento. Usa `cliBackends` di primo livello per alias backend CLI.                                           |
| `onCommands`       | No       | `string[]`                                           | Id comando che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                                                                                                                       |
| `onChannels`       | No       | `string[]`                                           | Id canale che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                                                                                                                       |
| `onRoutes`         | No       | `string[]`                                           | Tipi di route che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                                                                                                                       |
| `onConfigPaths`    | No       | `string[]`                                           | Percorsi di configurazione relativi alla radice che dovrebbero includere questo Plugin nei piani di startup/caricamento quando il percorso è presente e non esplicitamente disabilitato.                                                      |
| `onCapabilities`   | No       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti di capacità ampie usati dalla pianificazione dell'attivazione del piano di controllo. Preferisci campi più ristretti quando possibile.                                                                                     |

Consumer live attuali:

- La pianificazione di startup del Gateway usa `activation.onStartup` per l'importazione
  esplicita all'avvio
- la pianificazione CLI attivata da comando ricorre ai `commandAliases[].cliCommand`
  o `commandAliases[].name` legacy
- la pianificazione di startup agent-runtime usa `activation.onAgentHarnesses` per
  harness incorporati e `cliBackends[]` di primo livello per alias runtime CLI
- la pianificazione setup/canale attivata da canale ricorre alla proprietà legacy `channels[]`
  quando mancano metadati di attivazione canale espliciti
- la pianificazione Plugin di startup usa `activation.onConfigPaths` per superfici di configurazione radice
  non di canale, come il blocco `browser` del Plugin browser in bundle
- la pianificazione setup/runtime attivata da provider ricorre alla proprietà legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati di attivazione provider
  espliciti

La diagnostica del pianificatore può distinguere i suggerimenti di attivazione espliciti dal fallback di
proprietà del manifest. Per esempio, `activation-command-hint` significa che
`activation.onCommands` ha trovato una corrispondenza, mentre `manifest-command-alias` significa che il
pianificatore ha usato invece la proprietà `commandAliases`. Queste etichette di motivo sono per
diagnostica host e test; gli autori di Plugin dovrebbero continuare a dichiarare i metadati
che descrivono meglio la proprietà.

## Riferimento di qaRunners

Usa `qaRunners` quando un Plugin contribuisce uno o più runner di trasporto sotto
la radice condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il runtime del Plugin
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

| Campo         | Obbligatorio | Tipo     | Significato                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sì      | `string` | Sottocomando montato sotto `openclaw qa`, per esempio `matrix`.    |
| `description` | No       | `string` | Testo di aiuto di fallback usato quando l'host condiviso necessita di un comando stub. |

## Riferimento di setup

Usa `setup` quando le superfici di setup e onboarding necessitano di metadati economici di proprietà del Plugin
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

`cliBackends` di primo livello resta valido e continua a descrivere i backend di inferenza CLI.
`setup.cliBackends` è la superficie descrittore specifica del setup per
flussi di piano di controllo/setup che dovrebbero restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di ricerca
descriptor-first preferita per la discovery di setup. Se il descrittore restringe solo
il Plugin candidato e il setup necessita ancora di hook runtime in fase di setup più ricchi,
imposta `requiresRuntime: true` e mantieni `setup-api` come percorso di esecuzione
di fallback.

OpenClaw include anche `setup.providers[].envVars` nelle ricerche generiche di auth provider ed
env-var. `providerAuthEnvVars` resta supportato tramite un adapter di compatibilità
durante la finestra di deprecazione, ma i Plugin non in bundle che lo usano ancora
ricevono una diagnostica del manifest. I nuovi Plugin dovrebbero mettere i metadati env di setup/status
su `setup.providers[].envVars`.

OpenClaw può anche derivare scelte di setup semplici da `setup.providers[].authMethods`
quando non è disponibile alcuna voce di setup, o quando `setup.requiresRuntime: false`
dichiara che il runtime di setup non è necessario. Le voci esplicite `providerAuthChoices` restano
preferite per etichette personalizzate, flag CLI, ambito di onboarding e metadati assistente.

Imposta `requiresRuntime: false` solo quando quei descrittori sono sufficienti per la
superficie di setup. OpenClaw tratta `false` esplicito come contratto solo descrittore
e non eseguirà `setup-api` o `openclaw.setupEntry` per la ricerca di setup. Se
un Plugin solo descrittore distribuisce comunque una di quelle voci runtime di setup,
OpenClaw segnala una diagnostica additiva e continua a ignorarla. L'omissione di
`requiresRuntime` mantiene il comportamento di fallback legacy, così i Plugin esistenti che hanno aggiunto
descrittori senza il flag non si rompono.

Poiché la ricerca di setup può eseguire codice `setup-api` di proprietà del Plugin, i valori normalizzati
`setup.providers[].id` e `setup.cliBackends[]` devono restare unici tra
i Plugin scoperti. La proprietà ambigua fallisce in modo chiuso invece di scegliere un
vincitore dall'ordine di discovery.

Quando il runtime di setup viene eseguito, la diagnostica del registro di setup segnala deriva dei descrittori
se `setup-api` registra un provider o backend CLI che i descrittori del manifest
non dichiarano, o se un descrittore non ha una registrazione runtime
corrispondente. Queste diagnostiche sono additive e non rifiutano i Plugin legacy.

### Riferimento di setup.providers

| Campo          | Obbligatorio | Tipo       | Significato                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sì      | `string`   | Id provider esposto durante setup o onboarding. Mantieni gli id normalizzati globalmente unici.             |
| `authMethods`  | No       | `string[]` | Id metodo setup/auth supportati da questo provider senza caricare il runtime completo.                       |
| `envVars`      | No       | `string[]` | Env var che le superfici generiche di setup/status possono controllare prima del caricamento del runtime del Plugin.               |
| `authEvidence` | No       | `object[]` | Controlli economici di evidenza auth locale per provider che possono autenticarsi tramite marcatori non segreti. |

`authEvidence` serve per marcatori di credenziali locali di proprietà del provider che possono essere
verificati senza caricare codice runtime. Questi controlli devono restare economici e locali:
nessuna chiamata di rete, nessuna lettura da keychain o secret manager, nessun comando shell e nessun
probe API del provider.

Voci di evidenza supportate:

| Campo              | Obbligatorio | Tipo       | Significato                                                                                                  |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Sì           | `string`   | Attualmente `local-file-with-env`.                                                                           |
| `fileEnvVar`       | No           | `string`   | Variabile env contenente un percorso esplicito del file delle credenziali.                                   |
| `fallbackPaths`    | No           | `string[]` | Percorsi locali dei file delle credenziali controllati quando `fileEnvVar` è assente o vuota. Supporta `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | No           | `string[]` | Almeno una variabile env elencata deve essere non vuota prima che l'evidenza sia valida.                     |
| `requiresAllEnv`   | No           | `string[]` | Ogni variabile env elencata deve essere non vuota prima che l'evidenza sia valida.                           |
| `credentialMarker` | Sì           | `string`   | Marcatore non segreto restituito quando l'evidenza è presente.                                               |
| `source`           | No           | `string`   | Etichetta della sorgente visibile all'utente per l'output di autenticazione/stato.                           |

### Campi setup

| Campo              | Obbligatorio | Tipo       | Significato                                                                                       |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di configurazione del provider esposti durante setup e onboarding.                    |
| `cliBackends`      | No           | `string[]` | ID backend in fase di setup usati per la ricerca setup basata prima sul descrittore. Mantieni gli ID normalizzati univoci a livello globale. |
| `configMigrations` | No           | `string[]` | ID di migrazione della configurazione di proprietà della superficie setup di questo plugin.        |
| `requiresRuntime`  | No           | `boolean`  | Se setup richiede ancora l'esecuzione di `setup-api` dopo la ricerca del descrittore.             |

## Riferimento uiHints

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

| Campo         | Tipo       | Significato                              |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente. |
| `help`        | `string`   | Breve testo di aiuto.                    |
| `tags`        | `string[]` | Tag UI facoltativi.                      |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.     |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input dei moduli. |

## Riferimento contracts

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

Ogni elenco è facoltativo:

| Campo                            | Tipo       | Significato                                                         |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID delle factory di estensione del server app Codex, attualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | ID runtime per cui un plugin in bundle può registrare middleware dei risultati degli strumenti. |
| `externalAuthProviders`          | `string[]` | ID dei provider il cui hook del profilo di autenticazione esterna è di proprietà di questo plugin. |
| `speechProviders`                | `string[]` | ID dei provider speech di proprietà di questo plugin.               |
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

`contracts.embeddedExtensionFactories` viene mantenuto per le factory di estensione in bundle
solo per il server app Codex. Le trasformazioni dei risultati degli strumenti in bundle dovrebbero
dichiarare `contracts.agentToolResultMiddleware` e registrarsi invece con
`api.registerAgentToolResultMiddleware(...)`. I plugin esterni non possono
registrare middleware dei risultati degli strumenti perché il punto di integrazione può riscrivere output di strumenti ad alta fiducia
prima che il modello lo veda.

Le registrazioni runtime `api.registerTool(...)` devono corrispondere a `contracts.tools`.
La scoperta degli strumenti usa questo elenco per caricare solo i runtime dei plugin che possono possedere gli
strumenti richiesti.

I plugin provider che implementano `resolveExternalAuthProfiles` dovrebbero dichiarare
`contracts.externalAuthProviders`. I plugin senza la dichiarazione passano ancora
attraverso un fallback di compatibilità deprecato, ma quel fallback è più lento e
verrà rimosso dopo la finestra di migrazione.

I provider di embedding della memoria in bundle dovrebbero dichiarare
`contracts.memoryEmbeddingProviders` per ogni ID adattatore che espongono, inclusi
adattatori integrati come `local`. I percorsi CLI standalone usano questo contratto del manifest
per caricare solo il plugin proprietario prima che il runtime Gateway completo abbia
registrato i provider.

## Riferimento mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` quando un provider di comprensione dei media ha
modelli predefiniti, priorità di fallback per autenticazione automatica o supporto nativo dei documenti di cui
gli helper core generici hanno bisogno prima del caricamento del runtime. Le chiavi devono essere dichiarate anche in
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

Ogni voce del provider può includere:

| Campo                  | Tipo                                | Significato                                                                |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capability media esposte da questo provider.                               |
| `defaultModels`        | `Record<string, string>`            | Valori predefiniti capability-modello usati quando la configurazione non specifica un modello. |
| `autoPriority`         | `Record<string, number>`            | Numeri più bassi vengono ordinati prima per il fallback automatico del provider basato sulle credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input documentali nativi supportati dal provider.                          |

## Riferimento channelConfigs

Usa `channelConfigs` quando un plugin di canale ha bisogno di metadati di configurazione economici prima del
caricamento del runtime. La scoperta setup/stato del canale in sola lettura può usare questi metadati
direttamente per canali esterni configurati quando non è disponibile alcuna voce setup, o
quando `setup.requiresRuntime: false` dichiara che il runtime setup non è necessario.

`channelConfigs` è metadato del manifest del plugin, non una nuova sezione di configurazione utente di primo livello.
Gli utenti configurano ancora le istanze dei canali sotto `channels.<channel-id>`.
OpenClaw legge i metadati del manifest per decidere quale plugin possiede quel canale configurato
prima che il codice runtime del plugin venga eseguito.

Per un plugin di canale, `configSchema` e `channelConfigs` descrivono percorsi diversi:

- `configSchema` convalida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` convalida `channels.<channel-id>`

I plugin non in bundle che dichiarano `channels[]` dovrebbero dichiarare anche voci
`channelConfigs` corrispondenti. Senza di esse, OpenClaw può ancora caricare il plugin, ma
lo schema di configurazione del percorso a freddo, setup e le superfici Control UI non possono conoscere la
forma delle opzioni di proprietà del canale fino all'esecuzione del runtime del plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` possono dichiarare valori predefiniti statici `auto` per i controlli della configurazione dei comandi
che vengono eseguiti prima del caricamento del runtime del canale. I canali in bundle possono anche pubblicare
gli stessi valori predefiniti tramite `package.json#openclaw.channel.commands` insieme
agli altri metadati del catalogo canali di proprietà del pacchetto.

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

| Campo         | Tipo                     | Significato                                                                               |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce di configurazione del canale dichiarata. |
| `uiHints`     | `Record<string, object>` | Etichette/placeholder/suggerimenti sensibili UI opzionali per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita alle superfici di selezione e ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                    |
| `commands`    | `object`                 | Comando nativo statico e impostazioni predefinite automatiche delle skill native per controlli di configurazione pre-runtime. |
| `preferOver`  | `string[]`               | ID di Plugin legacy o con priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

### Sostituire un altro Plugin di canale

Usa `preferOver` quando il tuo Plugin è il proprietario preferito per un ID di canale che
anche un altro Plugin può fornire. Casi comuni sono un ID Plugin rinominato, un
Plugin autonomo che sostituisce un Plugin incluso, o un fork mantenuto che
mantiene lo stesso ID di canale per compatibilità della configurazione.

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
l'ID Plugin preferito. Se il Plugin con priorità inferiore è stato selezionato solo perché
è incluso o abilitato per impostazione predefinita, OpenClaw lo disabilita nella configurazione
runtime effettiva in modo che un solo Plugin possieda il canale e i suoi strumenti. La selezione esplicita
dell'utente prevale comunque: se l'utente abilita esplicitamente entrambi i Plugin, OpenClaw
preserva quella scelta e segnala diagnostiche di canali/strumenti duplicati invece di
modificare silenziosamente l'insieme di Plugin richiesto.

Mantieni `preferOver` limitato agli ID Plugin che possono realmente fornire lo stesso canale.
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

- i riferimenti espliciti `provider/model` usano i metadati del manifesto `providers` proprietario
- `modelPatterns` prevale su `modelPrefixes`
- se un Plugin non incluso e un Plugin incluso corrispondono entrambi, vince il Plugin
  non incluso
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specifica un provider

Campi:

| Campo           | Tipo       | Significato                                                                   |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` sugli ID modello abbreviati.            |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate sugli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

## Riferimento modelCatalog

Usa `modelCatalog` quando OpenClaw deve conoscere i metadati dei modelli del provider prima
di caricare il runtime del Plugin. Questa è la fonte posseduta dal manifesto per righe fisse del catalogo,
alias dei provider, regole di soppressione e modalità di rilevamento. L'aggiornamento runtime
resta nel codice runtime del provider, ma il manifesto indica al core quando il runtime
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
| `providers`    | `Record<string, object>`                                 | Righe di catalogo per gli ID provider posseduti da questo Plugin. Le chiavi dovrebbero apparire anche in `providers` di primo livello. |
| `aliases`      | `Record<string, object>`                                 | Alias dei provider che dovrebbero risolversi in un provider posseduto per la pianificazione del catalogo o della soppressione. |
| `suppressions` | `object[]`                                               | Righe modello da un'altra fonte che questo Plugin sopprime per un motivo specifico del provider.            |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se il catalogo del provider può essere letto dai metadati del manifesto, aggiornato nella cache o richiede il runtime. |

`aliases` partecipa alla ricerca della proprietà del provider per la pianificazione del catalogo modelli.
Le destinazioni degli alias devono essere provider di primo livello posseduti dallo stesso Plugin. Quando un
elenco filtrato per provider usa un alias, OpenClaw può leggere il manifesto proprietario e
applicare override di API/base URL dell'alias senza caricare il runtime del provider.
Gli alias non espandono gli elenchi di catalogo non filtrati; gli elenchi ampi emettono solo
le righe del provider canonico proprietario.

`suppressions` sostituisce il vecchio hook runtime del provider `suppressBuiltInModel`.
Le voci di soppressione vengono rispettate solo quando il provider è posseduto dal Plugin o
dichiarato come chiave `modelCatalog.aliases` che punta a un provider posseduto. Gli hook runtime
di soppressione non vengono più chiamati durante la risoluzione del modello.

Campi del provider:

| Campo     | Tipo                     | Significato                                                       |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predefinito opzionale per i modelli in questo catalogo del provider. |
| `api`     | `ModelApi`               | Adattatore API predefinito opzionale per i modelli in questo catalogo del provider. |
| `headers` | `Record<string, string>` | Header statici opzionali che si applicano a questo catalogo del provider. |
| `models`  | `object[]`               | Righe modello obbligatorie. Le righe senza `id` vengono ignorate. |

Campi del modello:

| Campo           | Tipo                                                           | Significato                                                               |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID modello locale del provider, senza il prefisso `provider/`.            |
| `name`          | `string`                                                       | Nome visualizzato opzionale.                                              |
| `api`           | `ModelApi`                                                     | Override API opzionale per modello.                                       |
| `baseUrl`       | `string`                                                       | Override URL base opzionale per modello.                                  |
| `headers`       | `Record<string, string>`                                       | Header statici opzionali per modello.                                     |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalità accettate dal modello.                                           |
| `reasoning`     | `boolean`                                                      | Indica se il modello espone comportamento di ragionamento.                |
| `contextWindow` | `number`                                                       | Finestra di contesto nativa del provider.                                 |
| `contextTokens` | `number`                                                       | Limite di contesto runtime effettivo opzionale quando diverso da `contextWindow`. |
| `maxTokens`     | `number`                                                       | Token di output massimi quando noti.                                      |
| `cost`          | `object`                                                       | Prezzi opzionali in USD per milione di token, incluso `tieredPricing` opzionale. |
| `compat`        | `object`                                                       | Flag di compatibilità opzionali corrispondenti alla compatibilità della configurazione modello di OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato dell'elenco. Sopprimi solo quando la riga non deve apparire affatto. |
| `statusReason`  | `string`                                                       | Motivo opzionale mostrato con stato non disponibile.                      |
| `replaces`      | `string[]`                                                     | ID modello locali del provider più vecchi che questo modello sostituisce. |
| `replacedBy`    | `string`                                                       | ID modello locale del provider sostitutivo per righe deprecate.           |
| `tags`          | `string[]`                                                     | Tag stabili usati da selettori e filtri.                                  |

Campi di soppressione:

| Campo                      | Tipo       | Significato                                                                                             |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID provider per la riga upstream da sopprimere. Deve essere posseduto da questo Plugin o dichiarato come alias posseduto. |
| `model`                    | `string`   | ID modello locale del provider da sopprimere.                                                           |
| `reason`                   | `string`   | Messaggio opzionale mostrato quando la riga soppressa viene richiesta direttamente.                     |
| `when.baseUrlHosts`        | `string[]` | Elenco opzionale di host URL base effettivi del provider richiesti prima che la soppressione si applichi. |
| `when.providerConfigApiIn` | `string[]` | Elenco opzionale di valori `api` esatti della configurazione del provider richiesti prima che la soppressione si applichi. |

Non inserire dati solo runtime in `modelCatalog`. Usa `static` solo quando le righe del manifest
sono abbastanza complete da consentire alle superfici di elenco filtrato per provider e di selezione
di saltare il rilevamento di registry/runtime. Usa `refreshable` quando le righe del manifest sono semi elencabili
o supplementi utili, ma un aggiornamento/cache può aggiungere altre righe in seguito;
le righe refreshable non sono autorevoli da sole. Usa `runtime` quando OpenClaw
deve caricare il runtime del provider per conoscere l'elenco.

## Riferimento modelIdNormalization

Usa `modelIdNormalization` per una pulizia economica degli ID modello di proprietà del provider che deve
avvenire prima del caricamento del runtime del provider. Questo mantiene alias come nomi modello brevi,
ID legacy locali al provider e regole di prefisso proxy nel manifest del plugin proprietario,
invece che nelle tabelle core di selezione del modello.

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
| `aliases`                            | `Record<string,string>` | Alias esatti degli ID modello senza distinzione tra maiuscole e minuscole. I valori vengono restituiti come scritti. |
| `stripPrefixes`                      | `string[]`              | Prefissi da rimuovere prima della ricerca degli alias, utili per duplicazioni legacy provider/modello. |
| `prefixWhenBare`                     | `string`                | Prefisso da aggiungere quando l'ID modello normalizzato non contiene già `/`.              |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regole condizionali di prefisso per ID nudi dopo la ricerca degli alias, basate su `modelPrefix` e `prefix`. |

## Riferimento providerEndpoints

Usa `providerEndpoints` per la classificazione degli endpoint che la policy generica delle richieste
deve conoscere prima del caricamento del runtime del provider. Il core possiede ancora il significato di ogni
`endpointClass`; i manifest dei plugin possiedono i metadati di host e URL base.

Campi degli endpoint:

| Campo                          | Tipo       | Significato                                                                                    |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe endpoint core nota, come `openrouter`, `moonshot-native` o `google-vertex`.             |
| `hosts`                        | `string[]` | Nomi host esatti che mappano alla classe endpoint.                                             |
| `hostSuffixes`                 | `string[]` | Suffissi host che mappano alla classe endpoint. Anteponi `.` per la corrispondenza solo di suffissi di dominio. |
| `baseUrls`                     | `string[]` | URL base HTTP(S) normalizzati esatti che mappano alla classe endpoint.                         |
| `googleVertexRegion`           | `string`   | Regione statica Google Vertex per host globali esatti.                                        |
| `googleVertexRegionHostSuffix` | `string`   | Suffisso da rimuovere dagli host corrispondenti per esporre il prefisso della regione Google Vertex. |

## Riferimento providerRequest

Usa `providerRequest` per metadati economici di compatibilità delle richieste di cui la policy generica
delle richieste ha bisogno senza caricare il runtime del provider. Mantieni la riscrittura dei payload
specifica del comportamento negli hook runtime del provider o negli helper condivisi della famiglia di provider.

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
| `compatibilityFamily` | `"moonshot"` | Bucket opzionale di compatibilità della famiglia di provider per helper di richieste condivisi. |
| `openAICompletions`   | `object`     | Flag di richiesta completions compatibili con OpenAI, attualmente `supportsStreamingUsage`. |

## Riferimento modelPricing

Usa `modelPricing` quando un provider richiede comportamento di pricing del control plane prima
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

| Campo        | Tipo              | Significato                                                                                         |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Imposta `false` per provider locali/self-hosted che non devono mai recuperare prezzi da OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Mappatura di lookup dei prezzi OpenRouter. `false` disabilita il lookup OpenRouter per questo provider. |
| `liteLLM`    | `false \| object` | Mappatura di lookup dei prezzi LiteLLM. `false` disabilita il lookup LiteLLM per questo provider.   |

Campi sorgente:

| Campo                      | Tipo               | Significato                                                                                                        |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | ID provider del catalogo esterno quando differisce dall'ID provider OpenClaw, per esempio `z-ai` per un provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Tratta gli ID modello contenenti slash come riferimenti provider/modello annidati, utile per provider proxy come OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varianti extra degli ID modello del catalogo esterno. `version-dots` prova ID versione puntati come `claude-opus-4.6`. |

### Indice dei provider OpenClaw

L'Indice dei provider OpenClaw è un metadato di anteprima di proprietà di OpenClaw per provider
i cui plugin potrebbero non essere ancora installati. Non fa parte di un manifest di plugin.
I manifest dei plugin rimangono l'autorità per i plugin installati. L'Indice dei provider è
il contratto di fallback interno che le future superfici di provider installabili e selezione
modello pre-installazione consumeranno quando un plugin provider non è installato.

Ordine di autorità del catalogo:

1. Configurazione utente.
2. `modelCatalog` del manifest del plugin installato.
3. Cache del catalogo modelli da aggiornamento esplicito.
4. Righe di anteprima dell'Indice dei provider OpenClaw.

L'Indice dei provider non deve contenere segreti, stato abilitato, hook runtime o
dati modello live specifici dell'account. I suoi cataloghi di anteprima usano la stessa
forma di riga provider `modelCatalog` dei manifest dei plugin, ma dovrebbero restare limitati
a metadati di visualizzazione stabili, a meno che campi dell'adapter runtime come `api`,
`baseUrl`, pricing o flag di compatibilità siano mantenuti intenzionalmente allineati con
il manifest del plugin installato. I provider con rilevamento live `/models` dovrebbero
scrivere righe aggiornate tramite il percorso esplicito della cache del catalogo modelli invece di
far chiamare API provider al normale elenco o onboarding.

Le voci dell'Indice dei provider possono anche contenere metadati di plugin installabili per provider
il cui plugin è stato spostato fuori dal core o non è altrimenti ancora installato. Questi
metadati rispecchiano il pattern del catalogo canali: nome del pacchetto, spec di installazione npm,
integrità prevista ed etichette economiche di scelta dell'autenticazione sono sufficienti per mostrare
un'opzione di setup installabile. Una volta installato il plugin, il suo manifest prevale e
la voce dell'Indice dei provider viene ignorata per quel provider.

Le chiavi di capability legacy di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il caricamento normale
del manifest non tratta più quei campi di primo livello come proprietà delle capability.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Rilevamento, validazione della configurazione, metadati di scelta dell'autenticazione e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e il blocco `openclaw` usato per entrypoint, gating di installazione, setup o metadati di catalogo |

Se non sai con certezza dove appartenga un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di ingresso o comportamento di installazione npm, mettilo in `package.json`

### Campi package.json che influenzano il rilevamento

Alcuni metadati pre-runtime dei plugin vivono intenzionalmente in `package.json` sotto il blocco
`openclaw` invece che in `openclaw.plugin.json`.
`openclaw.bundle` e `openclaw.bundle.json` non sono contratti di plugin OpenClaw;
i plugin nativi devono usare `openclaw.plugin.json` più i campi supportati
`package.json#openclaw` qui sotto.

Esempi importanti:

| Campo                                                                                      | Cosa significa                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Dichiara gli entrypoint Plugin nativi. Deve rimanere all'interno della directory del pacchetto Plugin.                                                                                         |
| `openclaw.runtimeExtensions`                                                               | Dichiara gli entrypoint runtime JavaScript compilati per i pacchetti installati. Deve rimanere all'interno della directory del pacchetto Plugin.                                               |
| `openclaw.setupEntry`                                                                      | Entrypoint leggero solo di configurazione usato durante l'onboarding, l'avvio differito del canale e il rilevamento di stato canale/SecretRef in sola lettura. Deve rimanere all'interno della directory del pacchetto Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Dichiara l'entrypoint di configurazione JavaScript compilato per i pacchetti installati. Richiede `setupEntry`, deve esistere e deve rimanere all'interno della directory del pacchetto Plugin. |
| `openclaw.channel`                                                                         | Metadati economici del catalogo canali come etichette, percorsi della documentazione, alias e testo di selezione.                                                                              |
| `openclaw.channel.commands`                                                                | Metadati statici di comandi nativi e valori predefiniti automatici di skill native usati da superfici di configurazione, audit ed elenco comandi prima del caricamento del runtime del canale. |
| `openclaw.channel.configuredState`                                                         | Metadati leggeri del controllo dello stato configurato che possono rispondere a "esiste gia una configurazione solo env?" senza caricare il runtime completo del canale.                      |
| `openclaw.channel.persistedAuthState`                                                      | Metadati leggeri del controllo dell'autenticazione persistita che possono rispondere a "qualcosa ha gia effettuato l'accesso?" senza caricare il runtime completo del canale.                 |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Suggerimenti di installazione/aggiornamento per Plugin inclusi e pubblicati esternamente.                                                                                                      |
| `openclaw.install.defaultChoice`                                                           | Percorso di installazione preferito quando sono disponibili piu fonti di installazione.                                                                                                        |
| `openclaw.install.minHostVersion`                                                          | Versione host OpenClaw minima supportata, usando un limite inferiore semver come `>=2026.3.22` o `>=2026.5.1-beta.1`.                                                                          |
| `openclaw.install.expectedIntegrity`                                                       | Stringa di integrita npm dist attesa, ad esempio `sha512-...`; i flussi di installazione e aggiornamento verificano l'artefatto scaricato rispetto a essa.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Consente un percorso ristretto di ripristino tramite reinstallazione di un Plugin incluso quando la configurazione non e valida.                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Consente il caricamento delle superfici del canale solo di configurazione prima del Plugin canale completo durante l'avvio.                                                                    |

I metadati del manifest decidono quali scelte di provider/canale/configurazione appaiono nell'onboarding prima del caricamento del runtime. `package.json#openclaw.install` indica all'onboarding come scaricare o abilitare quel Plugin quando l'utente seleziona una di quelle scelte. Non spostare i suggerimenti di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del registro dei manifest per sorgenti Plugin non incluse. I valori non validi vengono rifiutati; i valori piu recenti ma validi fanno saltare i Plugin esterni sugli host meno recenti. Si presume che i Plugin sorgente inclusi abbiano la stessa versione del checkout dell'host.

I metadati ufficiali di installazione su richiesta devono usare `clawhubSpec` quando il Plugin e pubblicato su ClawHub; l'onboarding lo tratta come sorgente remota preferita e registra i dati dell'artefatto ClawHub dopo l'installazione. `npmSpec` rimane il fallback di compatibilita per i pacchetti che non sono ancora passati a ClawHub.

Il blocco esatto della versione npm risiede gia in `npmSpec`, per esempio `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci ufficiali del catalogo esterno devono associare specifiche esatte a `expectedIntegrity` in modo che i flussi di aggiornamento falliscano in modo chiuso se l'artefatto npm scaricato non corrisponde piu alla release bloccata. L'onboarding interattivo offre ancora specifiche npm di registri attendibili, inclusi nomi di pacchetto semplici e dist-tag, per compatibilita. La diagnostica del catalogo puo distinguere sorgenti esatte, mobili, bloccate tramite integrita, prive di integrita, con mancata corrispondenza del nome pacchetto e con scelta predefinita non valida. Avvisa inoltre quando `expectedIntegrity` e presente ma non esiste una sorgente npm valida a cui possa applicare il blocco. Quando `expectedIntegrity` e presente, i flussi di installazione/aggiornamento la applicano; quando e omessa, la risoluzione del registro viene registrata senza un blocco di integrita.

I Plugin canale devono fornire `openclaw.setupEntry` quando le scansioni di stato, elenco canali o SecretRef devono identificare account configurati senza caricare il runtime completo. L'entry di configurazione deve esporre metadati del canale piu adattatori sicuri per la configurazione, lo stato e i segreti; tieni client di rete, listener Gateway e runtime di trasporto nell'entrypoint dell'estensione principale.

I campi degli entrypoint runtime non sovrascrivono i controlli dei confini di pacchetto per i campi degli entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non puo rendere caricabile un percorso `openclaw.extensions` in uscita.

`openclaw.install.allowInvalidConfigRecovery` e volutamente ristretto. Non rende installabili configurazioni arbitrarie rotte. Oggi consente solo ai flussi di installazione di recuperare da specifici errori obsoleti di aggiornamento di Plugin inclusi, come un percorso Plugin incluso mancante o una voce `channels.<id>` obsoleta per quello stesso Plugin incluso. Gli errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori a `openclaw doctor --fix`.

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

Usalo quando i flussi di configurazione, doctor, stato o presenza in sola lettura hanno bisogno di una sonda di autenticazione si/no economica prima del caricamento del Plugin canale completo. Lo stato di autenticazione persistito non e lo stato configurato del canale: non usare questi metadati per abilitare automaticamente Plugin, riparare dipendenze runtime o decidere se un runtime canale debba caricarsi. L'export di destinazione deve essere una piccola funzione che legge solo lo stato persistito; non instradarlo attraverso il barrel del runtime completo del canale.

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

Usalo quando un canale puo rispondere sullo stato configurato da env o da altri input minimi non runtime. Se il controllo richiede la risoluzione completa della configurazione o il runtime reale del canale, mantieni quella logica nell'hook `config.hasConfiguredState` del Plugin.

## Precedenza di rilevamento (id Plugin duplicati)

OpenClaw rileva Plugin da varie radici (inclusi, installazione globale, workspace, percorsi selezionati esplicitamente dalla configurazione). Se due rilevamenti condividono lo stesso `id`, viene mantenuto solo il manifest con **precedenza piu alta**; i duplicati con precedenza inferiore vengono scartati invece di essere caricati accanto a esso.

Precedenza, dalla piu alta alla piu bassa:

1. **Selezionato dalla configurazione** — un percorso bloccato esplicitamente in `plugins.entries.<id>`
2. **Incluso** — Plugin distribuiti con OpenClaw
3. **Installazione globale** — Plugin installati nella radice globale dei Plugin OpenClaw
4. **Workspace** — Plugin rilevati relativamente al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un Plugin incluso presente nel workspace non oscurera la build inclusa.
- Per sovrascrivere realmente un Plugin incluso con uno locale, bloccalo tramite `plugins.entries.<id>` in modo che vinca per precedenza invece di affidarti al rilevamento del workspace.
- Gli scarti di duplicati vengono registrati nei log in modo che Doctor e la diagnostica di avvio possano indicare la copia scartata.
- Le sovrascritture duplicate selezionate dalla configurazione sono formulate come sovrascritture esplicite nella diagnostica, ma avvisano comunque affinche fork obsoleti e ombreggiamenti accidentali restino visibili.

## Requisiti dello schema JSON

- **Ogni Plugin deve distribuire uno schema JSON**, anche se non accetta configurazione.
- Uno schema vuoto e accettabile (per esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati in fase di lettura/scrittura della configurazione, non a runtime.
- Quando estendi o crei un fork di un Plugin incluso con nuove chiavi di configurazione, aggiorna contemporaneamente il `configSchema` di `openclaw.plugin.json` di quel Plugin. Gli schemi dei Plugin inclusi sono rigorosi, quindi l'aggiunta di `plugins.entries.<id>.config.myNewKey` nella configurazione utente senza aggiungere `myNewKey` a `configSchema.properties` verra rifiutata prima del caricamento del runtime del Plugin.

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

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'id canale sia dichiarato da
  un manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a id Plugin **rilevabili**. Gli id sconosciuti sono **errori**.
- Se un Plugin e installato ma ha un manifest o uno schema rotto o mancante,
  la validazione fallisce e Doctor segnala l'errore del Plugin.
- Se la configurazione del Plugin esiste ma il Plugin e **disabilitato**, la configurazione viene mantenuta e
  un **avviso** viene mostrato in Doctor e nei log.

Consulta il [Riferimento di configurazione](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i Plugin OpenClaw nativi**, inclusi i caricamenti dal filesystem locale. Il runtime carica comunque il modulo del Plugin separatamente; il manifest serve solo per discovery e convalida.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi senza virgolette sono accettati purché il valore finale sia comunque un oggetto.
- Il caricatore del manifest legge solo i campi documentati del manifest. Evita chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono essere tutti omessi quando un Plugin non ne ha bisogno.
- `providerCatalogEntry` deve restare leggero e non dovrebbe importare codice runtime ampio; usalo per metadati statici del catalogo dei provider o descrittori di discovery mirati, non per l'esecuzione al momento della richiesta. `providerDiscoveryEntry` è la grafia legacy e funziona ancora per i Plugin esistenti.
- I tipi di Plugin esclusivi vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` tramite `plugins.slots.memory`, `kind: "context-engine"` tramite `plugins.slots.contextEngine` (predefinito `legacy`).
- Dichiara il tipo di Plugin esclusivo in questo manifest. `OpenClawPluginDefinition.kind` della voce runtime è deprecato e resta solo come fallback di compatibilità per i Plugin più vecchi.
- I metadati delle variabili d'ambiente (`setup.providers[].envVars`, `providerAuthEnvVars` deprecato e `channelEnvVars`) sono solo dichiarativi. Stato, audit, convalida della consegna Cron e altre superfici di sola lettura applicano comunque l'attendibilità del Plugin e la policy di attivazione effettiva prima di considerare una variabile d'ambiente come configurata.
- Per i metadati runtime della procedura guidata che richiedono codice del provider, vedi [hook runtime dei provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il tuo Plugin dipende da moduli nativi, documenta i passaggi di build e qualsiasi requisito di allowlist del gestore pacchetti (ad esempio, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Correlati

<CardGroup cols={3}>
  <Card title="Creazione di Plugin" href="/it/plugins/building-plugins" icon="rocket">
    Primi passi con i Plugin.
  </Card>
  <Card title="Architettura dei Plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello delle capability.
  </Card>
  <Card title="Panoramica dell'SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento dell'SDK dei Plugin e importazioni da sottopercorsi.
  </Card>
</CardGroup>
