---
read_when:
    - Ti serve sapere da quale sottopercorso SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando un export specifico dell'SDK
sidebarTitle: SDK overview
summary: Import map, riferimento API di registrazione e architettura SDK
title: Panoramica del Plugin SDK
x-i18n:
    generated_at: "2026-04-24T08:53:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

L'SDK del Plugin è il contratto tipizzato tra Plugin e core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Tip>
  Cerchi invece una guida pratica?

- Primo Plugin? Inizia con [Building plugins](/it/plugins/building-plugins).
- Plugin di canale? Vedi [Channel plugins](/it/plugins/sdk-channel-plugins).
- Plugin provider? Vedi [Provider plugins](/it/plugins/sdk-provider-plugins).
  </Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autosufficiente. Questo mantiene l'avvio veloce e
previene problemi di dipendenze circolari. Per gli helper di entry/build specifici del canale,
preferisci `openclaw/plugin-sdk/channel-core`; mantieni `openclaw/plugin-sdk/core` per
la superficie ombrello più ampia e per helper condivisi come
`buildChannelConfigSchema`.

<Warning>
  Non importare convenience seam con marchio di provider o canale (ad esempio
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  I Plugin inclusi compongono sottopercorsi SDK generici dentro i propri barrel
  `api.ts` / `runtime-api.ts`; i consumer core dovrebbero usare quei barrel locali del Plugin
  oppure aggiungere un contratto SDK generico ristretto quando la necessità è davvero
  cross-channel.

Un piccolo insieme di seam helper per Plugin inclusi (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` e simili) compare ancora nella
mappa degli export generata. Esistono solo per la manutenzione dei Plugin inclusi e
non sono percorsi di importazione consigliati per nuovi Plugin di terze parti.
</Warning>

## Riferimento dei sottopercorsi

L'SDK del Plugin è esposto come un insieme di sottopercorsi ristretti raggruppati per area (entry
del Plugin, canale, provider, auth, runtime, capacità, memory e helper riservati
ai Plugin inclusi). Per il catalogo completo — raggruppato e con link — vedi
[Plugin SDK subpaths](/it/plugins/sdk-subpaths).

L'elenco generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capacità

| Metodo | Cosa registra |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)` | Inferenza testuale (LLM) |
| `api.registerAgentHarness(...)` | Esecutore sperimentale di basso livello dell'agente |
| `api.registerCliBackend(...)` | Backend CLI locale di inferenza |
| `api.registerChannel(...)` | Canale di messaggistica |
| `api.registerSpeechProvider(...)` | Sintesi text-to-speech / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming |
| `api.registerRealtimeVoiceProvider(...)` | Sessioni vocali realtime duplex |
| `api.registerMediaUnderstandingProvider(...)` | Analisi di immagini/audio/video |
| `api.registerImageGenerationProvider(...)` | Generazione di immagini |
| `api.registerMusicGenerationProvider(...)` | Generazione musicale |
| `api.registerVideoGenerationProvider(...)` | Generazione video |
| `api.registerWebFetchProvider(...)` | Provider di web fetch / scraping |
| `api.registerWebSearchProvider(...)` | Ricerca web |

### Strumenti e comandi

| Metodo | Cosa registra |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento dell'agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)` | Comando personalizzato (bypassa l'LLM) |

### Infrastruttura

| Metodo | Cosa registra |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)` | Hook di evento |
| `api.registerHttpRoute(params)` | Endpoint HTTP del Gateway |
| `api.registerGatewayMethod(name, handler)` | Metodo RPC del Gateway |
| `api.registerGatewayDiscoveryService(service)` | Inserzionista di discovery locale del Gateway |
| `api.registerCli(registrar, opts?)` | Sottocomando CLI |
| `api.registerService(service)` | Servizio in background |
| `api.registerInteractiveHandler(registration)` | Gestore interattivo |
| `api.registerEmbeddedExtensionFactory(factory)` | Factory di estensione del runner incorporato Pi |
| `api.registerMemoryPromptSupplement(builder)` | Sezione additiva di prompt adiacente a memory |
| `api.registerMemoryCorpusSupplement(adapter)` | Corpus additivo di ricerca/lettura di memory |

<Note>
  I namespace amministrativi core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restano sempre `operator.admin`, anche se un Plugin prova ad assegnare un
  ambito di metodo gateway più ristretto. Preferisci prefissi specifici del Plugin per
  i metodi posseduti dal Plugin.
</Note>

<Accordion title="Quando usare registerEmbeddedExtensionFactory">
  Usa `api.registerEmbeddedExtensionFactory(...)` quando un Plugin ha bisogno di timing di eventi nativi Pi durante le esecuzioni incorporate di OpenClaw — ad esempio riscritture asincrone di `tool_result`
  che devono avvenire prima che il messaggio finale del risultato dello strumento venga emesso.

Questa è oggi una seam per Plugin inclusi: solo i Plugin inclusi possono registrarne una,
e devono dichiarare `contracts.embeddedExtensionFactories: ["pi"]` in
`openclaw.plugin.json`. Mantieni i normali hook del Plugin OpenClaw per tutto ciò
  che non richiede quella seam di livello inferiore.
</Accordion>

### Registrazione del discovery del Gateway

`api.registerGatewayDiscoveryService(...)` consente a un Plugin di pubblicizzare il
Gateway attivo su un trasporto di discovery locale come mDNS/Bonjour. OpenClaw chiama il
servizio durante l'avvio del Gateway quando il discovery locale è abilitato, passa le
porte correnti del Gateway e dati TXT di hint non segreti, e chiama il gestore `stop`
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

I Plugin di discovery del Gateway non devono trattare i valori TXT pubblicizzati come segreti o
autenticazione. Il discovery è un hint di instradamento; autenticazione del Gateway e pinning TLS continuano a governare la fiducia.

### Metadati della registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: root di comando esplicite possedute dal registrar
- `descriptors`: descrittori di comando in fase di parsing usati per help della CLI root,
  instradamento e registrazione lazy della CLI del Plugin

Se vuoi che un comando Plugin resti lazy-loaded nel normale percorso CLI root,
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
Quel percorso di compatibilità eager continua a essere supportato, ma non installa
placeholder supportati da descrittori per il lazy loading in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un Plugin di possedere la configurazione predefinita per un
backend CLI locale AI come `codex-cli`.

- L'`id` del backend diventa il prefisso del provider nei riferimenti modello come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente continua ad avere la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il
  valore predefinito del Plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend necessita di riscritture di compatibilità dopo il merge
  (ad esempio normalizzare vecchie forme di flag).

### Slot esclusivi

| Metodo | Cosa registra |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)` | Motore di contesto (uno attivo alla volta). La callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capacità unificata di memory |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione prompt di memory |
| `api.registerMemoryFlushPlan(resolver)` | Resolver del piano di flush di memory |
| `api.registerMemoryRuntime(runtime)` | Adattatore runtime di memory |

