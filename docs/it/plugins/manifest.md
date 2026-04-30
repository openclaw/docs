---
read_when:
    - Stai creando un Plugin OpenClaw
    - Devi distribuire uno schema di configurazione del Plugin o eseguire il debug degli errori di convalida del Plugin
summary: Requisiti del manifest del Plugin + schema JSON (validazione rigorosa della configurazione)
title: Manifesto del Plugin
x-i18n:
    generated_at: "2026-04-30T09:03:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

Questa pagina riguarda solo il **manifest del Plugin nativo OpenClaw**.

Per le strutture dei pacchetti compatibili, consulta [pacchetti Plugin](/it/plugins/bundles).

I formati di pacchetto compatibili usano file manifest diversi:

- Pacchetto Codex: `.codex-plugin/plugin.json`
- Pacchetto Claude: `.claude-plugin/plugin.json` o la struttura predefinita dei componenti Claude
  senza manifest
- Pacchetto Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche queste strutture di pacchetto, ma non vengono convalidate
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i pacchetti compatibili, OpenClaw attualmente legge i metadati del pacchetto più le radici
Skills dichiarate, le radici dei comandi Claude, i valori predefiniti di `settings.json` del pacchetto Claude,
i valori predefiniti LSP del pacchetto Claude e i pacchetti di hook supportati quando la struttura corrisponde
alle aspettative di runtime di OpenClaw.

Ogni Plugin nativo OpenClaw **deve** distribuire un file `openclaw.plugin.json` nella
**radice del Plugin**. OpenClaw usa questo manifest per convalidare la configurazione
**senza eseguire il codice del Plugin**. I manifest mancanti o non validi vengono trattati come
errori del Plugin e bloccano la convalida della configurazione.

