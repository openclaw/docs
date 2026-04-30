---
read_when:
    - È necessario chiamare gli helper del core da un Plugin (TTS, STT, generazione di immagini, ricerca web, sottoagente, nodi)
    - Vuoi capire cosa espone api.runtime
    - Stai accedendo agli helper di configurazione, agente o media dal codice del Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- gli helper di runtime iniettati disponibili per i plugin
title: Helper di runtime dei Plugin
x-i18n:
    generated_at: "2026-04-30T09:05:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Riferimento per l'oggetto `api.runtime` iniettato in ogni plugin durante la registrazione. Usa questi helper invece di importare direttamente gli interne dell'host.

<CardGroup cols={2}>
  <Card title="Plugin di canale" href="/it/plugins/sdk-channel-plugins">
    Guida passo passo che usa questi helper nel contesto dei plugin di canale.
  </Card>
  <Card title="Plugin provider" href="/it/plugins/sdk-provider-plugins">
    Guida passo passo che usa questi helper nel contesto dei plugin provider.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Caricamento e scrittura della configurazione

Preferisci la configurazione già passata nel percorso di chiamata attivo, per esempio `api.config` durante la registrazione o un argomento `cfg` nei callback di canale/provider. Questo mantiene una singola istantanea di processo che scorre attraverso il lavoro invece di riesaminare la configurazione nei percorsi critici.

Usa `api.runtime.config.current()` solo quando un handler di lunga durata ha bisogno dell'istantanea corrente del processo e a quella funzione non è stata passata alcuna configurazione. Il valore restituito è di sola lettura; clonalo o usa un helper di mutazione prima di modificarlo.

Le factory degli strumenti ricevono `ctx.runtimeConfig` più `ctx.getRuntimeConfig()`. Usa il getter dentro il callback `execute` di uno strumento di lunga durata quando la configurazione può cambiare dopo la creazione della definizione dello strumento.

