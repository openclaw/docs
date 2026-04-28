---
read_when:
    - Devi sapere da quale sottopercorso SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando un export SDK specifico
sidebarTitle: SDK overview
summary: Mappa degli import, riferimento dell'API di registrazione e architettura SDK
title: Panoramica del Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:53:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Il plugin SDK è il contratto tipizzato tra Plugin e core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Tip>
  Cerchi invece una guida pratica?

- Primo Plugin? Inizia da [Creare Plugin](/it/plugins/building-plugins).
- Plugin di canale? Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).
- Plugin provider? Vedi [Plugin provider](/it/plugins/sdk-provider-plugins).
- Plugin di strumenti o hook del ciclo di vita? Vedi [Hook dei Plugin](/it/plugins/hooks).
</Tip>

## Convenzione di import

Importa sempre da uno specifico sottopercorso:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un piccolo modulo autosufficiente. Questo mantiene rapido l'avvio e
previene problemi di dipendenze circolari. Per helper di entry/build specifici del canale,
preferisci `openclaw/plugin-sdk/channel-core`; mantieni `openclaw/plugin-sdk/core` per
la superficie umbrella più ampia e gli helper condivisi come
`buildChannelConfigSchema`.

Per la configurazione del canale, pubblica lo JSON Schema di proprietà del canale tramite
`openclaw.plugin.json#channelConfigs`. Il sottopercorso `plugin-sdk/channel-config-schema`
serve per primitive di schema condivise e per il builder generico. Qualsiasi
export di schema con nome di canale incluso su quel sottopercorso sono export di compatibilità legacy, non un modello per nuovi Plugin.