Consulta la guida completa al sistema dei Plugin: [Plugin](/it/tools/plugin).
Per il modello di capacità nativo e le indicazioni attuali sulla compatibilità esterna:
[Modello di capacità](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` sono i metadati che OpenClaw legge **prima di caricare il codice del Plugin**. Tutto ciò che segue deve essere abbastanza leggero da poter essere ispezionato senza avviare il runtime del Plugin.

**Usalo per:**

- identità del Plugin, validazione della configurazione e suggerimenti per l'interfaccia di configurazione
- metadati di autenticazione, onboarding e configurazione iniziale (alias, abilitazione automatica, variabili d'ambiente del provider, scelte di autenticazione)
- suggerimenti di attivazione per le superfici del piano di controllo
- proprietà abbreviata della famiglia di modelli
- snapshot statici di proprietà delle capacità (`contracts`)
- metadati del runner QA che l'host condiviso `openclaw qa` può ispezionare
- metadati di configurazione specifici del canale uniti nel catalogo e nelle superfici di validazione

**Non usarlo per:** registrare comportamenti di runtime, dichiarare entrypoint di codice,
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

| Campo                                | Obbligatorio | Tipo                             | Significato                                                                                                                                                                                                                      |
| ------------------------------------ | ------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì            | `string`                         | ID canonico del plugin. Questo è l'ID usato in `plugins.entries.<id>`.                                                                                                                                                            |
| `configSchema`                       | Sì            | `object`                         | JSON Schema inline per la configurazione di questo plugin.                                                                                                                                                                        |
| `enabledByDefault`                   | No            | `true`                           | Contrassegna un plugin incluso come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita.                        |
| `legacyPluginIds`                    | No            | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del plugin.                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | No            | `string[]`                       | ID dei provider che devono abilitare automaticamente questo plugin quando auth, configurazione o riferimenti ai modelli li menzionano.                                                                                             |
| `kind`                               | No            | `"memory"` \| `"context-engine"` | Dichiara un tipo di plugin esclusivo usato da `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | No            | `string[]`                       | ID dei canali posseduti da questo plugin. Usati per discovery e convalida della configurazione.                                                                                                                                   |
| `providers`                          | No            | `string[]`                       | ID dei provider posseduti da questo plugin.                                                                                                                                                                                       |
| `providerDiscoveryEntry`             | No            | `string`                         | Percorso del modulo leggero per la discovery dei provider, relativo alla radice del plugin, per metadati del catalogo dei provider con ambito manifest che possono essere caricati senza attivare l'intero runtime del plugin.    |
| `modelSupport`                       | No            | `object`                         | Metadati abbreviati delle famiglie di modelli, posseduti dal manifest, usati per caricare automaticamente il plugin prima del runtime.                                                                                             |
| `modelCatalog`                       | No            | `object`                         | Metadati dichiarativi del catalogo modelli per i provider posseduti da questo plugin. Questo è il contratto del piano di controllo per future liste in sola lettura, onboarding, selettori di modelli, alias e soppressione senza caricare il runtime del plugin. |
| `modelPricing`                       | No            | `object`                         | Criterio di ricerca dei prezzi esterni posseduto dal provider. Usalo per escludere provider locali/self-hosted dai cataloghi prezzi remoti o mappare riferimenti dei provider a ID di catalogo OpenRouter/LiteLLM senza codificare gli ID provider nel core. |
| `modelIdNormalization`               | No            | `object`                         | Pulizia di alias/prefissi degli ID modello posseduta dal provider, che deve essere eseguita prima del caricamento del runtime del provider.                                                                                        |
| `providerEndpoints`                  | No            | `object[]`                       | Metadati host/baseUrl degli endpoint posseduti dal manifest per rotte dei provider che il core deve classificare prima del caricamento del runtime del provider.                                                                   |
| `providerRequest`                    | No            | `object`                         | Metadati economici di famiglia provider e compatibilità richiesta usati dal criterio generico delle richieste prima del caricamento del runtime del provider.                                                                      |
| `cliBackends`                        | No            | `string[]`                       | ID dei backend di inferenza CLI posseduti da questo plugin. Usati per l'auto-attivazione all'avvio da riferimenti espliciti nella configurazione.                                                                                  |
| `syntheticAuthRefs`                  | No            | `string[]`                       | Riferimenti a provider o backend CLI il cui hook auth sintetico posseduto dal plugin deve essere sondato durante la discovery a freddo dei modelli prima del caricamento del runtime.                                             |
| `nonSecretAuthMarkers`               | No            | `string[]`                       | Valori segnaposto delle chiavi API posseduti dal plugin incluso che rappresentano stato di credenziali locali, OAuth o ambientali non segrete.                                                                                     |
| `commandAliases`                     | No            | `object[]`                       | Nomi di comandi posseduti da questo plugin che devono produrre diagnostica di configurazione e CLI consapevole del plugin prima del caricamento del runtime.                                                                       |
| `providerAuthEnvVars`                | No            | `Record<string, string[]>`       | Metadati env di compatibilità deprecati per la ricerca auth/stato del provider. Preferisci `setup.providers[].envVars` per i nuovi plugin; OpenClaw li legge ancora durante la finestra di deprecazione.                          |
| `providerAuthAliases`                | No            | `Record<string, string>`         | ID dei provider che devono riutilizzare un altro ID provider per la ricerca auth, per esempio un provider di coding che condivide la chiave API e i profili auth del provider di base.                                             |
| `channelEnvVars`                     | No            | `Record<string, string[]>`       | Metadati env leggeri dei canali che OpenClaw può ispezionare senza caricare il codice del plugin. Usali per configurazione dei canali guidata da env o superfici auth che gli helper generici di avvio/configurazione devono vedere. |
| `providerAuthChoices`                | No            | `object[]`                       | Metadati leggeri delle scelte auth per selettori di onboarding, risoluzione del provider preferito e semplice cablaggio dei flag CLI.                                                                                              |
| `activation`                         | No            | `object`                         | Metadati leggeri del pianificatore di attivazione per caricamento attivato da avvio, provider, comando, canale, rotta e capability. Solo metadati; il runtime del plugin possiede comunque il comportamento effettivo.             |
| `setup`                              | No            | `object`                         | Descrittori leggeri di setup/onboarding che le superfici di discovery e setup possono ispezionare senza caricare il runtime del plugin.                                                                                            |
| `qaRunners`                          | No            | `object[]`                       | Descrittori leggeri dei runner QA usati dall'host condiviso `openclaw qa` prima del caricamento del runtime del plugin.                                                                                                           |
| `contracts`                          | No            | `object`                         | Snapshot statica delle capability incluse per hook auth esterni, voce, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione musicale, generazione video, web-fetch, ricerca web e proprietà degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No            | `Record<string, object>`         | Valori predefiniti leggeri per la comprensione dei media per gli ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                |
| `channelConfigs`                     | No            | `Record<string, object>`         | Metadati di configurazione dei canali posseduti dal manifest, uniti nelle superfici di discovery e convalida prima del caricamento del runtime.                                                                                    |
| `skills`                             | No            | `string[]`                       | Directory Skills da caricare, relative alla radice del plugin.                                                                                                                                                                    |
| `name`                               | No            | `string`                         | Nome del plugin leggibile dalle persone.                                                                                                                                                                                          |
| `description`                        | No            | `string`                         | Breve riepilogo mostrato nelle superfici dei plugin.                                                                                                                                                                              |
| `version`                            | No            | `string`                         | Versione informativa del plugin.                                                                                                                                                                                                  |
| `uiHints`                            | No            | `Record<string, object>`         | Etichette UI, segnaposto e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                                              |

## Riferimento di providerAuthChoices

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o auth.
OpenClaw la legge prima del caricamento del runtime del provider.
Gli elenchi di setup dei provider usano queste scelte del manifest, le scelte di setup
derivate dai descrittori e i metadati del catalogo di installazione senza caricare il runtime del provider.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                             |
| --------------------- | ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID del provider a cui appartiene questa scelta.                                                          |
| `method`              | Sì           | `string`                                        | ID del metodo di autenticazione a cui effettuare il dispatch.                                            |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                          |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw ripiega su `choiceId`.                                |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il selettore.                                                                  |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.             |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente, consentendo comunque la selezione manuale dalla CLI.   |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID di scelta legacy che devono reindirizzare gli utenti a questa scelta sostitutiva.                     |
| `groupId`             | No           | `string`                                        | ID di gruppo facoltativo per raggruppare scelte correlate.                                              |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                           |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                     |
| `optionKey`           | No           | `string`                                        | Chiave di opzione interna per flussi di autenticazione semplici con un solo flag.                        |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                          |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'help della CLI.                                                                  |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | Superfici di onboarding in cui questa scelta deve apparire. Se omesso, il valore predefinito è `["text-inference"]`. |

## riferimento commandAliases

Usa `commandAliases` quando un plugin possiede un nome di comando runtime che gli utenti potrebbero
inserire per errore in `plugins.allow` o provare a eseguire come comando CLI root. OpenClaw
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

| Campo        | Obbligatorio | Tipo              | Significato                                                            |
| ------------ | ------------ | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo plugin.                       |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat anziché come comando CLI root. |
| `cliCommand` | No           | `string`          | Comando CLI root correlato da suggerire per le operazioni CLI, se esiste. |

## riferimento activation

Usa `activation` quando il plugin può dichiarare a basso costo quali eventi del control-plane
devono includerlo in un piano di attivazione/caricamento.

Questo blocco è metadati del planner, non un'API del ciclo di vita. Non registra
comportamenti runtime, non sostituisce `register(...)` e non promette che il
codice del plugin sia già stato eseguito. Il planner di attivazione usa questi campi per
restringere i plugin candidati prima di ripiegare sui metadati di proprietà del manifest
esistenti come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e gli hook.

Preferisci i metadati più ristretti che descrivono già la proprietà. Usa
`providers`, `channels`, `commandAliases`, descrittori di setup o `contracts`
quando quei campi esprimono la relazione. Usa `activation` per suggerimenti extra del planner
che non possono essere rappresentati da quei campi di proprietà.
Usa `cliBackends` di primo livello per alias runtime CLI come `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` è solo per
gli ID degli harness agente incorporati che non hanno già un campo di proprietà.

Questo blocco è solo metadati. Non registra comportamenti runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.
I consumer attuali lo usano come suggerimento di restringimento prima del caricamento più ampio dei plugin, quindi
i metadati di attivazione mancanti di solito costano solo in prestazioni; non dovrebbero
modificare la correttezza finché esistono ancora fallback legacy della proprietà del manifest.

Ogni plugin deve impostare intenzionalmente `activation.onStartup` mentre OpenClaw si sposta
dagli import di startup impliciti. Impostalo su `true` solo quando il plugin deve
essere eseguito durante l'avvio del Gateway. Impostalo su `false` quando il plugin è inattivo allo
startup e deve caricarsi solo da trigger più ristretti. Omettere `onStartup` mantiene
il fallback sidecar legacy implicito di startup deprecato per i plugin senza
metadati statici di capability; le versioni future potrebbero smettere di caricare allo startup quei
plugin a meno che dichiarino `activation.onStartup: true`. I report di stato e
compatibilità del plugin avvisano con `legacy-implicit-startup-sidecar` quando un plugin
fa ancora affidamento su quel fallback.

Per i test di migrazione, imposta
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` per disabilitare solo quel
fallback deprecato. Questa modalità opt-in non blocca i plugin espliciti con
`activation.onStartup: true` né i plugin caricati da canale, config,
agent-harness, memoria o altri trigger di attivazione più ristretti.

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

| Campo              | Obbligatorio | Tipo                                                 | Significato                                                                                                                                                                                                                      |
| ------------------ | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | No           | `boolean`                                            | Attivazione esplicita all'avvio del Gateway. Ogni plugin deve impostarla. `true` importa il plugin durante lo startup; `false` esclude il plugin dal fallback deprecato di startup sidecar implicito, a meno che un altro trigger corrispondente richieda il caricamento. |
| `onProviders`      | No           | `string[]`                                           | ID provider che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                                                             |
| `onAgentHarnesses` | No           | `string[]`                                           | ID runtime degli harness agente incorporati che devono includere questo plugin nei piani di attivazione/caricamento. Usa `cliBackends` di primo livello per gli alias backend CLI.                                                |
| `onCommands`       | No           | `string[]`                                           | ID comando che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                                                              |
| `onChannels`       | No           | `string[]`                                           | ID canale che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                                                               |
| `onRoutes`         | No           | `string[]`                                           | Tipi di route che devono includere questo plugin nei piani di attivazione/caricamento.                                                                                                                                           |
| `onConfigPaths`    | No           | `string[]`                                           | Percorsi config relativi alla root che devono includere questo plugin nei piani di startup/caricamento quando il percorso è presente e non esplicitamente disabilitato.                                                          |
| `onCapabilities`   | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti ampi di capability usati dalla pianificazione dell'attivazione del control-plane. Preferisci campi più ristretti quando possibile.                                                                                  |

Consumer live attuali:

- La pianificazione dello startup del Gateway usa `activation.onStartup` per l'import esplicito
  allo startup e l'opt-out dal fallback deprecato di startup sidecar implicito
- la pianificazione CLI attivata da comandi ripiega sui legacy
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la pianificazione dello startup dell'agent-runtime usa `activation.onAgentHarnesses` per
  gli harness incorporati e `cliBackends[]` di primo livello per gli alias runtime CLI
- la pianificazione setup/canale attivata da canale ripiega sulla proprietà legacy `channels[]`
  quando mancano metadati espliciti di attivazione del canale
- la pianificazione plugin allo startup usa `activation.onConfigPaths` per superfici config root
  non di canale, come il blocco `browser` del plugin browser integrato
- la pianificazione setup/runtime attivata da provider ripiega sulla proprietà legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti
  di attivazione del provider

La diagnostica del planner può distinguere i suggerimenti di attivazione espliciti dal fallback
di proprietà del manifest. Per esempio, `activation-command-hint` significa che
`activation.onCommands` ha trovato una corrispondenza, mentre `manifest-command-alias` significa che il
planner ha usato invece la proprietà `commandAliases`. Queste etichette di motivo sono per
la diagnostica e i test dell'host; gli autori di plugin devono continuare a dichiarare i metadati
che descrivono meglio la proprietà.

## riferimento qaRunners

Usa `qaRunners` quando un plugin contribuisce uno o più runner di trasporto sotto
la root condivisa `openclaw qa`. Mantieni questi metadati leggeri e statici; il runtime del plugin
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

| Campo         | Obbligatorio | Tipo     | Significato                                                      |
| ------------- | ------------ | -------- | ------------------------------------------------------------------ |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, per esempio `matrix`.    |
| `description` | No           | `string` | Testo di aiuto di fallback usato quando l'host condiviso richiede un comando stub. |

## riferimento setup

Usa `setup` quando le superfici di configurazione e onboarding hanno bisogno di metadati economici di proprietà del plugin
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

`cliBackends` di primo livello resta valido e continua a descrivere i backend di inferenza CLI. `setup.cliBackends` è la superficie dei descrittori specifica di setup per
i flussi di control-plane/setup che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di ricerca descriptor-first preferita per la discovery di setup. Se il descrittore restringe solo
il plugin candidato e il setup richiede ancora hook runtime più ricchi in fase di setup, imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione di fallback.

OpenClaw include anche `setup.providers[].envVars` nelle ricerche generiche di autenticazione provider e
variabili d'ambiente. `providerAuthEnvVars` resta supportato tramite un adapter di compatibilità durante la finestra di deprecazione, ma i plugin non in bundle che lo usano ancora
ricevono una diagnostica del manifest. I nuovi plugin devono inserire i metadati env di setup/stato
in `setup.providers[].envVars`.

OpenClaw può anche derivare scelte di setup semplici da `setup.providers[].authMethods`
quando non è disponibile alcuna voce di setup, oppure quando `setup.requiresRuntime: false`
dichiara che il runtime di setup non è necessario. Le voci esplicite `providerAuthChoices` restano
preferite per etichette personalizzate, flag CLI, ambito di onboarding e metadati dell'assistente.

Imposta `requiresRuntime: false` solo quando quei descrittori sono sufficienti per la
superficie di setup. OpenClaw tratta `false` esplicito come un contratto solo descrittori
e non eseguirà `setup-api` o `openclaw.setupEntry` per la ricerca di setup. Se
un plugin solo descrittori include comunque una di quelle voci runtime di setup,
OpenClaw segnala una diagnostica additiva e continua a ignorarla. `requiresRuntime`
omesso mantiene il comportamento di fallback legacy, così i plugin esistenti che hanno aggiunto
descrittori senza il flag non si rompono.

Poiché la ricerca di setup può eseguire codice `setup-api` di proprietà del plugin, i valori normalizzati
`setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra
i plugin scoperti. Una proprietà ambigua fallisce in modo chiuso invece di scegliere un
vincitore dall'ordine di discovery.

Quando il runtime di setup viene eseguito, le diagnostiche del registro di setup segnalano deriva dei descrittori
se `setup-api` registra un provider o backend CLI che i descrittori del manifest
non dichiarano, oppure se un descrittore non ha una registrazione runtime
corrispondente. Queste diagnostiche sono additive e non rifiutano i plugin legacy.

### riferimento setup.providers

| Campo          | Obbligatorio | Tipo       | Significato                                                                                    |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Sì           | `string`   | ID provider esposto durante setup o onboarding. Mantieni gli ID normalizzati globalmente univoci.             |
| `authMethods`  | No           | `string[]` | ID dei metodi di setup/auth supportati da questo provider senza caricare l'intero runtime.                       |
| `envVars`      | No           | `string[]` | Variabili d'ambiente che le superfici generiche di setup/stato possono controllare prima del caricamento del runtime del plugin.               |
| `authEvidence` | No           | `object[]` | Controlli economici di evidenza di autenticazione locale per provider che possono autenticarsi tramite marker non segreti. |

`authEvidence` è pensato per marker di credenziali locali di proprietà del provider che possono essere
verificati senza caricare codice runtime. Questi controlli devono restare economici e locali:
niente chiamate di rete, niente letture da keychain o secret-manager, niente comandi shell e nessun
probe API del provider.

Voci di evidenza supportate:

| Campo              | Obbligatorio | Tipo       | Significato                                                                                                  |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Sì           | `string`   | Attualmente `local-file-with-env`.                                                                               |
| `fileEnvVar`       | No           | `string`   | Variabile d'ambiente contenente un percorso esplicito al file di credenziali.                                                           |
| `fallbackPaths`    | No           | `string[]` | Percorsi locali dei file di credenziali controllati quando `fileEnvVar` è assente o vuota. Supporta `${HOME}` e `${APPDATA}`. |
| `requiresAnyEnv`   | No           | `string[]` | Almeno una variabile d'ambiente elencata deve essere non vuota prima che l'evidenza sia valida.                                    |
| `requiresAllEnv`   | No           | `string[]` | Ogni variabile d'ambiente elencata deve essere non vuota prima che l'evidenza sia valida.                                           |
| `credentialMarker` | Sì           | `string`   | Marker non segreto restituito quando l'evidenza è presente.                                                       |
| `source`           | No           | `string`   | Etichetta della sorgente rivolta all'utente per l'output di auth/stato.                                                               |

### campi setup

| Campo              | Obbligatorio | Tipo       | Significato                                                                                       |
| ------------------ | ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di setup dei provider esposti durante setup e onboarding.                                     |
| `cliBackends`      | No           | `string[]` | ID backend in fase di setup usati per la ricerca di setup descriptor-first. Mantieni gli ID normalizzati globalmente univoci. |
| `configMigrations` | No           | `string[]` | ID delle migrazioni di configurazione di proprietà della superficie di setup di questo plugin.                                          |
| `requiresRuntime`  | No           | `boolean`  | Se il setup richiede ancora l'esecuzione di `setup-api` dopo la ricerca dei descrittori.                            |

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
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etichetta del campo rivolta all'utente.                |
| `help`        | `string`   | Breve testo di aiuto.                      |
| `tags`        | `string[]` | Tag UI opzionali.                       |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.            |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo placeholder per gli input dei moduli.       |

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
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID factory di estensioni app-server Codex, attualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | ID runtime per cui un plugin in bundle può registrare middleware tool-result. |
| `externalAuthProviders`          | `string[]` | ID provider di cui questo plugin possiede l'hook del profilo auth esterno.       |
| `speechProviders`                | `string[]` | ID provider speech di proprietà di questo plugin.                                 |
| `realtimeTranscriptionProviders` | `string[]` | ID provider di trascrizione realtime di proprietà di questo plugin.                 |
| `realtimeVoiceProviders`         | `string[]` | ID provider voce realtime di proprietà di questo plugin.                         |
| `memoryEmbeddingProviders`       | `string[]` | ID provider di embedding memoria di proprietà di questo plugin.                       |
| `mediaUnderstandingProviders`    | `string[]` | ID provider di comprensione media di proprietà di questo plugin.                    |
| `imageGenerationProviders`       | `string[]` | ID provider di generazione immagini di proprietà di questo plugin.                       |
| `videoGenerationProviders`       | `string[]` | ID provider di generazione video di proprietà di questo plugin.                       |
| `webFetchProviders`              | `string[]` | ID provider di web-fetch di proprietà di questo plugin.                              |
| `webSearchProviders`             | `string[]` | ID provider di web-search di proprietà di questo plugin.                             |
| `migrationProviders`             | `string[]` | ID provider di importazione di proprietà di questo plugin per `openclaw migrate`.          |
| `tools`                          | `string[]` | Nomi degli strumenti agente di proprietà di questo plugin per i controlli dei contratti in bundle.        |

`contracts.embeddedExtensionFactories` viene mantenuto per factory di estensioni
solo app-server Codex in bundle. Le trasformazioni tool-result in bundle devono
dichiarare `contracts.agentToolResultMiddleware` e registrarsi con
`api.registerAgentToolResultMiddleware(...)`. I plugin esterni non possono
registrare middleware tool-result perché il seam può riscrivere output di strumenti ad alta fiducia
prima che il modello lo veda.

I plugin provider che implementano `resolveExternalAuthProfiles` devono dichiarare
`contracts.externalAuthProviders`. I plugin senza la dichiarazione continuano a passare
attraverso un fallback di compatibilità deprecato, ma quel fallback è più lento e
verrà rimosso dopo la finestra di migrazione.

I provider di embedding memoria in bundle devono dichiarare
`contracts.memoryEmbeddingProviders` per ogni ID adapter che espongono, inclusi
adapter integrati come `local`. I percorsi CLI autonomi usano questo contratto del manifest
per caricare solo il plugin proprietario prima che il runtime completo del Gateway abbia
registrato i provider.

## riferimento mediaUnderstandingProviderMetadata

Usa `mediaUnderstandingProviderMetadata` quando un provider di comprensione dei media ha
modelli predefiniti, priorità di fallback auto-auth o supporto nativo per i documenti di cui
gli helper generici del core hanno bisogno prima del caricamento del runtime. Le chiavi devono essere dichiarate anche in
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

| Campo                  | Tipo                                | Significato                                                                  |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacità multimediali esposte da questo provider.                            |
| `defaultModels`        | `Record<string, string>`            | Valori predefiniti capacità-modello usati quando la config non specifica un modello. |
| `autoPriority`         | `Record<string, number>`            | Numeri più bassi vengono ordinati prima per il fallback automatico del provider basato sulle credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input di documenti nativi supportati dal provider.                           |

## Riferimento channelConfigs

Usa `channelConfigs` quando un Plugin di canale ha bisogno di metadati di config leggeri prima del
caricamento del runtime. Il rilevamento di configurazione/stato del canale in sola lettura può usare questi metadati
direttamente per i canali esterni configurati quando non è disponibile alcuna voce di configurazione, oppure
quando `setup.requiresRuntime: false` dichiara che il runtime di configurazione non è necessario.

`channelConfigs` è metadato del manifesto del Plugin, non una nuova sezione di config utente
di primo livello. Gli utenti continuano a configurare le istanze di canale sotto `channels.<channel-id>`.
OpenClaw legge i metadati del manifesto per decidere quale Plugin possiede quel canale
configurato prima dell’esecuzione del codice runtime del Plugin.

Per un Plugin di canale, `configSchema` e `channelConfigs` descrivono percorsi
diversi:

- `configSchema` convalida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` convalida `channels.<channel-id>`

I Plugin non inclusi nel bundle che dichiarano `channels[]` dovrebbero dichiarare anche voci
`channelConfigs` corrispondenti. Senza di esse, OpenClaw può comunque caricare il Plugin, ma
lo schema di config nel percorso a freddo, la configurazione e le superfici della Control UI non possono conoscere la
forma delle opzioni di proprietà del canale finché il runtime del Plugin non viene eseguito.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` possono dichiarare valori predefiniti statici `auto` per i controlli della config dei comandi
che vengono eseguiti prima del caricamento del runtime del canale. I canali inclusi nel bundle possono anche pubblicare
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
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Richiesto per ogni voce di config canale dichiarata.     |
| `uiHints`     | `Record<string, object>` | Etichette/placeholder/suggerimenti sensibili opzionali della UI per quella sezione di config del canale. |
| `label`       | `string`                 | Etichetta del canale unita al selettore e alle superfici di ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                    |
| `commands`    | `object`                 | Valori predefiniti automatici statici per comandi nativi e skill native per i controlli di config pre-runtime. |
| `preferOver`  | `string[]`               | ID di Plugin legacy o con priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

### Sostituire un altro Plugin di canale

Usa `preferOver` quando il tuo Plugin è il proprietario preferito per un ID di canale che
può essere fornito anche da un altro Plugin. Casi comuni sono un ID di Plugin rinominato, un
Plugin standalone che sostituisce un Plugin incluso nel bundle, o un fork mantenuto che
conserva lo stesso ID di canale per compatibilità della config.

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

Quando `channels.chat` è configurato, OpenClaw considera sia l’ID del canale sia
l’ID del Plugin preferito. Se il Plugin con priorità inferiore era stato selezionato solo perché
è incluso nel bundle o abilitato per impostazione predefinita, OpenClaw lo disabilita nella config
runtime effettiva, così un solo Plugin possiede il canale e i suoi strumenti. La selezione esplicita dell’utente
ha comunque la precedenza: se l’utente abilita esplicitamente entrambi i Plugin, OpenClaw
mantiene quella scelta e segnala diagnostica di canali/strumenti duplicati invece di
modificare silenziosamente l’insieme di Plugin richiesto.

Mantieni `preferOver` limitato agli ID di Plugin che possono davvero fornire lo stesso canale.
Non è un campo di priorità generale e non rinomina le chiavi di config utente.

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

- i riferimenti espliciti `provider/model` usano i metadati del manifesto `providers` proprietari
- `modelPatterns` ha precedenza su `modelPrefixes`
- se un Plugin non incluso nel bundle e un Plugin incluso nel bundle corrispondono entrambi, il Plugin non incluso nel bundle
  prevale
- l’ambiguità rimanente viene ignorata finché l’utente o la config non specifica un provider

Campi:

| Campo           | Tipo       | Significato                                                                   |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.    |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

## Riferimento modelCatalog

Usa `modelCatalog` quando OpenClaw deve conoscere i metadati dei modelli del provider prima
di caricare il runtime del Plugin. Questa è la sorgente di proprietà del manifesto per righe di catalogo
fisse, alias del provider, regole di soppressione e modalità di rilevamento. L’aggiornamento runtime
rimane responsabilità del codice runtime del provider, ma il manifesto indica al core quando il runtime
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
| `providers`    | `Record<string, object>`                                 | Righe di catalogo per gli ID provider di proprietà di questo Plugin. Le chiavi dovrebbero comparire anche in `providers` di primo livello. |
| `aliases`      | `Record<string, object>`                                 | Alias del provider che dovrebbero risolversi a un provider proprietario per la pianificazione di catalogo o soppressione. |
| `suppressions` | `object[]`                                               | Righe modello provenienti da un’altra sorgente che questo Plugin sopprime per un motivo specifico del provider. |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indica se il catalogo del provider può essere letto dai metadati del manifesto, aggiornato nella cache o richiede il runtime. |

`aliases` partecipa alla ricerca della proprietà del provider per la pianificazione del model catalog.
Le destinazioni degli alias devono essere provider di primo livello di proprietà dello stesso Plugin. Quando un
elenco filtrato per provider usa un alias, OpenClaw può leggere il manifesto proprietario e
applicare le sostituzioni dell’API/URL base dell’alias senza caricare il runtime del provider.
Gli alias non espandono gli elenchi di catalogo non filtrati; gli elenchi ampi emettono solo
le righe del provider canonico proprietario.

`suppressions` sostituisce il vecchio hook runtime del provider `suppressBuiltInModel`.
Le voci di soppressione vengono rispettate solo quando il provider è di proprietà del Plugin o
dichiarato come chiave `modelCatalog.aliases` che punta a un provider proprietario. Gli hook di
soppressione runtime non vengono più chiamati durante la risoluzione del modello.

Campi del provider:

| Campo     | Tipo                     | Significato                                                       |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL base predefinito opzionale per i modelli in questo catalogo del provider. |
| `api`     | `ModelApi`               | Adattatore API predefinito opzionale per i modelli in questo catalogo del provider. |
| `headers` | `Record<string, string>` | Header statici opzionali che si applicano a questo catalogo del provider. |
| `models`  | `object[]`               | Righe modello richieste. Le righe senza un `id` vengono ignorate. |

Campi del modello:

| Campo           | Tipo                                                           | Cosa significa                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID modello locale del provider, senza il prefisso `provider/`.                    |
| `name`          | `string`                                                       | Nome visualizzato opzionale.                                                      |
| `api`           | `ModelApi`                                                     | Override API opzionale per modello.                                            |
| `baseUrl`       | `string`                                                       | Override opzionale dell'URL di base per modello.                                       |
| `headers`       | `Record<string, string>`                                       | Header statici opzionali per modello.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalità accettate dal modello.                                               |
| `reasoning`     | `boolean`                                                      | Se il modello espone comportamento di ragionamento.                               |
| `contextWindow` | `number`                                                       | Finestra di contesto nativa del provider.                                             |
| `contextTokens` | `number`                                                       | Limite effettivo opzionale del contesto runtime quando diverso da `contextWindow`. |
| `maxTokens`     | `number`                                                       | Token di output massimi quando noti.                                           |
| `cost`          | `object`                                                       | Prezzo opzionale in USD per milione di token, incluso `tieredPricing` opzionale. |
| `compat`        | `object`                                                       | Flag di compatibilità opzionali corrispondenti alla compatibilità della configurazione modello di OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato della voce. Sopprimi solo quando la riga non deve comparire affatto.          |
| `statusReason`  | `string`                                                       | Motivo opzionale mostrato con uno stato non disponibile.                            |
| `replaces`      | `string[]`                                                     | ID modello locali del provider precedenti che questo modello sostituisce.                       |
| `replacedBy`    | `string`                                                       | ID modello locale del provider sostitutivo per righe deprecate.                    |
| `tags`          | `string[]`                                                     | Tag stabili usati da selettori e filtri.                                    |

Campi di soppressione:

| Campo                      | Tipo       | Cosa significa                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID provider per la riga upstream da sopprimere. Deve essere posseduto da questo plugin o dichiarato come alias posseduto. |
| `model`                    | `string`   | ID modello locale del provider da sopprimere.                                                                      |
| `reason`                   | `string`   | Messaggio opzionale mostrato quando la riga soppressa viene richiesta direttamente.                                     |
| `when.baseUrlHosts`        | `string[]` | Elenco opzionale di host URL di base effettivi richiesti prima che la soppressione si applichi.               |
| `when.providerConfigApiIn` | `string[]` | Elenco opzionale di valori `api` esatti della configurazione provider richiesti prima che la soppressione si applichi.              |

Non inserire dati solo runtime in `modelCatalog`. Usa `static` solo quando le
righe del manifest sono abbastanza complete perché le superfici di elenco filtrate
per provider e i selettori possano saltare la scoperta registry/runtime. Usa
`refreshable` quando le righe del manifest sono semi elencabili o supplementi
utili, ma un aggiornamento/cache può aggiungere altre righe in seguito; le righe
refreshable non sono autorevoli da sole. Usa `runtime` quando OpenClaw deve
caricare il runtime del provider per conoscere l'elenco.

## riferimento modelIdNormalization

Usa `modelIdNormalization` per una pulizia economica degli ID modello posseduta
dal provider che deve avvenire prima del caricamento del runtime del provider.
Questo mantiene alias come nomi modello brevi, ID legacy locali del provider e
regole di prefisso proxy nel manifest del plugin proprietario invece che nelle
tabelle core di selezione modello.

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

Campi provider:

| Campo                                | Tipo                    | Cosa significa                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias esatti degli ID modello senza distinzione tra maiuscole e minuscole. I valori vengono restituiti come scritti.                  |
| `stripPrefixes`                      | `string[]`              | Prefissi da rimuovere prima della ricerca alias, utile per duplicazioni legacy provider/modello.     |
| `prefixWhenBare`                     | `string`                | Prefisso da aggiungere quando l'ID modello normalizzato non contiene già `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Regole condizionali di prefisso per ID bare dopo la ricerca alias, indicizzate da `modelPrefix` e `prefix`. |

## riferimento providerEndpoints

Usa `providerEndpoints` per la classificazione degli endpoint che la policy
generica delle richieste deve conoscere prima che il runtime del provider venga
caricato. Il core possiede ancora il significato di ogni `endpointClass`; i
manifest dei plugin possiedono i metadati di host e URL di base.

Campi endpoint:

| Campo                          | Tipo       | Cosa significa                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe endpoint core nota, come `openrouter`, `moonshot-native` o `google-vertex`.        |
| `hosts`                        | `string[]` | Nomi host esatti che si mappano alla classe endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Suffissi host che si mappano alla classe endpoint. Anteponi `.` per il matching solo su suffisso di dominio. |
| `baseUrls`                     | `string[]` | URL di base HTTP(S) normalizzati esatti che si mappano alla classe endpoint.                             |
| `googleVertexRegion`           | `string`   | Regione statica Google Vertex per host globali esatti.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Suffisso da rimuovere dagli host corrispondenti per esporre il prefisso della regione Google Vertex.                 |

## riferimento providerRequest

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

Campi provider:

| Campo                 | Tipo         | Cosa significa                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Etichetta della famiglia provider usata dalle decisioni generiche di compatibilità delle richieste e dalla diagnostica. |
| `compatibilityFamily` | `"moonshot"` | Bucket opzionale di compatibilità della famiglia provider per helper di richiesta condivisi.              |
| `openAICompletions`   | `object`     | Flag di richiesta completions compatibili con OpenAI, attualmente `supportsStreamingUsage`.       |

## riferimento modelPricing

Usa `modelPricing` quando un provider ha bisogno di comportamento di pricing del
control plane prima del caricamento runtime. La cache dei prezzi del Gateway
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

Campi provider:

| Campo        | Tipo              | Cosa significa                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Imposta `false` per provider locali/self-hosted che non devono mai recuperare prezzi OpenRouter o LiteLLM. |
| `openRouter` | `false \| object` | Mappatura della ricerca prezzi OpenRouter. `false` disabilita la ricerca OpenRouter per questo provider.           |
| `liteLLM`    | `false \| object` | Mappatura della ricerca prezzi LiteLLM. `false` disabilita la ricerca LiteLLM per questo provider.                 |

Campi sorgente:

| Campo                      | Tipo               | Cosa significa                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID provider del catalogo esterno quando differisce dall'ID provider OpenClaw, per esempio `z-ai` per un provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Tratta gli ID modello contenenti slash come riferimenti provider/modello annidati, utile per provider proxy come OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Varianti aggiuntive dell'ID modello del catalogo esterno. `version-dots` prova ID versione puntati come `claude-opus-4.6`.            |

### Indice Provider OpenClaw

L'Indice Provider OpenClaw è metadati di anteprima posseduti da OpenClaw per
provider i cui plugin potrebbero non essere ancora installati. Non fa parte di un
manifest di plugin. I manifest dei plugin rimangono l'autorità per i plugin
installati. L'Indice Provider è il contratto di fallback interno che le future
superfici di selezione modello per provider installabili e pre-installazione
consumeranno quando un plugin provider non è installato.

Ordine di autorità del catalogo:

1. Configurazione utente.
2. Manifest del plugin installato `modelCatalog`.
3. Cache del catalogo modelli da aggiornamento esplicito.
4. Righe di anteprima dell'Indice Provider OpenClaw.

L'Indice dei fornitori non deve contenere segreti, stato abilitato, hook di runtime o
dati dei modelli live specifici dell'account. I suoi cataloghi di anteprima usano la stessa
forma di riga del fornitore `modelCatalog` dei manifest dei plugin, ma devono restare limitati
ai metadati di visualizzazione stabili, a meno che campi dell'adapter di runtime come `api`,
`baseUrl`, prezzi o flag di compatibilità non siano mantenuti intenzionalmente allineati con
il manifest del Plugin installato. I fornitori con discovery live `/models` devono
scrivere le righe aggiornate tramite il percorso esplicito della cache del catalogo dei modelli, invece di
far chiamare le API del fornitore al normale elenco o all'onboarding.

Le voci dell'Indice dei fornitori possono anche contenere metadati di Plugin installabile per fornitori
il cui Plugin è stato spostato fuori dal core o non è comunque ancora installato. Questi
metadati rispecchiano il pattern del catalogo dei canali: nome del pacchetto, specifica di installazione npm,
integrità attesa ed etichette economiche di scelta dell'autenticazione sono sufficienti per mostrare
un'opzione di configurazione installabile. Una volta installato il Plugin, il suo manifest prevale e
la voce dell'Indice dei fornitori viene ignorata per quel fornitore.

Le chiavi di capacità top-level legacy sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi top-level come ownership delle capacità.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Per cosa usarlo                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Discovery, validazione della configurazione, metadati di scelta dell'autenticazione e suggerimenti UI che devono esistere prima dell'esecuzione del codice del Plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating di installazione, configurazione o metadati di catalogo |

Se non sei sicuro di dove appartenga un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del Plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda packaging, file di ingresso o comportamento di installazione npm, inseriscilo in `package.json`

### Campi di package.json che influenzano la discovery

Alcuni metadati del Plugin pre-runtime vivono intenzionalmente in `package.json` sotto il
blocco `openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Cosa significa                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Dichiara entrypoint nativi del Plugin. Deve restare all'interno della directory del pacchetto Plugin.                                                                                 |
| `openclaw.runtimeExtensions`                                      | Dichiara entrypoint di runtime JavaScript compilati per pacchetti installati. Deve restare all'interno della directory del pacchetto Plugin.                                          |
| `openclaw.setupEntry`                                             | Entrypoint leggero solo per la configurazione, usato durante onboarding, avvio differito del canale e discovery di stato canale/SecretRef in sola lettura. Deve restare all'interno della directory del pacchetto Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Dichiara l'entrypoint di configurazione JavaScript compilato per pacchetti installati. Deve restare all'interno della directory del pacchetto Plugin.                                |
| `openclaw.channel`                                                | Metadati economici del catalogo canali come etichette, percorsi docs, alias e testo di selezione.                                                                                    |
| `openclaw.channel.commands`                                       | Metadati statici di comando nativo e di auto-default delle Skills native usati da superfici di configurazione, audit ed elenco comandi prima del caricamento del runtime del canale. |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo dello stato configurato che possono rispondere a "la configurazione solo env esiste già?" senza caricare l'intero runtime del canale.                 |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo dell'autenticazione persistita che possono rispondere a "c'è già qualcosa con accesso effettuato?" senza caricare l'intero runtime del canale.       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per Plugin inclusi ed esternamente pubblicati.                                                                                           |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più fonti di installazione.                                                                                              |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando un limite semver come `>=2026.3.22`.                                                                                           |
| `openclaw.install.expectedIntegrity`                              | Stringa di integrità npm dist attesa, come `sha512-...`; i flussi di installazione e aggiornamento verificano l'artefatto scaricato rispetto a essa.                                |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero tramite reinstallazione di Plugin incluso quando la configurazione non è valida.                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente il caricamento delle superfici canale solo setup prima del Plugin canale completo durante l'avvio.                                                                          |

I metadati del manifest decidono quali scelte di fornitore/canale/configurazione appaiono in
onboarding prima del caricamento del runtime. `package.json#openclaw.install` indica
all'onboarding come recuperare o abilitare quel Plugin quando l'utente sceglie una di quelle
opzioni. Non spostare i suggerimenti di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del
registro dei manifest. I valori non validi vengono rifiutati; i valori più recenti ma validi saltano il
Plugin sugli host più vecchi.

Il pinning esatto della versione npm vive già in `npmSpec`, per esempio
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci ufficiali del catalogo esterno
devono abbinare specifiche esatte a `expectedIntegrity`, così i flussi di aggiornamento falliscono
in modo chiuso se l'artefatto npm scaricato non corrisponde più alla release fissata.
L'onboarding interattivo offre ancora specifiche npm da registri attendibili, inclusi nomi di pacchetto
nudi e dist-tag, per compatibilità. Le diagnostiche del catalogo possono
distinguere fonti esatte, mobili, con integrità fissata, senza integrità, con
mismatch del nome pacchetto e con scelta predefinita non valida. Avvisano anche quando
`expectedIntegrity` è presente ma non c'è una fonte npm valida che possa fissare.
Quando `expectedIntegrity` è presente,
i flussi di installazione/aggiornamento la applicano; quando è omessa, la risoluzione del registro viene
registrata senza un pin di integrità.

I Plugin di canale devono fornire `openclaw.setupEntry` quando stato, elenco canali
o scansioni SecretRef devono identificare account configurati senza caricare l'intero
runtime. L'entry di setup deve esporre metadati del canale più adapter di configurazione,
stato e segreti sicuri per il setup; mantieni client di rete, listener del Gateway e
runtime di trasporto nell'entrypoint principale dell'estensione.

I campi di entrypoint di runtime non sovrascrivono i controlli di confine del pacchetto per i campi di
entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non può rendere caricabile
un percorso `openclaw.extensions` che evade il confine.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non rende
installabili configurazioni arbitrarie rotte. Oggi consente solo ai flussi di installazione
di recuperare da specifici errori obsoleti di upgrade di Plugin incluso, come un
percorso mancante di Plugin incluso o una voce `channels.<id>` obsoleta per lo stesso
Plugin incluso. Errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è metadato di pacchetto per un minuscolo modulo di controllo:

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

Usalo quando configurazione, doctor, stato o flussi di presenza in sola lettura richiedono una sonda
di autenticazione sì/no economica prima del caricamento del Plugin canale completo. Lo stato di autenticazione persistito non è
stato canale configurato: non usare questi metadati per abilitare automaticamente Plugin,
riparare dipendenze di runtime o decidere se un runtime canale debba caricarsi.
L'export di destinazione deve essere una piccola funzione che legge solo lo stato persistito; non
instradarla attraverso il barrel del runtime canale completo.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici
configurati solo env:

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
runtime del canale, mantieni quella logica nell'hook `config.hasConfiguredState`
del Plugin.

## Precedenza della discovery (id Plugin duplicati)

OpenClaw scopre Plugin da diverse radici (inclusi, installazione globale, workspace, percorsi espliciti selezionati dalla configurazione). Se due discovery condividono lo stesso `id`, viene mantenuto solo il manifest con **precedenza più alta**; i duplicati con precedenza inferiore vengono scartati invece di essere caricati accanto a esso.

Precedenza, dalla più alta alla più bassa:

1. **Selezionato dalla configurazione** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Incluso** — Plugin distribuiti con OpenClaw
3. **Installazione globale** — Plugin installati nella radice globale dei Plugin OpenClaw
4. **Workspace** — Plugin scoperti relativamente al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un Plugin incluso presente nel workspace non oscurerà la build inclusa.
- Per sovrascrivere davvero un Plugin incluso con uno locale, fissalo tramite `plugins.entries.<id>` così vince per precedenza invece di affidarti alla discovery del workspace.
- Gli scarti dei duplicati vengono registrati nei log così Doctor e le diagnostiche di avvio possono indicare la copia scartata.

## Requisiti JSON Schema

- **Ogni Plugin deve distribuire un JSON Schema**, anche se non accetta configurazione.
- Uno schema vuoto è accettabile (per esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati in fase di lettura/scrittura della configurazione, non a runtime.

## Comportamento di validazione

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'id del canale non sia dichiarato da
  un manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a id Plugin **individuabili**. Gli id sconosciuti sono **errori**.
- Se un Plugin è installato ma ha un manifest o uno schema non valido o mancante,
  la convalida fallisce e Doctor segnala l'errore del Plugin.
- Se esiste una configurazione Plugin ma il Plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + log.

Consulta [Riferimento di configurazione](/it/gateway/configuration) per lo schema `plugins.*` completo.

## Note

- Il manifest è **obbligatorio per i Plugin OpenClaw nativi**, inclusi i caricamenti dal filesystem locale. Il runtime carica comunque separatamente il modulo del Plugin; il manifest serve solo per individuazione + convalida.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi senza virgolette sono accettati finché il valore finale resta un oggetto.
- Solo i campi del manifest documentati vengono letti dal caricatore del manifest. Evita chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono essere tutti omessi quando un Plugin non ne ha bisogno.
- `providerDiscoveryEntry` deve restare leggero e non dovrebbe importare codice runtime ampio; usalo per metadati statici del catalogo provider o descrittori di individuazione limitati, non per l'esecuzione al momento della richiesta.
- I tipi di Plugin esclusivi vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` tramite `plugins.slots.memory`, `kind: "context-engine"` tramite `plugins.slots.contextEngine` (predefinito `legacy`).
- Dichiara il tipo di Plugin esclusivo in questo manifest. `OpenClawPluginDefinition.kind` dell'entry runtime è deprecato e rimane solo come fallback di compatibilità per Plugin meno recenti.
- I metadati delle variabili d'ambiente (`setup.providers[].envVars`, `providerAuthEnvVars` deprecato e `channelEnvVars`) sono solo dichiarativi. Stato, audit, convalida della consegna cron e altre superfici di sola lettura applicano comunque la fiducia del Plugin e la policy di attivazione effettiva prima di considerare configurata una variabile d'ambiente.
- Per i metadati del wizard runtime che richiedono codice provider, consulta [Hook runtime provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il tuo Plugin dipende da moduli nativi, documenta i passaggi di build ed eventuali requisiti di allowlist del package manager (ad esempio, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Correlati

<CardGroup cols={3}>
  <Card title="Creare Plugin" href="/it/plugins/building-plugins" icon="rocket">
    Primi passi con i Plugin.
  </Card>
  <Card title="Architettura Plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello di capability.
  </Card>
  <Card title="Panoramica SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento SDK Plugin e importazioni di sottopercorsi.
  </Card>
</CardGroup>