Rendi persistenti le modifiche con `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Ogni scrittura deve scegliere una policy `afterWrite` esplicita:

- `afterWrite: { mode: "auto" }` lascia decidere al planner di ricaricamento del gateway.
- `afterWrite: { mode: "restart", reason: "..." }` forza un riavvio pulito quando chi scrive sa che il ricaricamento a caldo non è sicuro.
- `afterWrite: { mode: "none", reason: "..." }` sopprime il ricaricamento/riavvio automatico solo quando il chiamante gestisce il seguito.

Gli helper di mutazione restituiscono `afterWrite` più un riepilogo `followUp` tipizzato, così i chiamanti possono registrare o testare se hanno richiesto un riavvio. Il gateway resta comunque responsabile di quando quel riavvio avviene effettivamente.

`api.runtime.config.loadConfig()` e `api.runtime.config.writeConfigFile(...)` sono helper di compatibilità deprecati sotto `runtime-config-load-write`. Avvisano una volta a runtime e restano disponibili per i vecchi plugin esterni durante la finestra di migrazione. I plugin inclusi non devono usarli; le guardie del confine di configurazione falliscono se il codice del plugin li chiama o importa quegli helper dai sottopercorsi dell'SDK plugin.

Per importazioni SDK dirette, usa i sottopercorsi di configurazione mirati invece del barrel di compatibilità ampio
`openclaw/plugin-sdk/config-runtime`: `config-types` per i
tipi, `plugin-config-runtime` per le asserzioni sulla configurazione già caricata e la ricerca delle voci dei plugin,
`runtime-config-snapshot` per le istantanee del processo corrente, e
`config-mutation` per le scritture. I test dei plugin inclusi dovrebbero mockare direttamente questi sottopercorsi mirati invece di mockare il barrel di compatibilità ampio.

Il codice runtime interno di OpenClaw segue la stessa direzione: caricare la configurazione una volta al confine della CLI, del gateway o del processo, quindi passare quel valore attraverso il flusso. Le scritture di mutazione riuscite aggiornano l'istantanea runtime del processo e avanzano la sua revisione interna; le cache di lunga durata dovrebbero basarsi sulla chiave di cache posseduta dal runtime invece di serializzare localmente la configurazione. I moduli runtime di lunga durata hanno uno scanner a tolleranza zero per chiamate ambientali a `loadConfig()`; usa un `cfg` passato, un `context.getRuntimeConfig()` di richiesta o `getRuntimeConfig()` a un confine di processo esplicito.

I percorsi di esecuzione di provider e canali devono usare l'istantanea della configurazione runtime attiva, non un'istantanea del file restituita per rilettura o modifica della configurazione. Le istantanee dei file preservano i valori sorgente come i marcatori SecretRef per UI e scritture; i callback dei provider hanno bisogno della vista runtime risolta. Quando un helper può essere chiamato con l'istantanea sorgente attiva o con l'istantanea runtime attiva, passa attraverso `selectApplicableRuntimeConfig()` prima di leggere le credenziali.

## Namespace runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identità dell'agente, directory e gestione delle sessioni.

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validate a user-provided thinking level against the active provider profile
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pass level to an embedded run
    }

    // Get agent timeout
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Ensure workspace exists
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Run an embedded agent turn
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` è l'helper neutro per avviare un normale turno agente OpenClaw dal codice del plugin. Usa la stessa risoluzione di provider/modello e selezione dell'harness agente delle risposte attivate dai canali.

    `runEmbeddedPiAgent(...)` resta un alias di compatibilità.

    `resolveThinkingPolicy(...)` restituisce i livelli di ragionamento supportati dal provider/modello e l'eventuale valore predefinito. I plugin provider possiedono il profilo specifico del modello tramite i loro hook di ragionamento, quindi i plugin di strumenti dovrebbero chiamare questo helper runtime invece di importare o duplicare elenchi di provider.

    `normalizeThinkingLevel(...)` converte testo utente come `on`, `x-high` o `extra high` nel livello memorizzato canonico prima di verificarlo rispetto alla policy risolta.

    Gli **helper dell'archivio sessioni** sono sotto `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Costanti predefinite di modello e provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Avvia e gestisci esecuzioni di sottoagenti in background.

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
      deliver: false,
    });

    // Wait for completion
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Read session messages
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Delete a session
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Le sostituzioni del modello (`provider`/`model`) richiedono l'opt-in dell'operatore tramite `plugins.entries.<id>.subagent.allowModelOverride: true` nella configurazione. I plugin non attendibili possono comunque eseguire sottoagenti, ma le richieste di sostituzione vengono rifiutate.
    </Warning>

    `deleteSession(...)` può eliminare sessioni create dallo stesso plugin tramite `api.runtime.subagent.run(...)`. L'eliminazione di sessioni utente o operatore arbitrarie richiede comunque una richiesta Gateway con ambito amministratore.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Elenca i nodi connessi e invoca un comando ospitato da un nodo dal codice plugin caricato dal Gateway o dai comandi CLI del plugin. Usalo quando un plugin possiede lavoro locale su un dispositivo associato, per esempio un bridge browser o audio su un altro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dentro il Gateway questo runtime è in-process. Nei comandi CLI del plugin chiama il Gateway configurato tramite RPC, quindi comandi come `openclaw googlemeet recover-tab` possono ispezionare i nodi associati dal terminale. I comandi dei nodi passano comunque attraverso la normale associazione dei nodi del Gateway, le allowlist dei comandi, le policy node-invoke dei plugin e la gestione dei comandi locale al nodo.

    I plugin che espongono comandi per host nodo pericolosi dovrebbero registrare una policy node-invoke con `api.registerNodeInvokePolicy(...)`. La policy viene eseguita nel Gateway dopo i controlli allowlist dei comandi e prima che il comando venga inoltrato al nodo, quindi le chiamate dirette `node.invoke` e gli strumenti plugin di livello superiore condividono lo stesso percorso di applicazione.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Associa un runtime di flussi di attività a una chiave di sessione OpenClaw esistente o a un contesto di strumento attendibile, quindi crea e gestisci flussi di attività senza passare un proprietario a ogni chiamata.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Review new pull requests",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Review PR #123",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    Usa `bindSession({ sessionKey, requesterOrigin })` quando hai già una chiave di sessione OpenClaw attendibile dal tuo livello di associazione. Non associare da input utente grezzo.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sintesi text-to-speech.

    ```typescript
    // Standard TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telephony-optimized TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // List available voices
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Usa la configurazione core `messages.tts` e la selezione del provider. Restituisce buffer audio PCM + frequenza di campionamento.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analisi di immagini, audio e video.

    ```typescript
    // Describe an image
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribe audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
    });

    // Describe a video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generic file analysis
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    Restituisce `{ text: undefined }` quando non viene prodotto alcun output (ad es. input ignorato).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` rimane un alias di compatibilità per `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Generazione di immagini.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Ricerca web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Utilità multimediali di basso livello.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    Snapshot della configurazione runtime corrente e scritture transazionali della configurazione. Preferisci
    la configurazione già passata nel percorso di chiamata attivo; usa
    `current()` solo quando l'handler deve accedere direttamente allo snapshot del processo.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` e `replaceConfigFile(...)` restituiscono un valore `followUp`,
    ad esempio `{ mode: "restart", requiresRestart: true, reason }`,
    che registra l'intento di scrittura senza sottrarre il controllo del riavvio al
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilità a livello di sistema.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    Sottoscrizioni agli eventi.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Logging.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Risoluzione dell'autenticazione per modello e provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Risoluzione della directory di stato e archiviazione a chiavi basata su SQLite.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Gli store a chiavi sopravvivono ai riavvii e sono isolati dall'id del plugin associato al runtime. Limiti: `maxEntries` per namespace, 1.000 righe attive per plugin, valori JSON sotto 64 KB e scadenza TTL opzionale.

    <Warning>
    Solo plugin inclusi in questa release.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Factory di strumenti di memoria e CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Helper runtime specifici del canale (disponibili quando viene caricato un plugin di canale).

    `api.runtime.channel.mentions` è la superficie condivisa della policy di menzione in ingresso per i plugin di canale inclusi che usano l'iniezione runtime:

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    Helper di menzione disponibili:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` intenzionalmente non espone i vecchi helper di compatibilità `resolveMentionGating*`. Preferisci il percorso normalizzato `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Archiviazione dei riferimenti runtime

Usa `createPluginRuntimeStore` per archiviare il riferimento runtime da usare fuori dal callback `register`:

<Steps>
  <Step title="Crea lo store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Collega all'entry point">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Accedi da altri file">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Preferisci `pluginId` per l'identità del runtime-store. La forma di livello inferiore `key` è per casi non comuni in cui un plugin ha intenzionalmente bisogno di più di uno slot runtime.
</Note>

## Altri campi `api` di primo livello

Oltre a `api.runtime`, l'oggetto API fornisce anche:

<ParamField path="api.id" type="string">
  Id del plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nome visualizzato del plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configurazione specifica del plugin da `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger con ambito (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/configurazione prima dell'entry completa.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Risolve un percorso relativo alla radice del plugin.
</ParamField>

## Correlati

- [Interni del plugin](/it/plugins/architecture) — modello di capacità e registro
- [Entry point SDK](/it/plugins/sdk-entrypoints) — opzioni di `definePluginEntry`
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento dei sottopercorsi