<Warning>
  Non importare seam di convenienza brandizzate per provider o canale (ad esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  I Plugin inclusi compongono sottopercorsi SDK generici dentro i propri barrel locali `api.ts` /
  `runtime-api.ts`; i consumer core dovrebbero usare o quei barrel locali del Plugin
  oppure aggiungere un contratto SDK generico ristretto quando l'esigenza è davvero
  cross-channel.

Un piccolo insieme di seam helper di Plugin inclusi (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` e simili) appare ancora nella
mappa degli export generata. Esistono solo per la manutenzione dei Plugin inclusi e non sono
percorsi di import consigliati per nuovi Plugin di terze parti.
</Warning>

## Riferimento dei sottopercorsi

Il plugin SDK è esposto come un insieme di sottopercorsi ristretti raggruppati per area (entry
del Plugin, canale, provider, auth, runtime, capability, memoria e helper
riservati dei Plugin inclusi). Per il catalogo completo — raggruppato e collegato — vedi
[Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths).

L'elenco generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle funzionalità

| Metodo                                           | Cosa registra                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)              |
| `api.registerAgentHarness(...)`                  | Esecutore agente sperimentale di basso livello |
| `api.registerCliBackend(...)`                    | Backend CLI locale per inferenza      |
| `api.registerChannel(...)`                       | Canale di messaggistica               |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming    |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex       |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video       |
| `api.registerImageGenerationProvider(...)`       | Generazione immagini                  |
| `api.registerMusicGenerationProvider(...)`       | Generazione musicale                  |
| `api.registerVideoGenerationProvider(...)`       | Generazione video                     |
| `api.registerWebFetchProvider(...)`              | Provider di recupero / scraping web   |
| `api.registerWebSearchProvider(...)`             | Ricerca web                           |

### Strumenti e comandi

| Metodo                          | Cosa registra                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)       |

### Infrastruttura

| Metodo                                         | Cosa registra                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook di evento                        |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway             |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway                |
| `api.registerGatewayDiscoveryService(service)` | Advertiser di individuazione locale del Gateway |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                      |
| `api.registerService(service)`                 | Servizio in background                |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime per il risultato degli strumenti |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione additiva del prompt adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo di ricerca/lettura della memoria |

<Note>
  Gli spazi dei nomi admin riservati del core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restano sempre `operator.admin`, anche se un Plugin prova ad assegnare un
  ambito di metodo gateway più ristretto. Preferisci prefissi specifici del Plugin per
  metodi di proprietà del Plugin.
</Note>

<Accordion title="Quando usare il middleware del risultato degli strumenti">
  I Plugin inclusi possono usare `api.registerAgentToolResultMiddleware(...)` quando
  hanno bisogno di riscrivere un risultato di strumento dopo l'esecuzione e prima che il runtime
  reimmetta quel risultato nel modello. Questa è la seam fidata neutrale rispetto al runtime
  per riduttori asincroni dell'output come tokenjuice.

I Plugin inclusi devono dichiarare `contracts.agentToolResultMiddleware` per ogni
runtime mirato, ad esempio `["pi", "codex"]`. I Plugin esterni
non possono registrare questo middleware; mantieni i normali hook dei Plugin OpenClaw per il lavoro
che non richiede tempistiche del risultato dello strumento pre-modello. Il vecchio percorso di registrazione
della factory di estensione embedded solo Pi è stato rimosso.
</Accordion>

### Registrazione dell'individuazione del Gateway

`api.registerGatewayDiscoveryService(...)` consente a un Plugin di pubblicizzare il Gateway attivo
su un trasporto locale di individuazione come mDNS/Bonjour. OpenClaw chiama il
servizio durante l'avvio del Gateway quando l'individuazione locale è abilitata, passa le
porte correnti del Gateway e i dati TXT hint non segreti e chiama l'handler `stop`
restituito durante lo spegnimento del Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

I Plugin di individuazione del Gateway non devono trattare i valori TXT pubblicizzati come segreti o
autenticazione. L'individuazione è un suggerimento di instradamento; autenticazione del Gateway e pinning TLS restano i proprietari della fiducia.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: root di comando esplicite possedute dal registrar
- `descriptors`: descrittori di comando in fase di parsing usati per help della CLI root,
  instradamento e registrazione lazy della CLI del Plugin

Se vuoi che un comando del Plugin resti caricato lazy nel normale percorso CLI root,
fornisci `descriptors` che coprano ogni root di comando di primo livello esposta da quel
registrar.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Gestisci account Matrix, verifica, dispositivi e stato del profilo",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` da solo solo quando non ti serve la registrazione lazy della CLI root.
Quel percorso di compatibilità eager resta supportato, ma non installa
placeholder supportati da descriptor per il caricamento lazy in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un Plugin di possedere la configurazione predefinita per un
backend CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso provider nei model ref come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente continua ad avere la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sulla
  configurazione predefinita del Plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend necessita di riscritture di compatibilità dopo il merge
  (ad esempio normalizzazione di vecchie forme di flag).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). La callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Funzionalità di memoria unificata                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione prompt della memoria                                                                                                              |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Adapter del runtime di memoria                                                                                                                          |

### Adapter di embedding della memoria

| Metodo                                         | Cosa registra                                   |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding della memoria per il Plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per il Plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i Plugin companion possono consumare artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di entrare nel layout privato di uno specifico
  Plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive compatibili con il legacy per Plugin di memoria.
- `registerMemoryEmbeddingProvider` consente al Plugin di memoria attivo di registrare uno
  o più id di adapter di embedding (ad esempio `openai`, `gemini` o un id personalizzato definito dal Plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a questi id di adapter registrati.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                     |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook del ciclo di vita tipizzato |
| `api.onConversationBindingResolved(handler)` | Callback di risoluzione dell'associazione della conversazione |

Vedi [Hook dei Plugin](/it/plugins/hooks) per esempi, nomi di hook comuni e semantica
dei guard.

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (uguale a omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (uguale a omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Una volta che un handler rivendica il dispatch, gli handler con priorità inferiore e il percorso di dispatch predefinito del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (uguale a omettere `cancel`), non come override.
- `message_received`: usa il campo tipizzato `threadId` quando ti serve instradamento in entrata di thread/topic. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: usa i campi di instradamento tipizzati `replyToId` / `threadId` prima di ricadere nei `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio posseduto dal Gateway invece di fare affidamento su hook interni `gateway:startup`.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id del Plugin                                                                               |
| `api.name`               | `string`                  | nome visualizzato                                                                           |
| `api.version`            | `string?`                 | versione del Plugin (facoltativa)                                                           |
| `api.description`        | `string?`                 | descrizione del Plugin (facoltativa)                                                        |
| `api.source`             | `string`                  | percorso sorgente del Plugin                                                                |
| `api.rootDir`            | `string?`                 | directory root del Plugin (facoltativa)                                                     |
| `api.config`             | `OpenClawConfig`          | snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | configurazione specifica del Plugin da `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | logger con ambito (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup prima dell'entry completa |
| `api.resolvePath(input)` | `(string) => string`      | risolve il percorso relativo alla root del Plugin                                           |

## Convenzione dei moduli interni

All'interno del tuo Plugin, usa file barrel locali per gli import interni:

```
my-plugin/
  api.ts            # Export pubblici per consumer esterni
  runtime-api.ts    # Export runtime solo interni
  index.ts          # Entry point del Plugin
  setup-entry.ts    # Entry leggera solo setup (facoltativa)
```

<Warning>
  Non importare mai il tuo stesso Plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada gli import interni tramite `./api.ts` oppure
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei Plugin inclusi caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di entry pubblici simili) preferiscono lo
snapshot attivo della configurazione runtime quando OpenClaw è già in esecuzione. Se non esiste ancora
uno snapshot runtime, usano come fallback il file di configurazione risolto su disco.

I Plugin provider possono esporre un barrel contrattuale locale ristretto del Plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK generico. Esempi inclusi:

- **Anthropic**: seam pubblica `api.ts` / `contract-api.ts` per helper
  di stream `beta-header` e `service_tier` di Claude.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder del provider,
  helper per il modello predefinito e builder del provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder del provider
  più helper di onboarding/configurazione.

<Warning>
  Anche il codice di produzione delle extension dovrebbe evitare import
  `openclaw/plugin-sdk/<other-plugin>`. Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alla funzionalità invece di accoppiare due Plugin tra loro.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Entry point" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo dello spazio dei nomi `api.runtime`.
  </Card>
  <Card title="Setup e configurazione" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifest e schemi di configurazione.
  </Card>
  <Card title="Test" icon="vial" href="/it/plugins/sdk-testing">
    Utility di test e regole lint.
  </Card>
  <Card title="Migrazione SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione da superfici deprecate.
  </Card>
  <Card title="Interni del Plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello di funzionalità.
  </Card>
</CardGroup>