### Adattatori di embedding memory

| Metodo | Cosa registra |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adattatore di embedding memory per il Plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per Plugin di memory.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i Plugin companion possono consumare artefatti memory esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di entrare nel layout privato di uno specifico
  Plugin memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive legacy-compatibili per Plugin di memory.
- `registerMemoryEmbeddingProvider` consente al Plugin memory attivo di registrare uno
  o più id di adattatore di embedding (ad esempio `openai`, `gemini` o un id personalizzato
  definito dal Plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli id
  di adattatore registrati.

### Eventi e ciclo di vita

| Metodo | Cosa fa |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)` | Hook tipizzato del ciclo di vita |
| `api.onConversationBindingResolved(handler)` | Callback di binding della conversazione |

### Semantica decisionale degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Una volta che un gestore lo imposta, i gestori a priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (uguale a omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Una volta che un gestore lo imposta, i gestori a priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (uguale a omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Una volta che un gestore rivendica il dispatch, i gestori a priorità inferiore e il percorso predefinito di dispatch del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Una volta che un gestore lo imposta, i gestori a priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (uguale a omettere `cancel`), non come override.
- `message_received`: usa il campo tipizzato `threadId` quando hai bisogno di instradamento in ingresso di thread/argomento. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: usa i campi tipizzati di instradamento `replyToId` / `threadId` prima di ricorrere a `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio posseduto dal gateway invece di affidarti agli hook interni `gateway:startup`.

### Campi dell'oggetto API

| Campo | Tipo | Descrizione |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id` | `string` | Id del Plugin |
| `api.name` | `string` | Nome visualizzato |
| `api.version` | `string?` | Versione del Plugin (facoltativa) |
| `api.description` | `string?` | Descrizione del Plugin (facoltativa) |
| `api.source` | `string` | Percorso sorgente del Plugin |
| `api.rootDir` | `string?` | Directory root del Plugin (facoltativa) |
| `api.config` | `OpenClawConfig` | Istantanea corrente della configurazione (istantanea runtime attiva in memoria quando disponibile) |
| `api.pluginConfig` | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config` |
| `api.runtime` | `PluginRuntime` | [Helper runtime](/it/plugins/sdk-runtime) |
| `api.logger` | `PluginLogger` | Logger con ambito (`debug`, `info`, `warn`, `error`) |
| `api.registrationMode` | `PluginRegistrationMode` | Modalità di caricamento corrente; `"setup-runtime"` è la finestra di avvio/configurazione leggera pre-entry completa |
| `api.resolvePath(input)` | `(string) => string` | Risolve un percorso relativo alla root del Plugin |

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
  dal codice di produzione. Instrada gli import interni tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei Plugin inclusi caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file entry pubblici simili) preferiscono l'
istantanea attiva della configurazione runtime quando OpenClaw è già in esecuzione. Se non esiste ancora alcuna
istantanea runtime, usano come fallback il file di configurazione risolto su disco.

I Plugin provider possono esporre un barrel di contratto locale ristretto del Plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso generico dell'SDK. Esempi inclusi:

- **Anthropic**: seam pubblica `api.ts` / `contract-api.ts` per helper di
  stream di beta-header Claude e `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` esporta builder del provider,
  helper del modello predefinito e builder del provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` esporta il builder del provider
  più helper di onboarding/configurazione.

<Warning>
  Il codice di produzione delle estensioni dovrebbe anche evitare import da `openclaw/plugin-sdk/<other-plugin>`.
  Se un helper è davvero condiviso, promuovilo a un sottopercorso neutro dell'SDK
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alle capacità invece di accoppiare due Plugin tra loro.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/it/plugins/sdk-entrypoints">
    Opzioni di `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/it/plugins/sdk-runtime">
    Riferimento completo del namespace `api.runtime`.
  </Card>
  <Card title="Setup e configurazione" icon="sliders" href="/it/plugins/sdk-setup">
    Packaging, manifest e schemi di configurazione.
  </Card>
  <Card title="Testing" icon="vial" href="/it/plugins/sdk-testing">
    Utilità di test e regole lint.
  </Card>
  <Card title="Migrazione SDK" icon="arrows-turn-right" href="/it/plugins/sdk-migration">
    Migrazione da superfici deprecate.
  </Card>
  <Card title="Interni del Plugin" icon="diagram-project" href="/it/plugins/architecture">
    Architettura approfondita e modello di capacità.
  </Card>
</CardGroup>
